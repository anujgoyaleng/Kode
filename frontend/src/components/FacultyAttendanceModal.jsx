import React, { useEffect, useState } from 'react'
import api from '@/api/client'
import { formatDate, toISODateString } from '@/utils/dateUtils'

export default function FacultyAttendanceModal({ faculty, onClose }) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [attendanceData, setAttendanceData] = useState([])
    const [selectedDate, setSelectedDate] = useState(null)
    const [dateRange, setDateRange] = useState(30) // Default to 30 days

    const loadAttendanceData = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await api.get(`/analytics/faculty-attendance-details/${faculty.id}`, {
                params: { days: dateRange }
            })
            setAttendanceData(res.data.data.attendance || [])
        } catch (e) {
            console.error('Failed to load faculty attendance details:', e)
            setError('Failed to load attendance details')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadAttendanceData() }, [faculty.id, dateRange])

    // Create attendance map for quick lookup
    const attendanceMap = {}
    attendanceData.forEach(record => {
        attendanceMap[record.date] = record
    })

    // Generate dots for the specified date range
    const generateDots = () => {
        const dots = []
        const today = new Date()
        
        for (let i = dateRange - 1; i >= 0; i--) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)
            
            // Validate the date before proceeding
            if (isNaN(date.getTime())) {
                console.warn('Invalid date generated for offset:', i)
                continue
            }
            
            const dateStr = toISODateString(date)
            const record = attendanceMap[dateStr]
            
            let dotColor = 'bg-gray-300 dark:bg-gray-600' // Default: not marked
            let status = 'Not marked'
            let presentCount = 0
            let absentCount = 0
            let totalStudents = 0
            
            if (record) {
                presentCount = record.presentCount || 0
                absentCount = record.absentCount || 0
                totalStudents = record.totalStudents || 0
                
                if (totalStudents > 0) {
                    const attendanceRate = (presentCount / totalStudents) * 100
                    if (attendanceRate >= 80) {
                        dotColor = 'bg-green-500'
                        status = 'High Attendance'
                    } else if (attendanceRate >= 60) {
                        dotColor = 'bg-yellow-500'
                        status = 'Medium Attendance'
                    } else if (attendanceRate >= 40) {
                        dotColor = 'bg-orange-500'
                        status = 'Low Attendance'
                    } else {
                        dotColor = 'bg-red-500'
                        status = 'Very Low Attendance'
                    }
                } else {
                    status = 'No students assigned'
                }
            }
            
            dots.push({
                date: dateStr,
                dateObj: date,
                color: dotColor,
                status,
                presentCount,
                absentCount,
                totalStudents,
                attendanceRate: totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0
            })
        }
        
        return dots
    }

    const dots = generateDots()

    const handleDotClick = (dot) => {
        setSelectedDate(dot)
    }

    // formatDate is now imported from dateUtils

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-black-900/90 rounded-lg shadow-xl dark:shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden dark:backdrop-blur-md">
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-200 dark:border-black-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {faculty.firstName} {faculty.lastName} - Attendance Details
                            </h2>
                            <p className="text-gray-600 dark:text-black-400 mt-1">{faculty.email}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-black-300 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                            <p className="text-gray-600 dark:text-black-400">Loading attendance data...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <div className="text-red-500 text-4xl mb-4">⚠️</div>
                            <p className="text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Controls */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <label className="text-sm font-medium text-gray-700 dark:text-black-300">
                                        Date Range:
                                    </label>
                                    <select
                                        value={dateRange}
                                        onChange={(e) => setDateRange(parseInt(e.target.value))}
                                        className="input w-32"
                                    >
                                        <option value={7}>Last 7 days</option>
                                        <option value={14}>Last 14 days</option>
                                        <option value={30}>Last 30 days</option>
                                        <option value={60}>Last 60 days</option>
                                        <option value={90}>Last 90 days</option>
                                    </select>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-black-400">
                                    {attendanceData.length} days with attendance data
                                </div>
                            </div>

                            {/* Dot Grid */}
                            <div className="space-y-4">
                                <div className="text-sm font-medium text-gray-700 dark:text-black-300">
                                    Attendance Overview ({dateRange} days)
                                </div>
                                <div className="grid grid-cols-7 gap-2">
                                    {dots.map((dot, index) => (
                                        <div
                                            key={index}
                                            onClick={() => handleDotClick(dot)}
                                            className={`h-8 w-8 rounded-lg ${dot.color} cursor-pointer hover:scale-125 transition-all duration-300 border-2 group relative ${
                                                selectedDate?.date === dot.date 
                                                    ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-800' 
                                                    : 'border-transparent hover:border-white dark:hover:border-black-700'
                                            }`}
                                            title={`${formatDate(dot.date)}: ${dot.status} (${dot.attendanceRate}%)`}
                                        >
                                            {/* Enhanced tooltip on hover */}
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-black-800 text-white dark:text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 dark:backdrop-blur-md">
                                                <div className="font-semibold">{formatDate(dot.date)}</div>
                                                <div className="text-gray-300 dark:text-black-400">{dot.status}</div>
                                                <div className="text-gray-300 dark:text-black-400">
                                                    {dot.presentCount} present, {dot.absentCount} absent
                                                </div>
                                                <div className="text-gray-300 dark:text-black-400">
                                                    {dot.attendanceRate}% attendance rate
                                                </div>
                                                {/* Tooltip arrow */}
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-black-800"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="flex items-center gap-6 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-green-500"></div>
                                    <span className="text-gray-600 dark:text-black-400">High (80%+)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-yellow-500"></div>
                                    <span className="text-gray-600 dark:text-black-400">Medium (60-79%)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-orange-500"></div>
                                    <span className="text-gray-600 dark:text-black-400">Low (40-59%)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-red-500"></div>
                                    <span className="text-gray-600 dark:text-black-400">Very Low (&lt;40%)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-gray-300 dark:bg-black-600"></div>
                                    <span className="text-gray-600 dark:text-black-400">Not Marked</span>
                                </div>
                            </div>

                            {/* Selected Date Details */}
                            {selectedDate && (
                                <div className="card p-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                                        {formatDate(selectedDate.date)}
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                {selectedDate.presentCount}
                                            </div>
                                            <div className="text-sm text-green-700 dark:text-green-300">Present</div>
                                        </div>
                                        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                                {selectedDate.absentCount}
                                            </div>
                                            <div className="text-sm text-red-700 dark:text-red-300">Absent</div>
                                        </div>
                                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                {selectedDate.totalStudents}
                                            </div>
                                            <div className="text-sm text-blue-700 dark:text-blue-300">Total Students</div>
                                        </div>
                                        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                                {selectedDate.attendanceRate}%
                                            </div>
                                            <div className="text-sm text-purple-700 dark:text-purple-300">Attendance Rate</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
