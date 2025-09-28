import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Link } from 'react-router-dom'
import api from '@/api/client'
import { useAuth } from '@/contexts/AuthContext'
import StatCard from '@/components/StatCard'
import Tile from '@/components/Tile'
import BottomNav from '@/components/BottomNav'

export default function StudentDashboard() {
	const { user } = useAuth()
	const [profile, setProfile] = useState(null)
	const [stats, setStats] = useState(null)
	const [attendanceStats, setAttendanceStats] = useState(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)
	// const [newAch, setNewAch] = useState({ title: '', description: '', grade: '', semester: '', year: '' })

	useEffect(() => {
		(async () => {
			try {
				let sid = user?.studentId
				if (!sid) {
					// refresh from server to pick up newly created student profiles
					const me = await api.get('/auth/me')
					sid = me.data?.data?.user?.studentId
				}
				if (!sid) {
					setLoading(false)
					return
				}
				const profileRes = await api.get(`/students/${sid}`)
				setProfile(profileRes.data.data)
				
				// Fetch attendance statistics
				try {
					const attendanceRes = await api.get('/students/attendance', {
						params: { limit: 30 } // Get last 30 days
					})
					setAttendanceStats(attendanceRes.data.data.statistics)
				} catch (attendanceError) {
					console.error('Failed to fetch attendance data:', attendanceError)
					// Set default values if attendance fetch fails
					setAttendanceStats({
						totalDays: 0,
						presentDays: 0,
						absentDays: 0,
						attendancePercentage: 0
					})
				}
			} catch (e) {
				setError('Failed to load dashboard')
			} finally {
				setLoading(false)
			}
		})()
	}, [user?.studentId])

	const getGreeting = () => {
		const hour = new Date().getHours()
		if (hour < 12) return 'Good Morning'
		if (hour < 17) return 'Good Afternoon'
		return 'Good Evening'
	}

	// Mock assignments data
	const assignments = [
		{ title: 'Operating Systems', completed: 2, total: 3 },
		{ title: 'Computer Networks', completed: 1, total: 2 }
	]

	// Mock CGPA data for chart
	const cgpaData = [
		{ year: '1st Year', cgpa: 7.5 },
		{ year: '2nd Year', cgpa: 8.2 },
		{ year: '3rd Year', cgpa: 8.6 }
	]

	if (loading) return (
		<div className="min-h-screen bg-gray-50 dark:bg-pureblack flex items-center justify-center">
			<div className="text-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
				<p className="text-gray-600 dark:text-black-400">Loading dashboard...</p>
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

	const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
	const program = profile?.student?.department ? `B.Tech ${profile.student.department}` : 'B.Tech Computer Science'
	const year = profile?.student?.batch || '2'
	const semester = profile?.student?.semester || '3'
	const attendance = attendanceStats?.attendancePercentage || 0
	const cgpa = profile?.student?.cgpa || 8.6
	const creditsEarned = 74
	const creditsTotal = 120
	const activitiesCount = stats?.activities?.total || 12

	return (
		<div className="pb-24 w-full space-y-6 bg-gray-50 dark:bg-pureblack min-h-screen px-4 md:px-8">
			<div className="space-y-6">
			{/* Greeting */}
			<div className="text-2xl font-bold text-primary-600 dark:text-accent-400 flex justify-between items-center mt-0">
				<span className="inline-block mt-2 md:mt-8 ml-4 md:ml-6">{getGreeting()}, {fullName}</span>
				{/* Language toggle or menu icon */}
				<div className="text-primary-600 dark:text-accent-400">🇮🇳</div>
			</div>

			{/* Profile Card */}
			<div className="card rounded-2xl p-6 shadow-sm">
				<div className="flex items-center gap-4 mb-6">
					<div className="h-16 w-16 rounded-full bg-primary-100 dark:bg-accent-900/30 flex items-center justify-center">
						<span className="text-primary-700 dark:text-accent-300 font-semibold text-lg">{(user?.firstName?.[0]||'').toUpperCase()}{(user?.lastName?.[0]||'').toUpperCase()}</span>
					</div>
					<div>
						<h2 className="text-lg font-semibold text-gray-900 dark:text-white">{fullName}</h2>
						<p className="text-sm text-gray-600 dark:text-black-400">{program}</p>
						<p className="text-sm text-gray-600 dark:text-black-400">Year {year}, Semester {semester}</p>
					</div>
				</div>
				<div className="grid grid-cols-2 gap-4 text-center">
					<StatCard label="Attendance" value={`${attendance}%`} />
					<StatCard label="CGPA" value={cgpa} />
					<StatCard label="Credits" value={`${creditsEarned}`} sub={`/${creditsTotal}`} />
					<StatCard label="Activities" value={activitiesCount} />
				</div>
			</div>

			{/* Assignments */}
			<div className="card rounded-2xl p-6 shadow-sm">
				<h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Assignments</h3>
				{assignments.map((assignment, index) => (
					<div key={index} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-black-800 rounded-lg mb-3">
						<span className="font-medium text-gray-900 dark:text-white">{assignment.title}</span>
						<span className="text-green-600 dark:text-green-400 font-medium">{assignment.completed}/{assignment.total}</span>
					</div>
				))}
			</div>

			{/* Academic Record Chart */}
			<div className="card rounded-2xl p-6 shadow-sm">
				<h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Academic Record</h3>
				<ResponsiveContainer width="100%" height={200}>
					<BarChart data={cgpaData}>
						<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-black-700" />
						<XAxis dataKey="year" stroke="#6b7280" className="dark:stroke-black-400" />
						<YAxis stroke="#6b7280" className="dark:stroke-black-400" />
						<Tooltip contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }} className="dark:bg-black-800 dark:border-black-700 dark:text-white" />
						<Legend />
						<Bar dataKey="cgpa" fill="#3B82F6" />
					</BarChart>
				</ResponsiveContainer>
			</div>

			{/* Achievements Manage */}
			<div className="card rounded-2xl p-6 shadow-sm">
				<h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Achievements</h3>
				<ul className="space-y-3">
					{profile?.academicAchievements?.map(a => {
						const status = a.isVerified === true ? 'Approved' : (a.isVerified === false && a.verifiedBy ? 'Rejected' : 'Pending')
						const statusColor = status === 'Approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : status === 'Rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
						return (
							<li key={a.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black-800 rounded-lg">
								<span className="flex items-center gap-3">
									<span className="font-medium text-gray-900 dark:text-white">{a.title} {a.year ? `- ${a.year}` : ''}</span>
									<span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor}`}>{status}</span>
								</span>
								<button onClick={async()=>{ await api.delete(`/students/${profile.student.id}/achievements/${a.id}`); const ref = await api.get(`/students/${profile.student.id}`); setProfile(ref.data.data) }} className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors">Remove</button>
							</li>
						)
					})}
				</ul>
				<div className="mt-4">
					<Link to="/upload?tab=achievement" className="btn-primary">Add Achievement</Link>
				</div>
			</div>

			</div>
			<BottomNav />
		</div>
	)
}

function CertificateUploader() {
	const [file, setFile] = useState(null)
	const [desc, setDesc] = useState('')
	const [status, setStatus] = useState(null)

	const upload = async (e) => {
		e.preventDefault()
		if (!file) return
		const form = new FormData()
		form.append('certificate', file)
		if (desc) form.append('description', desc)
		try {
			setStatus('Uploading...')
			await api.post('/upload/certificate', form, { headers: { 'Content-Type': 'multipart/form-data' } })
			setStatus('Uploaded')
			setFile(null); setDesc('')
		} catch (e) {
			setStatus('Failed')
		}
	}

	return (
		<form onSubmit={upload} className="space-y-4">
			<div className="font-semibold text-gray-900 dark:text-gray-100">Upload Certificate (PDF/Images)</div>
			<input 
				type="file" 
				onChange={(e) => setFile(e.target.files?.[0] || null)} 
				className="input"
			/>
			<input 
				className="input" 
				placeholder="Description (optional)" 
				value={desc} 
				onChange={(e) => setDesc(e.target.value)} 
			/>
			<button className="btn-primary bg-green-600 hover:bg-green-700">Upload</button>
			{status && <div className="text-sm text-gray-600 dark:text-gray-400">{status}</div>}
		</form>
	)
}


