const express = require('express');
const stripe = require('../services/stripeClient');
const Transaction = require('../models/Transaction');
const CreditLedger = require('../models/CreditLedger');
const User = require('../models/User');

const router = express.Router();


router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`🎯 Webhook received: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;

    case 'checkout.session.expired':
      await handleCheckoutExpired(event.data.object);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

async function handleCheckoutCompleted(session) {
  console.log(`✅ Checkout completed: ${session.id}`);
  console.log(`💳 Payment status: ${session.payment_status}`);

  try {
    const { userId, planId, credits, transactionId } = session.metadata;

    if (!userId || !planId || !credits || !transactionId) {
      console.error('❌ Missing metadata in session:', session.metadata);
      return;
    }

    console.log(`👤 User ID: ${userId}`);
    console.log(`📦 Plan ID: ${planId}`);
    console.log(`💰 Credits: ${credits}`);
    console.log(`📝 Transaction ID: ${transactionId}`);

    const txn = await Transaction.findById(transactionId);
    if (!txn) {
      console.error(`❌ Transaction not found: ${transactionId}`);
      return;
    }

    if (txn.status === 'paid') {
      console.log(`⚠️ Transaction already processed: ${transactionId}`);
      return;
    }

    txn.status = 'paid';
    txn.pending = false; 
    txn.paymentIntentId = session.payment_intent;
    txn.raw = { session }; 
    await txn.save();

    console.log(`💾 Transaction updated to paid: ${txn._id}`);

    try {
      const ledger = await CreditLedger.create({
        userId: userId,
        delta: parseInt(credits),
        reason: 'purchase',
        refType: 'transaction',
        refId: txn._id
      });
      console.log(`📝 Ledger entry created: ${ledger._id}`);
    } catch (ledgerErr) {
      if (ledgerErr.code === 11000) {
        console.log(`⚠️ Ledger entry already exists for transaction: ${txn._id}`);
        return;
      }
      throw ledgerErr;
    }

    const userBefore = await User.findById(userId);
    const previousCredits = userBefore.credits;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          credits: parseInt(credits),
          totalPurchased: parseInt(credits)
        }
      },
      { new: true }
    );

    console.log('');
    console.log('💰 CREDIT UPDATE:');
    console.log('==================');
    console.log(`👤 User: ${user.email}`);
    console.log(`📊 Previous Credits: ${previousCredits}`);
    console.log(`➕ Credits Added: +${credits}`);
    console.log(`✨ New Credits: ${user.credits}`);
    console.log(`📈 Total Purchased: ${user.totalPurchased}`);
    console.log('==================');
    console.log('');

  } catch (error) {
    console.error('❌ Error processing checkout.session.completed:', error);
    console.error(error.stack);
  }
}

async function handleCheckoutExpired(session) {
  console.log(`⏰ Checkout expired: ${session.id}`);

  try {
    const txn = await Transaction.findOne({ sessionId: session.id });
    if (txn && txn.status === 'created') {
      txn.status = 'expired';
      txn.pending = false;
      await txn.save();
      console.log(`💾 Transaction marked as expired: ${txn._id}`);
    }
  } catch (error) {
    console.error('❌ Error processing checkout.session.expired:', error);
  }
}

async function handlePaymentFailed(paymentIntent) {
  console.log(`❌ Payment failed: ${paymentIntent.id}`);

  try {
    const txn = await Transaction.findOne({ paymentIntentId: paymentIntent.id });
    if (txn && txn.status !== 'paid') {
      txn.status = 'failed';
      txn.pending = false; 
      await txn.save();
      console.log(`💾 Transaction marked as failed: ${txn._id}`);
    }
  } catch (error) {
    console.error('❌ Error processing payment_intent.payment_failed:', error);
  }
}

module.exports = router;

