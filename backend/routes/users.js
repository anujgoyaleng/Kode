const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { validateId, validatePagination } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   GET /api/users
 * @desc    Get all users (Admin only)
 * @access  Private (Admin)
 */
router.get('/', authenticate, authorize('admin'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
  const role = req.query.role;
  const search = req.query.search;

    let query = `
      SELECT u.id, u.email, u.role, u.first_name, u.last_name, 
             u.phone, u.department, u.is_active, u.created_at,
             s.id as student_id, s.roll_number, s.batch, s.semester, s.section
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
    `;
    
    const queryParams = [];
    const conditions = [];

    if (role) {
      conditions.push(`u.role = $${queryParams.length + 1}`);
      queryParams.push(role);
    }

    if (search) {
      conditions.push(`(u.first_name ILIKE $${queryParams.length + 1} OR u.last_name ILIKE $${queryParams.length + 1} OR u.email ILIKE $${queryParams.length + 1})`);
      queryParams.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY u.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM users u';
    const countParams = [];
    const countConds = [];
    if (role) {
      countConds.push(`u.role = $${countParams.length + 1}`);
      countParams.push(role);
    }
    if (search) {
      countConds.push(`(u.first_name ILIKE $${countParams.length + 1} OR u.last_name ILIKE $${countParams.length + 1} OR u.email ILIKE $${countParams.length + 1})`);
      countParams.push(`%${search}%`);
    }
    if (countConds.length > 0) {
      countQuery += ` WHERE ${countConds.join(' AND ')}`;
    }
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.status(200).json({
      status: 'success',
      data: {
        users: result.rows.map(user => ({
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          phone: user.phone,
          department: user.department,
          isActive: user.is_active,
          createdAt: user.created_at,
          studentId: user.student_id,
          rollNumber: user.roll_number,
          batch: user.batch,
          semester: user.semester,
          section: user.section
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
    console.error('Get users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', authenticate, validateId, async (req, res) => {
  try {
    const userId = req.params.id;

    // Users can only view their own profile unless they're admin/faculty
    if (req.user.role === 'student' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only view your own profile.'
      });
    }

    const userQuery = `
      SELECT u.id, u.email, u.role, u.first_name, u.last_name, 
             u.phone, u.department, u.is_active, u.created_at,
             s.id as student_id, s.roll_number, s.batch, s.semester, s.cgpa,
             s.bio, s.linkedin_url, s.github_url, s.portfolio_url
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      WHERE u.id = $1
    `;

    const result = await pool.query(userQuery, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          phone: user.phone,
          department: user.department,
          isActive: user.is_active,
          createdAt: user.created_at,
          studentId: user.student_id,
          rollNumber: user.roll_number,
          batch: user.batch,
          semester: user.semester,
          cgpa: user.cgpa,
          bio: user.bio,
          linkedinUrl: user.linkedin_url,
          githubUrl: user.github_url,
          portfolioUrl: user.portfolio_url,
          section: user.section
        }
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile
 * @access  Private
 */
router.put('/:id', authenticate, validateId, async (req, res) => {
  try {
    const userId = req.params.id;
    const { firstName, lastName, phone, department } = req.body;

    // Users can only update their own profile unless they're admin
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only update your own profile.'
      });
    }

    const updateQuery = `
      UPDATE users 
      SET first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          phone = COALESCE($3, phone),
          department = COALESCE($4, department),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, email, role, first_name, last_name, phone, department, updated_at
    `;

    const result = await pool.query(updateQuery, [
      firstName || null,
      lastName || null,
      phone || null,
      department || null,
      userId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          phone: user.phone,
          department: user.department,
          updatedAt: user.updated_at
        }
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   PUT /api/users/:id/password
 * @desc    Update user password
 * @access  Private
 */
router.put('/:id/password', authenticate, validateId, async (req, res) => {
  try {
    const userId = req.params.id;
    const { currentPassword, newPassword } = req.body;

    // Users can only update their own password
    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only update your own password.'
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get current password hash
    const userQuery = 'SELECT password FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userResult.rows[0].password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const updateQuery = `
      UPDATE users 
      SET password = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;

    await pool.query(updateQuery, [hashedNewPassword, userId]);

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   PUT /api/users/:id/status
 * @desc    Update user active status (Admin only)
 * @access  Private (Admin)
 */
router.put('/:id/status', authenticate, authorize('admin'), validateId, async (req, res) => {
  try {
    const userId = req.params.id;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        status: 'error',
        message: 'isActive must be a boolean value'
      });
    }

    // Prevent admin from deactivating themselves
    if (req.user.id === parseInt(userId)) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot deactivate your own account'
      });
    }

    const updateQuery = `
      UPDATE users 
      SET is_active = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, email, first_name, last_name, role, is_active
    `;

    const result = await pool.query(updateQuery, [isActive, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    res.status(200).json({
      status: 'success',
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          isActive: user.is_active
        }
      }
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (Admin only)
 * @access  Private (Admin)
 */
router.delete('/:id', authenticate, authorize('admin'), validateId, async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (req.user.id === parseInt(userId)) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot delete your own account'
      });
    }

    const deleteQuery = 'DELETE FROM users WHERE id = $1 RETURNING id, email, first_name, last_name';
    const result = await pool.query(deleteQuery, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const deletedUser = result.rows[0];

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully',
      data: {
        deletedUser: {
          id: deletedUser.id,
          email: deletedUser.email,
          firstName: deletedUser.first_name,
          lastName: deletedUser.last_name
        }
      }
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

module.exports = router;


