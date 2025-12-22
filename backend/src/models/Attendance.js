const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  attendanceType: {
    type: String,
    enum: ['Check In', 'Check Out'],
    required: true
  },
  selfieUrl: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    name: {
      type: String,
      required: true
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  facilityDetails: {
    district: String,
    facility_type: String,
    facility_name: String,
    facility_code: String
  }
}, {
  timestamps: true
});

// Add a 2dsphere index on the location field
attendanceSchema.index({ location: '2dsphere' });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance; 