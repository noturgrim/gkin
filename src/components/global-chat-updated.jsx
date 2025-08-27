import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import chatService from "../services/chatService";
import { useNotifications } from "../context/NotificationContext";
import { ChatContainer } from "./chat/ChatContainer";

// Preload chat service connection
let chatServicePreloaded = false;
const preloadChatService = async () => {
  if (!chatServicePreloaded) {
    try {
      await chatService.connect();
      chatServicePreloaded = true;
    } catch (error) {
      // Silent fail - we'll retry in the component
    }
  }
};

// Preload as soon as this module is loaded
preloadChatService();

export function GlobalChat({ defaultExpanded = false }) {
  const [isExpanded, setIsExpanded] = useState(() => {
    // Try to get from localStorage first
    const savedState = localStorage.getItem("chatExpanded");
    return savedState !== null ? JSON.parse(savedState) : defaultExpanded;
  });
  const [isMobileView, setIsMobileView] = useState(false);

  // Get notifications context
  const { unreadCount, markAllAsRead } = useNotifications();

  // Check if mobile view on mount and window resize
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    // Initial check
    checkMobileView();

    // Add resize listener
    window.addEventListener("resize", checkMobileView);

    return () => {
      window.removeEventListener("resize", checkMobileView);
    };
  }, []);

  // Update localStorage when expanded state changes
  useEffect(() => {
    localStorage.setItem("chatExpanded", JSON.stringify(isExpanded));
  }, [isExpanded]);

  // Toggle chat expansion
  const toggleChat = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      // Reset unread count when opening
      markAllAsRead();
    }
  };

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ease-in-out 
      ${
        isMobileView
          ? isExpanded
            ? "inset-0 h-full bg-white"
            : "bottom-0 right-0 w-auto h-auto bg-transparent"
          : isExpanded
          ? "bottom-4 right-4 w-96 h-[500px] rounded-lg shadow-xl bg-white"
          : "bottom-4 right-4 w-auto h-auto bg-transparent"
      }`}
    >
      {!isExpanded ? (
        // Collapsed chat button
        <div className="flex items-end justify-end p-4">
          <button
            onClick={toggleChat}
            className="relative bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg flex items-center justify-center"
          >
            <MessageCircle className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      ) : (
        // Expanded chat using our new modular components
        <ChatContainer 
          toggleChat={toggleChat} 
          isMobileView={isMobileView}
          markAllAsRead={markAllAsRead}
        />
      )}
    </div>
  );
}