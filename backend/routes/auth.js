const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');

// POST /auth/register - Register new user
router.post('/register', validateRegistration, authController.register);

// POST /auth/login - Login user
router.post('/login', validateLogin, authController.login);

// GET /auth/profile - Get current user profile (protected)
router.get('/profile', verifyToken, authController.getProfile);

// PUT /auth/profile - Update user profile (protected)
router.put('/profile', verifyToken, authController.updateProfile);

// POST /auth/change-password - Change password (protected)
router.post('/change-password', verifyToken, authController.changePassword);

// POST /auth/refresh-token - Refresh JWT token (protected)
router.post('/refresh-token', verifyToken, authController.refreshToken);

module.exports = router; 