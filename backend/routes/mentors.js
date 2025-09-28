const express = require('express');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get current section mentors and list of faculties
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const faculties = await pool.query(`
      SELECT id, first_name, last_name, email FROM users WHERE role = 'faculty' AND is_active = true ORDER BY first_name, last_name
    `);
    const mentors = await pool.query(`
      SELECT section, faculty_user_id FROM section_mentors
    `);
    res.status(200).json({
      status: 'success',
      data: {
        faculties: faculties.rows,
        mentors: mentors.rows
      }
    });
  } catch (error) {
    console.error('Get mentors error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// Set or update mentor for a section
router.put('/:section', authenticate, authorize('admin'), async (req, res) => {
  try {
    const section = req.params.section;
    const { facultyUserId } = req.body;
    if (!section || !facultyUserId) return res.status(400).json({ status: 'error', message: 'section and facultyUserId are required' });
    // Validate faculty exists and is role faculty
    const f = await pool.query('SELECT id FROM users WHERE id = $1 AND role = \'faculty\'', [facultyUserId]);
    if (f.rows.length === 0) return res.status(400).json({ status: 'error', message: 'Invalid faculty user id' });
    await pool.query(`
      INSERT INTO section_mentors (section, faculty_user_id)
      VALUES ($1, $2)
      ON CONFLICT (section) DO UPDATE SET faculty_user_id = EXCLUDED.faculty_user_id, updated_at = CURRENT_TIMESTAMP
    `, [section, facultyUserId]);
    res.status(200).json({ status: 'success', message: 'Mentor updated' });
  } catch (error) {
    console.error('Update mentor error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

module.exports = router;


