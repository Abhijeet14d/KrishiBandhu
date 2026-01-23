import api from './api';

const conversationService = {
  // Get all conversations
  getConversations: async () => {
    const response = await api.get('/conversations');
    return response.data;
  },

  // Get single conversation
  getConversation: async (id) => {
    const response = await api.get(`/conversations/${id}`);
    return response.data;
  },

  // Create conversation (REST fallback)
  createConversation: async () => {
    const response = await api.post('/conversations');
    return response.data;
  },

  // Send message (REST fallback)
  sendMessage: async (conversationId, message) => {
    const response = await api.post(`/conversations/${conversationId}/message`, { message });
    return response.data;
  },

  // End conversation (REST fallback)
  endConversation: async (conversationId) => {
    const response = await api.put(`/conversations/${conversationId}/end`);
    return response.data;
  },

  // Delete conversation
  deleteConversation: async (conversationId) => {
    const response = await api.delete(`/conversations/${conversationId}`);
    return response.data;
  }
};

export default conversationService;
