import { useEffect, useState } from 'react'
import api from '@/api/client'

export default function AdminDashboard() {
	const [overview, setOverview] = useState(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)

	useEffect(() => {
		(async () => {
			try {
				const res = await api.get('/analytics/overview')
				setOverview(res.data.data.overview)
			} catch (e) {
				setError('Failed to load admin dashboard')
			} finally {
				setLoading(false)
			}
		})()
	}, [])

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

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-pureblack w-full px-4 md:px-8">
			<div className="py-6 max-w-7xl mx-auto space-y-8">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
						<p className="text-gray-600 dark:text-black-400 mt-1">Overview of your institution's performance</p>
					</div>
				</div>
				
				{/* Stats Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<div className="card p-6 hover:shadow-lg transition-shadow duration-200">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600 dark:text-black-400">Active Students</p>
								<p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{overview?.totalStudents ?? '-'}</p>
							</div>
							<div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
								<span className="text-2xl">👥</span>
							</div>
						</div>
					</div>
					
					<div className="card p-6 hover:shadow-lg transition-shadow duration-200">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600 dark:text-black-400">Achievements</p>
								<p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{overview?.totalAchievements ?? '-'}</p>
							</div>
							<div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
								<span className="text-2xl">🏆</span>
							</div>
						</div>
					</div>
					
					<div className="card p-6 hover:shadow-lg transition-shadow duration-200">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600 dark:text-black-400">Activities</p>
								<p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{overview?.totalActivities ?? '-'}</p>
							</div>
							<div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
								<span className="text-2xl">🎯</span>
							</div>
						</div>
					</div>
					
					<div className="card p-6 hover:shadow-lg transition-shadow duration-200">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600 dark:text-black-400">Projects</p>
								<p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{overview?.totalProjects ?? '-'}</p>
							</div>
							<div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
								<span className="text-2xl">🚀</span>
							</div>
						</div>
					</div>
				</div>

				{/* Charts and Lists */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<div className="card p-6">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-xl font-semibold text-gray-900 dark:text-white">Top Departments</h2>
							<a href="/admin/users" className="text-sm text-primary-600 dark:text-accent-400 hover:text-primary-700 dark:hover:text-accent-300 font-medium transition-colors">Manage Users →</a>
						</div>
						<div className="space-y-3">
							{overview?.departmentDistribution?.map((d, index) => (
								<div key={d.department} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black-800 rounded-lg">
									<div className="flex items-center gap-3">
										<div className="h-8 w-8 bg-primary-100 dark:bg-accent-900/30 rounded-full flex items-center justify-center text-sm font-medium text-primary-700 dark:text-accent-300">
											{index + 1}
										</div>
										<span className="font-medium text-gray-900 dark:text-white">{d.department}</span>
									</div>
									<span className="text-sm font-medium text-gray-600 dark:text-black-400">{d.studentCount} students</span>
								</div>
							)) || (
								<div className="text-center py-8 text-gray-500 dark:text-black-400">
									<span className="text-4xl mb-2 block">📊</span>
									No data available
								</div>
							)}
						</div>
					</div>
					
					<div className="card p-6">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-xl font-semibold text-gray-900 dark:text-white">Batches</h2>
							<a href="/admin/assignments" className="text-sm text-primary-600 dark:text-accent-400 hover:text-primary-700 dark:hover:text-accent-300 font-medium transition-colors">Enrollments →</a>
						</div>
						<div className="space-y-3">
							{overview?.batchDistribution?.map((b, index) => (
								<div key={b.batch} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black-800 rounded-lg">
									<div className="flex items-center gap-3">
										<div className="h-8 w-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-sm font-medium text-green-700 dark:text-green-300">
											{index + 1}
										</div>
										<span className="font-medium text-gray-900 dark:text-white">{b.batch}</span>
									</div>
									<span className="text-sm font-medium text-gray-600 dark:text-black-400">{b.studentCount} students</span>
								</div>
							)) || (
								<div className="text-center py-8 text-gray-500 dark:text-black-400">
									<span className="text-4xl mb-2 block">📈</span>
									No data available
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}


