const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  slot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimetableSlot',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['attended', 'missed', 'cancelled'],
    default: 'attended'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient queries
attendanceRecordSchema.index({ user: 1, course: 1, date: 1 });
attendanceRecordSchema.index({ user: 1, slot: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
