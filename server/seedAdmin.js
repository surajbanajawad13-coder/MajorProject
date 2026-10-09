require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/studentSchema');
const { getRequiredInitialPassword } = require('./services/seedCredentials');

const mongoUri = process.env.mongo_uri || process.env.MONGO_URI || 'mongodb://localhost:27017/CampusConnect';

const adminAccounts = [
  { username: 'Campus Admin One', email: 'admin1@campusconnect.edu', usn: 'ADMIN001' },
  { username: 'Campus Admin Two', email: 'admin2@campusconnect.edu', usn: 'ADMIN002' },
  { username: 'Campus Admin Three', email: 'admin3@campusconnect.edu', usn: 'ADMIN003' },
  { username: 'Campus Admin Four', email: 'admin4@campusconnect.edu', usn: 'ADMIN004' }
];

async function seedAdmins() {
  try {
    const initialPassword = getRequiredInitialPassword('ADMIN_INITIAL_PASSWORD');
    await mongoose.connect(mongoUri);
    const password = await bcrypt.hash(initialPassword, 12);
    let created = 0;

    for (const account of adminAccounts) {
      const existing = await Admin.findOne({
        $or: [{ email: account.email }, { usn: account.usn }, { username: account.username }]
      });

      if (existing) {
        if (existing.role !== 'Admin') {
          if (account.usn !== 'ADMIN001') {
            console.warn(
              `Skipping ${account.usn}: a matching account already exists with role "${existing.role}".`
            );
            continue;
          }

          existing.role = 'Admin';
          existing.password = password;
          await existing.save();
          created += 1;
          console.log(
            `Promoted existing account to Admin. Sign in with its current USN (${existing.usn}), username, or email.`
          );
          continue;
        }
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
