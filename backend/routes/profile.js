const express = require('express');
const { db, userHelpers } = require('../db/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get public profile by username
router.get('/:username', async (req, res) => {
  try {
    const user = userHelpers.findByUsername(req.params.username);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const apiUser = userHelpers.toApiFormat(user);
    
    res.json({
      username: apiUser.username,
      profile: apiUser.profile,
      stats: apiUser.stats,
      memberSince: user.created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update own profile
router.put('/', auth, async (req, res) => {
  try {
    const { displayName, bio, avatar, location, website, socialLinks, theme } = req.body;
    
    const updates = {};
    
    if (displayName !== undefined) updates.display_name = displayName;
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;
    if (location !== undefined) updates.location = location;
    if (website !== undefined) updates.website = website;
    if (theme !== undefined) updates.theme = theme;
    
    if (socialLinks) {
      if (socialLinks.twitter !== undefined) updates.social_twitter = socialLinks.twitter;
      if (socialLinks.instagram !== undefined) updates.social_instagram = socialLinks.instagram;
      if (socialLinks.github !== undefined) updates.social_github = socialLinks.github;
      if (socialLinks.linkedin !== undefined) updates.social_linkedin = socialLinks.linkedin;
      if (socialLinks.youtube !== undefined) updates.social_youtube = socialLinks.youtube;
      if (socialLinks.discord !== undefined) updates.social_discord = socialLinks.discord;
    }

    if (req.body.customLinks) {
      updates.custom_links = JSON.stringify(req.body.customLinks);
    }

    const user = userHelpers.update(req.userId, updates);
    const apiUser = userHelpers.toApiFormat(user);

    res.json({
      username: apiUser.username,
      profile: apiUser.profile,
      stats: apiUser.stats
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
    const existingUser = userHelpers.findById(req.userId);
    if (username && username !== existingUser.username) {
      const usernameTaken = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, req.userId);
      if (usernameTaken) {
        return res.status(400).json({ error: 'Username is already taken.' });
      }
    }
    
    const updates = {
      is_onboarded: 1,
      display_name: displayName || '',
      bio: bio || '',
      gender: gender || 'prefer-not-to-say'
    };

    if (username) {
      updates.username = username;
    }

    if (socialLinks) {
      if (socialLinks.twitter !== undefined) updates.social_twitter = socialLinks.twitter;
      if (socialLinks.instagram !== undefined) updates.social_instagram = socialLinks.instagram;
      if (socialLinks.github !== undefined) updates.social_github = socialLinks.github;
      if (socialLinks.linkedin !== undefined) updates.social_linkedin = socialLinks.linkedin;
      if (socialLinks.youtube !== undefined) updates.social_youtube = socialLinks.youtube;
      if (socialLinks.discord !== undefined) updates.social_discord = socialLinks.discord;
    }

    const user = userHelpers.update(req.userId, updates);

    res.json({
      user: userHelpers.toApiFormat(user)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
