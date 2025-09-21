const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation result handler
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * User registration validation
 */
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('role')
    .isIn(['student', 'faculty', 'admin'])
    .withMessage('Role must be student, faculty, or admin'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department name must not exceed 100 characters'),
  handleValidationErrors
];

/**
 * User login validation
 */
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

/**
 * Student profile validation
 */
const validateStudentProfile = [
  body('rollNumber')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Roll number must be between 3 and 50 characters'),
  body('batch')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Batch must not exceed 20 characters'),
  body('semester')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Semester must be between 1 and 12'),
  body('cgpa')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('CGPA must be between 0 and 10'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Bio must not exceed 1000 characters'),
  body('linkedinUrl')
    .optional()
    .isURL()
    .withMessage('Please provide a valid LinkedIn URL'),
  body('githubUrl')
    .optional()
    .isURL()
    .withMessage('Please provide a valid GitHub URL'),
  body('portfolioUrl')
    .optional()
    .isURL()
    .withMessage('Please provide a valid portfolio URL'),
  handleValidationErrors
];

/**
 * Academic achievement validation
 */
const validateAcademicAchievement = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('grade')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('Grade must not exceed 10 characters'),
  body('semester')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Semester must not exceed 20 characters'),
  body('year')
    .optional()
    .isInt({ min: 2000, max: 2030 })
    .withMessage('Year must be between 2000 and 2030'),
  handleValidationErrors
];

/**
 * Extracurricular activity validation
 */
const validateExtracurricularActivity = [
  body('activityType')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Activity type must be between 3 and 100 characters'),
  body('title')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('organization')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Organization must not exceed 255 characters'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end date'),
  body('position')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Position must not exceed 100 characters'),
  handleValidationErrors
];

/**
 * Project validation
 */
const validateProject = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('technologies')
    .optional()
    .isArray()
    .withMessage('Technologies must be an array'),
  body('githubUrl')
    .optional()
    .isURL()
    .withMessage('Please provide a valid GitHub URL'),
  body('liveUrl')
    .optional()
    .isURL()
    .withMessage('Please provide a valid live URL'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end date'),
  handleValidationErrors
];

/**
 * Skill validation
 */
const validateSkill = [
  body('skillName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Skill name must be between 2 and 100 characters'),
  body('proficiencyLevel')
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .withMessage('Proficiency level must be beginner, intermediate, advanced, or expert'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category must not exceed 50 characters'),
  handleValidationErrors
];

/**
 * ID parameter validation
 */
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
  handleValidationErrors
];

/**
 * Pagination validation
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateStudentProfile,
  validateAcademicAchievement,
  validateExtracurricularActivity,
  validateProject,
  validateSkill,
  validateId,
  validatePagination
};


