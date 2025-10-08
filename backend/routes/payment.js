const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Payment = require('../models/Payment');

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


router.post('/create-checkout-session', async (req, res) => {
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

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: plan.description,
              metadata: {
                credits: plan.credits.toString(),
                planId: planId
              }
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
        credits: plan.credits.toString()
      }
    });

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

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        message: 'Payment not completed',
        code: 'PAYMENT_NOT_COMPLETED'
      });
    }

    const userId = session.metadata.userId;
    const planId = session.metadata.planId;
    const credits = parseInt(session.metadata.credits);

    const existingPayment = await Payment.findOne({
      stripeSessionId: sessionId,
      status: 'completed'
    });

    if (existingPayment) {
      return res.json({
        message: 'Payment already processed',
        payment: existingPayment,
        alreadyProcessed: true
      });
    }

    const payment = new Payment({
      userId: userId,
      stripePaymentIntentId: session.payment_intent,
      stripeSessionId: sessionId,
      amount: session.amount_total / 100, 
      currency: session.currency,
      credits: credits,
      plan: planId,
      status: 'completed',
      metadata: {
        customerEmail: session.customer_details.email,
        customerName: session.customer_details.name,
        paymentMethod: 'card'
      }
    });

    await payment.save();

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          credits: credits,
          totalPurchased: credits
        }
      },
      { new: true }
    );

    res.json({
      message: 'Payment verified and credits added',
      payment: {
        id: payment._id,
        credits: payment.credits,
        amount: payment.amount,
        plan: payment.plan,
        createdAt: payment.createdAt
      },
      user: {
        credits: user.credits,
        totalPurchased: user.totalPurchased
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

router.get('/history', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const payments = await Payment.find({
      userId: req.user._id,
      status: 'completed'
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments({
      userId: req.user._id,
      status: 'completed'
    });

    res.json({
      payments: payments.map(p => ({
        id: p._id,
        plan: p.plan,
        credits: p.credits,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        createdAt: p.createdAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      message: 'Failed to fetch payment history',
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

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Checkout session completed:', session.id);
      break;

    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent succeeded:', paymentIntent.id);
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      
      await Payment.updateOne(
        { stripePaymentIntentId: failedPayment.id },
        { status: 'failed' }
      );
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = router;

