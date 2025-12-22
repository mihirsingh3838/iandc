const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authController = require('../controllers/authController');

// Public routes (no auth required)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/validate', auth, authController.validateToken);

// Protected routes (auth required)
router.post('/logout', auth, authController.logout);
router.get('/sessions', auth, authController.getActiveSessions);
router.post('/facility', auth, authController.updateFacility);

module.exports = router; 