import { create } from 'zustand';
import { authService } from '../services/auth.service';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,
  error: null,

  // Set user
  setUser: (user) => set({ user, isAuthenticated: true }),

  // Register
  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register(userData);
      set({ isLoading: false });
      return response;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Registration failed' 
      });
      throw error;
    }
  },

  // Verify OTP
  verifyOTP: async (userId, otp) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.verifyOTP(userId, otp);
      set({ 
        user: response.user, 
        isAuthenticated: true, 
        isLoading: false 
      });
      return response;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'OTP verification failed' 
      });
      throw error;
    }
  },

  // Resend OTP
  resendOTP: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.resendOTP(userId);
      set({ isLoading: false });
      return response;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Failed to resend OTP' 
      });
      throw error;
    }
  },

  // Login
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(credentials);
      set({ 
        user: response.user, 
        isAuthenticated: true, 
        isLoading: false 
      });
      return response;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Login failed' 
      });
      throw error;
    }
  },

  // Logout
  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false });
  },

  // Clear error
  clearError: () => set({ error: null })
}));

export default useAuthStore;
