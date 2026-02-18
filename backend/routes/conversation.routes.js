const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { validate, sendMessageSchema } = require('../middleware/validate.middleware');
const {
  createConversation,
  getConversations,
  getConversation,
  sendMessage,
  endConversation,
  deleteConversation,
  resumeConversation
} = require('../controllers/conversation.controller');

// All routes are protected
router.use(protect);

// Create a new conversation & Get all conversations
router.route('/')
  .post(createConversation)
  .get(getConversations);

// Get, Update, Delete single conversation
router.route('/:id')
  .get(getConversation)
  .delete(deleteConversation);

// Send message to conversation (REST fallback - primary is WebSocket)
router.post('/:id/message', validate(sendMessageSchema), sendMessage);

// Resume an ended conversation
router.post('/:id/resume', resumeConversation);

// End a conversation
router.put('/:id/end', endConversation);

module.exports = router;
