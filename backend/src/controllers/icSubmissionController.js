const ICSubmission = require('../models/ICSubmission');
const cloudinary = require('../config/cloudinary');

// Helper function to upload image to cloudinary
const uploadToCloudinary = async (base64Image) => {
  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: 'ic_submissions'
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image');
  }
};

// Helper function to upload multiple images
const uploadImages = async (images) => {
  if (!images || !Array.isArray(images)) return [];
  const uploadPromises = images.map(image => uploadToCloudinary(image));
  return Promise.all(uploadPromises);
};

// Helper function to delete image from cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};

// Helper function to process router images
const processRouterImages = async (routerData) => {
  if (!routerData) return null;

  const processedRouter = { ...routerData };
  
  if (routerData.images) {
    if (routerData.images.routerImages) {
      processedRouter.images = {
        routerImages: await uploadImages(routerData.images.routerImages),
        cableConnectivityImages: routerData.images.cableConnectivityImages ? 
          await uploadImages(routerData.images.cableConnectivityImages) : []
      };
    }
  }

  return processedRouter;
};

// Helper function to process items with images (radio, racks, aps, switches)
const processItemWithImages = async (item) => {
  if (!item) return null;

  const processedItem = { ...item };
  if (item.images) {
    processedItem.images = await uploadImages(item.images);
  }
  return processedItem;
};

// Helper function to process arrays of items with images
const processArrayWithImages = async (items) => {
  if (!items || !Array.isArray(items)) return [];
  return Promise.all(items.map(item => processItemWithImages(item)));
};

// Helper function to process tower end images
const processTowerEndImages = async (towerEnd) => {
  if (!towerEnd) return null;

  const processedTowerEnd = { ...towerEnd };
  
  if (towerEnd.router?.images) {
    processedTowerEnd.router = {
      ...towerEnd.router,
      images: {
        routerImages: towerEnd.router.images.routerImages ? 
          await uploadImages(towerEnd.router.images.routerImages) : [],
        cableConnectivityImages: towerEnd.router.images.cableConnectivityImages ? 
          await uploadImages(towerEnd.router.images.cableConnectivityImages) : []
      }
    };
  }

  if (towerEnd.radio?.images) {
    processedTowerEnd.radio = {
      ...towerEnd.radio,
      images: await uploadImages(towerEnd.radio.images)
    };
  }

  return processedTowerEnd;
};

// Create or update draft
const saveDraft = async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId; // Try both possible locations
    if (!userId) {
      throw new Error('User ID not found in request');
    }

    const { facilityId, customerEnd, towerEnd } = req.body;
    if (!facilityId) {
      throw new Error('Facility ID is required');
    }

    console.log('Saving draft for user:', userId, 'facility:', facilityId);

    let submission = await ICSubmission.findOne({ 
      userId, 
      facilityId,
      status: 'draft'
    });

    const processedData = {
      customerEnd: customerEnd ? {
        router: await processRouterImages(customerEnd.router),
        radio: await processItemWithImages(customerEnd.radio),
        itRacks: await processArrayWithImages(customerEnd.itRacks),
        aps: await processArrayWithImages(customerEnd.aps),
        poeSwitches: await processArrayWithImages(customerEnd.poeSwitches),
        desktopSwitches: await processArrayWithImages(customerEnd.desktopSwitches)
      } : undefined,
      towerEnd: towerEnd ? await processTowerEndImages(towerEnd) : undefined
    };

    if (submission) {
      // Update existing draft
      Object.assign(submission, processedData);
      await submission.save();
    } else {
      // Create new draft
      submission = await ICSubmission.create({
        userId,
        facilityId,
        status: 'draft',
        ...processedData
      });
    }

    res.json(submission);
  } catch (error) {
    console.error('Save draft error:', error);
    res.status(500).json({ message: 'Error saving draft', error: error.message });
  }
};

// Get draft by facility
const getDraft = async (req, res) => {
  try {
    const { userId } = req.user;
    const { facilityId } = req.params;

    const draft = await ICSubmission.findOne({
      userId,
      facilityId,
      status: 'draft'
    });

    if (!draft) {
      return res.status(404).json({ message: 'No draft found' });
    }

    res.json(draft);
  } catch (error) {
    console.error('Get draft error:', error);
    res.status(500).json({ message: 'Error getting draft', error: error.message });
  }
};

// Submit IC form
const submit = async (req, res) => {
  try {
    const { userId } = req.user;
    const { facilityId, customerEnd, towerEnd } = req.body;

    const processedData = {
      customerEnd: {
        router: await processRouterImages(customerEnd.router),
        radio: await processItemWithImages(customerEnd.radio),
        itRacks: await processArrayWithImages(customerEnd.itRacks),
        aps: await processArrayWithImages(customerEnd.aps),
        poeSwitches: await processArrayWithImages(customerEnd.poeSwitches),
        desktopSwitches: await processArrayWithImages(customerEnd.desktopSwitches)
      },
      towerEnd: await processTowerEndImages(towerEnd),
      status: 'submitted',
      submittedAt: new Date()
    };

    // Delete existing draft if any
    await ICSubmission.findOneAndDelete({
      userId,
      facilityId,
      status: 'draft'
    });

    // Create new submission
    const submission = await ICSubmission.create({
      userId,
      facilityId,
      ...processedData
    });

    res.json(submission);
  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ message: 'Error submitting form', error: error.message });
  }
};

// Get submission by ID
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await ICSubmission.findById(id)
      .populate('userId', 'name username');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.json(submission);
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ message: 'Error getting submission', error: error.message });
  }
};

// Get all submissions for a user
const getAllByUser = async (req, res) => {
  try {
    const { userId } = req.user;
    const submissions = await ICSubmission.find({ userId })
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ message: 'Error getting submissions', error: error.message });
  }
};

module.exports = {
  saveDraft,
  getDraft,
  submit,
  getById,
  getAllByUser
}; 