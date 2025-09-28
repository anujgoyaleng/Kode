const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
const { pool } = require('../config/database');

/**
 * Authentication middleware
 * Verifies JWT token and adds user info to request object
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      console.log('No authorization header provided');
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. No token provided.'
      });
    }

    const token = extractTokenFromHeader(authHeader);
    console.log('Token extracted, length:', token.length);
    const decoded = verifyToken(token);
    console.log('Token decoded for user ID:', decoded.id);

    // Get user from database
    const userQuery = `
      SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.department, u.is_active,
             s.id as student_id, s.roll_number, s.batch, s.semester
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      WHERE u.id = $1 AND u.is_active = true
    `;
    
    const result = await pool.query(userQuery, [decoded.id]);
    console.log('User query result:', result.rows.length, 'rows found');
    
    if (result.rows.length === 0) {
      console.log('User not found in database for ID:', decoded.id);
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token. User not found.'
      });
    }

    req.user = result.rows[0];
    console.log('User authenticated:', req.user.email, 'role:', req.user.role);
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: error.message || 'Invalid token'
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {Array} allowedRoles - Array of allowed roles
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    console.log('Authorization check - User role:', req.user?.role, 'Allowed roles:', allowedRoles);
    
    if (!req.user) {
      console.log('No user found in request');
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.log('Access denied - User role not in allowed roles');
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Insufficient permissions.'
      });
    }

    console.log('Authorization successful');
    next();
  };
};

/**
 * Student-specific authorization
 * Allows access if user is the student themselves or has faculty/admin role
 */
const authorizeStudentAccess = async (req, res, next) => {
  try {
    const studentId = req.params.studentId || req.params.id;
    
    if (!studentId) {
      return res.status(400).json({
        status: 'error',
        message: 'Student ID is required'
      });
    }

    // Faculty and admin can access any student
    if (['faculty', 'admin'].includes(req.user.role)) {
      return next();
    }

    // Students can only access their own data
    if (req.user.role === 'student') {
      if (req.user.student_id !== parseInt(studentId)) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. You can only access your own data.'
        });
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Authorization error'
    });
  }
};

/**
 * Optional authentication middleware
 * Similar to authenticate but doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      req.user = null;
      return next();
    }

    const token = extractTokenFromHeader(authHeader);
    const decoded = verifyToken(token);

    const userQuery = `
      SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.department, u.is_active,
             s.id as student_id, s.roll_number, s.batch, s.semester
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      WHERE u.id = $1 AND u.is_active = true
    `;
    
    const result = await pool.query(userQuery, [decoded.id]);
    
    if (result.rows.length > 0) {
      req.user = result.rows[0];
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  authorizeStudentAccess,
  optionalAuth
};


