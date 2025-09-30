const express = require('express');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { validateId, validatePagination } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   GET /api/faculty/dashboard
 * @desc    Get faculty dashboard data
 * @access  Private (Faculty/Admin)
 */
router.get('/dashboard', authenticate, authorize('faculty', 'admin'), async (req, res) => {
  try {
    // Get total students count
    // - For faculty: count only students assigned to this faculty_user_id (approved only)
    // - For admin: count all approved students
    let studentsCountResult;
    if (req.user.role === 'faculty') {
      const facultyStudentsQuery = `
        SELECT COUNT(DISTINCT s.id) AS total_students
        FROM faculty_student_assignments fsa
        JOIN students s ON fsa.student_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE fsa.faculty_user_id = $1 AND u.is_active = true
      `;
      studentsCountResult = await pool.query(facultyStudentsQuery, [req.user.id]);
    } else {
      const studentsCountQuery = `
        SELECT COUNT(*) as total_students
        FROM students s
        JOIN users u ON s.user_id = u.id
        WHERE u.is_active = true
      `;
      studentsCountResult = await pool.query(studentsCountQuery);
    }

    // Get pending verifications count
    const pendingVerificationsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM academic_achievements WHERE is_verified = false) as pending_achievements,
        (SELECT COUNT(*) FROM extracurricular_activities WHERE is_verified = false) as pending_activities,
        (SELECT COUNT(*) FROM projects WHERE is_verified = false) as pending_projects,
        (SELECT COUNT(*) FROM certificates WHERE is_verified = false) as pending_certificates
    `;
    const pendingResult = await pool.query(pendingVerificationsQuery);

    // Get recent student registrations (last 30 days)
    const recentStudentsQuery = `
      SELECT s.id, s.roll_number, u.first_name, u.last_name, u.email, s.created_at
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE u.created_at >= NOW() - INTERVAL '30 days'
      ORDER BY u.created_at DESC
      LIMIT 10
    `;
    const recentStudentsResult = await pool.query(recentStudentsQuery);

    // Get department-wise student distribution
    const departmentStatsQuery = `
      SELECT u.department, COUNT(*) as student_count
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE u.is_active = true AND u.department IS NOT NULL
      GROUP BY u.department
      ORDER BY student_count DESC
    `;
    const departmentStatsResult = await pool.query(departmentStatsQuery);

    // Get batch-wise student distribution
    const batchStatsQuery = `
      SELECT s.batch, COUNT(*) as student_count
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE u.is_active = true AND s.batch IS NOT NULL
      GROUP BY s.batch
      ORDER BY s.batch DESC
    `;
    const batchStatsResult = await pool.query(batchStatsQuery);

    res.status(200).json({
      status: 'success',
      data: {
        dashboard: {
          totalStudents: parseInt(studentsCountResult.rows[0].total_students),
          pendingVerifications: {
            achievements: parseInt(pendingResult.rows[0].pending_achievements),
            activities: parseInt(pendingResult.rows[0].pending_activities),
            projects: parseInt(pendingResult.rows[0].pending_projects),
            certificates: parseInt(pendingResult.rows[0].pending_certificates)
          },
          recentStudents: recentStudentsResult.rows.map(student => ({
            id: student.id,
            rollNumber: student.roll_number,
            firstName: student.first_name,
            lastName: student.last_name,
            email: student.email,
            createdAt: student.created_at
          })),
          departmentStats: departmentStatsResult.rows.map(dept => ({
            department: dept.department,
            studentCount: parseInt(dept.student_count)
          })),
          batchStats: batchStatsResult.rows.map(batch => ({
            batch: batch.batch,
            studentCount: parseInt(batch.student_count)
          }))
        }
      }
    });

  } catch (error) {
    console.error('Get faculty dashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/faculty/students
 * @desc    Get all students with pagination and filters
 * @access  Private (Faculty/Admin)
 */
router.get('/students', authenticate, authorize('faculty', 'admin'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { batch, department, search, verified } = req.query;

    let query = `
      SELECT s.id, s.roll_number, s.batch, s.semester, s.cgpa, s.bio,
             u.first_name, u.last_name, u.email, u.phone, u.department,
             u.created_at,
             COUNT(DISTINCT aa.id) as achievements_count,
             COUNT(DISTINCT ea.id) as activities_count,
             COUNT(DISTINCT p.id) as projects_count,
             COUNT(DISTINCT c.id) as certificates_count
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN academic_achievements aa ON s.id = aa.student_id
      LEFT JOIN extracurricular_activities ea ON s.id = ea.student_id
      LEFT JOIN projects p ON s.id = p.student_id
      LEFT JOIN certificates c ON s.id = c.student_id
      WHERE u.is_active = true
    `;
    
    const queryParams = [];
    const conditions = [];

    if (batch) {
      conditions.push(`s.batch = $${queryParams.length + 1}`);
      queryParams.push(batch);
    }

    if (department) {
      conditions.push(`u.department = $${queryParams.length + 1}`);
      queryParams.push(department);
    }

    if (search) {
      conditions.push(`(
        u.first_name ILIKE $${queryParams.length + 1} OR 
        u.last_name ILIKE $${queryParams.length + 1} OR 
        s.roll_number ILIKE $${queryParams.length + 1}
      )`);
      queryParams.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      query += ` AND ${conditions.join(' AND ')}`;
    }

    query += ` GROUP BY s.id, u.id ORDER BY u.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count
    let countQuery = `
      SELECT COUNT(DISTINCT s.id)
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE u.is_active = true
    `;
    
    if (conditions.length > 0) {
      countQuery += ` AND ${conditions.join(' AND ')}`;
    }
    
    const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);

    res.status(200).json({
      status: 'success',
      data: {
        students: result.rows.map(student => ({
          id: student.id,
          rollNumber: student.roll_number,
          batch: student.batch,
          semester: student.semester,
          cgpa: student.cgpa,
          bio: student.bio,
          firstName: student.first_name,
          lastName: student.last_name,
          email: student.email,
          phone: student.phone,
          department: student.department,
          createdAt: student.created_at,
          portfolioStats: {
            achievements: parseInt(student.achievements_count),
            activities: parseInt(student.activities_count),
            projects: parseInt(student.projects_count),
            certificates: parseInt(student.certificates_count)
          }
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    });

  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/faculty/my-students
 * @desc    Get students assigned to the logged-in faculty, with optional section filter
 * @access  Private (Faculty)
 */
router.get('/my-students', authenticate, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const section = req.query.section;
    const normalizedSection = section ? section.toUpperCase() : null;

    let query = `
      SELECT s.id, s.roll_number, s.batch, s.semester, s.section,
             u.first_name, u.last_name, u.email, u.phone, u.department
      FROM faculty_student_assignments fsa
      JOIN students s ON fsa.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE fsa.faculty_user_id = $1 AND u.is_active = true
    `;
    const params = [req.user.id];
    if (normalizedSection) {
      params.push(normalizedSection);
      query += ` AND s.section = $${params.length}`;
    }
    query += ` ORDER BY u.first_name, u.last_name`;

    const result = await pool.query(query, params);
    res.status(200).json({
      status: 'success',
      data: {
        students: result.rows.map(r => ({
          id: r.id,
          rollNumber: r.roll_number,
          batch: r.batch,
          semester: r.semester,
          section: r.section,
          firstName: r.first_name,
          lastName: r.last_name,
          email: r.email,
          phone: r.phone,
          department: r.department
        }))
      }
    });
  } catch (error) {
    console.error('Get my-students error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

/**
 * @route   GET /api/faculty/attendance
 * @desc    Get attendance for assigned students for a given date (and optional section/semester)
 * @access  Private (Faculty)
 */
router.get('/attendance', authenticate, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const { date, section, semester, batch } = req.query;
    let attendanceDate = date || new Date().toISOString().slice(0,10);
    
    // Validate the date if provided
    if (date) {
      const testDate = new Date(date);
      if (isNaN(testDate.getTime())) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Invalid date format. Please provide a valid date in YYYY-MM-DD format.' 
        });
      }
      attendanceDate = testDate.toISOString().slice(0,10);
    }
    
    const normalizedSection = section ? section.toUpperCase() : null;

    let query = `
      SELECT s.id as student_id, s.roll_number, s.section, s.semester, s.batch,
             u.first_name, u.last_name,
             a.status
      FROM faculty_student_assignments fsa
      JOIN students s ON fsa.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN attendance a ON a.student_id = s.id AND a.faculty_user_id = fsa.faculty_user_id AND a.attendance_date = $1
      WHERE fsa.faculty_user_id = $2 AND u.is_active = true
    `;
    const params = [attendanceDate, req.user.id];
    if (batch) {
      params.push(batch);
      query += ` AND s.batch = $${params.length}`;
    }
    if (normalizedSection) {
      params.push(normalizedSection);
      query += ` AND s.section = $${params.length}`;
    }
    if (semester) {
      params.push(semester);
      query += ` AND s.semester = $${params.length}`;
    }
    query += ` ORDER BY u.first_name, u.last_name`;

    const result = await pool.query(query, params);
    res.status(200).json({
      status: 'success',
      data: {
        date: attendanceDate,
        entries: result.rows.map(r => ({
          studentId: r.student_id,
          rollNumber: r.roll_number,
          section: r.section,
          semester: r.semester,
          batch: r.batch,
          firstName: r.first_name,
          lastName: r.last_name,
          status: r.status || null
        }))
      }
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

/**
 * @route   PUT /api/faculty/attendance
 * @desc    Save attendance for assigned students for a given date
 * @access  Private (Faculty)
 */
router.put('/attendance', authenticate, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const { date, batch, section, entries } = req.body; // entries: [{ studentId, status }]
    if (!date || !Array.isArray(entries)) {
      return res.status(400).json({ status: 'error', message: 'date and entries are required' });
    }

    // Check if attendance date is more than 7 days old or in the future
    const attendanceDate = new Date(date);
    
    // Validate the date
    if (isNaN(attendanceDate.getTime())) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid date format. Please provide a valid date.' 
      });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    attendanceDate.setHours(0, 0, 0, 0);
    
    const daysDifference = Math.floor((today - attendanceDate) / (1000 * 60 * 60 * 24));
    
    if (daysDifference > 7) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Cannot update attendance older than 7 days. You can only view attendance records older than 7 days.' 
      });
    }
    
    if (attendanceDate > today) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Cannot mark attendance for future dates. You can only mark attendance for today or past dates.' 
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Ensure each student is assigned to this faculty
      const studentIds = entries.map(e => e.studentId);
      if (studentIds.length > 0) {
        const assigned = await client.query(
          `SELECT student_id FROM faculty_student_assignments WHERE faculty_user_id = $1 AND student_id = ANY($2::int[])`,
          [req.user.id, studentIds]
        );
        const allowed = new Set(assigned.rows.map(r => r.student_id));
        for (const sid of studentIds) {
          if (!allowed.has(sid)) {
            await client.query('ROLLBACK');
            return res.status(403).json({ status: 'error', message: `Student ${sid} not assigned to you` });
          }
        }
      }

      for (const e of entries) {
        if (!['present','absent'].includes(e.status)) continue;
        await client.query(
          `INSERT INTO attendance (student_id, faculty_user_id, attendance_date, status)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (student_id, faculty_user_id, attendance_date) DO UPDATE SET status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP`,
          [e.studentId, req.user.id, date, e.status]
        );
      }

      await client.query('COMMIT');
      res.status(200).json({ status: 'success', message: 'Attendance saved' });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Save attendance error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

/**
 * @route   GET /api/faculty/attendance/batches
 * @desc    Get unique batches for assigned students
 * @access  Private (Faculty)
 */
router.get('/attendance/batches', authenticate, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT s.batch
      FROM faculty_student_assignments fsa
      JOIN students s ON fsa.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE fsa.faculty_user_id = $1 AND u.is_active = true AND s.batch IS NOT NULL
      ORDER BY s.batch
    `;
    
    const result = await pool.query(query, [req.user.id]);
    
    res.status(200).json({
      status: 'success',
      data: {
        batches: result.rows.map(r => r.batch)
      }
    });
  } catch (error) {
    console.error('Get batches error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

/**
 * @route   GET /api/faculty/attendance/sections
 * @desc    Get unique sections for assigned students in a specific batch
 * @access  Private (Faculty)
 */
router.get('/attendance/sections', authenticate, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const { batch } = req.query;
    if (!batch) {
      return res.status(400).json({ status: 'error', message: 'batch parameter is required' });
    }

    const query = `
      SELECT DISTINCT s.section
      FROM faculty_student_assignments fsa
      JOIN students s ON fsa.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE fsa.faculty_user_id = $1 AND u.is_active = true AND s.batch = $2 AND s.section IS NOT NULL
      ORDER BY s.section
    `;
    
    const result = await pool.query(query, [req.user.id, batch]);
    
    res.status(200).json({
      status: 'success',
      data: {
        sections: result.rows.map(r => r.section)
      }
    });
  } catch (error) {
    console.error('Get sections error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

/**
 * @route   GET /api/faculty/test-auth
 * @desc    Test authentication endpoint
 * @access  Private (Faculty/Admin)
 */
router.get('/test-auth', authenticate, authorize('faculty', 'admin'), async (req, res) => {
  res.json({
    status: 'success',
    message: 'Authentication working',
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    }
  });
});

/**
 * @route   GET /api/faculty/check-user
 * @desc    Check current user info (no role restriction)
 * @access  Private (Any authenticated user)
 */
router.get('/check-user', authenticate, async (req, res) => {
  res.json({
    status: 'success',
    message: 'User info retrieved',
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      firstName: req.user.first_name,
      lastName: req.user.last_name,
      isActive: req.user.is_active
    }
  });
});

/**
 * @route   GET /api/faculty/verifications
 * @desc    Get pending verifications
 * @access  Private (Faculty/Admin)
 */
router.get('/verifications', authenticate, authorize('faculty', 'admin'), validatePagination, async (req, res) => {
  try {
    console.log('Verifications endpoint accessed by user:', req.user?.id, 'with role:', req.user?.role);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { type } = req.query; // achievements, activities, projects, certificates

    let verifications = [];

    if (!type || type === 'achievements') {
      const achievementsQuery = `
        SELECT aa.*, s.roll_number, s.section, u.first_name, u.last_name, u.email
        FROM academic_achievements aa
        JOIN students s ON aa.student_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE aa.is_verified = false
        ORDER BY aa.created_at DESC
        LIMIT $1 OFFSET $2
      `;
      const achievementsResult = await pool.query(achievementsQuery, [limit, offset]);
      
      verifications.push(...achievementsResult.rows.map(row => ({
        type: 'achievement',
        id: row.id,
        title: row.title,
        description: row.description,
        student: {
          rollNumber: row.roll_number,
          section: row.section,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email
        },
        createdAt: row.created_at
      })));
    }

    if (!type || type === 'activities') {
      const activitiesQuery = `
        SELECT ea.*, s.roll_number, s.section, u.first_name, u.last_name, u.email
        FROM extracurricular_activities ea
        JOIN students s ON ea.student_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE ea.is_verified = false
        ORDER BY ea.created_at DESC
        LIMIT $1 OFFSET $2
      `;
      const activitiesResult = await pool.query(activitiesQuery, [limit, offset]);
      
      verifications.push(...activitiesResult.rows.map(row => ({
        type: 'activity',
        id: row.id,
        title: row.title,
        description: row.description,
        activityType: row.activity_type,
        organization: row.organization,
        student: {
          rollNumber: row.roll_number,
          section: row.section,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email
        },
        createdAt: row.created_at
      })));
    }

    if (!type || type === 'projects') {
      const projectsQuery = `
        SELECT p.*, s.roll_number, s.section, u.first_name, u.last_name, u.email
        FROM projects p
        JOIN students s ON p.student_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE p.is_verified = false
        ORDER BY p.created_at DESC
        LIMIT $1 OFFSET $2
      `;
      const projectsResult = await pool.query(projectsQuery, [limit, offset]);
      
      verifications.push(...projectsResult.rows.map(row => ({
        type: 'project',
        id: row.id,
        title: row.title,
        description: row.description,
        technologies: row.technologies,
        githubUrl: row.github_url,
        liveUrl: row.live_url,
        student: {
          rollNumber: row.roll_number,
          section: row.section,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email
        },
        createdAt: row.created_at
      })));
    }

    if (!type || type === 'certificates') {
      const certificatesQuery = `
        SELECT c.*, s.roll_number, s.section, u.first_name, u.last_name, u.email
        FROM certificates c
        JOIN students s ON c.student_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE c.is_verified = false
        ORDER BY c.created_at DESC
        LIMIT $1 OFFSET $2
      `;
      const certificatesResult = await pool.query(certificatesQuery, [limit, offset]);
      
      verifications.push(...certificatesResult.rows.map(row => ({
        type: 'certificate',
        id: row.id,
        filename: row.filename,
        originalName: row.original_name,
        description: row.description,
        fileSize: row.file_size,
        mimeType: row.mime_type,
        fileUrl: `/uploads/${row.filename}`,
        student: {
          rollNumber: row.roll_number,
          section: row.section,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email
        },
        createdAt: row.created_at
      })));
    }

    // Sort by creation date
    verifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      status: 'success',
      data: {
        verifications: verifications.slice(0, limit),
        pagination: {
          currentPage: page,
          totalItems: verifications.length,
          itemsPerPage: limit
        }
      }
    });

  } catch (error) {
    console.error('Get verifications error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   PUT /api/faculty/verify/:type/:id
 * @desc    Verify student submission
 * @access  Private (Faculty/Admin)
 */
router.put('/verify/:type/:id', authenticate, authorize('faculty', 'admin'), validateId, async (req, res) => {
  try {
    const { type, id } = req.params;
    const { isVerified, comments } = req.body;

    if (typeof isVerified !== 'boolean') {
      return res.status(400).json({
        status: 'error',
        message: 'isVerified must be a boolean value'
      });
    }

    let tableName;
    let studentIdField;

    switch (type) {
      case 'achievement':
        tableName = 'academic_achievements';
        studentIdField = 'student_id';
        break;
      case 'activity':
        tableName = 'extracurricular_activities';
        studentIdField = 'student_id';
        break;
      case 'project':
        tableName = 'projects';
        studentIdField = 'student_id';
        break;
      case 'certificate':
        tableName = 'certificates';
        studentIdField = 'student_id';
        break;
      default:
        return res.status(400).json({
          status: 'error',
          message: 'Invalid verification type'
        });
    }

    const updateQuery = `
      UPDATE ${tableName} 
      SET is_verified = $1, verified_by = $2, verified_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [isVerified, req.user.id, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: `${type} not found`
      });
    }

    res.status(200).json({
      status: 'success',
      message: `${type} ${isVerified ? 'verified' : 'rejected'} successfully`,
      data: {
        verification: {
          id: result.rows[0].id,
          isVerified: result.rows[0].is_verified,
          verifiedBy: result.rows[0].verified_by,
          verifiedAt: result.rows[0].verified_at
        }
      }
    });

  } catch (error) {
    console.error('Verify submission error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/faculty/reports/students
 * @desc    Generate student report
 * @access  Private (Faculty/Admin)
 */
router.get('/reports/students', authenticate, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const { batch, department, format } = req.query;

    let query = `
      SELECT s.id, s.roll_number, s.batch, s.semester, s.cgpa,
             u.first_name, u.last_name, u.email, u.phone, u.department,
             COUNT(DISTINCT aa.id) as achievements_count,
             COUNT(DISTINCT ea.id) as activities_count,
             COUNT(DISTINCT p.id) as projects_count,
             COUNT(DISTINCT c.id) as certificates_count,
             COUNT(DISTINCT CASE WHEN aa.is_verified = true THEN aa.id END) as verified_achievements,
             COUNT(DISTINCT CASE WHEN ea.is_verified = true THEN ea.id END) as verified_activities,
             COUNT(DISTINCT CASE WHEN p.is_verified = true THEN p.id END) as verified_projects,
             COUNT(DISTINCT CASE WHEN c.is_verified = true THEN c.id END) as verified_certificates
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN academic_achievements aa ON s.id = aa.student_id
      LEFT JOIN extracurricular_activities ea ON s.id = ea.student_id
      LEFT JOIN projects p ON s.id = p.student_id
      LEFT JOIN certificates c ON s.id = c.student_id
      WHERE u.is_active = true
    `;

    const queryParams = [];
    const conditions = [];

    if (batch) {
      conditions.push(`s.batch = $${queryParams.length + 1}`);
      queryParams.push(batch);
    }

    if (department) {
      conditions.push(`u.department = $${queryParams.length + 1}`);
      queryParams.push(department);
    }

    if (conditions.length > 0) {
      query += ` AND ${conditions.join(' AND ')}`;
    }

    query += ` GROUP BY s.id, u.id ORDER BY s.roll_number`;

    const result = await pool.query(query, queryParams);

    const reportData = result.rows.map(student => ({
      rollNumber: student.roll_number,
      name: `${student.first_name} ${student.last_name}`,
      email: student.email,
      phone: student.phone,
      department: student.department,
      batch: student.batch,
      semester: student.semester,
      cgpa: student.cgpa,
      portfolioStats: {
        total: {
          achievements: parseInt(student.achievements_count),
          activities: parseInt(student.activities_count),
          projects: parseInt(student.projects_count),
          certificates: parseInt(student.certificates_count)
        },
        verified: {
          achievements: parseInt(student.verified_achievements),
          activities: parseInt(student.verified_activities),
          projects: parseInt(student.verified_projects),
          certificates: parseInt(student.verified_certificates)
        }
      }
    }));

    if (format === 'csv') {
      // Generate CSV format
      const csvHeaders = [
        'Roll Number', 'Name', 'Email', 'Phone', 'Department', 'Batch', 'Semester', 'CGPA',
        'Total Achievements', 'Verified Achievements', 'Total Activities', 'Verified Activities',
        'Total Projects', 'Verified Projects', 'Total Certificates', 'Verified Certificates'
      ];

      const csvRows = reportData.map(student => [
        student.rollNumber,
        student.name,
        student.email,
        student.phone || '',
        student.department || '',
        student.batch || '',
        student.semester || '',
        student.cgpa || '',
        student.portfolioStats.total.achievements,
        student.portfolioStats.verified.achievements,
        student.portfolioStats.total.activities,
        student.portfolioStats.verified.activities,
        student.portfolioStats.total.projects,
        student.portfolioStats.verified.projects,
        student.portfolioStats.total.certificates,
        student.portfolioStats.verified.certificates
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="students_report.csv"');
      res.send(csvContent);
    } else {
      // Return JSON format
      res.status(200).json({
        status: 'success',
        data: {
          report: {
            generatedAt: new Date().toISOString(),
            filters: { batch, department },
            totalStudents: reportData.length,
            students: reportData
          }
        }
      });
    }

  } catch (error) {
    console.error('Generate student report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/faculty/students
 * @desc    Create a student profile for a given user (admin/faculty)
 * @access  Private (Faculty/Admin)
 */
router.post('/students', authenticate, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const { userId, rollNumber, batch, semester, cgpa, bio, linkedinUrl, githubUrl, portfolioUrl } = req.body;

    if (!userId || !rollNumber) {
      return res.status(400).json({ status: 'error', message: 'userId and rollNumber are required' });
    }

    // Check if user exists
    const userExists = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userExists.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    // If student already exists, return conflict
    const existing = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ status: 'error', message: 'Student profile already exists' });
    }

    const insertQuery = `
      INSERT INTO students (user_id, roll_number, batch, semester, cgpa, bio, linkedin_url, github_url, portfolio_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [
      userId, rollNumber, batch || null, semester || null, cgpa || null,
      bio || null, linkedinUrl || null, githubUrl || null, portfolioUrl || null
    ]);

    res.status(201).json({ status: 'success', data: { student: result.rows[0] } });
  } catch (error) {
    console.error('Faculty create student error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

/**
 * @route   PUT /api/faculty/students/:id/profile
 * @desc    Create or update a student's basic profile (admin/faculty)
 * @access  Private (Faculty/Admin)
 */
router.put('/students/:id/profile', authenticate, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const studentId = req.params.id;
    const { rollNumber, batch, semester, cgpa, bio, linkedinUrl, githubUrl, portfolioUrl, section } = req.body;

    // Check if student exists
    const existing = await pool.query('SELECT id FROM students WHERE id = $1', [studentId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Student not found' });
    }

    const updateQuery = `
      UPDATE students
      SET roll_number = COALESCE($1, roll_number),
          batch = COALESCE($2, batch),
          semester = COALESCE($3, semester),
          cgpa = COALESCE($4, cgpa),
          bio = COALESCE($5, bio),
          linkedin_url = COALESCE($6, linkedin_url),
          github_url = COALESCE($7, github_url),
          portfolio_url = COALESCE($8, portfolio_url),
          section = COALESCE($9, section),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      rollNumber || null,
      batch || null,
      semester || null,
      cgpa || null,
      bio || null,
      linkedinUrl || null,
      githubUrl || null,
      portfolioUrl || null,
      section || null,
      studentId
    ]);

    res.status(200).json({ status: 'success', data: { student: result.rows[0] } });
  } catch (error) {
    console.error('Faculty update student profile error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

module.exports = router;


