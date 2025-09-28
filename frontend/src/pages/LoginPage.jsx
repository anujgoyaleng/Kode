import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/api/client'

export default function LoginPage() {
	const { login } = useAuth()
	const navigate = useNavigate()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [role, setRole] = useState('student')
	const [phase, setPhase] = useState('identify') // identify -> password
	const [greetingName, setGreetingName] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState(null)

	const onSubmit = async (e) => {
		e.preventDefault()
		setError(null)
		setLoading(true)
		try {
			if (phase === 'identify') {
				const res = await api.get('/auth/lookup', { params: { email } })
				setGreetingName(`${res.data.data.firstName} ${res.data.data.lastName}`.trim())
				setRole(res.data.data.role)
				setPhase('password')
			} else {
				const u = await login(email, password)
				if (u.role !== role) {
					setError(`Role mismatch. You logged in as ${u.role}.`)
					return
				}
				if (u.role === 'student') navigate('/student', { replace: true })
				else if (u.role === 'admin') navigate('/admin', { replace: true })
				else navigate('/faculty', { replace: true })
			}
		} catch (err) {
			setError(err?.response?.data?.message || 'Login failed')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-pureblack">
			<div className="w-full max-w-sm">
				<form onSubmit={onSubmit} className="card p-8 space-y-6">
					<div className="text-center">
						<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h1>
						<p className="text-gray-600 dark:text-black-400">Sign in to your account</p>
					</div>
					
					{error && (
						<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm p-3 rounded-lg">
							{error}
						</div>
					)}
					
					{phase === 'identify' && (
						<>
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-black-300 mb-2">Role</label>
									<select 
										className="input" 
										value={role} 
										onChange={(e) => setRole(e.target.value)}
									>
										<option value="student">Student</option>
										<option value="faculty">Faculty</option>
										<option value="admin">Admin</option>
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-black-300 mb-2">Email</label>
									<input 
										className="input" 
										type="email" 
										value={email} 
										onChange={(e) => setEmail(e.target.value)} 
										required 
										placeholder="Enter your email"
									/>
								</div>
							</div>
							<button 
								className="btn-primary w-full" 
								disabled={loading}
							>
								{loading ? 'Next...' : 'Next'}
							</button>
						</>
					)}
					
					{phase === 'password' && (
						<>
							<div className="text-center">
								<div className="text-sm text-gray-600 dark:text-black-400 mb-4">
									Hi <span className="font-medium text-gray-900 dark:text-white">{greetingName || 'there'}</span>, please enter your password.
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-black-300 mb-2">Password</label>
								<input 
									className="input" 
									type="password" 
									value={password} 
									onChange={(e) => setPassword(e.target.value)} 
									required 
									placeholder="Enter your password"
								/>
							</div>
							<button 
								className="btn-primary w-full" 
								disabled={loading}
							>
								{loading ? 'Logging in...' : 'Login'}
							</button>
							<button 
								type="button" 
								onClick={() => setPhase('identify')} 
								className="text-sm text-gray-600 dark:text-black-400 hover:text-primary-600 dark:hover:text-accent-400 underline transition-colors"
							>
								Change email
							</button>
						</>
					)}
					
					<div className="text-sm text-center text-gray-600 dark:text-black-400">
						No account? <Link to="/register" className="text-primary-600 dark:text-accent-400 hover:text-primary-700 dark:hover:text-accent-300 font-medium transition-colors">Register</Link>
					</div>
				</form>
			</div>
		</div>
	)
}


