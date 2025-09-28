export default function Tile({ icon, title, subtitle }) {
	return (
		<div className="border border-gray-200 dark:border-black-700 rounded-2xl p-5 bg-white dark:bg-black-900/80 text-center flex flex-col items-center gap-2 hover:shadow-sm dark:hover:shadow-2xl transition-all duration-200 hover:scale-105 dark:backdrop-blur-md">
			<div className="text-3xl text-gray-400 dark:text-black-500">{icon}</div>
			<div className="text-sm font-semibold text-gray-900 dark:text-white">{title}</div>
			{subtitle && <div className="text-xs text-gray-500 dark:text-black-400">{subtitle}</div>}
		</div>
	)
}



