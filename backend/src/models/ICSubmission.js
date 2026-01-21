const mongoose = require('mongoose');

const lanCableReadingSchema = new mongoose.Schema({
  start: Number,
  end: Number
});

const routerSchema = new mongoose.Schema({
  routerType: {
    type: String,
    enum: ['Mikrotik', 'CCR']
  },
  routerModel: String, // For suboptions: L009, hexS 760iGS, hex 750Gr3, 2004-1G-12S+2XS, 2004-16G-2S+, 2116-12G-4S+
  serialNumber: String,
  images: {
    routerImages: [String],
    cableConnectivityImages: [String]
  }
});

const radioSchema = new mongoose.Schema({
  radioType: {
    type: String,
    enum: ['LHG5', 'DIISC LITE', 'Mimosa']
  },
  radioModel: String, // For Mimosa suboptions: C6X, C5X with Mimosa Antenna, C5X with Fibergate Antenna, B6X with Mimosa Antenna, Ethernet surge protector
  serialNumber: String,
  lanCableReading: lanCableReadingSchema,
  images: [String]
});

const itRackSchema = new mongoose.Schema({
  rackNumber: Number,
  rackType: {
    type: String,
    enum: ['2U', '4U']
  },
  floor: {
    type: String,
    enum: ['Ground', '1', '2', '3', '4']
  },
  location: String,
  images: [String]
});

const apSchema = new mongoose.Schema({
  apNumber: Number,
  make: {
    type: String,
    enum: ['Grandstream', 'Other']
  },
  model: {
    type: String,
    enum: ['7605', '7660E', '7605LR', '7660E LR', '7604', '7603'] // Added new Grandstream models, kept old ones for backward compatibility
  },
  serialNumber: String,
  floor: {
    type: String,
    enum: ['Ground', '1', '2', '3', '4']
  },
  lanCableReading: lanCableReadingSchema,
  images: [String]
});

const poeSwitchSchema = new mongoose.Schema({
  poeNumber: Number,
  make: {
    type: String,
    enum: ['Grandstream', 'Digisol', 'Dlink', 'Syrotech', 'Mikrotik']
  },
  model: {
    type: String,
    enum: ['7604', '7603', 'GWN 7803', 'CRS106'] // Added new models
  },
  serialNumber: String,
  itRackNumber: String,
  location: String,
  images: [String]
});

const desktopSwitchSchema = new mongoose.Schema({
  desktopNumber: Number,
  make: {
    type: String,
    enum: ['Grandstream', 'Digisol', 'Dlink', 'Syrotech']
  },
  model: {
    type: String,
    enum: ['7604', '7603']
  },
  serialNumber: String,
  itRackNumber: String,
  location: String,
  images: [String]
});

const customerEndSchema = new mongoose.Schema({
  router: routerSchema,
  radio: radioSchema,
  itRacks: [itRackSchema],
  aps: [apSchema],
  poeSwitches: [poeSwitchSchema],
  siteVideo: String // URL to the uploaded video on Cloudinary
});

const towerEndSchema = new mongoose.Schema({
  router: routerSchema,
  radio: radioSchema,
  draft: {
    type: Boolean,
    default: false
  }
});

const icSubmissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submittedByName: {
    type: String,
    required: false  // Name from login session
  },
  facilityId: {
    type: String,
    required: true
  },
  facilityDetails: {
    district: String,
    facility_type: String,
    facility_name: String,
    facility_code: String
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected'],
    default: 'draft'
  },
  approvalStatus: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    reviewReason: String,
    reviewStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  },
  customerEnd: customerEndSchema,
  towerEnd: towerEndSchema,
  submittedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

icSubmissionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const ICSubmission = mongoose.model('ICSubmission', icSubmissionSchema);

module.exports = ICSubmission; 