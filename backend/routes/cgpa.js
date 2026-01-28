const express = require('express');
const { db } = require('../db/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get archived CGPA records
router.get('/archive', auth, async (req, res) => {
  try {
    const records = db.prepare(`
      SELECT * FROM cgpa_records 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.userId);
    
    const formattedRecords = records.map(record => ({
      _id: record.id,
      id: record.id,
      user: record.user_id,
      semester: record.semester,
      courses: JSON.parse(record.courses),
      sgpa: record.sgpa,
      cgpa: record.cgpa,
      totalCredits: record.total_credits,
      createdAt: record.created_at
    }));
    
    res.json(formattedRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save CGPA record to archive
router.post('/archive', auth, async (req, res) => {
  try {
    const { semester, courses, sgpa, cgpa, totalCredits } = req.body;
    
    const result = db.prepare(`
      INSERT INTO cgpa_records (user_id, semester, courses, sgpa, cgpa, total_credits)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.userId, semester, JSON.stringify(courses), sgpa, cgpa, totalCredits);

    // Update stats
    db.prepare('UPDATE users SET stat_cgpa_calculations = stat_cgpa_calculations + 1 WHERE id = ?').run(req.userId);

    const record = db.prepare('SELECT * FROM cgpa_records WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json({
      _id: record.id,
      id: record.id,
      user: record.user_id,
      semester: record.semester,
      courses: JSON.parse(record.courses),
      sgpa: record.sgpa,
      cgpa: record.cgpa,
      totalCredits: record.total_credits,
      createdAt: record.created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete archived record
router.delete('/archive/:id', auth, async (req, res) => {
  try {
    const result = db.prepare('DELETE FROM cgpa_records WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Record not found.' });
    }

    res.json({ message: 'Record deleted.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
