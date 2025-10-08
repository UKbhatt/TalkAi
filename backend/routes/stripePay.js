const express = require('express');
const stripe = require('../services/stripeClient');
const { get } = require('../services/planCatalog');
const Transaction = require('../models/Transaction');
const CreditLedger = require('../models/CreditLedger');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();


router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = get(planId);
    if (!plan) return res.status(400).json({ message: 'Invalid plan' });

    console.log(`💳 Creating checkout for plan: ${planId}`);
    console.log(`👤 User: ${req.user.email}`);

    console.log(`💳 Using price_data for plan: ${plan.name} - ₹${plan.amount/100}`);
    
    const lineItems = [{
      price_data: {
        currency: 'inr',
        product_data: {
          name: plan.name,
          description: plan.description
        },
        unit_amount: plan.amount,
      },
      quantity: 1,
    }];

    const txn = await Transaction.create({
      userId: req.user._id,
      planId: plan.planId,
      credits: plan.credits,
      amount: plan.amount,
      currency: 'INR',
      status: 'created',
      pending: true,
      provider: 'stripe'
    });

    console.log(`📝 Transaction created successfully`);

    const successUrl = `http://localhost:5173/purchase-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `http://localhost:5173/purchase-credits?canceled=true`;
    
    console.log(`🔗 Success URL: ${successUrl}`);
    console.log(`🔗 Cancel URL: ${cancelUrl}`);
    console.log(`🔗 Frontend Origin: ${process.env.FRONTEND_ORIGIN}`);
    
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      payment_method_types: ['card'],
      billing_address_collection: 'auto',
      client_reference_id: String(req.user._id),
      metadata: {
        userId: String(req.user._id),
        planId: plan.planId,
        credits: String(plan.credits),
        transactionId: String(txn._id)
      },
      locale: 'auto'
    });

    txn.sessionId = session.id;
    await txn.save();

    console.log(`✅ Checkout session created successfully`);
    console.log(`💰 Session amount total: ${session.amount_total}`);
    console.log(`💳 Session payment status: ${session.payment_status}`);
    console.log(`🎯 Session mode: ${session.mode}`);

    res.json({ sessionId: session.id, url: session.url });
  } catch (e) {
    console.error('❌ Create checkout session error:', e);
    res.status(500).json({ message: 'Failed to create checkout session' });
  }
});


router.get('/verify-session/:sessionId', async (req, res) => {
  console.log('🎯 VERIFY-SESSION ENDPOINT HIT!');
  try {
    const { sessionId } = req.params;

    console.log('🎯 VERIFY SESSION ENDPOINT CALLED');

    console.log(`🔍 Retrieving session from Stripe...`);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log(`💳 Session payment status: ${session.payment_status}`);
    console.log(`💳 Session metadata received`);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        message: 'Payment not completed',
        code: 'PAYMENT_NOT_COMPLETED',
      });
    }

    const { userId, transactionId } = session.metadata || {};
    if (!userId || !transactionId) {
      return res.status(400).json({
        message: 'Missing metadata (userId/transactionId)',
        code: 'MISSING_METADATA',
      });
    }

    const txn = await Transaction.findById(transactionId);
    if (!txn) {
      return res.status(404).json({
        message: 'Transaction not found',
        code: 'TRANSACTION_NOT_FOUND',
      });
    }

    if (txn.status === 'paid') {
      console.log(`⚠️ Transaction already processed: ${transactionId}`);
      const user = await User.findById(userId);
      return res.json({
        message: 'Payment already processed',
        alreadyProcessed: true,
        transaction: {
          id: txn._id,
          status: txn.status,
        },
        user: { credits: user?.credits ?? 0 },
      });
    }

    const userBefore = await User.findById(userId);
    if (!userBefore) {
      return res.status(404).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    const previousCredits = Number(userBefore.credits || 0);
    const creditsToAdd = 500; // ← your fixed increment

    txn.status = 'paid';
    txn.pending = false;
    txn.paymentIntentId = session.payment_intent || txn.paymentIntentId;
    await txn.save();
    console.log(`💾 Transaction marked as paid: ${txn._id}`);

    try {
      await CreditLedger.create({
        userId,
        delta: creditsToAdd,
        reason: 'purchase',
        refType: 'transaction',
        refId: txn._id,
      });
      console.log('📝 Ledger entry created');
    } catch (ledgerErr) {
      if (ledgerErr?.code === 11000) {
        console.log('⚠️ Ledger entry already exists (idempotency)');
      } else {
        throw ledgerErr;
      }
    }

    console.log(`💾 Attempting to update user credits: +${creditsToAdd}`);
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          credits: creditsToAdd,
          totalPurchased: creditsToAdd,
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      console.error(`❌ Failed to update user - user not found after update`);
      return res.status(500).json({
        message: 'Failed to update user credits',
        code: 'USER_UPDATE_FAILED'
      });
    }

    const newCredits = Number(updatedUser.credits || 0);
    console.log(`✅ Database update successful: user now has ${newCredits} credits`);

    console.log('💰 CREDIT UPDATE SUCCESSFUL:');
    console.log(`📊 Previous Credits: ${previousCredits}`);
    console.log(`➕ Credits Added: +${creditsToAdd}`);
    console.log(`✨ New Credits: ${newCredits}`);

    return res.json({
      message: 'Payment verified and credits added successfully (+500)',
      transaction: {
        id: txn._id,
        status: txn.status,
        createdAt: txn.createdAt,
      },
      user: {
        previousCredits,
        creditsAdded: creditsToAdd,
        credits: newCredits,
        totalPurchased: updatedUser.totalPurchased,
      },
    });
  } catch (error) {
    console.error('❌ Verify session error:', error);
    return res.status(500).json({
      message: 'Failed to verify payment',
      code: 'VERIFY_PAYMENT_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

module.exports = router;

