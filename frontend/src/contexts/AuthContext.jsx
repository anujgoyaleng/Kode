import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '@/api/client'

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null)
	const [token, setToken] = useState(() => localStorage.getItem('token'))
	const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refreshToken'))

	useEffect(() => {
		if (token) localStorage.setItem('token', token); else localStorage.removeItem('token')
		if (refreshToken) localStorage.setItem('refreshToken', refreshToken); else localStorage.removeItem('refreshToken')
	}, [token, refreshToken])

	useEffect(() => {
		(async () => {
			if (!token) return
			try {
				const res = await api.get('/auth/me')
				const u = res.data.data.user
				setUser({ id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role, studentId: u.studentId ?? null })
			} catch (e) {
				setUser(null); setToken(null); setRefreshToken(null)
			}
		})()
	}, [])

	// Handle logout on tab closure (but not on page reload)
	useEffect(() => {
		if (!token) return

		// Check if this is a page reload on mount
		const isReload = () => {
			try {
				const nav = performance.getEntriesByType('navigation')[0]
				return nav && nav.type === 'reload'
			} catch (e) {
				return false
			}
		}

		// If this is a reload, don't set up logout handlers
		if (isReload()) {
			return
		}

		const handleBeforeUnload = (event) => {
			// Use fetch with keepalive for reliable logout call
			const logoutUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/logout`
			fetch(logoutUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				keepalive: true,
				body: JSON.stringify({})
			}).catch(() => {
				// Ignore errors as the page is closing
			})
			
			// Clear local storage
			localStorage.removeItem('token')
			localStorage.removeItem('refreshToken')
		}

		const handlePageHide = (event) => {
			// Only logout if the page is being hidden permanently
			if (event.persisted === false) {
				// Additional logout call for pagehide as backup
				const logoutUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/logout`
				fetch(logoutUrl, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`
					},
					keepalive: true,
					body: JSON.stringify({})
				}).catch(() => {
					// Ignore errors
				})
			}
		}

		// Add event listeners
		window.addEventListener('beforeunload', handleBeforeUnload)
		window.addEventListener('pagehide', handlePageHide)

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload)
			window.removeEventListener('pagehide', handlePageHide)
		}
	}, [token])

	const login = async (email, password) => {
		const res = await api.post('/auth/login', { email, password })
		const { token, refreshToken, user } = res.data.data
		setToken(token); setRefreshToken(refreshToken)
		const userObj = { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, studentId: user.studentId ?? null }
		setUser(userObj)
		return userObj
	}

	const logout = async () => {
		try {
			// Call logout API to invalidate session on server
			if (token) {
				await api.post('/auth/logout')
			}
		} catch (error) {
			// Even if API call fails, we should still clear local state
			console.warn('Logout API call failed:', error)
		} finally {
			// Always clear local state
			setUser(null)
			setToken(null)
			setRefreshToken(null)
		}
	}

	const updateUser = (partial) => setUser(prev => ({ ...(prev || {}), ...(partial || {}) }))

	const value = useMemo(() => ({ user, token, login, logout, updateUser }), [user, token])

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
	const ctx = useContext(AuthContext)
	if (!ctx) throw new Error('useAuth must be used within AuthProvider')
	return ctx
}


