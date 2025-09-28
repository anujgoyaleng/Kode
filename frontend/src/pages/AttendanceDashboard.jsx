import React, { useEffect, useState, useMemo } from "react";
import api from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate, toISODateString } from "@/utils/dateUtils";

// Reusable AttendanceDotGrid component
function AttendanceDotGrid({
  selectedFaculty,
  facultyAttendanceData,
  attendanceData,
  dateRange,
  onDateRangeChange,
}) {
  const [hoveredDate, setHoveredDate] = useState(null);
  const [clickedDate, setClickedDate] = useState(null);

  // Date range options
  const dateRangeOptions = [
    { value: 7, label: "Last 7 days" },
    { value: 14, label: "Last 14 days" },
    { value: 30, label: "Last 30 days" },
    { value: 60, label: "Last 60 days" },
    { value: 90, label: "Last 90 days" },
  ];

  // Generate calendar data for the last dateRange days
  const generateCalendarData = () => {
    const today = new Date();
    const calendarData = [];

    // Start from dateRange days ago
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - dateRange + 1);

    // Generate dates and organize by weeks
    let currentWeek = [];
    let currentDate = new Date(startDate);

    // Add empty cells for days before the start date to align with week
    const startDayOfWeek = startDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null);
    }

    for (let i = 0; i < dateRange; i++) {
      const date = new Date(currentDate);
      currentWeek.push(date.toISOString().split("T")[0]);

      // If we've filled a week (7 days) or reached the end
      if (currentWeek.length === 7 || i === dateRange - 1) {
        calendarData.push([...currentWeek]);
        currentWeek = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return calendarData;
  };

  const calendarData = generateCalendarData();

  // Get attendance status for a specific date
  const getAttendanceStatus = (date) => {
    if (!date) {
      return null; // No date provided
    }

    // Look for student attendance record for this date
    const attendanceRecord = attendanceData.find(record => record.date === date);
    
    if (!attendanceRecord) {
      // For testing: return some test statuses
      const day = new Date(date).getDate();
      if (day % 3 === 0) return 'present';
      if (day % 3 === 1) return 'absent';
      return null; // No attendance record found
    }

    return attendanceRecord.status || null;
  };

  // Handle dot click
  const handleDotClick = (date) => {
    if (!date) return;
    setClickedDate(clickedDate === date ? null : date);
  };

  // Format date for display
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get day of month from date string
  const getDayOfMonth = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).getDate();
  };

  // Week day headers
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Calculate attendance statistics for selected faculty
  const getAttendanceStats = () => {
    if (!selectedFaculty || !facultyAttendanceData[selectedFaculty]) {
      return { total: 0, present: 0, absent: 0, percentage: 0 };
    }

    const facultyData = facultyAttendanceData[selectedFaculty];
    const attendance = facultyData.attendance || {};

    let present = 0;
    let absent = 0;

    Object.values(attendance).forEach((record) => {
      if (record.status === "present") present++;
      else if (record.status === "absent") absent++;
    });

    const total = present + absent;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, percentage };
  };

  const stats = getAttendanceStats();

  // Generate dates organized by months for calendar layout
  const generateFlowingDates = () => {
    const months = [];
    const today = new Date();
    let currentMonth = null;
    let currentMonthData = null;

    for (let i = dateRange - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const month = date.getMonth();
      const year = date.getFullYear();

      // If month changed, start a new month
      if (currentMonth !== month) {
        if (currentMonthData) {
          months.push(currentMonthData);
        }
        currentMonthData = {
          type: "month",
          month: month,
          year: year,
          dates: [],
        };
        currentMonth = month;
      }

      currentMonthData.dates.push(dateStr);
    }

    // Add the last month
    if (currentMonthData) {
      months.push(currentMonthData);
    }

    // Process each month to create proper calendar grid
    return months.map((monthData) => {
      const calendarDays = [];

      // Create a proper calendar for this month
      const year = monthData.year;
      const month = monthData.month;

      // Get the first day of the month
      const firstDayOfMonth = new Date(year, month, 1);
      const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Get the last day of the month
      const lastDayOfMonth = new Date(year, month + 1, 0);
      const daysInMonth = lastDayOfMonth.getDate();

      // Add empty cells for days before the first day of the month
      for (let i = 0; i < firstDayOfWeek; i++) {
        calendarDays.push({ type: "empty" });
      }

      // Add all days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = new Date(year, month, day).toISOString().split("T")[0];
        calendarDays.push({ type: "date", date: dateStr });
      }

      // Add empty cells to fill the remaining week (optional, for complete grid)
      const totalCells = calendarDays.length;
      const remainingCells = 7 - (totalCells % 7);
      if (remainingCells < 7) {
        for (let i = 0; i < remainingCells; i++) {
          calendarDays.push({ type: "empty" });
        }
      }

      return {
        ...monthData,
        calendarDays: calendarDays,
      };
    });
  };

  const flowingDates = generateFlowingDates();

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Show attendance for:
          </label>
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => onDateRangeChange(parseInt(e.target.value))}
              className="px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 appearance-none cursor-pointer w-full"
            >
              {dateRangeOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-400 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-600 dark:bg-blue-500 rounded-sm"></div>
            <span className="text-gray-600 dark:text-gray-400">Present</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-sm"></div>
            <span className="text-gray-600 dark:text-gray-400">No Record</span>
          </div>
        </div>
      </div>


       {/* Calendar Month Layout */}
       <div className="w-full max-w-7xl mx-auto">
         <div className="bg-gray-50 dark:bg-black-900 rounded-xl p-6">
      

          {/* Month Calendars */}
          <div className="flex flex-wrap justify-center  gap-6 sm:gap-8 md:gap-10 lg:gap-12">
            {flowingDates.map((monthData, monthIndex) => {
              const monthNames = [
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ];

              return (
                 <div
                   key={`month-${monthData.month}-${monthData.year}`}
                   className="flex-shrink-0 min-w-[280px] sm:min-w-[320px] bg-gray-50 dark:bg-black-900 rounded-lg p-4"
                 >
                  {/* Month Header */}
                  <div className="text-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {monthNames[monthData.month]} {monthData.year}
                    </h4>
                  </div>

                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (day, index) => (
                        <div key={day} className="text-center">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {day}
                          </span>
                        </div>
                      )
                    )}
                  </div>

                  {/* Month Grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {monthData.calendarDays.map((dayItem, dayIndex) => {
                      const date =
                        dayItem.type === "date" ? dayItem.date : null;
                      const status = date ? getAttendanceStatus(date) : null;
                      const isHovered = hoveredDate === date;
                      const isClicked = clickedDate === date;
                      const isToday =
                        date === new Date().toISOString().split("T")[0];
                      const hasData = selectedFaculty;
                      
                      // Debug logging for faculty data
                      if (date && selectedFaculty) {
                        console.log('Faculty data being considered for dot matrix:', {
                          selectedFaculty,
                          facultyData: facultyAttendanceData[selectedFaculty],
                          date,
                          status
                        });
                      }

                      return (
                        <div
                          key={
                            dayItem.type === "empty"
                              ? `empty-${dayIndex}`
                              : date
                          }
                          className="relative aspect-square flex items-center justify-center"
                          onMouseEnter={() => date && setHoveredDate(date)}
                          onMouseLeave={() => date && setHoveredDate(null)}
                        >
                          {dayItem.type === "date" ? (
                            <>
                              <div
                                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full cursor-pointer transition-all duration-200 flex items-center justify-center ${
                                  hasData
                                    ? status === "present"
                                      ? "bg-green-500 hover:bg-green-600 dark:bg-green-400 dark:hover:bg-green-300 shadow-sm"
                                      : status === "absent"
                                      ? "bg-red-500 hover:bg-red-600 dark:bg-red-400 dark:hover:bg-red-300 shadow-sm"
                                      : "bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"
                                     : "bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"
                                } ${isHovered ? "scale-110 shadow-lg" : ""} ${
                                  isToday
                                    ? "ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-2 ring-offset-gray-50 dark:ring-offset-black-900"
                                    : ""
                                }`}
                                onClick={() => selectedFaculty && handleDotClick(date)}
                                title={`${formatDisplayDate(date)}${
                                  status ? ` - ${status}` : ""
                                }`}
                              />

                              {/* Enhanced Tooltip */}
                              {(isHovered || isClicked) && (
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-3 bg-gray-900 dark:bg-gray-800 text-white dark:text-white text-sm rounded-lg shadow-xl whitespace-nowrap z-30 border border-gray-700 dark:border-gray-600">
                                  <div className="font-medium text-white">
                                    {formatDisplayDate(date)}
                                  </div>
                                  {status && (
                                    <div
                                      className={`text-xs mt-1 font-medium ${
                                        status === "present"
                                          ? "text-green-300"
                                          : status === "absent"
                                          ? "text-red-300"
                                          : "text-gray-300"
                                      }`}
                                    >
                                      {status === "present"
                                        ? "✓ Present"
                                        : status === "absent"
                                        ? "✗ Absent"
                                        : "○ No Record"}
                                    </div>
                                  )}
                                  {isToday && (
                                    <div className="text-xs mt-1 text-blue-300 font-medium">
                                      📅 Today
                                    </div>
                                  )}
                                  {selectedFaculty && (
                                    <div className="text-xs mt-1 text-gray-400">
                                      {
                                        facultyAttendanceData[selectedFaculty]
                                          ?.faculty_name
                                      }
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="w-6 h-6 sm:w-7 sm:h-7"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 dark:bg-green-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Present
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 dark:bg-red-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Absent
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    No Record
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                {flowingDates.reduce(
                  (total, month) =>
                    total +
                    month.calendarDays.filter((day) => day.type === "date")
                      .length,
                  0
                )}{" "}
                days shown
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Faculty Info */}
      {selectedFaculty && facultyAttendanceData[selectedFaculty] && (
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Showing attendance for:{" "}
          <span className="font-medium text-primary-600 dark:text-primary-300">
            {facultyAttendanceData[selectedFaculty].faculty_name}
          </span>
        </div>
      )}

      {/* Instructions */}
      {!selectedFaculty && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Select a faculty above to view their attendance records
        </div>
      )}
    </div>
  );
}

export default function AttendanceDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [facultyAttendanceData, setFacultyAttendanceData] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedFaculty, setSelectedFaculty] = useState(null); // Track selected faculty for filtering
  const [dateRange, setDateRange] = useState(30); // Default to 30 days
  const [statistics, setStatistics] = useState(null);

  const loadAttendanceData = async () => {
    setLoading(true);
    setError(null);
    try {
      // First, call debug endpoint to check raw data
      try {
        const debugRes = await api.get("/students/attendance/debug");
        console.log("DEBUG - Raw attendance data:", debugRes.data);
      } catch (debugError) {
        console.error("DEBUG endpoint failed:", debugError);
      }

      const res = await api.get("/students/attendance", {
        params: { limit: dateRange },
      });
      console.log("AttendanceDashboard - Raw API response:", res.data);
      console.log("Raw student attendance data:", res.data.data.attendance);
      console.log(
        "Raw faculty attendance data:",
        res.data.data.facultyAttendance
      );
      console.log("Raw statistics:", res.data.data.statistics);
      setAttendanceData(res.data.data.attendance || []);
      setFacultyAttendanceData(res.data.data.facultyAttendance || {});
      setStatistics(res.data.data.statistics || null);
    } catch (e) {
      console.error("Failed to load student attendance data:", e);
      console.error("Error details:", {
        message: e.message,
        status: e.response?.status,
        data: e.response?.data,
      });

      if (e.response?.status === 404) {
        setError(
          "Student record not found. Please contact your administrator."
        );
      } else if (e.response?.status === 401) {
        setError("Authentication failed. Please log in again.");
      } else if (e.response?.status === 403) {
        setError(
          "Access denied. You may not have permission to view attendance data."
        );
      } else {
        setError(`Failed to load attendance data: ${e.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceData();
  }, [dateRange]);

  // Create attendance map for quick lookup
  const attendanceMap = {};
  attendanceData.forEach((record) => {
    console.log("Processing attendance record:", record);
    attendanceMap[record.date] = record;
  });

  console.log("Final attendance map:", attendanceMap);

  // Debug: Check if we have any faculty assignments or attendance data
  console.log("=== DATA AVAILABILITY CHECK ===");
  console.log("Attendance data length:", attendanceData.length);
  console.log(
    "Faculty attendance data keys:",
    Object.keys(facultyAttendanceData)
  );
  console.log("Faculty attendance data:", facultyAttendanceData);

  // Check if we have any actual attendance records
  if (Object.keys(facultyAttendanceData).length > 0) {
    Object.entries(facultyAttendanceData).forEach(
      ([facultyId, facultyData]) => {
        console.log(`Faculty ${facultyId} (${facultyData.faculty_name}):`, {
          attendanceKeys: Object.keys(facultyData.attendance || {}),
          sampleRecords: Object.entries(facultyData.attendance || {}).slice(
            0,
            3
          ),
          totalRecords: Object.keys(facultyData.attendance || {}).length,
        });
      }
    );
  } else {
    console.log("❌ No faculty attendance data available");
  }

  // Debug: Show what facultyStats is using (this is working) - moved after facultyStats is defined

  // If no attendance data, create some test data to verify the logic works
  if (Object.keys(facultyAttendanceData).length === 0) {
    console.log(
      "🧪 No faculty data - creating test data to verify dot logic..."
    );

    // Create test faculty data
    const testFacultyId = "test-faculty-1";
    const testFacultyData = {
      faculty_name: "Test Faculty",
      attendance: {},
    };

    // Add test attendance for the last 7 days
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      // Create some test attendance records
      if (i % 3 === 0) {
        testFacultyData.attendance[dateStr] = {
          status: "present",
          created_at: new Date().toISOString(),
        };
      } else if (i % 3 === 1) {
        testFacultyData.attendance[dateStr] = {
          status: "absent",
          created_at: new Date().toISOString(),
        };
      }
      // i % 3 === 2 means no record (gray dot)
    }

    // Update the facultyAttendanceData
    facultyAttendanceData[testFacultyId] = testFacultyData;

    console.log("🧪 Test faculty data created:", testFacultyData);
    console.log(
      "🧪 Test attendance dates:",
      Object.keys(testFacultyData.attendance)
    );

    // Auto-select the test faculty to show colored dots
    setTimeout(() => {
      setSelectedFaculty(testFacultyId);
      console.log("🧪 Auto-selected test faculty:", testFacultyId);
    }, 100);
  }

  // Generate dots for the specified date range

  // Calculate overall statistics from faculty attendance records
  const calculateOverallStatistics = () => {
    let totalFacultyRecords = 0;
    let facultyPresentRecords = 0;
    let facultyAbsentRecords = 0;

    // Process faculty attendance records to get overall statistics
    if (facultyAttendanceData && typeof facultyAttendanceData === "object") {
      Object.values(facultyAttendanceData).forEach((facultyData) => {
        if (
          facultyData &&
          facultyData.attendance &&
          typeof facultyData.attendance === "object"
        ) {
          // facultyData.attendance is an object with dates as keys
          Object.values(facultyData.attendance).forEach((record) => {
            totalFacultyRecords++;
            if (record.status === "present") {
              facultyPresentRecords++;
            } else if (record.status === "absent") {
              facultyAbsentRecords++;
            }
          });
        }
      });
    }

    const overallAttendancePercentage =
      totalFacultyRecords > 0
        ? Math.round((facultyPresentRecords / totalFacultyRecords) * 100)
        : 0;

    return {
      totalDays: totalFacultyRecords,
      presentDays: facultyPresentRecords,
      absentDays: facultyAbsentRecords,
      attendancePercentage: overallAttendancePercentage,
    };
  };

  // Use API statistics as primary source, fallback to calculated if not available
  const overallStats = statistics || calculateOverallStatistics();

  // Calculate faculty-wise statistics
  const calculateFacultyStatistics = () => {
    const facultyStats = {};

    if (facultyAttendanceData && typeof facultyAttendanceData === "object") {
      Object.entries(facultyAttendanceData).forEach(
        ([facultyId, facultyData]) => {
          if (
            facultyData &&
            facultyData.attendance &&
            typeof facultyData.attendance === "object"
          ) {
            let totalRecords = 0;
            let presentRecords = 0;
            let absentRecords = 0;

            // facultyData.attendance is an object with dates as keys
            Object.values(facultyData.attendance).forEach((record) => {
              totalRecords++;
              if (record.status === "present") {
                presentRecords++;
              } else if (record.status === "absent") {
                absentRecords++;
              }
            });

            const attendancePercentage =
              totalRecords > 0
                ? Math.round((presentRecords / totalRecords) * 100)
                : 0;

            facultyStats[facultyId] = {
              facultyName: facultyData.faculty_name,
              totalDays: totalRecords,
              presentDays: presentRecords,
              absentDays: absentRecords,
              attendancePercentage,
            };
          }
        }
      );
    }

    return facultyStats;
  };

  const facultyStats = calculateFacultyStatistics();

  // Since we're only showing overall student attendance, we don't need faculty-specific dots
  // The main dots already show all student attendance records

  const handleFacultyClick = (facultyId) => {
    console.log("Faculty clicked:", facultyId);
    console.log("Current selectedFaculty:", selectedFaculty);
    const newSelectedFaculty = selectedFaculty === facultyId ? null : facultyId;
    console.log("Setting selectedFaculty to:", newSelectedFaculty);
    setSelectedFaculty(newSelectedFaculty);
    setSelectedDate(null); // Clear selected date when switching faculty
  };

  const handleFacultyHover = (facultyId) => {
    // Optional: Add hover effects or preview
    console.log("Hovering over faculty:", facultyId);
  };

  // formatDate is now imported from dateUtils

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-pureblack flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading your attendance records...
          </p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-pureblack flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="text-red-600 dark:text-red-400 text-lg">{error}</p>
          <button onClick={loadAttendanceData} className="mt-4 btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-pureblack w-full px-4 md:px-8">
      <div className="py-6 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Attendance
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track your attendance records marked by faculty
            </p>
          </div>
        </div>

        {/* Attendance Statistics */}
        {overallStats && overallStats.totalDays > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="card p-6 text-center">
              <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                {overallStats.attendancePercentage}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Overall Attendance
              </div>
            </div>
            <div className="card p-6 text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {overallStats.presentDays}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Present Days
              </div>
            </div>
            <div className="card p-6 text-center">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {overallStats.absentDays}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Absent Days
              </div>
            </div>
            <div className="card p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {overallStats.totalDays}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Records
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-6 text-center">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">
              📊
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Attendance Data
            </h3>
            <div className="text-gray-600 dark:text-gray-400 space-y-2">
              <p>Your attendance statistics will appear here once:</p>
              <ul className="text-sm text-left max-w-md mx-auto space-y-1">
                <li>• Faculty are assigned to you</li>
                <li>• Faculty mark your attendance</li>
              </ul>
              <p className="text-sm mt-4">
                Contact your administrator if you believe this is an error.
              </p>
            </div>
          </div>
        )}

        {/* Faculty-wise Attendance Breakdown */}
        {Object.keys(facultyStats).length > 0 ? (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Faculty-wise Attendance Breakdown
              </h3>
              {selectedFaculty && (
                <button
                  onClick={() => setSelectedFaculty(null)}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                >
                  Show All Faculties
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(facultyStats).map(([facultyId, stats]) => (
                <div
                  key={facultyId}
                  className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedFaculty === facultyId
                      ? "ring-2 ring-primary-500 dark:ring-primary-400 bg-primary-50 dark:bg-primary-900/20"
                      : "hover:bg-gray-100 dark:hover:bg-gray-600"
                  }`}
                  onClick={() => handleFacultyClick(facultyId)}
                  onMouseEnter={() => handleFacultyHover(facultyId)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4
                      className={`font-medium ${
                        selectedFaculty === facultyId
                          ? "text-primary-700 dark:text-primary-300"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {stats.facultyName}
                      {selectedFaculty === facultyId && (
                        <span className="ml-2 text-xs text-primary-600 dark:text-primary-400">
                          (Selected)
                        </span>
                      )}
                    </h4>
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {stats.attendancePercentage}%
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Present:
                      </span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {stats.presentDays}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Absent:
                      </span>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        {stats.absentDays}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Total:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {stats.totalDays}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    Click to filter attendance by this faculty
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card p-6 text-center">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">
              👥
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Faculty Assignments
            </h3>
            <div className="text-gray-600 dark:text-gray-400 space-y-2">
              <p>You don't have any faculty assigned to you yet.</p>
              <p className="text-sm">
                This means no faculty can mark your attendance.
              </p>
              <p className="text-sm mt-4 font-medium">
                Please contact your administrator to:
              </p>
              <ul className="text-sm text-left max-w-md mx-auto space-y-1">
                <li>• Assign faculty members to you</li>
                <li>• Set up faculty-student relationships</li>
              </ul>
            </div>
          </div>
        )}

        {/* Attendance Dot Grid */}
        {Object.keys(facultyStats).length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Attendance Timeline
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Last {dateRange} days
              </div>
            </div>
            <AttendanceDotGrid
              selectedFaculty={selectedFaculty}
              facultyAttendanceData={facultyAttendanceData}
              attendanceData={attendanceData}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
