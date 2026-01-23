import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  /**
   * Connect to the socket server
   * @param {string} token - JWT access token
   * @returns {Promise} Resolves when connected
   */
  connect(token) {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        this.isConnected = true;
        resolve(this.socket);
        return;
      }

      // Disconnect existing socket if any
      if (this.socket) {
        this.socket.disconnect();
      }

      console.log('🔌 Connecting to socket server:', SOCKET_URL);
      console.log('🔑 Token available:', !!token);

      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
      });

      // Connection timeout
      const connectionTimeout = setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error('Connection timeout'));
        }
      }, 15000);

      this.socket.on('connect', () => {
        clearTimeout(connectionTimeout);
        console.log('🔌 Socket connected:', this.socket.id);
        this.isConnected = true;
        resolve(this.socket);
      });

      this.socket.on('connect_error', (error) => {
        clearTimeout(connectionTimeout);
        console.error('Socket connection error:', error.message);
        this.isConnected = false;
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
        this.isConnected = false;
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log('🔌 Socket reconnected after', attemptNumber, 'attempts');
        this.isConnected = true;
      });
    });
  }

  /**
   * Disconnect from the socket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Start a new conversation
   * @returns {Promise<Object>} Conversation data with welcome message
   */
  startConversation() {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('conversation:start', (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  /**
   * Join an existing conversation
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>} Conversation data
   */
  joinConversation(conversationId) {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('conversation:join', { conversationId }, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  /**
   * Send a message to the AI
   * @param {string} conversationId - Conversation ID
   * @param {string} message - User message (transcribed text)
   * @returns {Promise<Object>} AI response
   */
  sendMessage(conversationId, message) {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      console.log('Sending message:', { conversationId, message });

      // Set a timeout for the AI response (30 seconds)
      const timeout = setTimeout(() => {
        reject(new Error('Request timed out. Please try again.'));
      }, 30000);

      this.socket.emit('message:send', { conversationId, message }, (response) => {
        clearTimeout(timeout);
        console.log('Received response:', response);
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Failed to get response'));
        }
      });
    });
  }

  /**
   * End a conversation
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>} Conversation summary
   */
  endConversation(conversationId) {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('conversation:end', { conversationId }, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  /**
   * Listen for processing events
   * @param {Function} callback - Callback function
   */
  onProcessing(callback) {
    if (this.socket) {
      this.socket.on('message:processing', callback);
    }
  }

  /**
   * Listen for message received events (from other devices)
   * @param {Function} callback - Callback function
   */
  onMessageReceived(callback) {
    if (this.socket) {
      this.socket.on('message:received', callback);
    }
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   */
  off(event) {
    if (this.socket) {
      this.socket.off(event);
    }
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
