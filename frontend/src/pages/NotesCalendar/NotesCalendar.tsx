import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { notesAPI, eventsAPI } from '../../api';
import type { Note, CalendarEvent } from '../../types';

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

// Format date to YYYY-MM-DD without timezone issues
const formatDateString = (year: number, month: number, day: number) => {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const NotesCalendar: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'calendar' | 'notes'>('calendar');
  const [notes, setNotes] = useState<Note[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  
  // Note state
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    description: '',
    date: '',
    time: '',
    color: COLORS[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [notesData, eventsData] = await Promise.all([
        notesAPI.getAll(),
        eventsAPI.getAll()
      ]);
      setNotes(notesData);
      setEvents(eventsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calendar functions
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const getEventsForDay = (day: number) => {
    const dateStr = formatDateString(year, month, day);
    return events.filter(e => e.date.startsWith(dateStr));
  };

  const getEventsForDateStr = (dateStr: string) => {
    return events.filter(e => e.date.startsWith(dateStr));
  };

  const handleDayClick = (day: number) => {
    const dateStr = formatDateString(year, month, day);
    setSelectedDateStr(dateStr);
    setSelectedDay(day);
    setShowDayModal(true);
  };

  const handleAddEvent = () => {
    setFormData({
      ...formData,
      title: '',
      description: '',
      date: selectedDateStr,
      time: '',
      color: COLORS[0]
    });
    setEditingEvent(null);
    setShowDayModal(false);
    setShowEventModal(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setFormData({
      ...formData,
      title: event.title,
      description: event.description,
      date: event.date.split('T')[0],
      time: event.time,
      color: event.color
    });
    setEditingEvent(event);
    setShowDayModal(false);
    setShowEventModal(true);
  };

  const handleSaveEvent = async () => {
    try {
      if (editingEvent) {
        await eventsAPI.update(editingEvent._id, {
          title: formData.title,
          description: formData.description,
          date: formData.date,
          time: formData.time,
          color: formData.color
        });
      } else {
        await eventsAPI.create({
          title: formData.title,
          description: formData.description,
          date: formData.date,
          time: formData.time,
          color: formData.color
        });
      }
      setShowEventModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  };

  const handleBroadcastEvent = async () => {
    if (user?.role !== 'admin') return;
    try {
      await eventsAPI.broadcast({
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        color: formData.color
      });
      setShowEventModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to broadcast event:', error);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    try {
      await eventsAPI.delete(id);
      loadData();
      setShowDayModal(false);
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  // Note functions
  const handleSaveNote = async () => {
    try {
      if (editingNote) {
        await notesAPI.update(editingNote._id, {
          title: formData.title,
          content: formData.content,
          color: formData.color
        });
      } else {
        await notesAPI.create({
          title: formData.title,
          content: formData.content,
          color: formData.color
        });
      }
      setShowNoteModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    try {
      await notesAPI.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const handlePinNote = async (note: Note) => {
    try {
      await notesAPI.update(note._id, { isPinned: !note.isPinned });
      loadData();
    } catch (error) {
      console.error('Failed to pin note:', error);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', description: '', date: '', time: '', color: COLORS[0] });
    setEditingNote(null);
    setEditingEvent(null);
  };

  const openEditNote = (note: Note) => {
    setFormData({
      title: note.title,
      content: note.content,
      description: '',
      date: '',
      time: '',
      color: note.color
    });
    setEditingNote(note);
    setShowNoteModal(true);
  };

  const formatDisplayDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  const selectedDayEvents = selectedDateStr ? getEventsForDateStr(selectedDateStr) : [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Notes & Calendar</h1>
        <p className="page-description">Organize your life with notes and events</p>
      </div>

      <div className="tabs" style={{ marginBottom: 24 }}>
        <button
          className={`tab ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          Calendar
        </button>
        <button
          className={`tab ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          Notes
        </button>
      </div>

      {activeTab === 'calendar' && (
        <div className="calendar">
          <div className="calendar-header">
            <h2 className="calendar-title">{monthName}</h2>
            <div className="calendar-nav">
              <button className="btn btn-ghost btn-icon" onClick={prevMonth}>
                ←
              </button>
              <button className="btn btn-ghost btn-icon" onClick={nextMonth}>
                →
              </button>
            </div>
          </div>

          <div className="calendar-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="calendar-day-header">{day}</div>
            ))}
            
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="calendar-day other-month" />
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              return (
                <div
                  key={day}
                  className={`calendar-day ${isToday(day) ? 'today' : ''}`}
                  onClick={() => handleDayClick(day)}
                >
                  <span className="calendar-day-number">{day}</span>
                  <div className="calendar-day-events">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event._id}
                        className="calendar-event-dot"
                        style={{ background: event.color }}
                        title={event.title}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'notes' && (
        <div>
          <button
            className="btn btn-primary"
            onClick={() => { resetForm(); setShowNoteModal(true); }}
            style={{ marginBottom: 24 }}
          >
            + New Note
          </button>

          {notes.length === 0 ? (
            <div className="empty-state">
              <p>No notes yet. Create your first note!</p>
            </div>
          ) : (
            <div className="notes-grid">
              {notes.map(note => (
                <div
                  key={note._id}
                  className={`note-card ${note.isPinned ? 'pinned' : ''}`}
                  style={{ '--note-color': note.color } as React.CSSProperties}
                  onClick={() => openEditNote(note)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h3 className="note-title">{note.title}</h3>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => { e.stopPropagation(); handlePinNote(note); }}
                      title={note.isPinned ? 'Unpin' : 'Pin'}
                    >
                      {note.isPinned ? '📌' : '📍'}
                    </button>
                  </div>
                  <p className="note-content">{note.content}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="note-meta">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => { e.stopPropagation(); handleDeleteNote(note._id); }}
                      style={{ color: 'var(--error)' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Day Detail Modal - Shows events for selected date */}
      {showDayModal && (
        <div className="modal-overlay" onClick={() => setShowDayModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {formatDisplayDate(selectedDateStr)}
              </h2>
              <button className="modal-close" onClick={() => setShowDayModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {selectedDayEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: 48, marginBottom: 16 }}>📅</p>
                  <p>Nothing planned for this day</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {selectedDayEvents.map(event => (
                    <div
                      key={event._id}
                      style={{
                        padding: 16,
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-secondary)',
                        borderLeft: `4px solid ${event.color}`,
                        cursor: 'pointer'
                      }}
                      onClick={() => handleEditEvent(event)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>{event.title}</h4>
                        {event.time && (
                          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{event.time}</span>
                        )}
                      </div>
                      {event.description && (
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
                          {event.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={(e) => { e.stopPropagation(); handleEditEvent(event); }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event._id); }}
                          style={{ color: 'var(--error)' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleAddEvent}>
                + Add Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingEvent ? 'Edit Event' : 'New Event'}
              </h2>
              <button className="modal-close" onClick={() => setShowEventModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="input-group" style={{ marginBottom: 16 }}>
                <label className="input-label">Title</label>
                <input
                  type="text"
                  className="input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Event title"
                />
              </div>
              <div className="input-group" style={{ marginBottom: 16 }}>
                <label className="input-label">Description</label>
                <textarea
                  className="input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Event description"
                  rows={3}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="input-group">
                  <label className="input-label">Date</label>
                  <input
                    type="date"
                    className="input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Time</label>
                  <input
                    type="time"
                    className="input"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Color</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      style={{
                        width: 32,
                        height: 32,
                        background: color,
                        border: formData.color === color ? '3px solid var(--text-primary)' : 'none',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {user?.role === 'admin' && !editingEvent && (
                <button className="btn btn-secondary" onClick={handleBroadcastEvent}>
                  📢 Broadcast to All
                </button>
              )}
              <button className="btn btn-primary" onClick={handleSaveEvent}>
                {editingEvent ? 'Save Changes' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="modal-overlay" onClick={() => setShowNoteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingNote ? 'Edit Note' : 'New Note'}
              </h2>
              <button className="modal-close" onClick={() => setShowNoteModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="input-group" style={{ marginBottom: 16 }}>
                <label className="input-label">Title</label>
                <input
                  type="text"
                  className="input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Note title"
                />
              </div>
              <div className="input-group" style={{ marginBottom: 16 }}>
                <label className="input-label">Content</label>
                <textarea
                  className="input"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your note..."
                  rows={6}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Color</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      style={{
                        width: 32,
                        height: 32,
                        background: color,
                        border: formData.color === color ? '3px solid var(--text-primary)' : 'none',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleSaveNote}>
                {editingNote ? 'Save Changes' : 'Create Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
