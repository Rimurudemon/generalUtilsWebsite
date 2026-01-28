const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const { db, initializeDatabase, userHelpers } = require('./db/database');

// Initialize the database tables
initializeDatabase();

async function seedAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = db.prepare("SELECT * FROM users WHERE role = 'admin'").get();
    
    if (existingAdmin) {
      console.log('Admin user already exists:');
      console.log('  Email:', existingAdmin.email);
      console.log('  Username:', existingAdmin.username);
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Create admin user
    const result = db.prepare(`
      INSERT INTO users (username, email, password, role, display_name, is_onboarded)
      VALUES (?, ?, ?, 'admin', ?, 1)
    `).run('admin', 'admin@example.com', hashedPassword, 'Admin User');

    console.log('✓ Admin user created successfully!');
    console.log('');
    console.log('  Username: admin');
    console.log('  Email: admin@example.com');
    console.log('  Password: admin123');
    console.log('');
    console.log('  Please change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error.message);
    process.exit(1);
  }
}

seedAdmin();
