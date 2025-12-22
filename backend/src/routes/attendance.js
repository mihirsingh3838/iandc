const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const attendanceController = require('../controllers/attendanceController');

// All attendance routes require authentication
router.post('/mark', auth, attendanceController.markAttendance);
router.get('/history', auth, attendanceController.getAttendanceHistory);

module.exports = router; 