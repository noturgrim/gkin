// src/components/assignments/context/AssignmentsContext.jsx
import { createContext, useState, useContext, useEffect } from "react";
import { getUpcomingSundays } from "../../../lib/date-utils";

const AssignmentsContext = createContext();

export const useAssignments = () => useContext(AssignmentsContext);

export const AssignmentsProvider = ({ children }) => {
  const [assignments, setAssignments] = useState(() => {
    // Try to load from localStorage first
    const savedAssignments = localStorage.getItem("serviceAssignments");
    if (savedAssignments) {
      return JSON.parse(savedAssignments);
    }
    
    // Default assignments if none found in localStorage
    const sundays = getUpcomingSundays(4);
    
    return sundays.map((sunday, i) => {
      // Default assignments for each Sunday
      const defaultAssignments = [
        { role: "Voorganger", person: "ds. D. Kurniawan" },
        { role: "Ouderling van dienst", person: "Althea Simons-Winailan" },
        { role: "Muzikale begeleiding", person: "Charlie Hendrawan" },
        { role: "Voorzangers", person: "Yolly Wenker-Tampubolon, Teddy Simanjuntak" },
      ];

      // Add different people for different weeks to show variety
      if (i === 1) {
        defaultAssignments[1].person = "Johan van der Meer";
        defaultAssignments[3].person = "Maria Jansen, Peter de Vries";
      } else if (i === 2) {
        defaultAssignments[0].person = "ds. A. Visser";
        defaultAssignments[2].person = "David Smit";
      } else if (i === 3) {
        defaultAssignments[1].person = "Esther de Boer";
        defaultAssignments[3].person = "Thomas Bakker, Anna Mulder";
      }

      return {
        ...sunday,
        title: "Sunday Service",
        assignments: defaultAssignments,
      };
    });
  });

  // Save assignments to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("serviceAssignments", JSON.stringify(assignments));
  }, [assignments]);

  // Function to update a specific assignment
  const updateAssignment = (dateString, roleIndex, newPerson) => {
    setAssignments(prevAssignments => {
      return prevAssignments.map(service => {
        if (service.dateString === dateString) {
          const updatedAssignments = [...service.assignments];
          updatedAssignments[roleIndex] = {
            ...updatedAssignments[roleIndex],
            person: newPerson
          };
          
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
    setAssignments(prevAssignments => {
      return prevAssignments.map(service => {
        return {
          ...service,
          assignments: [
            ...service.assignments,
            { role: roleName, person: "" }
          ]
        };
      });
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
    // Try direct match first
    let service = assignments.find(s => s.dateString === dateString);

    // If no direct match, find the closest date
    if (!service && assignments.length > 0) {
      const selectedDateTime = new Date(dateString).getTime();
      
      service = assignments.reduce((closest, current) => {
        const currentTime = new Date(current.dateString).getTime();
        const closestTime = closest ? new Date(closest.dateString).getTime() : Infinity;
        
        const currentDiff = Math.abs(currentTime - selectedDateTime);
        const closestDiff = Math.abs(closestTime - selectedDateTime);
        
        return currentDiff < closestDiff ? current : closest;
      }, null);
    }
    
    return service;
  };

  // Function to add more future dates - simplified version using getUpcomingSundays
  const addMoreFutureDates = (additionalCount = 4) => {
    // Get the latest date we currently have
    const latestDate = [...assignments].sort((a, b) => {
      return new Date(b.dateString) - new Date(a.dateString);
    })[0];
    
    // Calculate the offset for getUpcomingSundays
    // We want to start from the Sunday after the latest date we have
    const latestDateObj = new Date(latestDate.dateString);
    const today = new Date();
    const diffWeeks = Math.ceil((latestDateObj.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
    
    // Get new Sundays starting from where our current data ends
    const startOffset = diffWeeks;
    const newSundays = getUpcomingSundays(additionalCount + startOffset).slice(startOffset);
    
    // Create new service objects with the same role structure as existing ones
    const roleTemplate = assignments[0].assignments.map(assignment => ({
      role: assignment.role,
      person: ""
    }));
    
    const newServices = newSundays.map(sunday => ({
      ...sunday,
      title: "Sunday Service",
      assignments: [...roleTemplate]
    }));
    
    // Add the new services to our assignments
    setAssignments(prev => [...prev, ...newServices]);
  };

  const value = {
    assignments,
    updateAssignment,
    addRole,
    removeRole,
    getAssignmentsForDate,
    addMoreFutureDates
  };

  return (
    <AssignmentsContext.Provider value={value}>
      {children}
    </AssignmentsContext.Provider>
  );
};
