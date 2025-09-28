import { Link, useLocation } from 'react-router-dom'

const items = [
	{ to: '/student', label: 'Home', icon: '🏠' },
	{ to: '/upload', label: 'Add', icon: '➕' },
	{ to: '/analytics', label: 'Analytics', icon: '📊' },
	{ to: '/profile', label: 'Profile', icon: '👤' }
]

export default function BottomNav() {
	const location = useLocation()
	return (
		<nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 dark:border-black-700 bg-white/80 dark:bg-black-900/80 md:hidden shadow-lg dark:shadow-2xl backdrop-blur-md">
			<div className="max-w-xl mx-auto grid grid-cols-4 text-center py-2">
				{items.map(i => (
					<Link 
						key={i.to} 
						to={i.to} 
						className={`flex flex-col items-center text-xs py-2 transition-all duration-200 ${
							location.pathname === i.to 
								? 'text-primary-600 dark:text-accent-400' 
								: 'text-gray-500 dark:text-black-400 hover:text-primary-600 dark:hover:text-accent-400'
						}`}
					>
						<span className="text-xl mb-1">{i.icon}</span>
						{i.label}
					</Link>
				))}
			</div>
		</nav>
	)
}



