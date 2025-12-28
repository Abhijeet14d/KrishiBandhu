const express = require('express');
const rateLimit = require('express-rate-limit');
const { 
  register, 
  verifyOTP, 
  resendOTP, 
  login, 
  refreshToken,
  getMe 
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many attempts, please try again later'
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 requests per window
  message: 'Too many OTP requests, please try again later'
});

// Public routes
router.post('/register', authLimiter, register);
router.post('/verify-otp', authLimiter, verifyOTP);
router.post('/resend-otp', otpLimiter, resendOTP);
router.post('/login', authLimiter, login);
router.post('/refresh-token', refreshToken);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;
