import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import Dashboard from "./components/pages/dashboard"; // Changed from { Dashboard }
import { LoginPage } from "./components/pages/login-page";
import { EmailComposerPage } from "./components/pages/email-composer-page";
import { ProtectedRoute } from "./components/layout/protected-route";
import { AssignmentsPage } from "./components/assignments/assignments-page";
import { AssignmentsProvider } from "./components/assignments/context/AssignmentsContext";
// PasscodeManager is now part of AdminTools
import { AdminTools } from "./components/admin/admin-tools";
import { LyricsTranslationPage } from "./components/translation/lyrics-translation-page";
import { TranslationProvider } from "./context/TranslationContext";
import { AllUpdatesPage } from "./components/pages/all-updates-page";
import { ProfileSettings } from "./components/pages/profile-settings";

// Routes configuration
export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AssignmentsProvider>
        <TranslationProvider>
          <App />
        </TranslationProvider>
      </AssignmentsProvider>
    ),
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        ),
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "login",
        element: <LoginPage />,
      },

      {
        path: "compose-email",
        element: (
          <ProtectedRoute>
            <EmailComposerPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "assignments",
        element: (
          <ProtectedRoute>
            <AssignmentsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin-tools",
        element: (
          <ProtectedRoute requireAdmin={true}>
            <AdminTools />
          </ProtectedRoute>
        ),
      },
      {
        path: "translation/lyrics",
        element: (
          <ProtectedRoute>
            <LyricsTranslationPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "all-updates",
        element: (
          <ProtectedRoute>
            <AllUpdatesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <ProfileSettings />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
