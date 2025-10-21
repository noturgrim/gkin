import api from "./api";
import workflowService from "./workflowService";

/**
 * Service for fetching recent updates from various sources
 */
const recentUpdatesService = {
  /**
   * Get recent workflow updates
   * @param {number} limit - Maximum number of updates to return
   * @returns {Promise} Promise with recent workflow updates
   */
  getRecentWorkflowUpdates: async (limit = 5) => {
    try {
      // Get all workflow tasks with their update timestamps
      const services = await workflowService.getAllWorkflowTasks();

      // Flatten and transform workflow tasks into update objects
      const updates = [];

      services.forEach((service) => {
        const { dateString, tasks } = service;

        Object.entries(tasks).forEach(([taskId, task]) => {
          // Skip pending tasks - only show completed, in-progress, or skipped tasks
          if (task.status && task.updatedAt && task.status !== "pending") {
            const taskType = taskId.split("-")[0]; // Extract task type from ID

            updates.push({
              id: `workflow-${dateString}-${taskId}`,
              type: "workflow",
              title: getWorkflowUpdateTitle(task.status, taskType),
              description: `${formatTaskType(taskType)} for ${formatDateString(
                dateString
              )}`,
              timestamp: task.updatedAt,
              user: task.completedBy?.name || task.assignedTo || "System",
              role: task.updatedBy || "",
              icon: getWorkflowIcon(task.status, taskType),
              color: getWorkflowColor(task.status),
              dateString,
              taskId,
            });
          }
        });
      });

      // Sort by timestamp (newest first) and limit
      return updates
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
    } catch (error) {
      console.error("Error fetching recent workflow updates:", error);
      throw error;
    }
  },

  /**
   * Get all recent updates from all sources
   * @param {number} limit - Maximum number of updates to return
   * @returns {Promise} Promise with all recent updates
   */
  getAllRecentUpdates: async (limit = 5) => {
    try {
      // Currently only workflow updates are implemented
      // In the future, we can add other update sources here
      const workflowUpdates =
        await recentUpdatesService.getRecentWorkflowUpdates(limit);

      return workflowUpdates;
    } catch (error) {
      console.error("Error fetching all recent updates:", error);
      throw error;
    }
  },
};

/**
 * Helper function to get a title for a workflow update
 * @param {string} status - Task status
 * @param {string} taskType - Type of task
 * @returns {string} Update title
 */
function getWorkflowUpdateTitle(status, taskType) {
  switch (status) {
    case "completed":
      return `${formatTaskType(taskType)} Completed`;
    case "in-progress":
      return `${formatTaskType(taskType)} In Progress`;
    case "pending":
      return `${formatTaskType(taskType)} Pending`;
    case "skipped":
      return `${formatTaskType(taskType)} Skipped`;
    default:
      return `${formatTaskType(taskType)} Updated`;
  }
}

/**
 * Helper function to format task type for display
 * @param {string} taskType - Raw task type
 * @returns {string} Formatted task type
 */
function formatTaskType(taskType) {
  // Map task types to readable names
  const taskTypeMap = {
    concept: "Concept Document",
    sermon: "Sermon",
    translation: "Translation",
    music: "Music",
    slides: "Slides",
    qrcode: "QR Code",
    document: "Document",
    review: "Review",
    message: "Message",
    deadline: "Deadline",
  };

  return (
    taskTypeMap[taskType] ||
    taskType.charAt(0).toUpperCase() + taskType.slice(1)
  );
}

/**
 * Helper function to format date string for display
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Formatted date
 */
function formatDateString(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return dateString;
  }
}

/**
 * Helper function to get icon for workflow update
 * @param {string} status - Task status
 * @param {string} taskType - Type of task
 * @returns {string} Icon name
 */
function getWorkflowIcon(status, taskType) {
  // Return appropriate icon based on task type and status
  switch (taskType) {
    case "concept":
    case "document":
      return "FileText";
    case "sermon":
      return "BookOpen";
    case "translation":
      return "Languages";
    case "music":
      return "Music";
    case "slides":
      return "Presentation";
    case "qrcode":
      return "QrCode";
    case "review":
      return "CheckCircle";
    case "message":
      return "MessageSquare";
    case "deadline":
      return "Calendar";
    default:
      return status === "completed" ? "CheckCircle" : "ArrowRight";
  }
}

/**
 * Helper function to get color for workflow update
 * @param {string} status - Task status
 * @returns {string} Color name
 */
function getWorkflowColor(status) {
  switch (status) {
    case "completed":
      return "green";
    case "in-progress":
      return "blue";
    case "pending":
      return "gray";
    case "skipped":
      return "orange";
    default:
      return "gray";
  }
}

export default recentUpdatesService;
