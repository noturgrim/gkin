import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { useWorkflow } from "./workflow/context/WorkflowContext";

export function SendToPastorModal({ isOpen, onClose, onSubmit, documentType }) {
  // Import the WorkflowContext to get the actual document link
  const { completedTasks } = useWorkflow();
  // Default values
  const documentTypes = {
    concept: "Concept Document",
    final: "Final Liturgy",
    sermon: "Sermon",
  };

  const documentTitle = documentTypes[documentType] || "Document";

  // State for form values
  const [formValues, setFormValues] = useState({
    email: "user2003@andrewscreem.com", // Default pastor email (using your personal email)
    subject: `[GKIN] ${documentTitle} for Review`,
    message: `Dear Pastor,\n\nPlease find attached the ${documentTitle} for the upcoming service.\n\nKind regards,\nLiturgy Team`,
  });

  // Loading and feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState(null); // 'success', 'error', or null
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Reset form when modal opens with a new document type
  useEffect(() => {
    if (isOpen) {
      setFormValues({
        email: "user2003@andrewscreem.com",
        subject: `[GKIN] ${documentTitle} for Review`,
        message: `Dear Pastor,\n\nPlease find attached the ${documentTitle} for the upcoming service.\n\nKind regards,\nLiturgy Team`,
      });
      // Reset feedback states
      setIsSubmitting(false);
      setFeedbackStatus(null);
      setFeedbackMessage("");
    }
  }, [isOpen, documentTitle]);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset feedback state
    setFeedbackStatus(null);
    setFeedbackMessage("");

    // Set loading state
    setIsSubmitting(true);

    try {
      // Get the actual document link from completedTasks
      const documentLink =
        completedTasks[documentType]?.documentLink ||
        completedTasks?.documentLinks?.[documentType] ||
        (documentType === "concept"
          ? "https://docs.google.com/document/d/1example-concept-document/edit"
          : documentType === "final"
          ? "https://docs.google.com/document/d/1example-final-document/edit"
          : "https://docs.google.com/document/d/1example-document/edit");

      // Add the document type and link to the data being sent
      const dataToSubmit = {
        ...formValues,
        documentType,
        documentLink,
      };

      // Call the submit handler and wait for it to complete
      await onSubmit(dataToSubmit);

      // Show success feedback
      setFeedbackStatus("success");
      setFeedbackMessage(`Email sent to ${formValues.email} successfully!`);

      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      // Show error feedback
      setFeedbackStatus("error");
      setFeedbackMessage(
        error.message || "Failed to send email. Please try again."
      );
    } finally {
      // Reset loading state
      setIsSubmitting(false);
    }
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
            <Mail className="w-5 h-5 text-blue-600" />
            Send {documentTitle} to Pastor
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 8rem)" }}
        >
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-gray-700">
                Pastor's Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formValues.email}
                onChange={handleChange}
                className="border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="subject" className="text-gray-700">
                Subject
              </Label>
              <Input
                id="subject"
                name="subject"
                value={formValues.subject}
                onChange={handleChange}
                className="border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="message" className="text-gray-700">
                Message
              </Label>
              <Textarea
                id="message"
                name="message"
                rows={6}
                value={formValues.message}
                onChange={handleChange}
                className="border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                required
              />
            </div>

            {/* Document link preview */}
            <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Document Link (will be included in the email)
              </h3>
              <div className="text-blue-600 text-sm break-all bg-white p-2 rounded border border-blue-100">
                {completedTasks[documentType]?.documentLink ||
                  completedTasks?.documentLinks?.[documentType] ||
                  (documentType === "concept"
                    ? "https://docs.google.com/document/d/1example-concept-document/edit"
                    : documentType === "final"
                    ? "https://docs.google.com/document/d/1example-final-document/edit"
                    : "https://docs.google.com/document/d/1example-document/edit")}
              </div>
            </div>
          </div>
        </form>

        {/* Feedback message area */}
        {feedbackStatus && (
          <div
            className={`mx-4 p-3 rounded-md ${
              feedbackStatus === "success"
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackStatus === "success" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <p
                className={`text-sm ${
                  feedbackStatus === "success"
                    ? "text-green-700"
                    : "text-red-700"
                }`}
              >
                {feedbackMessage}
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 p-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <Button
            type="button"
            onClick={onClose}
            className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sending...</span>
              </div>
            ) : (
              "Send Email"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
