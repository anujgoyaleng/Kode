const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');
const { authenticate, authorizeStudentAccess } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `certificate-${uniqueSuffix}${ext}`);
  }
});

// File filter to allow only specific file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPEG, PNG, and GIF files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: 5 // Maximum 5 files per request
  }
});

/**
 * @route   POST /api/upload/certificate
 * @desc    Upload certificate file
 * @access  Private (Student)
 */
router.post('/certificate', authenticate, authorize('student'), upload.single('certificate'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      });
    }

    const { description } = req.body;
    const studentId = req.user.student_id;

    if (!studentId) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        status: 'error',
        message: 'Student profile not found. Please create your student profile first.'
      });
    }

    // Save file info to database
    const insertQuery = `
      INSERT INTO certificates (student_id, filename, original_name, file_path, file_size, mime_type, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      studentId,
      req.file.filename,
      req.file.originalname,
      req.file.path,
      req.file.size,
      req.file.mimetype,
      description || null
    ]);

    res.status(201).json({
      status: 'success',
      message: 'Certificate uploaded successfully',
      data: {
        certificate: {
          id: result.rows[0].id,
          filename: result.rows[0].filename,
          originalName: result.rows[0].original_name,
          fileSize: result.rows[0].file_size,
          mimeType: result.rows[0].mime_type,
          description: result.rows[0].description,
          fileUrl: `/uploads/${result.rows[0].filename}`,
          createdAt: result.rows[0].created_at
        }
      }
    });

  } catch (error) {
    console.error('Upload certificate error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during file upload'
    });
  }
});

/**
 * @route   POST /api/upload/certificates
 * @desc    Upload multiple certificate files
 * @access  Private (Student)
 */
router.post('/certificates', authenticate, authorize('student'), upload.array('certificates', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No files uploaded'
      });
    }

    const studentId = req.user.student_id;

    if (!studentId) {
      // Clean up uploaded files
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
      return res.status(400).json({
        status: 'error',
        message: 'Student profile not found. Please create your student profile first.'
      });
    }

    const uploadedCertificates = [];

    // Process each uploaded file
    for (const file of req.files) {
      const insertQuery = `
        INSERT INTO certificates (student_id, filename, original_name, file_path, file_size, mime_type)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const result = await pool.query(insertQuery, [
        studentId,
        file.filename,
        file.originalname,
        file.path,
        file.size,
        file.mimetype
      ]);

      uploadedCertificates.push({
        id: result.rows[0].id,
        filename: result.rows[0].filename,
        originalName: result.rows[0].original_name,
        fileSize: result.rows[0].file_size,
        mimeType: result.rows[0].mime_type,
        fileUrl: `/uploads/${result.rows[0].filename}`,
        createdAt: result.rows[0].created_at
      });
    }

    res.status(201).json({
      status: 'success',
      message: `${uploadedCertificates.length} certificates uploaded successfully`,
      data: { certificates: uploadedCertificates }
    });

  } catch (error) {
    console.error('Upload certificates error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during file upload'
    });
  }
});

/**
 * @route   GET /api/upload/certificates
 * @desc    Get student's uploaded certificates
 * @access  Private (Student)
 */
router.get('/certificates', authenticate, authorize('student'), async (req, res) => {
  try {
    const studentId = req.user.student_id;

    if (!studentId) {
      return res.status(400).json({
        status: 'error',
        message: 'Student profile not found'
      });
    }

    const query = `
      SELECT * FROM certificates 
      WHERE student_id = $1 
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [studentId]);

    res.status(200).json({
      status: 'success',
      data: {
        certificates: result.rows.map(cert => ({
          id: cert.id,
          filename: cert.filename,
          originalName: cert.original_name,
          fileSize: cert.file_size,
          mimeType: cert.mime_type,
          description: cert.description,
          fileUrl: `/uploads/${cert.filename}`,
          isVerified: cert.is_verified,
          verifiedBy: cert.verified_by,
          verifiedAt: cert.verified_at,
          createdAt: cert.created_at
        }))
      }
    });

  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   DELETE /api/upload/certificates/:id
 * @desc    Delete certificate file
 * @access  Private (Student)
 */
router.delete('/certificates/:id', authenticate, authorize('student'), async (req, res) => {
  try {
    const certificateId = req.params.id;
    const studentId = req.user.student_id;

    // Get certificate info
    const getQuery = 'SELECT * FROM certificates WHERE id = $1 AND student_id = $2';
    const getResult = await pool.query(getQuery, [certificateId, studentId]);

    if (getResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Certificate not found'
      });
    }

    const certificate = getResult.rows[0];

    // Delete from database
    const deleteQuery = 'DELETE FROM certificates WHERE id = $1 AND student_id = $2';
    await pool.query(deleteQuery, [certificateId, studentId]);

    // Delete file from filesystem
    try {
      fs.unlinkSync(certificate.file_path);
    } catch (fileError) {
      console.warn('Could not delete file from filesystem:', fileError.message);
    }

    res.status(200).json({
      status: 'success',
      message: 'Certificate deleted successfully',
      data: {
        deletedCertificate: {
          id: certificate.id,
          filename: certificate.filename,
          originalName: certificate.original_name
        }
      }
    });

  } catch (error) {
    console.error('Delete certificate error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/upload/certificates/:id/download
 * @desc    Download certificate file
 * @access  Private
 */
router.get('/certificates/:id/download', authenticate, async (req, res) => {
  try {
    const certificateId = req.params.id;
    const studentId = req.user.student_id;

    // Get certificate info
    let query = 'SELECT * FROM certificates WHERE id = $1';
    let params = [certificateId];

    // Students can only download their own certificates
    if (req.user.role === 'student') {
      query += ' AND student_id = $2';
      params.push(studentId);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Certificate not found'
      });
    }

    const certificate = result.rows[0];

    // Check if file exists
    if (!fs.existsSync(certificate.file_path)) {
      return res.status(404).json({
        status: 'error',
        message: 'Certificate file not found on server'
      });
    }

    // Set appropriate headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${certificate.original_name}"`);
    res.setHeader('Content-Type', certificate.mime_type);
    res.setHeader('Content-Length', certificate.file_size);

    // Stream the file
    const fileStream = fs.createReadStream(certificate.file_path);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Download certificate error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: 'File too large. Maximum size allowed is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        status: 'error',
        message: 'Too many files. Maximum 5 files allowed per request.'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      status: 'error',
      message: error.message
    });
  }

  next(error);
});

module.exports = router;


