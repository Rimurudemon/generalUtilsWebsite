const express = require('express');
const { db } = require('../db/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all notes for user
router.get('/', auth, async (req, res) => {
  try {
    const notes = db.prepare(`
      SELECT * FROM notes 
      WHERE user_id = ? 
      ORDER BY is_pinned DESC, updated_at DESC
    `).all(req.userId);
    
    // Convert to API format
    const formattedNotes = notes.map(note => ({
      _id: note.id,
      id: note.id,
      user: note.user_id,
      title: note.title,
      content: note.content,
      color: note.color,
      isPinned: !!note.is_pinned,
      tags: JSON.parse(note.tags || '[]'),
      createdAt: note.created_at,
      updatedAt: note.updated_at
    }));
    
    res.json(formattedNotes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create note
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, color, tags } = req.body;
    
    const result = db.prepare(`
      INSERT INTO notes (user_id, title, content, color, tags)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.userId, title, content || '', color || '#8b5cf6', JSON.stringify(tags || []));

    // Update stats
    db.prepare('UPDATE users SET stat_notes_created = stat_notes_created + 1 WHERE id = ?').run(req.userId);

    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json({
      _id: note.id,
      id: note.id,
      user: note.user_id,
      title: note.title,
      content: note.content,
      color: note.color,
      isPinned: !!note.is_pinned,
      tags: JSON.parse(note.tags || '[]'),
      createdAt: note.created_at,
      updatedAt: note.updated_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update note
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, color, isPinned, tags } = req.body;
    
    const existing = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    
    if (!existing) {
      return res.status(404).json({ error: 'Note not found.' });
    }
    
    db.prepare(`
      UPDATE notes 
      SET title = ?, content = ?, color = ?, is_pinned = ?, tags = ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(
      title !== undefined ? title : existing.title,
      content !== undefined ? content : existing.content,
      color !== undefined ? color : existing.color,
      isPinned !== undefined ? (isPinned ? 1 : 0) : existing.is_pinned,
      tags !== undefined ? JSON.stringify(tags) : existing.tags,
      req.params.id,
      req.userId
    );

    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);

    res.json({
      _id: note.id,
      id: note.id,
      user: note.user_id,
      title: note.title,
      content: note.content,
      color: note.color,
      isPinned: !!note.is_pinned,
      tags: JSON.parse(note.tags || '[]'),
      createdAt: note.created_at,
      updatedAt: note.updated_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete note
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    res.json({ message: 'Note deleted.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
