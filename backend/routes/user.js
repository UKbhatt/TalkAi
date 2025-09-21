const express = require('express');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { body, validationResult } = require('express-validator');

const router = express.Router();

router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        credits: user.credits,
        plan: user.plan,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      message: 'Failed to fetch profile',
      code: 'FETCH_PROFILE_ERROR'
    });
  }
});

router.put('/profile', [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Theme must be either light or dark'),
  
  body('preferences.notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean value'),
  
  body('preferences.notifications.push')
    .optional()
    .isBoolean()
    .withMessage('Push notifications must be a boolean value')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, preferences } = req.body;
    const updateData = {};

    if (username) {
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: req.user._id } 
      });
      
      if (existingUser) {
        return res.status(409).json({
          message: 'Username already taken',
          code: 'USERNAME_TAKEN'
        });
      }
      
      updateData.username = username;
    }

    if (preferences) {
      updateData.preferences = {
        ...req.user.preferences,
        ...preferences
      };
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        credits: user.credits,
        plan: user.plan,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      message: 'Failed to update profile',
      code: 'UPDATE_PROFILE_ERROR'
    });
  }
});

router.get('/notifications', async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const filter = { userId: req.user._id };
    if (unreadOnly === 'true') {
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ 
      userId: req.user._id, 
      isRead: false 
    });

    res.json({
      notifications: notifications.map(notif => ({
        id: notif._id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        isRead: notif.isRead,
        readAt: notif.readAt,
        actionUrl: notif.actionUrl,
        metadata: notif.metadata,
        createdAt: notif.createdAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        unreadCount
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      message: 'Failed to fetch notifications',
      code: 'FETCH_NOTIFICATIONS_ERROR'
    });
  }
});

router.put('/notifications/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        message: 'Notification not found',
        code: 'NOTIFICATION_NOT_FOUND'
      });
    }

    res.json({
      message: 'Notification marked as read',
      notification: {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        readAt: notification.readAt,
        createdAt: notification.createdAt
      }
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      message: 'Failed to mark notification as read',
      code: 'MARK_NOTIFICATION_READ_ERROR'
    });
  }
});

router.put('/notifications/read-all', async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      message: 'Failed to mark all notifications as read',
      code: 'MARK_ALL_NOTIFICATIONS_READ_ERROR'
    });
  }
});

router.delete('/notifications/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        message: 'Notification not found',
        code: 'NOTIFICATION_NOT_FOUND'
      });
    }

    res.json({
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      message: 'Failed to delete notification',
      code: 'DELETE_NOTIFICATION_ERROR'
    });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const Conversation = require('../models/Conversation');
    const Message = require('../models/Message');

    const [conversationCount, messageCount, unreadNotifications] = await Promise.all([
      Conversation.countDocuments({ userId: req.user._id, isActive: true }),
      Message.countDocuments({ userId: req.user._id }),
      Notification.countDocuments({ userId: req.user._id, isRead: false })
    ]);

    res.json({
      stats: {
        conversations: conversationCount,
        messages: messageCount,
        unreadNotifications,
        credits: req.user.credits,
        plan: req.user.plan
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      message: 'Failed to fetch stats',
      code: 'FETCH_STATS_ERROR'
    });
  }
});

module.exports = router;
