const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  stripePaymentIntentId: {
    type: String,
    required: true,
    unique: true
  },
  stripeSessionId: {
    type: String,
    sparse: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  currency: {
    type: String,
    default: 'usd',
    uppercase: true
  },
  credits: {
    type: Number,
    required: [true, 'Credits amount is required'],
    min: 0
  },
  plan: {
    type: String,
    enum: ['starter', 'pro', 'ultimate'],
    required: [true, 'Plan is required']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  metadata: {
    customerEmail: String,
    customerName: String,
    paymentMethod: String
  }
}, {
  timestamps: true
});

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ stripePaymentIntentId: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);

