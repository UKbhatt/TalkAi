const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    index: true, 
    required: true 
  },
  delta: { 
    type: Number, 
    required: true 
  }, 
  reason: { 
    type: String, 
    enum: ['purchase', 'message', 'rollback'], 
    required: true 
  },
  refType: { 
    type: String, 
    enum: ['transaction'], 
    required: true 
  },
  refId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  } 
}, { timestamps: true });

ledgerSchema.index({ refType: 1, refId: 1 }, { unique: true });

module.exports = mongoose.model('CreditLedger', ledgerSchema);
