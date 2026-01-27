const mongoose = require('mongoose');

const timetableSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  attendanceThreshold: {
    type: Number,
    default: 80,
    min: 0,
    max: 100
  },
  activeSemester: {
    type: Number,
    default: 1,
    min: 1,
    max: 8
  },
  weekendSettings: {
    saturdayEnabled: { type: Boolean, default: false },
    sundayEnabled: { type: Boolean, default: false },
    saturdayMapsTo: { type: Number, default: null }, // null or 0-4 (Mon-Fri)
    sundayMapsTo: { type: Number, default: null }
  },
  semesterStartDate: {
    type: Date,
    default: null
  },
  semesterEndDate: {
    type: Date,
    default: null
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

timetableSettingsSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('TimetableSettings', timetableSettingsSchema);
