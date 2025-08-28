import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  FileText,
  Users,
  Music,
  Video,
  BookOpen,
  LogIn,
  DollarSign,
  AlertCircle,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";

const roles = [
  {
    id: "liturgy",
    name: "Liturgy Maker",
    icon: FileText,
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    description: "Create and manage liturgy documents",
  },
  {
    id: "pastor",
    name: "Pastor",
    icon: BookOpen,
    color: "bg-purple-500",
    textColor: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    description: "Review and approve liturgy content",
  },
  {
    id: "translation",
    name: "Translator",
    icon: Users,
    color: "bg-green-500",
    textColor: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    description: "Translate liturgy content",
  },
  {
    id: "beamer",
    name: "Beamer Team",
    icon: Video,
    color: "bg-orange-500",
    textColor: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    description: "Create presentation slides",
  },
  {
    id: "music",
    name: "Musicians",
    icon: Music,
    color: "bg-pink-500",
    textColor: "text-pink-700",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    description: "Prepare music arrangements",
  },
  {
    id: "treasurer",
    name: "Treasurer",
    icon: DollarSign,
    color: "bg-emerald-500",
    textColor: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    description: "Manage financial records and budgets",
  },
  {
    id: "admin",
    name: "Administrator",
    icon: Shield,
    color: "bg-indigo-500",
    textColor: "text-indigo-700",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    description: "System administration and security",
  },
];

export function LoginPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [username, setUsername] = useState("");
  const [passcode, setPasscode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if user is already logged in
  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate("/");
    }
  }, [navigate]);

  const handleLogin = async () => {
    if (!selectedRole || !username.trim() || !passcode.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Call authentication service to login
      await authService.login(username, selectedRole.id, passcode);
      navigate("/");
    } catch (error) {
      setError(error.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-3">
      <div className="w-full max-w-sm">
        {/* Logo/Brand Header */}
        <div className="flex justify-center mb-4">
          <div className="bg-white p-2 rounded-lg shadow-md border border-gray-200 flex items-center gap-1.5">
            <div className="bg-blue-600 text-white p-1.5 rounded-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <h1 className="text-base font-bold text-gray-800">GKIN RWDH</h1>
          </div>
        </div>

        <Card className="border-0 shadow-lg overflow-hidden">
          {/* Card Header with Decorative Element */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 h-1.5"></div>
            <CardHeader className="pt-6 pb-4 text-center bg-white">
              <CardTitle className="text-xl font-bold text-gray-900">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-gray-600 mt-0.5 text-sm">
                Sign in to the Dienst Dashboard
              </CardDescription>
            </CardHeader>
          </div>

          <CardContent className="pt-4 pb-2 space-y-4 bg-white px-4">
            {/* Username Input with Modern Styling */}
            <div className="space-y-1.5">
              <label
                htmlFor="username"
                className=" text-xs font-medium text-gray-700 flex items-center gap-1.5"
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
                  className="text-gray-500"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Your Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="username"
                  className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 text-sm"
                  placeholder="Enter your name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                {username && (
                  <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md flex items-center gap-1.5 text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            
            {/* Passcode Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="passcode"
                className="text-xs font-medium text-gray-700 flex items-center gap-1.5"
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
                  className="text-gray-500"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Passcode
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="passcode"
                  className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 text-sm"
                  placeholder="Enter your role passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                />
                {passcode && (
                  <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Role Selection with Enhanced Visual Design */}
            <div className="space-y-2">
              <label className=" text-xs font-medium text-gray-700 flex items-center gap-1.5">
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
                  className="text-gray-500"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
                Select Your Role
              </label>
              <div className="grid grid-cols-1 gap-2">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className={`flex items-center p-2 rounded-md cursor-pointer border transition-all ${
                      selectedRole?.id === role.id
                        ? `${role.borderColor} ${role.bgColor} border-2`
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedRole(role)}
                  >
                    <div
                      className={`w-8 h-8 rounded-full ${role.color} flex items-center justify-center shadow-sm`}
                    >
                      <role.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="ml-2.5 flex-1 min-w-0">
                      <div
                        className={`font-medium text-xs truncate ${
                          selectedRole?.id === role.id
                            ? role.textColor
                            : "text-gray-800"
                        }`}
                      >
                        {role.name}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate">
                        {role.description}
                      </div>
                    </div>
                    {selectedRole?.id === role.id && (
                      <div className="ml-auto">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${role.color}`}
                        ></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end pt-3 pb-4 bg-white px-4">
            <Button
              onClick={handleLogin}
              disabled={!selectedRole || !username.trim() || !passcode.trim() || isLoading}
              className={`w-full h-9 flex items-center justify-center gap-1.5 ${
                selectedRole
                  ? selectedRole.id === "liturgy"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : selectedRole.id === "pastor"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : selectedRole.id === "translation"
                    ? "bg-green-600 hover:bg-green-700"
                    : selectedRole.id === "beamer"
                    ? "bg-orange-600 hover:bg-orange-700"
                    : selectedRole.id === "music"
                    ? "bg-pink-600 hover:bg-pink-700"
                    : selectedRole.id === "admin"
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-gray-600 hover:bg-gray-700"
              } text-white font-medium rounded-md shadow-md hover:shadow-lg transition-all text-sm`}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Footer */}
        <div className="mt-4 text-center text-[10px] text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} GKIN RWDH. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
