// src/components/workflow/components/TaskCard.jsx
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
  CheckCircle,
  AlertCircle,
  Mail,
  Music,
  Edit,
  ArrowRight,
  Upload,
} from "lucide-react";
import { useWorkflow } from "../context/WorkflowContext";
import { useWorkflowHandlers } from "../hooks/useWorkflowHandlers";
import { MusicUploadModal } from "../../music-upload-modal";

// Task type specific styling
const taskTypeStyles = {
  // Liturgy tasks - blue theme
  concept: {
    primary: "bg-blue-600 hover:bg-blue-700",
    secondary: "bg-blue-500 hover:bg-blue-600",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    viewButton: "border-blue-300 text-blue-700 hover:bg-blue-50",
    icon: "text-blue-500",
  },
  sermon: {
    primary: "bg-purple-600 hover:bg-purple-700",
    secondary: "bg-purple-500 hover:bg-purple-600",
    badge: "bg-purple-100 text-purple-700 border-purple-200",
    viewButton: "border-purple-300 text-purple-700 hover:bg-purple-50",
    icon: "text-purple-500",
  },
  final: {
    primary: "bg-blue-600 hover:bg-blue-700",
    secondary: "bg-blue-500 hover:bg-blue-600",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    viewButton: "border-blue-300 text-blue-700 hover:bg-blue-50",
    icon: "text-blue-500",
  },

  // QR code - emerald theme
  qrcode: {
    primary: "bg-emerald-600 hover:bg-emerald-700",
    secondary: "bg-emerald-500 hover:bg-emerald-600",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    viewButton: "border-emerald-300 text-emerald-700 hover:bg-emerald-50",
    icon: "text-emerald-500",
  },

  // Translation tasks - green theme
  "translate-liturgy": {
    primary: "bg-green-600 hover:bg-green-700",
    secondary: "bg-green-500 hover:bg-green-600",
    badge: "bg-green-100 text-green-700 border-green-200",
    viewButton: "border-green-300 text-green-700 hover:bg-green-50",
    icon: "text-green-500",
  },
  "translate-sermon": {
    primary: "bg-green-600 hover:bg-green-700",
    secondary: "bg-green-500 hover:bg-green-600",
    badge: "bg-green-100 text-green-700 border-green-200",
    viewButton: "border-green-300 text-green-700 hover:bg-green-50",
    icon: "text-green-500",
  },

  // Beamer tasks - orange theme
  slides: {
    primary: "bg-orange-600 hover:bg-orange-700",
    secondary: "bg-orange-500 hover:bg-orange-600",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
    viewButton: "border-orange-300 text-orange-700 hover:bg-orange-50",
    icon: "text-orange-500",
  },

  // Music tasks - indigo theme
  music: {
    primary: "bg-indigo-600 hover:bg-indigo-700",
    secondary: "bg-indigo-500 hover:bg-indigo-600",
    badge: "bg-indigo-100 text-indigo-700 border-indigo-200",
    viewButton: "border-indigo-300 text-indigo-700 hover:bg-indigo-50",
    icon: "text-indigo-500",
  },
};

// Default style for tasks without specific styling
const defaultTaskStyle = {
  primary: "bg-gray-600 hover:bg-gray-700",
  secondary: "bg-gray-500 hover:bg-gray-600",
  badge: "bg-gray-100 text-gray-700 border-gray-200",
  viewButton: "border-gray-300 text-gray-700 hover:bg-gray-50",
  icon: "text-gray-500",
};

export const TaskCard = ({ task, categoryId }) => {
  const { getTaskStatus, hasRole, completedTasks, setCompletedTasks } =
    useWorkflow();
  const {
    handleActionStart,
    handleViewDocument,
    handleSendToPastor,
    handleSendToMusic,
    handlePastorEdit,
    handlePastorNotifyTeams,
    handleQrCodeAction,
    handleAddLyrics,
    handleTranslateLyrics,
    handleTranslateSermon,
    handleUploadSermon,
    handleUploadSlides,
    handleUploadMusic,
  } = useWorkflowHandlers();

  const status = getTaskStatus(task.id);
  const isCompleted = status === "completed";
  const isActive = status === "active";
  const isQrCodeTask = task.id === "qrcode";

  // Get task-specific styling or use default
  const taskStyle = taskTypeStyles[task.id] || defaultTaskStyle;

  // Button styles with task-specific colors
  const primaryButtonClass = `w-full text-white text-xs py-2 h-9 rounded-md font-medium shadow-sm hover:shadow transition-all ${taskStyle.primary}`;
  const secondaryButtonClass = `w-full text-white text-xs py-2 h-9 rounded-md font-medium shadow-sm hover:shadow transition-all ${taskStyle.secondary}`;
  const viewButtonClass = `w-full border text-xs py-1.5 h-9 rounded-md font-medium hover:shadow transition-all ${taskStyle.viewButton}`;

  return (
    <div
      className={`p-3 border rounded-lg flex flex-col items-center text-center ${
        isCompleted
          ? "bg-green-50 border-green-200"
          : isActive
          ? `bg-${
              task.id === "qrcode" ? "emerald" : taskStyle.icon.split("-")[1]
            }-50 border-${
              task.id === "qrcode" ? "emerald" : taskStyle.icon.split("-")[1]
            }-300 border-2 shadow`
          : "bg-gray-50 border-gray-200"
      }`}
    >
      {/* Task icon with task-specific color - now clickable */}
      <div 
        className={`mb-1 ${["concept", "sermon", "final", "slides"].includes(task.id) ? 
          "cursor-pointer hover:scale-110 transition-transform relative group" : ""}`}
        onClick={() => {
          // Only make it clickable for document-type tasks that can have Google Drive links
          if (["concept", "sermon", "final", "slides"].includes(task.id)) {
            handleViewDocument(task.id);
          }
        }}
        title={["concept", "sermon", "final", "slides"].includes(task.id) ? "Click to open in Google Drive" : ""}
      >
        {["concept", "sermon", "final", "slides"].includes(task.id) && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
        )}
        {isCompleted ? (
          <CheckCircle className={`w-6 h-6 text-green-500`} />
        ) : isActive ? (
          <AlertCircle className={`w-6 h-6 ${taskStyle.icon} animate-pulse`} />
        ) : (
          <task.icon className={`w-6 h-6 ${taskStyle.icon}`} />
        )}
      </div>

      {/* Task name */}
      <div className="font-medium text-sm mb-2">{task.name}</div>

      {/* Status badge - moved to top for better visibility */}
      {!isActive && !isCompleted && (
        <Badge className={`mb-3 px-3 py-1 text-xs ${taskStyle.badge}`}>
          Pending
        </Badge>
      )}

      {isActive &&
        !isCompleted &&
        !isQrCodeTask &&
        !hasRole(task.restrictedTo) && (
          <Badge
            className={`mb-3 px-3 py-1 text-xs ${taskStyle.badge.replace(
              "border",
              "border-2"
            )} animate-pulse flex items-center gap-1`}
          >
            <span className="w-2 h-2 rounded-full bg-current"></span>
            In Progress
          </Badge>
        )}

      {isCompleted && (
        <Badge
          className={`mb-3 px-3 py-1 text-xs bg-green-100 text-green-700 border border-green-200 flex items-center gap-1`}
        >
          <CheckCircle className="w-3 h-3" />
          Completed
        </Badge>
      )}

      {/* Action buttons container */}
      <div className="w-full mt-auto flex flex-col justify-end space-y-2">
        {/* Liturgy Maker tasks */}
        {(task.id === "concept" ||
          task.id === "sermon" ||
          task.id === "final") && (
          <>
            {/* Show sermon creation/upload options */}
            {task.id === "sermon" && !isCompleted && (
              <Button
                size="sm"
                className={primaryButtonClass}
                onClick={() => handleUploadSermon(task.id)}
              >
                <Upload className="w-3 h-3 mr-1" />
                Upload Sermon
              </Button>
            )}

            {/* Show document creation buttons */}
            {(task.id === "concept" || task.id === "final") && !isCompleted && (
              <div className="space-y-2">
                <Button
                  size="sm"
                  className={primaryButtonClass}
                  onClick={() => handleActionStart(task.id)}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  {task.actionLabel}
                </Button>

                <Button
                  size="sm"
                  className={secondaryButtonClass}
                  onClick={() => handleSendToPastor(task.id)}
                >
                  <ArrowRight className="w-3 h-3 mr-1" />
                  Send to Pastor
                </Button>

                <Button
                  size="sm"
                  className={secondaryButtonClass}
                  onClick={() => handleSendToMusic(task.id)}
                >
                  <Music className="w-3 h-3 mr-1" />
                  Send to Music
                </Button>
              </div>
            )}

            {/* Document viewing section */}
            {isCompleted && (
              <div className="space-y-2">
                {!(task.id === "sermon" && hasRole("pastor")) && (
                  <Button
                    size="sm"
                    className={viewButtonClass}
                    onClick={() => handleViewDocument(task.id)}
                  >
                    {task.id === "sermon" ? "View Sermon" : "View Document"}
                  </Button>
                )}

                {/* Pastor special options */}
                {hasRole("pastor") &&
                  (task.id === "concept" || task.id === "final") && (
                    <div className="space-y-2 mt-2">
                      <Button
                        size="sm"
                        className={`w-full text-white text-xs py-1 h-8 rounded-md flex items-center justify-center gap-1 ${taskStyle.primary}`}
                        onClick={() => handlePastorEdit(task.id)}
                      >
                        <Edit className="w-3 h-3" />
                        Edit Document
                      </Button>
                      <Button
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700 text-white text-xs py-1 h-8 rounded-md flex items-center justify-center gap-1"
                        onClick={() => handlePastorNotifyTeams(task.id)}
                      >
                        <Mail className="w-3 h-3" />
                        Notify Teams
                      </Button>
                    </div>
                  )}
              </div>
            )}
          </>
        )}

        {/* QR Code handling */}
        {isQrCodeTask && !isCompleted && (
          <Button
            size="sm"
            className={primaryButtonClass}
            onClick={() => handleQrCodeAction(isActive ? "complete" : "upload")}
          >
            {isActive ? "Finish Upload" : task.actionLabel}
          </Button>
        )}

        {/* QR Code viewing when completed */}
        {isQrCodeTask && isCompleted && (
          <Button
            size="sm"
            variant="outline"
            className={viewButtonClass}
            onClick={() => handleViewDocument("qrcode")}
          >
            View QR Code
          </Button>
        )}

        {/* Lyrics translation task */}
        {task.id === "translate-liturgy" && (
          <>
            <Button
              size="sm"
              className={primaryButtonClass}
              onClick={handleAddLyrics}
            >
              {completedTasks?.lyrics === "completed"
                ? "Edit Lyrics"
                : "Add Song Lyrics"}
            </Button>

            <Button
              size="sm"
              className={secondaryButtonClass}
              onClick={handleTranslateLyrics}
            >
              Translate Lyrics
            </Button>
          </>
        )}

        {/* Sermon translation task */}
        {task.id === "translate-sermon" && (
          <Button
            size="sm"
            className={primaryButtonClass}
            onClick={handleTranslateSermon}
          >
            Translate Sermon
          </Button>
        )}

        {/* Beamer slides task */}
        {task.id === "slides" && (
          <>
            {!isCompleted && (
              <Button
                size="sm"
                className={primaryButtonClass}
                onClick={handleUploadSlides}
              >
                <Upload className="w-3 h-3 mr-1" />
                Upload Slides
              </Button>
            )}

            {isCompleted && (
              <Button
                size="sm"
                variant="outline"
                className={viewButtonClass}
                onClick={() => handleViewDocument("slides")}
              >
                View Slides
              </Button>
            )}
          </>
        )}

        {/* Music upload task */}
        {task.id === "music" && (
          <>
            {!isCompleted && (
              <Button
                size="sm"
                className={primaryButtonClass}
                onClick={handleUploadMusic}
              >
                <Music className="w-3 h-3 mr-1" />
                Upload Music
              </Button>
            )}

            {isCompleted && (
              <Button
                size="sm"
                variant="outline"
                className={viewButtonClass}
                onClick={() => handleViewDocument("music")}
              >
                View Music
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
