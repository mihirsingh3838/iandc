const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const icSubmissionController = require('../controllers/icSubmissionController');

// All routes require authentication
router.use(auth);

// Draft operations
router.post('/draft', icSubmissionController.saveDraft);
router.get('/draft/:facilityId', icSubmissionController.getDraft);

// Submission operations
router.post('/submit', icSubmissionController.submit);
router.get('/submission/:id', icSubmissionController.getById);
router.get('/submissions', icSubmissionController.getAllByUser);

module.exports = router; 