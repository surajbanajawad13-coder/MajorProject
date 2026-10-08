require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Faculty = require('./models/facultySchema');

// Connect to MongoDB (ensure your MONGO_URI is set in your .env file)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/CampusConnect';

const facultyData = [
  {
    username: 'Dr. Ramesh Kumar',
    email: 'ramesh.cse@campusconnect.edu',
    password: 'password123',
    department: 'CSE',
    designation: 'Professor & HOD',
    role: 'Faculty'
  },
  {
    username: 'Dr. Sneha Sharma',
    email: 'sneha.ise@campusconnect.edu',
    password: 'password123',
    department: 'ISE',
    designation: 'Associate Professor',
    role: 'Faculty'
  },
  {
    username: 'Prof. Anil Rao',
    email: 'anil.ece@campusconnect.edu',
    password: 'password123',
    department: 'ECE',
    designation: 'Department Placement Coordinator',
    role: 'Faculty'
  },
  {
    username: 'Dr. Rajesh Patil',
    email: 'rajesh.me@campusconnect.edu',
    password: 'password123',
    department: 'ME',
    designation: 'Professor',
    role: 'Faculty'
  },
  {
    username: 'Prof. Priya Hegde',
    email: 'priya.ce@campusconnect.edu',
    password: 'password123',
    department: 'CE',
    designation: 'Assistant Professor',
    role: 'Faculty'
  },
  {
    username: 'Dr. Kiran Murthy',
    email: 'kiran.aiml@campusconnect.edu',
    password: 'password123',
    department: 'AIML',
    designation: 'HOD - AI & ML',
    role: 'Faculty'
  },
  {
    username: 'Prof. Divya Swaminathan',
    email: 'divya.csb@campusconnect.edu',
    password: 'password123',
    department: 'CSB',
    designation: 'Assistant Professor',
    role: 'Faculty'
  },
  {
    username: 'Dr. Manoj Gowda',
    email: 'manoj.csd@campusconnect.edu',
    password: 'password123',
    department: 'CSD',
    designation: 'Associate Professor',
    role: 'Faculty'
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for Seeding...');

    // Clear existing faculty data (optional, remove if you want to keep old records)
    await Faculty.deleteMany({ role: 'Faculty' });
    console.log('Cleared existing faculty records while preserving coordinator accounts.');

    // Hash passwords before saving
    const saltRounds = 10;
    const seededFaculty = await Promise.all(
      facultyData.map(async (faculty) => {
        const hashedPassword = await bcrypt.hash(faculty.password, saltRounds);
        return {
          ...faculty,
          password: hashedPassword
        };
      })
    );

    await Faculty.insertMany(seededFaculty);
    console.log('Successfully seeded faculty members for all departments!');
    
    process.exit(0);
  } catch (err) {
    console.error('Error seeding faculty data:', err);
    process.exit(1);
  }
};

seedDB();
