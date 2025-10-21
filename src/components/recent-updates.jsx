import { useEffect, useState } from "react";
import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  User,
  Calendar,
  ArrowRight,
  BookOpen,
  Languages,
  Music,
  Presentation,
  QrCode,
  Loader2,
} from "lucide-react";
import { Badge } from "./ui/badge";
import recentUpdatesService from "../services/recentUpdatesService";
import { formatDistanceToNow } from "../lib/date-utils";

// Icon mapping object
const ICONS = {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  User,
  Calendar,
  ArrowRight,
  BookOpen,
  Languages,
  Music,
  Presentation,
  QrCode,
};

/**
 * UpdateIcon component for rendering the appropriate icon
 */
const UpdateIcon = ({ iconName, className }) => {
  const IconComponent = ICONS[iconName] || FileText;
  return <IconComponent className={className} />;
};

/**
 * TimeAgo component for rendering relative time
 */
const TimeAgo = ({ timestamp }) => {
  const [timeAgo, setTimeAgo] = useState("");

  useEffect(() => {
    if (!timestamp) return;

    const updateTime = () => {
      try {
        setTimeAgo(formatDistanceToNow(new Date(timestamp)));
      } catch (error) {
        console.error("Error formatting time:", error);
        setTimeAgo(timestamp || "");
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [timestamp]);

  return <span>{timeAgo}</span>;
};

/**
 * SingleUpdate component for rendering a single update item
 */
const SingleUpdate = ({ update }) => {
  const getIconColor = (color) => {
    const colors = {
      blue: "text-blue-600",
      purple: "text-purple-600",
      green: "text-green-600",
      orange: "text-orange-600",
      red: "text-red-600",
      gray: "text-gray-600",
    };
    return colors[update.color] || colors.gray;
  };

  const getBgColor = (color) => {
    const colors = {
      blue: "bg-blue-50",
      purple: "bg-purple-50",
      green: "bg-green-50",
      orange: "bg-orange-50",
      red: "bg-red-50",
      gray: "bg-gray-50",
    };
    return colors[update.color] || colors.gray;
  };

  const getBorderColor = (color) => {
    const colors = {
      blue: "border-blue-100",
      purple: "border-purple-100",
      green: "border-green-100",
      orange: "border-orange-100",
      red: "border-red-100",
      gray: "border-gray-100",
    };
    return colors[update.color] || colors.gray;
  };

  return (
    <div
      key={update.id}
      className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
    >
      <div
        className={`p-2 rounded-full ${getBgColor(
          update.color
        )} ${getBorderColor(update.color)} border`}
      >
        <UpdateIcon
          iconName={update.icon}
          className={`w-4 h-4 ${getIconColor(update.color)}`}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-medium text-sm text-gray-900">{update.title}</h4>
          <span className="text-[10px] text-gray-500 whitespace-nowrap">
            <TimeAgo timestamp={update.timestamp} />
          </span>
        </div>

        <p className="text-xs text-gray-600 mt-0.5 mb-1">
          {update.description}
        </p>

        <div className="flex items-center gap-2 mt-1">
          {update.user !== "System" && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3 text-gray-400" />
              <span className="text-[10px] text-gray-500">{update.user}</span>
            </div>
          )}

          {update.role && (
            <Badge
              variant="outline"
              className="h-4 px-1 text-[9px] bg-gray-50 border-gray-200 text-gray-600"
            >
              {update.role}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Empty state component when there are no updates
 */
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center p-6 text-center">
    <Calendar className="w-8 h-8 text-gray-300 mb-2" />
    <h4 className="font-medium text-sm text-gray-500">No recent updates</h4>
    <p className="text-xs text-gray-400 mt-1">
      Updates will appear here as tasks are completed
    </p>
  </div>
);

/**
 * Error state component when there's an error fetching updates
 */
const ErrorState = ({ onRetry }) => (
  <div className="flex flex-col items-center justify-center p-6 text-center">
    <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
    <h4 className="font-medium text-sm text-gray-700">
      Failed to load updates
    </h4>
    <p className="text-xs text-gray-500 mt-1 mb-3">
      There was a problem fetching the latest updates
    </p>
    <button
      onClick={onRetry}
      className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
    >
      Try again
    </button>
  </div>
);

/**
 * Loading state component while fetching updates
 */
const LoadingState = () => (
  <div className="flex flex-col items-center justify-center p-6">
    <Loader2 className="w-6 h-6 text-blue-500 animate-spin mb-2" />
    <p className="text-xs text-gray-500">Loading updates...</p>
  </div>
);

/**
 * RecentUpdates component
 * @param {Object} props - Component props
 * @param {number} props.limit - Maximum number of updates to display
 */
export function RecentUpdates({ limit = 5 }) {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUpdates = async () => {
    setLoading(true);
    setError(null);

    try {
      const recentUpdates = await recentUpdatesService.getAllRecentUpdates(
        limit
      );
      setUpdates(recentUpdates);
    } catch (error) {
      console.error("Failed to fetch recent updates:", error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, [limit]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState onRetry={fetchUpdates} />;
  if (updates.length === 0) return <EmptyState />;

  return (
    <div className="space-y-3">
      {updates.map((update) => (
        <SingleUpdate key={update.id} update={update} />
      ))}

      {updates.length > 0 && (
        <button className="w-full text-center text-xs text-blue-600 hover:text-blue-700 py-1 hover:underline">
          View all updates
        </button>
      )}
    </div>
  );
}
