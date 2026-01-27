const express = require('express');
const Event = require('../models/Event');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Get all events for user (including broadcasts)
router.get('/', auth, async (req, res) => {
  try {
    const events = await Event.find({
      $or: [
        { user: req.userId },
        { isBroadcast: true }
      ]
    }).sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create personal event
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, date, time, color } = req.body;
    
    const event = new Event({
      user: req.userId,
      title,
      description,
      date,
      time,
      color,
      isBroadcast: false
    });
    await event.save();

    // Update stats
    await User.findByIdAndUpdate(req.userId, { $inc: { 'stats.eventsCreated': 1 } });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin broadcast event to all users
router.post('/broadcast', auth, adminOnly, async (req, res) => {
  try {
    const { title, description, date, time, color } = req.body;
    
    const event = new Event({
      user: req.userId,
      title,
      description,
      date,
      time,
      color,
      isBroadcast: true
    });
    await event.save();

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update event
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, date, time, color } = req.body;
    
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { title, description, date, time, color },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete event
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({ _id: req.params.id, user: req.userId });
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    res.json({ message: 'Event deleted.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
