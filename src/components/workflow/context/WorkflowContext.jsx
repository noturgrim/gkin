// src/components/workflow/context/WorkflowContext.jsx
import { createContext, useState, useContext, useEffect } from "react";
import workflowService from "../../../services/workflowService";
import lyricsService from "../../../services/lyricsService";

const WorkflowContext = createContext();

export const useWorkflow = () => useContext(WorkflowContext);

export const WorkflowProvider = ({
  children,
  service,
  currentUserRole,
  onStartAction,
  dateString,
}) => {
  // State for loading status
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for QR code status
  const [qrCodeStatus, setQrCodeStatus] = useState("pending");

  // State for completed tasks
  const [completedTasks, setCompletedTasks] = useState({
    // Document links (empty by default, will be populated from input)
    documentLinks: {
      concept: "",
      sermon: "",
      final: "",
      qrcode: "",
      slides: "",
      music: "",
    },
  });

  // Modal states
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isSermonModalOpen, setIsSermonModalOpen] = useState(false);
  const [currentDocumentType, setCurrentDocumentType] = useState("concept");
  const [isSendToPastorModalOpen, setIsSendToPastorModalOpen] = useState(false);
  const [currentDocumentToSend, setCurrentDocumentToSend] = useState(null);
  const [isSendToMusicModalOpen, setIsSendToMusicModalOpen] = useState(false);
  const [currentDocumentToSendMusic, setCurrentDocumentToSendMusic] =
    useState(null);
  const [isSermonUploadModalOpen, setIsSermonUploadModalOpen] = useState(false);
  const [isPastorNotifyModalOpen, setIsPastorNotifyModalOpen] = useState(false);
  const [currentDocumentToNotify, setCurrentDocumentToNotify] = useState(null);
  const [isLyricsModalOpen, setIsLyricsModalOpen] = useState(false);
  const [isTranslationModalOpen, setIsTranslationModalOpen] = useState(false);
  const [currentLyrics, setCurrentLyrics] = useState(null);
  const [isViewTranslatedLyricsModalOpen, setIsViewTranslatedLyricsModalOpen] =
    useState(false);
  const [isSermonTranslationModalOpen, setIsSermonTranslationModalOpen] =
    useState(false);
  const [currentSermon, setCurrentSermon] = useState(null);
  const [isSlidesUploadModalOpen, setIsSlidesUploadModalOpen] = useState(false);
  const [isQrCodeModalOpen, setIsQrCodeModalOpen] = useState(false);
  const [isMusicUploadModalOpen, setIsMusicUploadModalOpen] = useState(false);
  const [isEditDocumentLinkModalOpen, setIsEditDocumentLinkModalOpen] =
    useState(false);
  const [isEditMusicLinksModalOpen, setIsEditMusicLinksModalOpen] =
    useState(false);
  const [documentToEdit, setDocumentToEdit] = useState(null);
  const [musicLinksToEdit, setMusicLinksToEdit] = useState(null);

  // Load workflow tasks for the current service
  useEffect(() => {
    const fetchWorkflowTasks = async () => {
      if (!dateString) return;

      setLoading(true);
      setError(null);

      // Reset QR code status when date changes
      setQrCodeStatus("pending");

      try {
        const response = await workflowService.getWorkflowTasks(dateString);

        // Also check if there are any translated lyrics for this date
        let hasTranslatedLyrics = false;
        try {
          const lyricsResponse = await lyricsService.getLyricsByDate(
            dateString
          );
          if (lyricsResponse && lyricsResponse.lyrics) {
            // Check if any lyrics have translations
            hasTranslatedLyrics = lyricsResponse.lyrics.some(
              (lyric) =>
                lyric.translation &&
                (lyric.translation.status === "completed" ||
                  lyric.translation.status === "approved")
            );
          }
        } catch (lyricsErr) {
          // If there's an error or no lyrics, we'll assume no translations
          console.log("No lyrics found or error fetching lyrics:", lyricsErr);
        }

        if (response && response.tasks) {
          // Reset completedTasks and only include tasks for the current date
          const tasks = {
            documentLinks: {}, // Keep an empty documentLinks object for backward compatibility
            ...response.tasks,
          };

          // If we have translated lyrics but the task isn't marked as completed,
          // mark it as completed
          if (
            hasTranslatedLyrics &&
            (!tasks["translate_lyrics"] ||
              tasks["translate_lyrics"].status !== "completed")
          ) {
            tasks["translate_lyrics"] = {
              status: "completed",
              updatedAt: new Date().toISOString(),
              updatedBy: "translator",
            };
          }

          setCompletedTasks(tasks);

          // Special handling for qrcode status
          if (response.tasks.qrcode) {
            setQrCodeStatus(response.tasks.qrcode.status);
          } else {
            // Reset QR code status to pending when there's no QR code task for this date
            setQrCodeStatus("pending");
          }
        }
      } catch (err) {
        console.error("Error fetching workflow tasks:", err);
        setError("Failed to load workflow tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflowTasks();
  }, [dateString]);

  // Update task status in the backend
  const updateTaskStatus = async (taskId, status, documentLink, assignedTo) => {
    if (!dateString) return;

    try {
      const response = await workflowService.updateTaskStatus(
        dateString,
        taskId,
        status,
        documentLink,
        assignedTo
      );

      // Get current timestamp for local updates
      const updatedAt = new Date().toISOString();
      const userRole =
        typeof currentUserRole === "string"
          ? currentUserRole
          : currentUserRole?.id || currentUserRole?.role?.id || "user";

      // Update local state with metadata
      setCompletedTasks((prevState) => ({
        ...prevState,
        [taskId]: {
          ...prevState[taskId],
          status,
          documentLink,
          assignedTo: assignedTo || prevState[taskId]?.assignedTo,
          updatedAt,
          updatedBy: userRole,
        },
      }));

      // Special handling for qrcode status
      if (taskId === "qrcode") {
        setQrCodeStatus(status);
      }

      // Fetch the updated data to ensure we have the correct server-side metadata
      const refreshedData = await workflowService.getWorkflowTasks(dateString);
      if (refreshedData && refreshedData.tasks) {
        // Only update the specific task that was changed, preserve other tasks for current date
        if (refreshedData.tasks[taskId]) {
          setCompletedTasks((prevState) => ({
            ...prevState,
            [taskId]: {
              ...prevState[taskId],
              ...refreshedData.tasks[taskId],
            },
          }));
        }
      }

      return true;
    } catch (err) {
      console.error(`Error updating task ${taskId} status:`, err);
      return false;
    }
  };

  // Helper function to check role
  const hasRole = (roleId) => {
    if (!currentUserRole) return false;

    // Handle string roles (most common case now with the new backend)
    if (typeof currentUserRole === "string") {
      return currentUserRole.toLowerCase() === roleId.toLowerCase();
    }

    // Handle object roles (legacy format)
    if (typeof currentUserRole === "object") {
      // Check direct id
      if (
        currentUserRole.id &&
        currentUserRole.id.toLowerCase() === roleId.toLowerCase()
      ) {
        return true;
      }

      // Check nested role object (old format)
      if (
        currentUserRole.role &&
        typeof currentUserRole.role === "object" &&
        currentUserRole.role.id &&
        currentUserRole.role.id.toLowerCase() === roleId.toLowerCase()
      ) {
        return true;
      }
    }

    return false;
  };

  // Role checks
  const isPastor = hasRole("pastor");
  const isLiturgyMaker = hasRole("liturgy");
  const isTreasurer = hasRole("treasurer");

  // Completely delete a workflow task
  const deleteDocumentLink = async (taskId) => {
    if (!dateString) return false;

    try {
      // Use the delete endpoint to completely remove the task from the database
      await workflowService.deleteWorkflowTask(dateString, taskId);

      // Update local state by removing the task
      setCompletedTasks((prevState) => {
        // Create a new state object without the task
        const newState = { ...prevState };

        // If the task exists in the state, remove it completely
        if (newState[taskId]) {
          delete newState[taskId];
        }

        return newState;
      });

      // Special handling for qrcode status
      if (taskId === "qrcode") {
        setQrCodeStatus("pending");
      }

      return true;
    } catch (err) {
      console.error(`Error deleting workflow task ${taskId}:`, err);
      return false;
    }
  };

  // Task status function
  const getTaskStatus = (taskId) => {
    // Special handling for qrcode task to use local state
    if (taskId === "qrcode") {
      return qrCodeStatus;
    }

    // Check our local completedTasks state first
    if (
      completedTasks &&
      completedTasks[taskId] &&
      completedTasks[taskId].status
    ) {
      return completedTasks[taskId].status;
    }

    return "pending";
  };

  // Check if the current user can work on this category
  const isUserCategory = (roleStr) => {
    if (!roleStr || !currentUserRole) return false;

    // Handle when currentUserRole is an object with an id property
    const userRoleId =
      typeof currentUserRole === "object" && currentUserRole.role
        ? currentUserRole.role.id.toLowerCase() // Access the nested role object
        : typeof currentUserRole === "object" && currentUserRole.id
        ? currentUserRole.id.toLowerCase()
        : currentUserRole.toLowerCase();

    return roleStr.toLowerCase().includes(userRoleId);
  };

  const value = {
    // States
    loading,
    error,
    qrCodeStatus,
    setQrCodeStatus,
    completedTasks,
    setCompletedTasks,
    isDocumentModalOpen,
    setIsDocumentModalOpen,
    isSermonModalOpen,
    setIsSermonModalOpen,
    currentDocumentType,
    setCurrentDocumentType,
    isSendToPastorModalOpen,
    setIsSendToPastorModalOpen,
    currentDocumentToSend,
    setCurrentDocumentToSend,
    isSendToMusicModalOpen,
    setIsSendToMusicModalOpen,
    currentDocumentToSendMusic,
    setCurrentDocumentToSendMusic,
    isSermonUploadModalOpen,
    setIsSermonUploadModalOpen,
    isPastorNotifyModalOpen,
    setIsPastorNotifyModalOpen,
    currentDocumentToNotify,
    setCurrentDocumentToNotify,
    isLyricsModalOpen,
    setIsLyricsModalOpen,
    isTranslationModalOpen,
    setIsTranslationModalOpen,
    currentLyrics,
    setCurrentLyrics,
    isViewTranslatedLyricsModalOpen,
    setIsViewTranslatedLyricsModalOpen,
    isSermonTranslationModalOpen,
    setIsSermonTranslationModalOpen,
    currentSermon,
    setCurrentSermon,
    isSlidesUploadModalOpen,
    setIsSlidesUploadModalOpen,
    isQrCodeModalOpen,
    setIsQrCodeModalOpen,
    isMusicUploadModalOpen,
    setIsMusicUploadModalOpen,
    isEditDocumentLinkModalOpen,
    setIsEditDocumentLinkModalOpen,
    isEditMusicLinksModalOpen,
    setIsEditMusicLinksModalOpen,
    documentToEdit,
    setDocumentToEdit,
    musicLinksToEdit,
    setMusicLinksToEdit,

    // Helper functions
    hasRole,
    isPastor,
    isLiturgyMaker,
    isTreasurer,
    getTaskStatus,
    isUserCategory,
    updateTaskStatus,
    deleteDocumentLink,

    // External props
    onStartAction,
    service,
    currentUserRole,
    dateString,
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};
