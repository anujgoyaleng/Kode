import React, { useEffect, useState } from 'react'
import api from '@/api/client'
import { formatDate, isValidDate } from '@/utils/dateUtils'

export default function AttendanceHistory({ limit = 10, refreshTrigger = 0 }) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [attendance, setAttendance] = useState([])
    const [statistics, setStatistics] = useState(null)

    const loadAttendance = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await api.get('/students/attendance', { 
                params: { limit } 
            })
            console.log('AttendanceHistory - Raw API response:', res.data)
            setAttendance(res.data.data.attendance || [])
            setStatistics(res.data.data.statistics || null)
        } catch (e) {
            console.error('AttendanceHistory - Error loading attendance:', e)
            setError('Failed to load attendance')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadAttendance() }, [limit, refreshTrigger])

    if (loading) return (
        <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-black-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-black-700 rounded w-1/2"></div>
        </div>
    )

    if (error) return (
        <div className="text-red-600 dark:text-red-400 text-sm">
            {error}
        </div>
    )

    return (
        <div className="space-y-4">
            {/* Statistics */}
            {statistics && (
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {statistics.attendancePercentage}%
                        </div>
                        <div className="text-sm text-green-700 dark:text-green-300">Attendance</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {statistics.presentDays}
                        </div>
                        <div className="text-sm text-blue-700 dark:text-blue-300">Present Records</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {statistics.absentDays}
                        </div>
                        <div className="text-sm text-red-700 dark:text-red-300">Absent Records</div>
                    </div>
                </div>
            )}

            {/* Recent Attendance */}
            <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Recent Attendance ({statistics?.totalDays || 0} records)
                </h3>
                <div className="space-y-2">
                    {attendance.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-black-400">
                            No attendance records found
                        </div>
                    ) : (
                        attendance.map((record, index) => {
                            // Validate the record data
                            const dateStr = record.date || record.attendance_date
                            const isValidDateStr = isValidDate(dateStr)
                            
                            if (!isValidDateStr) {
                                console.warn('Invalid date in attendance record:', record)
                            }
                            
                            // If record has faculties array, show each faculty separately
                            if (record.faculties && record.faculties.length > 0) {
                                return (
                                    <div key={index} className="space-y-2">
                                        {/* Date header */}
                                        <div className="text-sm font-medium text-gray-700 dark:text-black-300 px-2">
                                            {formatDate(record.date || record.attendance_date)}
                                        </div>
                                        {/* Individual faculty records */}
                                        {record.faculties.map((faculty, facultyIndex) => (
                                            <div 
                                                key={`${index}-${facultyIndex}`}
                                                className="flex items-center justify-between p-3 bg-white dark:bg-black-900/80 border border-gray-200 dark:border-black-700 rounded-lg ml-4 dark:backdrop-blur-md"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-3 h-3 rounded-full ${
                                                        faculty.status === 'present' 
                                                            ? 'bg-green-500' 
                                                            : faculty.status === 'absent' 
                                                            ? 'bg-red-500' 
                                                            : 'bg-gray-300 dark:bg-black-600'
                                                    }`}></div>
                                                    <div>
                                                        <div className="font-medium text-gray-900 dark:text-white">
                                                            {faculty.faculty_name}
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-black-400">
                                                            {new Date(faculty.created_at).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    faculty.status === 'present'
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                        : faculty.status === 'absent'
                                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                                        : 'bg-gray-100 dark:bg-black-800 text-gray-700 dark:text-black-300'
                                                }`}>
                                                    {faculty.status || 'Not Marked'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            } else {
                                // Fallback for old data structure
                                return (
                                    <div 
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-white dark:bg-black-900/80 border border-gray-200 dark:border-black-700 rounded-lg dark:backdrop-blur-md"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${
                                                record.status === 'present' 
                                                    ? 'bg-green-500' 
                                                    : record.status === 'absent' 
                                                    ? 'bg-red-500' 
                                                    : 'bg-gray-300 dark:bg-black-600'
                                            }`}></div>
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {formatDate(record.date || record.attendance_date)}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-black-400">
                                                    {record.faculty_first_name && record.faculty_last_name 
                                                        ? `Marked by ${record.faculty_first_name} ${record.faculty_last_name}`
                                                        : record.facultyName || 'Unknown Faculty'
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            record.status === 'present'
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                : record.status === 'absent'
                                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                                : 'bg-gray-100 dark:bg-black-800 text-gray-700 dark:text-black-300'
                                        }`}>
                                            {record.status || 'Not Marked'}
                                        </div>
                                    </div>
                                )
                            }
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
