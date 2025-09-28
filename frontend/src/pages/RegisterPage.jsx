import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '@/api/client'

export default function RegisterPage() {
	const navigate = useNavigate()
	const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'student', phone: '', department: '', batch: '' })
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState(null)

	const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

	const onSubmit = async (e) => {
		e.preventDefault()
		setError(null); setLoading(true)
		try {
			await api.post('/auth/register', form)
			navigate('/login', { replace: true })
		} catch (err) {
			setError(err?.response?.data?.message || 'Registration failed')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-pureblack">
			<div className="w-full max-w-md">
				<form onSubmit={onSubmit} className="card p-8 space-y-6">
					<div className="text-center">
						<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create Account</h1>
						<p className="text-gray-600 dark:text-black-400">Join our platform today</p>
					</div>
					{error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm p-3 rounded-lg">{error}</div>}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-black-300 mb-2">First name</label>
							<input className="input" name="firstName" value={form.firstName} onChange={onChange} required />
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-black-300 mb-2">Last name</label>
							<input className="input" name="lastName" value={form.lastName} onChange={onChange} required />
						</div>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-black-300 mb-2">Email</label>
						<input className="input" type="email" name="email" value={form.email} onChange={onChange} required />
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-black-300 mb-2">Password</label>
						<input className="input" type="password" name="password" value={form.password} onChange={onChange} required />
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-black-300 mb-2">Mobile</label>
							<input className="input" name="phone" value={form.phone} onChange={onChange} />
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-black-300 mb-2">Department</label>
							<input className="input" name="department" value={form.department} onChange={onChange} />
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-black-300 mb-2">Batch</label>
							<input className="input" name="batch" value={form.batch} onChange={onChange} />
						</div>
					</div>
					{/* Registration is student-only on UI to prevent privilege self-assignment */}
					<button className="btn-primary w-full py-3 bg-green-600 hover:bg-green-700" disabled={loading}>
						{loading ? 'Registering...' : 'Register (await admin approval)'}
					</button>
					<div className="text-sm text-center text-gray-600 dark:text-black-400">
						Already have an account? <Link to="/login" className="text-primary-600 dark:text-accent-400 hover:text-primary-700 dark:hover:text-accent-300 font-medium transition-colors">Login</Link>
					</div>
				</form>
			</div>
		</div>
	)
}


