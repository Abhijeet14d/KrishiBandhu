const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Scheme title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Scheme description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  type: {
    type: String,
    enum: ['central', 'state'],
    required: [true, 'Scheme type (central/state) is required']
  },
  state: {
    type: String,
    trim: true,
    default: '',
    // Required only when type is 'state'
    validate: {
      validator: function (v) {
        if (this.type === 'state' && (!v || v.trim() === '')) {
          return false;
        }
        return true;
      },
      message: 'State name is required for state-level schemes'
    }
  },
  category: {
    type: String,
    trim: true,
    default: 'General',
    maxlength: [100, 'Category cannot exceed 100 characters']
  },
  benefits: {
    type: String,
    trim: true,
    default: '',
    maxlength: [500, 'Benefits cannot exceed 500 characters']
  },
  eligibility: {
    type: String,
    trim: true,
    default: '',
    maxlength: [1000, 'Eligibility cannot exceed 1000 characters']
  },
  link: {
    type: String,
    trim: true,
    default: '',
    maxlength: [500, 'Link cannot exceed 500 characters']
  },
  ministry: {
    type: String,
    trim: true,
    default: '',
    maxlength: [200, 'Ministry name cannot exceed 200 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
schemeSchema.index({ type: 1, isActive: 1 });
schemeSchema.index({ state: 1, isActive: 1 });
schemeSchema.index({ type: 1, state: 1, isActive: 1 });

module.exports = mongoose.model('Scheme', schemeSchema);
