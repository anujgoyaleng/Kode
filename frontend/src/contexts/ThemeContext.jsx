import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(undefined)

export function ThemeProvider({ children }) {
	const [theme, setTheme] = useState(() => {
		// Check localStorage first, then default to dark for black theme
		const savedTheme = localStorage.getItem('theme')
		if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
			return savedTheme
		}
		return 'dark' // Default to dark theme for black UI
	})

	const [systemTheme, setSystemTheme] = useState(() => {
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
	})

	// Listen for system theme changes
	useEffect(() => {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
		
		const handleChange = (e) => {
			setSystemTheme(e.matches ? 'dark' : 'light')
		}

		mediaQuery.addEventListener('change', handleChange)
		return () => mediaQuery.removeEventListener('change', handleChange)
	}, [])

	// Save theme to localStorage
	useEffect(() => {
		localStorage.setItem('theme', theme)
	}, [theme])

	// Apply theme to document
	useEffect(() => {
		const root = document.documentElement
		const actualTheme = theme === 'system' ? systemTheme : theme
		
		root.classList.remove('light', 'dark')
		root.classList.add(actualTheme)
		root.setAttribute('data-theme', actualTheme)
	}, [theme, systemTheme])

	const toggleTheme = () => {
		setTheme(prev => {
			if (prev === 'light') return 'dark'
			if (prev === 'dark') return 'system'
			return 'light'
		})
	}

	const setThemeMode = (newTheme) => {
		if (['light', 'dark', 'system'].includes(newTheme)) {
			setTheme(newTheme)
		}
	}

	const actualTheme = useMemo(() => {
		return theme === 'system' ? systemTheme : theme
	}, [theme, systemTheme])

	const value = useMemo(() => ({
		theme,
		actualTheme,
		systemTheme,
		toggleTheme,
		setThemeMode,
		isDark: actualTheme === 'dark',
		isLight: actualTheme === 'light',
		isSystem: theme === 'system'
	}), [theme, actualTheme, systemTheme])

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
	const ctx = useContext(ThemeContext)
	if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
	return ctx
}
