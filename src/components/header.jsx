import { useState } from "react";
import { Button } from "./ui/button";
import { FileText } from "lucide-react";
import { NotificationCenter, NotificationPanel } from "./notification-center";

export function Header({
  title = "Liturgy Workflow",
  subtitle = "Manage document workflow for weekly services",
  user,
  onLogout,
  showNotifications = true,
  showUserInfo = true,
  showLogout = true,
  className = "",
  variant = "default", // "default", "primary", "gradient"
}) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  // Add state for user dropdown
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Color logic
  const textColors =
    variant === "primary" || variant === "gradient"
      ? {
          title: "text-white",
          subtitle: "text-blue-100",
          userText: "text-white",
          userRole: "text-blue-200",
        }
      : {
          title: "text-gray-900",
          subtitle: "text-gray-600",
          userText: "text-gray-800",
          userRole: "text-gray-500",
        };

  // Header background
  const headerBg =
    variant === "primary"
      ? "bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white shadow-lg border-b border-blue-900"
      : variant === "gradient"
      ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg"
      : "bg-gradient-to-r from-gray-50 via-white to-gray-100 border-b-2 border-gray-200 shadow-sm";

  return (
    <header className={`${headerBg} px-4 py-4 md:py-6 lg:px-6 ${className}`}>
      {/* Mobile Layout */}
      <div className="flex flex-col gap-3 md:hidden">
        {/* Top row: Title and menu button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-lg font-bold ${textColors.title}`}>{title}</h1>
            {subtitle && (
              <p className={`text-xs ${textColors.subtitle}`}>{subtitle}</p>
            )}
          </div>
          {/* User menu button */}
          {showUserInfo && (
            <div
              className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-300"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                {user?.username?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <span className="text-xs font-medium">{user?.username}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-200 ${
                  showMobileMenu ? "rotate-180" : ""
                }`}
              >
                <path d="M6 9l6 6 6-6"></path>
              </svg>
            </div>
          )}
        </div>
        {/* Actions row */}
        <div className="flex items-center gap-2">
          {showNotifications && (
            <div
              onClick={() => setShowNotificationPanel(!showNotificationPanel)}
            >
              <NotificationCenter />
            </div>
          )}
          {showLogout && (
            <Button
              variant="outline"
              className="text-xs px-2 py-1"
              onClick={onLogout}
            >
              Logout
            </Button>
          )}
        </div>

        {/* Notification Panel - Expands within the header */}
        {showNotificationPanel && (
          <div className="mt-2">
            <NotificationPanel />
          </div>
        )}

                  {/* Mobile user menu dropdown */}
        {showMobileMenu && (
          <div className="mt-2 rounded-lg border border-gray-200 bg-white shadow-lg p-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                {user?.username?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div>
                <div className="font-medium text-sm">{user?.username}</div>
                <div className="text-xs text-gray-500">
                  {typeof user?.role === "string" ? user.role : user?.role?.name || "Role"}
                </div>
              </div>
            </div>
            
            {/* Admin Tools option for mobile view */}
            {user && user.role === 'admin' && (
              <Button
                variant="outline"
                className="w-full text-xs text-blue-600 border-blue-200 hover:bg-blue-50 flex items-center justify-center gap-2"
                onClick={() => {
                  setShowMobileMenu(false);
                  window.location.href = '/admin-tools';
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                </svg>
                Admin Tools
              </Button>
            )}
            
            <Button
              variant="outline"
              className="w-full text-xs"
              onClick={onLogout}
            >
              Logout
            </Button>
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between gap-4">
        {/* Left: Title and subtitle */}
        <div>
          <h1 className={`text-2xl font-bold ${textColors.title}`}>{title}</h1>
          {subtitle && (
            <p className={`text-sm ${textColors.subtitle}`}>{subtitle}</p>
          )}
        </div>
        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {showNotifications && (
            <div className="relative">
              <div
                onClick={() => setShowNotificationPanel(!showNotificationPanel)}
              >
                <NotificationCenter />
              </div>
              {showNotificationPanel && (
                <div className="absolute right-0 mt-2 z-50">
                  <div className="w-80">
                    <NotificationPanel />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Combined User Info & Logout */}
          {showUserInfo && user && (
            <div className="relative">
              <div
                className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-300 cursor-pointer hover:bg-gray-50"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
              >
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-sm text-gray-800">
                  {user.username}
                </span>
                <span className="text-xs text-gray-500">
                  {typeof user.role === "string" ? user.role : user.role?.name || "Role"}
                </span>

                {/* Add a dropdown arrow */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`ml-1 transition-transform duration-200 ${
                    showUserDropdown ? "rotate-180" : ""
                  }`}
                >
                  <path d="M6 9l6 6 6-6"></path>
                </svg>
              </div>

              {/* User dropdown menu */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="font-medium text-sm">{user.username}</div>
                    <div className="text-xs text-gray-500">
                      {typeof user.role === "string" ? user.role : user.role?.name || "Role"}
                    </div>
                  </div>
                  {/* Admin Tools - Only visible to admins */}
                  {user && user.role === 'admin' && (
                    <div
                      className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 cursor-pointer flex items-center"
                      onClick={() => {
                        setShowUserDropdown(false);
                        window.location.href = '/admin-tools';
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2"
                      >
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                      </svg>
                      Admin Tools
                    </div>
                  )}
                  
                  {showLogout && (
                    <div
                      className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer flex items-center"
                      onClick={onLogout}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      Logout
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
