import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/api/client'
import { useAuth } from '@/contexts/AuthContext'

export default function ProfilePage() {
	const { user, updateUser } = useAuth()
	const navigate = useNavigate()
	const [loading, setLoading] = useState(false)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState(null)
	const [success, setSuccess] = useState(null)
	const [isEditing, setIsEditing] = useState(false)

	const [profile, setProfile] = useState({
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		department: '',
		rollNumber: '',
		batch: '',
		semester: '',
		cgpa: '',
		bio: '',
		linkedinUrl: '',
		githubUrl: '',
		portfolioUrl: ''
	})

	useEffect(() => {
		fetchProfile()
	}, [])

	const fetchProfile = async () => {
		setLoading(true)
		try {
			const meRes = await api.get('/auth/me')
			const me = meRes.data.data.user
			let student = null
			if (me.studentId) {
				const studentRes = await api.get(`/students/${me.studentId}`)
				student = studentRes?.data?.data?.student
			} else {
				// Fallback: pull from /users/:id which left-joins students
				const uRes = await api.get(`/users/${me.id}`)
				student = {
					rollNumber: uRes.data?.data?.user?.rollNumber,
					batch: uRes.data?.data?.user?.batch,
					semester: uRes.data?.data?.user?.semester,
					cgpa: uRes.data?.data?.user?.cgpa,
					bio: uRes.data?.data?.user?.bio,
					linkedinUrl: uRes.data?.data?.user?.linkedinUrl,
					githubUrl: uRes.data?.data?.user?.githubUrl,
					portfolioUrl: uRes.data?.data?.user?.portfolioUrl
				}
			}
			setProfile({
				firstName: me.firstName || '',
				lastName: me.lastName || '',
				email: me.email || '',
				phone: me.phone || '',
				department: me.department || '',
				rollNumber: student?.rollNumber || '',
				batch: student?.batch || '',
				semester: student?.semester || '',
				cgpa: student?.cgpa || '',
				bio: student?.bio || '',
				linkedinUrl: student?.linkedinUrl || '',
				githubUrl: student?.githubUrl || '',
				portfolioUrl: student?.portfolioUrl || ''
			})
		} catch (err) {
			setError('Failed to load profile')
		} finally {
			setLoading(false)
		}
	}

	const handleSave = async () => {
		setSaving(true)
		setError(null)
		try {
			// Update user basic info
			await api.put(`/users/${user.id}`, {
				firstName: profile.firstName,
				lastName: profile.lastName,
				phone: profile.phone,
				department: profile.department
			})
			// Build payload only with valid/non-empty fields to satisfy validation
			if (!profile.rollNumber || profile.rollNumber.trim().length < 3) {
				throw new Error('Roll number is required (min 3 chars)')
			}
			const studentPayload = { rollNumber: profile.rollNumber.trim() }
			if (profile.batch && profile.batch.trim()) studentPayload.batch = profile.batch.trim()
			if (profile.semester && !Number.isNaN(parseInt(profile.semester))) studentPayload.semester = parseInt(profile.semester)
			if (profile.cgpa && !Number.isNaN(parseFloat(profile.cgpa))) studentPayload.cgpa = parseFloat(profile.cgpa)
			if (profile.bio && profile.bio.trim()) studentPayload.bio = profile.bio.trim()
			if (profile.linkedinUrl && profile.linkedinUrl.trim()) studentPayload.linkedinUrl = profile.linkedinUrl.trim()
			if (profile.githubUrl && profile.githubUrl.trim()) studentPayload.githubUrl = profile.githubUrl.trim()
			if (profile.portfolioUrl && profile.portfolioUrl.trim()) studentPayload.portfolioUrl = profile.portfolioUrl.trim()
			// Create or update student profile
			await api.post('/students/profile', studentPayload)
			setSuccess('Profile updated successfully!')
			setIsEditing(false)
			// Update auth context
			updateUser({
				...user,
				first_name: profile.firstName,
				last_name: profile.lastName,
				department: profile.department
			})
		} catch (err) {
			const details = err.response?.data?.errors?.map(e => e.msg).join(', ')
			setError(err.response?.data?.message || details || err.message || 'Failed to update profile')
			console.error('Profile save failed:', err.response?.data || err)
		} finally {
			setSaving(false)
		}
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-pureblack flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600 dark:text-black-400">Loading profile...</p>
				</div>
			</div>
		)
	}

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-pureblack w-full px-4 md:px-8">
            <div className="py-4 max-w-6xl mx-auto">
			<div className="mb-6">
				<button onClick={() => navigate(-1)} className="text-blue-600 dark:text-accent-400 mb-4">← Back</button>
				<div className="flex justify-between items-center">
					<h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Profile</h1>
					{!isEditing && (
						<button
							onClick={() => setIsEditing(true)}
							className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
						>
							Edit Profile
						</button>
					)}
				</div>
			</div>

			{error && <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">{error}</div>}
			{success && <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg">{success}</div>}

            <div className="bg-white dark:bg-black-900/80 rounded-lg shadow-sm dark:shadow-2xl p-6 dark:backdrop-blur-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				{/* Personal Information */}
					<div className="space-y-4">
						<h2 className="text-xl font-semibold text-gray-800 dark:text-white">Personal Information</h2>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-black-300 mb-1">First Name</label>
							<p className="text-gray-900 dark:text-white">{profile.firstName || 'Not set'}</p>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-black-300 mb-1">Last Name</label>
							<p className="text-gray-900 dark:text-white">{profile.lastName || 'Not set'}</p>
							</div>
						</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-black-300 mb-1">Email</label>
						<p className="text-gray-900 dark:text-white">{profile.email}</p>
					</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-black-300 mb-1">Phone</label>
							{isEditing ? (
								<input
									type="tel"
									value={profile.phone}
									onChange={(e) => setProfile({...profile, phone: e.target.value})}
									className="w-full border border-gray-300 dark:border-black-600 rounded-lg px-3 py-2 bg-white dark:bg-black-800/50 text-gray-900 dark:text-white dark:backdrop-blur-sm"
								/>
							) : (
								<p className="text-gray-900 dark:text-white">{profile.phone || 'Not set'}</p>
							)}
						</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-black-300 mb-1">Department</label>
						{isEditing ? (
							<input
								type="text"
								value={profile.department}
								onChange={(e) => setProfile({...profile, department: e.target.value})}
								className="w-full border border-gray-300 dark:border-black-600 rounded-lg px-3 py-2 bg-white dark:bg-black-800/50 text-gray-900 dark:text-white dark:backdrop-blur-sm"
							/>
						) : (
							<p className="text-gray-900 dark:text-white">{profile.department || 'Not set'}</p>
						)}
					</div>
					</div>

					{/* Academic Information */}
					<div className="space-y-4">
						<h2 className="text-xl font-semibold text-gray-800 dark:text-white">Academic Information</h2>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-black-300 mb-1">Roll Number</label>
						<p className="text-gray-900 dark:text-white">{profile.rollNumber || 'Not set'}</p>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-black-300 mb-1">Batch</label>
						<p className="text-gray-900 dark:text-white">{profile.batch || 'Not set'}</p>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-black-300 mb-1">Semester</label>
						<p className="text-gray-900 dark:text-white">{profile.semester || 'Not set'}</p>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-black-300 mb-1">CGPA</label>
						<p className="text-gray-900 dark:text-white">{profile.cgpa || 'Not set'}</p>
					</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-black-300 mb-1">Bio</label>
							{isEditing ? (
								<textarea
									value={profile.bio}
									onChange={(e) => setProfile({...profile, bio: e.target.value})}
									className="w-full border border-gray-300 dark:border-black-600 rounded-lg px-3 py-2 h-24 bg-white dark:bg-black-800/50 text-gray-900 dark:text-white dark:backdrop-blur-sm"
									placeholder="Tell us about yourself..."
								/>
							) : (
								<p className="text-gray-900 dark:text-white">{profile.bio || 'No bio added'}</p>
							)}
						</div>
					</div>

					{/* Social Links */}
                    <div className="md:col-span-2 space-y-4">
						<h2 className="text-xl font-semibold text-gray-800 dark:text-white">Social Links</h2>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-black-300 mb-1">LinkedIn</label>
								{isEditing ? (
									<input
										type="url"
										value={profile.linkedinUrl}
										onChange={(e) => setProfile({...profile, linkedinUrl: e.target.value})}
										className="w-full border border-gray-300 dark:border-black-600 rounded-lg px-3 py-2 bg-white dark:bg-black-800/50 text-gray-900 dark:text-white dark:backdrop-blur-sm"
										placeholder="https://linkedin.com/in/yourprofile"
									/>
								) : (
									<p className="text-gray-900 dark:text-white">
										{profile.linkedinUrl ? (
											<a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-accent-400 hover:underline">
												{profile.linkedinUrl}
											</a>
										) : 'Not set'}
									</p>
								)}
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-black-300 mb-1">GitHub</label>
								{isEditing ? (
									<input
										type="url"
										value={profile.githubUrl}
										onChange={(e) => setProfile({...profile, githubUrl: e.target.value})}
										className="w-full border border-gray-300 dark:border-black-600 rounded-lg px-3 py-2 bg-white dark:bg-black-800/50 text-gray-900 dark:text-white dark:backdrop-blur-sm"
										placeholder="https://github.com/yourusername"
									/>
								) : (
									<p className="text-gray-900 dark:text-white">
										{profile.githubUrl ? (
											<a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-accent-400 hover:underline">
												{profile.githubUrl}
											</a>
										) : 'Not set'}
									</p>
								)}
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-black-300 mb-1">Portfolio</label>
								{isEditing ? (
									<input
										type="url"
										value={profile.portfolioUrl}
										onChange={(e) => setProfile({...profile, portfolioUrl: e.target.value})}
										className="w-full border border-gray-300 dark:border-black-600 rounded-lg px-3 py-2 bg-white dark:bg-black-800/50 text-gray-900 dark:text-white dark:backdrop-blur-sm"
										placeholder="https://yourportfolio.com"
									/>
								) : (
									<p className="text-gray-900 dark:text-white">
										{profile.portfolioUrl ? (
											<a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-accent-400 hover:underline">
												{profile.portfolioUrl}
											</a>
										) : 'Not set'}
									</p>
								)}
            </div>
            </div>
        </div>
					</div>
				</div>

				{isEditing && (
					<div className="mt-6 flex gap-4">
						<button
							onClick={handleSave}
							disabled={saving}
							className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
						>
							{saving ? 'Saving...' : 'Save Changes'}
						</button>
						<button
							onClick={() => {
								setIsEditing(false)
								fetchProfile() // Reset to original
							}}
							className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
						>
							Cancel
						</button>
					</div>
				)}
			</div>
		</div>
	)
}
