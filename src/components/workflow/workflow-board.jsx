import { useEffect } from "react";
import { WorkflowProvider } from "./context/WorkflowContext";
import { workflowCategories } from "./constants/workflow-categories";
import { CategorySection } from "./components/CategorySection";
import { DemoPanel } from "./components/DemoPanel";
import { ModalManager } from "./components/ModalManager";

export function WorkflowBoard({ service, currentUserRole, onStartAction }) {
  // Normalize the user role for consistent handling
  const normalizedRole = typeof currentUserRole === 'string' 
    ? currentUserRole 
    : currentUserRole?.id || 'guest';
    
  useEffect(() => {
    // For debugging purposes only
    console.log("Current user role object:", currentUserRole);
    console.log("Current user role (normalized):", normalizedRole);
  }, [currentUserRole, normalizedRole]);

  return (
    <WorkflowProvider
      service={service}
      currentUserRole={normalizedRole}
      onStartAction={onStartAction}
    >
      <div className="space-y-3 md:space-y-4">
        {/* Demo panels for different roles */}
        <DemoPanel />

        {/* Workflow categories */}
        {workflowCategories.map((category) => (
          <CategorySection key={category.id} category={category} />
        ))}

        {/* All modals */}
        <ModalManager />
      </div>
    </WorkflowProvider>
  );
}
