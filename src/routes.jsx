import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import Dashboard from "./components/dashboard"; // Changed from { Dashboard }
import { LoginPage } from "./components/login-page";
import { EmailComposerPage } from "./components/email-composer-page";
import { ProtectedRoute } from "./components/protected-route";
import { AssignmentsPage } from "./components/assignments/assignments-page";
import { AssignmentsProvider } from "./components/assignments/context/AssignmentsContext";
// PasscodeManager is now part of AdminTools
import { AdminTools } from "./components/admin/admin-tools";

// Routes configuration
export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AssignmentsProvider>
        <App />
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
    ],
  },
]);
