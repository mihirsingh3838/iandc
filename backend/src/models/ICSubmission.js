const mongoose = require('mongoose');

const lanCableReadingSchema = new mongoose.Schema({
  start: Number,
  end: Number
});

const routerSchema = new mongoose.Schema({
  routerType: {
    type: String,
    enum: ['HEX', 'HEX-S', 'HAP', 'CCR']
  },
  serialNumber: String,
  images: {
    routerImages: [String],
    cableConnectivityImages: [String]
  }
});

const radioSchema = new mongoose.Schema({
  radioType: {
    type: String,
    enum: ['LHG5', 'DIISC LITE', 'MIMOSA']
  },
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
    enum: ['7604', '7603']
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
  desktopSwitches: [desktopSwitchSchema]
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
  facilityId: {
    type: String,
    required: true
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