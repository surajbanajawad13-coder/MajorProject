// server/seedAdmin.js
// CampusConnect - creates a default Administrator account for first login.
// Run with: node seedAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/studentSchema');
require('dotenv').config();

async function seedAdmin() {
  try {
    // NOTE: server.js reads `process.env.mongo_uri` (lowercase) - matched here
    // for consistency with the rest of this project's .env convention.
    await mongoose.connect(process.env.mongo_uri || 'mongodb://localhost:27017/campusconnect');
    console.log('Connected to Database');

    const adminExists = await User.findOne({ role: 'Admin' });
    if (adminExists) {
      console.log('An Admin already exists in the database.');
      process.exit();
    }

    const hashedPassword = await bcrypt.hash('admin12345', 12);

    await User.create({
      username: 'Platform Admin',
      email: 'admin@campusconnect.edu',
      password: hashedPassword,
      usn: 'ADMIN001', // Using USN field as the unique login ID, matching seedTpo.js
      role: 'Admin',
    });

    console.log('Default Admin created successfully! Login with USN: ADMIN001 / password: admin12345');
    process.exit();
  } catch (error) {
    console.error('Error seeding Admin:', error);
    process.exit(1);
  }
}

seedAdmin();
