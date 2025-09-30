import { useEffect, useState } from 'react'
import api from '@/api/client'

export default function VerificationsPage() {
	const [items, setItems] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)

	useEffect(() => {
		(async () => {
			try {
				const res = await api.get('/faculty/verifications?limit=20')
				setItems(res.data.data.verifications)
			} catch (e) {
				setError('Failed to load verifications')
			} finally {
				setLoading(false)
			}
		})()
	}, [])

	const act = async (item, isVerified) => {
		await api.put(`/faculty/verify/${item.type}/${item.id}`, { isVerified })
		setItems(prev => prev.filter(v => !(v.type === item.type && v.id === item.id)))
	}

	if (loading) return (
		<div className="min-h-screen bg-gray-50 dark:bg-pureblack flex items-center justify-center">
			<div className="text-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
				<p className="text-gray-600 dark:text-black-400">Loading approvals...</p>
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
						<h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pending Verifications</h1>
						<p className="text-gray-600 dark:text-black-400 mt-1">Review and approve student submissions</p>
					</div>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{items.length>0 ? items.map(item => (
						<div key={`${item.type}-${item.id}`} className="card p-6 hover:shadow-lg transition-shadow duration-200">
							<div className="flex items-center justify-between mb-3">
								<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-accent-900/30 text-primary-700 dark:text-accent-300">
									{item.type}
								</span>
							</div>
                            <div className="font-semibold text-lg text-gray-900 dark:text-white mb-1">{item.title || item.filename}</div>
                            {item.type === 'certificate' && item.fileUrl && (
                                <div className="mb-3">
                                    <img 
                                        src={item.fileUrl} 
                                        alt={item.originalName || 'Certificate'} 
                                        className="w-full max-h-64 object-contain rounded border border-gray-200 dark:border-black-700 bg-white dark:bg-black-900"
                                        loading="lazy"
                                    />
                                </div>
                            )}
                            {item.student && (
                                <div className="text-xs text-gray-600 dark:text-black-400 mb-3">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Student:</span>
                                    {' '}{item.student.firstName} {item.student.lastName} • Roll: {item.student.rollNumber}{item.student.section ? ` • Section: ${item.student.section}` : ''}
                                </div>
                            )}
							{item.description && (
								<div className="text-sm text-gray-600 dark:text-black-400 mb-4">{item.description}</div>
							)}
							<div className="flex gap-3">
								<button onClick={() => act(item, true)} className="btn-primary text-sm bg-green-600 hover:bg-green-700 flex-1">
									✓ Approve
								</button>
								<button onClick={() => act(item, false)} className="btn-danger text-sm flex-1">
									✗ Reject
								</button>
							</div>
						</div>
					)) : (
						<div className="col-span-full text-center py-16">
							<div className="text-6xl mb-4">✅</div>
							<h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">All Caught Up!</h3>
							<p className="text-gray-600 dark:text-black-400">No pending approvals at the moment</p>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}



