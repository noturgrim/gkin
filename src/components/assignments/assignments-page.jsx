// src/components/assignments/assignments-page.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Calendar, Save, Plus, Trash2, ArrowLeft, CheckCircle, Search, Filter, PlusCircle, RefreshCw } from "lucide-react";
import { Header } from "../header";
import { Footer } from "../ui/footer";
import { WeekSelector } from "../week-selector";
import { useAssignments } from "./context/AssignmentsContext";
import { getDefaultSelectedWeek } from "../../lib/date-utils";
import { Badge } from "../ui/badge";

export function AssignmentsPage() {
  const navigate = useNavigate();
  const [selectedWeek, setSelectedWeek] = useState(getDefaultSelectedWeek());
  const [viewMode, setViewMode] = useState("weekly"); // "weekly" or "consolidated"
  const [searchQuery, setSearchQuery] = useState("");
  const [newRoleName, setNewRoleName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateToAdd, setDateToAdd] = useState("");

  const {
    assignments,
    updateAssignment,
    addRole,
    removeRole,
    getAssignmentsForDate,
    addMoreFutureDates,
    saveAssignments,
    removeDate,
    addSpecificDate,
    resetAssignments
  } = useAssignments();

  const [user] = useState(() => {
    const savedUser = localStorage.getItem("currentUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Get current service
  const currentService = getAssignmentsForDate(selectedWeek);

  // Filter assignments based on search query
  const filteredAssignments = searchQuery.trim() !== ''
    ? assignments.filter(service =>
        service.assignments.some(assignment =>
          assignment.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
          assignment.person.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : assignments;

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

  // Add more dates
  const handleAddMoreDates = () => {
    addMoreFutureDates(4);
  };

  // Remove specific date
  const handleRemoveDate = (dateString) => {
    if (window.confirm(`Are you sure you want to remove the service on ${formatDate(dateString)}?`)) {
      removeDate(dateString);
      // If we're removing the currently selected week, select another one
      if (dateString === selectedWeek) {
        const remainingWeeks = assignments.filter(s => s.dateString !== dateString);
        if (remainingWeeks.length > 0) {
          setSelectedWeek(remainingWeeks[0].dateString);
        } else {
          setSelectedWeek(getDefaultSelectedWeek());
        }
      }
    }
  };

  // Add specific date
  const handleAddSpecificDate = (e) => {
    e.preventDefault();
    if (dateToAdd) {
      // Ensure the date is a Sunday
      const date = new Date(dateToAdd + 'T00:00:00Z');
      if (date.getUTCDay() !== 0) {
        // Adjust to the next Sunday
        const adjustment = 7 - date.getUTCDay();
        date.setUTCDate(date.getUTCDate() + adjustment);
        const sundayDate = date.toISOString().split('T')[0];
        addSpecificDate(sundayDate);
      } else {
        addSpecificDate(dateToAdd);
      }
      setShowDatePicker(false);
      setDateToAdd("");
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

        {/* Action buttons */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>

          <div className="flex flex-col md:flex-row items-center gap-2">
            <div className="flex w-full md:w-auto items-center gap-2">
              <Button
                variant={viewMode === "weekly" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("weekly")}
                className={viewMode === "weekly" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
              >
                Weekly View
              </Button>
              <Button
                variant={viewMode === "consolidated" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("consolidated")}
                className={viewMode === "consolidated" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
              >
                All Weeks
              </Button>
            </div>

            <div className="flex w-full md:w-auto items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddMoreDates}
                className="flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add 4 Weeks
              </Button>

              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center gap-1"
                >
                  <PlusCircle className="w-4 h-4" /> Add Date
                </Button>

                {showDatePicker && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 z-20 w-64">
                    <form onSubmit={handleAddSpecificDate}>
                      <div className="mb-2">
                        <Label htmlFor="date-picker" className="text-xs font-medium text-gray-700">
                          Select Sunday (will adjust to Sunday)
                        </Label>
                        <Input
                          id="date-picker"
                          type="date"
                          value={dateToAdd}
                          onChange={(e) => setDateToAdd(e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDatePicker(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                          Add
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={resetAssignments}
                className="flex items-center gap-1 text-orange-600 hover:text-orange-700"
                title="Reset all assignments to default roles"
              >
                <RefreshCw className="w-4 h-4" /> Reset
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>

        {saveSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-md text-sm flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            Changes saved successfully!
          </div>
        )}

        {/* Week selector for weekly view */}
        {viewMode === "weekly" && (
          <div className="overflow-x-auto">
            <WeekSelector
              selectedWeek={selectedWeek}
              onWeekChange={setSelectedWeek}
            />
          </div>
        )}

        {/* Search bar for consolidated view */}
        {viewMode === "consolidated" && (
          <div className="flex gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search roles or people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {/* Main content */}
        {viewMode === "weekly" ? (
          // Weekly view
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 border-b border-gray-200 p-3">
                <CardTitle className="text-base font-bold flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Edit Assignments for {currentService ? formatDate(currentService.dateString) : 'No Service Found'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                {currentService ? (
                  <>
                    {currentService.assignments.map((assignment, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 border-b border-gray-100 py-3 last:border-0">
                        <div className="col-span-4 flex items-center">
                          <Label className="text-sm font-medium text-gray-700">
                            {assignment.role}
                          </Label>
                        </div>
                        <div className="col-span-7">
                          <Input
                            value={assignment.person}
                            onChange={(e) => updateAssignment(currentService.dateString, index, e.target.value)}
                            className="text-sm"
                            placeholder="Enter person name"
                          />
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRole(index)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    <form onSubmit={handleAddRole} className="mt-4 pt-3 border-t border-gray-100">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add new role..."
                          value={newRoleName}
                          onChange={(e) => setNewRoleName(e.target.value)}
                          className="text-sm"
                        />
                        <Button type="submit" className="flex items-center gap-1">
                          <Plus className="h-4 w-4" /> Add Role
                        </Button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No service found for the selected date.</p>
                    <p className="text-sm mt-2">Please select a different date or add this date to your services.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preview card */}
            <Card className="border border-gray-200 shadow-sm">
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
          </div>
        ) : (
          // Consolidated view
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50 border-b border-gray-200 p-3">
              <CardTitle className="text-base font-bold flex items-center gap-1">
                <Calendar className="w-4 h-4 text-blue-600" />
                All Service Assignments ({filteredAssignments.length} services)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left p-3 text-sm font-medium text-gray-700 sticky left-0 bg-gray-50 z-10">
                        Role
                      </th>
                      {filteredAssignments.slice(0, 8).map(service => (
                        <th key={service.dateString} className="text-center p-3 text-sm font-medium text-gray-700">
                          <div className="flex items-center justify-center gap-1">
                            <Badge className="px-3 py-1 bg-gray-100 text-gray-800 hover:bg-gray-200 border-none">
                              {formatDate(service.dateString)}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveDate(service.dateString)}
                              className="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-transparent"
                              title="Remove this date"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.length > 0 && assignments[0].assignments.map((_, roleIndex) => {
                      const roleName = assignments[0].assignments[roleIndex].role;
                      return (
                        <tr key={roleIndex} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-3 text-sm font-medium text-gray-700 sticky left-0 bg-white z-10 border-r border-gray-100">
                            {roleName}
                          </td>
                          {filteredAssignments.slice(0, 8).map(service => {
                            const assignment = service.assignments[roleIndex];
                            const person = assignment?.person || '';
                            const isDuplicate = person &&
                              duplicateAssignments[service.dateString] &&
                              duplicateAssignments[service.dateString][person];

                            return (
                              <td key={service.dateString} className="p-2 text-center">
                                <Input
                                  value={person}
                                  onChange={(e) => updateAssignment(service.dateString, roleIndex, e.target.value)}
                                  className={`text-sm text-center ${isDuplicate ? 'border-orange-300 bg-orange-50' : ''}`}
                                  placeholder="Name"
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <form onSubmit={handleAddRole} className="p-3 mt-2 border-t border-gray-100">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new role..."
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="text-sm"
                  />
                  <Button
                    type="submit"
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-medium whitespace-nowrap px-4"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" /> Add Role
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Duplicate assignments warning */}
        {Object.keys(duplicateAssignments).length > 0 && (
          <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-md text-sm">
            <h3 className="font-bold mb-1">Potential Scheduling Conflicts</h3>
            <ul className="list-disc pl-5 space-y-1">
              {Object.entries(duplicateAssignments).map(([dateString, people]) => (
                Object.entries(people).map(([person, roles]) => (
                  <li key={`${dateString}-${person}`}>
                    <span className="font-medium">{person}</span> is assigned to multiple roles on {formatDate(dateString)}
                  </li>
                ))
              ))}
            </ul>
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
}