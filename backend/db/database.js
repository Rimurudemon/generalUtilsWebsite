const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

// Initialize database
const dbPath = path.join(__dirname, '..', 'data', 'app.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize tables
function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      google_id TEXT UNIQUE,
      role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
      is_onboarded INTEGER DEFAULT 0,
      display_name TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      gender TEXT DEFAULT 'prefer-not-to-say' CHECK(gender IN ('male', 'female', 'other', 'prefer-not-to-say')),
      avatar TEXT DEFAULT '',
      location TEXT DEFAULT '',
      website TEXT DEFAULT '',
      social_twitter TEXT DEFAULT '',
      social_instagram TEXT DEFAULT '',
      social_github TEXT DEFAULT '',
      social_linkedin TEXT DEFAULT '',
      social_youtube TEXT DEFAULT '',
      social_discord TEXT DEFAULT '',
      custom_links TEXT DEFAULT '[]',
      theme TEXT DEFAULT 'dark' CHECK(theme IN ('dark', 'paper')),
      stat_pdf_compressed INTEGER DEFAULT 0,
      stat_images_converted INTEGER DEFAULT 0,
      stat_notes_created INTEGER DEFAULT 0,
      stat_events_created INTEGER DEFAULT 0,
      stat_cgpa_calculations INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Notes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      color TEXT DEFAULT '#8b5cf6',
      is_pinned INTEGER DEFAULT 0,
      tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Events table
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      date TEXT NOT NULL,
      time TEXT DEFAULT '',
      color TEXT DEFAULT '#8b5cf6',
      is_broadcast INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Courses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      semester INTEGER NOT NULL CHECK(semester >= 1 AND semester <= 8),
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      venue TEXT DEFAULT '',
      credits INTEGER NOT NULL CHECK(credits >= 1 AND credits <= 6),
      color TEXT DEFAULT '#8b5cf6',
      attendance_threshold INTEGER DEFAULT 80 CHECK(attendance_threshold >= 0 AND attendance_threshold <= 100),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Timetable slots table
  db.exec(`
    CREATE TABLE IF NOT EXISTS timetable_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      semester INTEGER NOT NULL CHECK(semester >= 1 AND semester <= 8),
      day INTEGER NOT NULL CHECK(day >= 0 AND day <= 6),
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    )
  `);

  // Timetable settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS timetable_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      attendance_threshold INTEGER DEFAULT 80 CHECK(attendance_threshold >= 0 AND attendance_threshold <= 100),
      active_semester INTEGER DEFAULT 1 CHECK(active_semester >= 1 AND active_semester <= 8),
      saturday_enabled INTEGER DEFAULT 0,
      sunday_enabled INTEGER DEFAULT 0,
      saturday_maps_to INTEGER,
      sunday_maps_to INTEGER,
      semester_start_date TEXT,
      semester_end_date TEXT,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Attendance records table
  db.exec(`
    CREATE TABLE IF NOT EXISTS attendance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      slot_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'attended' CHECK(status IN ('attended', 'missed', 'cancelled')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (slot_id) REFERENCES timetable_slots(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE(user_id, slot_id, date)
    )
  `);

  // CGPA records table
  db.exec(`
    CREATE TABLE IF NOT EXISTS cgpa_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      semester TEXT NOT NULL,
      courses TEXT NOT NULL,
      sgpa REAL NOT NULL,
      cgpa REAL NOT NULL,
      total_credits INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create indices for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
    CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);
    CREATE INDEX IF NOT EXISTS idx_courses_user_semester ON courses(user_id, semester);
    CREATE INDEX IF NOT EXISTS idx_slots_user_semester ON timetable_slots(user_id, semester);
    CREATE INDEX IF NOT EXISTS idx_attendance_user_course ON attendance_records(user_id, course_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_user_slot_date ON attendance_records(user_id, slot_id, date);
  `);

  console.log('✓ SQLite database initialized');
}

// Helper functions for common operations
const userHelpers = {
  findById: (id) => {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },
  
  findByEmail: (email) => {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },
  
  findByUsername: (username) => {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  },
  
  findByEmailOrUsername: (email, username) => {
    return db.prepare('SELECT * FROM users WHERE email = ? OR username = ?').get(email, username);
  },
  
  findByGoogleId: (googleId) => {
    return db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);
  },
  
  create: (userData) => {
    const stmt = db.prepare(`
      INSERT INTO users (username, email, password, google_id, display_name, avatar)
      VALUES (@username, @email, @password, @googleId, @displayName, @avatar)
    `);
    const result = stmt.run({
      username: userData.username,
      email: userData.email,
      password: userData.password || null,
      googleId: userData.googleId || null,
      displayName: userData.displayName || userData.username,
      avatar: userData.avatar || ''
    });
    return userHelpers.findById(result.lastInsertRowid);
  },
  
  update: (id, updates) => {
    const fields = [];
    const values = {};
    
    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = @${key}`);
      values[key] = value;
    }
    values.id = id;
    
    if (fields.length > 0) {
      db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = @id`).run(values);
    }
    return userHelpers.findById(id);
  },
  
  async comparePassword(inputPassword, hashedPassword) {
    return await bcrypt.compare(inputPassword, hashedPassword);
  },
  
  async hashPassword(password) {
    return await bcrypt.hash(password, 12);
  },
  
  // Convert flat DB row to nested user object for API responses
  toApiFormat: (user) => {
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isOnboarded: !!user.is_onboarded,
      profile: {
        displayName: user.display_name || '',
        bio: user.bio || '',
        gender: user.gender || 'prefer-not-to-say',
        avatar: user.avatar || '',
        location: user.location || '',
        website: user.website || '',
        socialLinks: {
          twitter: user.social_twitter || '',
          instagram: user.social_instagram || '',
          github: user.social_github || '',
          linkedin: user.social_linkedin || '',
          youtube: user.social_youtube || '',
          discord: user.social_discord || ''
        },
        customLinks: JSON.parse(user.custom_links || '[]'),
        theme: user.theme || 'dark'
      },
      stats: {
        pdfCompressed: user.stat_pdf_compressed || 0,
        imagesConverted: user.stat_images_converted || 0,
        notesCreated: user.stat_notes_created || 0,
        eventsCreated: user.stat_events_created || 0,
        cgpaCalculations: user.stat_cgpa_calculations || 0
      }
    };
  }
};

module.exports = {
  db,
  initializeDatabase,
  userHelpers
};
