require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/studentSchema');

const mongoUri = process.env.MONGO_URI || process.env.mongo_uri || 'mongodb://localhost:27017/CampusConnect';
const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || 'admin12345';

const adminAccounts = [
  { username: 'Campus Admin One', email: 'admin1@campusconnect.edu', usn: 'ADMIN001' },
  { username: 'Campus Admin Two', email: 'admin2@campusconnect.edu', usn: 'ADMIN002' },
  { username: 'Campus Admin Three', email: 'admin3@campusconnect.edu', usn: 'ADMIN003' },
  { username: 'Campus Admin Four', email: 'admin4@campusconnect.edu', usn: 'ADMIN004' }
];

async function seedAdmins() {
  try {
    await mongoose.connect(mongoUri);
    const password = await bcrypt.hash(initialPassword, 12);
    let created = 0;

    for (const account of adminAccounts) {
      const existing = await Admin.findOne({
        $or: [{ email: account.email }, { usn: account.usn }, { username: account.username }]
      });

      if (existing) {
        console.log(`${account.email} already exists; leaving the account unchanged.`);
        continue;
      }

      await Admin.create({ ...account, password, role: 'Admin' });
      created += 1;
      console.log(`Created Admin account ${account.email}.`);
    }

    console.log(`Admin seeding complete: ${created} created, ${adminAccounts.length - created} already existed.`);
  } catch (error) {
    console.error('Admin seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmins();
