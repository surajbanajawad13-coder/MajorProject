// server/seedTpo.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/studentSchema'); // Adjust path if necessary
require('dotenv').config(); // Ensure your MongoDB URI is loaded
const { getRequiredInitialPassword } = require('./services/seedCredentials');

async function seedTPO() {
  try {
    const initialPassword = getRequiredInitialPassword('TPO_INITIAL_PASSWORD');
    // Replace with your actual MongoDB connection string if not using dotenv
    await mongoose.connect(process.env.mongo_uri || process.env.MONGO_URI || 'mongodb://localhost:27017/CampusConnect');
    console.log('Connected to Database');

    const tpoExists = await User.findOne({ role: 'Placement Officer' });
    if (tpoExists) {
      console.log('TPO already exists in the database.');
      process.exit();
    }

    const hashedPassword = await bcrypt.hash(initialPassword, 12);

    await User.create({
      username: 'TPO Admin',
      email: 'tpo@campusconnect.edu',
      password: hashedPassword,
      usn: 'TPO001', // Using USN field as the unique login ID
      role: 'Placement Officer'
    });

    console.log('Dummy TPO created successfully!');
    process.exit();
  } catch (error) {
    console.error('Error seeding TPO:', error);
    process.exit(1);
  }
}

seedTPO();