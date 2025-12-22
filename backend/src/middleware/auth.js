const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findOne({ _id: decoded.userId });

    if (!user) {
      throw new Error('User not found');
    }

    // Include both user document and token payload data
    req.user = {
      ...user.toObject(),
      userId: decoded.userId, // Explicitly set userId from token
      name: decoded.name, // Use name from token
      loginHistoryId: decoded.loginHistoryId
    };
    
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ message: error.message || 'Please authenticate' });
  }
};

module.exports = auth; 