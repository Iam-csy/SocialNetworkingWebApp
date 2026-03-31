const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

// GET /api/users - Get all users (for discovery, excludes self)
router.get('/', authenticate, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('name headline bio profilePicture location connections')
      .limit(50);
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:id - Get user profile
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -tokens')
      .populate('connections', 'name headline profilePicture');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/profile - Update own profile
router.put('/profile/update', authenticate, async (req, res) => {
  try {
    const { name, bio, headline, location } = req.body;
    const allowedUpdates = {};
    if (name !== undefined) allowedUpdates.name = name;
    if (bio !== undefined) allowedUpdates.bio = bio;
    if (headline !== undefined) allowedUpdates.headline = headline;
    if (location !== undefined) allowedUpdates.location = location;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    ).select('-password -tokens');

    res.json({ user, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/users/password - Change password
router.put('/password/change', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:id/connections - Get user's connections list
router.get('/:id/connections', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('connections', 'name headline profilePicture location');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ connections: user.connections });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
