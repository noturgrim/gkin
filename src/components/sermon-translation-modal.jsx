import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Book, X, Save, ExternalLink, Link as LinkIcon } from "lucide-react";

export function SermonTranslationModal({
  isOpen,
  onClose,
  onSubmit,
  sermonData,
}) {
  // No need for form values anymore, just tracking if translation is complete
  const [translationComplete, setTranslationComplete] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTranslationComplete(false);
    }
  }, [isOpen]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!translationComplete) {
      alert("Please confirm that you have completed the translation");
      return;
    }

    onSubmit({
      translationComplete: true,
      originalSermonId: sermonData?.id || "",
      originalSermonTitle: sermonData?.sermonTitle || "",
      originalSermonLink: sermonData?.sermonLink || "",
      translatedAt: new Date().toISOString(),
    });
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle Escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (isOpen && e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 my-8 animate-fadeIn"
        style={{ maxHeight: "calc(100vh - 4rem)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <Book className="w-5 h-5 text-green-600" />
            Translate Sermon
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 10rem)" }}
        >
          {!sermonData ? (
            <div className="text-center py-8 text-gray-600">
              No sermon available for translation. Please ask the Pastor to
              create or upload a sermon first.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Original sermon section */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-medium text-gray-700 mb-2">
                  Original Sermon
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-gray-600">Title</Label>
                    <div className="p-2 bg-white border border-gray-200 rounded-md text-gray-700">
                      {sermonData.sermonTitle || "No title available"}
                    </div>
                  </div>

                  {sermonData.sermonLink && (
                    <div>
                      <Label className="text-sm text-gray-600">
                        Google Doc Link
                      </Label>
                      <div className="p-2 bg-white border border-gray-200 rounded-md text-gray-700 flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-blue-500" />
                        <a
                          href={sermonData.sermonLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                        >
                          {sermonData.sermonLink}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Translation section */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">Translation</h3>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="mr-3 mt-0.5">
                      <ExternalLink className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-800">
                        Translation Instructions
                      </h4>
                      <ol className="mt-2 text-sm text-blue-700 list-decimal pl-5 space-y-1">
                        <li>
                          Click the original sermon Google Doc link above to
                          open it
                        </li>
                        <li>
                          Translate the sermon directly in the same document
                        </li>
                        <li>
                          When you're done, check the confirmation box below
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center">
                  <input
                    type="checkbox"
                    id="translationComplete"
                    checked={translationComplete}
                    onChange={() => setTranslationComplete(!translationComplete)}
                    className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="translationComplete" className="ml-3 text-gray-700 font-medium">
                    I confirm that I have completed the translation in the document
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              onClick={onClose}
              className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={!sermonData || !translationComplete}
            >
              <Save className="w-4 h-4 mr-2" />
              Confirm Translation Complete
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
