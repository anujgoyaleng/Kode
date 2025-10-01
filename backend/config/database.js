const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Retry configuration
const MAX_RETRY_ATTEMPTS = 4;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 10000; // 10 seconds

// Sleep function for delays
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test database connection with retry logic
const connectDB = async (retryCount = 0) => {
  try {
    console.log(`🔄 Attempting database connection... (Attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`);
    
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    // Test query
    const result = await client.query('SELECT NOW()');
    console.log('📅 Database time:', result.rows[0].now);
    
    client.release();
    
    // Initialize database tables
    await initializeTables();
    
    // Set up connection monitoring
    setupConnectionMonitoring();
    
  } catch (error) {
    console.error(`❌ Database connection error (Attempt ${retryCount + 1}):`, error.message);
    
    if (retryCount < MAX_RETRY_ATTEMPTS - 1) {
      const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, retryCount), MAX_RETRY_DELAY);
      console.log(`⏳ Retrying in ${delay}ms...`);
      await sleep(delay);
      return connectDB(retryCount + 1);
    } else {
      console.error('💥 Max retry attempts reached. Database connection failed.');
      console.error('🔧 Please check your database configuration and ensure the database server is running.');
      process.exit(1);
    }
  }
};

// Connection monitoring and auto-reconnection
const setupConnectionMonitoring = () => {
  // Monitor pool events
  pool.on('error', async (err) => {
    console.error('🚨 Database pool error:', err.message);
    console.log('🔄 Attempting to reconnect...');
    
    // Try to reconnect
    try {
      await connectDB();
    } catch (error) {
      console.error('❌ Auto-reconnection failed:', error.message);
    }
  });

  // Periodic health check
  setInterval(async () => {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
    } catch (error) {
      console.error('🚨 Database health check failed:', error.message);
      console.log('🔄 Attempting to reconnect...');
      
      try {
        await connectDB();
      } catch (reconnectError) {
        console.error('❌ Auto-reconnection failed:', reconnectError.message);
      }
    }
  }, 30000); // Check every 30 seconds
};

// Initialize database tables
const initializeTables = async () => {
  try {
    const client = await pool.connect();
    
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'faculty', 'admin')),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        department VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Students table (extends users)
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        roll_number VARCHAR(50) UNIQUE NOT NULL,
        section VARCHAR(50),
        batch VARCHAR(20),
        semester INTEGER,
        cgpa DECIMAL(3,2),
        bio TEXT,
        linkedin_url VARCHAR(255),
        github_url VARCHAR(255),
        portfolio_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure section column exists on existing deployments where students table was created earlier
    await client.query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS section VARCHAR(50)`);

    // Academic achievements table
    await client.query(`
      CREATE TABLE IF NOT EXISTS academic_achievements (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        grade VARCHAR(10),
        semester VARCHAR(20),
        year INTEGER,
        certificate_url VARCHAR(500),
        is_verified BOOLEAN DEFAULT false,
        verified_by INTEGER REFERENCES users(id),
        verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Extracurricular activities table
    await client.query(`
      CREATE TABLE IF NOT EXISTS extracurricular_activities (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        activity_type VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        organization VARCHAR(255),
        start_date DATE,
        end_date DATE,
        position VARCHAR(100),
        certificate_url VARCHAR(500),
        is_verified BOOLEAN DEFAULT false,
        verified_by INTEGER REFERENCES users(id),
        verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Projects table
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        technologies TEXT[],
        github_url VARCHAR(500),
        live_url VARCHAR(500),
        start_date DATE,
        end_date DATE,
        is_verified BOOLEAN DEFAULT false,
        verified_by INTEGER REFERENCES users(id),
        verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Skills table
    await client.query(`
      CREATE TABLE IF NOT EXISTS skills (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        skill_name VARCHAR(100) NOT NULL,
        proficiency_level VARCHAR(20) CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
        category VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Certificates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS certificates (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        description TEXT,
        is_verified BOOLEAN DEFAULT false,
        verified_by INTEGER REFERENCES users(id),
        verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Faculty-Student assignments (many-to-many: students -> multiple faculty users)
    await client.query(`
      CREATE TABLE IF NOT EXISTS faculty_student_assignments (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        faculty_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (student_id, faculty_user_id)
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
      CREATE INDEX IF NOT EXISTS idx_students_roll_number ON students(roll_number);
      CREATE INDEX IF NOT EXISTS idx_students_section ON students(section);
      CREATE INDEX IF NOT EXISTS idx_academic_achievements_student_id ON academic_achievements(student_id);
      CREATE INDEX IF NOT EXISTS idx_extracurricular_activities_student_id ON extracurricular_activities(student_id);
      CREATE INDEX IF NOT EXISTS idx_projects_student_id ON projects(student_id);
      CREATE INDEX IF NOT EXISTS idx_skills_student_id ON skills(student_id);
      CREATE INDEX IF NOT EXISTS idx_certificates_student_id ON certificates(student_id);
      CREATE INDEX IF NOT EXISTS idx_fsa_student_id ON faculty_student_assignments(student_id);
      CREATE INDEX IF NOT EXISTS idx_fsa_faculty_user_id ON faculty_student_assignments(faculty_user_id);
    `);

    // Attendance table
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        faculty_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        attendance_date DATE NOT NULL,
        status VARCHAR(10) NOT NULL CHECK (status IN ('present','absent')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, faculty_user_id, attendance_date)
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_attendance_faculty_date ON attendance(faculty_user_id, attendance_date);
      CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, attendance_date);
    `);

    // Section mentors mapping: one mentor faculty per section
    await client.query(`
      CREATE TABLE IF NOT EXISTS section_mentors (
        section VARCHAR(50) PRIMARY KEY,
        faculty_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    client.release();
    console.log('✅ Database tables initialized successfully');
    
  } catch (error) {
    console.error('❌ Error initializing database tables:', error.message);
    // Don't throw the error here as it would prevent the connection from being established
    // The tables will be created when the connection is successful
  }
};

module.exports = {
  pool,
  connectDB
};


