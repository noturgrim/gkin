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
    >
      <div className="space-y-3 md:space-y-4">
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
