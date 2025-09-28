const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getAdminStats, getEmployeeStats, getNotifications, markNotificationAsRead } = require('../controllers/dashboardController');

const router = express.Router();

// Protect all routes in this file
router.use(authenticate);

// Dashboard stats routes
router.get('/admin-stats', getAdminStats);
router.get('/employee-stats', getEmployeeStats);

// Notification routes
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationAsRead);

module.exports = router;
