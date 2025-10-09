const express = require('express');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { validateMessage, validateConversation } = require('../middleware/validation');

const router = express.Router();

router.get('/conversations', async (req, res) => {
  try {
    const conversations = await Conversation.find({ 
      userId: req.user._id, 
      isActive: true 
    })
    .sort({ updatedAt: -1 })
    .limit(50);

    res.json({
      conversations: conversations.map(conv => ({
        id: conv._id,
        title: conv.title,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        messageCount: conv.metadata.messageCount,
        lastMessageAt: conv.metadata.lastMessageAt
      }))
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      message: 'Failed to fetch conversations',
      code: 'FETCH_CONVERSATIONS_ERROR'
    });
  }
});

router.post('/conversations', validateConversation, async (req, res) => {
  try {
    const { title } = req.body;

    const conversation = new Conversation({
      title,
      userId: req.user._id
    });

    await conversation.save();

    res.status(201).json({
      message: 'Conversation created successfully',
      conversation: {
        id: conversation._id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messageCount: conversation.metadata.messageCount
      }
    });

  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({
      message: 'Failed to create conversation',
      code: 'CREATE_CONVERSATION_ERROR'
    });
  }
});

router.get('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.user._id,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({
        message: 'Conversation not found',
        code: 'CONVERSATION_NOT_FOUND'
      });
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({
      messages: messages.map(msg => ({
        id: msg._id,
        content: msg.content,
        role: msg.role,
        createdAt: msg.createdAt,
        isEdited: msg.isEdited,
        editedAt: msg.editedAt,
        metadata: msg.metadata
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await Message.countDocuments({ conversationId })
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      message: 'Failed to fetch messages',
      code: 'FETCH_MESSAGES_ERROR'
    });
  }
});

router.post('/conversations/:conversationId/messages-user', validateMessage, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;

    if (req.user.credits < 1) {
      return res.status(402).json({
        message: 'Insufficient credits',
        code: 'INSUFFICIENT_CREDITS'
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.user._id,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({
        message: 'Conversation not found',
        code: 'CONVERSATION_NOT_FOUND'
      });
    }

    const previousCredits = req.user.credits;
    
    const creditUpdateResult = await User.findByIdAndUpdate(
      req.user._id, 
      { $inc: { credits: -1 } },
      { new: true }
    ).select('credits');
    
    if (!creditUpdateResult) {
      console.error('❌ Failed to update user credits');
      return res.status(500).json({
        message: 'Failed to deduct credits',
        code: 'CREDIT_UPDATE_FAILED'
      });
    }
    
    console.log(`💳 Credit deduction successful: ${previousCredits} → ${creditUpdateResult.credits} (-1)`);

    // THEN: Save the user message
    let userMessage;
    try {
      userMessage = new Message({
        conversationId,
        userId: req.user._id,
        content,
        role: 'user'
      });

      await userMessage.save();

      conversation.metadata.messageCount += 1;
      conversation.metadata.lastMessageAt = new Date();
      await conversation.save();
      
    } catch (saveError) {
      console.error('❌ Failed to save message, rolling back credits');
      
      await User.findByIdAndUpdate(
        req.user._id, 
        { $inc: { credits: 1 } }
      );
      
      console.log(`💳 Credit rollback: ${creditUpdateResult.credits} → ${creditUpdateResult.credits + 1} (+1)`);
      
      throw saveError;
    }

    res.json({
      message: {
        id: userMessage._id,
        content: userMessage.content,
        role: userMessage.role,
        createdAt: userMessage.createdAt
      },
      credits: creditUpdateResult.credits
    });

  } catch (error) {
    console.error('Save user message error:', error);
    res.status(500).json({
      message: 'Failed to save message',
      code: 'SAVE_MESSAGE_ERROR'
    });
  }
});

router.post('/conversations/:conversationId/messages-ai', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.user._id,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({
        message: 'Conversation not found',
        code: 'CONVERSATION_NOT_FOUND'
      });
    }

    const aiMessage = new Message({
      conversationId,
      userId: req.user._id,
      content,
      role: 'assistant'
    });

    await aiMessage.save();

    conversation.metadata.messageCount += 1;
    conversation.metadata.lastMessageAt = new Date();
    await conversation.save();

    res.json({
      message: {
        id: aiMessage._id,
        content: aiMessage.content,
        role: aiMessage.role,
        createdAt: aiMessage.createdAt
      }
    });

  } catch (error) {
    console.error('Save AI message error:', error);
    res.status(500).json({
      message: 'Failed to save AI message',
      code: 'SAVE_AI_MESSAGE_ERROR'
    });
  }
});

router.post('/conversations/:conversationId/messages', validateMessage, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;

    if (req.user.credits < 1) {
      return res.status(402).json({
        message: 'Insufficient credits',
        code: 'INSUFFICIENT_CREDITS'
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.user._id,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({
        message: 'Conversation not found',
        code: 'CONVERSATION_NOT_FOUND'
      });
    }

    const userMessage = new Message({
      conversationId,
      userId: req.user._id,
      content,
      role: 'user'
    });

    await userMessage.save();

    conversation.metadata.messageCount += 1;
    conversation.metadata.lastMessageAt = new Date();
    await conversation.save();

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { credits: -1 }
    });


    const aiMessage = new Message({
      conversationId,
      userId: req.user._id,
      content: aiResponse.content,
      role: 'assistant',
      metadata: {
        tokens: aiResponse.tokens,
        model: conversation.settings.model,
        temperature: conversation.settings.temperature,
        processingTime: aiResponse.processingTime
      }
    });

    await aiMessage.save();

    conversation.metadata.messageCount += 1;
    conversation.metadata.totalTokens += aiResponse.tokens;
    conversation.metadata.lastMessageAt = new Date();
    await conversation.save();

    const updatedUser = await User.findById(req.user._id).select('credits');

    res.json({
      message: 'Message sent successfully',
      userMessage: {
        id: userMessage._id,
        content: userMessage.content,
        role: userMessage.role,
        createdAt: userMessage.createdAt
      },
      aiMessage: {
        id: aiMessage._id,
        content: aiMessage.content,
        role: aiMessage.role,
        createdAt: aiMessage.createdAt,
        metadata: aiMessage.metadata
      },
      credits: updatedUser.credits
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      message: 'Failed to send message',
      code: 'SEND_MESSAGE_ERROR'
    });
  }
});

router.put('/conversations/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { title } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        message: 'Title is required',
        code: 'INVALID_TITLE'
      });
    }

    const conversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, userId: req.user._id, isActive: true },
      { title: title.trim(), updatedAt: new Date() },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({
        message: 'Conversation not found',
        code: 'CONVERSATION_NOT_FOUND'
      });
    }

    res.json({
      message: 'Conversation updated successfully',
      conversation: {
        id: conversation._id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messageCount: conversation.metadata.messageCount
      }
    });

  } catch (error) {
    console.error('Update conversation error:', error);
    res.status(500).json({
      message: 'Failed to update conversation',
      code: 'UPDATE_CONVERSATION_ERROR'
    });
  }
});

router.delete('/conversations/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, userId: req.user._id },
      { isActive: false },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({
        message: 'Conversation not found',
        code: 'CONVERSATION_NOT_FOUND'
      });
    }

    res.json({
      message: 'Conversation deleted successfully'
    });

  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      message: 'Failed to delete conversation',
      code: 'DELETE_CONVERSATION_ERROR'
    });
  }
});

async function generateAIResponse(userMessage, conversationId) {
  const startTime = Date.now();
  
  try {
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(20); 
      
      const processingTime = Date.now() - startTime;
    
    const responses = [
    "That's an interesting question! Let me help you with that.",
      "I understand what you're asking. Here's my perspective on this topic.",
      "Great question! This is a complex topic that requires careful consideration.",
      "I'd be happy to help you explore this further. Let me break it down for you.",
      "That's a thoughtful inquiry. Here's what I think about this subject."
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    const tokens = Math.floor(Math.random() * 100) + 50;

    return {
      content: randomResponse,
      tokens,
      processingTime: Math.round(processingTime)
    };
  } catch (error) {
    console.error('AI response generation error:', error);
    throw error;
  }
}

module.exports = router;