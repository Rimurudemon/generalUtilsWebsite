const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  code: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  venue: {
    type: String,
    default: '',
    trim: true,
    maxlength: 50
  },
  credits: {
    type: Number,
    required: true,
    min: 1,
    max: 6
  },
  color: {
    type: String,
    default: '#8b5cf6'
  },
  attendanceThreshold: {
    type: Number,
    default: 80,
    min: 0,
    max: 100
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient queries
courseSchema.index({ user: 1, semester: 1 });

module.exports = mongoose.model('Course', courseSchema);
