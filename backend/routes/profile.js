const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get public profile by username
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('username profile stats createdAt');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      username: user.username,
      profile: user.profile,
      stats: user.stats,
      memberSince: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update own profile
router.put('/', auth, async (req, res) => {
  try {
    const { displayName, bio, avatar, location, website, socialLinks, theme } = req.body;
    
    const updateData = {
      'profile.displayName': displayName,
      'profile.bio': bio,
      'profile.avatar': avatar,
      'profile.location': location,
      'profile.website': website,
      'profile.theme': theme
    };

    if (socialLinks) {
      updateData['profile.socialLinks'] = socialLinks;
    }

    if (req.body.customLinks) {
      updateData['profile.customLinks'] = req.body.customLinks;
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true }
    ).select('-password');

    res.json({
      username: user.username,
      profile: user.profile,
      stats: user.stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete onboarding
router.post('/onboarding', auth, async (req, res) => {
  try {
    const { displayName, username, gender, bio, socialLinks } = req.body;
    
    // Check if username is already taken (if changing)
    const existingUser = await User.findById(req.userId);
    if (username && username !== existingUser.username) {
      const usernameTaken = await User.findOne({ username, _id: { $ne: req.userId } });
      if (usernameTaken) {
        return res.status(400).json({ error: 'Username is already taken.' });
      }
    }
    
    const updateData = {
      isOnboarded: true,
      'profile.displayName': displayName || '',
      'profile.bio': bio || '',
      'profile.gender': gender || 'prefer-not-to-say'
    };

    if (username) {
      updateData.username = username;
    }

    if (socialLinks) {
      updateData['profile.socialLinks'] = socialLinks;
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true }
    ).select('-password');

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isOnboarded: user.isOnboarded,
        profile: user.profile,
        stats: user.stats
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
