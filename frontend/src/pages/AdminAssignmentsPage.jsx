import { useEffect, useMemo, useState } from 'react'
import api from '@/api/client'

export default function AdminAssignmentsPage() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [students, setStudents] = useState([])
    const [faculties, setFaculties] = useState([])
    const [selectedByStudentId, setSelectedByStudentId] = useState({})
    const [savingStudentId, setSavingStudentId] = useState(null)
    const [pending, setPending] = useState([])
    const [defaults, setDefaults] = useState({ rollNumber: '', batch: '', semester: '', section: '' })
    const [searchTerm, setSearchTerm] = useState('')
    const [searchInput, setSearchInput] = useState('')
    const [selectedFilters, setSelectedFilters] = useState({ sections: [], batches: [], departments: [], semesters: [] })

    useEffect(() => {
        (async () => {
            setLoading(true)
            setError(null)
            try {
                const [assignRes, usersRes] = await Promise.all([
                    api.get('/assignments'),
                    api.get('/users', { params: { role: 'student', limit: 100 } })
                ])
                const { students, faculties, assignments } = assignRes.data.data
                setStudents(students)
                setFaculties(faculties)
                const map = {}
                for (const a of assignments) {
                    if (!map[a.student_id]) map[a.student_id] = new Set()
                    map[a.student_id].add(a.faculty_user_id)
                }
                const obj = {}
                for (const s of students) {
                    obj[s.id] = map[s.id] ? Array.from(map[s.id]) : []
                }
                setSelectedByStudentId(obj)
                const allUsers = usersRes.data.data.users || []
                const filteredPending = allUsers.filter(u => u.role === 'student' && !u.isActive)
                setPending(filteredPending)
            } catch (e) {
                const msg = e.response?.data?.message || e.message || 'Failed to load assignments'
                setError(msg)
            } finally {
                setLoading(false)
            }
        })()
    }, [])

    const toggle = (studentId, facultyId) => {
        setSelectedByStudentId(prev => {
            const curr = new Set(prev[studentId] || [])
            if (curr.has(facultyId)) curr.delete(facultyId); else curr.add(facultyId)
            return { ...prev, [studentId]: Array.from(curr) }
        })
    }

    const save = async (studentId) => {
        setSavingStudentId(studentId)
        try {
            const facultyUserIds = selectedByStudentId[studentId] || []
            await api.put(`/assignments/${studentId}`, { facultyUserIds })
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to save')
        } finally {
            setSavingStudentId(null)
        }
    }

    const approve = async (u) => {
        try {
            const detail = await api.get(`/users/${u.id}`)
            const studentId = detail.data.data.user.studentId
            if (studentId) {
                await api.put(`/faculty/students/${studentId}/profile`, {
                    rollNumber: defaults.rollNumber || null,
                    batch: defaults.batch || null,
                    semester: defaults.semester ? parseInt(defaults.semester) : null,
                    section: defaults.section || null
                })
            } else {
                await api.post('/faculty/students', {
                    userId: u.id,
                    rollNumber: defaults.rollNumber,
                    batch: defaults.batch,
                    semester: defaults.semester ? parseInt(defaults.semester) : null
                })
            }
            await api.put(`/users/${u.id}/status`, { isActive: true })
            setDefaults({ rollNumber: '', batch: '', semester: '', section: '' })
            setPending(prev => prev.filter(x => x.id !== u.id))
        } catch (e) {
            alert(e.response?.data?.message || 'Approval failed')
        }
    }

    const uniqueValues = useMemo(() => {
        const sections = Array.from(new Set(students.map(s => s.section).filter(Boolean))).sort()
        const batches = Array.from(new Set(students.map(s => s.batch).filter(Boolean))).sort()
        const departments = Array.from(new Set(students.map(s => s.department).filter(Boolean))).sort()
        const semesters = Array.from(new Set(students.map(s => s.semester).filter(v => v !== null && v !== undefined))).sort((a,b)=>a-b)
        return { sections, batches, departments, semesters }
    }, [students])

    const toggleFilter = (type, value) => {
        setSelectedFilters(prev => ({
            ...prev,
            [type]: prev[type].includes(value) 
                ? prev[type].filter(v => v !== value)
                : [...prev[type], value]
        }))
    }

    const applyFilters = () => {
        setSearchTerm('applied') // trigger filteredStudents recalculation
    }

    const filteredStudents = useMemo(() => {
        let list = students
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase()
            list = list.filter(s =>
                (s.firstName && s.firstName.toLowerCase().includes(term)) ||
                (s.lastName && s.lastName.toLowerCase().includes(term)) ||
                (s.email && s.email.toLowerCase().includes(term))
            )
        }
        if (selectedFilters.sections.length > 0) {
            list = list.filter(s => selectedFilters.sections.includes(s.section || ''))
        }
        if (selectedFilters.batches.length > 0) {
            list = list.filter(s => selectedFilters.batches.includes(s.batch || ''))
        }
        if (selectedFilters.departments.length > 0) {
            list = list.filter(s => selectedFilters.departments.includes(s.department || ''))
        }
        if (selectedFilters.semesters.length > 0) {
            list = list.filter(s => selectedFilters.semesters.includes(String(s.semester || '')))
        }
        return list
    }, [students, searchTerm, selectedFilters])

    if (loading) return (
        <div className="min-h-screen bg-gray-50 dark:bg-pureblack flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-black-400">Loading enrollments...</p>
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
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Enrollments</h1>
                        <p className="text-gray-600 dark:text-black-400 mt-1">Manage student-faculty assignments and approvals</p>
                    </div>
                </div>
                <div className="card p-6">
                    <h2 className="font-semibold text-xl text-gray-900 dark:text-white mb-4">Pending Student Approvals</h2>
                    <div className="grid md:grid-cols-5 gap-3 items-end mb-4">
                        <input className="input" placeholder="Roll Number" value={defaults.rollNumber} onChange={e=>setDefaults({...defaults, rollNumber:e.target.value})} />
                        <input className="input" placeholder="Batch" value={defaults.batch} onChange={e=>setDefaults({...defaults, batch:e.target.value})} />
                        <input className="input" placeholder="Semester" value={defaults.semester} onChange={e=>setDefaults({...defaults, semester:e.target.value})} />
                        <input className="input" placeholder="Section" value={defaults.section} onChange={e=>setDefaults({...defaults, section:e.target.value})} />
                        <div className="text-xs text-gray-500 dark:text-black-400">Set defaults, approve below</div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        {pending.length === 0 && <div className="text-sm text-gray-600 dark:text-black-400 col-span-full text-center py-8">No pending registrations</div>}
                        {pending.map(u => (
                            <div key={u.id} className="border border-gray-200 dark:border-black-700 rounded-lg p-4 bg-gray-50 dark:bg-black-800 flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-white">{u.firstName} {u.lastName}</div>
                                    <div className="text-sm text-gray-600 dark:text-black-400">{u.email}</div>
                                </div>
                                <button onClick={()=>approve(u)} className="btn-primary text-sm bg-green-600 hover:bg-green-700">Approve</button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="card overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-black-700 flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-black-400">Assign students to one or multiple faculties</div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <input 
                                className="input w-64" 
                                placeholder="Search active students by name or email..." 
                                value={searchInput} 
                                onChange={e=>setSearchInput(e.target.value)} 
                            />
                            <button onClick={()=>setSearchTerm(searchInput)} className="btn-secondary text-sm">Search</button>
                            <select 
                                className="input w-auto" 
                                value="" 
                                onChange={e => {
                                    if (e.target.value) {
                                        toggleFilter('sections', e.target.value)
                                        e.target.value = ''
                                    }
                                }}
                            >
                                <option value="">Section</option>
                                {uniqueValues.sections.map(sec => (
                                    <option key={sec} value={sec}>{sec}</option>
                                ))}
                            </select>
                            <select 
                                className="input w-auto" 
                                value="" 
                                onChange={e => {
                                    if (e.target.value) {
                                        toggleFilter('batches', e.target.value)
                                        e.target.value = ''
                                    }
                                }}
                            >
                                <option value="">Batch</option>
                                {uniqueValues.batches.map(b => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                            <select 
                                className="input w-auto" 
                                value="" 
                                onChange={e => {
                                    if (e.target.value) {
                                        toggleFilter('semesters', e.target.value)
                                        e.target.value = ''
                                    }
                                }}
                            >
                                <option value="">Semester</option>
                                {uniqueValues.semesters.map(s => (
                                    <option key={s} value={String(s)}>{s}</option>
                                ))}
                            </select>
                            <select 
                                className="input w-auto" 
                                value="" 
                                onChange={e => {
                                    if (e.target.value) {
                                        toggleFilter('departments', e.target.value)
                                        e.target.value = ''
                                    }
                                }}
                            >
                                <option value="">Department</option>
                                {uniqueValues.departments.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {Object.values(selectedFilters).some(arr => arr.length > 0) && (
                        <div className="p-4 border-b border-gray-200 dark:border-black-700 bg-gray-50 dark:bg-black-800">
                            <div className="text-sm font-medium mb-3 text-gray-900 dark:text-white">Active Filters:</div>
                            <div className="flex flex-wrap gap-2">
                                {selectedFilters.sections.map(sec => (
                                    <span key={sec} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
                                        Section: {sec}
                                        <button onClick={() => toggleFilter('sections', sec)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 ml-1">×</button>
                                    </span>
                                ))}
                                {selectedFilters.batches.map(b => (
                                    <span key={b} className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
                                        Batch: {b}
                                        <button onClick={() => toggleFilter('batches', b)} className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 ml-1">×</button>
                                    </span>
                                ))}
                                {selectedFilters.semesters.map(s => (
                                    <span key={s} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium">
                                        Semester: {s}
                                        <button onClick={() => toggleFilter('semesters', s)} className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 ml-1">×</button>
                                    </span>
                                ))}
                                {selectedFilters.departments.map(d => (
                                    <span key={d} className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full text-sm font-medium">
                                        Department: {d}
                                        <button onClick={() => toggleFilter('departments', d)} className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 ml-1">×</button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Roll Number</th>
                                    <th>Section</th>
                                    <th>Department</th>
                                    <th>Semester</th>
                                    <th>Batch</th>
                                    <th>Faculties</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map(s => (
                                    <tr key={s.id} className="align-top">
                                        <td className="whitespace-nowrap">
                                            <div className="font-medium text-gray-900 dark:text-white">{s.firstName} {s.lastName}</div>
                                            <div className="text-xs text-gray-500 dark:text-black-400">{s.email}</div>
                                        </td>
                                        <td className="whitespace-nowrap">{s.rollNumber}</td>
                                        <td className="whitespace-nowrap">{s.section}</td>
                                        <td className="whitespace-nowrap">{s.department}</td>
                                        <td className="whitespace-nowrap">{s.semester}</td>
                                        <td className="whitespace-nowrap">{s.batch}</td>
                                        <td>
                                            <div className="grid md:grid-cols-3 gap-2">
                                                {faculties.map(f => {
                                                    const checked = (selectedByStudentId[s.id] || []).includes(f.id)
                                                    return (
                                                        <label key={f.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                                            <input type="checkbox" checked={checked} onChange={() => toggle(s.id, f.id)} className="rounded border-gray-300 dark:border-black-600 text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-400" />
                                                            <span className="text-gray-900 dark:text-white">{f.firstName} {f.lastName}</span>
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap">
                                            <button onClick={() => save(s.id)} disabled={savingStudentId === s.id} className="btn-primary text-sm">
                                                {savingStudentId === s.id ? 'Saving...' : 'Save'}
                                            </button>
                                        </td>
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


