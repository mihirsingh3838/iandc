const cloudinary = require('cloudinary').v2;

// Log the environment variables (without exposing sensitive data)
console.log('Initializing Cloudinary with:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'NOT_SET',
  api_key: process.env.CLOUDINARY_API_KEY ? 'Present' : 'NOT_SET',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'Present' : 'NOT_SET'
});

// Validate required environment variables
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('Missing required Cloudinary configuration. Please check your .env file.');
  process.exit(1);
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Verify configuration
try {
  const testConfig = cloudinary.config();
  console.log('Cloudinary configured successfully with cloud_name:', testConfig.cloud_name);
} catch (error) {
  console.error('Error verifying Cloudinary configuration:', error);
  process.exit(1);
}

module.exports = cloudinary; 