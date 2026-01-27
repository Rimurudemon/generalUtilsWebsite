const mongoose = require('mongoose');

const timetableSlotSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  day: {
    type: Number, // 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
    required: true,
    min: 0,
    max: 6
  },
  startTime: {
    type: String, // Format: "HH:MM" (24-hour)
    required: true
  },
  endTime: {
    type: String, // Format: "HH:MM" (24-hour)
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
timetableSlotSchema.index({ user: 1, semester: 1, day: 1 });

module.exports = mongoose.model('TimetableSlot', timetableSlotSchema);
