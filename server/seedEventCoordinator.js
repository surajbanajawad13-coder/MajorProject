require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Student = require('./models/studentSchema');
const { getRequiredInitialPassword } = require('./services/seedCredentials');

const mongoUri = process.env.mongo_uri || process.env.MONGO_URI || 'mongodb://localhost:27017/CampusConnect';
const account = {
  username: 'Campus Event Coordinator',
  email: 'event.coordinator@campusconnect.edu',
  usn: 'EVENT001',
};

async function seedEventCoordinator() {
  try {
    const initialPassword = getRequiredInitialPassword('EVENT_COORDINATOR_INITIAL_PASSWORD');
    await mongoose.connect(mongoUri);
    const password = await bcrypt.hash(initialPassword, 12);
    const existing = await Student.findOne({
      $or: [
        { email: account.email },
        { usn: account.usn },
        { username: account.username },
      ],
    });

    if (existing && existing.role !== 'Event Coordinator') {
      throw new Error(
        `Cannot seed ${account.usn}: a matching account exists with role "${existing.role}".`
      );
    }

    if (existing) {
      existing.password = password;
      await existing.save();
      console.log(`Reset password for Event Coordinator account ${existing.usn}.`);
    } else {
      await Student.create({ ...account, password, role: 'Event Coordinator' });
      console.log(`Created Event Coordinator account ${account.usn}.`);
    }
  } catch (error) {
    console.error('Event Coordinator seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedEventCoordinator();
