import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/api/client'
import { useAuth } from '@/contexts/AuthContext'

export default function UploadPage() {
	const { user } = useAuth()
	const navigate = useNavigate()
	const [activeTab, setActiveTab] = useState('achievement')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState(null)
	const [success, setSuccess] = useState(null)

	const [achievementForm, setAchievementForm] = useState({
		title: '',
		description: '',
		grade: '',
		semester: '',
		year: '',
		certificateUrl: ''
	})

	const [projectForm, setProjectForm] = useState({
		title: '',
		description: '',
		technologies: '',
		githubUrl: '',
		liveUrl: '',
		startDate: '',
		endDate: ''
	})

	const [skillForm, setSkillForm] = useState({
		skillName: '',
		proficiencyLevel: 'beginner',
		category: ''
	})

	const [certificateForm, setCertificateForm] = useState({
		file: null,
		title: '',
		issuer: '',
		issueDate: '',
		certificateType: '',
		relatedLink: '',
		description: ''
	})

	const [activityForm, setActivityForm] = useState({
		activityType: 'competition',
		title: '',
		description: '',
		organization: '',
		position: '',
		startDate: '',
		endDate: '',
		certificateUrl: ''
	})

	const handleAchievementSubmit = async (e) => {
		e.preventDefault()
		setLoading(true)
		setError(null)
		try {
			await api.post(`/students/${user.studentId}/achievements`, {
				title: achievementForm.title,
				description: achievementForm.description,
				grade: achievementForm.grade || null,
				semester: achievementForm.semester || null,
				year: achievementForm.year ? parseInt(achievementForm.year) : null
			})
			setSuccess('Achievement added successfully!')
			setAchievementForm({ title: '', description: '', grade: '', semester: '', year: '' })
		} catch (err) {
			setError(err.response?.data?.message || 'Failed to add achievement')
		} finally {
			setLoading(false)
		}
	}

	const handleProjectSubmit = async (e) => {
		e.preventDefault()
		setLoading(true)
		setError(null)
		try {
			await api.post(`/students/${user.studentId}/projects`, {
				title: projectForm.title,
				description: projectForm.description,
				technologies: projectForm.technologies.split(',').map(t => t.trim()),
				githubUrl: projectForm.githubUrl || null,
				liveUrl: projectForm.liveUrl || null,
				startDate: projectForm.startDate || null,
				endDate: projectForm.endDate || null
			})
			setSuccess('Project added successfully!')
			setProjectForm({ title: '', description: '', technologies: '', githubUrl: '', liveUrl: '', startDate: '', endDate: '' })
		} catch (err) {
			setError(err.response?.data?.message || 'Failed to add project')
		} finally {
			setLoading(false)
		}
	}

	const handleSkillSubmit = async (e) => {
		e.preventDefault()
		setLoading(true)
		setError(null)
		try {
			await api.post(`/students/${user.studentId}/skills`, {
				skillName: skillForm.skillName,
				proficiencyLevel: skillForm.proficiencyLevel,
				category: skillForm.category || null
			})
			setSuccess('Skill added successfully!')
			setSkillForm({ skillName: '', proficiencyLevel: 'beginner', category: '' })
		} catch (err) {
			setError(err.response?.data?.message || 'Failed to add skill')
		} finally {
			setLoading(false)
		}
	}

	const handleCertificateSubmit = async (e) => {
		e.preventDefault()
		if (!certificateForm.file) return
		setLoading(true)
		setError(null)
		try {
			const formData = new FormData()
			formData.append('certificate', certificateForm.file)
			const descParts = []
			if (certificateForm.title) descParts.push(`Title: ${certificateForm.title}`)
			if (certificateForm.issuer) descParts.push(`Issuer: ${certificateForm.issuer}`)
			if (certificateForm.issueDate) descParts.push(`Issue Date: ${certificateForm.issueDate}`)
			if (certificateForm.certificateType) descParts.push(`Type: ${certificateForm.certificateType}`)
			if (certificateForm.relatedLink) descParts.push(`Link: ${certificateForm.relatedLink}`)
			if (certificateForm.description) descParts.push(`Notes: ${certificateForm.description}`)
			const combined = descParts.join(' | ')
			if (combined) formData.append('description', combined)
			await api.post('/upload/certificate', formData, {
				headers: { 'Content-Type': 'multipart/form-data' }
			})
			setSuccess('Certificate uploaded successfully!')
			setCertificateForm({ file: null, title: '', issuer: '', issueDate: '', certificateType: '', relatedLink: '', description: '' })
		} catch (err) {
			setError(err.response?.data?.message || 'Failed to upload certificate')
		} finally {
			setLoading(false)
		}
	}

	const handleActivitySubmit = async (e) => {
		e.preventDefault()
		setLoading(true)
		setError(null)
		try {
			await api.post(`/students/${user.studentId}/activities`, {
				activityType: activityForm.activityType,
				title: activityForm.title,
				description: activityForm.description || null,
				organization: activityForm.organization || null,
				startDate: activityForm.startDate || null,
				endDate: activityForm.endDate || null,
				position: activityForm.position || null,
				certificateUrl: activityForm.certificateUrl || null
			})
			setSuccess('Activity added successfully!')
			setActivityForm({ activityType: 'competition', title: '', description: '', organization: '', position: '', startDate: '', endDate: '', certificateUrl: '' })
		} catch (err) {
			setError(err.response?.data?.message || 'Failed to add activity')
		} finally {
			setLoading(false)
		}
	}

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-pureblack w-full px-4 md:px-8">
            <div className="py-6 max-w-6xl mx-auto">
            <div className="mb-8">
				<button onClick={() => navigate(-1)} className="text-primary-600 dark:text-accent-400 hover:text-primary-700 dark:hover:text-accent-300 mb-4 transition-colors">← Back</button>
				<h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add New Item</h1>
				<p className="text-gray-600 dark:text-black-400 mt-1">Upload your achievements, projects, skills, and certificates</p>
			</div>

			{error && <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg">{error}</div>}
			{success && <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg">{success}</div>}

			{/* Integrated Tabs + Panel */}
			<div className="card rounded-lg shadow-sm">
				<div className="px-4 md:px-6 pt-4">
					<div className="flex flex-wrap gap-4 border-b border-gray-200 dark:border-black-700">
						{[
							{ key: 'achievement', label: 'Achievement', icon: '🏆' },
							{ key: 'project', label: 'Project', icon: '🚀' },
							{ key: 'skill', label: 'Skill', icon: '💡' },
							{ key: 'activity', label: 'Activity', icon: '🎯' },
							{ key: 'certificate', label: 'Certificate', icon: '📜' }
						].map(tab => (
							<button
								key={tab.key}
								onClick={() => setActiveTab(tab.key)}
								className={`-mb-px px-3 md:px-4 py-2 font-medium transition-colors flex items-center gap-2 border-b-2 ${
									activeTab === tab.key
										? 'border-primary-600 text-primary-700 dark:text-accent-300'
										: 'border-transparent text-gray-600 dark:text-black-300 hover:text-gray-900 dark:hover:text-white'
								}`}
							>
								<span>{tab.icon}</span>
								{tab.label}
							</button>
						))}
					</div>
				</div>
				<div className="p-6 md:p-8">
					{activeTab === 'achievement' && (
						<form onSubmit={handleAchievementSubmit} className="space-y-6">
							<h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Add Academic Achievement</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="md:col-span-2">
									<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-black-300">Title *</label>
									<input
										type="text"
										value={achievementForm.title}
										onChange={(e) => setAchievementForm({...achievementForm, title: e.target.value})}
										className="input"
										placeholder="e.g., Semester Topper, Math Olympiad Rank"
										required
									/>
								</div>
								<div className="md:col-span-2">
									<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-black-300">Description</label>
									<textarea
										value={achievementForm.description}
										onChange={(e) => setAchievementForm({...achievementForm, description: e.target.value})}
										className="input h-24 resize-none"
										placeholder="Details, recognition received, impact, etc."
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-black-300">Grade</label>
									<input
										type="text"
										value={achievementForm.grade}
										onChange={(e) => setAchievementForm({...achievementForm, grade: e.target.value})}
										className="input"
										placeholder="e.g., A+, 9.5 CGPA"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-black-300">Semester</label>
									<input
										type="text"
										value={achievementForm.semester}
										onChange={(e) => setAchievementForm({...achievementForm, semester: e.target.value})}
										className="input"
										placeholder="e.g., 3"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-black-300">Year</label>
									<input
										type="number"
										value={achievementForm.year}
										onChange={(e) => setAchievementForm({...achievementForm, year: e.target.value})}
										className="input"
										placeholder="e.g., 2024"
									/>
								</div>
								<div className="md:col-span-2">
									<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-black-300">Certificate URL</label>
									<input
										type="url"
										value={achievementForm.certificateUrl}
										onChange={(e) => setAchievementForm({ ...achievementForm, certificateUrl: e.target.value })}
										className="input"
										placeholder="Link to supporting certificate (optional)"
									/>
								</div>
						</div>
							<button
								type="submit"
								disabled={loading}
								className="btn-primary w-full py-3"
							>
								{loading ? 'Adding...' : 'Add Achievement'}
							</button>
					</form>
				)}

					{activeTab === 'project' && (
						<form onSubmit={handleProjectSubmit} className="space-y-6">
							<h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Add Project</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="md:col-span-2">
									<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-black-300">Title *</label>
									<input
										type="text"
										value={projectForm.title}
										onChange={(e) => setProjectForm({...projectForm, title: e.target.value})}
										className="input"
										placeholder="e.g., Campus Navigator App"
										required
									/>
								</div>
								<div className="md:col-span-2">
									<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-black-300">Description</label>
									<textarea
										value={projectForm.description}
										onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
										className="input h-24 resize-none"
										placeholder="Problem solved, key features, your contribution"
									/>
								</div>
								<div className="md:col-span-2">
									<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-black-300">Technologies (comma-separated)</label>
									<input
										type="text"
										value={projectForm.technologies}
										onChange={(e) => setProjectForm({...projectForm, technologies: e.target.value})}
										className="input"
										placeholder="React, Node.js, PostgreSQL"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-black-300">GitHub URL</label>
									<input
										type="url"
										value={projectForm.githubUrl}
										onChange={(e) => setProjectForm({...projectForm, githubUrl: e.target.value})}
										className="input"
										placeholder="Repository link"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-black-300">Live URL</label>
									<input
										type="url"
										value={projectForm.liveUrl}
										onChange={(e) => setProjectForm({...projectForm, liveUrl: e.target.value})}
										className="input"
										placeholder="Deployed app link"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-black-300">Start Date</label>
									<input
										type="date"
										value={projectForm.startDate}
										onChange={(e) => setProjectForm({...projectForm, startDate: e.target.value})}
										className="input"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-black-300">End Date</label>
									<input
										type="date"
										value={projectForm.endDate}
										onChange={(e) => setProjectForm({...projectForm, endDate: e.target.value})}
										className="input"
									/>
								</div>
						</div>
							<button
								type="submit"
								disabled={loading}
								className="btn-primary w-full py-3"
							>
								{loading ? 'Adding...' : 'Add Project'}
							</button>
					</form>
				)}

					{activeTab === 'activity' && (
						<form onSubmit={handleActivitySubmit} className="space-y-6">
							<h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Add Activity</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-black-300">Type *</label>
									<select
										value={activityForm.activityType}
										onChange={(e) => setActivityForm({ ...activityForm, activityType: e.target.value })}
										className="input"
										required
									>
										<option value="competition">Competition</option>
										<option value="volunteering">Volunteering</option>
										<option value="club">Club/Committee</option>
										<option value="workshop">Workshop/Seminar</option>
										<option value="sports">Sports</option>
										<option value="other">Other</option>
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-black-300">Title *</label>
									<input
										type="text"
										value={activityForm.title}
										onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
										className="input"
										required
									/>
								</div>
								<div className="md:col-span-2">
									<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-black-300">Description</label>
									<textarea
										value={activityForm.description}
										onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
										className="input h-24 resize-none"
										placeholder="What did you do? Achievements, responsibilities, outcomes..."
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-black-300">Organization</label>
									<input
										type="text"
										value={activityForm.organization}
										onChange={(e) => setActivityForm({ ...activityForm, organization: e.target.value })}
										className="input"
										placeholder="e.g., IEEE, NSS, College Sports Club"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-black-300">Position/Role</label>
									<input
										type="text"
										value={activityForm.position}
										onChange={(e) => setActivityForm({ ...activityForm, position: e.target.value })}
										className="input"
										placeholder="e.g., Coordinator, Participant, Winner"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-black-300">Start Date</label>
									<input
										type="date"
										value={activityForm.startDate}
										onChange={(e) => setActivityForm({ ...activityForm, startDate: e.target.value })}
										className="input"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-black-300">End Date</label>
									<input
										type="date"
										value={activityForm.endDate}
										onChange={(e) => setActivityForm({ ...activityForm, endDate: e.target.value })}
										className="input"
									/>
								</div>
								<div className="md:col-span-2">
									<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-black-300">Certificate URL</label>
									<input
										type="url"
										value={activityForm.certificateUrl}
										onChange={(e) => setActivityForm({ ...activityForm, certificateUrl: e.target.value })}
										className="input"
										placeholder="Link to certificate or proof (optional)"
									/>
								</div>
							</div>
							<button
								type="submit"
								disabled={loading}
								className="btn-primary w-full py-3"
							>
								{loading ? 'Adding...' : 'Add Activity'}
							</button>
						</form>
					)}

					{activeTab === 'skill' && (
						<form onSubmit={handleSkillSubmit} className="space-y-6">
							<h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Add Skill</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-black-300">Skill Name *</label>
									<input
										type="text"
										value={skillForm.skillName}
										onChange={(e) => setSkillForm({...skillForm, skillName: e.target.value})}
										className="input"
										placeholder="e.g., React, Data Structures, Figma"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-black-300">Proficiency Level</label>
									<select
										value={skillForm.proficiencyLevel}
										onChange={(e) => setSkillForm({...skillForm, proficiencyLevel: e.target.value})}
										className="input"
									>
										<option value="beginner">Beginner</option>
										<option value="intermediate">Intermediate</option>
										<option value="advanced">Advanced</option>
										<option value="expert">Expert</option>
									</select>
								</div>
								<div className="md:col-span-2">
									<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-black-300">Category</label>
									<input
										type="text"
										value={skillForm.category}
										onChange={(e) => setSkillForm({...skillForm, category: e.target.value})}
										className="input"
										placeholder="e.g., Programming, Design"
									/>
								</div>
						</div>
							<button
								type="submit"
								disabled={loading}
								className="btn-primary w-full py-3"
							>
								{loading ? 'Adding...' : 'Add Skill'}
							</button>
					</form>
				)}

					{activeTab === 'certificate' && (
						<form onSubmit={handleCertificateSubmit} className="space-y-6">
							<h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Upload Certificate</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="md:col-span-2">
									<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-black-300">Certificate File *</label>
									<input
										type="file"
										accept=".pdf,.jpg,.jpeg,.png"
										onChange={(e) => setCertificateForm({ ...certificateForm, file: e.target.files?.[0] || null })}
										className="input"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-black-300">Title</label>
									<input
										type="text"
										value={certificateForm.title}
										onChange={(e) => setCertificateForm({ ...certificateForm, title: e.target.value })}
										className="input"
										placeholder="e.g., Hackathon Winner, AWS Certified"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-black-300">Issuer</label>
									<input
										type="text"
										value={certificateForm.issuer}
										onChange={(e) => setCertificateForm({ ...certificateForm, issuer: e.target.value })}
										className="input"
										placeholder="e.g., IIT Bombay, Coursera, College"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-black-300">Issue Date</label>
									<input
										type="date"
										value={certificateForm.issueDate}
										onChange={(e) => setCertificateForm({ ...certificateForm, issueDate: e.target.value })}
										className="input"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-black-300">Type</label>
									<input
										type="text"
										value={certificateForm.certificateType}
										onChange={(e) => setCertificateForm({ ...certificateForm, certificateType: e.target.value })}
										className="input"
										placeholder="e.g., Participation, Merit, Completion"
									/>
								</div>
								<div className="md:col-span-2">
									<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-black-300">Related Link</label>
									<input
										type="url"
										value={certificateForm.relatedLink}
										onChange={(e) => setCertificateForm({ ...certificateForm, relatedLink: e.target.value })}
										className="input"
										placeholder="e.g., Event page, verification link"
									/>
								</div>
								<div className="md:col-span-2">
									<label className="block text-sm font-medium mb-2 text-gray-700 dark:text-black-300">Notes</label>
									<textarea
										value={certificateForm.description}
										onChange={(e) => setCertificateForm({ ...certificateForm, description: e.target.value })}
										className="input h-24 resize-none"
										placeholder="Optional notes"
									/>
								</div>
							</div>
							<button
								type="submit"
								disabled={loading || !certificateForm.file}
								className="btn-primary w-full py-3"
							>
								{loading ? 'Uploading...' : 'Upload Certificate'}
							</button>
						</form>
					)}
			</div>
			</div>
		</div>
	</div>
	)
}
