require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Faculty = require('./models/facultySchema');
const { getRequiredInitialPassword } = require('./services/seedCredentials');

const MONGO_URI = process.env.mongo_uri || process.env.MONGO_URI || 'mongodb://localhost:27017/CampusConnect';

const facultyData = [
  {
    username: 'Dr. Ramesh Kumar',
    email: 'ramesh.cse@campusconnect.edu',
    department: 'CSE',
    designation: 'Professor & HOD',
    role: 'Faculty'
  },
  {
    username: 'Dr. Sneha Sharma',
    email: 'sneha.ise@campusconnect.edu',
    department: 'ISE',
    designation: 'Associate Professor',
    role: 'Faculty'
  },
  {
    username: 'Prof. Anil Rao',
    email: 'anil.ece@campusconnect.edu',
    department: 'ECE',
    designation: 'Department Placement Coordinator',
    role: 'Faculty'
  },
  {
    username: 'Dr. Rajesh Patil',
    email: 'rajesh.me@campusconnect.edu',
    department: 'ME',
    designation: 'Professor',
    role: 'Faculty'
  },
  {
    username: 'Prof. Priya Hegde',
    email: 'priya.ce@campusconnect.edu',
    department: 'CE',
    designation: 'Assistant Professor',
    role: 'Faculty'
  },
  {
    username: 'Dr. Kiran Murthy',
    email: 'kiran.aiml@campusconnect.edu',
    department: 'AIML',
    designation: 'HOD - AI & ML',
    role: 'Faculty'
  },
  {
    username: 'Prof. Divya Swaminathan',
    email: 'divya.csb@campusconnect.edu',
    department: 'CSB',
    designation: 'Assistant Professor',
    role: 'Faculty'
  },
  {
    username: 'Dr. Manoj Gowda',
    email: 'manoj.csd@campusconnect.edu',
    department: 'CSD',
    designation: 'Associate Professor',
    role: 'Faculty'
  }
];

const seedDB = async () => {
  try {
    const initialPassword = getRequiredInitialPassword('FACULTY_INITIAL_PASSWORD');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for Seeding...');

    const saltRounds = 10;
    let created = 0;
    let existingCount = 0;

    for (const faculty of facultyData) {
      const existing = await Faculty.findOne({
        $or: [{ email: faculty.email }, { username: faculty.username }]
      });

      if (existing) {
        console.log(`${faculty.email} already exists; leaving the account unchanged.`);
        existingCount += 1;
        continue;
      }

      const password = await bcrypt.hash(initialPassword, saltRounds);
      await Faculty.create({ ...faculty, password });
      console.log(`Created Faculty account ${faculty.email}.`);
      created += 1;
    }

    console.log(`Faculty seeding complete: ${created} created, ${existingCount} already existed.`);
    
  } catch (err) {
    console.error('Error seeding faculty data:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedDB();
