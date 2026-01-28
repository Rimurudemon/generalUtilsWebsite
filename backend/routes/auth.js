const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db, userHelpers } = require('../db/database');
const { auth } = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = userHelpers.findByEmailOrUsername(email, username);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email or username.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = userHelpers.create({
      username,
      email,
      password: hashedPassword,
      displayName: username
    });

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: userHelpers.toApiFormat(user)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = userHelpers.findByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: userHelpers.toApiFormat(user)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Google Login/Signup
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const { email, name, picture, sub: googleId } = ticket.getPayload();

    let user = userHelpers.findByEmail(email);

    if (user) {
      // If user exists but no googleId, verify and link it
      if (!user.google_id) {
        user = userHelpers.update(user.id, { google_id: googleId });
      }
    } else {
      // Create new user with unique username
      user = userHelpers.create({
        email,
        googleId,
        username: email.split('@')[0] + Math.random().toString(36).substring(7),
        displayName: name,
        avatar: picture
      });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: userHelpers.toApiFormat(user)
    });

  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(400).json({ error: 'Google authentication failed' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json({
    user: userHelpers.toApiFormat(req.user)
  });
});

module.exports = router;
