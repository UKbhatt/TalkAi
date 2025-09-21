const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'credit', 'system'],
    default: 'info'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  actionUrl: {
    type: String,
    trim: true
  },
  metadata: {
    source: {
      type: String,
      enum: ['system', 'chat', 'billing', 'security'],
      default: 'system'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }
}, {
  timestamps: true
});

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);
