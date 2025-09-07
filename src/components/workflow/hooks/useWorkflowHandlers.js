// src/components/workflow/hooks/useWorkflowHandlers.js
import { useWorkflow } from "../context/WorkflowContext";

export const useWorkflowHandlers = () => {
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
    onStartAction,
  } = useWorkflow();

  // Handle QR code upload simulation
  const handleQrCodeAction = (stage) => {
    if (stage === "upload") {
      // Open the QR code upload modal instead of directly changing status
      setIsQrCodeModalOpen(true);
    } else {
      onStartAction && onStartAction("qrcode");
    }
  };

  // This function will handle sermon submission from the modal
  const handleSermonSubmit = (sermonData) => {
    // Here you would handle the saved sermon
    console.log("Sermon submitted:", sermonData);

    // Update the local completed tasks state
    setCompletedTasks((prev) => ({
      ...prev,
      sermon: "completed",
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
  const handleDocumentSubmit = (documentData) => {
    // Here you would handle the saved document
    console.log("Document submitted:", documentData);

    // Update the local completed tasks state
    setCompletedTasks((prev) => ({
      ...prev,
      [documentData.documentType]: "completed",
      // Store the actual document data if needed
      [`${documentData.documentType}Data`]: documentData,
    }));

    // Close the document modal
    setIsDocumentModalOpen(false);

    // Update the service status for this task if needed
    if (onStartAction) {
      onStartAction(`${documentData.documentType}-completed`);
    }

    // Show a success message
    alert(`${documentData.documentTitle} has been saved successfully!`);
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

    // Get document links from context if available
    const documentLinks = completedTasks?.documentLinks || {
      // Default Google Drive links for each document type
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
    };

    // Get the document name for the alert
    const documentTypes = {
      concept: "Concept Document",
      final: "Final Liturgy",
      sermon: "Sermon",
      qrcode: "QR Code",
      slides: "Presentation Slides",
      music: "Music Files",
    };

    // Get the document URL
    const documentUrl = documentLinks[taskId];

    if (documentUrl) {
      // Open the document in a new tab
      window.open(documentUrl, "_blank");

      // Don't show alert when clicking icon, only when clicking view button
      if (!["concept", "sermon", "final", "slides"].includes(taskId)) {
        alert(`Opening ${documentTypes[taskId] || taskId} in Google Drive`);
      }
    } else {
      // Fallback to just showing an alert
      alert(
        `No Google Drive link available for ${documentTypes[taskId] || taskId}`
      );
    }

    // If you need to call the parent handler
    onStartAction && onStartAction(`view-${taskId}`);
  };

  // Handle pastor editing document
  const handlePastorEdit = (taskId) => {
    console.log(`Pastor editing document: ${taskId}`);

    // Get document links from context if available
    const documentLinks = completedTasks?.documentLinks || {
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
    };

    // Get document types
    const documentTypes = {
      concept: "Concept Document",
      final: "Final Liturgy",
      sermon: "Sermon",
      qrcode: "QR Code",
      slides: "Presentation Slides",
    };

    // Get the document URL
    const documentUrl = documentLinks[taskId];

    if (documentUrl) {
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
            handlePastorNotifyTeams(taskId);
          }
        },
        { once: true }
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

    // Update the local state to store the slides data
    setCompletedTasks((prev) => ({
      ...prev,
      slides: "completed",
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

    // Update the local state to store the music data
    setCompletedTasks((prev) => ({
      ...prev,
      music: "completed",
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
  };
};
