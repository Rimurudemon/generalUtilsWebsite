const express = require('express');
const CgpaRecord = require('../models/CgpaRecord');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get archived CGPA records
router.get('/archive', auth, async (req, res) => {
  try {
    const records = await CgpaRecord.find({ user: req.userId })
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save CGPA record to archive
router.post('/archive', auth, async (req, res) => {
  try {
    const { semester, courses, sgpa, cgpa, totalCredits } = req.body;
    
    const record = new CgpaRecord({
      user: req.userId,
      semester,
      courses,
      sgpa,
      cgpa,
      totalCredits
    });
    await record.save();

    // Update stats
    await User.findByIdAndUpdate(req.userId, { $inc: { 'stats.cgpaCalculations': 1 } });

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete archived record
router.delete('/archive/:id', auth, async (req, res) => {
  try {
    const record = await CgpaRecord.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.userId 
    });
    
    if (!record) {
      return res.status(404).json({ error: 'Record not found.' });
    }

    res.json({ message: 'Record deleted.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
