require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Faculty = require('./models/facultySchema');

const departments = ['CSE', 'ISE', 'ECE', 'ME', 'CE'];
const initialPassword = process.env.COORDINATOR_INITIAL_PASSWORD || 'coordinator12345';

async function seedDepartmentCoordinators() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.mongo_uri || 'mongodb://localhost:27017/CampusConnect');
    const password = await bcrypt.hash(initialPassword, 12);

    for (const department of departments) {
      const existing = await Faculty.findOne({ role: 'Department Placement Coordinator', department });
      if (existing) {
        console.log(`${department} coordinator already exists; leaving the account unchanged.`);
        continue;
      }

      const shortCode = department.toLowerCase();
      await Faculty.create({
        username: `${department} Placement Coordinator`,
        email: `${shortCode}.coordinator@campusconnect.edu`,
        password,
        department,
        designation: 'Department Placement Coordinator',
        role: 'Department Placement Coordinator'
      });
      console.log(`Created ${department} department placement coordinator.`);
    }
  } catch (error) {
    console.error('Department coordinator seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedDepartmentCoordinators();
