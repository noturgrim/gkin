import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  User,
  Mail,
  Save,
  AlertCircle,
  CheckCircle,
  Settings,
  ArrowLeft,
  Calendar,
  Shield,
  Lock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import api from "../../services/api";
import { getMyRoleEmail } from "../../services/roleEmailsService";

export function ProfileSettings() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState({
    username: "",
    email: "",
    role: "",
    id: null,
    created_at: null,
    last_active: null,
  });
  const [roleEmail, setRoleEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [formData, setFormData] = useState({
    username: "",
  });

  // Get current user from auth service
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUserProfile(currentUser);
      setFormData({
        username: currentUser.username || "",
      });
    }
    fetchProfile();
    fetchRoleEmail();
  }, []);

  // Fetch user profile from API
  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const profile = await api.get("/profile");
      setUserProfile(profile);
      setFormData({
        username: profile.username || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      setMessage({
        type: "error",
        text: "Failed to load profile information",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch role email from API
  const fetchRoleEmail = async () => {
    try {
      const response = await getMyRoleEmail();
      setRoleEmail(response.email || "");
    } catch (error) {
      console.error("Error fetching role email:", error);
      // Don't show error message, just leave email empty
    }
  };

  // Handle form submission
  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.username.trim()) {
      setMessage({
        type: "error",
        text: "Username is required",
      });
      return;
    }

    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await api.put("/profile", formData);

      // Update local user data
      const updatedUser = { ...userProfile, ...response.user };
      setUserProfile(updatedUser);

      // Update localStorage to maintain session
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        const updatedUserData = { ...currentUser, ...response.user };
        localStorage.setItem("currentUser", JSON.stringify(updatedUserData));
      }

      setMessage({
        type: "success",
        text: "Profile updated successfully!",
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update profile",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear messages when user starts typing
    if (message.text) {
      setMessage({ type: "", text: "" });
    }
  };

  // Role display configuration
  const getRoleConfig = (role) => {
    const configs = {
      liturgy: {
        name: "Liturgy Maker",
        color: "bg-blue-500",
        textColor: "text-blue-700",
      },
      pastor: {
        name: "Pastor",
        color: "bg-purple-500",
        textColor: "text-purple-700",
      },
      translation: {
        name: "Translator",
        color: "bg-green-500",
        textColor: "text-green-700",
      },
      beamer: {
        name: "Beamer Team",
        color: "bg-orange-500",
        textColor: "text-orange-700",
      },
      music: {
        name: "Musicians",
        color: "bg-pink-500",
        textColor: "text-pink-700",
      },
      treasurer: {
        name: "Treasurer",
        color: "bg-emerald-500",
        textColor: "text-emerald-700",
      },
      admin: {
        name: "Administrator",
        color: "bg-indigo-500",
        textColor: "text-indigo-700",
      },
    };
    return (
      configs[role] || {
        name: role,
        color: "bg-gray-500",
        textColor: "text-gray-700",
      }
    );
  };

  const roleConfig = getRoleConfig(userProfile.role);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0">
            <CardContent className="pt-12">
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <span className="text-lg font-medium text-gray-700">
                  Loading your profile...
                </span>
                <span className="text-sm text-gray-500 mt-2">
                  Please wait while we fetch your information
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header with Back Button - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 hover:bg-gray-50 border-gray-300 w-full sm:w-auto justify-center sm:justify-start"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div className="text-center w-full sm:flex-1 sm:mx-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
              Profile Settings
            </h1>
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg px-2">
              Manage your account information and preferences
            </p>
          </div>
          <div className="hidden sm:block w-32"></div>{" "}
          {/* Spacer for centering on desktop */}
        </div>

        {/* Main Content Grid - Responsive Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Profile Info Section - Stacks on mobile, sidebar on desktop */}
          <div className="xl:col-span-1 space-y-4 sm:space-y-6">
            {/* Profile Overview Card */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  Profile Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {/* Role Badge */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${roleConfig.color} flex items-center justify-center shadow-sm`}
                  >
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-500">
                      Role
                    </p>
                    <p
                      className={`text-sm sm:text-base font-semibold ${roleConfig.textColor}`}
                    >
                      {roleConfig.name}
                    </p>
                  </div>
                </div>

                {/* Member Since */}
                {userProfile.created_at && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-green-500 flex items-center justify-center shadow-sm">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-500">
                        Member Since
                      </p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900">
                        {new Date(userProfile.created_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: window.innerWidth < 640 ? "short" : "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Last Active */}
                {userProfile.last_active && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-sm">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-500">
                        Last Active
                      </p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900">
                        {new Date(userProfile.last_active).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Information Card */}
            <Card className="shadow-lg border-0 bg-blue-50/50 backdrop-blur">
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    <p className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">
                      About Role Email
                    </p>
                    <p className="leading-relaxed">
                      {userProfile.role === "pastor" ? (
                        <>
                          Pastor emails are managed through Service Assignments,
                          as different pastors are assigned per service date.
                          Notifications will be sent to the assigned pastor for
                          each specific service.
                        </>
                      ) : (
                        <>
                          Your role's email address is managed by the
                          administrator. All users in the {roleConfig.name} role
                          share the same email for notifications and system
                          updates.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Edit Form Section - Full width on mobile, 2/3 on desktop */}
          <div className="xl:col-span-2">
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur">
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                  <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                  Personal Information
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Update your username. Role email is managed by administrator.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-6 sm:space-y-8">
                  {/* Username field */}
                  <div>
                    <label
                      htmlFor="username"
                      className="text-sm font-semibold text-gray-700 mb-2 sm:mb-3 block"
                    >
                      Username *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="username"
                        className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white shadow-sm transition-all duration-200 text-sm sm:text-base"
                        placeholder="Enter your username"
                        value={formData.username}
                        onChange={(e) =>
                          handleInputChange("username", e.target.value)
                        }
                        required
                      />
                      <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Role Email field (Read-only) */}
                  <div>
                    <label
                      htmlFor="role-email"
                      className="text-sm font-semibold text-gray-700 mb-2 sm:mb-3 block flex items-center gap-2"
                    >
                      Role Email Address
                      <span className="text-xs font-normal text-gray-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Admin Managed
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        id="role-email"
                        className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 border border-gray-200 rounded-lg sm:rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed shadow-sm text-sm sm:text-base"
                        placeholder="No email set for this role"
                        value={roleEmail}
                        disabled
                        readOnly
                      />
                      <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2">
                        <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3 flex items-start sm:items-center gap-2">
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5 sm:mt-0" />
                      <span>
                        {userProfile.role === "pastor" ? (
                          <>
                            Pastor email is determined by who is assigned as
                            "Voorganger" in Service Assignments for each service
                            date.
                          </>
                        ) : (
                          <>
                            All {roleConfig.name} users share this email.
                            Contact an admin to change it.
                          </>
                        )}
                      </span>
                    </p>
                  </div>

                  {/* Message display */}
                  {message.text && (
                    <div
                      className={`flex items-start sm:items-center gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-sm ${
                        message.type === "success"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {message.type === "success" ? (
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5 sm:mt-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5 sm:mt-0" />
                      )}
                      <span className="font-medium text-sm sm:text-base">
                        {message.text}
                      </span>
                    </div>
                  )}

                  {/* Action Buttons - Stack on mobile, side by side on desktop */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="order-1 sm:order-none flex-1 h-12 sm:h-14 flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg sm:rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                          <span className="hidden sm:inline">
                            Saving Changes...
                          </span>
                          <span className="sm:hidden">Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                          Save Changes
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setFormData({
                          username: userProfile.username || "",
                        });
                        setMessage({ type: "", text: "" });
                      }}
                      className="order-2 sm:order-none px-6 sm:px-8 h-12 sm:h-14 rounded-lg sm:rounded-xl border-gray-300 hover:bg-gray-50 font-medium text-sm sm:text-base"
                    >
                      Reset
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
