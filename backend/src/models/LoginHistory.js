const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    ref: 'User'
  },
  name: {
    type: String,
    required: true
  },
  loginTime: {
    type: Date,
    default: Date.now
  },
  logoutTime: {
    type: Date,
    default: null
  },
  deviceInfo: {
    deviceName: {
      type: String,
      default: 'Unknown'
    },
    platform: {
      type: String,
      enum: ['ios', 'android', 'web'],
      default: 'android'
    },
    appVersion: String,
    osVersion: String
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  ipAddress: String,
  status: {
    type: String,
    enum: ['active', 'logged_out'],
    default: 'active'
  },
  lastActiveTime: {
    type: Date,
    default: Date.now
  },
  facilityDetails: {
    district: String,
    facility_type: String,
    facility_name: String,
    facility_code: String,
    latitude: Number,
    longitude: Number
  }
}, {
  timestamps: true
});

const LoginHistory = mongoose.model('LoginHistory', loginHistorySchema);

module.exports = LoginHistory; 