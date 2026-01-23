const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
    // Create model with system instruction in the correct format
    // Using gemini-1.5-pro as fallback if 2.0-flash quota is exceeded
    this.model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      systemInstruction: {
        role: 'system',
        parts: [{ text: SYSTEM_PROMPT }]
      }
    });
    this.chatSessions = new Map(); // Store chat sessions by conversation ID
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
  async sendMessage(conversationId, message) {
    try {
      console.log(`📨 Sending message to Gemini for conversation ${conversationId}:`, message);
      const chat = this.getChat(conversationId);
      const result = await chat.sendMessage(message);
      const response = result.response.text();
      console.log(`✅ Gemini response received:`, response.substring(0, 100) + '...');
      return response;
    } catch (error) {
      console.error('❌ Gemini AI Error:', error.message);
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
