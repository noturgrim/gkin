// src/components/workflow/context/WorkflowContext.jsx
import { createContext, useState, useContext, useEffect } from "react";
import workflowService from "../../../services/workflowService";

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
    // Default document links
    documentLinks: {
      concept:
        "https://docs.google.com/document/d/1GZkHMPLQnlxQQVQHPZavvPFRRRDCyaHABt_8KlhQxYE/edit",
      sermon:
        "https://docs.google.com/document/d/1pMnDsVb7CtcFm2SJE4N1ZHmzgzwcyYQcV2V5Q7JX5oU/edit",
      final:
        "https://docs.google.com/document/d/1aN8vgWk2x6KYYUrWWqAYhDKJBq0Ot-VZNQQ3AmJUEgc/edit",
      qrcode:
        "https://drive.google.com/file/d/1Qr5wgtaKGQZhMWQEw2MgzGcVhBTTdJLk/view",
      slides:
        "https://docs.google.com/presentation/d/1mKQz8oU2QYRdvmJBxLiMNVnWkCkE4MUjea8Z9UzUQMI/edit",
      music:
        "https://drive.google.com/drive/folders/1xKjfMKqw2J7Z8QX5tY2L3EcDXHWA8nP9",
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

  // Load workflow tasks for the current service
  useEffect(() => {
    const fetchWorkflowTasks = async () => {
      if (!dateString) return;

      setLoading(true);
      setError(null);

      try {
        const response = await workflowService.getWorkflowTasks(dateString);

        if (response && response.tasks) {
          setCompletedTasks((prevState) => ({
            ...prevState,
            ...response.tasks,
          }));

          // Special handling for qrcode status
          if (response.tasks.qrcode) {
            setQrCodeStatus(response.tasks.qrcode.status);
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
  const updateTaskStatus = async (taskId, status, documentLink) => {
    if (!dateString) return;

    try {
      await workflowService.updateTaskStatus(
        dateString,
        taskId,
        status,
        documentLink
      );

      // Update local state
      setCompletedTasks((prevState) => ({
        ...prevState,
        [taskId]: {
          ...prevState[taskId],
          status,
          documentLink,
        },
      }));

      // Special handling for qrcode status
      if (taskId === "qrcode") {
        setQrCodeStatus(status);
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

    // Helper functions
    hasRole,
    isPastor,
    isLiturgyMaker,
    isTreasurer,
    getTaskStatus,
    isUserCategory,
    updateTaskStatus,

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
