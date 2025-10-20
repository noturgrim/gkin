// src/components/workflow/hooks/useWorkflowHandlers.js
import { useState } from "react";
import { useWorkflow } from "../context/WorkflowContext";

export const useWorkflowHandlers = () => {
  // Loading states
  const [loadingStates, setLoadingStates] = useState({
    documentEdit: false,
    documentDelete: false,
    documentSave: false,
    conceptDocument: false,
  });

  const {
    setQrCodeStatus,
    completedTasks,
    setCompletedTasks,
    setIsDocumentModalOpen,
    setIsSermonModalOpen,
    setCurrentDocumentType,
    setIsSendToPastorModalOpen,
    setCurrentDocumentToSend,
    setIsSendToMusicModalOpen,
    setCurrentDocumentToSendMusic,
    setIsSermonUploadModalOpen,
    setIsPastorNotifyModalOpen,
    setCurrentDocumentToNotify,
    setIsLyricsModalOpen,
    setIsTranslationModalOpen,
    setCurrentLyrics,
    setIsViewTranslatedLyricsModalOpen,
    setIsSermonTranslationModalOpen,
    setCurrentSermon,
    setIsSlidesUploadModalOpen,
    setIsQrCodeModalOpen,
    setIsMusicUploadModalOpen,
    setIsEditDocumentLinkModalOpen,
    setDocumentToEdit,
    onStartAction,
    updateTaskStatus,
    deleteDocumentLink,
    dateString,
  } = useWorkflow();

  // Handle QR code upload simulation
  const handleQrCodeAction = (stage) => {
    if (stage === "upload") {
      // Open the QR code upload modal instead of directly changing status
      setIsQrCodeModalOpen(true);
    } else if (stage === "complete") {
      // Mark the QR code task as completed
      updateTaskStatus(
        "qrcode",
        "completed",
        completedTasks?.documentLinks?.qrcode
      );
      setQrCodeStatus("completed");
      onStartAction && onStartAction("qrcode");
    } else {
      onStartAction && onStartAction("qrcode");
    }
  };

  // This function will handle sermon submission from the modal
  const handleSermonSubmit = (sermonData) => {
    // Here you would handle the saved sermon
    console.log("Sermon submitted:", sermonData);

    // Update the task status in the backend
    updateTaskStatus(
      "sermon",
      "completed",
      completedTasks?.documentLinks?.sermon,
      "pastor"
    );

    // Update the local completed tasks state
    setCompletedTasks((prev) => ({
      ...prev,
      sermon: {
        status: "completed",
        documentLink: prev?.documentLinks?.sermon,
        assignedTo: "pastor",
      },
      // Store the actual sermon data if needed
      sermonData: sermonData,
    }));

    // Close the sermon modal
    setIsSermonModalOpen(false);

    // Update the service status for this task if needed
    if (onStartAction) {
      onStartAction(`sermon-completed`);
    }

    // Show a success message
    alert(`Sermon "${sermonData.sermonTitle}" has been saved successfully!`);
  };

  // This function will handle document submission from the modal
  const handleDocumentSubmit = async (documentData) => {
    // Here you would handle the saved document
    console.log("Document submitted:", documentData);

    // Set loading state for concept document specifically
    if (documentData.documentType === "concept") {
      setLoadingStates((prev) => ({ ...prev, conceptDocument: true }));
    }

    try {
      // Get the document link from completedTasks or from the submitted data
      const documentLink =
        completedTasks?.documentLinks?.[documentData.documentType] ||
        documentData?.documentLink;

      // Update the task status in the backend
      await updateTaskStatus(
        documentData.documentType,
        "completed",
        documentLink,
        "liturgy"
      );

      // Update the local completed tasks state
      setCompletedTasks((prev) => ({
        ...prev,
        [documentData.documentType]: {
          status: "completed",
          documentLink: documentLink,
          assignedTo: "liturgy",
          updatedAt: new Date().toISOString(),
          updatedBy: "liturgy",
        },
        // Store the actual document data if needed
        [`${documentData.documentType}Data`]: documentData,
      }));

      // Update the service status for this task if needed
      if (onStartAction) {
        onStartAction(`${documentData.documentType}-completed`);
      }

      // Return success - no alert needed as the modal already shows loading state
      return true;
    } catch (error) {
      console.error(
        `Error saving ${documentData.documentType} document:`,
        error
      );
      return false;
    } finally {
      // Reset loading state
      if (documentData.documentType === "concept") {
        setLoadingStates((prev) => ({ ...prev, conceptDocument: false }));
      }
    }
  };

  // Handle sending document to pastor
  const handleSendToPastor = (taskId) => {
    console.log(`Preparing to send document: ${taskId} to pastor`);
    setCurrentDocumentToSend(taskId);
    setIsSendToPastorModalOpen(true);
  };

  // Handle submission from send to pastor modal
  const handleSendToPastorSubmit = (emailData) => {
    console.log("Sending document to pastor:", emailData);

    // Here you would typically make an API call to send the email

    // Show success message
    alert(`Document sent to ${emailData.email}!`);

    // Close the modal
    setIsSendToPastorModalOpen(false);

    // Update the status if needed
    if (onStartAction) {
      onStartAction(`${emailData.documentType}-sent-to-pastor`);
    }
  };

  // Handle sending document to music team
  const handleSendToMusic = (taskId) => {
    console.log(`Preparing to send document: ${taskId} to music team`);
    setCurrentDocumentToSendMusic(taskId);
    setIsSendToMusicModalOpen(true);
  };

  // Handle submission from send to music modal
  const handleSendToMusicSubmit = (emailData) => {
    console.log("Sending document to music team:", emailData);

    // Here you would typically make an API call to send the email

    // Show success message
    alert(`Document sent to music team at ${emailData.email}!`);

    // Close the modal
    setIsSendToMusicModalOpen(false);

    // Update the status if needed
    if (onStartAction) {
      onStartAction(`${emailData.documentType}-sent-to-music`);
    }
  };

  // Add this function after your other handler functions
  const handleUploadSermon = (taskId) => {
    console.log(`Upload sermon for task: ${taskId}`);
    setIsSermonUploadModalOpen(true);
  };

  // Add this handler for sermon upload submission
  const handleSermonUploadSubmit = (sermonData) => {
    console.log("Sermon upload submitted:", sermonData);

    // Update the local completed tasks state
    setCompletedTasks((prev) => ({
      ...prev,
      sermon: "completed",
      // Store the actual sermon data
      sermonData: sermonData,
    }));

    // Close the upload modal
    setIsSermonUploadModalOpen(false);

    // Update the service status for this task if needed
    if (onStartAction) {
      onStartAction(`sermon-uploaded`);
    }

    // Show a success message
    alert(`Sermon "${sermonData.sermonTitle}" has been uploaded successfully!`);
  };

  // Update your handleActionStart function to remove role restrictions
  const handleActionStart = (taskId) => {
    console.log(`Action started for task: ${taskId}`);

    // For sermon task, open the sermon upload modal instead
    if (taskId === "sermon") {
      setIsSermonUploadModalOpen(true);
    }
    // For document creation tasks, open the document modal (for anyone)
    else if (taskId === "concept" || taskId === "final") {
      setCurrentDocumentType(taskId);
      setIsDocumentModalOpen(true);
    } else {
      // For other actions, use the original handler
      onStartAction && onStartAction(taskId);
    }
  };

  // Handle document viewing
  const handleViewDocument = (taskId) => {
    console.log(`Viewing document: ${taskId}`);

    // Get the document name for the alert
    const documentTypes = {
      concept: "Concept Document",
      final: "Final Liturgy",
      sermon: "Sermon",
      qrcode: "QR Code",
      slides: "Presentation Slides",
      music: "Music Files",
    };

    // Get the document link from the task status data
    let documentUrl;

    if (completedTasks[taskId] && completedTasks[taskId].documentLink) {
      // Get from task status data (from backend)
      documentUrl = completedTasks[taskId].documentLink;
      console.log(`Using document link from task status: ${documentUrl}`);
    } else if (
      completedTasks?.documentLinks &&
      completedTasks.documentLinks[taskId]
    ) {
      // Use links from the input
      documentUrl = completedTasks.documentLinks[taskId];
      console.log(`Using document link from input: ${documentUrl}`);
    } else {
      console.log(`No document link available for ${taskId}`);
      documentUrl = null;
    }

    if (documentUrl) {
      // Open the document in a new tab
      window.open(documentUrl, "_blank");

      // Don't show alert when clicking icon, only when clicking view button
      if (!["concept", "sermon", "final", "slides"].includes(taskId)) {
        alert(`Opening ${documentTypes[taskId] || taskId} in Google Drive`);
      }
    } else {
      // Show an alert when no document URL is available
      alert(
        `No document link available for ${
          documentTypes[taskId] || taskId
        }. Please provide a link first.`
      );
    }

    // If you need to call the parent handler
    onStartAction && onStartAction(`view-${taskId}`);
  };

  // Handle pastor editing document
  const handlePastorEdit = (taskId) => {
    console.log(`Pastor editing document: ${taskId}`);

    // Get document types
    const documentTypes = {
      concept: "Concept Document",
      final: "Final Liturgy",
      sermon: "Sermon",
      qrcode: "QR Code",
      slides: "Presentation Slides",
    };

    // Get the document link from the task status data
    let documentUrl;

    if (completedTasks[taskId] && completedTasks[taskId].documentLink) {
      // Get from task status data (from backend)
      documentUrl = completedTasks[taskId].documentLink;
      console.log(`Using document link from task status: ${documentUrl}`);
    } else if (
      completedTasks?.documentLinks &&
      completedTasks.documentLinks[taskId]
    ) {
      // Use links from the input
      documentUrl = completedTasks.documentLinks[taskId];
      console.log(`Using document link from input: ${documentUrl}`);
    } else {
      console.log(`No document link available for ${taskId}`);
      documentUrl = null;
    }

    if (documentUrl) {
      // Update task status to reflect pastor is reviewing
      updateTaskStatus(taskId, "in-progress", documentUrl, "pastor");

      // Open the document in a new tab
      window.open(documentUrl, "_blank");

      // Show a confirmation when window is refocused that they can notify teams when done
      window.addEventListener(
        "focus",
        function onFocus() {
          // Remove this listener so it only runs once
          window.removeEventListener("focus", onFocus);

          // Ask if they want to notify teams now
          const confirmed = window.confirm(
            `Have you finished editing the ${documentTypes[taskId]}? Would you like to notify the teams now?`
          );

          if (confirmed) {
            // Update task status to completed after pastor review
            updateTaskStatus(taskId, "completed", documentUrl, "pastor");

            handlePastorNotifyTeams(taskId);
          }
        },
        { once: true }
      );
    } else {
      // Show an alert when no document URL is available
      alert(
        `No document link available for ${
          documentTypes[taskId] || taskId
        }. Please provide a link first.`
      );
    }
  };

  // Handle pastor notifying teams after editing
  const handlePastorNotifyTeams = (taskId) => {
    console.log(`Pastor notifying teams about document: ${taskId}`);
    setCurrentDocumentToNotify(taskId);
    setIsPastorNotifyModalOpen(true);
  };

  // Handle submission from pastor notify modal
  const handlePastorNotifySubmit = (notificationData) => {
    console.log("Pastor sending notifications:", notificationData);

    // Here you would typically make an API call to send the emails

    // Show success message
    alert(
      `Notifications sent to teams about the ${notificationData.documentType}!`
    );

    // Close the modal
    setIsPastorNotifyModalOpen(false);

    // Update the status if needed
    if (onStartAction) {
      onStartAction(`${notificationData.documentType}-pastor-reviewed`);
    }
  };

  // Add these handler functions for lyrics and translations
  const handleAddLyrics = () => {
    console.log("Opening lyrics input modal");
    setIsLyricsModalOpen(true);
  };

  const handleLyricsSubmit = (lyricsData) => {
    console.log("Lyrics submitted:", lyricsData);

    // Update the local state to store the lyrics
    setCompletedTasks((prev) => ({
      ...prev,
      lyrics: "completed",
      lyricsData: lyricsData,
    }));

    // Close the modal
    setIsLyricsModalOpen(false);

    // Update the service status if needed
    if (onStartAction) {
      onStartAction("lyrics-added");
    }

    // Show a success message
    alert("Song lyrics have been saved successfully!");
  };

  const handleTranslateLyrics = () => {
    console.log("Opening translation modal");
    // Get the current lyrics data from the completedTasks
    const lyricsData = completedTasks?.lyricsData || { songs: [] };
    setCurrentLyrics(lyricsData);
    setIsTranslationModalOpen(true);
  };

  const handleViewTranslatedLyrics = () => {
    console.log("Opening view translated lyrics modal");
    // Get the current lyrics data and translation data from the completedTasks
    const lyricsData = completedTasks?.lyricsData || { songs: [] };
    const translationData = completedTasks?.translationData;

    // Combine the data for the view modal
    const combinedData = {
      songs: lyricsData.songs || [],
      translations: translationData?.translations || [],
    };

    setCurrentLyrics(combinedData);
    setIsViewTranslatedLyricsModalOpen(true);
  };

  const handleTranslationSubmit = (translationData) => {
    console.log("Translation submitted:", translationData);

    // Update the local state to store the translations
    setCompletedTasks((prev) => ({
      ...prev,
      "translate-liturgy": "completed",
      translationData: translationData,
    }));

    // Close the modal
    setIsTranslationModalOpen(false);

    // Update the service status if needed
    if (onStartAction) {
      onStartAction("lyrics-translated");
    }

    // Show a success message
    alert("Translations have been saved successfully!");
  };

  // Add this handler function for sermon translation
  const handleTranslateSermon = () => {
    console.log("Opening sermon translation modal");
    // Get the current sermon data from the completedTasks
    const sermonData = completedTasks?.sermonData || null;
    setCurrentSermon(sermonData);
    setIsSermonTranslationModalOpen(true);
  };

  // Add this handler for sermon translation submission
  const handleSermonTranslationSubmit = (translationData) => {
    console.log("Sermon translation submitted:", translationData);

    // Update the local state to store the translations
    setCompletedTasks((prev) => ({
      ...prev,
      "translate-sermon": "completed",
      sermonTranslationData: translationData,
    }));

    // Close the modal
    setIsSermonTranslationModalOpen(false);

    // Update the service status if needed
    if (onStartAction) {
      onStartAction("sermon-translated");
    }

    // Show a success message
    alert("Sermon translation has been saved successfully!");
  };

  // FOR DEMO ONLY: Add a function to simulate sermon creation
  const simulateSermonCreation = () => {
    setCompletedTasks((prev) => ({
      ...prev,
      sermon: "completed",
      sermonData: {
        sermonTitle: "Demo Sermon for Testing",
        sermonText:
          "This is a sample sermon text for testing the translation functionality. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        serviceDate: "2023-07-23",
        documentType: "sermon",
        documentTitle: "Sunday Service - Demo Sermon",
      },
    }));
    alert("Demo sermon created! Now translators can translate it.");
  };

  // FOR DEMO ONLY: Add a function to reset sermon status
  const resetSermonStatus = () => {
    setCompletedTasks((prev) => {
      const newState = { ...prev };
      delete newState.sermon;
      delete newState.sermonData;
      return newState;
    });
    alert("Sermon status has been reset for demo purposes.");
  };

  const handleUploadSlides = () => {
    console.log("Opening slides upload modal");
    setIsSlidesUploadModalOpen(true);
  };

  const handleSlidesUploadSubmit = (slidesData) => {
    console.log("Slides upload submitted:", slidesData);

    // Get the document link from completedTasks
    const documentLink =
      completedTasks?.documentLinks?.slides || slidesData?.documentLink;

    // Update the task status in the backend
    updateTaskStatus("slides", "completed", documentLink, "beamer");

    // Update the local state to store the slides data
    setCompletedTasks((prev) => ({
      ...prev,
      slides: {
        status: "completed",
        documentLink: documentLink,
        assignedTo: "beamer",
      },
      slidesData: slidesData,
    }));

    // Close the modal
    setIsSlidesUploadModalOpen(false);

    // Update the service status if needed
    if (onStartAction) {
      onStartAction("slides-uploaded");
    }

    // Show a success message
    alert(`Presentation "${slidesData.title}" has been uploaded successfully!`);
  };

  // Add a handler for QR code upload submission
  const handleQrCodeUploadSubmit = (qrCodeData) => {
    console.log("QR code upload submitted:", qrCodeData);

    // Set the QR code status to active first
    setQrCodeStatus("active");

    // Then simulate processing and set to completed
    setTimeout(() => {
      setQrCodeStatus("completed");

      // Update the completed tasks state
      setCompletedTasks((prev) => ({
        ...prev,
        qrcode: "completed",
        qrcodeData: qrCodeData,
      }));

      // Close the modal
      setIsQrCodeModalOpen(false);

      // Update the service status if needed
      if (onStartAction) {
        onStartAction("qrcode-uploaded");
      }

      // Show a success message
      alert(`QR Code "${qrCodeData.title}" has been uploaded successfully!`);
    }, 1500); // Simulate a short processing time
  };

  const handleUploadMusic = () => {
    console.log("Opening music upload modal");
    setIsMusicUploadModalOpen(true);
  };

  const handleMusicUploadSubmit = (musicData) => {
    console.log("Music upload submitted:", musicData);

    // Get the document link from completedTasks
    const documentLink =
      completedTasks?.documentLinks?.music || musicData?.documentLink;

    // Update the task status in the backend
    updateTaskStatus("music", "completed", documentLink, "music");

    // Update the local state to store the music data
    setCompletedTasks((prev) => ({
      ...prev,
      music: {
        status: "completed",
        documentLink: documentLink,
        assignedTo: "music",
      },
      musicData: musicData,
    }));

    // Close the modal
    setIsMusicUploadModalOpen(false);

    // Update the service status if needed
    if (onStartAction) {
      onStartAction("music-uploaded");
    }

    // Show a success message
    alert(`Music file "${musicData.title}" has been uploaded successfully!`);
  };

  // Handle opening the edit document link modal
  const handleEditDocumentLink = (taskId) => {
    console.log(`Opening edit document link modal for: ${taskId}`);

    // Set loading state
    setLoadingStates((prev) => ({ ...prev, documentEdit: true }));

    try {
      // Get the current document link and metadata
      const documentData = completedTasks[taskId] || {};

      // Set the document to edit
      setDocumentToEdit({
        taskId,
        documentLink: documentData.documentLink || "",
        metadata: {
          updatedAt: documentData.updatedAt,
          updatedBy: documentData.updatedBy,
        },
      });

      // Open the modal
      setIsEditDocumentLinkModalOpen(true);
    } finally {
      setLoadingStates((prev) => ({ ...prev, documentEdit: false }));
    }
  };

  // Handle saving an edited document link
  const handleSaveDocumentLink = async (taskId, newLink) => {
    console.log(`Saving document link for: ${taskId}`, newLink);

    // Set loading state
    setLoadingStates((prev) => ({ ...prev, documentSave: true }));

    try {
      // Get current status
      const currentStatus = completedTasks[taskId]?.status || "pending";
      const assignedTo = completedTasks[taskId]?.assignedTo;

      // Update the task with the new link
      const success = await updateTaskStatus(
        taskId,
        currentStatus,
        newLink,
        assignedTo
      );

      if (success) {
        // Show success message
        alert(`Document link for ${taskId} has been updated successfully!`);
      } else {
        // Show error message
        alert(`Failed to update document link for ${taskId}.`);
      }

      return success;
    } finally {
      setLoadingStates((prev) => ({ ...prev, documentSave: false }));
    }
  };

  // Handle completely deleting a workflow task
  const handleDeleteDocumentLink = async (taskId) => {
    console.log(`Completely deleting workflow task: ${taskId}`);

    // Set loading state
    setLoadingStates((prev) => ({ ...prev, documentDelete: true }));

    try {
      const success = await deleteDocumentLink(taskId);

      if (success) {
        // Show success message
        alert(`Task ${taskId} has been completely deleted from the database!`);

        // Call onStartAction to update any UI that depends on task status
        if (onStartAction) {
          onStartAction(`${taskId}-deleted`);
        }
      } else {
        // Show error message
        alert(`Failed to delete task ${taskId}.`);
      }

      return success;
    } finally {
      setLoadingStates((prev) => ({ ...prev, documentDelete: false }));
    }
  };

  return {
    handleQrCodeAction,
    handleSermonSubmit,
    handleDocumentSubmit,
    handleSendToPastor,
    handleSendToPastorSubmit,
    handleSendToMusic,
    handleSendToMusicSubmit,
    handleUploadSermon,
    handleSermonUploadSubmit,
    handleActionStart,
    handleViewDocument,
    handlePastorEdit,
    handlePastorNotifyTeams,
    handlePastorNotifySubmit,
    handleAddLyrics,
    handleLyricsSubmit,
    handleTranslateLyrics,
    handleViewTranslatedLyrics,
    handleTranslationSubmit,
    handleTranslateSermon,
    handleSermonTranslationSubmit,
    simulateSermonCreation,
    resetSermonStatus,
    handleUploadSlides,
    handleSlidesUploadSubmit,
    handleQrCodeUploadSubmit,
    handleUploadMusic,
    handleMusicUploadSubmit,
    handleEditDocumentLink,
    handleSaveDocumentLink,
    handleDeleteDocumentLink,
    loadingStates,
  };
};
