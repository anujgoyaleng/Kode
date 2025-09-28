import { Link } from 'react-router-dom'

export default function TopBar() {
	return (
		<header className="sticky top-0 z-10 bg-white/90 dark:bg-black-900/90 backdrop-blur border-b border-gray-200 dark:border-black-700 w-full">
			<div className="w-full px-4 md:px-8 h-12 flex items-center justify-end">
				<Link to="/notifications" className="text-xl text-gray-600 dark:text-black-400 hover:text-primary-600 dark:hover:text-accent-400 transition-colors" title="Notifications">🔔</Link>
			</div>
		</header>
	)
}


