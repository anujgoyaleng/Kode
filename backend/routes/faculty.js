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
    const studentsCountQuery = `
      SELECT COUNT(*) as total_students
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE u.is_active = true
    `;
    const studentsCountResult = await pool.query(studentsCountQuery);

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
 * @route   GET /api/faculty/verifications
 * @desc    Get pending verifications
 * @access  Private (Faculty/Admin)
 */
router.get('/verifications', authenticate, authorize('faculty', 'admin'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { type } = req.query; // achievements, activities, projects, certificates

    let verifications = [];

    if (!type || type === 'achievements') {
      const achievementsQuery = `
        SELECT aa.*, s.roll_number, u.first_name, u.last_name, u.email
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
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email
        },
        createdAt: row.created_at
      })));
    }

    if (!type || type === 'activities') {
      const activitiesQuery = `
        SELECT ea.*, s.roll_number, u.first_name, u.last_name, u.email
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
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email
        },
        createdAt: row.created_at
      })));
    }

    if (!type || type === 'projects') {
      const projectsQuery = `
        SELECT p.*, s.roll_number, u.first_name, u.last_name, u.email
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
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email
        },
        createdAt: row.created_at
      })));
    }

    if (!type || type === 'certificates') {
      const certificatesQuery = `
        SELECT c.*, s.roll_number, u.first_name, u.last_name, u.email
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

module.exports = router;


