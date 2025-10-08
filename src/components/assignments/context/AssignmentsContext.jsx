// src/components/assignments/context/AssignmentsContext.jsx
import { createContext, useState, useContext, useEffect } from "react";
import { getUpcomingSundays } from "../../../lib/date-utils";

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
  const [assignments, setAssignments] = useState(() => {
    // Try to load from localStorage first
    const savedAssignments = localStorage.getItem("serviceAssignments");
    if (savedAssignments) {
      try {
        const parsed = JSON.parse(savedAssignments);
        // Validate the structure
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].assignments) {
          return parsed;
        }
      } catch (error) {
        console.warn("Failed to parse saved assignments, creating new ones", error);
      }
    }
    
    // Generate assignments for a comprehensive list of Sundays (52 weeks = 1 year)
    const sundays = getUpcomingSundays(52);
    
    return sundays.map((sunday) => ({
      ...sunday,
      title: "Sunday Service",
      assignments: [...DEFAULT_ROLES],
    }));
  });

  // Save assignments to localStorage whenever they change
  useEffect(() => {
    if (assignments && assignments.length > 0) {
      localStorage.setItem("serviceAssignments", JSON.stringify(assignments));
    }
  }, [assignments]);

  // Function to update a specific assignment
  const updateAssignment = (dateString, roleIndex, newPerson) => {
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
  };

  // Function to add a new role to all services
  const addRole = (roleName) => {
    if (!roleName.trim()) return;
    
    setAssignments(prevAssignments => {
      return prevAssignments.map(service => ({
        ...service,
        assignments: [
          ...service.assignments,
          { role: roleName.trim(), person: "" }
        ]
      }));
    });
  };

  // Function to remove a role from all services
  const removeRole = (roleIndex) => {
    setAssignments(prevAssignments => {
      return prevAssignments.map(service => {
        const updatedAssignments = [...service.assignments];
        updatedAssignments.splice(roleIndex, 1);
        
        return {
          ...service,
          assignments: updatedAssignments
        };
      });
    });
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
  const addMoreFutureDates = (additionalCount = 4) => {
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
      
      newSundays.push({
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
      });
    }
    
    // Add the new services to our assignments
    setAssignments(prev => [...prev, ...newSundays]);
  };

  // Function to save assignments (for future backend integration)
  const saveAssignments = () => {
    // Currently just saves to localStorage (already handled by useEffect)
    // In the future, this would be an API call
    return new Promise(resolve => {
      setTimeout(() => resolve({ success: true }), 300);
    });
  };

  // Function to remove a specific date
  const removeDate = (dateString) => {
    setAssignments(prevAssignments => {
      return prevAssignments.filter(service => service.dateString !== dateString);
    });
  };

  // Function to add a specific date
  const addSpecificDate = (dateString) => {
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
  };

  // Function to reset assignments to default roles
  const resetAssignments = () => {
    const sundays = getUpcomingSundays(52);
    const resetData = sundays.map((sunday) => ({
      ...sunday,
      title: "Sunday Service",
      assignments: [...DEFAULT_ROLES],
    }));
    setAssignments(resetData);
  };

  const value = {
    assignments,
    updateAssignment,
    addRole,
    removeRole,
    getAssignmentsForDate,
    addMoreFutureDates,
    saveAssignments,
    removeDate,
    addSpecificDate,
    resetAssignments,
    defaultRoles: DEFAULT_ROLES
  };

  return (
    <AssignmentsContext.Provider value={value}>
      {children}
    </AssignmentsContext.Provider>
  );
};
