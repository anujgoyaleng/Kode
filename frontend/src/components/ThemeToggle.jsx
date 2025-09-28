import { useTheme } from '@/contexts/ThemeContext'

export default function ThemeToggle({ className = '', size = 'md' }) {
	const { theme, actualTheme, toggleTheme, isDark, isSystem } = useTheme()

	const sizeClasses = {
		sm: 'w-8 h-8 text-sm',
		md: 'w-10 h-10 text-base',
		lg: 'w-12 h-12 text-lg'
	}

	const getIcon = () => {
		if (isSystem) {
			return (
				<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
				</svg>
			)
		}
		
		if (isDark) {
			return (
				<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
				</svg>
			)
		}
		
		return (
			<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
			</svg>
		)
	}

	const getTooltip = () => {
		if (isSystem) return 'System theme (click to switch to light)'
		if (isDark) return 'Dark theme (click to switch to system)'
		return 'Light theme (click to switch to dark)'
	}

	return (
		<button
			onClick={toggleTheme}
			className={`
				${sizeClasses[size]}
				${className}
				relative flex items-center justify-center
				bg-gray-100 hover:bg-gray-200 dark:bg-black-800 dark:hover:bg-black-700
				text-gray-700 dark:text-white
				rounded-lg border border-gray-200 dark:border-black-600
				transition-all duration-200 ease-in-out
				hover:scale-105 active:scale-95
				shadow-sm hover:shadow-md dark:hover:shadow-2xl
				focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-black-800
			`}
			title={getTooltip()}
			aria-label={`Switch theme. Current: ${actualTheme}`}
		>
			{getIcon()}
			
			{/* Theme indicator dot */}
			<div className={`
				absolute -top-1 -right-1 w-3 h-3 rounded-full
				${isSystem ? 'bg-blue-500' : isDark ? 'bg-white' : 'bg-yellow-500'}
				border-2 border-white dark:border-black-800
			`} />
		</button>
	)
}

// Alternative dropdown theme selector
export function ThemeSelector({ className = '' }) {
	const { theme, actualTheme, setThemeMode, isDark, isSystem } = useTheme()

	const themes = [
		{ value: 'light', label: 'Light', icon: '☀️' },
		{ value: 'dark', label: 'Dark', icon: '🌙' },
		{ value: 'system', label: 'System', icon: '💻' }
	]

	return (
		<div className={`relative ${className}`}>
			<select
				value={theme}
				onChange={(e) => setThemeMode(e.target.value)}
				className="
					appearance-none bg-white dark:bg-black-800/50
					border border-gray-200 dark:border-black-600
					text-gray-700 dark:text-white
					rounded-lg px-3 py-2 pr-8
					focus:outline-none focus:ring-2 focus:ring-primary-500
					transition-all duration-200 dark:backdrop-blur-sm
				"
			>
				{themes.map(({ value, label, icon }) => (
					<option key={value} value={value}>
						{icon} {label}
					</option>
				))}
			</select>
			<div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
				<svg className="w-4 h-4 text-gray-400 dark:text-black-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
				</svg>
			</div>
		</div>
	)
}
