const jwt = require('jsonwebtoken');
const User = require('../models/User');
const LoginHistory = require('../models/LoginHistory');

const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Create new user
    const user = new User({
      username,
      password
    });

    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
};

const login = async (req, res) => {
  try {
    const { username, password, name, deviceInfo = 'Unknown', location, facilityDetails } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required for login' });
    }

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create login history entry
    const loginHistory = new LoginHistory({
      username: user.username,
      name,
      deviceInfo: {
        deviceName: deviceInfo.deviceName || 'Unknown',
        platform: deviceInfo.platform || 'android',
        appVersion: deviceInfo.appVersion,
        osVersion: deviceInfo.osVersion
      },
      location: {
        latitude: location?.latitude,
        longitude: location?.longitude,
        address: location?.address
      },
      ipAddress: req.ip,
      status: 'active',
      facilityDetails: facilityDetails || null
    });

    await loginHistory.save();

    // Generate JWT token with login history ID
    const token = jwt.sign(
      { 
        userId: user._id,
        username: user.username,
        name,
        loginHistoryId: loginHistory._id 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name,
        username: user.username,
        role: user.role || 'user'
      },
      loginId: loginHistory._id
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
};

const logout = async (req, res) => {
  try {
    const { loginHistoryId } = req.user;
    
    // Update login history with logout time
    await LoginHistory.findByIdAndUpdate(loginHistoryId, {
      logoutTime: new Date(),
      status: 'logged_out'
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Error logging out' });
  }
};

const getActiveSessions = async (req, res) => {
  try {
    const activeSessions = await LoginHistory.find({
      username: req.user.username,
      status: 'active'
    }).sort({ loginTime: -1 });

    res.json(activeSessions);
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({ message: 'Error fetching active sessions' });
  }
};

const updateFacility = async (req, res) => {
  try {
    console.log('Received facility update request:', req.body);
    const { loginId, facilityDetails } = req.body;

    if (!loginId || !facilityDetails) {
      console.log('Missing required fields:', { loginId, facilityDetails });
      return res.status(400).json({ message: 'Login ID and facility details are required' });
    }

    const loginHistory = await LoginHistory.findById(loginId);
    if (!loginHistory) {
      console.log('Login history not found for ID:', loginId);
      return res.status(404).json({ message: 'Login history not found' });
    }

    console.log('Found login history:', loginHistory);
    console.log('Updating with facility details:', facilityDetails);

    loginHistory.facilityDetails = facilityDetails;
    await loginHistory.save();

    console.log('Successfully updated facility details');
    res.json({ message: 'Facility details updated successfully' });
  } catch (error) {
    console.error('Error updating facility details:', error);
    res.status(500).json({ message: 'Error updating facility details', error: error.message });
  }
};

const validateToken = async (req, res) => {
  try {
    // If the request reaches here, it means the auth middleware has already validated the token
    // Fetch the latest user data including role
    const user = await User.findById(req.user.userId || req.user._id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    res.status(200).json({ 
      valid: true,
      user: {
        id: user._id,
        name: req.user.name,
        username: user.username,
        role: user.role || 'user'
      }
    });
  } catch (error) {
    console.error('Validate token error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

const refreshToken = async (req, res) => {
  try {
    // Get the current user from the token (already validated by auth middleware)
    const user = await User.findById(req.user.userId || req.user._id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Get the login history ID from the token
    const loginHistoryId = req.user.loginHistoryId;
    
    // Verify login history exists and is active
    const loginHistory = await LoginHistory.findById(loginHistoryId);
    if (!loginHistory || loginHistory.status !== 'active') {
      return res.status(401).json({ message: 'Session expired or invalid' });
    }

    // Generate new JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        username: user.username,
        name: req.user.name,
        loginHistoryId: loginHistoryId 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: req.user.name,
        username: user.username,
        role: user.role || 'user'
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Error refreshing token' });
  }
};

module.exports = {
  register,
  login,
  logout,
  getActiveSessions,
  updateFacility,
  validateToken,
  refreshToken
}; 