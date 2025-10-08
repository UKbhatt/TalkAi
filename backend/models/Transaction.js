const mongoose = require('mongoose');

const txnSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    index: true, 
    required: true 
  },
  planId: { 
    type: String, 
    required: true 
  }, 
  credits: { 
    type: Number, 
    required: true 
  }, 
  amount: { 
    type: Number, 
    required: true 
  },
  currency: { 
    type: String, 
    default: 'INR' 
  },
  provider: { 
    type: String, 
    default: 'stripe' 
  },

  sessionId: { 
    type: String, 
    unique: true, 
    sparse: true 
  }, 
  paymentIntentId: { 
    type: String, 
    unique: true, 
    sparse: true 
  },

  status: { 
    type: String, 
    enum: ['created', 'paid', 'failed', 'expired', 'refunded'], 
    default: 'created', 
    index: true 
  },
  pending: { 
    type: Boolean, 
    default: true 
  }, 

  raw: { 
    type: Object 
  } 
}, { timestamps: true });

module.exports = mongoose.model('Transaction', txnSchema);
