const express = require('express');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get data needed for assignments grid: students, faculties, and current assignments
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const studentsResult = await client.query(`
        SELECT s.id, s.roll_number, s.section, s.batch, s.semester, u.first_name, u.last_name, u.email, u.department
        FROM students s
        JOIN users u ON s.user_id = u.id
        WHERE u.is_active = true
        ORDER BY u.first_name, u.last_name
      `);

      const facultiesResult = await client.query(`
        SELECT u.id, u.first_name, u.last_name, u.email
        FROM users u
        WHERE u.role = 'faculty' AND u.is_active = true
        ORDER BY u.first_name, u.last_name
      `);

      const assignmentsResult = await client.query(`
        SELECT student_id, faculty_user_id FROM faculty_student_assignments
      `);

      res.status(200).json({
        status: 'success',
        data: {
          students: studentsResult.rows.map(r => ({
            id: r.id,
            rollNumber: r.roll_number,
            section: r.section,
            batch: r.batch,
            semester: r.semester,
            firstName: r.first_name,
            lastName: r.last_name,
            email: r.email,
            department: r.department
          })),
          faculties: facultiesResult.rows.map(r => ({
            id: r.id,
            firstName: r.first_name,
            lastName: r.last_name,
            email: r.email
          })),
          assignments: assignmentsResult.rows
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// Replace a student's faculty assignments with provided list
router.put('/:studentId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const facultyUserIds = Array.isArray(req.body.facultyUserIds) ? req.body.facultyUserIds : [];

    if (Number.isNaN(studentId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid studentId' });
    }

    // Validate student exists
    const s = await pool.query('SELECT id FROM students WHERE id = $1', [studentId]);
    if (s.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Student not found' });
    }

    // Validate faculties exist and are role=faculty
    if (facultyUserIds.length > 0) {
      const q = await pool.query(
        `SELECT id FROM users WHERE role = 'faculty' AND id = ANY($1::int[])`,
        [facultyUserIds]
      );
      const validIds = new Set(q.rows.map(r => r.id));
      for (const id of facultyUserIds) {
        if (!validIds.has(id)) {
          return res.status(400).json({ status: 'error', message: `Invalid faculty user id: ${id}` });
        }
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM faculty_student_assignments WHERE student_id = $1', [studentId]);
      if (facultyUserIds.length > 0) {
        const values = facultyUserIds.map((fid, idx) => `($1, $${idx + 2})`).join(',');
        await client.query(
          `INSERT INTO faculty_student_assignments (student_id, faculty_user_id) VALUES ${values} ON CONFLICT DO NOTHING`,
          [studentId, ...facultyUserIds]
        );
      }
      await client.query('COMMIT');

      res.status(200).json({ status: 'success', message: 'Assignments updated' });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update assignments error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

module.exports = router;


