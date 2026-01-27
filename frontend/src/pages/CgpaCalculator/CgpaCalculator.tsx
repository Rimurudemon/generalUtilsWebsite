import React, { useState, useEffect } from 'react';
import { cgpaAPI } from '../../api';
import type { CgpaRecord, Course } from '../../types';

const GRADE_POINTS: Record<string, number> = {
  'A': 10,
  'A-': 9,
  'B': 8,
  'B-': 7,
  'C': 6,
  'C-': 5,
  'D': 4,
  'F': 0,
};

const generateId = () => Math.random().toString(36).substr(2, 9);

export const CgpaCalculator: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([
    { id: generateId(), name: '', credits: 3, grade: 'A', gradePoints: 10 }
  ]);
  const [previousCredits, setPreviousCredits] = useState(0);
  const [previousCgpa, setPreviousCgpa] = useState(0);
  const [semester, setSemester] = useState('');
  const [archive, setArchive] = useState<CgpaRecord[]>([]);
  const [showArchive, setShowArchive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadArchive();
  }, []);

  const loadArchive = async () => {
    try {
      const data = await cgpaAPI.getArchive();
      setArchive(data);
    } catch (error) {
      console.error('Failed to load archive:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addCourse = () => {
    setCourses([...courses, { id: generateId(), name: '', credits: 3, grade: 'A', gradePoints: 10 }]);
  };

  const removeCourse = (id: string) => {
    if (courses.length > 1) {
      setCourses(courses.filter(c => c.id !== id));
    }
  };

  const updateCourse = (id: string, field: keyof Course, value: string | number) => {
    setCourses(courses.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, [field]: value };
      if (field === 'grade') {
        updated.gradePoints = GRADE_POINTS[value as string] || 0;
      }
      return updated;
    }));
  };

  // Calculate SGPA
  const currentCredits = courses.reduce((sum, c) => sum + c.credits, 0);
  const totalGradePoints = courses.reduce((sum, c) => sum + (c.credits * c.gradePoints), 0);
  const sgpa = currentCredits > 0 ? totalGradePoints / currentCredits : 0;

  // Calculate CGPA
  const totalCredits = previousCredits + currentCredits;
  const previousGradePoints = previousCredits * previousCgpa;
  const cgpa = totalCredits > 0 ? (previousGradePoints + totalGradePoints) / totalCredits : sgpa;

  const handleSaveToArchive = async () => {
    if (!semester.trim()) {
      alert('Please enter a semester name');
      return;
    }

    try {
      await cgpaAPI.saveToArchive({
        semester,
        courses: courses.map(c => ({
          name: c.name || 'Unnamed Course',
          credits: c.credits,
          grade: c.grade,
          gradePoints: c.gradePoints
        })),
        sgpa: parseFloat(sgpa.toFixed(2)),
        cgpa: parseFloat(cgpa.toFixed(2)),
        totalCredits
      });
      loadArchive();
      alert('Saved to archive!');
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleDeleteFromArchive = async (id: string) => {
    if (!confirm('Delete this record?')) return;
    try {
      await cgpaAPI.deleteFromArchive(id);
      loadArchive();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const shareToSocial = (platform: string) => {
    const text = `My SGPA: ${sgpa.toFixed(2)} | CGPA: ${cgpa.toFixed(2)} 🎓`;
    const url = window.location.href;
    
    const links: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      email: `mailto:?subject=My CGPA Results&body=${encodeURIComponent(text)}`,
    };

    window.open(links[platform], '_blank');
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">CGPA Calculator</h1>
        <p className="page-description">Calculate your SGPA and CGPA with ease</p>
      </div>

      <div className="cgpa-layout">
        <div>
          {/* Previous Semester Data */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 className="card-title" style={{ marginBottom: 16 }}>Previous Semesters</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="input-group">
                <label className="input-label">Credits Completed</label>
                <input
                  type="number"
                  className="input"
                  value={previousCredits || ''}
                  onChange={(e) => setPreviousCredits(Number(e.target.value))}
                  min="0"
                  placeholder="0"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Current CGPA</label>
                <input
                  type="number"
                  className="input"
                  value={previousCgpa || ''}
                  onChange={(e) => setPreviousCgpa(Number(e.target.value))}
                  min="0"
                  max="10"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Current Semester Courses */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Current Semester Courses</h3>
              <div className="input-group" style={{ width: 200 }}>
                <input
                  type="text"
                  className="input"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  placeholder="e.g., Fall 2024"
                  style={{ fontSize: 14, padding: '8px 12px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              {courses.map((course, index) => (
                <div key={course.id} className="course-input-row" style={{ marginBottom: 12 }}>
                  <div className="input-group">
                    {index === 0 && <label className="input-label">Course Name</label>}
                    <input
                      type="text"
                      className="input"
                      value={course.name}
                      onChange={(e) => updateCourse(course.id, 'name', e.target.value)}
                      placeholder="Course name"
                    />
                  </div>
                  <div className="input-group">
                    {index === 0 && <label className="input-label">Credits</label>}
                    <input
                      type="number"
                      className="input"
                      value={course.credits}
                      onChange={(e) => updateCourse(course.id, 'credits', Number(e.target.value))}
                      min="1"
                      max="6"
                    />
                  </div>
                  <div className="input-group">
                    {index === 0 && <label className="input-label">Grade</label>}
                    <select
                      className="input"
                      value={course.grade}
                      onChange={(e) => updateCourse(course.id, 'grade', e.target.value)}
                    >
                      {Object.keys(GRADE_POINTS).map(grade => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    className="btn btn-ghost btn-icon"
                    onClick={() => removeCourse(course.id)}
                    disabled={courses.length === 1}
                    style={{ marginTop: index === 0 ? 24 : 0 }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={addCourse}>
                + Add Course
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  document.querySelector('.result-display')?.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{ fontWeight: 600 }}
              >
                📊 Calculate SGPA
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  document.querySelector('.result-display')?.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{ 
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  fontWeight: 600
                }}
              >
                🧮 Calculate SGPA & CGPA
              </button>
            </div>
          </div>
        </div>

        {/* Results Sidebar */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="result-display">
              <div className="result-value">{sgpa.toFixed(2)}</div>
              <div className="result-label">Current SGPA</div>
            </div>
            <div className="result-display" style={{ marginBottom: 0 }}>
              <div className="result-value">{cgpa.toFixed(2)}</div>
              <div className="result-label">Overall CGPA</div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <h4 style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>Share Results</h4>
            <div className="share-buttons">
              <button className="share-btn whatsapp" onClick={() => shareToSocial('whatsapp')} title="WhatsApp">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </button>
              <button className="share-btn twitter" onClick={() => shareToSocial('twitter')} title="Twitter/X">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </button>
              <button className="share-btn facebook" onClick={() => shareToSocial('facebook')} title="Facebook">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
              <button className="share-btn telegram" onClick={() => shareToSocial('telegram')} title="Telegram">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </button>
              <button className="share-btn email" onClick={() => shareToSocial('email')} title="Email">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ color: 'var(--text-secondary)' }}>Actions</h4>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={handleSaveToArchive}
              style={{ width: '100%', marginBottom: 12 }}
            >
              📁 Save to Archive
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowArchive(true)}
              style={{ width: '100%' }}
            >
              📂 View Archive ({archive.length})
            </button>
          </div>

          {/* Grade Scale Reference */}
          <div className="card" style={{ marginTop: 16 }}>
            <h4 style={{ marginBottom: 12, color: 'var(--text-secondary)', fontSize: 14 }}>Grade Scale</h4>
            <div className="grade-scale">
              {Object.entries(GRADE_POINTS).map(([grade, points]) => (
                <div key={grade} className="grade-item">
                  <span style={{ fontWeight: 600 }}>{grade}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{points}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Archive Modal */}
      {showArchive && (
        <div className="modal-overlay" onClick={() => setShowArchive(false)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">CGPA Archive</h2>
              <button className="modal-close" onClick={() => setShowArchive(false)}>×</button>
            </div>
            <div className="modal-body">
              {archive.length === 0 ? (
                <div className="empty-state">
                  <p>No archived records yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {archive.map(record => (
                    <div key={record._id} className="card" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <h4 style={{ color: 'var(--accent-primary)' }}>{record.semester}</h4>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleDeleteFromArchive(record._id)}
                          style={{ color: 'var(--error)' }}
                        >
                          Delete
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: 24, color: 'var(--text-secondary)', fontSize: 14 }}>
                        <span><strong>SGPA:</strong> {record.sgpa.toFixed(2)}</span>
                        <span><strong>CGPA:</strong> {record.cgpa.toFixed(2)}</span>
                        <span><strong>Credits:</strong> {record.totalCredits}</span>
                      </div>
                      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                        {record.courses.length} courses • {new Date(record.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
