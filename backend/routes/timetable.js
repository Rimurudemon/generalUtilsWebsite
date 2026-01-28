const express = require('express');
const { db } = require('../db/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Helper to format course
const formatCourse = (course) => {
  if (!course) return null;
  return {
    _id: course.id,
    id: course.id,
    user: course.user_id,
    semester: course.semester,
    name: course.name,
    code: course.code,
    venue: course.venue,
    credits: course.credits,
    color: course.color,
    attendanceThreshold: course.attendance_threshold,
    createdAt: course.created_at
  };
};

// Helper to format slot with course
const formatSlot = (slot, course) => {
  return {
    _id: slot.id,
    id: slot.id,
    user: slot.user_id,
    course: course ? formatCourse(course) : slot.course_id,
    semester: slot.semester,
    day: slot.day,
    startTime: slot.start_time,
    endTime: slot.end_time,
    createdAt: slot.created_at
  };
};

// Helper to format settings
const formatSettings = (settings) => {
  if (!settings) return null;
  return {
    _id: settings.id,
    id: settings.id,
    user: settings.user_id,
    attendanceThreshold: settings.attendance_threshold,
    activeSemester: settings.active_semester,
    weekendSettings: {
      saturdayEnabled: !!settings.saturday_enabled,
      sundayEnabled: !!settings.sunday_enabled,
      saturdayMapsTo: settings.saturday_maps_to,
      sundayMapsTo: settings.sunday_maps_to
    },
    semesterStartDate: settings.semester_start_date,
    semesterEndDate: settings.semester_end_date,
    updatedAt: settings.updated_at
  };
};

// ========== SETTINGS ==========

// Get user settings
router.get('/settings', auth, async (req, res) => {
  try {
    let settings = db.prepare('SELECT * FROM timetable_settings WHERE user_id = ?').get(req.userId);
    
    if (!settings) {
      db.prepare('INSERT INTO timetable_settings (user_id) VALUES (?)').run(req.userId);
      settings = db.prepare('SELECT * FROM timetable_settings WHERE user_id = ?').get(req.userId);
    }
    
    res.json(formatSettings(settings));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update settings
router.put('/settings', auth, async (req, res) => {
  try {
    const updates = req.body;
    
    // Check if settings exist, create if not
    let settings = db.prepare('SELECT * FROM timetable_settings WHERE user_id = ?').get(req.userId);
    
    if (!settings) {
      db.prepare('INSERT INTO timetable_settings (user_id) VALUES (?)').run(req.userId);
    }
    
    // Build update query
    const fields = [];
    const values = [];
    
    if (updates.attendanceThreshold !== undefined) {
      fields.push('attendance_threshold = ?');
      values.push(updates.attendanceThreshold);
    }
    if (updates.activeSemester !== undefined) {
      fields.push('active_semester = ?');
      values.push(updates.activeSemester);
    }
    if (updates.weekendSettings) {
      if (updates.weekendSettings.saturdayEnabled !== undefined) {
        fields.push('saturday_enabled = ?');
        values.push(updates.weekendSettings.saturdayEnabled ? 1 : 0);
      }
      if (updates.weekendSettings.sundayEnabled !== undefined) {
        fields.push('sunday_enabled = ?');
        values.push(updates.weekendSettings.sundayEnabled ? 1 : 0);
      }
      if (updates.weekendSettings.saturdayMapsTo !== undefined) {
        fields.push('saturday_maps_to = ?');
        values.push(updates.weekendSettings.saturdayMapsTo);
      }
      if (updates.weekendSettings.sundayMapsTo !== undefined) {
        fields.push('sunday_maps_to = ?');
        values.push(updates.weekendSettings.sundayMapsTo);
      }
    }
    if (updates.semesterStartDate !== undefined) {
      fields.push('semester_start_date = ?');
      values.push(updates.semesterStartDate);
    }
    if (updates.semesterEndDate !== undefined) {
      fields.push('semester_end_date = ?');
      values.push(updates.semesterEndDate);
    }
    
    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      values.push(req.userId);
      db.prepare(`UPDATE timetable_settings SET ${fields.join(', ')} WHERE user_id = ?`).run(...values);
    }
    
    settings = db.prepare('SELECT * FROM timetable_settings WHERE user_id = ?').get(req.userId);
    res.json(formatSettings(settings));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== COURSES ==========

// Get all courses for a semester
router.get('/courses', auth, async (req, res) => {
  try {
    const { semester } = req.query;
    let courses;
    
    if (semester) {
      courses = db.prepare('SELECT * FROM courses WHERE user_id = ? AND semester = ? ORDER BY name ASC')
        .all(req.userId, parseInt(semester));
    } else {
      courses = db.prepare('SELECT * FROM courses WHERE user_id = ? ORDER BY name ASC').all(req.userId);
    }
    
    res.json(courses.map(formatCourse));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create course
router.post('/courses', auth, async (req, res) => {
  try {
    const { name, code, venue, credits, semester, color, attendanceThreshold } = req.body;
    
    const result = db.prepare(`
      INSERT INTO courses (user_id, name, code, venue, credits, semester, color, attendance_threshold)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.userId, name, code, venue || '', credits, semester, color || '#8b5cf6', attendanceThreshold || 80);
    
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(formatCourse(course));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update course
router.put('/courses/:id', auth, async (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM courses WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    
    if (!existing) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const { name, code, venue, credits, semester, color, attendanceThreshold } = req.body;
    
    db.prepare(`
      UPDATE courses 
      SET name = ?, code = ?, venue = ?, credits = ?, semester = ?, color = ?, attendance_threshold = ?
      WHERE id = ? AND user_id = ?
    `).run(
      name !== undefined ? name : existing.name,
      code !== undefined ? code : existing.code,
      venue !== undefined ? venue : existing.venue,
      credits !== undefined ? credits : existing.credits,
      semester !== undefined ? semester : existing.semester,
      color !== undefined ? color : existing.color,
      attendanceThreshold !== undefined ? attendanceThreshold : existing.attendance_threshold,
      req.params.id,
      req.userId
    );
    
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
    res.json(formatCourse(course));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete course (also deletes related slots and attendance)
router.delete('/courses/:id', auth, async (req, res) => {
  try {
    const course = db.prepare('SELECT * FROM courses WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Clean up related data (SQLite cascades should handle this, but being explicit)
    db.prepare('DELETE FROM attendance_records WHERE course_id = ?').run(req.params.id);
    db.prepare('DELETE FROM timetable_slots WHERE course_id = ?').run(req.params.id);
    db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);
    
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
    let slots;
    
    if (semester) {
      slots = db.prepare(`
        SELECT ts.*, c.id as c_id, c.user_id as c_user_id, c.semester as c_semester, 
               c.name as c_name, c.code as c_code, c.venue as c_venue, c.credits as c_credits, 
               c.color as c_color, c.attendance_threshold as c_attendance_threshold, c.created_at as c_created_at
        FROM timetable_slots ts
        LEFT JOIN courses c ON ts.course_id = c.id
        WHERE ts.user_id = ? AND ts.semester = ?
      `).all(req.userId, parseInt(semester));
    } else {
      slots = db.prepare(`
        SELECT ts.*, c.id as c_id, c.user_id as c_user_id, c.semester as c_semester, 
               c.name as c_name, c.code as c_code, c.venue as c_venue, c.credits as c_credits, 
               c.color as c_color, c.attendance_threshold as c_attendance_threshold, c.created_at as c_created_at
        FROM timetable_slots ts
        LEFT JOIN courses c ON ts.course_id = c.id
        WHERE ts.user_id = ?
      `).all(req.userId);
    }
    
    const formattedSlots = slots.map(row => {
      const course = row.c_id ? {
        id: row.c_id,
        user_id: row.c_user_id,
        semester: row.c_semester,
        name: row.c_name,
        code: row.c_code,
        venue: row.c_venue,
        credits: row.c_credits,
        color: row.c_color,
        attendance_threshold: row.c_attendance_threshold,
        created_at: row.c_created_at
      } : null;
      
      return formatSlot(row, course);
    });
    
    res.json(formattedSlots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create slot
router.post('/slots', auth, async (req, res) => {
  try {
    const { courseId, semester, day, startTime, endTime } = req.body;
    
    const result = db.prepare(`
      INSERT INTO timetable_slots (user_id, course_id, semester, day, start_time, end_time)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.userId, courseId, semester, day, startTime, endTime);
    
    const slot = db.prepare('SELECT * FROM timetable_slots WHERE id = ?').get(result.lastInsertRowid);
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
    
    res.status(201).json(formatSlot(slot, course));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update slot
router.put('/slots/:id', auth, async (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM timetable_slots WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    
    if (!existing) {
      return res.status(404).json({ error: 'Slot not found' });
    }
    
    const { courseId, day, startTime, endTime } = req.body;
    
    db.prepare(`
      UPDATE timetable_slots 
      SET course_id = ?, day = ?, start_time = ?, end_time = ?
      WHERE id = ? AND user_id = ?
    `).run(
      courseId !== undefined ? courseId : existing.course_id,
      day !== undefined ? day : existing.day,
      startTime !== undefined ? startTime : existing.start_time,
      endTime !== undefined ? endTime : existing.end_time,
      req.params.id,
      req.userId
    );
    
    const slot = db.prepare('SELECT * FROM timetable_slots WHERE id = ?').get(req.params.id);
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(slot.course_id);
    
    res.json(formatSlot(slot, course));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete slot
router.delete('/slots/:id', auth, async (req, res) => {
  try {
    const slot = db.prepare('SELECT * FROM timetable_slots WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }
    
    // Clean up attendance records for this slot
    db.prepare('DELETE FROM attendance_records WHERE slot_id = ?').run(req.params.id);
    db.prepare('DELETE FROM timetable_slots WHERE id = ?').run(req.params.id);
    
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
    
    let query = `
      SELECT ar.*, 
             c.id as c_id, c.user_id as c_user_id, c.semester as c_semester, 
             c.name as c_name, c.code as c_code, c.venue as c_venue, c.credits as c_credits, 
             c.color as c_color, c.attendance_threshold as c_attendance_threshold, c.created_at as c_created_at,
             ts.id as ts_id, ts.user_id as ts_user_id, ts.course_id as ts_course_id,
             ts.semester as ts_semester, ts.day as ts_day, ts.start_time as ts_start_time,
             ts.end_time as ts_end_time, ts.created_at as ts_created_at
      FROM attendance_records ar
      LEFT JOIN courses c ON ar.course_id = c.id
      LEFT JOIN timetable_slots ts ON ar.slot_id = ts.id
      WHERE ar.user_id = ?
    `;
    
    const params = [req.userId];
    
    if (courseId) {
      query += ' AND ar.course_id = ?';
      params.push(courseId);
    }
    if (startDate) {
      query += ' AND ar.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND ar.date <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY ar.date DESC';
    
    const records = db.prepare(query).all(...params);
    
    const formattedRecords = records.map(row => {
      const course = row.c_id ? {
        id: row.c_id,
        user_id: row.c_user_id,
        semester: row.c_semester,
        name: row.c_name,
        code: row.c_code,
        venue: row.c_venue,
        credits: row.c_credits,
        color: row.c_color,
        attendance_threshold: row.c_attendance_threshold,
        created_at: row.c_created_at
      } : null;
      
      const slot = row.ts_id ? {
        id: row.ts_id,
        user_id: row.ts_user_id,
        course_id: row.ts_course_id,
        semester: row.ts_semester,
        day: row.ts_day,
        start_time: row.ts_start_time,
        end_time: row.ts_end_time,
        created_at: row.ts_created_at
      } : null;
      
      return {
        _id: row.id,
        id: row.id,
        user: row.user_id,
        slot: slot ? formatSlot(slot, null) : row.slot_id,
        course: course ? formatCourse(course) : row.course_id,
        date: row.date,
        status: row.status,
        createdAt: row.created_at
      };
    });
    
    res.json(formattedRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update attendance record
router.post('/attendance', auth, async (req, res) => {
  try {
    const { slotId, courseId, date, status } = req.body;
    
    // Try to find existing record
    const existing = db.prepare('SELECT * FROM attendance_records WHERE user_id = ? AND slot_id = ? AND date = ?')
      .get(req.userId, slotId, date);
    
    if (existing) {
      // Update
      db.prepare('UPDATE attendance_records SET status = ? WHERE id = ?').run(status, existing.id);
    } else {
      // Insert
      db.prepare(`
        INSERT INTO attendance_records (user_id, slot_id, course_id, date, status)
        VALUES (?, ?, ?, ?, ?)
      `).run(req.userId, slotId, courseId, date, status);
    }
    
    const record = db.prepare('SELECT * FROM attendance_records WHERE user_id = ? AND slot_id = ? AND date = ?')
      .get(req.userId, slotId, date);
    
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
    const slot = db.prepare('SELECT * FROM timetable_slots WHERE id = ?').get(slotId);
    
    res.json({
      _id: record.id,
      id: record.id,
      user: record.user_id,
      slot: slot ? formatSlot(slot, null) : slotId,
      course: course ? formatCourse(course) : courseId,
      date: record.date,
      status: record.status,
      createdAt: record.created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance statistics per course
router.get('/attendance/stats', auth, async (req, res) => {
  try {
    const { semester } = req.query;
    
    // Get all courses for the semester
    const courses = db.prepare('SELECT * FROM courses WHERE user_id = ? AND semester = ?')
      .all(req.userId, parseInt(semester) || 1);
    
    const stats = courses.map(course => {
      const records = db.prepare('SELECT * FROM attendance_records WHERE user_id = ? AND course_id = ?')
        .all(req.userId, course.id);
      
      const attended = records.filter(r => r.status === 'attended').length;
      const missed = records.filter(r => r.status === 'missed').length;
      const cancelled = records.filter(r => r.status === 'cancelled').length;
      const total = attended + missed; // Cancelled doesn't count
      
      const percentage = total > 0 ? (attended / total) * 100 : 100;
      
      // Get the attendance threshold for this course (default 80%)
      const threshold = course.attendance_threshold || 80;
      
      // Calculate allowed leaves based on threshold and total classes
      // Formula: If threshold is 80%, you can miss 20% of total classes
      // But we need to estimate based on credits how many classes there are per week
      // For 3-4 credit courses: approximately 3-4 classes per week = 12-16 per month
      // So we estimate: credits * 4 classes per month * 4 months = credits * 16 total
      // With 80% attendance, you can miss 20% = credits * 16 * 0.20 = credits * 3.2
      
      // More accurate: Calculate based on actual recorded classes + potential future classes
      // For now, just use the formula: can miss X% where X = (100 - threshold)
      // allowedLeaves = ceil(total * (100 - threshold) / 100) if total > 0
      // Otherwise estimate based on credits
      let allowedLeaves;
      if (total > 0) {
        // Based on actual classes: how many can you miss and still meet threshold?
        // attended / (attended + missed + allowableMore) >= threshold/100
        // allowableMore <= (attended * 100 / threshold) - total
        allowedLeaves = Math.floor((attended * 100 / threshold) - total) + missed;
        if (allowedLeaves < 0) allowedLeaves = 0;
      } else {
        // Estimate: assume credits * 3 classes per week, 16 weeks, 80% required
        // Can miss 20% = credits * 3 * 16 * 0.20 = credits * 9.6
        // Simplified: credits * 10 for 80% threshold
        allowedLeaves = Math.floor(course.credits * 10 * (100 - threshold) / 100);
      }
      
      const leavesUsed = missed;
      const leavesRemaining = Math.max(0, allowedLeaves - leavesUsed);
      
      return {
        course: formatCourse(course),
        attended,
        missed,
        cancelled,
        total,
        percentage: Math.round(percentage * 100) / 100,
        allowedLeaves,
        leavesUsed,
        leavesRemaining
      };
    });
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
