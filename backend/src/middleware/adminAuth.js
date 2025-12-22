const User = require('../models/User');

const adminAuth = async (req, res, next) => {
  try {
    // First check if user is authenticated (from auth middleware)
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if user is admin
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ message: 'Error verifying admin access' });
  }
};

module.exports = adminAuth;

