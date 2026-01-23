const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const conversationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'New Conversation'
  },
  messages: [messageSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  duration: {
    type: Number, // Duration in seconds
    default: 0
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Generate title from first user message
conversationSchema.methods.generateTitle = function() {
  const firstUserMessage = this.messages.find(m => m.role === 'user');
  if (firstUserMessage) {
    const title = firstUserMessage.content.substring(0, 50);
    this.title = title.length < firstUserMessage.content.length ? title + '...' : title;
  }
  return this.title;
};

// Calculate duration when ending conversation
conversationSchema.methods.endConversation = function() {
  this.isActive = false;
  this.endedAt = new Date();
  this.duration = Math.round((this.endedAt - this.startedAt) / 1000);
  return this;
};

module.exports = mongoose.model('Conversation', conversationSchema);
