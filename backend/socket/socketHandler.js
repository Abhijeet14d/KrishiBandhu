const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const Conversation = require('../models/Conversation.model');
const geminiService = require('../services/gemini.service');

/**
 * Socket.io authentication middleware
 */
const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new Error('User not found'));
    }

    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket auth error:', error.message);
    next(new Error('Invalid token'));
  }
};

/**
 * Initialize Socket.io handlers
 * @param {Object} io - Socket.io server instance
 */
const initializeSocketHandlers = (io) => {
  // Apply authentication middleware
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.user.name} (${socket.id})`);

    // Join user's personal room
    socket.join(`user:${socket.user._id}`);

    // Handle starting a new conversation
    socket.on('conversation:start', async (callback) => {
      try {
        const conversation = await Conversation.create({
          user: socket.user._id,
          messages: []
        });

        // Start Gemini chat session
        geminiService.startChat(conversation._id.toString());

        const welcomeMessage = geminiService.getWelcomeMessage();

        // Add welcome message to conversation
        conversation.messages.push({
          role: 'assistant',
          content: welcomeMessage
        });
        await conversation.save();

        socket.conversationId = conversation._id.toString();
        socket.join(`conversation:${conversation._id}`);

        callback({
          success: true,
          conversationId: conversation._id,
          welcomeMessage
        });

        console.log(`📞 Conversation started: ${conversation._id}`);
      } catch (error) {
        console.error('Start conversation error:', error);
        callback({
          success: false,
          error: 'Failed to start conversation'
        });
      }
    });

    // Handle joining an existing conversation
    socket.on('conversation:join', async ({ conversationId }, callback) => {
      try {
        const conversation = await Conversation.findOne({
          _id: conversationId,
          user: socket.user._id
        });

        if (!conversation) {
          return callback({
            success: false,
            error: 'Conversation not found'
          });
        }

        socket.conversationId = conversationId;
        socket.join(`conversation:${conversationId}`);

        // Restore Gemini chat session if needed
        if (conversation.isActive) {
          geminiService.startChat(conversationId);
        }

        callback({
          success: true,
          conversation: {
            id: conversation._id,
            title: conversation.title,
            messages: conversation.messages,
            isActive: conversation.isActive
          }
        });
      } catch (error) {
        console.error('Join conversation error:', error);
        callback({
          success: false,
          error: 'Failed to join conversation'
        });
      }
    });

    // Handle incoming voice message (transcribed text)
    socket.on('message:send', async ({ conversationId, message }, callback) => {
      console.log(`📩 Received message from ${socket.user.name}:`, { conversationId, message });
      
      let conversation;
      try {
        conversation = await Conversation.findOne({
          _id: conversationId,
          user: socket.user._id
        });

        if (!conversation) {
          console.log('❌ Conversation not found:', conversationId);
          return callback({
            success: false,
            error: 'Conversation not found'
          });
        }

        if (!conversation.isActive) {
          console.log('❌ Conversation has ended:', conversationId);
          return callback({
            success: false,
            error: 'Conversation has ended'
          });
        }

        // Add user message and save immediately
        conversation.messages.push({
          role: 'user',
          content: message
        });

        // Generate title if first user message
        if (conversation.messages.filter(m => m.role === 'user').length === 1) {
          conversation.generateTitle();
        }

        // Save user message first (before AI call)
        await conversation.save();
        console.log('✅ User message saved to database');

        // Emit that we received the message and are processing
        socket.emit('message:processing', { conversationId });
        console.log('🔄 Processing message, calling Gemini AI...');

        // Get AI response
        const aiResponse = await geminiService.sendMessage(conversationId, message);
        console.log('✅ Got AI response, saving to database...');

        // Add AI response to conversation
        conversation.messages.push({
          role: 'assistant',
          content: aiResponse
        });

        await conversation.save();
        console.log('✅ AI response saved, sending response back to client');

        // Send AI response back
        callback({
          success: true,
          response: aiResponse,
          title: conversation.title
        });

        // Also emit to the room (for multi-device sync)
        socket.to(`conversation:${conversationId}`).emit('message:received', {
          conversationId,
          userMessage: message,
          aiResponse,
          title: conversation.title
        });

        console.log(`💬 Message processed for conversation: ${conversationId}`);
      } catch (error) {
        console.error('❌ Message send error:', error.message);
        console.error('Full error:', error);
        
        // Even if AI fails, the user message is already saved
        callback({
          success: false,
          error: error.message || 'Failed to process message',
          title: conversation?.title // Still send title if generated
        });
      }
    });

    // Handle ending conversation
    socket.on('conversation:end', async ({ conversationId }, callback) => {
      try {
        const conversation = await Conversation.findOne({
          _id: conversationId,
          user: socket.user._id
        });

        if (!conversation) {
          return callback({
            success: false,
            error: 'Conversation not found'
          });
        }

        conversation.endConversation();
        await conversation.save();

        // Cleanup Gemini session
        geminiService.endChat(conversationId);

        socket.leave(`conversation:${conversationId}`);
        socket.conversationId = null;

        callback({
          success: true,
          duration: conversation.duration,
          messageCount: conversation.messages.length
        });

        console.log(`📴 Conversation ended: ${conversationId}`);
      } catch (error) {
        console.error('End conversation error:', error);
        callback({
          success: false,
          error: 'Failed to end conversation'
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`🔌 User disconnected: ${socket.user.name} (${socket.id})`);
      
      // Don't auto-end conversation on disconnect (user might reconnect)
      // Just cleanup the socket connection
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.user.name}:`, error);
    });
  });
};

module.exports = { initializeSocketHandlers };
