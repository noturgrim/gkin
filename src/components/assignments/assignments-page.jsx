// src/components/assignments/assignments-page.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Calendar, Save, Plus, Trash2, ArrowLeft, ChevronRight, CheckCircle, Search, ChevronLeft, Filter } from "lucide-react";
import { Header } from "../header";
import { Footer } from "../ui/footer";
import { WeekSelector } from "../week-selector";
import { useAssignments } from "./context/AssignmentsContext";
import { getDefaultSelectedWeek } from "../../lib/date-utils";
import { Badge } from "../ui/badge";

export function AssignmentsPage() {
  const navigate = useNavigate();
  const [selectedWeek, setSelectedWeek] = useState(getDefaultSelectedWeek());
  const [viewMode, setViewMode] = useState("consolidated"); // "consolidated" or "weekly"
  const [searchQuery, setSearchQuery] = useState("");
  const [newRoleName, setNewRoleName] = useState("");
  const [visibleWeeks, setVisibleWeeks] = useState(4); // Number of weeks to show at once
  const [startWeekIndex, setStartWeekIndex] = useState(0); // Starting index for visible weeks
  const [dateRangeFilter, setDateRangeFilter] = useState("upcoming"); // "all", "upcoming", "past", "next4", "next8"
  
  const { 
    assignments, 
    updateAssignment, 
    addRole, 
    removeRole, 
    getAssignmentsForDate,
    addMoreFutureDates,
    saveAssignments 
  } = useAssignments();
  
  // Add state for local changes and saving status
  const [localAssignments, setLocalAssignments] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [user] = useState(() => {
    // Try to get user from localStorage on initial load
    const savedUser = localStorage.getItem("currentUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  // Get current service and update local assignments when selected week changes
  const currentService = getAssignmentsForDate(selectedWeek);
  
  // Initialize local assignments for all weeks
  useEffect(() => {
    if (assignments && assignments.length > 0) {
      const allLocalAssignments = {};
      assignments.forEach(service => {
        allLocalAssignments[service.dateString] = [...service.assignments.map(a => ({...a}))];
      });
      setLocalAssignments(allLocalAssignments);
      setHasChanges(false);
    }
  }, [assignments]);
  
  // Update local assignment without saving to context
  const handleLocalUpdate = (dateString, roleIndex, newPerson) => {
    setLocalAssignments(prev => {
      const updated = {...prev};
      if (!updated[dateString]) {
        updated[dateString] = [];
      }
      updated[dateString] = [...updated[dateString]];
      updated[dateString][roleIndex] = {
        ...updated[dateString][roleIndex],
        person: newPerson
      };
      return updated;
    });
    setHasChanges(true);
    setSaveSuccess(false);
  };
  
  // Save changes to context/localStorage
  const handleSaveChanges = async () => {
    if (!hasChanges) return;
    
    setIsSaving(true);
    
    // Update assignments in context for all weeks
    Object.entries(localAssignments).forEach(([dateString, weekAssignments]) => {
      weekAssignments.forEach((assignment, index) => {
        updateAssignment(dateString, index, assignment.person);
      });
    });
    
    // Save to localStorage (and future backend)
    try {
      await saveAssignments();
      setSaveSuccess(true);
      setHasChanges(false);
      
      // Reset success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving assignments:", error);
      // Handle error here
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleAddRole = (e) => {
    e.preventDefault();
    if (newRoleName.trim()) {
      addRole(newRoleName.trim());
      setNewRoleName("");
      
      // Update local assignments with the new role for all weeks
      setLocalAssignments(prev => {
        const updated = {...prev};
        Object.keys(updated).forEach(dateString => {
          updated[dateString] = [
            ...updated[dateString],
            { role: newRoleName.trim(), person: "" }
          ];
        });
        return updated;
      });
      setHasChanges(true);
    }
  };
  
  const handleRemoveRole = (roleIndex) => {
    if (window.confirm("Are you sure you want to remove this role from all services?")) {
      removeRole(roleIndex);
      
      // Update local assignments for all weeks
      setLocalAssignments(prev => {
        const updated = {...prev};
        Object.keys(updated).forEach(dateString => {
          updated[dateString] = [...updated[dateString]];
          updated[dateString].splice(roleIndex, 1);
        });
        return updated;
      });
      setHasChanges(true);
    }
  };

  const handleAddMoreDates = () => {
    addMoreFutureDates(4); // Add 4 more future dates
  };
  
  // Handle pagination for weeks
  const handleNextWeeks = () => {
    if (startWeekIndex + visibleWeeks < filteredAssignments.length) {
      setStartWeekIndex(prev => prev + visibleWeeks);
    }
  };

  const handlePrevWeeks = () => {
    setStartWeekIndex(prev => Math.max(0, prev - visibleWeeks));
  };

  // Apply date range filter
  const getFilteredByDateRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (dateRangeFilter) {
      case "upcoming":
        return assignments.filter(service => {
          // Ensure proper date handling with UTC
          const serviceDate = new Date(service.dateString + 'T00:00:00Z');
          // Verify it's a Sunday
          if (serviceDate.getUTCDay() !== 0) {
            const adjustment = serviceDate.getUTCDay() === 6 ? 1 : 7 - serviceDate.getUTCDay();
            serviceDate.setUTCDate(serviceDate.getUTCDate() + adjustment);
          }
          return serviceDate >= today;
        });
      case "past":
        return assignments.filter(service => {
          const serviceDate = new Date(service.dateString + 'T00:00:00Z');
          return serviceDate < today;
        });
      case "next4":
        return assignments.filter(service => {
          const serviceDate = new Date(service.dateString + 'T00:00:00Z');
          return serviceDate >= today;
        }).slice(0, 4);
      case "next8":
        return assignments.filter(service => {
          const serviceDate = new Date(service.dateString + 'T00:00:00Z');
          return serviceDate >= today;
        }).slice(0, 8);
      case "all":
      default:
        return assignments;
    }
  };
  
  // Filter assignments based on search query and date range
  const filteredByDateRange = getFilteredByDateRange();
  const filteredAssignments = searchQuery.trim() !== '' 
    ? filteredByDateRange.filter(service => 
        service.assignments.some(assignment => 
          assignment.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
          assignment.person.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : filteredByDateRange;
  
  // Get visible weeks for the table
  const visibleAssignments = filteredAssignments.slice(
    startWeekIndex,
    startWeekIndex + visibleWeeks
  );
  
  // If no user is logged in, redirect to login
  if (!user) {
    navigate("/login");
    return null;
  }

  // Update the date handling in the formatDate function and where dates are displayed
  const formatDate = (dateString) => {
    // Ensure we're creating the date with proper UTC handling
    const date = new Date(dateString + 'T00:00:00Z');
    
    // Verify it's a Sunday (0 in JavaScript)
    if (date.getUTCDay() !== 0) {
      console.warn('Date is not a Sunday:', dateString);
      // Fix the date to be a Sunday
      const adjustment = date.getUTCDay() === 6 ? 1 : 7 - date.getUTCDay();
      date.setUTCDate(date.getUTCDate() + adjustment);
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  // Check if a person is assigned to multiple roles on the same date
  const findDuplicateAssignments = () => {
    const duplicates = {};
    
    Object.entries(localAssignments).forEach(([dateString, assignments]) => {
      const peopleMap = {};
      
      assignments.forEach((assignment, index) => {
        const person = assignment.person.trim();
        if (person && person !== "") {
          if (!peopleMap[person]) {
            peopleMap[person] = [index];
          } else {
            peopleMap[person].push(index);
            if (!duplicates[dateString]) {
              duplicates[dateString] = {};
            }
            duplicates[dateString][person] = peopleMap[person];
          }
        }
      });
    });
    
    return duplicates;
  };
  
  const duplicateAssignments = findDuplicateAssignments();

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        <Header
          title="Service Assignments"
          subtitle="Manage assignments for weekly services"
          user={user}
          onLogout={() => {
            localStorage.removeItem("currentUser");
            navigate("/login");
          }}
          showUserInfo={true}
          showLogout={true}
        />
        
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
                variant={viewMode === "consolidated" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("consolidated")}
                className={`flex-1 md:flex-none ${
                  viewMode === "consolidated" 
                    ? "bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm" 
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                All Weeks
              </Button>
              <Button
                variant={viewMode === "weekly" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("weekly")}
                className={`flex-1 md:flex-none ${
                  viewMode === "weekly" 
                    ? "bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm" 
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                Week by Week
              </Button>
            </div>
            
            <div className="flex w-full md:w-auto items-center gap-2">
              <Button
                variant="outline" 
                size="sm" 
                onClick={handleAddMoreDates}
                className="flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add More Dates
              </Button>
              
              <Button
                variant={hasChanges ? "default" : "outline"}
                size="sm"
                onClick={handleSaveChanges}
                disabled={!hasChanges || isSaving}
                className={`flex items-center gap-1 ${
                  hasChanges ? "bg-blue-600 hover:bg-blue-700 text-white" : ""
                }`}
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
        
        {viewMode === "weekly" && (
          <div className="overflow-x-auto">
            <WeekSelector
              selectedWeek={selectedWeek}
              onWeekChange={setSelectedWeek}
              customWeeks={assignments}
            />
          </div>
        )}
        
        {/* Search and filter controls for consolidated view */}
        {viewMode === "consolidated" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative md:col-span-2">
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
            
            <div className="flex items-center gap-2">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-4 w-4 text-gray-400" />
                </div>
                <select 
                  value={dateRangeFilter}
                  onChange={(e) => {
                    setDateRangeFilter(e.target.value);
                    setStartWeekIndex(0); // Reset pagination when filter changes
                  }}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium text-gray-700"
                >
                  <option value="upcoming">Upcoming Services</option>
                  <option value="past">Past Services</option>
                  <option value="next4">Next 4 Weeks</option>
                  <option value="next8">Next 8 Weeks</option>
                  <option value="all">All Services</option>
                </select>
              </div>
              
              <select
                value={visibleWeeks}
                onChange={(e) => {
                  setVisibleWeeks(Number(e.target.value));
                  setStartWeekIndex(0); // Reset pagination when view size changes
                }}
                className="py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium text-gray-700 min-w-[90px]"
              >
                <option value="4">Show 4</option>
                <option value="6">Show 6</option>
                <option value="8">Show 8</option>
                <option value="12">Show 12</option>
              </select>
            </div>
          </div>
        )}
        
        {viewMode === "weekly" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="lg:col-span-2">
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="bg-gray-50 border-b border-gray-200 p-3">
                  <CardTitle className="text-base font-bold flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Edit Service Assignments for {(() => {
                      const date = new Date(currentService?.dateString + 'T00:00:00Z');
                      // Ensure it's a Sunday
                      if (date.getUTCDay() !== 0) {
                        console.warn('Date is not a Sunday:', currentService?.dateString);
                        // Adjust to nearest Sunday if needed
                        const adjustment = date.getUTCDay() === 6 ? 1 : 7 - date.getUTCDay();
                        date.setUTCDate(date.getUTCDate() + adjustment);
                      }
                      return date.toLocaleDateString('en-US', { 
                        weekday: 'long',
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      });
                    })()}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  {localAssignments[currentService?.dateString]?.map((assignment, index) => (
                    <div 
                      key={index}
                      className="grid grid-cols-12 gap-2 border-b border-gray-100 py-3 last:border-0"
                    >
                      <div className="col-span-4 flex items-center">
                        <Label className="text-sm font-medium text-gray-700">
                          {assignment.role}
                        </Label>
                      </div>
                      <div className="col-span-7">
                        <Input 
                          value={assignment.person} 
                          onChange={(e) => handleLocalUpdate(currentService.dateString, index, e.target.value)}
                          className="text-sm"
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
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="bg-gray-50 border-b border-gray-200 p-3">
                  <CardTitle className="text-base font-bold">
                    Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {localAssignments[currentService?.dateString]?.map((assignment, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-1 border-b border-gray-100 pb-2 last:border-0 last:pb-0"
                      >
                        <div className="col-span-4 text-gray-800 font-medium text-right pr-1 text-sm">
                          {assignment.role}
                        </div>
                        <div className="col-span-1 text-gray-400 text-center text-sm">
                          :
                        </div>
                        <div className="col-span-7 text-gray-900 text-sm">
                          {assignment.person || <span className="text-gray-400 italic">Not assigned</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          // Consolidated view - All weeks at once with pagination
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50 border-b border-gray-200 p-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <CardTitle className="text-base font-bold flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  All Service Assignments
                </CardTitle>
                
                {filteredAssignments.length > visibleWeeks && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevWeeks}
                      disabled={startWeekIndex === 0}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <span className="text-xs font-medium text-gray-600">
                      {startWeekIndex + 1}-{Math.min(startWeekIndex + visibleWeeks, filteredAssignments.length)} of {filteredAssignments.length}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextWeeks}
                      disabled={startWeekIndex + visibleWeeks >= filteredAssignments.length}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left p-3 text-sm font-medium text-gray-700 sticky left-0 bg-gray-50 z-10">Role</th>
                      {visibleAssignments.map(service => {
                        // Create a proper date with UTC handling
                        const date = new Date(service.dateString + 'T00:00:00Z');
                        
                        // Verify it's a Sunday
                        let displayDate = service.dateString;
                        if (date.getUTCDay() !== 0) {
                          const adjustment = date.getUTCDay() === 6 ? 1 : 7 - date.getUTCDay();
                          date.setUTCDate(date.getUTCDate() + adjustment);
                          displayDate = date.toISOString().split('T')[0];
                        }
                        
                        return (
                          <th key={displayDate} className="text-center p-3 text-sm font-medium text-gray-700">
                            <div className="flex flex-col items-center">
                              <Badge className="mb-1">{formatDate(displayDate)}</Badge>
                            </div>
                          </th>
                        );
                      })}
                      <th className="w-10 p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.length > 0 && assignments[0].assignments.map((_, roleIndex) => {
                      const roleName = assignments[0].assignments[roleIndex].role;
                      return (
                        <tr key={roleIndex} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-3 text-sm font-medium text-gray-700 sticky left-0 bg-white z-10 border-r border-gray-100">{roleName}</td>
                          {visibleAssignments.map(service => {
                            // Check if this person is assigned to multiple roles on this date
                            const person = localAssignments[service.dateString]?.[roleIndex]?.person || '';
                            const isDuplicate = person && 
                              duplicateAssignments[service.dateString] && 
                              duplicateAssignments[service.dateString][person];
                            
                            return (
                              <td key={service.dateString} className="p-2 text-center">
                                <Input 
                                  value={person} 
                                  onChange={(e) => handleLocalUpdate(service.dateString, roleIndex, e.target.value)}
                                  className={`text-sm text-center ${isDuplicate ? 'border-orange-300 bg-orange-50' : ''}`}
                                />
                              </td>
                            );
                          })}
                          <td className="p-2 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveRole(roleIndex)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
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
        {viewMode === "consolidated" && Object.keys(duplicateAssignments).length > 0 && (
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