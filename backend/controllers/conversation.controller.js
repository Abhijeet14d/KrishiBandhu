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

    // Initialize Gemini chat and set user context
    geminiService.startChat(conversation._id.toString());

    const user = req.user;
    if (user?.location?.state) {
      geminiService.setUserLocation(conversation._id.toString(), {
        state: user.location.state,
        district: user.location.district,
        city: user.location.city,
        village: user.location.village,
        lat: user.location.coordinates?.lat,
        lon: user.location.coordinates?.lon
      });
    }
    if (user?.farmingProfile) {
      geminiService.setFarmingProfile(conversation._id.toString(), {
        landSize: user.farmingProfile.landSize,
        primaryCrops: user.farmingProfile.primaryCrops || [],
        irrigationType: user.farmingProfile.irrigationType,
        soilType: user.farmingProfile.soilType
      });
    }

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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const query = { user: req.user._id };
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const [conversations, total] = await Promise.all([
      Conversation.find(query)
        .select('title startedAt endedAt duration isActive mode createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Conversation.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: conversations.length,
      total,
      page,
      pages: Math.ceil(total / limit),
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

    // Get user location for context-aware response
    const user = req.user;
    const userLocation = user?.location?.state ? {
      state: user.location.state,
      district: user.location.district,
      city: user.location.city,
      village: user.location.village,
      lat: user.location.coordinates?.lat,
      lon: user.location.coordinates?.lon
    } : null;

    // Set farming profile context if available
    if (user?.farmingProfile) {
      geminiService.setFarmingProfile(conversationId, {
        landSize: user.farmingProfile.landSize,
        primaryCrops: user.farmingProfile.primaryCrops || [],
        irrigationType: user.farmingProfile.irrigationType,
        soilType: user.farmingProfile.soilType
      });
    }

    // Get AI response with location context
    const aiResponse = await geminiService.sendMessage(conversationId, message, userLocation);

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

// @desc    Resume an ended conversation (continue chat as text)
// @route   POST /api/conversations/:id/resume
// @access  Private
const resumeConversation = async (req, res) => {
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

    // Reactivate the conversation
    conversation.isActive = true;
    conversation.mode = 'continued';
    conversation.endedAt = undefined;

    // Restart Gemini chat session with existing history
    const history = conversation.messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));
    geminiService.startChat(conversation._id.toString(), history);

    // Set user location
    const user = req.user;
    if (user?.location?.state) {
      geminiService.setUserLocation(conversation._id.toString(), {
        state: user.location.state,
        district: user.location.district,
        city: user.location.city,
        village: user.location.village,
        lat: user.location.coordinates?.lat,
        lon: user.location.coordinates?.lon
      });
    }

    // Set farming profile for personalized responses
    if (user?.farmingProfile) {
      geminiService.setFarmingProfile(conversation._id.toString(), {
        landSize: user.farmingProfile.landSize,
        primaryCrops: user.farmingProfile.primaryCrops || [],
        irrigationType: user.farmingProfile.irrigationType,
        soilType: user.farmingProfile.soilType
      });
    }

    // Add a system continuation message
    const continuationMsg = "I'm back! You can continue our previous conversation. How can I help you further?";
    conversation.messages.push({
      role: 'assistant',
      content: continuationMsg
    });

    await conversation.save();

    res.status(200).json({
      success: true,
      message: 'Conversation resumed',
      conversation: {
        id: conversation._id,
        title: conversation.title,
        messages: conversation.messages,
        mode: conversation.mode,
        isActive: conversation.isActive
      }
    });
  } catch (error) {
    console.error('Resume conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resuming conversation'
    });
  }
};

module.exports = {
  createConversation,
  getConversations,
  getConversation,
  sendMessage,
  endConversation,
  deleteConversation,
  resumeConversation
};
