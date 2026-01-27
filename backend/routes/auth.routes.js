const express = require('express');
const rateLimit = require('express-rate-limit');
const { 
  register, 
  verifyOTP, 
  resendOTP, 
  login, 
  refreshToken,
  getMe,
  updateProfile,
  updateLocation,
  updateFarmingProfile,
  changePassword,
  forgotPassword,
  resetPassword
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

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per window
  message: 'Too many password reset requests, please try again later'
});

// Public routes
router.post('/register', authLimiter, register);
router.post('/verify-otp', authLimiter, verifyOTP);
router.post('/resend-otp', otpLimiter, resendOTP);
router.post('/login', authLimiter, login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.put('/location', protect, updateLocation);
router.put('/farming-profile', protect, updateFarmingProfile);

module.exports = router;
