const User = require('../models/User');

const vendorAuth = async (req, res, next) => {
  try {
    // First check if user is authenticated (from auth middleware)
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if user is admin or vendor
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.role !== 'admin' && user.role !== 'vendor') {
      return res.status(403).json({ message: 'Admin or vendor access required' });
    }

    // Attach user role and username to request for filtering
    req.user.role = user.role;
    req.user.username = user.username;

    next();
  } catch (error) {
    console.error('Vendor auth error:', error);
    res.status(500).json({ message: 'Error verifying access' });
  }
};

module.exports = vendorAuth;

