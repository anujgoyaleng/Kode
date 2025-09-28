import { useEffect, useState } from 'react'
import api from '@/api/client'

export default function FacultyMyStudents() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [students, setStudents] = useState([])
    const [section, setSection] = useState('')
    const [semester, setSemester] = useState('')

    const load = async (sectionFilter = '') => {
        setLoading(true)
        setError(null)
        try {
            const params = {}
            if (sectionFilter && sectionFilter.trim()) {
                params.section = sectionFilter.trim().toUpperCase()
            }
            
            const res = await api.get('/faculty/my-students', { params })
            setStudents(res.data.data.students)
        } catch (e) {
            setError('Failed to load students')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])
    
    // Auto-filter when section changes
    useEffect(() => {
        load(section)
    }, [section])
    
    const clearFilters = () => {
        setSection('')
        setSemester('')
        load('')
    }

    // Client-side filtering for semester
    const filteredStudents = students.filter(student => {
        if (!semester || !semester.trim()) return true
        return student.semester && student.semester.toString().toLowerCase().includes(semester.toLowerCase())
    })

    if (loading) return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading students...</p>
            </div>
        </div>
    )
    if (error) return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
            <div className="text-center">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <p className="text-red-600 dark:text-red-400 text-lg">{error}</p>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 w-full px-4 md:px-8">
            <div className="py-6 max-w-7xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Students</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">View and manage your assigned students</p>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Section:</label>
                            <input 
                                className="input w-32" 
                                placeholder="Section" 
                                value={section} 
                                onChange={e=>setSection(e.target.value.toUpperCase())} 
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400">(auto-filter)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Semester:</label>
                            <input 
                                className="input w-32" 
                                placeholder="Semester" 
                                value={semester} 
                                onChange={e=>setSemester(e.target.value)} 
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400">(client-side filter)</span>
                        </div>
                        <button onClick={clearFilters} className="btn-secondary bg-gray-500 hover:bg-gray-600">Clear Filters</button>
                    </div>
                </div>
                <div className="card overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-dark-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-semibold text-xl text-gray-900 dark:text-gray-100">Student List</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Showing {filteredStudents.length} of {students.length} students
                                </p>
                            </div>
                            {(section || semester) && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
                                    {section && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                            Section: {section} (server-side)
                                        </span>
                                    )}
                                    {semester && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                            Semester: {semester} (client-side)
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Roll Number</th>
                                    <th>Batch</th>
                                    <th>Semester</th>
                                    <th>Section</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map(s => (
                                    <tr key={s.id}>
                                        <td className="font-medium whitespace-nowrap">{s.firstName} {s.lastName}</td>
                                        <td>{s.email}</td>
                                        <td>{s.rollNumber}</td>
                                        <td>{s.batch || '-'}</td>
                                        <td>{s.semester || '-'}</td>
                                        <td>{s.section || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}


