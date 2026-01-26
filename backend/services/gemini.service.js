const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Available models to try (in order of preference) - Updated Jan 2026
const AVAILABLE_MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.0-flash-001'];

// System prompt for farming assistant
const SYSTEM_PROMPT = `You are an expert Agricultural Assistant designed to help Indian farmers. Your role is to:

1. Provide accurate, practical farming advice
2. Answer questions about crops, soil, weather, pests, and diseases
3. Suggest modern and traditional farming techniques
4. Help with crop selection based on season and region
5. Provide market information and pricing guidance when asked
6. Explain government schemes and subsidies for farmers
7. Give advice in simple, easy-to-understand language

Guidelines:
- Keep responses concise (2-3 paragraphs max) since this is a voice conversation
- Be respectful and patient
- If you don't know something, say so honestly
- Provide region-specific advice when the farmer mentions their location
- Consider seasonal factors in your advice
- Prioritize sustainable and cost-effective solutions

Remember: Farmers may ask questions in simple language. Interpret their queries with context and provide helpful responses.`;

class GeminiService {
  constructor() {
    this.currentModelIndex = 0;
    this.initializeModel();
    this.chatSessions = new Map(); // Store chat sessions by conversation ID
  }

  initializeModel() {
    const modelName = AVAILABLE_MODELS[this.currentModelIndex];
    console.log(`🤖 Initializing Gemini with model: ${modelName}`);
    this.model = genAI.getGenerativeModel({ 
      model: modelName,
      systemInstruction: {
        role: 'system',
        parts: [{ text: SYSTEM_PROMPT }]
      }
    });
  }

  // Switch to next available model if quota exceeded
  switchToNextModel() {
    if (this.currentModelIndex < AVAILABLE_MODELS.length - 1) {
      this.currentModelIndex++;
      this.initializeModel();
      this.chatSessions.clear(); // Clear old sessions as model changed
      return true;
    }
    return false;
  }

  /**
   * Start a new chat session for a conversation
   * @param {string} conversationId - Unique conversation identifier
   * @returns {Object} Chat session
   */
  startChat(conversationId) {
    const chat = this.model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: 'You are my agricultural assistant. Please help me with farming queries.' }]
        },
        {
          role: 'model',
          parts: [{ text: 'Namaste! I am your assistant. How can I assist you today?' }]
        }
      ],
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      }
    });

    this.chatSessions.set(conversationId, chat);
    return chat;
  }

  /**
   * Get or create a chat session
   * @param {string} conversationId - Conversation ID
   * @returns {Object} Chat session
   */
  getChat(conversationId) {
    if (!this.chatSessions.has(conversationId)) {
      return this.startChat(conversationId);
    }
    return this.chatSessions.get(conversationId);
  }

  /**
   * Send a message and get AI response
   * @param {string} conversationId - Conversation ID
   * @param {string} message - User's message
   * @returns {Promise<string>} AI response
   */
  async sendMessage(conversationId, message, retryCount = 0) {
    try {
      console.log(`📨 Sending message to Gemini for conversation ${conversationId}:`, message);
      const chat = this.getChat(conversationId);
      const result = await chat.sendMessage(message);
      const response = result.response.text();
      console.log(`✅ Gemini response received:`, response.substring(0, 100) + '...');
      return response;
    } catch (error) {
      console.error('❌ Gemini AI Error:', error.message);
      
      // Check if it's a quota/rate limit error (429)
      if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('Too Many Requests')) {
        // Try switching to another model
        if (this.switchToNextModel()) {
          console.log(`🔄 Switched to model: ${AVAILABLE_MODELS[this.currentModelIndex]}, retrying...`);
          return this.sendMessage(conversationId, message, retryCount + 1);
        }
        
        // If all models exhausted, wait and retry once
        if (retryCount < 1) {
          console.log('⏳ All models quota exceeded, waiting 40 seconds before retry...');
          await new Promise(resolve => setTimeout(resolve, 40000));
          this.currentModelIndex = 0; // Reset to first model
          this.initializeModel();
          return this.sendMessage(conversationId, message, retryCount + 1);
        }
        
        throw new Error('API quota exceeded. Please try again in a few minutes or check your API billing settings.');
      }
      
      console.error('Full error:', error);
      throw new Error('Failed to get AI response: ' + error.message);
    }
  }

  /**
   * Send a single message without chat history (for quick queries)
   * @param {string} message - User's message
   * @returns {Promise<string>} AI response
   */
  async quickQuery(message) {
    try {
      const prompt = `${SYSTEM_PROMPT}\n\nUser Query: ${message}\n\nProvide a helpful, concise response:`;
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Gemini Quick Query Error:', error);
      throw new Error('Failed to get AI response. Please try again.');
    }
  }

  /**
   * End and cleanup a chat session
   * @param {string} conversationId - Conversation ID
   */
  endChat(conversationId) {
    this.chatSessions.delete(conversationId);
  }

  /**
   * Get the welcome message for new conversations
   * @returns {string} Welcome message
   */
  getWelcomeMessage() {
    return "Namaste! I am your Assistant. Please speak your question, and I'll do my best to help you!";
  }
}

// Export singleton instance
module.exports = new GeminiService();
