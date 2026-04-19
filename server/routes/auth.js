const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  signup, login, sendOTP, verifyOTP, getMe, updateProfile, changePassword,
} = require('../controllers/authController');

// Email signup
router.post('/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  signup
);

// Email login
router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

// OTP routes
router.post('/send-otp',
  [body('mobile').matches(/^[6-9]\d{9}$/).withMessage('Valid Indian mobile number required')],
  validate,
  sendOTP
);

router.post('/verify-otp',
  [
    body('mobile').matches(/^[6-9]\d{9}$/).withMessage('Valid mobile number required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  ],
  validate,
  verifyOTP
);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;
