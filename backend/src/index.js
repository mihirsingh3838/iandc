const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const auth = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

// Configure dotenv - only load .env file if it exists (for local development)
// In production (Render, Heroku, etc.), environment variables are set by the platform
const envPath = path.join(__dirname, '..', '.env');
const result = dotenv.config({ path: envPath });
if (result.error) {
  // Only log warning in development, not exit - production uses system env vars
  if (process.env.NODE_ENV !== 'production') {
    console.warn('Warning: .env file not found. Using system environment variables.');
    console.warn('This is normal in production environments like Render.');
  }
} else {
  console.log('Loaded .env file for local development');
}

// Debug environment variables (without exposing sensitive data)
console.log('Environment variables loaded:', {
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not set',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set',
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT
});

// Import controllers
const authController = require('./controllers/authController');
const attendanceController = require('./controllers/attendanceController');

// Import routes
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const icSubmissionRoutes = require('./routes/icSubmission');
const locationRoutes = require('./routes/location');
const adminRoutes = require('./routes/admin');

const app = express();

// Middleware
// CORS configuration - allow frontend origin in production
const corsOptions = {
  origin: process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : '*', // Allow all origins if FRONTEND_URL not set (useful for development)
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(requestLogger);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ic2')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/ic-submission', icSubmissionRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware (should be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`Server is running on port ${PORT}`);
// });
