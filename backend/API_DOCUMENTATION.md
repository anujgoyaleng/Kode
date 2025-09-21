# Student Portfolio Management System - API Documentation

## 📋 Overview

This document provides detailed API documentation for the Student Portfolio Management System backend. The API follows RESTful principles and uses JSON for data exchange.

## 🔗 Base URL

```
http://localhost:5000/api
```

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 📊 Response Format

All API responses follow this format:

### Success Response
```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error message"
    }
  ]
}
```

## 🚀 API Endpoints

### Authentication Endpoints

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "string (required, valid email)",
  "password": "string (required, min 6 characters)",
  "firstName": "string (required, 2-50 characters)",
  "lastName": "string (required, 2-50 characters)",
  "role": "string (required, one of: student, faculty, admin)",
  "phone": "string (optional, valid phone number)",
  "department": "string (optional, max 100 characters)"
}
```

**Response (201):**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "student@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student",
      "phone": "+1234567890",
      "department": "Computer Science",
      "createdAt": "2023-12-01T10:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /auth/login
Authenticate user and return JWT tokens.

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "student@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student",
      "studentId": 1,
      "rollNumber": "CS2023001",
      "batch": "2023",
      "semester": 3,
      "cgpa": 8.5
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "string (required)"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Token refreshed successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### GET /auth/me
Get current user information.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "email": "student@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student",
      "phone": "+1234567890",
      "department": "Computer Science",
      "studentId": 1,
      "rollNumber": "CS2023001",
      "batch": "2023",
      "semester": 3,
      "cgpa": 8.5,
      "bio": "Passionate computer science student...",
      "linkedinUrl": "https://linkedin.com/in/johndoe",
      "githubUrl": "https://github.com/johndoe",
      "portfolioUrl": "https://johndoe.dev"
    }
  }
}
```

#### POST /auth/logout
Logout user (client-side token removal).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

### User Management Endpoints

#### GET /users
Get all users (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `role` (optional): Filter by role

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "users": [
      {
        "id": 1,
        "email": "student@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "student",
        "phone": "+1234567890",
        "department": "Computer Science",
        "isActive": true,
        "createdAt": "2023-12-01T10:00:00Z",
        "studentId": 1,
        "rollNumber": "CS2023001",
        "batch": "2023",
        "semester": 3
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    }
  }
}
```

#### GET /users/:id
Get user by ID.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "email": "student@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student",
      "phone": "+1234567890",
      "department": "Computer Science",
      "isActive": true,
      "createdAt": "2023-12-01T10:00:00Z",
      "studentId": 1,
      "rollNumber": "CS2023001",
      "batch": "2023",
      "semester": 3,
      "cgpa": 8.5,
      "bio": "Passionate computer science student...",
      "linkedinUrl": "https://linkedin.com/in/johndoe",
      "githubUrl": "https://github.com/johndoe",
      "portfolioUrl": "https://johndoe.dev"
    }
  }
}
```

#### PUT /users/:id
Update user profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "phone": "string (optional)",
  "department": "string (optional)"
}
```

#### PUT /users/:id/password
Update user password.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "string (required)",
  "newPassword": "string (required, min 6 characters)"
}
```

#### PUT /users/:id/status
Update user active status (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "isActive": "boolean (required)"
}
```

#### DELETE /users/:id
Delete user (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

### Student Portfolio Endpoints

#### GET /students
Get all students (Faculty/Admin only).

**Headers:** `Authorization: Bearer <faculty_or_admin_token>`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `batch` (optional): Filter by batch
- `department` (optional): Filter by department
- `search` (optional): Search by name or roll number

#### GET /students/:id
Get complete student profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "student": {
      "id": 1,
      "userId": 1,
      "rollNumber": "CS2023001",
      "batch": "2023",
      "semester": 3,
      "cgpa": 8.5,
      "bio": "Passionate computer science student...",
      "linkedinUrl": "https://linkedin.com/in/johndoe",
      "githubUrl": "https://github.com/johndoe",
      "portfolioUrl": "https://johndoe.dev",
      "firstName": "John",
      "lastName": "Doe",
      "email": "student@example.com",
      "phone": "+1234567890",
      "department": "Computer Science",
      "createdAt": "2023-12-01T10:00:00Z"
    },
    "academicAchievements": [
      {
        "id": 1,
        "title": "Dean's List",
        "description": "Achieved Dean's List for Fall 2023",
        "grade": "A+",
        "semester": "Fall 2023",
        "year": 2023,
        "certificateUrl": "/uploads/certificate.pdf",
        "isVerified": true,
        "verifiedBy": 2,
        "verifiedAt": "2023-12-01T10:00:00Z",
        "createdAt": "2023-12-01T10:00:00Z"
      }
    ],
    "extracurricularActivities": [
      {
        "id": 1,
        "activityType": "Sports",
        "title": "Basketball Team Captain",
        "description": "Led university basketball team to championship",
        "organization": "University Sports Club",
        "startDate": "2023-01-01",
        "endDate": "2023-12-31",
        "position": "Captain",
        "certificateUrl": "/uploads/sports_cert.pdf",
        "isVerified": true,
        "verifiedBy": 2,
        "verifiedAt": "2023-12-01T10:00:00Z",
        "createdAt": "2023-12-01T10:00:00Z"
      }
    ],
    "projects": [
      {
        "id": 1,
        "title": "E-commerce Website",
        "description": "Full-stack e-commerce application",
        "technologies": ["React", "Node.js", "PostgreSQL"],
        "githubUrl": "https://github.com/johndoe/ecommerce",
        "liveUrl": "https://ecommerce-demo.com",
        "startDate": "2023-06-01",
        "endDate": "2023-08-31",
        "isVerified": true,
        "verifiedBy": 2,
        "verifiedAt": "2023-12-01T10:00:00Z",
        "createdAt": "2023-12-01T10:00:00Z"
      }
    ],
    "skills": [
      {
        "id": 1,
        "skillName": "JavaScript",
        "proficiencyLevel": "advanced",
        "category": "Programming",
        "createdAt": "2023-12-01T10:00:00Z"
      }
    ]
  }
}
```

#### POST /students/profile
Create or update student profile.

**Headers:** `Authorization: Bearer <student_token>`

**Request Body:**
```json
{
  "rollNumber": "string (required, 3-50 characters)",
  "batch": "string (optional, max 20 characters)",
  "semester": "number (optional, 1-12)",
  "cgpa": "number (optional, 0-10)",
  "bio": "string (optional, max 1000 characters)",
  "linkedinUrl": "string (optional, valid URL)",
  "githubUrl": "string (optional, valid URL)",
  "portfolioUrl": "string (optional, valid URL)"
}
```

#### POST /students/:id/achievements
Add academic achievement.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "string (required, 3-255 characters)",
  "description": "string (optional, max 1000 characters)",
  "grade": "string (optional, max 10 characters)",
  "semester": "string (optional, max 20 characters)",
  "year": "number (optional, 2000-2030)",
  "certificateUrl": "string (optional, valid URL)"
}
```

#### POST /students/:id/activities
Add extracurricular activity.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "activityType": "string (required, 3-100 characters)",
  "title": "string (required, 3-255 characters)",
  "description": "string (optional, max 1000 characters)",
  "organization": "string (optional, max 255 characters)",
  "startDate": "string (optional, ISO 8601 date)",
  "endDate": "string (optional, ISO 8601 date)",
  "position": "string (optional, max 100 characters)",
  "certificateUrl": "string (optional, valid URL)"
}
```

#### POST /students/:id/projects
Add project.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "string (required, 3-255 characters)",
  "description": "string (optional, max 1000 characters)",
  "technologies": "array (optional, array of strings)",
  "githubUrl": "string (optional, valid URL)",
  "liveUrl": "string (optional, valid URL)",
  "startDate": "string (optional, ISO 8601 date)",
  "endDate": "string (optional, ISO 8601 date)"
}
```

#### POST /students/:id/skills
Add skill.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "skillName": "string (required, 2-100 characters)",
  "proficiencyLevel": "string (required, one of: beginner, intermediate, advanced, expert)",
  "category": "string (optional, max 50 characters)"
}
```

#### PUT /students/:id/achievements/:achievementId
Update academic achievement.

**Headers:** `Authorization: Bearer <token>`

#### DELETE /students/:id/achievements/:achievementId
Delete academic achievement.

**Headers:** `Authorization: Bearer <token>`

### Faculty Dashboard Endpoints

#### GET /faculty/dashboard
Get faculty dashboard statistics.

**Headers:** `Authorization: Bearer <faculty_or_admin_token>`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "dashboard": {
      "totalStudents": 150,
      "pendingVerifications": {
        "achievements": 25,
        "activities": 18,
        "projects": 12,
        "certificates": 8
      },
      "recentStudents": [
        {
          "id": 1,
          "rollNumber": "CS2023001",
          "firstName": "John",
          "lastName": "Doe",
          "email": "student@example.com",
          "createdAt": "2023-12-01T10:00:00Z"
        }
      ],
      "departmentStats": [
        {
          "department": "Computer Science",
          "studentCount": 45
        }
      ],
      "batchStats": [
        {
          "batch": "2023",
          "studentCount": 50
        }
      ]
    }
  }
}
```

#### GET /faculty/students
Get all students with portfolio statistics.

**Headers:** `Authorization: Bearer <faculty_or_admin_token>`

**Query Parameters:**
- `page`, `limit`, `batch`, `department`, `search`

#### GET /faculty/verifications
Get pending verifications.

**Headers:** `Authorization: Bearer <faculty_or_admin_token>`

**Query Parameters:**
- `type` (optional): Filter by type (achievements, activities, projects, certificates)

#### PUT /faculty/verify/:type/:id
Verify or reject student submission.

**Headers:** `Authorization: Bearer <faculty_or_admin_token>`

**Request Body:**
```json
{
  "isVerified": "boolean (required)"
}
```

#### GET /faculty/reports/students
Generate student report.

**Headers:** `Authorization: Bearer <faculty_or_admin_token>`

**Query Parameters:**
- `batch` (optional): Filter by batch
- `department` (optional): Filter by department
- `format` (optional): Response format (json, csv)

### File Upload Endpoints

#### POST /upload/certificate
Upload a single certificate file.

**Headers:** `Authorization: Bearer <student_token>`

**Form Data:**
- `certificate`: File (required, PDF/JPEG/PNG/GIF, max 10MB)
- `description`: String (optional)

**Response (201):**
```json
{
  "status": "success",
  "message": "Certificate uploaded successfully",
  "data": {
    "certificate": {
      "id": 1,
      "filename": "certificate-1701234567890-123456789.pdf",
      "originalName": "dean_list_certificate.pdf",
      "fileSize": 1024000,
      "mimeType": "application/pdf",
      "description": "Dean's List Certificate",
      "fileUrl": "/uploads/certificate-1701234567890-123456789.pdf",
      "createdAt": "2023-12-01T10:00:00Z"
    }
  }
}
```

#### POST /upload/certificates
Upload multiple certificate files.

**Headers:** `Authorization: Bearer <student_token>`

**Form Data:**
- `certificates`: Files (required, max 5 files)

#### GET /upload/certificates
Get student's uploaded certificates.

**Headers:** `Authorization: Bearer <student_token>`

#### DELETE /upload/certificates/:id
Delete a certificate file.

**Headers:** `Authorization: Bearer <student_token>`

#### GET /upload/certificates/:id/download
Download a certificate file.

**Headers:** `Authorization: Bearer <token>`

### Analytics Endpoints

#### GET /analytics/overview
Get public analytics overview.

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "overview": {
      "totalStudents": 150,
      "totalAchievements": 450,
      "totalActivities": 300,
      "totalProjects": 200,
      "departmentDistribution": [
        {
          "department": "Computer Science",
          "studentCount": 45
        }
      ],
      "batchDistribution": [
        {
          "batch": "2023",
          "studentCount": 50
        }
      ]
    }
  }
}
```

#### GET /analytics/students
Get student analytics (Faculty/Admin only).

**Headers:** `Authorization: Bearer <faculty_or_admin_token>`

#### GET /analytics/achievements
Get achievements analytics (Faculty/Admin only).

#### GET /analytics/activities
Get activities analytics (Faculty/Admin only).

#### GET /analytics/projects
Get projects analytics (Faculty/Admin only).

#### GET /analytics/skills
Get skills analytics (Faculty/Admin only).

#### GET /analytics/trends
Get trends over time (Faculty/Admin only).

**Query Parameters:**
- `period` (optional): Time period (month, week, day)

## 🔒 Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation errors) |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate data) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

## 📝 Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP
- **Scope**: All `/api/` endpoints
- **Headers**: Rate limit info included in response headers

## 🔧 Testing the API

### Using cURL

```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get user profile (replace TOKEN with actual token)
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

### Using Postman

1. Import the API collection
2. Set up environment variables
3. Use the authentication flow
4. Test all endpoints

## 🚀 Integration Examples

### Frontend Integration (React/Vue/Angular)

```javascript
// API service example
class ApiService {
  constructor(baseURL = 'http://localhost:5000/api') {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
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

  // Authentication methods
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

  // File upload
  async uploadCertificate(file, description = '') {
    const formData = new FormData();
    formData.append('certificate', file);
    formData.append('description', description);

    return this.request('/upload/certificate', {
      method: 'POST',
      headers: {}, // Remove Content-Type to let browser set it
      body: formData,
    });
  }
}

// Usage
const api = new ApiService();

// Login
try {
  const result = await api.login('student@example.com', 'password123');
  console.log('Login successful:', result.data.user);
} catch (error) {
  console.error('Login failed:', error.message);
}

// Get student profile
try {
  const profile = await api.getStudentProfile(1);
  console.log('Student profile:', profile.data.student);
} catch (error) {
  console.error('Failed to get profile:', error.message);
}
```

This comprehensive API documentation should help you understand and integrate with the backend system effectively!


