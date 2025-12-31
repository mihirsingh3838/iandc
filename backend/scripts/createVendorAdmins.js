const mongoose = require('mongoose');
const User = require('../src/models/User');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const createVendorAdmins = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ic2';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Vendor admin users to create
    const vendorAdmins = [
      {
        username: 'wdc_admin',
        password: 'wdc_admin123', // Change this to a secure password
        role: 'vendor'
      },
      {
        username: 'kuber_admin',
        password: 'kuber_admin123', // Change this to a secure password
        role: 'vendor'
      },
      {
        username: 'mantra_admin',
        password: 'mantra_admin123', // Change this to a secure password
        role: 'vendor'
      }
    ];

    console.log('Creating vendor admin users...');

    for (const vendorAdmin of vendorAdmins) {
      // Check if user already exists
      const existingUser = await User.findOne({ username: vendorAdmin.username });
      
      if (existingUser) {
        console.log(`User ${vendorAdmin.username} already exists. Updating role to vendor...`);
        existingUser.role = 'vendor';
        if (vendorAdmin.password) {
          existingUser.password = vendorAdmin.password; // Will be hashed by pre-save hook
        }
        await existingUser.save();
        console.log(`✓ Updated ${vendorAdmin.username}`);
      } else {
        // Create new user
        const user = new User({
          username: vendorAdmin.username,
          password: vendorAdmin.password,
          role: vendorAdmin.role
        });
        await user.save();
        console.log(`✓ Created ${vendorAdmin.username}`);
      }
    }

    console.log('\nAll vendor admin users created/updated successfully!');
    console.log('\nLogin credentials:');
    vendorAdmins.forEach(admin => {
      console.log(`  Username: ${admin.username}, Password: ${admin.password}`);
    });
    console.log('\n⚠️  Please change these passwords after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error creating vendor admins:', error);
    process.exit(1);
  }
};

// Run the script
createVendorAdmins();

