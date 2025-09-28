const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { generateToken, generateRefreshToken } = require('../utils/jwt');
const { authenticate } = require('../middleware/auth');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, phone, department, batch } = req.body;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const userQuery = `
      INSERT INTO users (email, password, first_name, last_name, role, phone, department, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, email, role, first_name, last_name, phone, department, is_active, created_at
    `;

    const result = await pool.query(userQuery, [
      email,
      hashedPassword,
      firstName,
      lastName,
      role,
      phone || null,
      department || null,
      // Require approval for students; auto-activate faculty/admin
      role === 'student' ? false : true
    ]);

    const user = result.rows[0];

    // Do not auto-create student record here since roll_number is required.

    // Generate tokens
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
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
          createdAt: user.created_at
        },
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during registration'
    });
  }
});

/**
 * @route   GET /api/auth/lookup
 * @desc    Lookup a user by email (for pre-login greeting)
 * @access  Public
 */
router.get('/lookup', async (req, res) => {
  try {
    const email = (req.query.email || '').toLowerCase();
    if (!email) {
      return res.status(400).json({ status: 'error', message: 'Email is required' });
    }
    const result = await pool.query(
      'SELECT first_name, last_name, role, is_active FROM users WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    const row = result.rows[0];
    return res.status(200).json({
      status: 'success',
      data: {
        firstName: row.first_name,
        lastName: row.last_name,
        role: row.role,
        isActive: row.is_active
      }
    });
  } catch (error) {
    console.error('Lookup error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with student info
    const userQuery = `
      SELECT u.id, u.email, u.password, u.role, u.first_name, u.last_name, 
             u.phone, u.department, u.is_active,
             s.id as student_id, s.roll_number, s.batch, s.semester, s.cgpa
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      WHERE u.email = $1
    `;

    const result = await pool.query(userQuery, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Generate tokens
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Remove password from response
    delete user.password;

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          phone: user.phone,
          department: user.department,
          studentId: user.student_id,
          rollNumber: user.roll_number,
          batch: user.batch,
          semester: user.semester,
          cgpa: user.cgpa
        },
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during login'
    });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        status: 'error',
        message: 'Refresh token is required'
      });
    }

    const { verifyToken } = require('../utils/jwt');
    const decoded = verifyToken(refreshToken);

    // Get user info
    const userQuery = `
      SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.is_active
      FROM users u
      WHERE u.id = $1 AND u.is_active = true
    `;

    const result = await pool.query(userQuery, [decoded.id]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid refresh token'
      });
    }

    const user = result.rows[0];

    // Generate new tokens
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const newToken = generateToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    res.status(200).json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      status: 'error',
      message: 'Invalid refresh token'
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const userQuery = `
      SELECT u.id, u.email, u.role, u.first_name, u.last_name, 
             u.phone, u.department, u.created_at,
             s.id as student_id, s.roll_number, s.batch, s.semester, s.cgpa,
             s.bio, s.linkedin_url, s.github_url, s.portfolio_url
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      WHERE u.id = $1
    `;

    const result = await pool.query(userQuery, [req.user.id]);
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
          createdAt: user.created_at,
          studentId: user.student_id,
          rollNumber: user.roll_number,
          batch: user.batch,
          semester: user.semester,
          cgpa: user.cgpa,
          bio: user.bio,
          linkedinUrl: user.linkedin_url,
          githubUrl: user.github_url,
          portfolioUrl: user.portfolio_url
        }
      }
    });

  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/logout', authenticate, (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

module.exports = router;


