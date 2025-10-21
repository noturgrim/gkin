import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import {
  Trash2,
  AlertTriangle,
  BarChart3,
  Key,
  MessageSquare,
  Settings,
  Loader2,
  RefreshCw,
  ArrowLeft,
  Home,
  Users,
  TrendingUp,
  Shield,
  Activity,
  Database,
} from "lucide-react";
import adminService from "../../services/adminService";
import { useNotifications } from "../../context/NotificationContext";
import { PasscodeManager } from "./passcode-manager";
import { Link } from "react-router-dom";

/**
 * Admin Tools component for administrative operations
 */
export function AdminTools() {
  const [activeTab, setActiveTab] = useState("messages");
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [stats, setStats] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [error, setError] = useState(null);
  const { refreshMentions } = useNotifications();

  // Load stats on component mount
  useEffect(() => {
    if (activeTab === "messages") {
      fetchMessageStats();
      // Also fetch system status for the quick stats
      fetchSystemStatus();
    } else if (activeTab === "settings") {
      fetchSystemStatus();
    }
  }, [activeTab]);

  // Fetch system status
  const fetchSystemStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminService.getSystemStatus();

      if (response && response.status) {
        setSystemStatus(response.status);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.error("System status fetch error:", error);
      setError(error.message || "Failed to fetch system status");
      // Set default status to prevent UI errors
      setSystemStatus({
        server: { status: 'unknown', uptime: 0 },
        database: { status: 'unknown', connected: false }
      });
    } finally {
      setLoading(false);
    }
  };

  // Tab options
  const tabs = [
    { 
      id: "messages", 
      label: "Messages", 
      icon: MessageSquare,
      description: "Manage system messages and data"
    },
    { 
      id: "passcodes", 
      label: "Passcodes", 
      icon: Key,
      description: "Configure access codes"
    },
    { 
      id: "settings", 
      label: "Settings", 
      icon: Settings,
      description: "System configuration"
    },
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
          topUsers: response.stats.topUsers || [],
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
        topUsers: [],
      });
    } finally {
      setLoading(false);
    }
  };

  // Render the Messages tab content
  const renderMessagesTab = () => {
    return (
      <div className="space-y-8">
        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Messages</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats ? stats.messageCount : '---'}
                </p>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <MessageSquare className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Mentions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats ? stats.mentionCount : '---'}
                </p>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats && stats.topUsers ? stats.topUsers.length : '---'}
                </p>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">System Status</p>
                <p className="text-lg font-semibold text-gray-900">
                  {systemStatus?.server?.status === 'online' ? 'Online' : 
                   systemStatus?.server?.status ? 'Offline' : '---'}
                </p>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <Activity className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Message Management Section */}
        <Card className="border-0 shadow-md bg-white">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
              <div className="bg-red-100 p-2 rounded-lg mr-3">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              Message Management
            </CardTitle>
            <CardDescription className="text-gray-600">
              Manage and clear system message data with advanced controls
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-amber-800 font-medium mb-1">Data Deletion Warning</h4>
                  <p className="text-sm text-amber-700">
                    This action will permanently remove all messages, mentions, and related data from the system. 
                    This operation cannot be reversed.
                  </p>
                </div>
              </div>
            </div>

            {!showConfirm ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="destructive"
                  onClick={() => setShowConfirm(true)}
                  className="bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Messages
                </Button>
                <Button
                  variant="outline"
                  onClick={fetchMessageStats}
                  disabled={loading}
                  className="border-gray-300 hover:border-gray-400 px-6 py-3"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Data
                </Button>
              </div>
            ) : (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                <div className="flex items-start mb-4">
                  <div className="bg-red-200 p-2 rounded-lg mr-3">
                    <AlertTriangle className="w-6 h-6 text-red-700" />
                  </div>
                  <div>
                    <h4 className="text-red-900 font-bold text-lg mb-2">Final Confirmation Required</h4>
                    <p className="text-red-800 leading-relaxed">
                      You are about to permanently delete <strong>all messages</strong>, <strong>all mentions</strong>, 
                      and <strong>all related data</strong> from the system. This action is <strong>irreversible</strong> 
                      and will affect all users.
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-red-200">
                  <Button
                    variant="destructive"
                    onClick={handleClearMessages}
                    disabled={loading}
                    className="bg-red-700 hover:bg-red-800 shadow-lg flex items-center justify-center gap-2 px-6 py-3"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-5 w-5" />
                        <span>Yes, Delete Everything</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirm(false)}
                    disabled={loading}
                    className="border-gray-400 hover:bg-gray-50 px-6 py-3"
                  >
                    Cancel Operation
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 bg-red-100 border border-red-300 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Statistics Section */}
        <Card className="border-0 shadow-md bg-white">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              Message Analytics & Statistics
            </CardTitle>
            <CardDescription className="text-gray-600">
              Comprehensive insights into system message data and user activity
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Button
                variant="outline"
                onClick={fetchMessageStats}
                disabled={loading}
                className="border-gray-300 hover:border-gray-400 hover:bg-gray-50 px-6 py-3 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
                    <span>Loading Statistics...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-5 w-5 text-gray-600" />
                    <span>Refresh Analytics</span>
                  </>
                )}
              </Button>

              {error && (
                <div className="flex items-center text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg border border-red-200">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {stats && (
              <div className="space-y-6">
                {/* Main Statistics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
                    <div className="text-center">
                      <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-8 h-8 text-gray-600" />
                      </div>
                      <div className="text-4xl font-bold text-gray-900 mb-2">
                        {stats.messageCount.toLocaleString()}
                      </div>
                      <div className="text-gray-700 font-medium">Total Messages</div>
                      <div className="text-sm text-gray-500 mt-1">System-wide count</div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
                    <div className="text-center">
                      <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-gray-600" />
                      </div>
                      <div className="text-4xl font-bold text-gray-900 mb-2">
                        {stats.mentionCount.toLocaleString()}
                      </div>
                      <div className="text-gray-700 font-medium">Total Mentions</div>
                      <div className="text-sm text-gray-500 mt-1">User notifications</div>
                    </div>
                  </div>
                </div>

                {/* Top Users Section */}
                {stats.topUsers && stats.topUsers.length > 0 ? (
                  <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h4 className="text-lg font-bold text-gray-900 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-gray-600" />
                        Top Active Users
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">Users ranked by message count</p>
                    </div>
                    
                    <div className="p-6">
                      <div className="space-y-3">
                        {stats.topUsers.map((user, index) => {
                          const maxCount = Math.max(...stats.topUsers.map((u) => u.message_count));
                          const percentage = (user.message_count / maxCount) * 100;
                          const isTopUser = index < 3;

                          return (
                            <div
                              key={index}
                              className={`flex items-center p-4 rounded-lg border ${
                                isTopUser 
                                  ? 'bg-gray-50 border-gray-300' 
                                  : 'bg-white border-gray-200'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 ${
                                isTopUser 
                                  ? 'bg-gray-700 text-white' 
                                  : 'bg-gray-400 text-white'
                              }`}>
                                {index + 1}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-semibold text-gray-900 truncate">
                                    {user.username || "Unknown User"}
                                  </span>
                                  <span className={`font-bold ${
                                    isTopUser ? 'text-gray-900' : 'text-gray-700'
                                  }`}>
                                    {user.message_count.toLocaleString()}
                                  </span>
                                </div>
                                
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-500 ${
                                      isTopUser 
                                        ? 'bg-gray-600' 
                                        : 'bg-gray-400'
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Database className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-600 mb-2">No User Data Available</h4>
                    <p className="text-gray-500">User activity statistics will appear here once data is available.</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render the Passcodes tab content
  const renderPasscodesTab = () => {
    return <PasscodeManager isEmbedded={true} />;
  };

  // Render the Settings tab content
  const renderSettingsTab = () => {
    // Helper function to format uptime
    const formatUptime = (seconds) => {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      
      if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    };

    return (
      <div className="space-y-6">
        {/* System Status Card */}
        <Card className="border-0 shadow-md bg-white">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
              <div className="bg-gray-100 p-2 rounded-lg mr-3">
                <Shield className="w-5 h-5 text-gray-700" />
              </div>
              System Health & Status
            </CardTitle>
            <CardDescription className="text-gray-600">
              Real-time system performance and administrative monitoring
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Button
                variant="outline"
                onClick={fetchSystemStatus}
                disabled={loading}
                className="border-gray-300 hover:border-gray-400 hover:bg-gray-50 px-6 py-3 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
                    <span>Checking Status...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-5 w-5 text-gray-600" />
                    <span>Refresh Status</span>
                  </>
                )}
              </Button>

              {error && (
                <div className="flex items-center text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg border border-red-200">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Server Status */}
              <div className={`bg-white rounded-lg p-6 border text-center transition-all duration-200 ${
                systemStatus?.server?.status === 'online' 
                  ? 'border-green-200 shadow-green-100' 
                  : 'border-red-200 shadow-red-100'
              } shadow-lg`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  systemStatus?.server?.status === 'online' 
                    ? 'bg-green-100' 
                    : 'bg-red-100'
                }`}>
                  <Activity className={`w-8 h-8 ${
                    systemStatus?.server?.status === 'online' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`} />
                </div>
                <h4 className="font-bold text-lg text-gray-800 mb-2">Server Status</h4>
                <div className={`font-bold text-lg mb-2 ${
                  systemStatus?.server?.status === 'online' 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {systemStatus?.server?.status === 'online' ? 'Online' : 
                   systemStatus?.server?.status === 'offline' ? 'Offline' : 'Unknown'}
                </div>
                {systemStatus?.server?.uptime && (
                  <div className="text-sm text-gray-600">
                    Uptime: {formatUptime(systemStatus.server.uptime)}
                  </div>
                )}
              </div>
              
              {/* Database Status */}
              <div className={`bg-white rounded-lg p-6 border text-center transition-all duration-200 ${
                systemStatus?.database?.connected 
                  ? 'border-blue-200 shadow-blue-100' 
                  : 'border-red-200 shadow-red-100'
              } shadow-lg`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  systemStatus?.database?.connected 
                    ? 'bg-blue-100' 
                    : 'bg-red-100'
                }`}>
                  <Database className={`w-8 h-8 ${
                    systemStatus?.database?.connected 
                      ? 'text-blue-600' 
                      : 'text-red-600'
                  }`} />
                </div>
                <h4 className="font-bold text-lg text-gray-800 mb-2">Database</h4>
                <div className={`font-bold text-lg mb-2 ${
                  systemStatus?.database?.connected 
                    ? 'text-blue-600' 
                    : 'text-red-600'
                }`}>
                  {systemStatus?.database?.connected ? 'Connected' : 
                   systemStatus?.database?.status === 'disconnected' ? 'Disconnected' : 'Unknown'}
                </div>
                {systemStatus?.database?.error && (
                  <div className="text-xs text-red-500 mt-2 bg-red-50 p-2 rounded">
                    {systemStatus.database.error}
                  </div>
                )}
              </div>
            </div>

            {/* Last Updated Info */}
            {systemStatus?.server?.timestamp && (
              <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-500">
                  Last updated: {new Date(systemStatus.server.timestamp).toLocaleString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuration Panel */}
        <Card className="border-0 shadow-md bg-white">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
              <div className="bg-gray-100 p-2 rounded-lg mr-3">
                <Settings className="w-5 h-5 text-gray-700" />
              </div>
              Advanced Configuration
            </CardTitle>
            <CardDescription className="text-gray-600">
              System-wide settings and administrative controls
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-gray-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Coming Soon</h4>
              <p className="text-gray-600 mb-4">
                Advanced system settings and configuration options will be available in future updates.
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-600">
                <span className="bg-gray-200 px-3 py-1 rounded-full">User Management</span>
                <span className="bg-gray-200 px-3 py-1 rounded-full">Security Settings</span>
                <span className="bg-gray-200 px-3 py-1 rounded-full">System Preferences</span>
                <span className="bg-gray-200 px-3 py-1 rounded-full">API Configuration</span>
              </div>
            </div>
          </CardContent>
        </Card>
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <Link
              to="/dashboard"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors py-2 px-4 rounded-lg hover:bg-white border border-gray-200"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="font-medium">Back to Dashboard</span>
            </Link>
            
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
                <div className="flex items-center text-sm text-gray-600">
                  <Shield className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Administrator Access</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Admin Control Center
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive administrative tools for system management and monitoring
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
            <div className="flex flex-col sm:flex-row gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-gray-900 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon className={`w-5 h-5 ${
                    activeTab === tab.id ? "text-white" : "text-gray-500"
                  }`} />
                  <div className="text-left hidden sm:block">
                    <div className="font-semibold">{tab.label}</div>
                    <div className={`text-xs ${
                      activeTab === tab.id ? "text-gray-300" : "text-gray-500"
                    }`}>
                      {tab.description}
                    </div>
                  </div>
                  <span className="sm:hidden">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="transition-all duration-300 ease-in-out">
          {getActiveTabContent()}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center text-sm text-gray-600">
                <Settings className="w-4 h-4 mr-2 text-gray-400" />
                <span>Administrative tools are restricted to authorized personnel only</span>
              </div>
              <Link
                to="/dashboard"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                <Home className="w-4 h-4 mr-2" />
                <span>Return to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
