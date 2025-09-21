const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Conversation title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    model: {
      type: String,
      enum: ['gpt-3.5-turbo', 'gpt-4', 'claude-3-sonnet', 'claude-3-haiku'],
      default: 'gpt-3.5-turbo'
    },
    temperature: {
      type: Number,
      min: 0,
      max: 2,
      default: 0.7
    },
    maxTokens: {
      type: Number,
      min: 1,
      max: 4000,
      default: 1000
    }
  },
  metadata: {
    messageCount: {
      type: Number,
      default: 0
    },
    totalTokens: {
      type: Number,
      default: 0
    },
    lastMessageAt: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

conversationSchema.index({ userId: 1, createdAt: -1 });
conversationSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
