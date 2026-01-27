import React, { useState, useEffect, useCallback } from 'react';
import { timetableAPI } from '../../api';
import type { TimetableCourse, TimetableSlot, AttendanceStats, TimetableSettings } from '../../types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

const COLORS = [
  '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', 
  '#ef4444', '#6366f1', '#14b8a6', '#f97316', '#84cc16'
];

// Scale constants
const HOUR_WIDTH = 100; // px per hour (horizontal width)
const ROW_HEIGHT = 100; // px per day row

export const Timetable: React.FC = () => {
  // State
  const [settings, setSettings] = useState<TimetableSettings | null>(null);
  const [courses, setCourses] = useState<TimetableCourse[]>([]);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [stats, setStats] = useState<AttendanceStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timetable' | 'attendance'>('timetable');
  
  // Course form
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<TimetableCourse | null>(null);
  const [courseForm, setCourseForm] = useState({
    name: '', code: '', venue: '', credits: 3, color: COLORS[0], attendanceThreshold: 75
  });

  // Drag state
  const [draggedCourse, setDraggedCourse] = useState<TimetableCourse | null>(null);
  // Resizing state
  const [resizingState, setResizingState] = useState<{ slotId: string; startX: number; startEndTimeMinutes: number; newEndTime: string } | null>(null);

  // Settings modal
  const [showSettings, setShowSettings] = useState(false);

  const semester = settings?.activeSemester || 1;

  // Load data
  const loadData = useCallback(async () => {
    try {
      const [settingsData, coursesData, slotsData, statsData] = await Promise.all([
        timetableAPI.getSettings(),
        timetableAPI.getCourses(semester),
        timetableAPI.getSlots(semester),
        timetableAPI.getAttendanceStats(semester)
      ]);
      setSettings(settingsData);
      setCourses(coursesData);
      setSlots(slotsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [semester]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Global Resize Listeners
  useEffect(() => {
    if (!resizingState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizingState.startX;
      const deltaMinutes = (deltaX / HOUR_WIDTH) * 60; 
      
      const newMinutes = Math.max(resizingState.startEndTimeMinutes + deltaMinutes, resizingState.startEndTimeMinutes - 30); 
      
      const slot = slots.find(s => s._id === resizingState.slotId);
      if (!slot) return;
      
      const startMins = timeToMinutes(slot.startTime);
      // Snap to 15m
      const finalMins = Math.max(startMins + 30, Math.round((resizingState.startEndTimeMinutes + deltaMinutes) / 15) * 15); 
      
      const h = Math.floor(finalMins / 60);
      const m = finalMins % 60;
      const newTimeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      
      setResizingState(prev => prev ? { ...prev, newEndTime: newTimeStr } : null);
    };

    const handleMouseUp = async () => {
      if (resizingState) {
        try {
          await timetableAPI.updateSlot(resizingState.slotId, { endTime: resizingState.newEndTime });
          setSlots(prev => prev.map(s => s._id === resizingState.slotId ? { ...s, endTime: resizingState.newEndTime } : s));
          loadData(); 
        } catch (error) {
          console.error('Failed to resize slot:', error);
        }
        setResizingState(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingState, slots, loadData]);


  // Course CRUD
  const handleSaveCourse = async () => {
    try {
      if (editingCourse) {
        await timetableAPI.updateCourse(editingCourse._id, courseForm);
      } else {
        await timetableAPI.createCourse({ ...courseForm, semester });
      }
      loadData();
      setShowCourseForm(false);
      setEditingCourse(null);
      setCourseForm({ name: '', code: '', venue: '', credits: 3, color: COLORS[0], attendanceThreshold: 75 });
    } catch (error) {
      console.error('Failed to save course:', error);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Delete this course and all its scheduled slots?')) return;
    try {
      await timetableAPI.deleteCourse(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete course:', error);
    }
  };

  // Slot management
  const handleDrop = async (day: number, hour: number) => {
    if (!draggedCourse) return;
    
    // Check if day is enabled
    const isWorking = isDayEnabled(day);
    if (!isWorking) return;

    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
    
    try {
      await timetableAPI.createSlot({
        courseId: draggedCourse._id,
        semester,
        day,
        startTime,
        endTime
      });
      loadData();
    } catch (error) {
      console.error('Failed to create slot:', error);
    }
    setDraggedCourse(null);
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await timetableAPI.deleteSlot(slotId);
      loadData();
    } catch (error) {
      console.error('Failed to delete slot:', error);
    }
  };

  // Settings
  const handleUpdateSettings = async (updates: Partial<TimetableSettings>) => {
    try {
      let finalUpdates = updates;
      
      // If updating deeply nested weekend settings, we need to merge carefully
      if (updates.weekendSettings) {
        finalUpdates = {
          ...updates,
          weekendSettings: {
            ...settings?.weekendSettings || { saturdayEnabled: false, sundayEnabled: false, saturdayMapsTo: null, sundayMapsTo: null },
            ...updates.weekendSettings
          }
        };
      }
      
      const updated = await timetableAPI.updateSettings(finalUpdates);
      setSettings(updated);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  // Time helpers
  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const getSlotStyle = (slot: TimetableSlot, isResizing: boolean, currentNewEndTime?: string) => {
    const startMins = timeToMinutes(slot.startTime) - 8 * 60;
    const effectiveEndTime = (isResizing && currentNewEndTime) ? currentNewEndTime : slot.endTime;
    const endMins = timeToMinutes(effectiveEndTime) - 8 * 60;
    
    const left = (startMins / 60) * HOUR_WIDTH; 
    const width = Math.max(HOUR_WIDTH / 2, ((endMins - startMins) / 60) * HOUR_WIDTH); 
    
    return { 
      left: `${left}px`, 
      width: `${width}px`,
      zIndex: isResizing ? 10 : 1
    };
  };

  // Helper to get slots for a specific day column (handling mapped weekends)
  const getRenderSlotsForDay = (dayIndex: number) => {
    if (dayIndex === 5 && settings?.weekendSettings?.saturdayEnabled && settings.weekendSettings.saturdayMapsTo !== null) {
      return slots.filter(s => s.day === settings.weekendSettings.saturdayMapsTo).map(s => ({ ...s, _virtual: true })); // Mark as virtual/mapped
    }
    if (dayIndex === 6 && settings?.weekendSettings?.sundayEnabled && settings.weekendSettings.sundayMapsTo !== null) {
      return slots.filter(s => s.day === settings.weekendSettings.sundayMapsTo).map(s => ({ ...s, _virtual: true }));
    }
    return slots.filter(s => s.day === dayIndex);
  };

  const isDayEnabled = (dayIndex: number) => {
    if (dayIndex <= 4) return true;
    if (dayIndex === 5) return settings?.weekendSettings?.saturdayEnabled || false;
    return settings?.weekendSettings?.sundayEnabled || false;
  };

  if (isLoading) {
    return <div className="loading"><div className="spinner" /></div>;
  }

  return (
    <div className="timetable-page-container">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-title">📅 Smart Timetable</h1>
            <p className="page-description">Manage your schedule and attendance</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              className="input"
              value={semester}
              onChange={(e) => handleUpdateSettings({ activeSemester: Number(e.target.value) })}
              style={{ width: 140 }}
            >
              {[1,2,3,4,5,6,7,8].map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
            <button className="btn btn-ghost" onClick={() => setShowSettings(true)} title="Settings">
              ⚙️
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button
          className={`btn ${activeTab === 'timetable' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('timetable')}
        >
          📆 Timetable
        </button>
        <button
          className={`btn ${activeTab === 'attendance' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('attendance')}
        >
          📊 Attendance
        </button>
      </div>

      {activeTab === 'timetable' && (
        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: 24 }}>
          {/* Course Cards Panel */}
          <div className="card" style={{ height: 'fit-content', maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Courses</h3>
              <button className="btn btn-primary btn-sm" onClick={() => setShowCourseForm(true)}>
                +
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {courses.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 16 }}>
                  No courses.
                </p>
              )}
              {courses.map(course => (
                <div
                  key={course._id}
                  draggable
                  onDragStart={() => setDraggedCourse(course)}
                  onDragEnd={() => setDraggedCourse(null)}
                  style={{
                    padding: '12px 14px',
                    background: course.color + '20',
                    borderLeft: `4px solid ${course.color}`,
                    borderRadius: '8px',
                    cursor: 'grab',
                    transition: 'transform 0.15s ease'
                  }}
                  className="course-card"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{course.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {course.code}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        className="btn btn-ghost btn-icon"
                        style={{ padding: 4 }}
                        onClick={() => {
                          setEditingCourse(course);
                          setCourseForm({
                            name: course.name,
                            code: course.code,
                            venue: course.venue,
                            credits: course.credits,
                            color: course.color,
                            attendanceThreshold: course.attendanceThreshold || 75
                          });
                          setShowCourseForm(true);
                        }}
                      >
                        ✏️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: 20, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <strong>Tip:</strong> Drag courses to the grid. Drag the right edge of a slot to resize it.
            </div>
          </div>

          {/* Timetable Grid */}
          <div className="card" style={{ overflow: 'auto', padding: 0 }}>
            <div style={{ minWidth: 1400, padding: 16 }}> {/* Wide layout */}
              {/* Header row: Times */}
              <div style={{ display: 'grid', gridTemplateColumns: `120px repeat(13, ${HOUR_WIDTH}px)`, borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ padding: 12, fontWeight: 600, fontSize: 13, color: 'var(--text-muted)' }}>Day / Time</div>
                {HOURS.map(hour => (
                  <div key={hour} style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600, fontSize: 13, color: 'var(--text-muted)', borderLeft: '1px solid var(--border-subtle)' }}>
                    {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                  </div>
                ))}
              </div>

              {/* Day Rows */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {DAYS.map((day, dayIndex) => {
                  const enabled = isDayEnabled(dayIndex);
                  const isWeekend = dayIndex > 4;
                  const daySlots = getRenderSlotsForDay(dayIndex);
                  
                  return (
                    <div 
                      key={day} 
                      style={{ 
                        display: 'grid',
                        gridTemplateColumns: `120px repeat(13, ${HOUR_WIDTH}px)`,
                        minHeight: ROW_HEIGHT,
                        borderBottom: '1px solid var(--border-subtle)',
                        background: enabled ? 'transparent' : 'var(--bg-secondary)', 
                      }}
                    >
                      {/* Day Label Column */}
                      <div style={{ 
                        padding: 16, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center', 
                        gap: 8,
                        background: enabled ? 'var(--bg-card)' : 'transparent',
                        borderRight: '1px solid var(--border-subtle)'
                      }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: enabled ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {day}
                        </span>
                        {isWeekend && (
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                            <input 
                              type="checkbox"
                              checked={enabled}
                              onChange={(e) => {
                                const key = dayIndex === 5 ? 'saturdayEnabled' : 'sundayEnabled';
                                const current = settings?.weekendSettings || { saturdayEnabled: false, sundayEnabled: false, saturdayMapsTo: null, sundayMapsTo: null };
                                handleUpdateSettings({ 
                                  weekendSettings: { ...current, [key]: e.target.checked } 
                                });
                              }}
                            />
                            {enabled ? 'Active' : 'Off'}
                          </label>
                        )}
                      </div>

                      {/* Time Columns for this Day (Drag Targets) inside a relative container for absolute positioning */}
                      <div style={{ gridColumn: '2 / -1', position: 'relative', display: 'grid', gridTemplateColumns: `repeat(13, ${HOUR_WIDTH}px)`, height: '100%' }}>
                        
                        {/* Background Grid Lines & Drop Targets */}
                        {HOURS.map(hour => (
                          <div
                            key={hour}
                            style={{
                              height: '100%',
                              borderLeft: '1px solid var(--border-subtle)',
                              position: 'relative',
                              background: (draggedCourse && enabled) ? 'rgba(139, 92, 246, 0.05)' : 'transparent'
                            }}
                            onDragOver={(e) => {
                              if (enabled) e.preventDefault(); 
                            }}
                            onDrop={() => {
                              if (enabled) handleDrop(dayIndex, hour);
                            }}
                          >
                            {/* 30-min guide line */}
                            <div style={{ 
                              position: 'absolute', 
                              top: 0, 
                              bottom: 0, 
                              left: '50%', 
                              borderLeft: '1px dashed var(--border-subtle)', 
                              opacity: 0.3,
                              pointerEvents: 'none'
                            }} />
                          </div>
                        ))}

                        {/* Rendered Slots (Absolute positioned within the day row) */}
                        {daySlots.map(slot => {
                          const isResizing = resizingState?.slotId === slot._id;
                          const isVirtual = (slot as any)._virtual;
                          
                          return (
                            <div
                              key={slot._id}
                              style={{
                                position: 'absolute',
                                top: 6,
                                bottom: 6,
                                ...getSlotStyle(slot, isResizing, resizingState?.newEndTime),
                                background: slot.course.color,
                                opacity: isVirtual ? 0.7 : 1, 
                                borderRadius: 8,
                                padding: '8px 10px',
                                color: 'white',
                                fontSize: 13,
                                overflow: 'hidden',
                                cursor: isVirtual ? 'default' : 'pointer',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                border: isVirtual ? '2px dashed rgba(255,255,255,0.5)' : '1px solid rgba(0,0,0,0.1)'
                              }}
                            >
                              <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {slot.course.name}
                              </div>
                              <div style={{ opacity: 0.9, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {slot.course.venue}
                              </div>
                              <div style={{ opacity: 0.8, fontSize: 10, marginTop: 2 }}>
                                {slot.startTime} - {slot.endTime}
                              </div>
                              
                              {/* Controls */}
                              {!isVirtual && (
                                <>
                                  <button
                                    style={{
                                      position: 'absolute',
                                      top: 4,
                                      right: 4,
                                      background: 'rgba(0,0,0,0.2)',
                                      border: 'none',
                                      borderRadius: 4,
                                      width: 18,
                                      height: 18,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: 'white',
                                      fontSize: 12,
                                      cursor: 'pointer',
                                      lineHeight: 1
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSlot(slot._id);
                                    }}
                                    title="Remove class"
                                  >
                                    ×
                                  </button>
                                  {/* Resize handle (Right Edge) */}
                                  <div
                                    style={{
                                      position: 'absolute',
                                      top: 0,
                                      bottom: 0,
                                      right: 0,
                                      width: 12,
                                      cursor: 'ew-resize',
                                      display: 'flex',
                                      justifyContent: 'center',
                                      alignItems: 'center'
                                    }}
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault(); 
                                      setResizingState({ 
                                        slotId: slot._id, 
                                        startX: e.clientX, 
                                        startEndTimeMinutes: timeToMinutes(slot.endTime),
                                        newEndTime: slot.endTime
                                      });
                                    }}
                                  >
                                    {/* Handle visual indicator */}
                                    <div style={{ height: 20, width: 4, background: 'rgba(255,255,255,0.4)', borderRadius: 2 }} />
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div>
          <div className="card">
            <h3 style={{ marginBottom: 20, fontSize: 18 }}>📊 Attendance Dashboard</h3>
            
            {stats.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
                No courses found. Add courses and schedule classes first.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {stats.map(stat => {
                  const threshold = stat.course.attendanceThreshold || settings?.attendanceThreshold || 80;
                  const isWarning = stat.percentage <= threshold + 2 && stat.percentage > threshold;
                  const isDanger = stat.percentage <= threshold;
                  
                  return (
                    <div
                      key={stat.course._id}
                      style={{
                        padding: 16,
                        background: 'var(--bg-elevated)',
                        borderRadius: 12,
                        border: `1px solid ${isDanger ? 'var(--error)' : isWarning ? '#f59e0b' : 'var(--border-subtle)'}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 15 }}>{stat.course.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            {stat.course.code} • {stat.course.credits} credits
                          </div>
                        </div>
                        <div style={{ 
                          fontSize: 24, 
                          fontWeight: 700, 
                          color: isDanger ? 'var(--error)' : isWarning ? '#f59e0b' : 'var(--success)'
                        }}>
                          {stat.percentage.toFixed(1)}%
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div style={{ 
                        height: 8, 
                        background: 'var(--bg-card)', 
                        borderRadius: 4, 
                        overflow: 'hidden',
                        marginBottom: 12
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${stat.percentage}%`,
                          background: isDanger ? 'var(--error)' : isWarning ? '#f59e0b' : 'var(--success)',
                          borderRadius: 4,
                          transition: 'width 0.3s ease'
                        }} />
                      </div>

                      <div style={{ display: 'flex', gap: 24, fontSize: 12, color: 'var(--text-secondary)' }}>
                        <span>✅ Attended: {stat.attended}</span>
                        <span>❌ Missed: {stat.missed}</span>
                        <span>🚫 Cancelled: {stat.cancelled}</span>
                        <span style={{ marginLeft: 'auto', color: stat.leavesRemaining <= 2 ? 'var(--error)' : 'inherit' }}>
                          📋 Leaves remaining: {stat.leavesRemaining}/{stat.allowedLeaves}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Course Form Modal */}
      {showCourseForm && (
        <div className="modal-overlay" onClick={() => { setShowCourseForm(false); setEditingCourse(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingCourse ? 'Edit Course' : 'Add Course'}</h2>
              <button className="modal-close" onClick={() => { setShowCourseForm(false); setEditingCourse(null); }}>×</button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">Subject Name</label>
                <input
                  type="text"
                  className="input"
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                  placeholder="e.g., Data Structures"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label className="input-label">Subject Code</label>
                  <input
                    type="text"
                    className="input"
                    value={courseForm.code}
                    onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                    placeholder="e.g., CS201"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Venue</label>
                  <input
                    type="text"
                    className="input"
                    value={courseForm.venue}
                    onChange={(e) => setCourseForm({ ...courseForm, venue: e.target.value })}
                    placeholder="e.g., Room 101"
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label className="input-label">Credits</label>
                  <select
                    className="input"
                    value={courseForm.credits}
                    onChange={(e) => setCourseForm({ ...courseForm, credits: Number(e.target.value) })}
                  >
                    {[1,2,3,4,5,6].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Color</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          background: color,
                          border: courseForm.color === color ? '3px solid white' : 'none',
                          boxShadow: courseForm.color === color ? `0 0 0 2px ${color}` : 'none',
                          cursor: 'pointer'
                        }}
                        onClick={() => setCourseForm({ ...courseForm, color })}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="input-group" style={{ marginTop: 12 }}>
                <label className="input-label">Attendance Requirement (%)</label>
                <input
                  type="number"
                  className="input"
                  value={courseForm.attendanceThreshold}
                  onChange={(e) => setCourseForm({ ...courseForm, attendanceThreshold: Number(e.target.value) })}
                  min={0}
                  max={100}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowCourseForm(false); setEditingCourse(null); }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveCourse} disabled={!courseForm.name || !courseForm.code}>
                {editingCourse ? 'Save Changes' : 'Add Course'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h2 className="modal-title">⚙️ Settings</h2>
              <button className="modal-close" onClick={() => setShowSettings(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">Attendance Threshold (%)</label>
                <input
                  type="number"
                  className="input"
                  value={settings?.attendanceThreshold || 80}
                  onChange={(e) => handleUpdateSettings({ attendanceThreshold: Number(e.target.value) })}
                  min={0}
                  max={100}
                />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Classes will turn red when attendance drops near this threshold
                </span>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '16px 0' }} />

              <h4 style={{ marginBottom: 12, color: 'var(--text-secondary)' }}>Weekend Configuration</h4>
              
              <div style={{ display: 'flex', gap: 24 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings?.weekendSettings?.saturdayEnabled || false}
                    onChange={(e) => handleUpdateSettings({
                      weekendSettings: { 
                        ...settings?.weekendSettings || { saturdayEnabled: false, sundayEnabled: false, saturdayMapsTo: null, sundayMapsTo: null },
                        saturdayEnabled: e.target.checked 
                      }
                    })}
                  />
                  Saturday
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings?.weekendSettings?.sundayEnabled || false}
                    onChange={(e) => handleUpdateSettings({
                      weekendSettings: { 
                        ...settings?.weekendSettings || { saturdayEnabled: false, sundayEnabled: false, saturdayMapsTo: null, sundayMapsTo: null },
                        sundayEnabled: e.target.checked 
                      }
                    })}
                  />
                  Sunday
                </label>
              </div>

              {settings?.weekendSettings?.saturdayEnabled && (
                <div className="input-group" style={{ marginTop: 12 }}>
                  <label className="input-label">Map Saturday to:</label>
                  <select
                    className="input"
                    value={settings?.weekendSettings?.saturdayMapsTo ?? ''}
                    onChange={(e) => handleUpdateSettings({
                      weekendSettings: {
                        ...settings?.weekendSettings || { saturdayEnabled: false, sundayEnabled: false, saturdayMapsTo: null, sundayMapsTo: null },
                        saturdayMapsTo: e.target.value ? Number(e.target.value) : null 
                      }
                    })}
                  >
                    <option value="">Independent schedule</option>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((d, i) => (
                      <option key={d} value={i}>{d}'s schedule</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowSettings(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
