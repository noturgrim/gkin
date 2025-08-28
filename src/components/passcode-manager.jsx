import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  AlertCircle,
  Check,
  Lock,
  Shield,
  Search,
  SortAsc,
  SortDesc,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Key,
  ArrowLeft,
  Home,
} from "lucide-react";
import passcodeService from "../services/passcodeService";
import authService from "../services/authService";

// Add animation styles
const animationStyles = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeIn 0.2s ease-out forwards;
}
`;

// Function to evaluate password strength
const evaluatePasswordStrength = (password) => {
  if (!password) return { score: 0, label: "None", color: "bg-gray-200" };

  // Calculate score based on different criteria
  let score = 0;

  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // Character variety checks
  if (/[A-Z]/.test(password)) score += 1; // Has uppercase
  if (/[a-z]/.test(password)) score += 1; // Has lowercase
  if (/[0-9]/.test(password)) score += 1; // Has number
  if (/[^A-Za-z0-9]/.test(password)) score += 1; // Has special char

  // Map score to strength level
  const strength = {
    0: { label: "Very Weak", color: "bg-red-500" },
    1: { label: "Weak", color: "bg-red-400" },
    2: { label: "Fair", color: "bg-yellow-400" },
    3: { label: "Good", color: "bg-yellow-500" },
    4: { label: "Strong", color: "bg-green-400" },
    5: { label: "Very Strong", color: "bg-green-500" },
    6: { label: "Excellent", color: "bg-green-600" },
  };

  return { score, ...strength[Math.min(score, 6)] };
};

export function PasscodeManager() {
  const navigate = useNavigate();
  const [passcodes, setPasscodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [newPasscode, setNewPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [updateStatus, setUpdateStatus] = useState({
    success: false,
    message: "",
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showPasswords, setShowPasswords] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [roleToUpdate, setRoleToUpdate] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch passcodes on component mount or when refresh is triggered
  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);

    if (user && user.role === "admin") {
      fetchPasscodes();
    } else {
      setError("You don't have permission to access this page");
      setLoading(false);
    }
  }, [refreshKey]);

  // Fetch passcodes from API
  const fetchPasscodes = async () => {
    try {
      setLoading(true);
      const data = await passcodeService.getAllPasscodes();
      setPasscodes(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError("Failed to load passcodes: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  // Refresh passcode data
  const refreshPasscodes = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  // Start editing a role's passcode
  const startEditing = (role, e) => {
    // Prevent event bubbling
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Clear search when starting to edit to avoid conflicts
    setSearchTerm("");

    setEditingRole(role);
    setNewPasscode("");
    setConfirmPasscode("");
    setUpdateStatus({ success: false, message: "" });
  };

  // Cancel editing
  const cancelEditing = (e) => {
    // Prevent event bubbling
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setEditingRole(null);
    setNewPasscode("");
    setConfirmPasscode("");
    setUpdateStatus({ success: false, message: "" });
  };

  // Show confirmation dialog before updating passcode
  const confirmPasscodeUpdate = (role, e) => {
    // Prevent event bubbling
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Validate passcodes match
    if (newPasscode !== confirmPasscode) {
      setUpdateStatus({ success: false, message: "Passcodes don't match" });
      return;
    }

    // Validate passcode is not empty
    if (!newPasscode.trim()) {
      setUpdateStatus({ success: false, message: "Passcode cannot be empty" });
      return;
    }

    // Check password strength
    const strength = evaluatePasswordStrength(newPasscode);
    if (strength.score < 3) {
      setUpdateStatus({
        success: false,
        message: `Password is ${strength.label}. Consider using a stronger password.`,
        isWarning: true,
      });
      // Still allow proceeding with weak password
    }

    // Set role to update and show confirmation dialog
    setRoleToUpdate(role);
    setShowConfirmDialog(true);
  };

  // Update a role's passcode after confirmation
  const updatePasscode = async () => {
    if (!roleToUpdate) return;

    try {
      setUpdateStatus({
        success: false,
        message: "Updating passcode...",
        isLoading: true,
      });
      
      // Close the confirmation dialog immediately
      setShowConfirmDialog(false);
      
      await passcodeService.updatePasscode(roleToUpdate, newPasscode);
      
      // Show success message in the editing area
      setUpdateStatus({
        success: true,
        message: "Passcode updated successfully",
      });

      // Refresh the passcode list
      refreshPasscodes();

      // Reset form after successful update (but leave the success message visible for a moment)
      setTimeout(() => {
        setEditingRole(null);
        setRoleToUpdate(null);
        setNewPasscode("");
        setConfirmPasscode("");
        setUpdateStatus({ success: false, message: "" });
      }, 2000);
    } catch (err) {
      setUpdateStatus({
        success: false,
        message:
          "Failed to update passcode: " + (err.message || "Unknown error"),
      });
      setShowConfirmDialog(false);
    }
  };

  // If user doesn't have permission
  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="max-w-md mx-auto px-4 mt-8">
        <Card className="border border-red-200 bg-red-50 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <Shield className="h-5 w-5" />
              <p>You don't have permission to access this page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 mt-8 flex justify-center">
        <Card className="w-full shadow-md">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
              <p className="text-gray-500 text-sm">Loading passcodes...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 mt-8">
        <Card className="border border-red-200 bg-red-50 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Function to handle input focus to prevent unwanted interactions
  const handleInputFocus = (e) => {
    e.stopPropagation();
    // Prevent the input from being affected by other events
    e.target.focus();
  };

  // Filter and sort passcodes
  const filteredAndSortedPasscodes = passcodes
    .filter((passcode) =>
      passcode.role.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === "asc") {
        return a.role.localeCompare(b.role);
      } else {
        return b.role.localeCompare(a.role);
      }
    });

  // Get password strength for visual feedback
  const passwordStrength = evaluatePasswordStrength(newPasscode);

  // Go back to dashboard
  const handleGoBack = () => {
    navigate("/dashboard");
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGoBack}
            className="flex items-center gap-2 hover:bg-indigo-50"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
        </div>
        <Card className="shadow-lg border-gray-200 overflow-hidden animate-fade-in">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Lock className="h-5 w-5 text-indigo-600" />
                  Role Passcode Management
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Update passcodes for different roles in the system
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1.5"
                onClick={refreshPasscodes}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>

            {/* Search and sort controls */}
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search roles..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={handleInputFocus}
                  onMouseDown={(e) => e.stopPropagation()}
                  autoComplete="off"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
              >
                {sortOrder === "asc" ? (
                  <>
                    <SortAsc className="h-4 w-4" />
                    <span>A-Z</span>
                  </>
                ) : (
                  <>
                    <SortDesc className="h-4 w-4" />
                    <span>Z-A</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5"
                onClick={() => setShowPasswords(!showPasswords)}
              >
                {showPasswords ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    <span>Show</span>
                  </>
                )}
              </Button>
            </div>

            {lastUpdated && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
                <Clock className="h-3 w-3" />
                <span>Last updated: {lastUpdated.toLocaleString()}</span>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-4 md:p-6">
            {filteredAndSortedPasscodes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? (
                  <p>No roles found matching "{searchTerm}"</p>
                ) : (
                  <p>No roles found</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAndSortedPasscodes.map((passcode) => (
                  <div
                    key={passcode.id}
                    className={`border rounded-md p-4 bg-white shadow-sm transition-all ${
                      editingRole === passcode.role
                        ? "border-indigo-300 bg-indigo-50"
                        : "hover:border-gray-300"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium capitalize flex items-center gap-1.5">
                          {passcode.role === "admin" ? (
                            <Shield className="h-4 w-4 text-indigo-600" />
                          ) : (
                            <Key className="h-4 w-4 text-gray-500" />
                          )}
                          <span
                            className={
                              passcode.role === "admin"
                                ? "text-indigo-600 font-semibold"
                                : ""
                            }
                          >
                            {passcode.role}
                          </span>
                        </h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <Clock className="h-3 w-3" />
                          Last updated:{" "}
                          {new Date(passcode.updated_at).toLocaleString()}
                        </p>
                      </div>
                      {editingRole === passcode.role ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => cancelEditing(e)}
                          className="text-gray-600"
                        >
                          Cancel
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => startEditing(passcode.role, e)}
                          className="border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50"
                        >
                          Change Passcode
                        </Button>
                      )}
                    </div>

                    {editingRole === passcode.role && (
                      <div className="mt-4 space-y-3 p-3 bg-white rounded-md border border-gray-100">
                        <div className="space-y-1">
                          <Label
                            htmlFor={`new-passcode-${passcode.role}`}
                            className="text-sm"
                          >
                            New Passcode
                          </Label>
                          <div className="relative">
                            <Input
                              id={`new-passcode-${passcode.role}`}
                              type={showPasswords ? "text" : "password"}
                              value={newPasscode}
                              onChange={(e) => setNewPasscode(e.target.value)}
                              placeholder="Enter new passcode"
                              className="pr-10"
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                              autoComplete="new-password"
                            />
                            <button
                              type="button"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowPasswords(!showPasswords);
                              }}
                            >
                              {showPasswords ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>

                          {/* Password strength meter */}
                          {newPasscode && (
                            <div className="mt-1.5">
                              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${passwordStrength.color}`}
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      (passwordStrength.score / 6) * 100
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Strength: {passwordStrength.label}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <Label
                            htmlFor={`confirm-passcode-${passcode.role}`}
                            className="text-sm"
                          >
                            Confirm Passcode
                          </Label>
                          <div className="relative">
                            <Input
                              id={`confirm-passcode-${passcode.role}`}
                              type={showPasswords ? "text" : "password"}
                              value={confirmPasscode}
                              onChange={(e) =>
                                setConfirmPasscode(e.target.value)
                              }
                              placeholder="Confirm new passcode"
                              className={`pr-10 ${
                                confirmPasscode &&
                                newPasscode !== confirmPasscode
                                  ? "border-red-300 focus:border-red-500"
                                  : ""
                              }`}
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                              autoComplete="new-password"
                            />
                            <button
                              type="button"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowPasswords(!showPasswords);
                              }}
                            >
                              {showPasswords ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          {confirmPasscode &&
                            newPasscode !== confirmPasscode && (
                              <p className="text-xs text-red-500 mt-1">
                                Passcodes don't match
                              </p>
                            )}
                        </div>

                        {updateStatus.message && (
                          <div
                            className={`text-sm p-2 rounded-md ${
                              updateStatus.success
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : updateStatus.isWarning
                                ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              {updateStatus.success ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : updateStatus.isWarning ? (
                                <AlertTriangle className="h-4 w-4" />
                              ) : updateStatus.isLoading ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <AlertCircle className="h-4 w-4" />
                              )}
                              {updateStatus.message}
                            </div>
                          </div>
                        )}

                        <div className="pt-2 flex justify-end">
                          <Button
                            onClick={(e) =>
                              confirmPasscodeUpdate(passcode.role, e)
                            }
                            disabled={
                              !newPasscode ||
                              !confirmPasscode ||
                              newPasscode !== confirmPasscode
                            }
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            Update Passcode
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Confirmation dialog */}
            {showConfirmDialog && (
              <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-100 animate-fade-in">
                  <div className="flex items-center gap-2 mb-4 text-indigo-600">
                    <Shield className="h-5 w-5" />
                    <h3 className="text-lg font-medium">
                      Confirm Passcode Update
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to update the passcode for role{" "}
                    <span className="font-medium text-indigo-600">
                      {roleToUpdate}
                    </span>
                    ?
                  </p>
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowConfirmDialog(false)}
                      className="border-gray-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={updatePasscode}
                      className="bg-indigo-600 hover:bg-indigo-700 shadow-sm text-white"
                    >
                      Confirm
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="bg-gray-50 border-t border-gray-200 p-4 flex justify-between items-center">
            <p className="text-xs text-gray-500">
              {filteredAndSortedPasscodes.length}{" "}
              {filteredAndSortedPasscodes.length === 1 ? "role" : "roles"} found
              {searchTerm && ` for "${searchTerm}"`}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => setSearchTerm("")}
              disabled={!searchTerm}
            >
              Clear filter
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
