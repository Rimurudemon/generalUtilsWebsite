const express = require('express');
const Note = require('../models/Note');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all notes for user
router.get('/', auth, async (req, res) => {
  try {
    const notes = await Note.find({ user: req.userId })
      .sort({ isPinned: -1, updatedAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create note
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, color, tags } = req.body;
    
    const note = new Note({
      user: req.userId,
      title,
      content,
      color,
      tags
    });
    await note.save();

    // Update stats
    await User.findByIdAndUpdate(req.userId, { $inc: { 'stats.notesCreated': 1 } });

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update note
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, color, isPinned, tags } = req.body;
    
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { title, content, color, isPinned, tags, updatedAt: Date.now() },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    res.json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete note
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.userId });
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    res.json({ message: 'Note deleted.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
