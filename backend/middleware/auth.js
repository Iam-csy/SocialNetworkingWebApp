const crypto = require('crypto');
const User = require('../models/User');

// Generate a secure token using Node's built-in crypto module
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Auth middleware to protect routes
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Find user with this token
    const user = await User.findOne({ 'tokens.token': token });
    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = { authenticate, generateToken };
