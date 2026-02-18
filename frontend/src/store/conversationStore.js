import { create } from 'zustand';
import conversationService from '../services/conversation.service';

const useConversationStore = create((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    totalPages: 1,
    total: 0,
    hasMore: false
  },

  // Fetch all conversations (with optional pagination/search)
  fetchConversations: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const data = await conversationService.getConversations(params);
      const newConversations = data.conversations;
      
      // If loading more pages, append; otherwise replace
      if (params.page && params.page > 1) {
        set((state) => ({
          conversations: [...state.conversations, ...newConversations],
          pagination: data.pagination || { page: 1, totalPages: 1, total: newConversations.length, hasMore: false },
          isLoading: false
        }));
      } else {
        set({
          conversations: newConversations,
          pagination: data.pagination || { page: 1, totalPages: 1, total: newConversations.length, hasMore: false },
          isLoading: false
        });
      }
      return newConversations;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Load more conversations
  loadMore: async () => {
    const { pagination } = get();
    if (!pagination.hasMore) return;
    return get().fetchConversations({ page: pagination.page + 1 });
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
