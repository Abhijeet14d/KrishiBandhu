const User = require('../models/User.model');
const Conversation = require('../models/Conversation.model');
const Scheme = require('../models/Scheme.model');

// ─── Admin Stats ────────────────────────────────────────────────────────────

/**
 * @desc    Get admin dashboard stats
 * @route   GET /api/admin/stats
 * @access  Private (Admin)
 */
exports.getStats = async (req, res) => {
  try {
    const [totalUsers, totalConversations, totalMessages, activeSchemes] = await Promise.all([
      User.countDocuments(),
      Conversation.countDocuments(),
      Conversation.aggregate([
        { $unwind: '$messages' },
        { $match: { 'messages.role': 'user' } },
        { $count: 'total' }
      ]),
      Scheme.countDocuments({ isActive: true })
    ]);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt location.state');

    const queryCount = totalMessages.length > 0 ? totalMessages[0].total : 0;

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalConversations,
        totalQueries: queryCount,
        activeSchemes,
        recentUsers
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, message: 'Error fetching admin stats' });
  }
};

// ─── Scheme CRUD ────────────────────────────────────────────────────────────

/**
 * @desc    Create a new scheme
 * @route   POST /api/admin/schemes
 * @access  Private (Admin)
 */
exports.createScheme = async (req, res) => {
  try {
    const scheme = await Scheme.create({
      ...req.body,
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, data: scheme });
  } catch (error) {
    console.error('Create scheme error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Error creating scheme' });
  }
};

/**
 * @desc    Get all schemes (admin view — includes inactive)
 * @route   GET /api/admin/schemes
 * @access  Private (Admin)
 */
exports.getAllSchemes = async (req, res) => {
  try {
    const { type, state, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (state) filter.state = state;

    const schemes = await Scheme.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('createdBy', 'name email');

    const total = await Scheme.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: schemes,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get all schemes error:', error);
    res.status(500).json({ success: false, message: 'Error fetching schemes' });
  }
};

/**
 * @desc    Update a scheme
 * @route   PUT /api/admin/schemes/:id
 * @access  Private (Admin)
 */
exports.updateScheme = async (req, res) => {
  try {
    const scheme = await Scheme.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!scheme) {
      return res.status(404).json({ success: false, message: 'Scheme not found' });
    }

    res.status(200).json({ success: true, data: scheme });
  } catch (error) {
    console.error('Update scheme error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Error updating scheme' });
  }
};

/**
 * @desc    Delete a scheme
 * @route   DELETE /api/admin/schemes/:id
 * @access  Private (Admin)
 */
exports.deleteScheme = async (req, res) => {
  try {
    const scheme = await Scheme.findByIdAndDelete(req.params.id);

    if (!scheme) {
      return res.status(404).json({ success: false, message: 'Scheme not found' });
    }

    res.status(200).json({ success: true, message: 'Scheme deleted successfully' });
  } catch (error) {
    console.error('Delete scheme error:', error);
    res.status(500).json({ success: false, message: 'Error deleting scheme' });
  }
};

// ─── Public Scheme Endpoint ─────────────────────────────────────────────────

/**
 * @desc    Get active schemes for a farmer (central + their state)
 * @route   GET /api/admin/schemes/public
 * @access  Private (any authenticated user)
 */
exports.getPublicSchemes = async (req, res) => {
  try {
    const userState = req.query.state || req.user.location?.state || '';

    const filter = { isActive: true };

    // Build OR query: central schemes + schemes matching user's state
    if (userState) {
      filter.$or = [
        { type: 'central' },
        { type: 'state', state: { $regex: new RegExp(`^${userState}$`, 'i') } }
      ];
    } else {
      // If no state info, only show central schemes
      filter.type = 'central';
    }

    const schemes = await Scheme.find(filter)
      .sort({ type: 1, createdAt: -1 })
      .select('-createdBy -__v');

    res.status(200).json({ success: true, data: schemes });
  } catch (error) {
    console.error('Public schemes error:', error);
    res.status(500).json({ success: false, message: 'Error fetching schemes' });
  }
};

/**
 * @desc    Get all users list (admin)
 * @route   GET /api/admin/users
 * @access  Private (Admin)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('name email phone role isVerified location.state farmingProfile createdAt');

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: users,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
};
