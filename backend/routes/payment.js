const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const CreditLedger = require('../models/CreditLedger');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();


const CREDIT_PLANS = {
  starter: {
    name: 'Starter Pack',
    credits: 500,
    price: 499, 
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
    description: '500 credits for casual users'
  },
  pro: {
    name: 'Pro Pack',
    credits: 2000,
    price: 1499,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    description: '2000 credits - Best value!',
    popular: true
  },
  ultimate: {
    name: 'Ultimate Pack',
    credits: 5000,
    price: 2999, 
    priceId: process.env.STRIPE_ULTIMATE_PRICE_ID,
    description: '5000 credits for power users'
  }
};

router.get('/plans', (req, res) => {
  try {
    const plans = Object.entries(CREDIT_PLANS).map(([key, value]) => ({
      id: key,
      ...value,
      priceFormatted: `$${(value.price / 100).toFixed(2)}`
    }));

    res.json({ plans });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      message: 'Failed to fetch plans',
      code: 'FETCH_PLANS_ERROR'
    });
  }
});


router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { planId } = req.body;

    if (!planId || !CREDIT_PLANS[planId]) {
      return res.status(400).json({
        message: 'Invalid plan selected',
        code: 'INVALID_PLAN'
      });
    }

    const plan = CREDIT_PLANS[planId];
    const user = req.user;

    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user._id.toString(),
          username: user.username
        }
      });
      customerId = customer.id;
      
      await User.findByIdAndUpdate(user._id, {
        stripeCustomerId: customerId
      });
    }

    const transaction = new Transaction({
      userId: user._id,
      planId: planId,
      credits: plan.credits,
      amount: plan.price / 100, 
      currency: 'usd',
      status: 'created',
      pending: true
    });

    await transaction.save();

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: user._id.toString(),
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: plan.description
            },
            unit_amount: plan.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_ORIGIN}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_ORIGIN}/purchase-credits?canceled=true`,
      metadata: {
        userId: user._id.toString(),
        planId: planId,
        credits: plan.credits.toString(),
        transactionId: transaction._id.toString()
      }
    });

    transaction.sessionId = session.id;
    await transaction.save();

    res.json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({
      message: 'Failed to create checkout session',
      code: 'CHECKOUT_SESSION_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/verify-session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const transaction = await Transaction.findOne({ sessionId });
    if (!transaction) {
      return res.status(404).json({
        message: 'Transaction not found',
        code: 'TRANSACTION_NOT_FOUND'
      });
    }

    const user = await User.findById(transaction.userId);

    res.json({
      message: 'Payment status retrieved',
      transaction: {
        id: transaction._id,
        planId: transaction.planId,
        credits: transaction.credits,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        pending: transaction.pending,
        createdAt: transaction.createdAt
      },
      user: {
        credits: user.credits
      }
    });

  } catch (error) {
    console.error('Verify session error:', error);
    res.status(500).json({
      message: 'Failed to verify payment',
      code: 'VERIFY_PAYMENT_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const transactions = await Transaction.find({
      userId: req.user._id,
      status: 'paid'
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments({
      userId: req.user._id,
      status: 'paid'
    });

    res.json({
      transactions: transactions.map(t => ({
        id: t._id,
        planId: t.planId,
        credits: t.credits,
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        createdAt: t.createdAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({
      message: 'Failed to fetch transaction history',
      code: 'FETCH_HISTORY_ERROR'
    });
  }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`🎯 Processing webhook event: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object);
      break;

    case 'checkout.session.expired':
      await handleCheckoutSessionExpired(event.data.object);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(event.data.object);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

async function handleCheckoutSessionCompleted(session) {
  console.log(`🎯 Webhook received: checkout.session.completed for session: ${session.id}`);
  console.log(`💳 Payment Status: ${session.payment_status}`);
  
  try {
    const userId = session.metadata.userId;
    const planId = session.metadata.planId;
    const credits = parseInt(session.metadata.credits);

    console.log(`👤 User ID: ${userId}`);
    console.log(`📦 Plan ID: ${planId}`);
    console.log(`💰 Credits to add: ${credits}`);

    const user = await User.findById(userId);
    if (!user) {
      console.error(`❌ User not found: ${userId}`);
      return;
    }

    console.log(`👤 Found user: ${user.email}`);
    console.log(`💳 Current credits: ${user.credits}`);

    const transaction = await Transaction.findOne({ sessionId: session.id });
    if (!transaction) {
      console.error(`❌ Transaction not found for session: ${session.id}`);
      return;
    }

    if (transaction.status === 'paid') {
      console.log(`⚠️ Transaction ${transaction._id} already processed - skipping`);
      return;
    }

    console.log(`✅ Payment successful! Updating credits now...`);

    transaction.status = 'paid';
    transaction.pending = false;
    transaction.metadata.stripePaymentIntentId = session.payment_intent;
    transaction.metadata.customerEmail = session.customer_details?.email;
    transaction.metadata.customerName = session.customer_details?.name;
    await transaction.save();

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          credits: credits,
          totalPurchased: credits
        }
      },
      { new: true }
    );

    const ledgerEntry = new CreditLedger({
      userId: userId,
      delta: credits,
      reason: 'purchase',
      refType: 'transaction',
      refId: transaction._id,
      description: `Purchased ${planId} pack - ${credits} credits`
    });
    await ledgerEntry.save();

    console.log(`🎉 SUCCESS! Credits updated: ${user.credits} → ${updatedUser.credits} (+${credits})`);
    console.log(`📝 Ledger entry created: ${ledgerEntry._id}`);
    console.log(`💾 Transaction marked as paid: ${transaction._id}`);

  } catch (error) {
    console.error(`❌ Error processing checkout.session.completed:`, error);
    console.error(error.stack);
  }
}

async function handleCheckoutSessionExpired(session) {
  console.log(`🎯 Processing checkout.session.expired for session: ${session.id}`);
  
  try {
    await Transaction.updateOne(
      { sessionId: session.id },
      { status: 'expired', pending: false }
    );
    console.log(`✅ Transaction marked as expired: ${session.id}`);
  } catch (error) {
    console.error(`❌ Error processing checkout.session.expired:`, error);
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  console.log(`🎯 Processing payment_intent.payment_failed for PaymentIntent: ${paymentIntent.id}`);
  
  try {
    await Transaction.updateOne(
      { 'metadata.stripePaymentIntentId': paymentIntent.id },
      { status: 'failed', pending: false }
    );
    console.log(`✅ Transaction marked as failed: ${paymentIntent.id}`);
  } catch (error) {
    console.error(`❌ Error processing payment_intent.payment_failed:`, error);
  }
}

module.exports = router;

