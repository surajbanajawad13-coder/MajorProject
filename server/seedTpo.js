// server/seedTpo.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/studentSchema'); // Adjust path if necessary
require('dotenv').config(); // Ensure your MongoDB URI is loaded

async function seedTPO() {
  try {
    // Replace with your actual MongoDB connection string if not using dotenv
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/campusconnect');
    console.log('Connected to Database');

    const tpoExists = await User.findOne({ role: 'Placement Officer' });
    if (tpoExists) {
      console.log('TPO already exists in the database.');
      process.exit();
    }

    const hashedPassword = await bcrypt.hash('tpo12345', 12);

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