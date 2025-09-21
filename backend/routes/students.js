const express = require('express');
const { pool } = require('../config/database');
const { authenticate, authorize, authorizeStudentAccess } = require('../middleware/auth');
const { 
  validateId, 
  validatePagination, 
  validateStudentProfile,
  validateAcademicAchievement,
  validateExtracurricularActivity,
  validateProject,
  validateSkill
} = require('../middleware/validation');

const router = express.Router();

/**
 * @route   GET /api/students
 * @desc    Get all students (Faculty/Admin only)
 * @access  Private (Faculty/Admin)
 */
router.get('/', authenticate, authorize('faculty', 'admin'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { batch, department, search } = req.query;

    let query = `
      SELECT s.id, s.roll_number, s.batch, s.semester, s.cgpa, s.bio,
             u.first_name, u.last_name, u.email, u.phone, u.department,
             u.created_at
      FROM students s
      JOIN users u ON s.user_id = u.id
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

    query += ` ORDER BY s.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) 
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
          createdAt: student.created_at
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
 * @route   GET /api/students/:id
 * @desc    Get student profile by ID
 * @access  Private
 */
router.get('/:id', authenticate, authorizeStudentAccess, validateId, async (req, res) => {
  try {
    const studentId = req.params.id;

    // Get student profile
    const studentQuery = `
      SELECT s.*, u.first_name, u.last_name, u.email, u.phone, u.department, u.created_at
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = $1 AND u.is_active = true
    `;

    const studentResult = await pool.query(studentQuery, [studentId]);

    if (studentResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Student not found'
      });
    }

    const student = studentResult.rows[0];

    // Get academic achievements
    const achievementsQuery = `
      SELECT * FROM academic_achievements 
      WHERE student_id = $1 
      ORDER BY year DESC, semester DESC
    `;
    const achievementsResult = await pool.query(achievementsQuery, [studentId]);

    // Get extracurricular activities
    const activitiesQuery = `
      SELECT * FROM extracurricular_activities 
      WHERE student_id = $1 
      ORDER BY start_date DESC
    `;
    const activitiesResult = await pool.query(activitiesQuery, [studentId]);

    // Get projects
    const projectsQuery = `
      SELECT * FROM projects 
      WHERE student_id = $1 
      ORDER BY start_date DESC
    `;
    const projectsResult = await pool.query(projectsQuery, [studentId]);

    // Get skills
    const skillsQuery = `
      SELECT * FROM skills 
      WHERE student_id = $1 
      ORDER BY category, skill_name
    `;
    const skillsResult = await pool.query(skillsQuery, [studentId]);

    res.status(200).json({
      status: 'success',
      data: {
        student: {
          id: student.id,
          userId: student.user_id,
          rollNumber: student.roll_number,
          batch: student.batch,
          semester: student.semester,
          cgpa: student.cgpa,
          bio: student.bio,
          linkedinUrl: student.linkedin_url,
          githubUrl: student.github_url,
          portfolioUrl: student.portfolio_url,
          firstName: student.first_name,
          lastName: student.last_name,
          email: student.email,
          phone: student.phone,
          department: student.department,
          createdAt: student.created_at,
          updatedAt: student.updated_at
        },
        academicAchievements: achievementsResult.rows.map(achievement => ({
          id: achievement.id,
          title: achievement.title,
          description: achievement.description,
          grade: achievement.grade,
          semester: achievement.semester,
          year: achievement.year,
          certificateUrl: achievement.certificate_url,
          isVerified: achievement.is_verified,
          verifiedBy: achievement.verified_by,
          verifiedAt: achievement.verified_at,
          createdAt: achievement.created_at
        })),
        extracurricularActivities: activitiesResult.rows.map(activity => ({
          id: activity.id,
          activityType: activity.activity_type,
          title: activity.title,
          description: activity.description,
          organization: activity.organization,
          startDate: activity.start_date,
          endDate: activity.end_date,
          position: activity.position,
          certificateUrl: activity.certificate_url,
          isVerified: activity.is_verified,
          verifiedBy: activity.verified_by,
          verifiedAt: activity.verified_at,
          createdAt: activity.created_at
        })),
        projects: projectsResult.rows.map(project => ({
          id: project.id,
          title: project.title,
          description: project.description,
          technologies: project.technologies,
          githubUrl: project.github_url,
          liveUrl: project.live_url,
          startDate: project.start_date,
          endDate: project.end_date,
          isVerified: project.is_verified,
          verifiedBy: project.verified_by,
          verifiedAt: project.verified_at,
          createdAt: project.created_at
        })),
        skills: skillsResult.rows.map(skill => ({
          id: skill.id,
          skillName: skill.skill_name,
          proficiencyLevel: skill.proficiency_level,
          category: skill.category,
          createdAt: skill.created_at
        }))
      }
    });

  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/students/profile
 * @desc    Create or update student profile
 * @access  Private (Student)
 */
router.post('/profile', authenticate, authorize('student'), validateStudentProfile, async (req, res) => {
  try {
    const {
      rollNumber, batch, semester, cgpa, bio,
      linkedinUrl, githubUrl, portfolioUrl
    } = req.body;

    // Check if student profile already exists
    const existingProfile = await pool.query(
      'SELECT id FROM students WHERE user_id = $1',
      [req.user.id]
    );

    if (existingProfile.rows.length > 0) {
      // Update existing profile
      const updateQuery = `
        UPDATE students 
        SET roll_number = $1, batch = $2, semester = $3, cgpa = $4, 
            bio = $5, linkedin_url = $6, github_url = $7, portfolio_url = $8,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $9
        RETURNING *
      `;

      const result = await pool.query(updateQuery, [
        rollNumber, batch, semester, cgpa, bio,
        linkedinUrl, githubUrl, portfolioUrl, req.user.id
      ]);

      res.status(200).json({
        status: 'success',
        message: 'Student profile updated successfully',
        data: { student: result.rows[0] }
      });
    } else {
      // Create new profile
      const insertQuery = `
        INSERT INTO students (user_id, roll_number, batch, semester, cgpa, 
                             bio, linkedin_url, github_url, portfolio_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const result = await pool.query(insertQuery, [
        req.user.id, rollNumber, batch, semester, cgpa,
        bio, linkedinUrl, githubUrl, portfolioUrl
      ]);

      res.status(201).json({
        status: 'success',
        message: 'Student profile created successfully',
        data: { student: result.rows[0] }
      });
    }

  } catch (error) {
    console.error('Create/update student profile error:', error);
    if (error.code === '23505') { // Unique violation
      res.status(409).json({
        status: 'error',
        message: 'Roll number already exists'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }
});

/**
 * @route   POST /api/students/:id/achievements
 * @desc    Add academic achievement
 * @access  Private
 */
router.post('/:id/achievements', authenticate, authorizeStudentAccess, validateAcademicAchievement, async (req, res) => {
  try {
    const studentId = req.params.id;
    const { title, description, grade, semester, year, certificateUrl } = req.body;

    const insertQuery = `
      INSERT INTO academic_achievements (student_id, title, description, grade, semester, year, certificate_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      studentId, title, description, grade, semester, year, certificateUrl
    ]);

    res.status(201).json({
      status: 'success',
      message: 'Academic achievement added successfully',
      data: { achievement: result.rows[0] }
    });

  } catch (error) {
    console.error('Add academic achievement error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/students/:id/activities
 * @desc    Add extracurricular activity
 * @access  Private
 */
router.post('/:id/activities', authenticate, authorizeStudentAccess, validateExtracurricularActivity, async (req, res) => {
  try {
    const studentId = req.params.id;
    const { activityType, title, description, organization, startDate, endDate, position, certificateUrl } = req.body;

    const insertQuery = `
      INSERT INTO extracurricular_activities (student_id, activity_type, title, description, 
                                              organization, start_date, end_date, position, certificate_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      studentId, activityType, title, description, organization, startDate, endDate, position, certificateUrl
    ]);

    res.status(201).json({
      status: 'success',
      message: 'Extracurricular activity added successfully',
      data: { activity: result.rows[0] }
    });

  } catch (error) {
    console.error('Add extracurricular activity error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/students/:id/projects
 * @desc    Add project
 * @access  Private
 */
router.post('/:id/projects', authenticate, authorizeStudentAccess, validateProject, async (req, res) => {
  try {
    const studentId = req.params.id;
    const { title, description, technologies, githubUrl, liveUrl, startDate, endDate } = req.body;

    const insertQuery = `
      INSERT INTO projects (student_id, title, description, technologies, github_url, live_url, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      studentId, title, description, technologies, githubUrl, liveUrl, startDate, endDate
    ]);

    res.status(201).json({
      status: 'success',
      message: 'Project added successfully',
      data: { project: result.rows[0] }
    });

  } catch (error) {
    console.error('Add project error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/students/:id/skills
 * @desc    Add skill
 * @access  Private
 */
router.post('/:id/skills', authenticate, authorizeStudentAccess, validateSkill, async (req, res) => {
  try {
    const studentId = req.params.id;
    const { skillName, proficiencyLevel, category } = req.body;

    const insertQuery = `
      INSERT INTO skills (student_id, skill_name, proficiency_level, category)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [studentId, skillName, proficiencyLevel, category]);

    res.status(201).json({
      status: 'success',
      message: 'Skill added successfully',
      data: { skill: result.rows[0] }
    });

  } catch (error) {
    console.error('Add skill error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   PUT /api/students/:id/achievements/:achievementId
 * @desc    Update academic achievement
 * @access  Private
 */
router.put('/:id/achievements/:achievementId', authenticate, authorizeStudentAccess, validateAcademicAchievement, async (req, res) => {
  try {
    const { achievementId } = req.params;
    const { title, description, grade, semester, year, certificateUrl } = req.body;

    const updateQuery = `
      UPDATE academic_achievements 
      SET title = $1, description = $2, grade = $3, semester = $4, year = $5, certificate_url = $6,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 AND student_id = $8
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      title, description, grade, semester, year, certificateUrl, achievementId, req.params.id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Academic achievement not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Academic achievement updated successfully',
      data: { achievement: result.rows[0] }
    });

  } catch (error) {
    console.error('Update academic achievement error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   DELETE /api/students/:id/achievements/:achievementId
 * @desc    Delete academic achievement
 * @access  Private
 */
router.delete('/:id/achievements/:achievementId', authenticate, authorizeStudentAccess, async (req, res) => {
  try {
    const { achievementId } = req.params;

    const deleteQuery = `
      DELETE FROM academic_achievements 
      WHERE id = $1 AND student_id = $2
      RETURNING id, title
    `;

    const result = await pool.query(deleteQuery, [achievementId, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Academic achievement not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Academic achievement deleted successfully',
      data: { deletedAchievement: result.rows[0] }
    });

  } catch (error) {
    console.error('Delete academic achievement error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   DELETE /api/students/:id/activities/:activityId
 * @desc    Delete extracurricular activity
 * @access  Private
 */
router.delete('/:id/activities/:activityId', authenticate, authorizeStudentAccess, async (req, res) => {
  try {
    const { activityId } = req.params;

    const deleteQuery = `
      DELETE FROM extracurricular_activities 
      WHERE id = $1 AND student_id = $2
      RETURNING id, title
    `;

    const result = await pool.query(deleteQuery, [activityId, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Extracurricular activity not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Extracurricular activity deleted successfully',
      data: { deletedActivity: result.rows[0] }
    });

  } catch (error) {
    console.error('Delete extracurricular activity error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   DELETE /api/students/:id/projects/:projectId
 * @desc    Delete project
 * @access  Private
 */
router.delete('/:id/projects/:projectId', authenticate, authorizeStudentAccess, async (req, res) => {
  try {
    const { projectId } = req.params;

    const deleteQuery = `
      DELETE FROM projects 
      WHERE id = $1 AND student_id = $2
      RETURNING id, title
    `;

    const result = await pool.query(deleteQuery, [projectId, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Project deleted successfully',
      data: { deletedProject: result.rows[0] }
    });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   DELETE /api/students/:id/skills/:skillId
 * @desc    Delete skill
 * @access  Private
 */
router.delete('/:id/skills/:skillId', authenticate, authorizeStudentAccess, async (req, res) => {
  try {
    const { skillId } = req.params;

    const deleteQuery = `
      DELETE FROM skills 
      WHERE id = $1 AND student_id = $2
      RETURNING id, skill_name
    `;

    const result = await pool.query(deleteQuery, [skillId, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Skill not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Skill deleted successfully',
      data: { deletedSkill: result.rows[0] }
    });

  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

module.exports = router;



