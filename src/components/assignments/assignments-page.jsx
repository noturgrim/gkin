// src/components/assignments/assignments-page.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Calendar, Save, Plus, Trash2, ArrowLeft, CheckCircle, RefreshCw } from "lucide-react";
import { Header } from "../header";
import { Footer } from "../ui/footer";
import { WeekSelector } from "../week-selector";
import { useAssignments } from "./context/AssignmentsContext";
import { getDefaultSelectedWeek } from "../../lib/date-utils";
import { Badge } from "../ui/badge";

export function AssignmentsPage() {
  const navigate = useNavigate();
  const [selectedWeek, setSelectedWeek] = useState(getDefaultSelectedWeek());
  const [newRoleName, setNewRoleName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    assignments,
    updateAssignment,
    addRole,
    removeRole,
    getAssignmentsForDate,
    saveAssignments,
    resetAssignments
  } = useAssignments();

  const [user] = useState(() => {
    const savedUser = localStorage.getItem("currentUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Get current service
  const currentService = getAssignmentsForDate(selectedWeek);

  // Save changes
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      await saveAssignments();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving assignments:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Add new role
  const handleAddRole = (e) => {
    e.preventDefault();
    if (newRoleName.trim()) {
      addRole(newRoleName.trim());
      setNewRoleName("");
    }
  };

  // Remove role with confirmation
  const handleRemoveRole = (roleIndex) => {
    if (window.confirm("Are you sure you want to remove this role from all services?")) {
      removeRole(roleIndex);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00Z');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Check for duplicate assignments
  const findDuplicateAssignments = () => {
    const duplicates = {};
    assignments.forEach(service => {
      const peopleMap = {};
      service.assignments.forEach((assignment, index) => {
        const person = assignment.person.trim();
        if (person && person !== "") {
          if (!peopleMap[person]) {
            peopleMap[person] = [index];
          } else {
            peopleMap[person].push(index);
            if (!duplicates[service.dateString]) {
              duplicates[service.dateString] = {};
            }
            duplicates[service.dateString][person] = peopleMap[person];
          }
        }
      });
    });
    return duplicates;
  };

  const duplicateAssignments = findDuplicateAssignments();

  // Redirect if not logged in
  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        <Header
          title="Service Assignments"
          subtitle="Manage assignments for weekly church services"
          user={user}
          onLogout={() => {
            localStorage.removeItem("currentUser");
            navigate("/login");
          }}
          showUserInfo={true}
          showLogout={true}
        />

        {/* Action buttons - Simplified */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Back Button */}
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 h-12 px-4 border-2 border-gray-300 hover:border-blue-300 text-base font-medium"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="w-5 h-5" /> Back to Dashboard
          </Button>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={resetAssignments}
              className="flex items-center justify-center gap-1 h-12 px-4 border-2 border-orange-300 text-orange-600 hover:text-orange-700 hover:border-orange-400 text-base font-medium"
              title="Clear all person assignments and reset to default roles only"
            >
              <RefreshCw className="w-5 h-5" /> 
              <span className="hidden sm:inline">Clear Assignments</span>
              <span className="sm:hidden">Clear</span>
            </Button>

            <Button
              variant="default"
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="flex items-center justify-center gap-1 h-12 px-4 bg-blue-600 hover:bg-blue-700 text-white text-base font-medium"
            >
              <Save className="w-5 h-5" />
              <span className="hidden sm:inline">{isSaving ? "Saving..." : "Save Changes"}</span>
              <span className="sm:hidden">{isSaving ? "..." : "Save"}</span>
            </Button>
          </div>
        </div>

        {saveSuccess && (
          <div className="bg-green-50 border-2 border-green-200 text-green-800 px-4 py-3 text-base flex items-center shadow-sm">
            <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="font-medium">Changes saved successfully!</span>
          </div>
        )}

        {/* Week selector */}
        <div className="overflow-x-auto">
          <WeekSelector
            selectedWeek={selectedWeek}
            onWeekChange={setSelectedWeek}
          />
        </div>

        {/* Main content - Weekly View Only */}
        <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6">
          {/* Edit Card */}
          <Card className="border-2 border-gray-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200 p-4 md:p-3">
              <CardTitle className="text-lg md:text-base font-bold flex items-center gap-2 md:gap-1 text-blue-900">
                <Calendar className="w-5 h-5 md:w-4 md:h-4 text-blue-600" />
                <span className="hidden sm:inline">Edit Assignments for</span>
                <span className="sm:hidden">Edit</span>
                <span className="text-blue-700">{currentService ? formatDate(currentService.dateString) : 'No Service Found'}</span>
              </CardTitle>
            </CardHeader>
              <CardContent className="p-4 md:p-3">
                {currentService ? (
                  <>
                    {/* Mobile Layout - Stacked */}
                    <div className="space-y-4 lg:hidden">
                      {currentService.assignments.map((assignment, index) => (
                        <div key={index} className="bg-gray-50 border border-gray-200 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <Label className="text-base font-semibold text-gray-800">
                              {assignment.role}
                            </Label>
                            <Button
                              variant="ghost"
                              onClick={() => handleRemoveRole(index)}
                              className="h-12 w-12 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                          <Input
                            value={assignment.person}
                            onChange={(e) => updateAssignment(currentService.dateString, index, e.target.value)}
                            className="text-base h-12 border-2 border-gray-300 focus:border-blue-400"
                            placeholder="Enter person name"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Desktop Layout - Grid */}
                    <div className="hidden lg:block space-y-2">
                      {currentService.assignments.map((assignment, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 border-b border-gray-100 py-3 last:border-0">
                          <div className="col-span-4 flex items-center">
                            <Label className="text-base font-medium text-gray-700">
                              {assignment.role}
                            </Label>
                          </div>
                          <div className="col-span-7">
                            <Input
                              value={assignment.person}
                              onChange={(e) => updateAssignment(currentService.dateString, index, e.target.value)}
                              className="text-base h-10 border-2 border-gray-300 focus:border-blue-400"
                              placeholder="Enter person name"
                            />
                          </div>
                          <div className="col-span-1 flex items-center justify-center">
                            <Button
                              variant="ghost"
                              onClick={() => handleRemoveRole(index)}
                              className="h-10 w-10 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Role Form */}
                    <form onSubmit={handleAddRole} className="mt-6 pt-4 border-t-2 border-gray-100">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add new role..."
                          value={newRoleName}
                          onChange={(e) => setNewRoleName(e.target.value)}
                          className="text-base h-12 border-2 border-gray-300 focus:border-blue-400"
                        />
                        <Button 
                          type="submit" 
                          className="flex items-center gap-1 h-12 px-4 bg-blue-600 hover:bg-blue-700 text-white text-base font-medium whitespace-nowrap"
                        >
                          <Plus className="h-5 w-5" /> 
                          <span className="hidden sm:inline">Add Role</span>
                          <span className="sm:hidden">Add</span>
                        </Button>
                      </div>
              </form>
            </>
          ) : (
            <div className="text-center py-12 md:py-8 text-gray-500">
              <Calendar className="w-16 h-16 md:w-12 md:h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-base md:text-sm">No service found for the selected date.</p>
              <p className="text-sm md:text-xs mt-2">Please select a different date or add this date to your services.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview card - Hidden on mobile, shown on desktop */}
      <Card className="hidden lg:block border border-gray-200 shadow-sm">
        <CardHeader className="bg-gray-50 border-b border-gray-200 p-3">
          <CardTitle className="text-base font-bold">Preview</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          {currentService ? (
            <div className="space-y-2">
              {currentService.assignments.map((assignment, index) => (
                <div key={index} className="grid grid-cols-12 gap-1 border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                  <div className="col-span-5 text-gray-800 font-medium text-right pr-1 text-sm">
                    {assignment.role}
                  </div>
                  <div className="col-span-1 text-gray-400 text-center text-sm">:</div>
                  <div className="col-span-6 text-gray-900 text-sm">
                    {assignment.person || <span className="text-gray-400 italic">Not assigned</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No service selected
            </div>
          )}
        </CardContent>
      </Card>
    </div>        {/* Duplicate assignments warning - Mobile Optimized */}
        {Object.keys(duplicateAssignments).length > 0 && (
          <div className="bg-orange-50 border-2 border-orange-200 text-orange-800 px-4 py-4 text-base shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
              </div>
              <div>
                <h3 className="font-bold mb-2 text-base">Potential Scheduling Conflicts</h3>
                <ul className="space-y-2">
                  {Object.entries(duplicateAssignments).map(([dateString, people]) => (
                    Object.entries(people).map(([person, roles]) => (
                      <li key={`${dateString}-${person}`} className="flex flex-col md:flex-row md:items-center gap-1">
                        <span className="font-semibold text-orange-900">{person}</span> 
                        <span className="text-base">is assigned to multiple roles on</span>
                        <span className="font-medium text-orange-700">{formatDate(dateString)}</span>
                      </li>
                    ))
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
}