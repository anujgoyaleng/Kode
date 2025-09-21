# Quick Start Guide - Student Portfolio Backend

## 🚀 Get Started in 5 Minutes

This guide will help you set up and run the Student Portfolio Management System backend quickly.

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **PostgreSQL** (v12 or higher) - [Download here](https://www.postgresql.org/download/)
- **Git** - [Download here](https://git-scm.com/)

## ⚡ Quick Setup

### Step 1: Clone and Install
```bash
# Navigate to your project directory
cd SIH/server

# Install dependencies
npm install
```

### Step 2: Database Setup
```bash
# Create PostgreSQL database
createdb student_portfolio

# Or using psql
psql -U postgres
CREATE DATABASE student_portfolio;
\q
```

### Step 3: Environment Configuration
```bash
# Copy environment template
cp env.example .env

# Edit .env file with your settings
# Minimum required settings:
```

**Edit `.env` file:**
```env
# Database
DB_URL=postgresql://postgres:password@localhost:5432/student_portfolio

# JWT Secret (generate a strong secret)
JWT_SECRET=your_super_secret_jwt_key_here

# Server
PORT=5000
NODE_ENV=development
```

### Step 4: Start the Server
```bash
# Development mode (with auto-restart)
npm run dev

# Or production mode
npm start
```

🎉 **Server is running at:** `http://localhost:5000`

## 🧪 Test the API

### Health Check
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "success",
  "message": "Server is running",
  "timestamp": "2023-12-01T10:00:00.000Z",
  "environment": "development"
}
```

### Register a Test User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student",
    "department": "Computer Science"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the `token` from the response for authenticated requests.

### Test Authenticated Request
```bash
# Replace YOUR_TOKEN with the actual token from login
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📱 Frontend Integration (Vite)

If you're using Vite for your frontend, here's how to integrate:

### 1. Update Vite Config
```javascript
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
}
```

### 2. API Service Example
```javascript
// src/services/api.js
const API_BASE = '/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  }

  // Authentication
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.data.token);
    return data;
  }

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    this.setToken(data.data.token);
    return data;
  }

  // Student methods
  async getStudentProfile(studentId) {
    return this.request(`/students/${studentId}`);
  }

  async addAchievement(studentId, achievement) {
    return this.request(`/students/${studentId}/achievements`, {
      method: 'POST',
      body: JSON.stringify(achievement),
    });
  }
}

export default new ApiService();
```

### 3. React Component Example
```jsx
// src/components/Login.jsx
import { useState } from 'react';
import api from '../services/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await api.login(email, password);
      console.log('Login successful:', result.data.user);
      // Redirect or update UI
    } catch (error) {
      console.error('Login failed:', error.message);
      // Show error message
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

export default Login;
```

## 🔧 Common Issues & Solutions

### Issue: Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
1. Ensure PostgreSQL is running
2. Check database credentials in `.env`
3. Verify database exists: `psql -l`

### Issue: Port Already in Use
```
Error: listen EADDRINUSE :::5000
```

**Solution:**
1. Change port in `.env`: `PORT=5001`
2. Or kill process using port 5000

### Issue: JWT Token Invalid
```
Error: Invalid or expired token
```

**Solution:**
1. Check JWT_SECRET in `.env`
2. Ensure token is included in Authorization header
3. Token might be expired (default: 7 days)

### Issue: CORS Error in Frontend
```
Access to fetch at 'http://localhost:5000/api/auth/login' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solution:**
1. Use Vite proxy (recommended)
2. Or update CORS settings in server

## 📊 Database Tables Created

The server automatically creates these tables on startup:

- `users` - User accounts
- `students` - Student profiles
- `academic_achievements` - Academic accomplishments
- `extracurricular_activities` - Non-academic activities
- `projects` - Student projects
- `skills` - Technical skills
- `certificates` - Uploaded files

## 🎯 Next Steps

1. **Explore the API**: Use the full [API Documentation](API_DOCUMENTATION.md)
2. **Build Frontend**: Integrate with your Vite/React frontend
3. **Add Features**: Extend the API as needed
4. **Deploy**: Follow deployment guide in [README.md](README.md)

## 📞 Need Help?

- Check the [full documentation](README.md)
- Review [API documentation](API_DOCUMENTATION.md)
- Check server logs for detailed error messages
- Ensure all environment variables are set correctly

## 🚀 Production Deployment

For production deployment:

1. **Set Environment Variables:**
   ```env
   NODE_ENV=production
   DB_URL=your_production_database_url
   JWT_SECRET=your_production_jwt_secret
   FRONTEND_URL=https://your-frontend-domain.com
   ```

2. **Database Setup:**
   - Use managed PostgreSQL (AWS RDS, Google Cloud SQL)
   - Enable SSL connections
   - Set up backups

3. **Deploy to Platform:**
   - **Render**: Connect GitHub repo, set env vars
   - **Heroku**: Add PostgreSQL addon, set env vars
   - **Railway**: Connect repo, configure environment

4. **Security:**
   - Use strong JWT secrets
   - Enable HTTPS
   - Configure proper CORS origins
   - Set up rate limiting

Happy coding! 🎉


