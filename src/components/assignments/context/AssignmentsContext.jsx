// src/components/assignments/context/AssignmentsContext.jsx
import { createContext, useState, useContext, useEffect } from "react";
import { getUpcomingSundays } from "../../../lib/date-utils";
import * as assignmentsService from "../../../services/assignmentsService";

const AssignmentsContext = createContext();

export const useAssignments = () => useContext(AssignmentsContext);

// Default church service roles in Dutch as requested by user
const DEFAULT_ROLES = [
  { role: "Voorganger", person: "" },
  { role: "Ouderling van dienst", person: "" },
  { role: "Muzikale begeleiding", person: "" },
  { role: "Voorzangers", person: "" },
];

export const AssignmentsProvider = ({ children }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load assignments from backend on component mount
  useEffect(() => {
    // Only load assignments if user is authenticated
    const checkAuthAndLoad = () => {
      const user = localStorage.getItem('currentUser');
      if (user) {
        try {
          const parsedUser = JSON.parse(user);
          if (parsedUser.token) {
            loadAssignments();
          }
        } catch (err) {
          console.error('Error parsing user data:', err);
        }
      }
    };

    checkAuthAndLoad();

    // Listen for storage changes (when user logs in/out)
    const handleStorageChange = (e) => {
      if (e.key === 'currentUser') {
        if (e.newValue) {
          // User logged in
          checkAuthAndLoad();
        } else {
          // User logged out
          setAssignments([]);
          setError(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Helper function to check if user is authenticated
  const isAuthenticated = () => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        return !!parsedUser.token;
      } catch (err) {
        return false;
      }
    }
    return false;
  };

  const loadAssignments = async () => {
    // Don't attempt to load if not authenticated
    if (!isAuthenticated()) {
      console.log('User not authenticated, skipping assignments load');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await assignmentsService.getAssignments();
      
      // If no assignments exist in database, create default ones
      if (!data || data.length === 0) {
        await initializeDefaultAssignments();
      } else {
        // Transform backend data to frontend format
        const transformedAssignments = transformBackendData(data);
        setAssignments(transformedAssignments);
      }
    } catch (err) {
      console.error('Error loading assignments:', err);
      setError('Failed to load assignments');
      // Don't fallback to default assignments if not authenticated
      if (isAuthenticated()) {
        await initializeDefaultAssignments();
      }
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultAssignments = async () => {
    // Don't attempt to initialize if not authenticated
    if (!isAuthenticated()) {
      console.log('User not authenticated, skipping default assignments initialization');
      return;
    }

    try {
      // Generate assignments for 52 weeks
      const sundays = getUpcomingSundays(52);
      
      const defaultAssignments = sundays.map((sunday) => ({
        ...sunday,
        title: "Sunday Service",
        assignments: [...DEFAULT_ROLES],
      }));

      setAssignments(defaultAssignments);

      // Save the default assignments to backend
      for (const assignment of defaultAssignments) {
        try {
          await assignmentsService.saveAssignments(assignment.dateString, assignment.assignments);
        } catch (err) {
          console.warn(`Failed to save default assignment for ${assignment.dateString}:`, err);
        }
      }
    } catch (err) {
      console.error('Error initializing default assignments:', err);
      setError('Failed to initialize assignments');
    }
  };

  const transformBackendData = (backendData) => {
    // Group assignments by date
    const groupedByDate = backendData.reduce((acc, item) => {
      if (!acc[item.dateString]) {
        acc[item.dateString] = {
          dateString: item.dateString,
          title: item.title || "Sunday Service",
          status: item.status || "upcoming",
          assignments: []
        };
      }
      
      // Add assignments from the backend data
      if (item.assignments && Array.isArray(item.assignments)) {
        acc[item.dateString].assignments = item.assignments;
      }
      
      return acc;
    }, {});

    // Convert to array and add derived properties
    return Object.values(groupedByDate).map(service => {
      const date = new Date(service.dateString + 'T00:00:00Z');
      const today = new Date();
      const diffTime = date.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        ...service,
        date,
        title: date.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        daysRemaining,
        status: daysRemaining < 0 ? "past" : "upcoming",
        assignments: service.assignments.length > 0 ? service.assignments : [...DEFAULT_ROLES]
      };
    }).sort((a, b) => new Date(a.dateString) - new Date(b.dateString));
  };

  // Function to update a specific assignment (local state only, no backend save)
  const updateAssignment = async (dateString, roleIndex, newPerson) => {
    try {
      // Update local state immediately for responsiveness
      setAssignments(prevAssignments => {
        return prevAssignments.map(service => {
          if (service.dateString === dateString) {
            const updatedAssignments = [...service.assignments];
            if (updatedAssignments[roleIndex]) {
              updatedAssignments[roleIndex] = {
                ...updatedAssignments[roleIndex],
                person: newPerson
              };
            }
            
            return {
              ...service,
              assignments: updatedAssignments
            };
          }
          return service;
        });
      });

      // Note: No backend save here - only save when "Save Changes" is clicked
    } catch (err) {
      console.error('Error updating assignment:', err);
      setError('Failed to update assignment');
    }
  };

  // Function to add a new role to a specific service (local state only)
  const addRole = async (dateString, roleName) => {
    if (!roleName.trim()) return;
    
    try {
      // Update local state
      setAssignments(prevAssignments => {
        return prevAssignments.map(service => {
          if (service.dateString === dateString) {
            return {
              ...service,
              assignments: [
                ...service.assignments,
                { role: roleName.trim(), person: "" }
              ]
            };
          }
          return service;
        });
      });

      // Note: No backend save here - only save when "Save Changes" is clicked
    } catch (err) {
      console.error('Error adding role:', err);
      setError('Failed to add role');
    }
  };

  // Function to remove a role from a specific service (local state only)
  const removeRole = async (dateString, roleName) => {
    try {
      // Update local state
      setAssignments(prevAssignments => {
        return prevAssignments.map(service => {
          if (service.dateString === dateString) {
            return {
              ...service,
              assignments: service.assignments.filter(assignment => assignment.role !== roleName)
            };
          }
          return service;
        });
      });

      // Note: No backend save here - only save when "Save Changes" is clicked
    } catch (err) {
      console.error('Error removing role:', err);
      setError('Failed to remove role');
    }
  };

  // Function to get assignments for a specific date
  const getAssignmentsForDate = (dateString) => {
    if (!dateString || !assignments || assignments.length === 0) {
      return null;
    }
    
    // Try exact match first
    const exactMatch = assignments.find(s => s.dateString === dateString);
    if (exactMatch) {
      return exactMatch;
    }
    
    // If no exact match, try to find the closest upcoming Sunday
    const targetDate = new Date(dateString);
    const closestSunday = assignments.find(s => {
      const serviceDate = new Date(s.dateString);
      return serviceDate >= targetDate;
    });
    
    return closestSunday || null;
  };

  // Function to add more future dates
  const addMoreFutureDates = async (additionalCount = 4) => {
    try {
      // Get the latest date we currently have
      const latestDate = [...assignments].sort((a, b) => {
        return new Date(b.dateString) - new Date(a.dateString);
      })[0];
      
      if (!latestDate) return;
      
      // Get new Sundays starting from the day after our latest date
      const nextDate = new Date(latestDate.dateString);
      nextDate.setDate(nextDate.getDate() + 7); // Next Sunday
      
      const newSundays = [];
      for (let i = 0; i < additionalCount; i++) {
        const sunday = new Date(nextDate);
        sunday.setDate(nextDate.getDate() + (i * 7));
        
        const dateString = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;
        const today = new Date();
        const diffTime = sunday.getTime() - today.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const newSunday = {
          date: sunday,
          dateString,
          title: sunday.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
          daysRemaining,
          status: daysRemaining < 0 ? "past" : "upcoming",
          assignments: [...DEFAULT_ROLES]
        };
        
        newSundays.push(newSunday);
      }
      
      // Add the new services to our assignments
      setAssignments(prev => [...prev, ...newSundays]);

      // Save to backend
      for (const assignment of newSundays) {
        try {
          await assignmentsService.saveAssignments(assignment.dateString, assignment.assignments);
        } catch (err) {
          console.warn(`Failed to save assignment for ${assignment.dateString}:`, err);
        }
      }
    } catch (err) {
      console.error('Error adding future dates:', err);
      setError('Failed to add future dates');
    }
  };

  // Function to save assignments (backend integration)
  const saveAssignments = async (dateString, assignmentData) => {
    try {
      const result = await assignmentsService.saveAssignments(dateString, assignmentData);
      return { success: true, data: result };
    } catch (err) {
      console.error('Error saving assignments:', err);
      return { success: false, error: err.message };
    }
  };

  // Function to remove a specific date
  const removeDate = async (dateString) => {
    try {
      // Update local state
      setAssignments(prevAssignments => {
        return prevAssignments.filter(service => service.dateString !== dateString);
      });

      // Remove from backend
      await assignmentsService.resetAssignments(dateString);
    } catch (err) {
      console.error('Error removing date:', err);
      setError('Failed to remove date');
      loadAssignments();
    }
  };

  // Function to add a specific date
  const addSpecificDate = async (dateString) => {
    try {
      // Check if the date already exists
      const exists = assignments.some(service => service.dateString === dateString);
      if (exists) return;
      
      // Create a new service for this date
      const date = new Date(dateString + 'T00:00:00Z');
      const today = new Date();
      const diffTime = date.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const newService = {
        date: date,
        dateString: dateString,
        title: date.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        daysRemaining: daysRemaining,
        status: daysRemaining < 0 ? "past" : "upcoming",
        assignments: [...DEFAULT_ROLES]
      };
      
      // Add the new service and sort by date
      setAssignments(prev => {
        const updated = [...prev, newService];
        return updated.sort((a, b) => new Date(a.dateString) - new Date(b.dateString));
      });

      // Save to backend
      await assignmentsService.saveAssignments(dateString, newService.assignments);
    } catch (err) {
      console.error('Error adding specific date:', err);
      setError('Failed to add date');
    }
  };

  // Function to reset assignments to default roles
  const resetAssignments = async () => {
    try {
      const sundays = getUpcomingSundays(52);
      const resetData = sundays.map((sunday) => ({
        ...sunday,
        title: "Sunday Service",
        assignments: [...DEFAULT_ROLES],
      }));
      
      setAssignments(resetData);

      // Reset in backend - this will delete all assignments and recreate with defaults
      for (const assignment of resetData) {
        try {
          await assignmentsService.resetAssignments(assignment.dateString);
          await assignmentsService.saveAssignments(assignment.dateString, assignment.assignments);
        } catch (err) {
          console.warn(`Failed to reset assignment for ${assignment.dateString}:`, err);
        }
      }
    } catch (err) {
      console.error('Error resetting assignments:', err);
      setError('Failed to reset assignments');
    }
  };

  const value = {
    assignments,
    loading,
    error,
    updateAssignment,
    addRole,
    removeRole,
    getAssignmentsForDate,
    addMoreFutureDates,
    saveAssignments,
    removeDate,
    addSpecificDate,
    resetAssignments,
    loadAssignments,
    isAuthenticated,
    defaultRoles: DEFAULT_ROLES
  };

  return (
    <AssignmentsContext.Provider value={value}>
      {children}
    </AssignmentsContext.Provider>
  );
};
