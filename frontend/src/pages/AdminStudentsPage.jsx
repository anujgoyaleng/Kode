import { useEffect, useState } from 'react'
import api from '@/api/client'

export default function AdminStudentsPage() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [students, setStudents] = useState([])
    const [pending, setPending] = useState([])
    const [mentors, setMentors] = useState({})
    const [faculties, setFaculties] = useState([])
    const [edit, setEdit] = useState({ rollNumber: '', batch: '', semester: '', section: '' })

    const load = async () => {
        setLoading(true)
        setError(null)
        try {
            const [stuRes, userRes, mentorRes] = await Promise.all([
                api.get('/faculty/students', { params: { limit: 200 } }),
                api.get('/users', { params: { role: 'student', limit: 200 } }),
                api.get('/mentors')
            ])
            setStudents(stuRes.data.data.students)
            setPending(userRes.data.data.users.filter(u => !u.isActive))
            const map = {}
            for (const m of mentorRes.data.data.mentors) map[m.section] = m.faculty_user_id
            setMentors(map)
            setFaculties(mentorRes.data.data.faculties)
        } catch (e) {
            setError('Failed to load data')
        } finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    const approve = async (u) => {
        try {
            // create or update student profile
            const detail = await api.get(`/users/${u.id}`)
            const studentId = detail.data.data.user.studentId
            if (studentId) {
                await api.put(`/faculty/students/${studentId}/profile`, {
                    rollNumber: edit.rollNumber || null,
                    batch: edit.batch || null,
                    semester: edit.semester ? parseInt(edit.semester) : null,
                    section: edit.section || null
                })
            } else {
                await api.post('/faculty/students', { userId: u.id, rollNumber: edit.rollNumber, batch: edit.batch, semester: edit.semester ? parseInt(edit.semester) : null })
            }
            await api.put(`/users/${u.id}/status`, { isActive: true })
            setEdit({ rollNumber: '', batch: '', semester: '', section: '' })
            load()
        } catch (e) {
            alert(e.response?.data?.message || 'Approval failed')
        }
    }

    const setMentor = async (section, facultyUserId) => {
        try {
            await api.put(`/mentors/${encodeURIComponent(section)}`, { facultyUserId })
            setMentors(prev => ({ ...prev, [section]: facultyUserId }))
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to assign mentor')
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-gray-50 dark:bg-pureblack flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-black-400">Loading students...</p>
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

    const sections = Array.from(new Set(students.map(s => s.section).filter(Boolean)))

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 w-full px-4 md:px-8">
            <div className="py-6 max-w-7xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Student Management</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage student approvals and section mentors</p>
                    </div>
                </div>

                <div className="card p-6">
                    <h2 className="font-semibold text-xl text-gray-900 dark:text-gray-100 mb-4">Pending Student Approvals</h2>
                    <div className="grid md:grid-cols-5 gap-3 items-end mb-4">
                        <input className="input" placeholder="Roll Number" value={edit.rollNumber} onChange={e=>setEdit({...edit, rollNumber:e.target.value})} />
                        <input className="input" placeholder="Batch" value={edit.batch} onChange={e=>setEdit({...edit, batch:e.target.value})} />
                        <input className="input" placeholder="Semester" value={edit.semester} onChange={e=>setEdit({...edit, semester:e.target.value})} />
                        <input className="input" placeholder="Section" value={edit.section} onChange={e=>setEdit({...edit, section:e.target.value})} />
                        <div className="text-xs text-gray-500 dark:text-gray-400">Fill defaults, then approve below</div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        {pending.map(u => (
                            <div key={u.id} className="border border-gray-200 dark:border-dark-700 rounded-lg p-4 bg-gray-50 dark:bg-dark-800 flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-gray-100">{u.firstName} {u.lastName}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">{u.email}</div>
                                </div>
                                <button onClick={()=>approve(u)} className="btn-primary text-sm bg-green-600 hover:bg-green-700">Approve</button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card p-6">
                    <h2 className="font-semibold text-xl text-gray-900 dark:text-gray-100 mb-4">Section Mentors</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        {sections.length === 0 && <div className="text-sm text-gray-600 dark:text-gray-400 col-span-full text-center py-8">No sections yet</div>}
                        {sections.map(sec => (
                            <div key={sec} className="border border-gray-200 dark:border-dark-700 rounded-lg p-4 bg-gray-50 dark:bg-dark-800 flex items-center justify-between">
                                <div className="font-medium text-gray-900 dark:text-gray-100">{sec}</div>
                                <select className="input w-auto" value={mentors[sec] || ''} onChange={e=>setMentor(sec, parseInt(e.target.value))}>
                                    <option value="">Select mentor</option>
                                    {faculties.map(f => (
                                        <option key={f.id} value={f.id}>{f.first_name} {f.last_name}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-dark-700">
                        <h2 className="font-semibold text-xl text-gray-900 dark:text-gray-100">All Students</h2>
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
                                {students.map(s => (
                                    <tr key={s.id}>
                                        <td className="font-medium whitespace-nowrap">{s.firstName} {s.lastName}</td>
                                        <td>{s.email}</td>
                                        <td>{s.rollNumber || '-'}</td>
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


