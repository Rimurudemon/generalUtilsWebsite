const express = require('express');
const Course = require('../models/Course');
const TimetableSlot = require('../models/TimetableSlot');
const AttendanceRecord = require('../models/AttendanceRecord');
const TimetableSettings = require('../models/TimetableSettings');
const { auth } = require('../middleware/auth');

const router = express.Router();

// ========== SETTINGS ==========

// Get user settings
router.get('/settings', auth, async (req, res) => {
  try {
    let settings = await TimetableSettings.findOne({ user: req.userId });
    if (!settings) {
      settings = await TimetableSettings.create({ user: req.userId });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update settings
router.put('/settings', auth, async (req, res) => {
  try {
    const updates = req.body;
    let settings = await TimetableSettings.findOneAndUpdate(
      { user: req.userId },
      { $set: updates },
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== COURSES ==========

// Get all courses for a semester
router.get('/courses', auth, async (req, res) => {
  try {
    const { semester } = req.query;
    const query = { user: req.userId };
    if (semester) query.semester = parseInt(semester);
    
    const courses = await Course.find(query).sort({ name: 1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create course
router.post('/courses', auth, async (req, res) => {
  try {
    const { name, code, venue, credits, semester, color } = req.body;
    
    const course = await Course.create({
      user: req.userId,
      name,
      code,
      venue,
      credits,
      semester,
      color: color || '#8b5cf6'
    });
    
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update course
router.put('/courses/:id', auth, async (req, res) => {
  try {
    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { $set: req.body },
      { new: true }
    );
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete course (also deletes related slots and attendance)
router.delete('/courses/:id', auth, async (req, res) => {
  try {
    const course = await Course.findOneAndDelete({ _id: req.params.id, user: req.userId });
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Clean up related data
    await TimetableSlot.deleteMany({ course: req.params.id });
    await AttendanceRecord.deleteMany({ course: req.params.id });
    
    res.json({ message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== TIMETABLE SLOTS ==========

// Get slots for a semester
router.get('/slots', auth, async (req, res) => {
  try {
    const { semester } = req.query;
    const query = { user: req.userId };
    if (semester) query.semester = parseInt(semester);
    
    const slots = await TimetableSlot.find(query).populate('course');
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create slot
router.post('/slots', auth, async (req, res) => {
  try {
    const { courseId, semester, day, startTime, endTime } = req.body;
    
    const slot = await TimetableSlot.create({
      user: req.userId,
      course: courseId,
      semester,
      day,
      startTime,
      endTime
    });
    
    const populated = await slot.populate('course');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update slot
router.put('/slots/:id', auth, async (req, res) => {
  try {
    const slot = await TimetableSlot.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { $set: req.body },
      { new: true }
    ).populate('course');
    
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }
    
    res.json(slot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete slot
router.delete('/slots/:id', auth, async (req, res) => {
  try {
    const slot = await TimetableSlot.findOneAndDelete({ _id: req.params.id, user: req.userId });
    
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }
    
    // Clean up attendance records for this slot
    await AttendanceRecord.deleteMany({ slot: req.params.id });
    
    res.json({ message: 'Slot deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== ATTENDANCE ==========

// Get attendance records for a course or date range
router.get('/attendance', auth, async (req, res) => {
  try {
    const { courseId, startDate, endDate } = req.query;
    const query = { user: req.userId };
    
    if (courseId) query.course = courseId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const records = await AttendanceRecord.find(query)
      .populate('course')
      .populate('slot')
      .sort({ date: -1 });
    
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update attendance record
router.post('/attendance', auth, async (req, res) => {
  try {
    const { slotId, courseId, date, status } = req.body;
    
    const record = await AttendanceRecord.findOneAndUpdate(
      { user: req.userId, slot: slotId, date: new Date(date) },
      {
        $set: {
          user: req.userId,
          slot: slotId,
          course: courseId,
          date: new Date(date),
          status
        }
      },
      { new: true, upsert: true }
    ).populate('course').populate('slot');
    
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance statistics per course
router.get('/attendance/stats', auth, async (req, res) => {
  try {
    const { semester } = req.query;
    
    // Get all courses for the semester
    const courses = await Course.find({ 
      user: req.userId, 
      semester: parseInt(semester) || 1 
    });
    
    const stats = await Promise.all(courses.map(async (course) => {
      const records = await AttendanceRecord.find({ 
        user: req.userId, 
        course: course._id 
      });
      
      const attended = records.filter(r => r.status === 'attended').length;
      const missed = records.filter(r => r.status === 'missed').length;
      const cancelled = records.filter(r => r.status === 'cancelled').length;
      const total = attended + missed; // Cancelled doesn't count
      
      const percentage = total > 0 ? (attended / total) * 100 : 100;
      
      // Calculate allowed leaves based on credits
      // Formula: (credits * 2) leaves allowed for 80% attendance
      const allowedLeaves = Math.floor(course.credits * 2);
      const leavesUsed = missed;
      const leavesRemaining = Math.max(0, allowedLeaves - leavesUsed);
      
      return {
        course: course,
        attended,
        missed,
        cancelled,
        total,
        percentage: Math.round(percentage * 100) / 100,
        allowedLeaves,
        leavesUsed,
        leavesRemaining
      };
    }));
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
