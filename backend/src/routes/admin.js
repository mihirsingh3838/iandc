const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const vendorAuth = require('../middleware/vendorAuth');
const adminController = require('../controllers/adminController');

// All admin routes require authentication and admin/vendor role
router.use(auth);
router.use(vendorAuth);

router.get('/submissions', adminController.getAllSubmissions);
router.get('/submissions/by-facility', adminController.getSubmissionsByFacility);
router.get('/dashboard/insights', adminController.getDashboardInsights);
router.post('/submissions/:id/review', adminController.reviewSubmission);
router.get('/attendance', adminController.getAllAttendance);

module.exports = router;

