import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { ChevronLeft, ChevronRight, Calendar, ChevronDown } from "lucide-react";
import { getUpcomingSundays } from "../lib/date-utils";

export function WeekSelector({ selectedWeek, onWeekChange, customWeeks }) {
  const [allSundays, setAllSundays] = useState([]);
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  console.log('WeekSelector initialized with month:', currentMonth, 'year:', currentYear);

  // Generate comprehensive Sunday list using existing date-utils and extending it
  const generateComprehensiveSundays = () => {
    const allSundays = [];
    const today = new Date();
    
    // Generate Sundays for the entire year - past and future
    const startOfYear = new Date(today.getFullYear(), 0, 1); // Jan 1st of current year
    const endOfNextYear = new Date(today.getFullYear() + 1, 11, 31); // Dec 31st of next year
    
    // Find first Sunday of the current year
    let currentDate = new Date(startOfYear);
    while (currentDate.getDay() !== 0) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Generate all Sundays from first Sunday of year to end of next year
    while (currentDate <= endOfNextYear) {
      const dateString = currentDate.toISOString().split('T')[0];
      const timeDiff = currentDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      let status;
      if (daysDiff < 0) status = "past";
      else if (daysDiff === 0) status = "today";
      else if (daysDiff <= 7) status = "active";
      else status = "upcoming";
      
      allSundays.push({
        date: new Date(currentDate),
        dateString,
        title: currentDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        status,
        daysUntil: daysDiff
      });
      
      // Move to next Sunday
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    return allSundays;
  };

  // Initialize all Sundays
  useEffect(() => {
    console.log('useEffect called with customWeeks:', customWeeks);
    
    if (customWeeks && customWeeks.length > 0) {
      console.log('Using custom weeks:', customWeeks.length);
      setAllSundays(customWeeks);
    } else {
      console.log('Generating comprehensive Sundays...');
      const comprehensiveSundays = generateComprehensiveSundays();
      
      console.log('Total Generated Sundays:', comprehensiveSundays.length);
      console.log('First 5 Sundays:', comprehensiveSundays.slice(0, 5).map(s => s.dateString));
      console.log('Last 5 Sundays:', comprehensiveSundays.slice(-5).map(s => s.dateString));
      
      // Debug: Show what months we actually generated
      const monthCounts = {};
      comprehensiveSundays.forEach(sunday => {
        const date = new Date(sunday.dateString + 'T00:00:00');
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
      });
      console.log('Sundays by month:', monthCounts);
      
      setAllSundays(comprehensiveSundays);
    }
  }, [customWeeks]);

  // Auto-select today's or next Sunday if no selection
  useEffect(() => {
    if (allSundays.length > 0 && !selectedWeek) {
      const todayOrNext = allSundays.find(
        (sunday) => sunday.status === "today" || sunday.status === "active"
      ) || allSundays.find(sunday => sunday.status === "upcoming");
      
      if (todayOrNext) {
        onWeekChange(todayOrNext.dateString);
      }
    }
  }, [allSundays, selectedWeek, onWeekChange]);

  // Get Sundays for current displayed month
  const getCurrentMonthSundays = () => {
    const filtered = allSundays.filter(sunday => {
      const date = new Date(sunday.dateString + 'T00:00:00'); // Add time to avoid timezone issues
      const sundayMonth = date.getMonth();
      const sundayYear = date.getFullYear();
      
      return sundayMonth === currentMonth && sundayYear === currentYear;
    });
    
    console.log(`Current month: ${currentMonth}, year: ${currentYear}`);
    console.log('All Sundays:', allSundays.length);
    console.log('Sample all Sundays:', allSundays.slice(0, 3).map(s => ({
      dateString: s.dateString,
      month: new Date(s.dateString + 'T00:00:00').getMonth(),
      year: new Date(s.dateString + 'T00:00:00').getFullYear()
    })));
    console.log('ALL Sunday dates:', allSundays.map(s => s.dateString));
    console.log('Filtered Sundays for current month:', filtered.length);
    console.log('Sample filtered:', filtered.slice(0, 3));
    
    return filtered;
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Format functions
  const formatShortDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getDaysUntilText = (daysUntil) => {
    if (daysUntil === 0) return "Today";
    if (daysUntil === 1) return "Tomorrow";
    if (daysUntil < 0) return `${Math.abs(daysUntil)} days ago`;
    return `in ${daysUntil} days`;
  };

  const getMonthYearText = () => {
    const date = new Date(currentYear, currentMonth);
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const currentMonthSundays = getCurrentMonthSundays();

  if (allSundays.length === 0) {
    return (
      <Card className="relative z-20 rounded-xl">
        <CardContent className="p-3 md:p-4 flex items-center justify-center">
          <div className="text-sm text-gray-600">Loading Sundays...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative z-20 rounded-xl">
      <CardContent className="p-3 md:p-4">
        {/* Desktop View */}
        <div className="hidden md:block">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              className="border-gray-400 text-gray-700 hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous Month
            </Button>
            
            <h3 className="text-lg font-semibold text-gray-900">
              {getMonthYearText()}
            </h3>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              className="border-gray-400 text-gray-700 hover:bg-gray-100"
            >
              Next Month
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Sundays Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {currentMonthSundays.map((sunday) => {
              const isSelected = selectedWeek === sunday.dateString;
              const isToday = sunday.status === "today";
              const isPast = sunday.status === "past";
              
              return (
                <Button
                  key={sunday.dateString}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => onWeekChange(sunday.dateString)}
                  className={`flex flex-col items-center gap-1 h-auto py-3 transition-all ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-700 shadow-md"
                      : isPast
                      ? "border-gray-300 text-gray-500 hover:bg-gray-50"
                      : "border-blue-300 text-blue-700 hover:bg-blue-50"
                  }`}
                >
                  <Calendar className={`w-4 h-4 ${isSelected ? "text-white" : "text-gray-600"}`} />
                  <div className="text-center">
                    <div className="text-sm font-medium flex items-center gap-1">
                      {formatShortDate(sunday.dateString)}
                      {isToday && (
                        <span className="bg-green-500 w-2 h-2 rounded-full"></span>
                      )}
                    </div>
                    <div className="text-xs opacity-80">
                      {getDaysUntilText(sunday.daysUntil)}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>

          {currentMonthSundays.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No Sundays in this month
            </div>
          )}
        </div>

        {/* Mobile View */}
        <div className="md:hidden">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              className="border-gray-400 text-gray-700 hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="relative flex-1 mx-2">
              <Button
                ref={buttonRef}
                variant="outline"
                className="flex items-center justify-center gap-2 w-full bg-white border-gray-400 text-gray-800 hover:bg-gray-50"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="font-medium">
                  {selectedWeek ? formatShortDate(selectedWeek) : getMonthYearText()}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </Button>

              {showDropdown && (
                <div
                  ref={dropdownRef}
                  className="absolute left-0 right-0 mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto"
                >
                  <div className="p-2 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={goToPreviousMonth}
                        className="h-8"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="font-medium text-sm">{getMonthYearText()}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={goToNextMonth}
                        className="h-8"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {currentMonthSundays.map((sunday) => {
                    const isSelected = selectedWeek === sunday.dateString;
                    const isToday = sunday.status === "today";
                    
                    return (
                      <div
                        key={sunday.dateString}
                        className={`p-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between ${
                          isSelected ? "bg-blue-50" : ""
                        }`}
                        onClick={() => {
                          onWeekChange(sunday.dateString);
                          setShowDropdown(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <div>
                            <div className="text-sm font-medium flex items-center gap-1">
                              {formatShortDate(sunday.dateString)}
                              {isToday && (
                                <span className="bg-green-500 text-white text-xs px-1 rounded-full">
                                  Today
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-600">Sunday</div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {getDaysUntilText(sunday.daysUntil)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              className="border-gray-400 text-gray-700 hover:bg-gray-100"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
