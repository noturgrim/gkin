import { useState, useEffect, useRef } from "react";
import chatService from "../../services/chatService";
import { Loader2, AlertCircle, MessageCircle } from "lucide-react";

export function ChatMessageList({ messages, isLoading, error, formatDate, formatTime, highlightMentions, currentUser }) {
  const chatEndRef = useRef(null);

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    if (!message || !message.created_at) {
      return groups;
    }
    
    try {
      const date = new Date(message.created_at).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    } catch (error) {
      return groups;
    }
  }, {});

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      const chatContainer = chatEndRef.current.parentElement;
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
        <p className="text-gray-600 text-sm">{error || "Loading messages..."}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
        <p className="text-red-600 text-center">{error}</p>
        <button 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          onClick={() => window.location.reload()}
        >
          Reload Page
        </button>
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <MessageCircle className="w-8 h-8 text-gray-400 mb-2" />
        <p className="text-gray-500 text-center">No messages yet. Be the first to send a message!</p>
      </div>
    );
  }

  return (
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
                    <span className="w-3 h-3">⏱️</span>
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
                      return (
                        <span
                          key={index}
                          className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 border border-gray-200"
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
  );
}
