import { io } from 'socket.io-client';
import api from './api';
import authService from './authService';
import env from '../config/env';

/**
 * Chat service for handling messages and real-time communication
 */
class ChatService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.messageListeners = [];
    this.mentionListeners = [];
    this.connectionListeners = [];
  }

  /**
   * Initialize the socket connection
   * @returns {Promise} Promise that resolves when connected
   */
  connect() {
    return new Promise((resolve, reject) => {
      // If already connected, just return the existing socket
      if (this.connected && this.socket) {
        resolve(this.socket);
        return;
      }
      
      // If there's an existing socket but not connected, disconnect it first
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }

      // Get the current user
      const user = authService.getCurrentUser();
      if (!user || !user.token) {
        reject(new Error('User not authenticated'));
        return;
      }

      // Connect to the socket server with a unique client ID
      // console.log('Connecting to socket server at:', env.API_URL.replace('/api', ''));
      
      try {
        this.socket = io(env.API_URL.replace('/api', ''), {
          auth: {
            token: user.token
          },
          transports: ['polling', 'websocket'], // Try polling first, then websocket
          forceNew: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000 // Increase timeout
        });
      } catch (error) {
        console.error('Error creating socket connection:', error);
        // Continue execution - we'll handle connection errors in the event handlers
      }

      // Set up event listeners
      if (this.socket) {
        this.socket.on('connect', () => {
          // console.log('Socket connected:', this.socket.id);
          this.connected = true;
          
          // Rooms are now auto-joined on the server side
          // No need to manually join rooms here
          
          // Notify listeners
          this.connectionListeners.forEach(listener => listener(true));
          
          resolve(this.socket);
        });
        
        this.socket.on('connect_error', (error) => {
          console.warn('Socket connection error:', error.message);
          // We'll continue without WebSockets - the app can still function with REST API
          // console.log('Continuing without WebSocket connection');
          this.connected = false;
          resolve(null); // Resolve with null to indicate no socket connection
        });
      } else {
        console.warn('Failed to create socket - continuing without WebSockets');
        resolve(null);
      }

      if (this.socket) {
        this.socket.on('disconnect', () => {
          // console.log('Socket disconnected');
          this.connected = false;
          
          // Notify listeners
          this.connectionListeners.forEach(listener => listener(false));
        });
      }

      // Listen for messages and mentions only if socket exists
      if (this.socket) {
        // Listen for messages
        this.socket.on('message', (message) => {
          this.messageListeners.forEach(listener => listener(message));
        });

        // Listen for mentions
        this.socket.on('mention', (data) => {
          this.mentionListeners.forEach(listener => listener(data));
        });
      }
    });
  }

  /**
   * Disconnect the socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Add a listener for new messages
   * @param {Function} listener - Function to call when a new message is received
   */
  onMessage(listener) {
    this.messageListeners.push(listener);
  }

  /**
   * Remove a message listener
   * @param {Function} listener - The listener to remove
   */
  offMessage(listener) {
    this.messageListeners = this.messageListeners.filter(l => l !== listener);
  }

  /**
   * Add a listener for mentions
   * @param {Function} listener - Function to call when a mention is received
   */
  onMention(listener) {
    this.mentionListeners.push(listener);
  }

  /**
   * Remove a mention listener
   * @param {Function} listener - The listener to remove
   */
  offMention(listener) {
    this.mentionListeners = this.mentionListeners.filter(l => l !== listener);
  }

  /**
   * Add a listener for connection status changes
   * @param {Function} listener - Function to call when connection status changes
   */
  onConnectionChange(listener) {
    this.connectionListeners.push(listener);
  }

  /**
   * Remove a connection listener
   * @param {Function} listener - The listener to remove
   */
  offConnectionChange(listener) {
    this.connectionListeners = this.connectionListeners.filter(l => l !== listener);
  }

  /**
   * Get recent messages
   * @param {number} limit - Maximum number of messages to retrieve
   * @param {number} offset - Number of messages to skip
   * @returns {Promise} Promise with messages
   */
  async getMessages(limit = 50, offset = 0, retryCount = 0) {
    const maxRetries = 3;
    
    try {
      // Check if user is authenticated
      const user = authService.getCurrentUser();
      if (!user || !user.token) {
        throw new Error('You need to be logged in to fetch messages');
      }
      
      const response = await api.get(`/chat/messages?limit=${limit}&offset=${offset}`);
      
      // Ensure we return an array even if the API returns something unexpected
      if (Array.isArray(response)) {
        return response;
      } else if (response && typeof response === 'object') {
        // If it's an object with data property, return that
        if (Array.isArray(response.data)) {
          return response.data;
        }
        // Otherwise return an empty array
        return [];
      } else {
        return [];
      }
    } catch (error) {
      // Check if it's a network error (server not running)
      if (error.message && error.message.includes('Failed to fetch')) {
        if (retryCount < maxRetries) {
          // Wait a bit and retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          return this.getMessages(limit, offset, retryCount + 1);
        }
        throw new Error('Cannot connect to chat server. Please check if the server is running.');
      } else if (error.message && error.message.includes('Unauthorized')) {
        throw new Error('Session expired. Please log in again.');
      } else {
        if (retryCount < maxRetries) {
          // Wait a bit and retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          return this.getMessages(limit, offset, retryCount + 1);
        }
        throw error; // Throw the error to be handled by the component
      }
    }
  }

  /**
   * Send a new message
   * @param {string} content - Message content
   * @param {Array} mentions - Array of mentions
   * @returns {Promise} Promise with the created message
   */
  async sendMessage(content, mentions = []) {
    try {
      // First save the message to the database via API
      const message = await api.post('/chat/messages', { content, mentions });
      
      // Then emit it via socket for real-time updates if connected
      if (this.connected && this.socket) {
        // Emit the message so the server can broadcast it to all clients
        this.socket.emit('message', message);
        
        // If there are mentions, emit those too
        if (mentions && mentions.length > 0) {
          mentions.forEach(mention => {
            this.socket.emit('mention', {
              messageId: message.id,
              ...mention
            });
          });
        }
      }
      
      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get mentions for the current user
   * @param {number} limit - Maximum number of mentions to retrieve
   * @param {number} offset - Number of mentions to skip
   * @returns {Promise} Promise with mentions
   */
  async getMentions(limit = 20, offset = 0) {
    try {
      return await api.get(`/chat/mentions?limit=${limit}&offset=${offset}`);
    } catch (error) {
      console.error('Error fetching mentions:', error);
      throw error;
    }
  }

  /**
   * Mark mentions as read
   * @param {Array} mentionIds - Array of mention IDs to mark as read
   * @returns {Promise} Promise that resolves when complete
   */
  async markMentionsAsRead(mentionIds) {
    try {
      return await api.post('/chat/mentions/read', { mentionIds });
    } catch (error) {
      console.error('Error marking mentions as read:', error);
      throw error;
    }
  }

  /**
   * Get unread mention count
   * @returns {Promise} Promise with unread count
   */
  async getUnreadMentionCount() {
    try {
      const response = await api.get('/chat/mentions/unread');
      return response.count;
    } catch (error) {
      console.error('Error fetching unread mention count:', error);
      return 0;
    }
  }

  /**
   * Extract mentions from message text
   * @param {string} text - Message text
   * @returns {Array} Array of mentions
   */
  extractMentions(text) {
    const mentions = [];
    const mentionRegex = /@(\w+)/g;
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionText = match[1].toLowerCase();
      
      // Check if it's a role mention
      const roles = ['liturgy', 'pastor', 'translation', 'beamer', 'music', 'treasurer'];
      if (roles.includes(mentionText)) {
        mentions.push({
          type: 'role',
          value: mentionText
        });
      } else {
        // It could be a user mention - we'd need to resolve this
        // For now, we'll just treat it as a role mention
        mentions.push({
          type: 'role',
          value: mentionText
        });
      }
    }
    
    return mentions;
  }
}

// Create a singleton instance
const chatService = new ChatService();

export default chatService;
