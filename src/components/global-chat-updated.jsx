import { useState, useRef, useEffect } from "react";
import {
  Send,
  AtSign,
  User,
  Clock,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Badge } from "./ui/badge";
import chatService from "../services/chatService";
import authService from "../services/authService";
import { useNotifications } from "../context/NotificationContext";

// Enhanced role colors mapping with better contrast
const roleColors = {
  liturgy: {
    bg: "bg-blue-600",
    text: "text-blue-800",
    light: "bg-blue-50",
    border: "border-blue-200",
  },
  pastor: {
    bg: "bg-purple-600",
    text: "text-purple-800",
    light: "bg-purple-50",
    border: "border-purple-200",
  },
  translation: {
    bg: "bg-green-600",
    text: "text-green-800",
    light: "bg-green-50",
    border: "border-green-200",
  },
  beamer: {
    bg: "bg-orange-600",
    text: "text-orange-800",
    light: "bg-orange-50",
    border: "border-orange-200",
  },
  music: {
    bg: "bg-pink-600",
    text: "text-pink-800",
    light: "bg-pink-50",
    border: "border-pink-200",
  },
  treasurer: {
    bg: "bg-emerald-600",
    text: "text-emerald-800",
    light: "bg-emerald-50",
    border: "border-emerald-200",
  },
};

export function GlobalChat({ defaultExpanded = false }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionPosition, setMentionPosition] = useState(0);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [isExpanded, setIsExpanded] = useState(() => {
    // Try to get from localStorage first
    const savedState = localStorage.getItem("chatExpanded");
    return savedState !== null ? JSON.parse(savedState) : defaultExpanded;
  });
  const [isMobileView, setIsMobileView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);
  
  // Get current user
  const currentUser = authService.getCurrentUser();
  
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

  // Initialize chat and connect to socket
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Connect to chat service
        await chatService.connect();
        setIsConnected(true);
        
        // Load initial messages
        const initialMessages = await chatService.getMessages();
        setMessages(initialMessages || []);
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error initializing chat:", error);
        setError("Failed to connect to chat. Please try again later.");
        setIsLoading(false);
      }
    };
    
    initializeChat();
    
    // Set up message listener
    chatService.onMessage(handleNewMessage);
    chatService.onConnectionChange(handleConnectionChange);
    
    // Clean up on unmount
    return () => {
      chatService.offMessage(handleNewMessage);
      chatService.offConnectionChange(handleConnectionChange);
    };
  }, []);

  // Handle connection status changes
  const handleConnectionChange = (connected) => {
    setIsConnected(connected);
  };

  // Handle new incoming messages
  const handleNewMessage = (message) => {
    setMessages(prevMessages => [...prevMessages, message]);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatEndRef.current && isExpanded) {
      const chatContainer = chatEndRef.current.parentElement;
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  }, [messages, isExpanded]);

  // Toggle chat expansion
  const toggleChat = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      // Reset unread count when opening
      markAllAsRead();
      
      setTimeout(() => {
        if (chatEndRef.current) {
          const chatContainer = chatEndRef.current.parentElement;
          if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
          }
        }
      }, 100);
    }
  };

  // Handle input changes and detect @ mentions
  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    // Check for @ mentions
    const lastAtSymbolIndex = value.lastIndexOf("@");
    if (
      lastAtSymbolIndex !== -1 &&
      lastAtSymbolIndex > value.lastIndexOf(" ")
    ) {
      setShowMentionSuggestions(true);
      setMentionPosition(lastAtSymbolIndex);
      const searchText = value.substring(lastAtSymbolIndex + 1).toLowerCase();
      setMentionSearch(searchText);

      // Filter suggestions based on roles and names
      const suggestions = [];

      // First check for role matches
      const roles = ["liturgy", "pastor", "translation", "beamer", "music", "treasurer"];
      const matchingRoles = roles.filter((role) =>
        role.toLowerCase().includes(searchText)
      );

      matchingRoles.forEach((role) => {
        suggestions.push({ type: "role", value: role });
      });

      setFilteredSuggestions(suggestions);
    } else {
      setShowMentionSuggestions(false);
    }
  };

  // Apply selected mention
  const applyMention = (suggestion) => {
    const beforeMention = newMessage.substring(0, mentionPosition);
    let mentionText = "";

    if (suggestion.type === "role") {
      mentionText = `@${suggestion.value} `;
    } else {
      mentionText = `@${suggestion.value.name} `;
    }

    const afterMention = newMessage.substring(
      mentionPosition + mentionSearch.length + 1
    );

    setNewMessage(beforeMention + mentionText + afterMention);
    setShowMentionSuggestions(false);
    inputRef.current.focus();
  };

  // Send message
  const sendMessage = async () => {
    if (newMessage.trim() === "" || isSending) return;

    try {
      setIsSending(true);
      
      // Extract mentions
      const mentions = chatService.extractMentions(newMessage);
      
      // Send the message
      await chatService.sendMessage(newMessage, mentions);
      
      // Clear input
      setNewMessage("");
      setIsSending(false);
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
      setIsSending(false);
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Format date for message groups
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.created_at).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  // Highlight mentions in message text
  const highlightMentions = (text) => {
    return text.split(" ").map((word, index) => {
      if (word.startsWith("@")) {
        const role = word.substring(1).toLowerCase();
        const color = roleColors[role]?.text || "text-blue-800";

        return (
          <span key={index}>
            <span className={`${color} font-medium`}>{word}</span>{" "}
          </span>
        );
      }
      return <span key={index}>{word} </span>;
    });
  };

  // Mobile chat UI
  return (
    <div
      ref={chatContainerRef}
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
        // Expanded chat
        <Card className="h-full flex flex-col shadow-xl border border-gray-300 rounded-t-lg md:rounded-lg overflow-hidden">
          {/* Mobile header with close button */}
          {isMobileView && (
            <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AtSign className="w-5 h-5" />
                <h2 className="font-medium">General Chat</h2>
                {!isConnected && (
                  <Badge variant="outline" className="bg-red-500 text-white border-red-600 text-xs">
                    Offline
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full text-white hover:bg-blue-700"
                onClick={toggleChat}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Desktop header */}
          {!isMobileView && (
            <CardHeader className="border-b border-gray-200 pb-3 bg-gray-50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-blue-100">
                    <AtSign className="w-4 h-4 text-blue-700" />
                  </div>
                  General Chat
                  {!isConnected && (
                    <Badge variant="outline" className="bg-red-500 text-white border-red-600 text-xs ml-2">
                      Offline
                    </Badge>
                  )}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full"
                  onClick={toggleChat}
                >
                  <ChevronDown className="h-5 w-5" />
                </Button>
              </div>
              <CardDescription className="text-gray-600">
                Use @role to notify team members
              </CardDescription>
            </CardHeader>
          )}

          <CardContent className="flex-1 overflow-y-auto p-0 bg-gray-50">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                <p className="text-gray-600 text-sm">Loading messages...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full p-4">
                <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                <p className="text-red-600 text-center">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-4">
                <MessageCircle className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-gray-500 text-center">No messages yet. Be the first to send a message!</p>
              </div>
            ) : (
              <div className="p-3 md:p-4 space-y-4 md:space-y-6">
                {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                  <div key={date} className="space-y-4">
                    <div className="flex justify-center">
                      <div className="text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                        {formatDate(dateMessages[0].created_at)}
                      </div>
                    </div>

                    {dateMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-2 md:gap-3 ${
                          message.sender.id === currentUser.id
                            ? "justify-end"
                            : ""
                        }`}
                      >
                        {message.sender.id !== currentUser.id && (
                          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                            <img
                              src={message.sender.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender.username)}&background=random`}
                              alt={message.sender.username}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div
                          className={`max-w-[75%] md:max-w-[70%] ${
                            message.sender.id === currentUser.id
                              ? "bg-blue-600 text-white rounded-t-lg rounded-bl-lg shadow-sm"
                              : "bg-white text-gray-800 rounded-t-lg rounded-br-lg border border-gray-200 shadow-sm"
                          } p-3`}
                        >
                          <div className="flex justify-between items-center mb-1.5">
                            <span
                              className={`text-xs font-medium ${
                                message.sender.id === currentUser.id
                                  ? "text-blue-100"
                                  : "text-gray-700"
                              }`}
                            >
                              {message.sender.id === currentUser.id
                                ? "You"
                                : message.sender.username}
                              <span
                                className={`text-xs ml-1 ${
                                  message.sender.id === currentUser.id
                                    ? "text-blue-200"
                                    : "text-gray-500"
                                }`}
                              >
                                ({message.sender.role})
                              </span>
                            </span>
                            <span
                              className={`text-xs ${
                                message.sender.id === currentUser.id
                                  ? "text-blue-200"
                                  : "text-gray-500"
                              } flex items-center gap-1`}
                            >
                              <Clock className="w-3 h-3" />
                              {formatTime(message.created_at)}
                            </span>
                          </div>
                          <p
                            className={`text-sm break-words ${
                              message.sender.id === currentUser.id
                                ? "text-white"
                                : "text-gray-800"
                            }`}
                          >
                            {highlightMentions(message.content)}
                          </p>
                          {message.mentions && message.mentions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {message.mentions.map((mention, index) => {
                                const mentionValue = mention.value || mention;
                                const roleColor =
                                  roleColors[mentionValue]?.light || "bg-gray-100";
                                const borderColor =
                                  roleColors[mentionValue]?.border ||
                                  "border-gray-200";
                                const textColor =
                                  roleColors[mentionValue]?.text || "text-gray-800";

                                return (
                                  <span
                                    key={index}
                                    className={`text-xs px-2 py-0.5 rounded-full ${roleColor} ${textColor} border ${borderColor}`}
                                  >
                                    @{mentionValue}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {message.sender.id === currentUser.id && (
                          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                            <img
                              src={message.sender.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender.username)}&background=random`}
                              alt={message.sender.username}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}
          </CardContent>

          <div className="p-3 md:p-4 border-t border-gray-200 bg-white relative flex-shrink-0">
            {!isConnected && (
              <div className="absolute inset-x-0 -top-8 flex justify-center">
                <div className="bg-red-100 text-red-800 text-xs px-3 py-1 rounded-t-md border border-red-200">
                  You are offline. Messages will be sent when you reconnect.
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={handleInputChange}
                  placeholder="Type a message..."
                  className="w-full px-4 py-2.5 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 shadow-sm"
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  disabled={isSending}
                />

                {showMentionSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute bottom-full left-0 mb-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                    <div className="p-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-600">
                      Suggestions
                    </div>
                    {filteredSuggestions.map((suggestion, index) => {
                      if (suggestion.type === "role") {
                        const roleColor =
                          roleColors[suggestion.value]?.bg || "bg-blue-600";
                        const lightColor =
                          roleColors[suggestion.value]?.light || "bg-blue-50";

                        return (
                          <div
                            key={index}
                            className="p-2.5 hover:bg-gray-50 cursor-pointer flex items-center gap-2 border-b border-gray-100"
                            onClick={() => applyMention(suggestion)}
                          >
                            <div
                              className={`w-6 h-6 rounded-full ${lightColor} flex items-center justify-center`}
                            >
                              <div
                                className={`w-3 h-3 rounded-full ${roleColor}`}
                              ></div>
                            </div>
                            <span className="font-medium text-gray-800">
                              {suggestion.value}
                            </span>
                            <Badge
                              variant="outline"
                              className="ml-auto text-xs bg-gray-50 border-gray-200 text-gray-600"
                            >
                              role
                            </Badge>
                          </div>
                        );
                      } else {
                        const roleColor =
                          roleColors[suggestion.value.role]?.bg ||
                          "bg-blue-600";

                        return (
                          <div
                            key={index}
                            className="p-2.5 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-100"
                            onClick={() => applyMention(suggestion)}
                          >
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                              <img
                                src={suggestion.value.avatar}
                                alt={suggestion.value.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-medium text-gray-800">
                                {suggestion.value.name}
                              </div>
                              <div className="text-xs flex items-center gap-1 text-gray-600">
                                <div
                                  className={`w-1.5 h-1.5 rounded-full ${roleColor}`}
                                ></div>
                                {suggestion.value.role}
                              </div>
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                )}
              </div>
              <Button
                onClick={sendMessage}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4"
                disabled={!newMessage.trim() || isSending}
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
