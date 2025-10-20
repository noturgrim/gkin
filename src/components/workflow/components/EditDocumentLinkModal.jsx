// src/components/workflow/components/EditDocumentLinkModal.jsx
import { useState, useEffect } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { X, Trash2, Edit, Save, Loader2 } from "lucide-react";

export const EditDocumentLinkModal = ({
  isOpen,
  onClose,
  documentType,
  initialLink,
  onSave,
  onDelete,
  metadata,
}) => {
  const [documentLink, setDocumentLink] = useState(initialLink || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset form when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setDocumentLink(initialLink || "");
    }
  }, [isOpen, initialLink]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(documentType, documentLink);
      onClose();
    } catch (error) {
      console.error("Error saving document link:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        `Are you sure you want to delete the link for ${documentType}?`
      )
    ) {
      try {
        setIsDeleting(true);
        await onDelete(documentType);
        onClose();
      } catch (error) {
        console.error("Error deleting document link:", error);
        setIsDeleting(false);
      }
    }
  };

  if (!isOpen) return null;

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";

    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
    } catch (e) {
      return "Invalid date";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold capitalize">
            Edit {documentType} Document Link
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Document metadata */}
        {metadata && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md text-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium">Last updated:</span>
              <span>{formatDate(metadata.updatedAt)}</span>
            </div>
            {metadata.updatedBy && (
              <div className="flex justify-between items-center">
                <span className="font-medium">Updated by:</span>
                <span className="capitalize">{metadata.updatedBy}</span>
              </div>
            )}
          </div>
        )}

        <div className="mb-4">
          <Label htmlFor="documentLink" className="block mb-2">
            Document Link
          </Label>
          <Input
            id="documentLink"
            type="text"
            value={documentLink}
            onChange={(e) => setDocumentLink(e.target.value)}
            placeholder="Enter Google Drive link"
            className="w-full"
            autoFocus
          />
        </div>

        <div className="flex space-x-2 justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            className="flex items-center"
            disabled={!initialLink || isDeleting || isSaving}
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="mr-1 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} className="mr-1" />
                Delete Link
              </>
            )}
          </Button>

          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving || isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="flex items-center"
              disabled={!documentLink.trim() || isSaving || isDeleting}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-1" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
