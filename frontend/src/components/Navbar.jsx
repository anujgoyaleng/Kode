import { Link } from 'react-router-dom'
import { useEffect, useRef, useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
const { user, logout } = useAuth()
const [notifOpen, setNotifOpen] = useState(false)
const [menuOpen, setMenuOpen] = useState(false)
const notifRef = useRef(null)
const menuRef = useRef(null)
const [remainingSeconds, setRemainingSeconds] = useState(300)
const lastActivityRef = useRef(Date.now())
const [showTimer, setShowTimer] = useState(false)
const showTimeoutRef = useRef(null)

useEffect(() => {
	const onDocClick = (e) => {
		if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
		if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
	}
	document.addEventListener('click', onDocClick)
	return () => document.removeEventListener('click', onDocClick)
}, [])

// Inactivity timer: auto-logout after 5 minutes of no mouse move or click
useEffect(() => {
    if (!user) return

    const scheduleShowTimer = () => {
        if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current)
        showTimeoutRef.current = setTimeout(() => setShowTimer(true), 2000)
    }

    const resetActivity = () => {
        lastActivityRef.current = Date.now()
        setRemainingSeconds(300)
        setShowTimer(false)
        scheduleShowTimer()
    }

    const onMouseMove = resetActivity
    const onClick = resetActivity

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('click', onClick)

    // Start the delayed visibility timer on mount
    scheduleShowTimer()

    const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - lastActivityRef.current) / 1000)
        const remaining = Math.max(0, 300 - elapsed)
        setRemainingSeconds(remaining)
        if (remaining <= 0) {
            clearInterval(interval)
            if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current)
            document.removeEventListener('mousemove', onMouseMove)
            document.removeEventListener('click', onClick)
            logout()
        }
    }, 1000)

    return () => {
        clearInterval(interval)
        if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current)
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('click', onClick)
    }
}, [user, logout])

const mmss = useMemo(() => {
    const m = Math.floor(remainingSeconds / 60).toString().padStart(2, '0')
    const s = (remainingSeconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
}, [remainingSeconds])
	return (
		<nav className="fixed top-0 left-0 right-0 z-50 w-full border-b border-gray-200/50 dark:border-black-700/50 bg-white/80 dark:bg-black-900/80 backdrop-blur-md shadow-sm dark:shadow-2xl">
			<div className="w-full flex items-center justify-between pl-2 md:pl-4 pr-2 h-14">
				<div className="flex items-center gap-3 py-3 mr-auto">
					<Link to="/" className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-accent-400 transition-colors">Pragati</Link>
					{user?.role === 'student' && <Link to="/student" className="text-sm text-gray-600 dark:text-black-400 hover:text-primary-600 dark:hover:text-accent-400 transition-colors">Dashboard</Link>}
					{user?.role === 'student' && <Link to="/attendance-dashboard" className="text-sm text-gray-600 dark:text-black-400 hover:text-primary-600 dark:hover:text-accent-400 transition-colors">My Attendance</Link>}
					{(user?.role === 'faculty' || user?.role === 'admin') && <>
						{user?.role === 'faculty' && <Link to="/faculty" className="text-sm hidden md:inline-block text-gray-600 dark:text-black-400 hover:text-primary-600 dark:hover:text-accent-400 transition-colors">Dashboard</Link>}
						{user?.role === 'admin' && <Link to="/admin" className="text-sm hidden md:inline-block text-gray-600 dark:text-black-400 hover:text-primary-600 dark:hover:text-accent-400 transition-colors">Dashboard</Link>}
						{user?.role === 'faculty' && <Link to="/faculty/my-students" className="text-sm hidden md:inline-block text-gray-600 dark:text-black-400 hover:text-primary-600 dark:hover:text-accent-400 transition-colors">My Students</Link>}
						{user?.role === 'faculty' && <Link to="/faculty/attendance" className="text-sm hidden md:inline-block text-gray-600 dark:text-black-400 hover:text-primary-600 dark:hover:text-accent-400 transition-colors">Attendance</Link>}
						{user?.role === 'faculty' && <Link to="/verifications" className="text-sm hidden md:inline-block text-gray-600 dark:text-black-400 hover:text-primary-600 dark:hover:text-accent-400 transition-colors">Approvals</Link>}
						<Link to="/analytics" className="text-sm hidden md:inline-block text-gray-600 dark:text-black-400 hover:text-primary-600 dark:hover:text-accent-400 transition-colors">Analytics</Link>
						{user?.role === 'admin' && <Link to="/admin/assignments" className="text-sm hidden md:inline-block text-gray-600 dark:text-black-400 hover:text-primary-600 dark:hover:text-accent-400 transition-colors">Enrollments</Link>}
						{user?.role === 'admin' && <Link to="/admin/users" className="text-sm hidden md:inline-block text-gray-600 dark:text-black-400 hover:text-primary-600 dark:hover:text-accent-400 transition-colors">Users</Link>}
					</>}
				</div>
				<div className="relative flex items-center gap-3 py-2 md:py-0 ml-auto">
					{user?.role === 'student' && (	
						<Link to="/upload?tab=achievement" className="hidden md:inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg px-3 py-1.5 transition-all duration-200 shadow-sm hover:shadow-md dark:hover:shadow-primary-500/25">
							<span>➕</span>
							<span>Add Achievement</span>
						</Link>
					)}
                    <div className="hidden md:flex items-center gap-2 relative">
                        <ThemeToggle size="sm" />
                        <div className="relative">
                            <button ref={notifRef} onClick={(e) => { e.stopPropagation(); setNotifOpen(o => !o); setMenuOpen(false) }} className="text-lg text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="Notifications">🔔</button>
                            {notifOpen && (
                                <div className="navbar-dropdown absolute right-0 top-10 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg dark:shadow-2xl p-3 text-sm z-50 dark:backdrop-blur-md">
                                    <div className="font-semibold mb-1 text-gray-900 dark:text-white">Notifications</div>
                                    <div className="text-gray-600 dark:text-gray-300">No notifications for you. Have a great day! ✨</div>
                                </div>
                            )}
                        </div>
                        {user && showTimer && (
                            <span className="text-xs text-gray-500 dark:text-gray-500" title="Auto-logout countdown">{mmss}</span>
                        )}
                    </div>
					{user ? (
						<>
							<div className="hidden md:flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-600 relative">
								<div className="h-7 w-7 rounded-full bg-primary-100 dark:bg-accent-900 text-primary-700 dark:text-accent-300 flex items-center justify-center text-xs font-medium">{(user.firstName?.[0]||'').toUpperCase()}{(user.lastName?.[0]||'').toUpperCase()}</div>
								<div className="relative">
									<button ref={menuRef} onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o); setNotifOpen(false) }} className="text-sm whitespace-nowrap inline-flex items-center gap-1 pr-2.5 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
										<span>{user.firstName} {user.lastName}</span>
										<span className="text-[0.7em]">▼</span>
									</button>
									{menuOpen && (
										<div className="navbar-dropdown absolute right-0 top-10 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg dark:shadow-2xl py-1 z-50 dark:backdrop-blur-md">
											<Link to={user?.role === 'student' ? '/student' : (user?.role === 'admin' ? '/admin' : '/faculty')} className="navbar-dropdown-item block px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors">Dashboard</Link>
											{
												user.role !== 'admin' && (<Link to="/analytics" className="navbar-dropdown-item block px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors">Analytics</Link>)
											}
											<Link to="/profile" className="navbar-dropdown-item block px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors">Profile</Link>
											
											<button onClick={logout} className="navbar-dropdown-item block w-full text-left px-3 py-2 text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Logout</button>
										</div>
									)}
								</div>
							</div>
						</>
					) : (
						<Link to="/login" className="text-sm text-gray-600 dark:text-black-400 hover:text-primary-600 dark:hover:text-accent-400 transition-colors">Login</Link>
					)}
				</div>
			</div>
		</nav>
	)
}


