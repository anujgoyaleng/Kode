const express = require('express');
const { pool } = require('../config/database');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   GET /api/analytics/overview
 * @desc    Get analytics overview (public stats)
 * @access  Public
 */
router.get('/overview', optionalAuth, async (req, res) => {
  try {
    // Get total students count
    const studentsCountQuery = `
      SELECT COUNT(*) as total_students
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE u.is_active = true
    `;
    const studentsCountResult = await pool.query(studentsCountQuery);

    // Get total achievements count
    const achievementsCountQuery = `
      SELECT COUNT(*) as total_achievements
      FROM academic_achievements
    `;
    const achievementsCountResult = await pool.query(achievementsCountQuery);

    // Get total activities count
    const activitiesCountQuery = `
      SELECT COUNT(*) as total_activities
      FROM extracurricular_activities
    `;
    const activitiesCountResult = await pool.query(activitiesCountQuery);

    // Get total projects count
    const projectsCountQuery = `
      SELECT COUNT(*) as total_projects
      FROM projects
    `;
    const projectsCountResult = await pool.query(projectsCountQuery);

    // Get department distribution
    const departmentStatsQuery = `
      SELECT u.department, COUNT(*) as student_count
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE u.is_active = true AND u.department IS NOT NULL
      GROUP BY u.department
      ORDER BY student_count DESC
      LIMIT 10
    `;
    const departmentStatsResult = await pool.query(departmentStatsQuery);

    // Get batch distribution
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
        overview: {
          totalStudents: parseInt(studentsCountResult.rows[0].total_students),
          totalAchievements: parseInt(achievementsCountResult.rows[0].total_achievements),
          totalActivities: parseInt(activitiesCountResult.rows[0].total_activities),
          totalProjects: parseInt(projectsCountResult.rows[0].total_projects),
          departmentDistribution: departmentStatsResult.rows.map(dept => ({
            department: dept.department,
            studentCount: parseInt(dept.student_count)
          })),
          batchDistribution: batchStatsResult.rows.map(batch => ({
            batch: batch.batch,
            studentCount: parseInt(batch.student_count)
          }))
        }
      }
    });

  } catch (error) {
    console.error('Get analytics overview error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/analytics/students
 * @desc    Get student analytics
 * @access  Private (Faculty/Admin)
 */
router.get('/students', authenticate, authorize('faculty', 'admin'), async (req, res) => {
  try {
    // CGPA distribution
    const cgpaStatsQuery = `
      SELECT 
        CASE 
          WHEN s.cgpa >= 9.0 THEN '9.0-10.0'
          WHEN s.cgpa >= 8.0 THEN '8.0-8.9'
          WHEN s.cgpa >= 7.0 THEN '7.0-7.9'
          WHEN s.cgpa >= 6.0 THEN '6.0-6.9'
          WHEN s.cgpa >= 5.0 THEN '5.0-5.9'
          ELSE 'Below 5.0'
        END as cgpa_range,
        COUNT(*) as student_count
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE u.is_active = true AND s.cgpa IS NOT NULL
      GROUP BY cgpa_range
      ORDER BY cgpa_range DESC
    `;
    const cgpaStatsResult = await pool.query(cgpaStatsQuery);

    // Semester distribution
    const semesterStatsQuery = `
      SELECT s.semester, COUNT(*) as student_count
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE u.is_active = true AND s.semester IS NOT NULL
      GROUP BY s.semester
      ORDER BY s.semester
    `;
    const semesterStatsResult = await pool.query(semesterStatsQuery);

    // Portfolio completion stats
    const portfolioStatsQuery = `
      SELECT 
        COUNT(*) as total_students,
        COUNT(CASE WHEN aa.id IS NOT NULL THEN 1 END) as students_with_achievements,
        COUNT(CASE WHEN ea.id IS NOT NULL THEN 1 END) as students_with_activities,
        COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) as students_with_projects,
        COUNT(CASE WHEN c.id IS NOT NULL THEN 1 END) as students_with_certificates
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN academic_achievements aa ON s.id = aa.student_id
      LEFT JOIN extracurricular_activities ea ON s.id = ea.student_id
      LEFT JOIN projects p ON s.id = p.student_id
      LEFT JOIN certificates c ON s.id = c.student_id
      WHERE u.is_active = true
    `;
    const portfolioStatsResult = await pool.query(portfolioStatsQuery);

    // Top performing students (by CGPA)
    const topStudentsQuery = `
      SELECT s.id, s.roll_number, s.cgpa, u.first_name, u.last_name, u.department
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE u.is_active = true AND s.cgpa IS NOT NULL
      ORDER BY s.cgpa DESC
      LIMIT 10
    `;
    const topStudentsResult = await pool.query(topStudentsQuery);

    res.status(200).json({
      status: 'success',
      data: {
        studentAnalytics: {
          cgpaDistribution: cgpaStatsResult.rows.map(stat => ({
            range: stat.cgpa_range,
            studentCount: parseInt(stat.student_count)
          })),
          semesterDistribution: semesterStatsResult.rows.map(stat => ({
            semester: stat.semester,
            studentCount: parseInt(stat.student_count)
          })),
          portfolioCompletion: {
            totalStudents: parseInt(portfolioStatsResult.rows[0].total_students),
            studentsWithAchievements: parseInt(portfolioStatsResult.rows[0].students_with_achievements),
            studentsWithActivities: parseInt(portfolioStatsResult.rows[0].students_with_activities),
            studentsWithProjects: parseInt(portfolioStatsResult.rows[0].students_with_projects),
            studentsWithCertificates: parseInt(portfolioStatsResult.rows[0].students_with_certificates)
          },
          topStudents: topStudentsResult.rows.map(student => ({
            id: student.id,
            rollNumber: student.roll_number,
            name: `${student.first_name} ${student.last_name}`,
            cgpa: student.cgpa,
            department: student.department
          }))
        }
      }
    });

  } catch (error) {
    console.error('Get student analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/analytics/achievements
 * @desc    Get achievements analytics
 * @access  Private (Faculty/Admin)
 */
router.get('/achievements', authenticate, authorize('faculty', 'admin'), async (req, res) => {
  try {
    // Achievement verification stats
    const verificationStatsQuery = `
      SELECT 
        COUNT(*) as total_achievements,
        COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_achievements,
        COUNT(CASE WHEN is_verified = false THEN 1 END) as pending_achievements
      FROM academic_achievements
    `;
    const verificationStatsResult = await pool.query(verificationStatsQuery);

    // Achievements by year
    const yearStatsQuery = `
      SELECT year, COUNT(*) as achievement_count
      FROM academic_achievements
      WHERE year IS NOT NULL
      GROUP BY year
      ORDER BY year DESC
    `;
    const yearStatsResult = await pool.query(yearStatsQuery);

    // Achievements by semester
    const semesterStatsQuery = `
      SELECT semester, COUNT(*) as achievement_count
      FROM academic_achievements
      WHERE semester IS NOT NULL
      GROUP BY semester
      ORDER BY semester
    `;
    const semesterStatsResult = await pool.query(semesterStatsQuery);

    // Top achievement titles
    const topAchievementsQuery = `
      SELECT title, COUNT(*) as count
      FROM academic_achievements
      GROUP BY title
      ORDER BY count DESC
      LIMIT 10
    `;
    const topAchievementsResult = await pool.query(topAchievementsQuery);

    res.status(200).json({
      status: 'success',
      data: {
        achievementAnalytics: {
          verificationStats: {
            total: parseInt(verificationStatsResult.rows[0].total_achievements),
            verified: parseInt(verificationStatsResult.rows[0].verified_achievements),
            pending: parseInt(verificationStatsResult.rows[0].pending_achievements)
          },
          yearDistribution: yearStatsResult.rows.map(stat => ({
            year: stat.year,
            achievementCount: parseInt(stat.achievement_count)
          })),
          semesterDistribution: semesterStatsResult.rows.map(stat => ({
            semester: stat.semester,
            achievementCount: parseInt(stat.achievement_count)
          })),
          topAchievements: topAchievementsResult.rows.map(achievement => ({
            title: achievement.title,
            count: parseInt(achievement.count)
          }))
        }
      }
    });

  } catch (error) {
    console.error('Get achievements analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/analytics/activities
 * @desc    Get activities analytics
 * @access  Private (Faculty/Admin)
 */
router.get('/activities', authenticate, authorize('faculty', 'admin'), async (req, res) => {
  try {
    // Activity verification stats
    const verificationStatsQuery = `
      SELECT 
        COUNT(*) as total_activities,
        COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_activities,
        COUNT(CASE WHEN is_verified = false THEN 1 END) as pending_activities
      FROM extracurricular_activities
    `;
    const verificationStatsResult = await pool.query(verificationStatsQuery);

    // Activities by type
    const activityTypeStatsQuery = `
      SELECT activity_type, COUNT(*) as activity_count
      FROM extracurricular_activities
      GROUP BY activity_type
      ORDER BY activity_count DESC
    `;
    const activityTypeStatsResult = await pool.query(activityTypeStatsQuery);

    // Activities by organization
    const organizationStatsQuery = `
      SELECT organization, COUNT(*) as activity_count
      FROM extracurricular_activities
      WHERE organization IS NOT NULL
      GROUP BY organization
      ORDER BY activity_count DESC
      LIMIT 10
    `;
    const organizationStatsResult = await pool.query(organizationStatsQuery);

    // Activities by position
    const positionStatsQuery = `
      SELECT position, COUNT(*) as activity_count
      FROM extracurricular_activities
      WHERE position IS NOT NULL
      GROUP BY position
      ORDER BY activity_count DESC
      LIMIT 10
    `;
    const positionStatsResult = await pool.query(positionStatsQuery);

    res.status(200).json({
      status: 'success',
      data: {
        activityAnalytics: {
          verificationStats: {
            total: parseInt(verificationStatsResult.rows[0].total_activities),
            verified: parseInt(verificationStatsResult.rows[0].verified_activities),
            pending: parseInt(verificationStatsResult.rows[0].pending_activities)
          },
          activityTypeDistribution: activityTypeStatsResult.rows.map(stat => ({
            activityType: stat.activity_type,
            activityCount: parseInt(stat.activity_count)
          })),
          organizationDistribution: organizationStatsResult.rows.map(stat => ({
            organization: stat.organization,
            activityCount: parseInt(stat.activity_count)
          })),
          positionDistribution: positionStatsResult.rows.map(stat => ({
            position: stat.position,
            activityCount: parseInt(stat.activity_count)
          }))
        }
      }
    });

  } catch (error) {
    console.error('Get activities analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/analytics/projects
 * @desc    Get projects analytics
 * @access  Private (Faculty/Admin)
 */
router.get('/projects', authenticate, authorize('faculty', 'admin'), async (req, res) => {
  try {
    // Project verification stats
    const verificationStatsQuery = `
      SELECT 
        COUNT(*) as total_projects,
        COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_projects,
        COUNT(CASE WHEN is_verified = false THEN 1 END) as pending_projects
      FROM projects
    `;
    const verificationStatsResult = await pool.query(verificationStatsQuery);

    // Technologies used
    const technologiesQuery = `
      SELECT unnest(technologies) as technology, COUNT(*) as project_count
      FROM projects
      WHERE technologies IS NOT NULL
      GROUP BY technology
      ORDER BY project_count DESC
      LIMIT 20
    `;
    const technologiesResult = await pool.query(technologiesQuery);

    // Projects with live URLs
    const liveProjectsQuery = `
      SELECT 
        COUNT(*) as total_projects,
        COUNT(CASE WHEN live_url IS NOT NULL THEN 1 END) as projects_with_live_url,
        COUNT(CASE WHEN github_url IS NOT NULL THEN 1 END) as projects_with_github_url
      FROM projects
    `;
    const liveProjectsResult = await pool.query(liveProjectsQuery);

    // Top project titles
    const topProjectsQuery = `
      SELECT title, COUNT(*) as count
      FROM projects
      GROUP BY title
      ORDER BY count DESC
      LIMIT 10
    `;
    const topProjectsResult = await pool.query(topProjectsQuery);

    res.status(200).json({
      status: 'success',
      data: {
        projectAnalytics: {
          verificationStats: {
            total: parseInt(verificationStatsResult.rows[0].total_projects),
            verified: parseInt(verificationStatsResult.rows[0].verified_projects),
            pending: parseInt(verificationStatsResult.rows[0].pending_projects)
          },
          technologyDistribution: technologiesResult.rows.map(stat => ({
            technology: stat.technology,
            projectCount: parseInt(stat.project_count)
          })),
          projectUrls: {
            total: parseInt(liveProjectsResult.rows[0].total_projects),
            withLiveUrl: parseInt(liveProjectsResult.rows[0].projects_with_live_url),
            withGithubUrl: parseInt(liveProjectsResult.rows[0].projects_with_github_url)
          },
          topProjects: topProjectsResult.rows.map(project => ({
            title: project.title,
            count: parseInt(project.count)
          }))
        }
      }
    });

  } catch (error) {
    console.error('Get projects analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/analytics/skills
 * @desc    Get skills analytics
 * @access  Private (Faculty/Admin)
 */
router.get('/skills', authenticate, authorize('faculty', 'admin'), async (req, res) => {
  try {
    // Skills by category
    const categoryStatsQuery = `
      SELECT category, COUNT(*) as skill_count
      FROM skills
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY skill_count DESC
    `;
    const categoryStatsResult = await pool.query(categoryStatsQuery);

    // Skills by proficiency level
    const proficiencyStatsQuery = `
      SELECT proficiency_level, COUNT(*) as skill_count
      FROM skills
      GROUP BY proficiency_level
      ORDER BY skill_count DESC
    `;
    const proficiencyStatsResult = await pool.query(proficiencyStatsQuery);

    // Top skills
    const topSkillsQuery = `
      SELECT skill_name, COUNT(*) as count
      FROM skills
      GROUP BY skill_name
      ORDER BY count DESC
      LIMIT 20
    `;
    const topSkillsResult = await pool.query(topSkillsQuery);

    // Skills per student
    const skillsPerStudentQuery = `
      SELECT 
        COUNT(DISTINCT student_id) as students_with_skills,
        COUNT(*) as total_skills,
        ROUND(AVG(skill_count), 2) as avg_skills_per_student
      FROM (
        SELECT student_id, COUNT(*) as skill_count
        FROM skills
        GROUP BY student_id
      ) student_skills
    `;
    const skillsPerStudentResult = await pool.query(skillsPerStudentQuery);

    res.status(200).json({
      status: 'success',
      data: {
        skillAnalytics: {
          categoryDistribution: categoryStatsResult.rows.map(stat => ({
            category: stat.category,
            skillCount: parseInt(stat.skill_count)
          })),
          proficiencyDistribution: proficiencyStatsResult.rows.map(stat => ({
            proficiencyLevel: stat.proficiency_level,
            skillCount: parseInt(stat.skill_count)
          })),
          topSkills: topSkillsResult.rows.map(skill => ({
            skillName: skill.skill_name,
            count: parseInt(skill.count)
          })),
          studentSkills: {
            studentsWithSkills: parseInt(skillsPerStudentResult.rows[0].students_with_skills),
            totalSkills: parseInt(skillsPerStudentResult.rows[0].total_skills),
            avgSkillsPerStudent: parseFloat(skillsPerStudentResult.rows[0].avg_skills_per_student)
          }
        }
      }
    });

  } catch (error) {
    console.error('Get skills analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/analytics/trends
 * @desc    Get trends over time
 * @access  Private (Faculty/Admin)
 */
router.get('/trends', authenticate, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const { period = 'month' } = req.query; // month, week, day

    let dateFormat, interval;
    switch (period) {
      case 'week':
        dateFormat = 'YYYY-"W"WW';
        interval = '1 week';
        break;
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        interval = '1 day';
        break;
      default:
        dateFormat = 'YYYY-MM';
        interval = '1 month';
    }

    // Student registrations over time
    const registrationsQuery = `
      SELECT 
        TO_CHAR(u.created_at, $1) as period,
        COUNT(*) as registrations
      FROM users u
      WHERE u.created_at >= NOW() - INTERVAL '12 months'
      GROUP BY period
      ORDER BY period
    `;
    const registrationsResult = await pool.query(registrationsQuery, [dateFormat]);

    // Achievements over time
    const achievementsQuery = `
      SELECT 
        TO_CHAR(created_at, $1) as period,
        COUNT(*) as achievements
      FROM academic_achievements
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY period
      ORDER BY period
    `;
    const achievementsResult = await pool.query(achievementsQuery, [dateFormat]);

    // Activities over time
    const activitiesQuery = `
      SELECT 
        TO_CHAR(created_at, $1) as period,
        COUNT(*) as activities
      FROM extracurricular_activities
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY period
      ORDER BY period
    `;
    const activitiesResult = await pool.query(activitiesQuery, [dateFormat]);

    // Projects over time
    const projectsQuery = `
      SELECT 
        TO_CHAR(created_at, $1) as period,
        COUNT(*) as projects
      FROM projects
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY period
      ORDER BY period
    `;
    const projectsResult = await pool.query(projectsQuery, [dateFormat]);

    res.status(200).json({
      status: 'success',
      data: {
        trends: {
          period: period,
          registrations: registrationsResult.rows.map(trend => ({
            period: trend.period,
            count: parseInt(trend.registrations)
          })),
          achievements: achievementsResult.rows.map(trend => ({
            period: trend.period,
            count: parseInt(trend.achievements)
          })),
          activities: activitiesResult.rows.map(trend => ({
            period: trend.period,
            count: parseInt(trend.activities)
          })),
          projects: projectsResult.rows.map(trend => ({
            period: trend.period,
            count: parseInt(trend.projects)
          }))
        }
      }
    });

  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

module.exports = router;


