const ICSubmission = require('../models/ICSubmission');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// Helper function to get username prefix filter for vendors
const getVendorFilter = async (vendorUsername) => {
  // Extract prefix from vendor username (e.g., "wdc_admin" -> "wdc")
  const prefix = vendorUsername.replace(/_admin$/, '');
  
  // Find all users whose username starts with the prefix
  const users = await User.find({ 
    username: { $regex: `^${prefix}`, $options: 'i' } 
  }).select('_id');
  
  const userIds = users.map(user => user._id);
  return { userId: { $in: userIds } };
};

// Get all I&C submissions with user and facility details
const getAllSubmissions = async (req, res) => {
  try {
    let query = { status: { $in: ['submitted', 'approved', 'rejected'] } };
    
    // If user is a vendor, filter by username prefix
    if (req.user.role === 'vendor' && req.user.username) {
      const vendorFilter = await getVendorFilter(req.user.username);
      query = { ...query, ...vendorFilter };
    }
    
    const submissions = await ICSubmission.find(query)
      .populate('userId', 'name username')
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (error) {
    console.error('Get all submissions error:', error);
    res.status(500).json({ message: 'Error fetching submissions', error: error.message });
  }
};

// Get submissions grouped by facility
const getSubmissionsByFacility = async (req, res) => {
  try {
    let query = { status: { $in: ['submitted', 'approved', 'rejected'] } };
    
    // If user is a vendor, filter by username prefix
    if (req.user.role === 'vendor' && req.user.username) {
      const vendorFilter = await getVendorFilter(req.user.username);
      query = { ...query, ...vendorFilter };
    }
    
    const submissions = await ICSubmission.find(query)
      .populate('userId', 'name username')
      .sort({ submittedAt: -1 });

    // Group by facilityId
    const grouped = submissions.reduce((acc, submission) => {
      const facilityId = submission.facilityId;
      if (!acc[facilityId]) {
        acc[facilityId] = [];
      }
      acc[facilityId].push(submission);
      return acc;
    }, {});

    res.json(grouped);
  } catch (error) {
    console.error('Get submissions by facility error:', error);
    res.status(500).json({ message: 'Error fetching submissions by facility', error: error.message });
  }
};

// Approve or reject a submission
const reviewSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // action: 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be "approve" or "reject"' });
    }

    const submission = await ICSubmission.findById(id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (submission.status === 'draft') {
      return res.status(400).json({ message: 'Cannot review draft submissions' });
    }

    // If user is a vendor, verify they can review this submission
    if (req.user.role === 'vendor' && req.user.username) {
      const vendorFilter = await getVendorFilter(req.user.username);
      const canReview = await ICSubmission.findOne({ 
        _id: id, 
        ...vendorFilter 
      });
      if (!canReview) {
        return res.status(403).json({ message: 'You can only review submissions from your vendor group' });
      }
    }

    submission.approvalStatus = {
      reviewedBy: req.user.userId,
      reviewedAt: new Date(),
      reviewReason: reason || '',
      reviewStatus: action === 'approve' ? 'approved' : 'rejected'
    };

    submission.status = action === 'approve' ? 'approved' : 'rejected';
    await submission.save();

    res.json(submission);
  } catch (error) {
    console.error('Review submission error:', error);
    res.status(500).json({ message: 'Error reviewing submission', error: error.message });
  }
};

// Get dashboard insights
const getDashboardInsights = async (req, res) => {
  try {
    // Build base match query
    let baseMatch = { status: { $in: ['submitted', 'approved', 'rejected'] } };
    
    // If user is a vendor, filter by username prefix
    if (req.user.role === 'vendor' && req.user.username) {
      const vendorFilter = await getVendorFilter(req.user.username);
      baseMatch = { ...baseMatch, ...vendorFilter };
    }
    
    const totalSubmissions = await ICSubmission.countDocuments(baseMatch);
    const pendingSubmissions = await ICSubmission.countDocuments({ 
      ...baseMatch,
      status: 'submitted',
      'approvalStatus.reviewStatus': 'pending'
    });
    const approvedSubmissions = await ICSubmission.countDocuments({ 
      ...baseMatch,
      'approvalStatus.reviewStatus': 'approved'
    });
    const rejectedSubmissions = await ICSubmission.countDocuments({ 
      ...baseMatch,
      'approvalStatus.reviewStatus': 'rejected'
    });

    // Get submissions by facility
    const submissionsByFacility = await ICSubmission.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$facilityId', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get submissions by user
    const submissionsByUser = await ICSubmission.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: { userId: '$_id', userName: '$user.name', username: '$user.username', count: 1 } },
      { $sort: { count: -1 } }
    ]);

    // Get recent submissions
    const recentSubmissions = await ICSubmission.find(baseMatch)
      .populate('userId', 'name username')
      .sort({ submittedAt: -1 })
      .limit(10);

    res.json({
      totalSubmissions,
      pendingSubmissions,
      approvedSubmissions,
      rejectedSubmissions,
      submissionsByFacility,
      submissionsByUser,
      recentSubmissions
    });
  } catch (error) {
    console.error('Get dashboard insights error:', error);
    res.status(500).json({ message: 'Error fetching dashboard insights', error: error.message });
  }
};

// Get all attendance records
const getAllAttendance = async (req, res) => {
  try {
    let query = {};
    
    // If user is a vendor, filter by username prefix
    if (req.user.role === 'vendor' && req.user.username) {
      const vendorFilter = await getVendorFilter(req.user.username);
      query = vendorFilter;
    }
    
    const attendance = await Attendance.find(query)
      .populate('userId', 'name username')
      .sort({ timestamp: -1 })
      .limit(1000); // Limit to recent 1000 records

    // Remove duplicates based on userId, timestamp, and attendanceType
    // If two records have the same userId, timestamp (within 5 seconds), and attendanceType, keep only one
    const uniqueAttendance = [];
    const seen = new Map();
    
    attendance.forEach(record => {
      const key = `${record.userId?._id || record.userId}-${record.attendanceType}-${Math.floor(new Date(record.timestamp).getTime() / 5000)}`;
      if (!seen.has(key)) {
        seen.set(key, true);
        uniqueAttendance.push(record);
      }
    });

    res.json(uniqueAttendance);
  } catch (error) {
    console.error('Get all attendance error:', error);
    res.status(500).json({ message: 'Error fetching attendance', error: error.message });
  }
};

module.exports = {
  getAllSubmissions,
  getSubmissionsByFacility,
  reviewSubmission,
  getDashboardInsights,
  getAllAttendance
};

