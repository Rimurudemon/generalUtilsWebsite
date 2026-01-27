const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  profile: {
    displayName: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 300 },
    avatar: { type: String, default: '' },
    location: { type: String, default: '' },
    website: { type: String, default: '' },
    socialLinks: {
      twitter: { type: String, default: '' },
      instagram: { type: String, default: '' },
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      youtube: { type: String, default: '' }
    },
    theme: { type: String, enum: ['dark', 'paper'], default: 'dark' }
  },
  stats: {
    pdfCompressed: { type: Number, default: 0 },
    imagesConverted: { type: Number, default: 0 },
    notesCreated: { type: Number, default: 0 },
    eventsCreated: { type: Number, default: 0 },
    cgpaCalculations: { type: Number, default: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
