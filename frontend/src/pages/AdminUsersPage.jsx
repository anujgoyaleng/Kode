import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/api/client'

export default function AdminUsersPage() {
    const { user: authUser } = useAuth()
	const [users, setUsers] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)
	const [creating, setCreating] = useState(false)
	const [roleFilter, setRoleFilter] = useState('all')
	const [searchTerm, setSearchTerm] = useState('')
	const [searchInput, setSearchInput] = useState('')
	const [form, setForm] = useState({
		email: '', password: '', firstName: '', lastName: '', phone: '', department: '', role: 'faculty'
	})

	const load = async () => {
		try {
			const params = { limit: 50 }
			if (roleFilter !== 'all') params.role = roleFilter
			if (searchTerm.trim()) params.search = searchTerm.trim()
			const res = await api.get('/users', { params })
			setUsers(res.data.data.users)
		} catch (e) {
			setError('Failed to load users')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => { load() }, [roleFilter, searchTerm])

	const toggleActive = async (u) => {
		await api.put(`/users/${u.id}/status`, { isActive: !u.isActive })
		load()
	}

	const createUser = async (e) => {
		e.preventDefault()
		setCreating(true)
		setError(null)
		try {
			await api.post('/auth/register', form)
			setForm({ email: '', password: '', firstName: '', lastName: '', phone: '', department: '', role: 'faculty' })
			load()
		} catch (e) {
			setError(e.response?.data?.message || 'Failed to create user')
		} finally {
			setCreating(false)
		}
	}

	const removeUser = async (u) => {
		if (!confirm(`Remove user ${u.email}?`)) return
		try {
			await api.delete(`/users/${u.id}`)
			load()
		} catch (e) {
			alert(e.response?.data?.message || 'Failed to remove user')
		}
	}

	if (loading) return (
		<div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
			<div className="text-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
				<p className="text-gray-600 dark:text-gray-400">Loading users...</p>
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
						<h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
						<p className="text-gray-600 dark:text-gray-400 mt-1">Manage faculty, admin, and student accounts</p>
					</div>
				</div>
				<div className="card p-6">
					<h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Create New User</h2>
					<form onSubmit={createUser} className="grid md:grid-cols-6 gap-4 items-end">
						<input className="input" placeholder="First name" value={form.firstName} onChange={e=>setForm({...form, firstName:e.target.value})} required />
						<input className="input" placeholder="Last name" value={form.lastName} onChange={e=>setForm({...form, lastName:e.target.value})} required />
						<input className="input md:col-span-2" type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
						<input className="input" type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required />
						<select className="input" value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
							<option value="faculty">Faculty</option>
							<option value="admin">Admin</option>
						</select>
						<input className="input" placeholder="Phone" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} />
						<input className="input" placeholder="Department" value={form.department} onChange={e=>setForm({...form, department:e.target.value})} />
						<button className="btn-primary md:col-span-2" disabled={creating}>{creating?'Creating...':'Create User'}</button>
					</form>
				</div>
				<div className="card p-4">
					<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
						<div className="flex items-center gap-2">
							<label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</label>
							<select className="input w-auto" value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}>
								<option value="all">All Users</option>
								<option value="student">Students</option>
								<option value="faculty">Faculty</option>
								<option value="admin">Admins</option>
							</select>
						</div>
						<div className="flex items-center gap-2 flex-1">
							<input 
								className="input" 
								placeholder="Search by name or email..." 
								value={searchInput} 
								onChange={e=>setSearchInput(e.target.value)} 
							/>
							<button onClick={()=>setSearchTerm(searchInput)} className="btn-secondary">Search</button>
						</div>
					</div>
				</div>
				{/* Student approvals moved to AdminStudentsPage */}
				<div className="card overflow-hidden">
					<div className="overflow-x-auto">
						<table className="table">
							<thead>
								<tr>
									<th>Name</th>
									<th>Email</th>
									<th>Role</th>
									<th>Status</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{users.map(u => (
									<tr key={u.id}>
										<td className="font-medium">{u.firstName} {u.lastName}</td>
										<td>{u.email}</td>
										<td>
											<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
												u.role === 'admin' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
												u.role === 'faculty' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
												'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
											}`}>
												{u.role}
											</span>
										</td>
										<td>
											<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
												u.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
											}`}>
												{u.isActive ? 'Active' : 'Inactive'}
											</span>
										</td>
										<td>
											<div className="flex items-center gap-2">
												<button 
													onClick={() => toggleActive(u)} 
													className={`btn-secondary text-xs ${authUser && authUser.id === u.id ? 'opacity-50 cursor-not-allowed' : ''}`}
													disabled={authUser && authUser.id === u.id}
													title={authUser && authUser.id === u.id ? 'You cannot deactivate your own account' : ''}
												>
													{u.isActive ? 'Deactivate' : 'Activate'}
												</button>
												{u.role !== 'admin' && <button onClick={() => removeUser(u)} className="btn-danger text-xs">Remove</button>}
												<InlineEditor user={u} onSaved={load} />
											</div>
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

function InlineEditor({ user, onSaved }) {
	const [open, setOpen] = useState(false)
	const [saving, setSaving] = useState(false)
	const [form, setForm] = useState({ firstName: user.firstName, lastName: user.lastName, phone: user.phone || '', department: user.department || '' })
	const [stu, setStu] = useState({ rollNumber: '', batch: '', semester: '', cgpa: '', section: '' })

	useEffect(() => {
		(async () => {
			try {
				const res = await api.get(`/users/${user.id}`)
				const u = res.data.data.user
				setForm({ firstName: u.firstName, lastName: u.lastName, phone: u.phone || '', department: u.department || '' })
				setStu({ rollNumber: u.rollNumber || '', batch: u.batch || '', semester: u.semester || '', cgpa: u.cgpa || '', section: u.section || '' })
			} catch {}
		})()
	}, [user.id])

	const save = async () => {
		setSaving(true)
		try {
			await api.put(`/users/${user.id}`, form)
			if (user.role === 'student' && (stu.rollNumber || stu.batch || stu.semester || stu.cgpa || stu.section)) {
				const userDetail = await api.get(`/users/${user.id}`)
				const studentId = userDetail.data.data.user.studentId
				if (studentId) {
					await api.put(`/faculty/students/${studentId}/profile`, {
						rollNumber: stu.rollNumber || null,
						batch: stu.batch || null,
						semester: stu.semester ? parseInt(stu.semester) : null,
						cgpa: stu.cgpa ? parseFloat(stu.cgpa) : null,
						section: stu.section || null
					})
				}
			}
			onSaved()
			setOpen(false)
		} finally { setSaving(false) }
	}

	return (
		<span className="inline-block">
			<button onClick={() => setOpen(o=>!o)} className="btn-secondary text-xs">{open?'Close':'Edit'}</button>
			{open && (
				<div className="mt-2 p-4 border border-gray-200 dark:border-dark-700 rounded-lg bg-gray-50 dark:bg-dark-800 space-y-4">
					<div className="grid md:grid-cols-4 gap-3">
						<input className="input" placeholder="First Name" value={form.firstName} onChange={e=>setForm({...form, firstName:e.target.value})} />
						<input className="input" placeholder="Last Name" value={form.lastName} onChange={e=>setForm({...form, lastName:e.target.value})} />
						<input className="input" placeholder="Phone" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} />
						<input className="input" placeholder="Department" value={form.department} onChange={e=>setForm({...form, department:e.target.value})} />
						{user.role === 'student' && <>
							<input className="input" placeholder="Roll Number" value={stu.rollNumber} onChange={e=>setStu({...stu, rollNumber:e.target.value})} />
							<input className="input" placeholder="Batch" value={stu.batch} onChange={e=>setStu({...stu, batch:e.target.value})} />
							<input className="input" placeholder="Semester" value={stu.semester} onChange={e=>setStu({...stu, semester:e.target.value})} />
							<input className="input" placeholder="CGPA" value={stu.cgpa} onChange={e=>setStu({...stu, cgpa:e.target.value})} />
							<input className="input" placeholder="Section" value={stu.section} onChange={e=>setStu({...stu, section:e.target.value})} />
						</>}
					</div>
					<div className="text-right">
						<button onClick={save} disabled={saving} className="btn-primary text-sm">{saving?'Saving...':'Save Changes'}</button>
					</div>
				</div>
			)}
		</span>
	)
}

function PendingStudent({ user, onApproved, onRejected }) {
	const [saving, setSaving] = useState(false)
	const [rollNumber, setRollNumber] = useState('')
	const [batch, setBatch] = useState('')
	const [semester, setSemester] = useState('')

	const approve = async () => {
		setSaving(true)
		try {
			// fetch student id for this user
			const res = await api.get(`/users/${user.id}`)
			const studentId = res.data.data.user.studentId
			if (studentId) {
				await api.put(`/faculty/students/${studentId}/profile`, { rollNumber, batch, semester: semester ? parseInt(semester) : null })
			} else {
				await api.post('/faculty/students', { userId: user.id, rollNumber, batch, semester: semester ? parseInt(semester) : null })
			}
			await api.put(`/users/${user.id}/status`, { isActive: true })
			onApproved()
		} finally {
			setSaving(false)
		}
	}

	const reject = async () => {
		setSaving(true)
		try { await api.delete(`/users/${user.id}`); onRejected() } finally { setSaving(false) }
	}

	return (
		<div className="card p-4 flex items-center justify-between">
			<div className="flex-1">
				<div className="font-medium text-gray-900 dark:text-gray-100">{user.firstName} {user.lastName}</div>
				<div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
				<div className="mt-3 grid grid-cols-3 gap-3">
					<input className="input" placeholder="Roll No." value={rollNumber} onChange={e=>setRollNumber(e.target.value)} />
					<input className="input" placeholder="Batch" value={batch} onChange={e=>setBatch(e.target.value)} />
					<input className="input" placeholder="Semester" value={semester} onChange={e=>setSemester(e.target.value)} />
				</div>
			</div>
			<div className="flex gap-2 ml-4">
				<button onClick={approve} disabled={saving} className="btn-primary text-sm bg-green-600 hover:bg-green-700">{saving?'...':'Approve'}</button>
				<button onClick={reject} disabled={saving} className="btn-danger text-sm">Reject</button>
			</div>
		</div>
	)
}


