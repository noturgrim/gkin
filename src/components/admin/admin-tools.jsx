import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Trash2, AlertTriangle, BarChart3, Key, MessageSquare, Settings } from "lucide-react";
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
      setStats(response.stats);
    } catch (error) {
      setError(error.message || "Failed to fetch message statistics");
    } finally {
      setLoading(false);
    }
  };

  // Render the Messages tab content
  const renderMessagesTab = () => {
    return (
      <div className="space-y-6">
        {/* Message Management Section */}
        <div className="border rounded-lg p-4 bg-white">
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
                  className="bg-red-600 hover:bg-red-700"
                >
                  {loading ? "Processing..." : "Yes, Delete Everything"}
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
        <div className="border rounded-lg p-4 bg-white">
          <h3 className="text-lg font-medium mb-2 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
            Message Statistics
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            View statistics about messages and mentions in the system.
          </p>
          
          <Button 
            variant="outline" 
            onClick={fetchMessageStats}
            disabled={loading}
            className="mb-4"
          >
            {loading ? "Loading..." : "Refresh Statistics"}
          </Button>
          
          {stats && (
            <div className="bg-gray-50 rounded-md p-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Total Messages:</p>
                  <p className="text-lg font-semibold">{stats.messageCount}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Mentions:</p>
                  <p className="text-lg font-semibold">{stats.mentionCount}</p>
                </div>
              </div>
              
              {stats.topUsers && stats.topUsers.length > 0 && (
                <div className="mt-4">
                  <p className="text-gray-600 mb-2">Top Users by Message Count:</p>
                  <ul className="space-y-1">
                    {stats.topUsers.map((user, index) => (
                      <li key={index} className="flex justify-between">
                        <span>{user.username}</span>
                        <span className="font-medium">{user.message_count}</span>
                      </li>
                    ))}
                  </ul>
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
      <div className="border rounded-lg p-4 bg-white">
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
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Admin Tools</CardTitle>
        <CardDescription>
          Manage system data and perform administrative tasks
        </CardDescription>
      </CardHeader>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-2 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      <CardContent className="pt-6">
        {getActiveTabContent()}
      </CardContent>
      
      <CardFooter className="bg-gray-50 border-t text-xs text-gray-500 px-6 py-3">
        These tools are only available to administrators.
      </CardFooter>
    </Card>
  );
}
