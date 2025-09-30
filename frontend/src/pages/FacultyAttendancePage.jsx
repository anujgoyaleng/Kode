import { useEffect, useState } from 'react'
import api from '@/api/client'
import { validateDateRange, createValidDate } from '@/utils/dateUtils'

export default function FacultyAttendancePage() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [date, setDate] = useState(() => new Date().toISOString().slice(0,10))
    const [batches, setBatches] = useState([])
    const [sections, setSections] = useState([])
    const [students, setStudents] = useState([])
    const [selectedBatch, setSelectedBatch] = useState('')
    const [selectedSection, setSelectedSection] = useState('')
    const [rows, setRows] = useState([])
    const [saving, setSaving] = useState(false)
    const [nameFilter, setNameFilter] = useState('')
    const [rollFilter, setRollFilter] = useState('')

    const loadBatches = async () => {
        setLoading(true)
        setError(null)
        try {
            console.log('Loading batches...')
            const res = await api.get('/faculty/attendance/batches')
            console.log('Batches response:', res.data)
            setBatches(res.data.data.batches || [])
        } catch (e) {
            console.error('Error loading batches:', e)
            setError('Failed to load batches: ' + (e.response?.data?.message || e.message))
        } finally {
            setLoading(false)
        }
    }

    const loadSections = async (batch) => {
        setLoading(true)
        setError(null)
        try {
            console.log('Loading sections for batch:', batch)
            const res = await api.get('/faculty/attendance/sections', { params: { batch } })
            console.log('Sections response:', res.data)
            setSections(res.data.data.sections || [])
            setStudents([])
            setRows([])
        } catch (e) {
            console.error('Error loading sections:', e)
            setError('Failed to load sections: ' + (e.response?.data?.message || e.message))
        } finally {
            setLoading(false)
        }
    }

    const loadStudents = async (batch, section) => {
        setLoading(true)
        setError(null)
        try {
            console.log('Loading students for batch:', batch, 'section:', section, 'date:', date)
            const res = await api.get('/faculty/attendance', { params: { date, batch, section } })
            console.log('Students response:', res.data)
            const entries = res.data.data.entries || []
            setStudents(entries)
            setRows(entries.map(e => ({ ...e })))
        } catch (e) {
            console.error('Error loading students:', e)
            setError('Failed to load students: ' + (e.response?.data?.message || e.message))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadBatches() }, [])

    const setStatus = (studentId, status) => {
        console.log('Setting status for student:', studentId, 'to:', status)
        setRows(prev => prev.map(r => r.studentId === studentId ? { ...r, status } : r))
    }

    const markAllPresent = () => {
        setRows(prev => prev.map(r => ({ ...r, status: 'present' })))
    }

    const markAllAbsent = () => {
        setRows(prev => prev.map(r => ({ ...r, status: 'absent' })))
    }

    const clearAll = () => {
        setRows(prev => prev.map(r => ({ ...r, status: null })))
    }

    const save = async () => {
        setSaving(true)
        try {
            // Ensure ALL students are marked - unmarked ones default to absent
            const entries = rows.map(r => ({
                studentId: r.studentId,
                status: r.status || 'absent' // Default to absent if not marked
            }))
            console.log('Saving attendance:', { date, batch: selectedBatch, section: selectedSection, entries })
            await api.put('/faculty/attendance', { date, batch: selectedBatch, section: selectedSection, entries })
            alert('Attendance saved successfully! All unmarked students have been marked as absent.')
        } catch (e) {
            console.error('Error saving attendance:', e)
            alert(e.response?.data?.message || 'Failed to save')
        } finally {
            setSaving(false)
        }
    }

    // Check if attendance date is more than 7 days old or in the future
    const isAttendanceOld = () => {
        const validation = validateDateRange(date, 7)
        return validation.isOld
    }

    const isFutureDate = () => {
        const validation = validateDateRange(date, 7)
        return validation.isFuture
    }

    const isAttendanceEditable = () => {
        return !isAttendanceOld() && !isFutureDate()
    }

    const filteredStudents = students.map(student => {
        // Find the corresponding row with updated status
        const row = rows.find(r => r.studentId === student.studentId)
        return {
            ...student,
            status: row ? row.status : student.status
        }
    }).filter(student => {
        const nameMatch = !nameFilter || 
            `${student.firstName} ${student.lastName}`.toLowerCase().includes(nameFilter.toLowerCase())
        const rollMatch = !rollFilter || 
            (student.rollNumber && student.rollNumber.toLowerCase().includes(rollFilter.toLowerCase()))
        return nameMatch && rollMatch
    })

    if (loading) return (
        <div className="min-h-screen bg-gray-50 dark:bg-pureblack flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-black-400">Loading attendance...</p>
            </div>
        </div>
    )
    if (error) return (
        <div className="min-h-screen bg-gray-50 dark:bg-pureblack flex items-center justify-center">
            <div className="text-center">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <p className="text-red-600 dark:text-red-400 text-lg">{error}</p>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-pureblack w-full px-4 md:px-8">
            <div className="py-6 max-w-7xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mark Attendance</h1>
                        <p className="text-gray-600 dark:text-black-400 mt-1">Track student attendance for your classes</p>
                    </div>
                </div>

                        {/* Date Selection */}
                        <div className="card p-6">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date:</label>
                                    <input type="date" className="input w-auto" value={date} onChange={e=>setDate(e.target.value)} />
                                </div>
                                {selectedBatch && selectedSection && (
                                    <button 
                                        onClick={save} 
                                        disabled={saving || !isAttendanceEditable()} 
                                        className={`btn-primary ${!isAttendanceEditable() ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                                    >
                                        {saving ? 'Saving...' : 
                                         isFutureDate() ? 'Cannot Edit (Future Date)' :
                                         isAttendanceOld() ? 'Cannot Edit (7+ days old)' : 
                                         'Save Attendance'}
                                    </button>
                                )}
                            </div>
                            {!isAttendanceEditable() && (
                                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
                                        <span className="text-sm text-yellow-700 dark:text-yellow-300">
                                            {isFutureDate() 
                                                ? 'Cannot mark attendance for future dates. You can only mark attendance for today or past dates.'
                                                : 'This attendance is more than 7 days old. You can only view the records, not edit them.'
                                            }
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                {/* Batch Selection */}
                {!selectedBatch && (
                    <div className="card p-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Select Batch</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {batches.map(batch => (
                                <button
                                    key={batch}
                                    onClick={() => {
                                        setSelectedBatch(batch)
                                        loadSections(batch)
                                    }}
                                    className="p-4 bg-primary-50 dark:bg-accent-900/20 border border-primary-200 dark:border-accent-800 rounded-lg hover:bg-primary-100 dark:hover:bg-accent-900/30 transition-colors text-primary-700 dark:text-accent-300 font-medium"
                                >
                                    {batch}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Section Selection */}
                {selectedBatch && !selectedSection && (
                    <div className="card p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <button 
                                onClick={() => {
                                    setSelectedBatch('')
                                    setSelectedSection('')
                                    setSections([])
                                    setStudents([])
                                    setRows([])
                                }}
                                className="btn-secondary"
                            >
                                ← Back to Batches
                            </button>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Batch {selectedBatch} - Select Section</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {sections.map(section => (
                                <button
                                    key={section}
                                    onClick={() => {
                                        setSelectedSection(section)
                                        loadStudents(selectedBatch, section)
                                    }}
                                    className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-green-700 dark:text-green-300 font-medium"
                                >
                                    {section}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Student List and Attendance */}
                {selectedBatch && selectedSection && (
                    <div className="space-y-6">
                        {/* Navigation and Filters */}
                        <div className="card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => {
                                            setSelectedSection('')
                                            setStudents([])
                                            setRows([])
                                        }}
                                        className="btn-secondary"
                                    >
                                        ← Back to Sections
                                    </button>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        Batch {selectedBatch} - Section {selectedSection}
                                    </h2>
                                </div>
                            </div>
                            
                            {/* Name and Roll Number Filters */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name:</label>
                                    <input 
                                        className="input w-48" 
                                        placeholder="Filter by name" 
                                        value={nameFilter} 
                                        onChange={e=>setNameFilter(e.target.value)} 
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Roll No:</label>
                                    <input 
                                        className="input w-32" 
                                        placeholder="Filter by roll" 
                                        value={rollFilter} 
                                        onChange={e=>setRollFilter(e.target.value)} 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Attendance Summary */}
                        <div className="card p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <span className="text-sm text-gray-600 dark:text-black-400">
                                            Present: {rows.filter(r => r.status === 'present').length}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                        <span className="text-sm text-gray-600 dark:text-black-400">
                                            Absent: {rows.filter(r => r.status === 'absent').length}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                                        <span className="text-sm text-gray-600 dark:text-black-400">
                                            Not Marked: {rows.filter(r => !r.status || (r.status !== 'present' && r.status !== 'absent')).length} (will be marked absent)
                                        </span>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-black-400">
                                    Total: {rows.length} students
                                </div>
                            </div>
                            
                            {/* Bulk Actions */}
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bulk Actions:</span>
                                <button 
                                    onClick={markAllPresent}
                                    disabled={!isAttendanceEditable()}
                                    className={`btn-secondary text-sm px-3 py-1 ${!isAttendanceEditable() 
                                        ? 'bg-gray-100 dark:bg-black-800 text-gray-400 dark:text-black-600 cursor-not-allowed' 
                                        : 'bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300'
                                    }`}
                                >
                                    Mark All Present
                                </button>
                                <button 
                                    onClick={markAllAbsent}
                                    disabled={!isAttendanceEditable()}
                                    className={`btn-secondary text-sm px-3 py-1 ${!isAttendanceEditable() 
                                        ? 'bg-gray-100 dark:bg-black-800 text-gray-400 dark:text-black-600 cursor-not-allowed' 
                                        : 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300'
                                    }`}
                                >
                                    Mark All Absent
                                </button>
                                <button 
                                    onClick={clearAll}
                                    disabled={!isAttendanceEditable()}
                                    className={`btn-secondary text-sm px-3 py-1 ${!isAttendanceEditable() 
                                        ? 'bg-gray-100 dark:bg-black-800 text-gray-400 dark:text-black-600 cursor-not-allowed' 
                                        : 'bg-gray-50 hover:bg-gray-100 dark:bg-black-800 dark:hover:bg-black-700 text-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>

                        {/* Attendance Table */}
                        <div className="card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Roll Number</th>
                                            <th>Name</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-900 dark:text-white">
                                        {filteredStudents.map(r => (
                                            <tr key={r.studentId}>
                                                <td className="font-medium text-gray-900 dark:text-gray-100">{r.rollNumber}</td>
                                                <td className="font-medium text-gray-900 dark:text-gray-100">{r.firstName} {r.lastName}</td>
                                                <td>
                                                    <div className="flex items-center gap-4">
                                                        <label className={`inline-flex items-center gap-2 text-sm px-2 py-1 rounded transition-colors ${
                                                            !isAttendanceEditable() 
                                                                ? 'cursor-not-allowed opacity-50' 
                                                                : 'cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20'
                                                        }`}>
                                                            <input 
                                                                type="radio" 
                                                                name={`att-${r.studentId}`} 
                                                                checked={r.status === 'present'} 
                                                                onChange={() => setStatus(r.studentId, 'present')} 
                                                                disabled={!isAttendanceEditable()}
                                                                className="text-green-600 focus:ring-green-500 focus:ring-2" 
                                                            /> 
                                                            <span className={`${r.status === 'present' ? 'text-green-700 dark:text-green-300 font-medium' : 'text-gray-900 dark:text-gray-100'}`}>
                                                                Present
                                                            </span>
                                                        </label>
                                                        <label className={`inline-flex items-center gap-2 text-sm px-2 py-1 rounded transition-colors ${
                                                            !isAttendanceEditable() 
                                                                ? 'cursor-not-allowed opacity-50' 
                                                                : 'cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20'
                                                        }`}>
                                                            <input 
                                                                type="radio" 
                                                                name={`att-${r.studentId}`} 
                                                                checked={r.status === 'absent'} 
                                                                onChange={() => setStatus(r.studentId, 'absent')} 
                                                                disabled={!isAttendanceEditable()}
                                                                className="text-red-600 focus:ring-red-500 focus:ring-2" 
                                                            /> 
                                                            <span className={`${r.status === 'absent' ? 'text-red-700 dark:text-red-300 font-medium' : 'text-gray-900 dark:text-gray-100'}`}>
                                                                Absent
                                                            </span>
                                                        </label>
                                                        {isAttendanceEditable() && (
                                                            <button 
                                                                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline transition-colors px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800" 
                                                                onClick={() => setStatus(r.studentId, null)}
                                                            >
                                                                Clear
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}


