const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

router.post('/request/:userId', authenticate, async (req, res) => {
  try {
    const targetId = req.params.userId;
    const requesterId = req.user._id;

    if (targetId === requesterId.toString()) {
      return res.status(400).json({ message: 'Cannot connect with yourself' });
    }

    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: 'User not found' });

    // Check if already connected
    if (req.user.connections.includes(targetId)) {
      return res.status(400).json({ message: 'Already connected' });
    }

    // Check if request already sent
    if (req.user.sentRequests.includes(targetId)) {
      return res.status(400).json({ message: 'Connection request already sent' });
    }

    // Check if target already sent a request (auto-accept)
    if (req.user.pendingRequests.includes(targetId)) {
      // Auto-accept: both become connected
      await User.findByIdAndUpdate(requesterId, {
        $addToSet: { connections: targetId },
        $pull: { pendingRequests: targetId }
      });
      await User.findByIdAndUpdate(targetId, {
        $addToSet: { connections: requesterId },
        $pull: { sentRequests: requesterId }
      });
      return res.json({ message: 'Connected! (auto-accepted mutual request)' });
    }

    // Send the request
    await User.findByIdAndUpdate(requesterId, { $addToSet: { sentRequests: targetId } });
    await User.findByIdAndUpdate(targetId, { $addToSet: { pendingRequests: requesterId } });

    res.json({ message: 'Connection request sent' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/connections/accept/:userId - Accept a connection request
router.post('/accept/:userId', authenticate, async (req, res) => {
  try {
    const requesterId = req.params.userId;
    const userId = req.user._id;

    // Check that the request actually exists
    if (!req.user.pendingRequests.map(id => id.toString()).includes(requesterId)) {
      return res.status(400).json({ message: 'No pending request from this user' });
    }

    // Add to connections on both sides, remove from pending/sent
    await User.findByIdAndUpdate(userId, {
      $addToSet: { connections: requesterId },
      $pull: { pendingRequests: requesterId }
    });
    await User.findByIdAndUpdate(requesterId, {
      $addToSet: { connections: userId },
      $pull: { sentRequests: userId }
    });

    res.json({ message: 'Connection accepted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/connections/reject/:userId - Reject a connection request
router.post('/reject/:userId', authenticate, async (req, res) => {
  try {
    const requesterId = req.params.userId;
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, { $pull: { pendingRequests: requesterId } });
    await User.findByIdAndUpdate(requesterId, { $pull: { sentRequests: userId } });

    res.json({ message: 'Connection request rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/connections/:userId - Remove a connection
router.delete('/:userId', authenticate, async (req, res) => {
  try {
    const targetId = req.params.userId;
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, { $pull: { connections: targetId } });
    await User.findByIdAndUpdate(targetId, { $pull: { connections: userId } });

    res.json({ message: 'Connection removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/connections/cancel/:userId - Cancel a sent request
router.post('/cancel/:userId', authenticate, async (req, res) => {
  try {
    const targetId = req.params.userId;
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, { $pull: { sentRequests: targetId } });
    await User.findByIdAndUpdate(targetId, { $pull: { pendingRequests: userId } });

    res.json({ message: 'Request cancelled' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/connections/pending - Get pending incoming requests
router.get('/pending/list', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('pendingRequests', 'name headline profilePicture location');
    res.json({ pendingRequests: user.pendingRequests });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
