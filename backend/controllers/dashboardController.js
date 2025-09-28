const { pool } = require('../config/database');

/**
 * Get admin dashboard statistics
 */
const getAdminStats = async (req, res) => {
  try {
    // Total users by role
    const userStatsQuery = `
      SELECT role, COUNT(*) as count
      FROM users
      WHERE is_active = true
      GROUP BY role
    `;

    const userStatsResult = await pool.query(userStatsQuery);
    const userStats = userStatsResult.rows.reduce((acc, row) => {
      acc[row.role] = parseInt(row.count);
      return acc;
    }, {});

    // Total activities
    const activitiesQuery = `
      SELECT
        COUNT(*) as total_activities,
        COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_activities,
        COUNT(CASE WHEN is_verified = false THEN 1 END) as pending_activities
      FROM (
        SELECT is_verified FROM academic_achievements
        UNION ALL
        SELECT is_verified FROM extracurricular_activities
        UNION ALL
        SELECT is_verified FROM projects
      ) as all_activities
    `;

    const activitiesResult = await pool.query(activitiesQuery);
    const activities = activitiesResult.rows[0];

    // Recent activities (last 30 days)
    const recentActivitiesQuery = `
      SELECT COUNT(*) as recent_activities
      FROM (
        SELECT created_at FROM academic_achievements WHERE created_at >= NOW() - INTERVAL '30 days'
        UNION ALL
        SELECT created_at FROM extracurricular_activities WHERE created_at >= NOW() - INTERVAL '30 days'
        UNION ALL
        SELECT created_at FROM projects WHERE created_at >= NOW() - INTERVAL '30 days'
      ) as recent
    `;

    const recentResult = await pool.query(recentActivitiesQuery);
    const recentActivities = recentResult.rows[0].recent_activities;

    res.status(200).json({
      status: 'success',
      data: {
        userStats,
        activities: {
          total: parseInt(activities.total_activities),
          verified: parseInt(activities.verified_activities),
          pending: parseInt(activities.pending_activities)
        },
        recentActivities: parseInt(recentActivities)
      }
    });

  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Get employee (student) dashboard statistics
 */
const getEmployeeStats = async (req, res) => {
  try {
    const studentId = req.user.student_id;

    if (!studentId) {
      return res.status(400).json({
        status: 'error',
        message: 'Student profile not found'
      });
    }

    // User's activities stats
    const activitiesQuery = `
      SELECT
        COUNT(*) as total_activities,
        COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_activities,
        COUNT(CASE WHEN is_verified = false THEN 1 END) as pending_activities
      FROM (
        SELECT is_verified FROM academic_achievements WHERE student_id = $1
        UNION ALL
        SELECT is_verified FROM extracurricular_activities WHERE student_id = $1
        UNION ALL
        SELECT is_verified FROM projects WHERE student_id = $1
      ) as user_activities
    `;

    const activitiesResult = await pool.query(activitiesQuery, [studentId]);
    const activities = activitiesResult.rows[0];

    // Skills count
    const skillsQuery = 'SELECT COUNT(*) as skills_count FROM skills WHERE student_id = $1';
    const skillsResult = await pool.query(skillsQuery, [studentId]);
    const skillsCount = skillsResult.rows[0].skills_count;

    // Certificates count
    const certificatesQuery = 'SELECT COUNT(*) as certificates_count FROM certificates WHERE student_id = $1';
    const certificatesResult = await pool.query(certificatesQuery, [studentId]);
    const certificatesCount = certificatesResult.rows[0].certificates_count;

    res.status(200).json({
      status: 'success',
      data: {
        activities: {
          total: parseInt(activities.total_activities),
          verified: parseInt(activities.verified_activities),
          pending: parseInt(activities.pending_activities)
        },
        skillsCount: parseInt(skillsCount),
        certificatesCount: parseInt(certificatesCount)
      }
    });

  } catch (error) {
    console.error('Get employee stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Get user notifications
 */
const getNotifications = async (req, res) => {
  try {
    // For simplicity, return pending verifications for faculty, or verification status for students
    let notifications = [];

    if (req.user.role === 'faculty' || req.user.role === 'admin') {
      // Pending activities to verify
      const pendingQuery = `
        SELECT
          'academic' as type,
          title,
          created_at,
          student_id
        FROM academic_achievements
        WHERE is_verified = false
        UNION ALL
        SELECT
          'extracurricular' as type,
          title,
          created_at,
          student_id
        FROM extracurricular_activities
        WHERE is_verified = false
        UNION ALL
        SELECT
          'project' as type,
          title,
          created_at,
          student_id
        FROM projects
        WHERE is_verified = false
        ORDER BY created_at DESC
        LIMIT 10
      `;

      const pendingResult = await pool.query(pendingQuery);
      notifications = pendingResult.rows.map(row => ({
        id: `${row.type}_${row.student_id}_${row.created_at}`,
        type: 'pending_verification',
        message: `New ${row.type} activity "${row.title}" pending verification`,
        createdAt: row.created_at,
        read: false
      }));
    } else if (req.user.role === 'student' && req.user.student_id) {
      // Recent verifications
      const verificationQuery = `
        SELECT
          'academic' as type,
          title,
          verified_at,
          is_verified
        FROM academic_achievements
        WHERE student_id = $1 AND verified_at IS NOT NULL
        UNION ALL
        SELECT
          'extracurricular' as type,
          title,
          verified_at,
          is_verified
        FROM extracurricular_activities
        WHERE student_id = $1 AND verified_at IS NOT NULL
        UNION ALL
        SELECT
          'project' as type,
          title,
          verified_at,
          is_verified
        FROM projects
        WHERE student_id = $1 AND verified_at IS NOT NULL
        ORDER BY verified_at DESC
        LIMIT 10
      `;

      const verificationResult = await pool.query(verificationQuery, [req.user.student_id]);
      notifications = verificationResult.rows.map(row => ({
        id: `${row.type}_${req.user.student_id}_${row.verified_at}`,
        type: row.is_verified ? 'verified' : 'rejected',
        message: `Your ${row.type} activity "${row.title}" has been ${row.is_verified ? 'verified' : 'rejected'}`,
        createdAt: row.verified_at,
        read: false
      }));
    }

    res.status(200).json({
      status: 'success',
      data: {
        notifications
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Mark notification as read
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    // For now, just return success (in a real app, you'd update a notifications table)
    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAdminStats,
  getEmployeeStats,
  getNotifications,
  markNotificationAsRead
};
