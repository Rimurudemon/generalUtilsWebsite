const mongoose = require('mongoose');

const cgpaRecordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  semester: {
    type: String,
    required: true,
    trim: true
  },
  courses: [{
    name: { type: String, required: true },
    credits: { type: Number, required: true },
    grade: { type: String, required: true },
    gradePoints: { type: Number, required: true }
  }],
  sgpa: {
    type: Number,
    required: true
  },
  cgpa: {
    type: Number,
    required: true
  },
  totalCredits: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CgpaRecord', cgpaRecordSchema);
