import { createContext, useContext, useState, useEffect } from 'react';
import chatService from '../services/chatService';
import authService from '../services/authService';

// Create context
const NotificationContext = createContext();

/**
 * Provider component for notifications
 */
export function NotificationProvider({ children }) {
  const [mentions, setMentions] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize and fetch mentions
  useEffect(() => {
    const initializeNotifications = async () => {
      if (!authService.isAuthenticated()) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Connect to chat service
        await chatService.connect();
        
        // Fetch initial mentions
        const mentionsData = await chatService.getMentions();
        setMentions(mentionsData);
        
        // Get unread count
        const count = await chatService.getUnreadMentionCount();
        setUnreadCount(count);
        
        setLoading(false);
      } catch (error) {
        console.error('Error initializing notifications:', error);
        setLoading(false);
      }
    };

    initializeNotifications();

    // Set up listeners
    chatService.onMention(handleNewMention);
    chatService.onConnectionChange(handleConnectionChange);

    // Clean up on unmount
    return () => {
      chatService.offMention(handleNewMention);
      chatService.offConnectionChange(handleConnectionChange);
    };
  }, []);

  // Handle connection status changes
  const handleConnectionChange = (connected) => {
    setIsConnected(connected);
  };

  // Handle new mentions
  const handleNewMention = (mention) => {
    setMentions(prev => [mention, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  // Mark mentions as read
  const markAsRead = async (mentionIds) => {
    try {
      await chatService.markMentionsAsRead(mentionIds);
      
      // Update local state
      setMentions(prev => 
        prev.map(mention => 
          mentionIds.includes(mention.id) 
            ? { ...mention, is_read: true } 
            : mention
        )
      );
      
      // Update unread count
      const count = await chatService.getUnreadMentionCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error marking mentions as read:', error);
    }
  };

  // Mark all mentions as read
  const markAllAsRead = async () => {
    const unreadMentionIds = mentions
      .filter(mention => !mention.is_read)
      .map(mention => mention.id);
      
    if (unreadMentionIds.length > 0) {
      await markAsRead(unreadMentionIds);
    }
  };

  // Refresh mentions
  const refreshMentions = async () => {
    try {
      setLoading(true);
      const mentionsData = await chatService.getMentions();
      setMentions(mentionsData);
      
      const count = await chatService.getUnreadMentionCount();
      setUnreadCount(count);
      
      setLoading(false);
    } catch (error) {
      console.error('Error refreshing mentions:', error);
      setLoading(false);
    }
  };

  // Context value
  const value = {
    mentions,
    unreadCount,
    loading,
    isConnected,
    markAsRead,
    markAllAsRead,
    refreshMentions
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to use the notification context
 */
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
