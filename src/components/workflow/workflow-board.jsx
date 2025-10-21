import { useEffect, useState } from "react";
import { WorkflowProvider } from "./context/WorkflowContext";
import { workflowCategories } from "./constants/workflow-categories";
import { CategorySection } from "./components/CategorySection";
import { ModalManager } from "./components/ModalManager";

export function WorkflowBoard({
  service,
  currentUserRole,
  onStartAction,
  dateString,
}) {
  // Normalize the user role for consistent handling
  const normalizedRole =
    typeof currentUserRole === "string"
      ? currentUserRole
      : currentUserRole?.id || "guest";

  // State for loading indicator
  const [isLoading, setIsLoading] = useState(false);
  
  // State for refresh key to trigger data reload
  const [refreshKey, setRefreshKey] = useState(0);

  // Smart polling - adjusts based on activity and focus
  useEffect(() => {
    let interval;
    let isPageVisible = !document.hidden;
    
    const startPolling = (intervalTime = 10000) => {
      if (interval) clearInterval(interval);
      
      interval = setInterval(() => {
        if (!document.hidden) { // Only poll when page is visible
          setRefreshKey(prev => prev + 1);
        }
      }, intervalTime);
    };

    // Start with 10-second polling
    startPolling(10000);

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden;
      if (isPageVisible) {
        // Page became visible, refresh immediately and use faster polling
        setRefreshKey(prev => prev + 1);
        startPolling(10000); // 10 seconds when active
      } else {
        // Page hidden, use slower polling to save resources
        startPolling(30000); // 30 seconds when hidden
      }
    };

    // Handle window focus for immediate refresh
    const handleFocus = () => {
      if (!document.hidden) {
        setRefreshKey(prev => prev + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Manual refresh function
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    // For debugging purposes only
    // console.log("Current user role object:", currentUserRole);
    // console.log("Current user role (normalized):", normalizedRole);
    // console.log("Current date string:", dateString);
  }, [currentUserRole, normalizedRole, dateString]);

  // Show loading state when date changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500); // Short timeout for smoother UI transitions

    return () => clearTimeout(timer);
  }, [dateString]);

  return (
    <WorkflowProvider
      service={service}
      currentUserRole={normalizedRole}
      onStartAction={onStartAction}
      dateString={dateString}
      refreshKey={refreshKey}
    >
      <div className="space-y-3 md:space-y-4">
        {/* Refresh button */}
        <div className="flex justify-end">
          <button 
            onClick={handleRefresh}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center space-x-1"
            title="Refresh workflow data"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>

        {/* Loading indicator */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-sm text-gray-600">
              Loading workflow data...
            </span>
          </div>
        ) : (
          <>
            {/* Workflow categories */}
            {workflowCategories.map((category) => (
              <CategorySection key={category.id} category={category} />
            ))}

            {/* All modals */}
            <ModalManager />
          </>
        )}
      </div>
    </WorkflowProvider>
  );
}
