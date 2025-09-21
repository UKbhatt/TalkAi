const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: [true, 'Conversation ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [10000, 'Message content cannot exceed 10000 characters']
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: [true, 'Message role is required']
  },
  metadata: {
    tokens: {
      type: Number,
      default: 0
    },
    model: {
      type: String,
      default: 'gpt-3.5-turbo'
    },
    temperature: {
      type: Number,
      default: 0.7
    },
    processingTime: {
      type: Number, // in ms
      default: 0
    }
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  parentMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }
}, {
  timestamps: true
});

messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
