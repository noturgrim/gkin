// src/components/music-upload-modal.jsx
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Link, Music, X } from "lucide-react";

export function MusicUploadModal({ isOpen, onClose, onSubmit }) {
  // State for form values
  const [formValues, setFormValues] = useState({
    title: "",
    musicLink: "",
    notes: "",
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormValues({
        title: "",
        musicLink: "",
        notes: "",
      });
    }
  }, [isOpen]);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validate if the string is a valid Google Drive link
  const isValidDriveLink = (link) => {
    // Basic validation - checks if it contains drive.google.com
    return link.includes("drive.google.com");
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formValues.title.trim()) {
      alert("Please enter a title for the music file");
      return;
    }

    if (!formValues.musicLink.trim()) {
      alert("Please provide a Google Drive link to the music file");
      return;
    }

    if (!isValidDriveLink(formValues.musicLink)) {
      alert("Please provide a valid Google Drive link");
      return;
    }

    onSubmit({
      ...formValues,
      uploadedAt: new Date().toISOString(),
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
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 my-8 animate-fadeIn"
        style={{ maxHeight: "calc(100vh - 4rem)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <Music className="w-5 h-5 text-indigo-600" />
            Add Music Link
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-gray-700">
                Music Title
              </Label>
              <Input
                id="title"
                name="title"
                value={formValues.title}
                onChange={handleChange}
                className="border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                placeholder="Enter music title (e.g., Choir Accompaniment)"
              />
            </div>

            <div>
              <Label htmlFor="musicLink" className="text-gray-700 mb-2 block">
                Music File Link
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Link className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  id="musicLink"
                  name="musicLink"
                  value={formValues.musicLink}
                  onChange={handleChange}
                  className="pl-10 border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  placeholder="Paste Google Drive link to your music file"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Please share your Google Drive link with viewing permissions enabled
              </p>
            </div>

            <div>
              <Label htmlFor="notes" className="text-gray-700">
                Notes (Optional)
              </Label>
              <Input
                id="notes"
                name="notes"
                value={formValues.notes}
                onChange={handleChange}
                className="border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                placeholder="Any additional notes about the music file"
              />
            </div>
          </div>

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
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Save Music Link
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
