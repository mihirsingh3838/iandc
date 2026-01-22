const Attendance = require('../models/Attendance');
const cloudinary = require('../config/cloudinary');

exports.markAttendance = async (req, res) => {
  try {
    const { attendanceType, selfieUrl, location, facilityDetails } = req.body;

    if (!req.user.name) {
      throw new Error('User name is required for marking attendance');
    }

    // Check for duplicate attendance within the last 10 seconds
    // This prevents double submissions from network retries or double clicks
    const tenSecondsAgo = new Date(Date.now() - 10000);
    const existingAttendance = await Attendance.findOne({
      userId: req.user._id,
      attendanceType,
      timestamp: { $gte: tenSecondsAgo },
      'location.coordinates': [location.longitude, location.latitude]
    });

    if (existingAttendance) {
      console.log('Duplicate attendance detected, returning existing record');
      return res.status(200).json({ 
        message: 'Attendance already marked', 
        attendance: existingAttendance 
      });
    }

    console.log('Attempting to upload image to Cloudinary...');
    console.log('Cloudinary config:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not set',
      api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set'
    });

    // Upload image to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(selfieUrl, {
      folder: 'attendance_selfies',
      resource_type: 'image'
    }).catch(error => {
      console.error('Cloudinary upload error:', error);
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    });

    console.log('Image uploaded successfully:', uploadResponse.secure_url);

    // Format location as GeoJSON
    const formattedLocation = {
      type: 'Point',
      coordinates: [location.longitude, location.latitude],
      name: location.name
    };

    const attendance = new Attendance({
      userId: req.user._id,
      username: req.user.username,
      name: req.user.name,
      attendanceType,
      selfieUrl: uploadResponse.secure_url,
      location: formattedLocation,
      facilityDetails
    });

    await attendance.save();
    res.status(201).json({ message: 'Attendance marked successfully', attendance });
  } catch (error) {
    console.error('Error marking attendance:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      error: error.message || 'Error marking attendance',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.getAttendanceHistory = async (req, res) => {
  try {
    if (!req.user.name) {
      throw new Error('User name is required for fetching attendance history');
    }

    const attendance = await Attendance.find({
      userId: req.user._id,
      name: req.user.name
    })
    .sort({ timestamp: -1 })
    .limit(50);
    
    res.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    res.status(500).json({ error: error.message || 'Error fetching attendance history' });
  }
}; 