import { Route, Routes, Navigate } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import StudentDashboard from '@/pages/StudentDashboard'
import FacultyDashboard from '@/pages/FacultyDashboard'
import AdminDashboard from '@/pages/AdminDashboard'
import FacultyAttendancePage from '@/pages/FacultyAttendancePage'
import FacultyMyStudents from '@/pages/FacultyMyStudents'
import AnalyticsPage from '@/pages/AnalyticsPage'
import UploadPage from '@/pages/UploadPage'
import ProfilePage from '@/pages/ProfilePage'
import VerificationsPage from '@/pages/VerificationsPage'
import AdminUsersPage from '@/pages/AdminUsersPage'
import AdminStudentsPage from '@/pages/AdminStudentsPage'
import AdminAssignmentsPage from '@/pages/AdminAssignmentsPage'
import AttendanceDashboard from '@/pages/AttendanceDashboard'
import AchievementsPage from '@/pages/AchievementsPage'
// Optional pages were referenced but not implemented; removed for now
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import Navbar from '@/components/Navbar'

function ProtectedRoute({ children, roles }) {
	const { user } = useAuth()
	if (!user) return <Navigate to="/login" replace />
	if (roles && !roles.includes(user.role)) return <Navigate to={user.role === 'student' ? '/student' : '/faculty'} replace />
	return children
}

function LoginRedirect({ children }) {
	const { user } = useAuth()
	if (user) {
		return <Navigate to={user.role === 'student' ? '/student' : (user.role === 'admin' ? '/admin' : '/faculty')} replace />
	}
	return children
}

export default function App() {
	return (
		<ThemeProvider>
			<AuthProvider>
				<div className="min-h-screen bg-white dark:bg-pureblack app-container">
					<Navbar />
					<Routes>
					<Route path="/login" element={<LoginRedirect><LoginPage /></LoginRedirect>} />
					<Route path="/register" element={<RegisterPage />} />
					<Route path="/student" element={<ProtectedRoute roles={["student"]}><div className="pt-14"><StudentDashboard /></div></ProtectedRoute>} />
					<Route path="/faculty" element={<ProtectedRoute roles={["faculty"]}><div className="pt-14"><FacultyDashboard /></div></ProtectedRoute>} />
					<Route path="/faculty/attendance" element={<ProtectedRoute roles={["faculty", "admin"]}><div className="pt-14"><FacultyAttendancePage /></div></ProtectedRoute>} />
					<Route path="/faculty/my-students" element={<ProtectedRoute roles={["faculty", "admin"]}><div className="pt-14"><FacultyMyStudents /></div></ProtectedRoute>} />
					<Route path="/analytics" element={<ProtectedRoute roles={["student", "faculty", "admin"]}><div className="pt-14"><AnalyticsPage /></div></ProtectedRoute>} />
                    <Route path="/attendance-dashboard" element={<ProtectedRoute roles={["student", "admin", "faculty"]}><div className="pt-14"><AttendanceDashboard /></div></ProtectedRoute>} />
                    <Route path="/achievements" element={<ProtectedRoute roles={["student"]}><div className="pt-14"><AchievementsPage /></div></ProtectedRoute>} />
					<Route path="/verifications" element={<ProtectedRoute roles={["faculty"]}><div className="pt-14"><VerificationsPage /></div></ProtectedRoute>} />
					<Route path="/admin" element={<ProtectedRoute roles={["admin"]}><div className="pt-14"><AdminDashboard /></div></ProtectedRoute>} />
					<Route path="/admin/users" element={<ProtectedRoute roles={["admin"]}><div className="pt-14"><AdminUsersPage /></div></ProtectedRoute>} />
					<Route path="/admin/students" element={<ProtectedRoute roles={["admin"]}><div className="pt-14"><AdminStudentsPage /></div></ProtectedRoute>} />
					<Route path="/admin/assignments" element={<ProtectedRoute roles={["admin"]}><div className="pt-14"><AdminAssignmentsPage /></div></ProtectedRoute>} />
					<Route path="/upload" element={<ProtectedRoute roles={["student"]}><div className="pt-14"><UploadPage /></div></ProtectedRoute>} />
					<Route path="/profile" element={<ProtectedRoute roles={["student"]}><div className="pt-14"><ProfilePage /></div></ProtectedRoute>} />
					<Route path="/" element={<Navigate to="/login" replace />} />
					</Routes>
				</div>
			</AuthProvider>
		</ThemeProvider>
	)
}
