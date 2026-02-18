const Joi = require('joi');

/**
 * Validation middleware factory
 * @param {Joi.ObjectSchema} schema - Joi validation schema
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    req[property] = value;
    next();
  };
};

// ==================== AUTH SCHEMAS ====================

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required()
    .messages({ 'any.required': 'Name is required' }),
  email: Joi.string().email().lowercase().trim().required()
    .messages({ 'any.required': 'Email is required' }),
  phone: Joi.string().pattern(/^[0-9]{10}$/).required()
    .messages({ 
      'any.required': 'Phone number is required',
      'string.pattern.base': 'Please provide a valid 10-digit phone number'
    }),
  password: Joi.string().min(8).max(128).required()
    .messages({ 
      'any.required': 'Password is required',
      'string.min': 'Password must be at least 8 characters'
    })
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required()
    .messages({ 'any.required': 'Email is required' }),
  password: Joi.string().required()
    .messages({ 'any.required': 'Password is required' })
});

const verifyOTPSchema = Joi.object({
  userId: Joi.string().required()
    .messages({ 'any.required': 'User ID is required' }),
  otp: Joi.string().length(6).pattern(/^[0-9]+$/).required()
    .messages({ 
      'any.required': 'OTP is required',
      'string.length': 'OTP must be 6 digits'
    })
});

const resendOTPSchema = Joi.object({
  userId: Joi.string().required()
    .messages({ 'any.required': 'User ID is required' })
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
    .messages({ 'any.required': 'Refresh token is required' })
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required()
    .messages({ 'any.required': 'Current password is required' }),
  newPassword: Joi.string().min(8).max(128).required()
    .messages({ 
      'any.required': 'New password is required',
      'string.min': 'New password must be at least 8 characters'
    })
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required()
    .messages({ 'any.required': 'Email is required' })
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required()
    .messages({ 'any.required': 'Reset token is required' }),
  password: Joi.string().min(8).max(128).required()
    .messages({ 
      'any.required': 'Password is required',
      'string.min': 'Password must be at least 8 characters'
    })
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50),
  phone: Joi.string().pattern(/^[0-9]{10}$/)
    .messages({ 'string.pattern.base': 'Please provide a valid 10-digit phone number' })
});

const updateLocationSchema = Joi.object({
  state: Joi.string().trim().allow(''),
  district: Joi.string().trim().allow(''),
  city: Joi.string().trim().allow(''),
  village: Joi.string().trim().allow(''),
  pincode: Joi.string().pattern(/^[0-9]{6}$/).allow('')
    .messages({ 'string.pattern.base': 'Please provide a valid 6-digit pincode' }),
  lat: Joi.number().min(-90).max(90),
  lon: Joi.number().min(-180).max(180)
});

const updateFarmingProfileSchema = Joi.object({
  landSize: Joi.number().min(0),
  primaryCrops: Joi.array().items(Joi.string().trim()),
  irrigationType: Joi.string().valid('rainfed', 'canal', 'tubewell', 'drip', 'sprinkler', 'mixed', ''),
  soilType: Joi.string().valid('clay', 'sandy', 'loamy', 'black', 'red', 'alluvial', 'other', '')
});

// ==================== CONVERSATION SCHEMAS ====================

const sendMessageSchema = Joi.object({
  message: Joi.string().trim().min(1).max(5000).required()
    .messages({ 
      'any.required': 'Message is required',
      'string.max': 'Message cannot exceed 5000 characters'
    })
});

module.exports = {
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
  updateFarmingProfileSchema,
  sendMessageSchema
};
