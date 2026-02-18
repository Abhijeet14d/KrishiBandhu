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
const {
  validate,
  registerSchema,
  loginSchema,
  verifyOTPSchema,
  resendOTPSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  updateLocationSchema,
  updateFarmingProfileSchema
} = require('../middleware/validate.middleware');

const router = express.Router();

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  message: { success: false, message: 'Too many attempts, please try again later' }
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

const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Too many token refresh requests, please try again later'
});

// Public routes
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/verify-otp', authLimiter, validate(verifyOTPSchema), verifyOTP);
router.post('/resend-otp', otpLimiter, validate(resendOTPSchema), resendOTP);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh-token', refreshTokenLimiter, validate(refreshTokenSchema), refreshToken);
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', passwordResetLimiter, validate(resetPasswordSchema), resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, validate(updateProfileSchema), updateProfile);
router.put('/change-password', protect, validate(changePasswordSchema), changePassword);
router.put('/location', protect, validate(updateLocationSchema), updateLocation);
router.put('/farming-profile', protect, validate(updateFarmingProfileSchema), updateFarmingProfile);

module.exports = router;
