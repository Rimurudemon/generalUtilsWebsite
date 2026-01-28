const express = require('express');
const { db } = require('../db/database');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Get all events for user (including broadcasts)
router.get('/', auth, async (req, res) => {
  try {
    const events = db.prepare(`
      SELECT * FROM events 
      WHERE user_id = ? OR is_broadcast = 1
      ORDER BY date ASC
    `).all(req.userId);
    
    const formattedEvents = events.map(event => ({
      _id: event.id,
      id: event.id,
      user: event.user_id,
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      color: event.color,
      isBroadcast: !!event.is_broadcast,
      createdAt: event.created_at
    }));
    
    res.json(formattedEvents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create personal event
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, date, time, color } = req.body;
    
    const result = db.prepare(`
      INSERT INTO events (user_id, title, description, date, time, color, is_broadcast)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(req.userId, title, description || '', date, time || '', color || '#8b5cf6');

    // Update stats
    db.prepare('UPDATE users SET stat_events_created = stat_events_created + 1 WHERE id = ?').run(req.userId);

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json({
      _id: event.id,
      id: event.id,
      user: event.user_id,
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      color: event.color,
      isBroadcast: !!event.is_broadcast,
      createdAt: event.created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin broadcast event to all users
router.post('/broadcast', auth, adminOnly, async (req, res) => {
  try {
    const { title, description, date, time, color } = req.body;
    
    const result = db.prepare(`
      INSERT INTO events (user_id, title, description, date, time, color, is_broadcast)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(req.userId, title, description || '', date, time || '', color || '#8b5cf6');

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json({
      _id: event.id,
      id: event.id,
      user: event.user_id,
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      color: event.color,
      isBroadcast: !!event.is_broadcast,
      createdAt: event.created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update event
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, date, time, color } = req.body;
    
    const existing = db.prepare('SELECT * FROM events WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    
    if (!existing) {
      return res.status(404).json({ error: 'Event not found.' });
    }
    
    db.prepare(`
      UPDATE events 
      SET title = ?, description = ?, date = ?, time = ?, color = ?
      WHERE id = ? AND user_id = ?
    `).run(
      title !== undefined ? title : existing.title,
      description !== undefined ? description : existing.description,
      date !== undefined ? date : existing.date,
      time !== undefined ? time : existing.time,
      color !== undefined ? color : existing.color,
      req.params.id,
      req.userId
    );

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);

    res.json({
      _id: event.id,
      id: event.id,
      user: event.user_id,
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      color: event.color,
      isBroadcast: !!event.is_broadcast,
      createdAt: event.created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete event
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = db.prepare('DELETE FROM events WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    res.json({ message: 'Event deleted.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
