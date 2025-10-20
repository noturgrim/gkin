// src/components/workflow/components/ModalManager.jsx
import { DocumentCreatorModal } from "../../document-creator-modal";
import { SendToPastorModal } from "../../send-to-pastor-modal";
import { SendToMusicModal } from "../../send-to-music-modal";
import { SermonUploadModal } from "../../sermon-upload-modal";
import { PastorNotifyModal } from "../../pastor-notify-modal";
import { LyricsInputModal } from "../../lyrics-input-modal";
import { TranslationModal } from "../../translation-modal";
import { ViewTranslatedLyricsModal } from "../../view-translated-lyrics-modal";
import { SermonTranslationModal } from "../../sermon-translation-modal";
import { SlidesUploadModal } from "../../slides-upload-modal";
import { QrCodeUploadModal } from "../../qr-code-upload-modal";
import { MusicUploadModal } from "../../music-upload-modal";
import { EditDocumentLinkModal } from "./EditDocumentLinkModal";

import { useWorkflow } from "../context/WorkflowContext";
import { useWorkflowHandlers } from "../hooks/useWorkflowHandlers";

export const ModalManager = () => {
  const {
    isDocumentModalOpen,
    setIsDocumentModalOpen,
    isSermonModalOpen,
    setIsSermonModalOpen,
    currentDocumentType,
    isSendToPastorModalOpen,
    setIsSendToPastorModalOpen,
    currentDocumentToSend,
    isSendToMusicModalOpen,
    setIsSendToMusicModalOpen,
    currentDocumentToSendMusic,
    isSermonUploadModalOpen,
    setIsSermonUploadModalOpen,
    isPastorNotifyModalOpen,
    setIsPastorNotifyModalOpen,
    currentDocumentToNotify,
    isLyricsModalOpen,
    setIsLyricsModalOpen,
    isTranslationModalOpen,
    setIsTranslationModalOpen,
    currentLyrics,
    isViewTranslatedLyricsModalOpen,
    setIsViewTranslatedLyricsModalOpen,
    isSermonTranslationModalOpen,
    setIsSermonTranslationModalOpen,
    currentSermon,
    isSlidesUploadModalOpen,
    setIsSlidesUploadModalOpen,
    isQrCodeModalOpen,
    setIsQrCodeModalOpen,
    completedTasks,
    isMusicUploadModalOpen,
    setIsMusicUploadModalOpen,
    isEditDocumentLinkModalOpen,
    setIsEditDocumentLinkModalOpen,
    documentToEdit,
    setDocumentToEdit,
  } = useWorkflow();

  const {
    handleDocumentSubmit,
    handleSermonSubmit,
    handleSendToPastorSubmit,
    handleSendToMusicSubmit,
    handleSermonUploadSubmit,
    handlePastorNotifySubmit,
    handleLyricsSubmit,
    handleTranslationSubmit,
    handleSermonTranslationSubmit,
    handleSlidesUploadSubmit,
    handleQrCodeUploadSubmit,
    handleMusicUploadSubmit,
    handleSaveDocumentLink,
    handleDeleteDocumentLink,
  } = useWorkflowHandlers();

  return (
    <>
      <DocumentCreatorModal
        isOpen={isDocumentModalOpen}
        onClose={() => setIsDocumentModalOpen(false)}
        onSubmit={handleDocumentSubmit}
        documentType={currentDocumentType}
      />

      <SendToPastorModal
        isOpen={isSendToPastorModalOpen}
        onClose={() => setIsSendToPastorModalOpen(false)}
        onSubmit={handleSendToPastorSubmit}
        documentType={currentDocumentToSend}
      />

      <SendToMusicModal
        isOpen={isSendToMusicModalOpen}
        onClose={() => setIsSendToMusicModalOpen(false)}
        onSubmit={handleSendToMusicSubmit}
        documentType={currentDocumentToSendMusic}
      />

      <SermonUploadModal
        isOpen={isSermonUploadModalOpen}
        onClose={() => setIsSermonUploadModalOpen(false)}
        onSubmit={handleSermonUploadSubmit}
      />

      <PastorNotifyModal
        isOpen={isPastorNotifyModalOpen}
        onClose={() => setIsPastorNotifyModalOpen(false)}
        onSubmit={handlePastorNotifySubmit}
        documentType={currentDocumentToNotify}
      />

      <LyricsInputModal
        isOpen={isLyricsModalOpen}
        onClose={() => setIsLyricsModalOpen(false)}
        onSubmit={handleLyricsSubmit}
        initialData={completedTasks?.lyricsData}
      />

      <TranslationModal
        isOpen={isTranslationModalOpen}
        onClose={() => setIsTranslationModalOpen(false)}
        onSubmit={handleTranslationSubmit}
        lyricsData={currentLyrics}
      />

      <ViewTranslatedLyricsModal
        isOpen={isViewTranslatedLyricsModalOpen}
        onClose={() => setIsViewTranslatedLyricsModalOpen(false)}
        lyricsData={currentLyrics}
      />

      <SermonTranslationModal
        isOpen={isSermonTranslationModalOpen}
        onClose={() => setIsSermonTranslationModalOpen(false)}
        onSubmit={handleSermonTranslationSubmit}
        sermonData={currentSermon}
      />

      <SlidesUploadModal
        isOpen={isSlidesUploadModalOpen}
        onClose={() => setIsSlidesUploadModalOpen(false)}
        onSubmit={handleSlidesUploadSubmit}
      />

      <QrCodeUploadModal
        isOpen={isQrCodeModalOpen}
        onClose={() => setIsQrCodeModalOpen(false)}
        onSubmit={handleQrCodeUploadSubmit}
      />

      <MusicUploadModal
        isOpen={isMusicUploadModalOpen}
        onClose={() => setIsMusicUploadModalOpen(false)}
        onSubmit={handleMusicUploadSubmit}
      />

      <EditDocumentLinkModal
        isOpen={isEditDocumentLinkModalOpen}
        onClose={() => {
          setIsEditDocumentLinkModalOpen(false);
          setDocumentToEdit(null);
        }}
        documentType={documentToEdit?.taskId}
        initialLink={documentToEdit?.documentLink}
        onSave={handleSaveDocumentLink}
        onDelete={handleDeleteDocumentLink}
        metadata={documentToEdit?.metadata}
      />
    </>
  );
};
