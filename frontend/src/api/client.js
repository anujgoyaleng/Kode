import axios from 'axios'

const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
})

api.interceptors.request.use((config) => {
	const token = localStorage.getItem('token')
	if (token) {
		config.headers = config.headers ?? {}
		config.headers['Authorization'] = `Bearer ${token}`
	}
	return config
})

let isRefreshing = false
let queued = []

api.interceptors.response.use(
	(resp) => resp,
	async (error) => {
		const original = error.config
		if (error.response?.status === 401 && !original._retry) {
			original._retry = true
			if (isRefreshing) {
				await new Promise((resolve) => queued.push(resolve))
				return api(original)
			}
			isRefreshing = true
			try {
				const refreshToken = localStorage.getItem('refreshToken')
				if (!refreshToken) throw new Error('no refresh token')
				const res = await axios.post((import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/auth/refresh', { refreshToken })
				const { token, refreshToken: newRefresh } = res.data.data
				localStorage.setItem('token', token)
				localStorage.setItem('refreshToken', newRefresh)
				queued.forEach((fn) => fn())
				queued = []
				return api(original)
			} catch (e) {
				localStorage.removeItem('token')
				localStorage.removeItem('refreshToken')
				queued.forEach((fn) => fn())
				queued = []
				throw error
			} finally {
				isRefreshing = false
			}
		}
		throw error
	}
)

export default api


