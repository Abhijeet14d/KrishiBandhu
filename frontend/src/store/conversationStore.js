import { create } from 'zustand';
import conversationService from '../services/conversation.service';

const useConversationStore = create((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  error: null,

  // Fetch all conversations
  fetchConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await conversationService.getConversations();
      set({ conversations: data.conversations, isLoading: false });
      return data.conversations;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Set current conversation
  setCurrentConversation: (conversation) => {
    set({
      currentConversation: conversation,
      messages: conversation?.messages || []
    });
  },

  // Add message to current conversation
  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message]
    }));
  },

  // Update conversation title
  updateTitle: (title) => {
    set((state) => ({
      currentConversation: state.currentConversation
        ? { ...state.currentConversation, title }
        : null
    }));
  },

  // Clear current conversation
  clearCurrentConversation: () => {
    set({
      currentConversation: null,
      messages: []
    });
  },

  // Delete conversation
  deleteConversation: async (conversationId) => {
    try {
      await conversationService.deleteConversation(conversationId);
      set((state) => ({
        conversations: state.conversations.filter(c => c._id !== conversationId)
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Reset store
  reset: () => {
    set({
      conversations: [],
      currentConversation: null,
      messages: [],
      isLoading: false,
      error: null
    });
  }
}));

export default useConversationStore;
