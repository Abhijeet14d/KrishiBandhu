const Conversation = require('../models/Conversation.model');
const geminiService = require('../services/gemini.service');

// @desc    Create a new conversation
// @route   POST /api/conversations
// @access  Private
const createConversation = async (req, res) => {
  try {
    const conversation = await Conversation.create({
      user: req.user._id,
      messages: []
    });

    res.status(201).json({
      success: true,
      message: 'Conversation created',
      conversation: {
        id: conversation._id,
        title: conversation.title,
        startedAt: conversation.startedAt,
        welcomeMessage: geminiService.getWelcomeMessage()
      }
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating conversation'
    });
  }
};

// @desc    Get all conversations for a user
// @route   GET /api/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ user: req.user._id })
      .select('title startedAt endedAt duration isActive createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: conversations.length,
      conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversations'
    });
  }
};

// @desc    Get a single conversation with messages
// @route   GET /api/conversations/:id
// @access  Private
const getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    res.status(200).json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversation'
    });
  }
};

// @desc    Send a message in a conversation (REST fallback)
// @route   POST /api/conversations/:id/message
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const conversationId = req.params.id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      user: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (!conversation.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Conversation has ended'
      });
    }

    // Add user message
    conversation.messages.push({
      role: 'user',
      content: message
    });

    // Get AI response
    const aiResponse = await geminiService.sendMessage(conversationId, message);

    // Add AI response
    conversation.messages.push({
      role: 'assistant',
      content: aiResponse
    });

    // Generate title if first message
    if (conversation.messages.filter(m => m.role === 'user').length === 1) {
      conversation.generateTitle();
    }

    await conversation.save();

    res.status(200).json({
      success: true,
      response: aiResponse,
      conversation: {
        id: conversation._id,
        title: conversation.title,
        messageCount: conversation.messages.length
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message'
    });
  }
};

// @desc    End a conversation
// @route   PUT /api/conversations/:id/end
// @access  Private
const endConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    conversation.endConversation();
    await conversation.save();

    // Cleanup Gemini chat session
    geminiService.endChat(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Conversation ended',
      conversation: {
        id: conversation._id,
        title: conversation.title,
        duration: conversation.duration,
        messageCount: conversation.messages.length
      }
    });
  } catch (error) {
    console.error('End conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error ending conversation'
    });
  }
};

// @desc    Delete a conversation
// @route   DELETE /api/conversations/:id
// @access  Private
const deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Cleanup Gemini chat session if exists
    geminiService.endChat(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Conversation deleted'
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting conversation'
    });
  }
};

module.exports = {
  createConversation,
  getConversations,
  getConversation,
  sendMessage,
  endConversation,
  deleteConversation
};
