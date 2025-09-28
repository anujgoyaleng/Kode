import { useEffect, useState } from 'react'
import api from '@/api/client'

export default function AnalyticsPage() {
	const [overview, setOverview] = useState(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)

	useEffect(() => {
		(async () => {
			try {
				const res = await api.get('/analytics/overview')
				setOverview(res.data.data.overview)
			} catch (e) {
				setError('Failed to load analytics')
			} finally {
				setLoading(false)
			}
		})()
	}, [])

	if (loading) return (
		<div className="min-h-screen bg-gray-50 dark:bg-pureblack flex items-center justify-center">
			<div className="text-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
				<p className="text-gray-600 dark:text-black-400">Loading analytics...</p>
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
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Overview</h1>
					<p className="text-gray-600 dark:text-black-400 mt-1">Comprehensive insights into your institution's performance</p>
				</div>
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="card p-6">
					<h2 className="font-semibold text-xl text-gray-900 dark:text-white mb-4">Totals</h2>
					<div className="space-y-3">
						<div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black-800 rounded-lg">
							<span className="text-gray-700 dark:text-black-300">Students</span>
							<span className="font-semibold text-gray-900 dark:text-white">{overview?.totalStudents || 0}</span>
						</div>
						<div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black-800 rounded-lg">
							<span className="text-gray-700 dark:text-black-300">Achievements</span>
							<span className="font-semibold text-gray-900 dark:text-white">{overview?.totalAchievements || 0}</span>
						</div>
						<div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black-800 rounded-lg">
							<span className="text-gray-700 dark:text-black-300">Activities</span>
							<span className="font-semibold text-gray-900 dark:text-white">{overview?.totalActivities || 0}</span>
						</div>
						<div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black-800 rounded-lg">
							<span className="text-gray-700 dark:text-black-300">Projects</span>
							<span className="font-semibold text-gray-900 dark:text-white">{overview?.totalProjects || 0}</span>
						</div>
					</div>
				</div>
				<div className="card p-6">
					<h2 className="font-semibold text-xl text-gray-900 dark:text-white mb-4">Departments</h2>
					<div className="space-y-3">
						{overview?.departmentDistribution?.map(d => (
							<div key={d.department} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black-800 rounded-lg">
								<span className="text-gray-700 dark:text-black-300">{d.department}</span>
								<span className="font-semibold text-gray-900 dark:text-white">{d.studentCount} students</span>
							</div>
						)) || (
							<div className="text-center py-8 text-gray-500 dark:text-black-400">
								<span className="text-4xl mb-2 block">📊</span>
								No department data available
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	</div>
)
}


