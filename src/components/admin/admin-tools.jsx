import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Trash2, AlertTriangle, BarChart3, Key, MessageSquare, Settings, Loader2, RefreshCw } from "lucide-react";
import adminService from "../../services/adminService";
import { useNotifications } from "../../context/NotificationContext";
import { PasscodeManager } from "./passcode-manager";

/**
 * Admin Tools component for administrative operations
 */
export function AdminTools() {
  const [activeTab, setActiveTab] = useState("messages");
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const { refreshMentions } = useNotifications();
  
  // Load stats on component mount
  useEffect(() => {
    if (activeTab === "messages") {
      fetchMessageStats();
    }
  }, [activeTab]);
  
  // Tab options
  const tabs = [
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "passcodes", label: "Passcodes", icon: Key },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  // Handle clearing all messages
  const handleClearMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call the API to clear messages
      const response = await adminService.clearAllMessages();
      
      // Reset confirmation dialog
      setShowConfirm(false);
      
      // Refresh mentions to update UI
      refreshMentions();
      
      // Show success message
      alert("All messages have been cleared successfully.");
      
      // Refresh stats
      fetchMessageStats();
    } catch (error) {
      setError(error.message || "Failed to clear messages");
    } finally {
      setLoading(false);
    }
  };

  // Fetch message statistics
  const fetchMessageStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminService.getMessageStats();
      
      // Make sure we have valid stats data
      if (response && response.stats) {
        setStats({
          messageCount: response.stats.messageCount || 0,
          mentionCount: response.stats.mentionCount || 0,
          topUsers: response.stats.topUsers || []
        });
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.error("Stats fetch error:", error);
      setError(error.message || "Failed to fetch message statistics");
      // Set default empty stats to prevent UI errors
      setStats({
        messageCount: 0,
        mentionCount: 0,
        topUsers: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Render the Messages tab content
  const renderMessagesTab = () => {
    return (
      <div className="space-y-6">
        {/* Message Management Section */}
        <div className="border rounded-lg p-4 sm:p-6 bg-white shadow-sm">
          <h3 className="text-lg font-medium mb-2 flex items-center">
            <Trash2 className="w-5 h-5 mr-2 text-red-600" />
            Message Management
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            Clear all messages and related data from the system. This action cannot be undone.
          </p>
          
          {!showConfirm ? (
            <Button 
              variant="destructive" 
              onClick={() => setShowConfirm(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              Clear All Messages
            </Button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
              <div className="flex items-start mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">
                  Are you sure you want to delete all messages? This will also remove all mentions and related data.
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="destructive"
                  onClick={handleClearMessages}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Yes, Delete Everything</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowConfirm(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          {error && (
            <p className="text-red-600 text-sm mt-2">{error}</p>
          )}
        </div>
        
        {/* Message Statistics Section */}
        <div className="border rounded-lg p-4 sm:p-6 bg-white shadow-sm">
          <h3 className="text-lg font-medium mb-2 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
            Message Statistics
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            View statistics about messages and mentions in the system.
          </p>
          
          <div className="flex items-center mb-5">
            <Button 
              variant="outline" 
              onClick={fetchMessageStats}
              disabled={loading}
              className="mr-3 flex items-center gap-2 px-4 py-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh Statistics</span>
                </>
              )}
            </Button>
            
            {error && (
              <div className="flex items-center text-red-600 text-sm bg-red-50 px-3 py-1.5 rounded-md">
                <AlertTriangle className="h-4 w-4 mr-1.5" />
                {error}
              </div>
            )}
          </div>
          
          {stats && (
            <div className="bg-gradient-to-b from-blue-50 to-white rounded-lg border border-blue-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                  <div className="text-gray-500 text-sm mb-1 font-medium">Total Messages</div>
                  <div className="text-3xl font-bold text-blue-700">{stats.messageCount}</div>
                  <div className="mt-2 flex justify-center">
                    <MessageSquare className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                  <div className="text-gray-500 text-sm mb-1 font-medium">Total Mentions</div>
                  <div className="text-3xl font-bold text-purple-700">{stats.mentionCount}</div>
                  <div className="mt-2 flex justify-center">
                    <AlertTriangle className="w-5 h-5 text-purple-500" />
                  </div>
                </div>
              </div>
              
              {stats.topUsers && stats.topUsers.length > 0 ? (
                <div className="border-t border-blue-100 px-6 py-4">
                  <p className="text-gray-700 font-medium mb-3 flex items-center">
                    <BarChart3 className="w-4 h-4 mr-1.5 text-blue-600" />
                    Top Users by Message Count
                  </p>
                  <div className="bg-white rounded-lg overflow-hidden border border-gray-100">
                    {stats.topUsers.map((user, index) => {
                      // Calculate percentage for bar width
                      const maxCount = Math.max(...stats.topUsers.map(u => u.message_count));
                      const percentage = (user.message_count / maxCount) * 100;
                      
                      return (
                        <div 
                          key={index} 
                          className={`flex items-center px-4 py-2.5 ${
                            index !== stats.topUsers.length - 1 ? 'border-b border-gray-100' : ''
                          }`}
                        >
                          <div className="w-1/3 sm:w-1/4 font-medium truncate pr-2">
                            {user.username || "Unknown User"}
                          </div>
                          <div className="w-2/3 sm:w-3/4 flex items-center">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="ml-3 font-semibold text-blue-700">
                              {user.message_count}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="border-t border-blue-100 px-6 py-4 text-center">
                  <p className="text-gray-500 italic flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 mr-1.5 text-gray-400" />
                    No user message data available
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render the Passcodes tab content
  const renderPasscodesTab = () => {
    return <PasscodeManager isEmbedded={true} />;
  };

  // Render the Settings tab content
  const renderSettingsTab = () => {
    return (
      <div className="border rounded-lg p-4 sm:p-6 bg-white shadow-sm">
        <h3 className="text-lg font-medium mb-2 flex items-center">
          <Settings className="w-5 h-5 mr-2 text-blue-600" />
          System Settings
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          Additional system settings will be available here in future updates.
        </p>
      </div>
    );
  };

  // Get the active tab content
  const getActiveTabContent = () => {
    switch (activeTab) {
      case "messages":
        return renderMessagesTab();
      case "passcodes":
        return renderPasscodesTab();
      case "settings":
        return renderSettingsTab();
      default:
        return renderMessagesTab();
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto shadow-lg border-gray-200 my-8">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-white pb-6">
        <CardTitle className="text-2xl font-bold text-blue-800">Admin Tools</CardTitle>
        <CardDescription className="text-blue-600/80 mt-1">
          Manage system data and perform administrative tasks
        </CardDescription>
      </CardHeader>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white overflow-x-auto">
        <div className="flex space-x-4 px-8 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-700 bg-blue-50/50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50/50"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="w-5 h-5" />
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      <CardContent className="pt-8 px-8 pb-6 bg-white">
        {getActiveTabContent()}
      </CardContent>
      
      <CardFooter className="bg-gray-50 border-t text-xs text-gray-500 px-8 py-4 rounded-b-lg">
        <div className="flex items-center">
          <Settings className="w-3 h-3 mr-2 text-gray-400" />
          These tools are only available to administrators.
        </div>
      </CardFooter>
    </Card>
  );
}
