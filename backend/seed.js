const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/personalwebsite')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const User = require('./models/User');

async function seedAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists:');
      console.log('  Email:', existingAdmin.email);
      console.log('  Username:', existingAdmin.username);
      process.exit(0);
    }

    // Create admin user
    const admin = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
      profile: {
        displayName: 'Admin User'
      }
    });

    await admin.save();

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
