export default function StatCard({ label, value, sub }) {
	return (
		<div className="stat-card flex-1 min-w-[140px] border border-gray-200 dark:border-black-700 rounded-xl p-4 bg-white dark:bg-black-900/80 dark:backdrop-blur-md shadow-sm dark:shadow-2xl">
			<div className="text-gray-600 dark:text-black-400 text-sm font-medium">{label}</div>
			<div className="flex items-end gap-2 mt-1">
				<div className="text-xl font-semibold text-gray-900 dark:text-white">{value}</div>
				{sub && <div className="text-gray-500 dark:text-black-400 text-sm">{sub}</div>}
			</div>
		</div>
	)
}



