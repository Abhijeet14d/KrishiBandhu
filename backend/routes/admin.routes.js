const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');
const adminController = require('../controllers/admin.controller');

// All admin routes require authentication + admin role
router.use(protect);

// Public scheme endpoint (any authenticated user can see schemes)
router.get('/schemes/public', adminController.getPublicSchemes);

// Admin-only routes below
router.use(adminOnly);

// Stats
router.get('/stats', adminController.getStats);

// Users
router.get('/users', adminController.getAllUsers);

// Schemes CRUD
router.get('/schemes', adminController.getAllSchemes);
router.post('/schemes', adminController.createScheme);
router.put('/schemes/:id', adminController.updateScheme);
router.delete('/schemes/:id', adminController.deleteScheme);

module.exports = router;
