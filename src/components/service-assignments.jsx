import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Calendar, Edit, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { getStatusColor } from "../lib/date-utils";
import { useAssignments } from "./assignments/context/AssignmentsContext";

export function ServiceAssignments({ selectedDate }) {
  const { getAssignmentsForDate, assignments } = useAssignments();
  
  // Don't try to get assignments if no date is provided or assignments aren't loaded yet
  const currentService = selectedDate && assignments && assignments.length > 0 
    ? getAssignmentsForDate(selectedDate) 
    : null;

  // If no assignments loaded yet, show loading
  if (!assignments || assignments.length === 0) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="bg-gray-50 border-b border-gray-200 p-3">
          <CardTitle className="text-base font-bold flex items-center gap-1">
            <Calendar className="w-4 h-4 text-blue-600" />
            Service Assignments
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 flex items-center justify-center">
          <div className="text-sm text-gray-500">
            Loading assignments...
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no current service, show no service message
  if (!currentService) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="bg-gray-50 border-b border-gray-200 p-3">
          <CardTitle className="text-base font-bold flex items-center gap-1">
            <Calendar className="w-4 h-4 text-blue-600" />
            Service Assignments
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 flex items-center justify-center">
          <div className="text-sm text-gray-500 text-center">
            <div>No service found for selected date</div>
            <div className="mt-1 text-xs">({selectedDate})</div>
            <Link to="/assignments" className="mt-2 inline-block">
              <Button size="sm" variant="outline">
                Manage Assignments
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format the date directly from the title or dateString
  const formattedDateString = currentService.title;
  const statusColor = getStatusColor(currentService.daysRemaining);

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="bg-gray-50 border-b border-gray-200 p-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <CardTitle className="text-base font-bold flex items-center gap-1">
            <Calendar className="w-4 h-4 text-blue-600" />
            Service Assignments
          </CardTitle>

          <div className="flex items-center gap-1">
            <div className="text-xs font-medium text-gray-700">
              {formattedDateString}
            </div>
            <Badge className={`${statusColor} px-1.5 py-0.5 text-xs ml-1`}>
              {currentService.daysRemaining === 0
                ? "Today"
                : currentService.daysRemaining === 1
                ? "Tomorrow"
                : `${currentService.daysRemaining} days`}
            </Badge>
            <Link to="/assignments">
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 ml-1" title="Edit Assignments">
                <Edit className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3">
        {/* Assignments table - more compact layout */}
        <div className="space-y-2">
          {currentService.assignments.map((assignment, index) => (
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
        
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
          <Link to="/assignments">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" />
              Manage All Assignments
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
