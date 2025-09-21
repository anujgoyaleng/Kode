# Student Portfolio Management System - Backend API

A comprehensive Node.js + Express backend API for managing student portfolios, achievements, and analytics. This system supports role-based access control with JWT authentication and provides endpoints for students, faculty, and administrators.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Configuration](#environment-configuration)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Authentication & Authorization](#authentication--authorization)
- [File Upload System](#file-upload-system)
- [Error Handling](#error-handling)
- [Deployment](#deployment)

## 🎯 Overview

This backend system provides a complete API for managing student portfolios with the following key features:

- **User Management**: Registration, login, profile management
- **Student Portfolios**: Academic achievements, extracurricular activities, projects, skills
- **Faculty Dashboard**: Student management, verification system, reports
- **Analytics**: Comprehensive statistics and trends
- **File Management**: Certificate uploads and management
- **Role-based Access**: Student, Faculty, Admin roles with appropriate permissions

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate Limiting
- **Environment**: dotenv

## 📁 Project Structure

```
server/
├── config/
│   └── database.js          # Database connection and initialization
├── middleware/
│   ├── auth.js              # Authentication & authorization middleware
│   ├── errorHandler.js      # Global error handling
│   └── validation.js        # Request validation middleware
├── routes/
│   ├── auth.js              # Authentication routes (login, register)
│   ├── users.js             # User management routes
│   ├── students.js          # Student portfolio routes
│   ├── faculty.js           # Faculty dashboard routes
│   ├── analytics.js         # Analytics and statistics routes
│   └── upload.js            # File upload routes
├── utils/
│   └── jwt.js               # JWT token utilities
├── uploads/                 # File storage directory
├── index.js                 # Main server file
├── package.json             # Dependencies and scripts
└── env.example              # Environment variables template
```

## 🚀 Setup & Installation

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SIH/server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Set up PostgreSQL database**
   ```sql
   CREATE DATABASE student_portfolio;
   CREATE USER your_db_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE student_portfolio TO your_db_user;
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000` by default.

## ⚙️ Environment Configuration

Create a `.env` file in the server directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=student_portfolio
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_URL=postgresql://user:password@localhost:5432/student_portfolio

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🗄️ Database Schema

The system uses PostgreSQL with the following main tables:

### Core Tables

1. **users** - User accounts and basic information
2. **students** - Student-specific profile data
3. **academic_achievements** - Academic accomplishments
4. **extracurricular_activities** - Non-academic activities
5. **projects** - Student projects and portfolios
6. **skills** - Technical and soft skills
7. **certificates** - Uploaded certificate files

### Relationships

- `users` → `students` (One-to-One)
- `students` → `academic_achievements` (One-to-Many)
- `students` → `extracurricular_activities` (One-to-Many)
- `students` → `projects` (One-to-Many)
- `students` → `skills` (One-to-Many)
- `students` → `certificates` (One-to-Many)

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student",
  "phone": "+1234567890",
  "department": "Computer Science"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": { ... },
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

#### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "password123"
}
```

#### GET /api/auth/me
Get current user information (requires authentication).

### Student Portfolio Endpoints

#### POST /api/students/profile
Create or update student profile.

**Request Body:**
```json
{
  "rollNumber": "CS2023001",
  "batch": "2023",
  "semester": 3,
  "cgpa": 8.5,
  "bio": "Passionate computer science student...",
  "linkedinUrl": "https://linkedin.com/in/johndoe",
  "githubUrl": "https://github.com/johndoe",
  "portfolioUrl": "https://johndoe.dev"
}
```

#### POST /api/students/:id/achievements
Add academic achievement.

**Request Body:**
```json
{
  "title": "Dean's List",
  "description": "Achieved Dean's List for Fall 2023",
  "grade": "A+",
  "semester": "Fall 2023",
  "year": 2023,
  "certificateUrl": "/uploads/certificate.pdf"
}
```

#### POST /api/students/:id/activities
Add extracurricular activity.

**Request Body:**
```json
{
  "activityType": "Sports",
  "title": "Basketball Team Captain",
  "description": "Led university basketball team to championship",
  "organization": "University Sports Club",
  "startDate": "2023-01-01",
  "endDate": "2023-12-31",
  "position": "Captain"
}
```

#### POST /api/students/:id/projects
Add project.

**Request Body:**
```json
{
  "title": "E-commerce Website",
  "description": "Full-stack e-commerce application",
  "technologies": ["React", "Node.js", "PostgreSQL"],
  "githubUrl": "https://github.com/johndoe/ecommerce",
  "liveUrl": "https://ecommerce-demo.com",
  "startDate": "2023-06-01",
  "endDate": "2023-08-31"
}
```

#### POST /api/students/:id/skills
Add skill.

**Request Body:**
```json
{
  "skillName": "JavaScript",
  "proficiencyLevel": "advanced",
  "category": "Programming"
}
```

### Faculty Dashboard Endpoints

#### GET /api/faculty/dashboard
Get faculty dashboard statistics.

#### GET /api/faculty/students
Get all students with pagination and filters.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `batch` - Filter by batch
- `department` - Filter by department
- `search` - Search by name or roll number

#### GET /api/faculty/verifications
Get pending verifications.

**Query Parameters:**
- `type` - Filter by type (achievements, activities, projects, certificates)

#### PUT /api/faculty/verify/:type/:id
Verify or reject student submission.

**Request Body:**
```json
{
  "isVerified": true,
  "comments": "Verified successfully"
}
```

### File Upload Endpoints

#### POST /api/upload/certificate
Upload a single certificate file.

**Form Data:**
- `certificate` - File upload
- `description` - Optional description

#### POST /api/upload/certificates
Upload multiple certificate files.

**Form Data:**
- `certificates` - Multiple file uploads (max 5)

#### GET /api/upload/certificates
Get student's uploaded certificates.

#### DELETE /api/upload/certificates/:id
Delete a certificate file.

### Analytics Endpoints

#### GET /api/analytics/overview
Get public analytics overview.

#### GET /api/analytics/students
Get student analytics (Faculty/Admin only).

#### GET /api/analytics/achievements
Get achievements analytics (Faculty/Admin only).

#### GET /api/analytics/activities
Get activities analytics (Faculty/Admin only).

#### GET /api/analytics/projects
Get projects analytics (Faculty/Admin only).

#### GET /api/analytics/skills
Get skills analytics (Faculty/Admin only).

#### GET /api/analytics/trends
Get trends over time (Faculty/Admin only).

## 🔐 Authentication & Authorization

### JWT Token System

The system uses JWT tokens for authentication with the following structure:

```json
{
  "id": "user_id",
  "email": "user@example.com",
  "role": "student|faculty|admin",
  "iat": "issued_at_timestamp",
  "exp": "expiration_timestamp"
}
```

### Role-Based Access Control

#### Student Role
- Can manage their own profile and portfolio
- Can upload certificates
- Can view their own data
- Cannot access other students' data

#### Faculty Role
- Can view all students
- Can verify student submissions
- Can access analytics and reports
- Can generate reports

#### Admin Role
- Full access to all features
- Can manage users (activate/deactivate/delete)
- Can access all analytics
- Can generate comprehensive reports

### Authentication Headers

Include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## 📁 File Upload System

### Supported File Types
- PDF documents
- Images (JPEG, PNG, GIF)

### File Size Limits
- Maximum file size: 10MB (configurable)
- Maximum files per request: 5

### File Storage
- Files are stored in the `uploads/` directory
- Unique filenames are generated to prevent conflicts
- File metadata is stored in the database

### Security Features
- File type validation
- File size limits
- Secure filename generation
- Automatic cleanup on errors

## ⚠️ Error Handling

The system provides comprehensive error handling with consistent error responses:

### Error Response Format
```json
{
  "status": "error",
  "message": "Error description",
  "errors": [] // Validation errors (if applicable)
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

### Validation Errors
Validation errors include detailed field-specific messages:

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

## 🚀 Deployment

### Production Environment Setup

1. **Environment Variables**
   ```env
   NODE_ENV=production
   DB_URL=your_production_database_url
   JWT_SECRET=your_production_jwt_secret
   FRONTEND_URL=https://your-frontend-domain.com
   ```

2. **Database Setup**
   - Use a managed PostgreSQL service (AWS RDS, Google Cloud SQL, etc.)
   - Ensure SSL connections are enabled
   - Set up proper backup strategies

3. **File Storage**
   - For production, consider using cloud storage (AWS S3, Google Cloud Storage)
   - Update the upload configuration accordingly

4. **Security Considerations**
   - Use strong JWT secrets
   - Enable HTTPS
   - Set up proper CORS origins
   - Configure rate limiting appropriately
   - Use environment-specific database credentials

### Deployment Platforms

#### Render (Recommended)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically on push

#### Heroku
1. Create Heroku app
2. Add PostgreSQL addon
3. Set environment variables
4. Deploy using Git

#### Railway
1. Connect repository
2. Configure environment variables
3. Deploy with automatic scaling

## 🔧 Development

### Running in Development Mode
```bash
npm run dev
```

This uses nodemon for automatic server restarts on file changes.

### Testing
```bash
npm test
```

### Code Structure Guidelines

1. **Routes**: Keep routes clean and focused on HTTP concerns
2. **Middleware**: Use middleware for cross-cutting concerns
3. **Validation**: Validate all inputs using express-validator
4. **Error Handling**: Use consistent error responses
5. **Database**: Use parameterized queries to prevent SQL injection

## 📞 Support

For questions or issues:

1. Check the API documentation above
2. Review the error messages for specific guidance
3. Check the server logs for detailed error information
4. Ensure all environment variables are properly configured

## 🔄 API Versioning

The current API is version 1.0. Future versions will be available at `/api/v2/`, etc.

## 📝 License

This project is licensed under the MIT License.


