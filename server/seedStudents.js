require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Student = require('./models/studentSchema'); // Adjust path if necessary

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/campusconnect';

// Department list matching your schema and their respective USN branch codes
const departmentsConfig = [
  { name: 'CSE', code: 'CS' },
  { name: 'ISE', code: 'IS' },
  { name: 'ECE', code: 'EC' },
  { name: 'ME', code: 'ME' },
  { name: 'CE', code: 'CE' },
  { name: 'AIML', code: 'AI' },
  { name: 'CSB', code: 'CB' },
  { name: 'CSD', code: 'CD' }
];

const seedStudents = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to Database for Student Seeding...');

    // Clear only existing students, keeping TPO and other roles safe
    await Student.deleteMany({ role: 'Student' });
    console.log('Previous student records cleared.');

    const hashedPassword = await bcrypt.hash('student123', 12);
    const studentsToInsert = [];

    // Generate 6 students for each department
    departmentsConfig.forEach((dept) => {
      for (let i = 1; i <= 6; i++) {
        const studentNumber = String(i).padStart(3, '0');
        const usn = `4CB23${dept.code}${studentNumber}`;
        const username = `${dept.name} Student ${i}`;
        const email = `student_${dept.name.toLowerCase()}${i}@campusconnect.edu`;

        studentsToInsert.push({
          username: username,
          email: email,
          password: hashedPassword,
          usn: usn,
          role: 'Student',
          department: dept.name,
          cgpa: Number((7.0 + Math.random() * 2.5).toFixed(2)), // Random CGPA between 7.0 and 9.5
          skills: ['JavaScript', 'Node.js', 'React', 'Problem Solving'],
          interests: ['Web Development', 'AI/ML', 'Cloud Computing'],
          resumeUrl: null,
          resumeOriginalName: null
        });
      }
    });

    await Student.insertMany(studentsToInsert);
    console.log(`Successfully seeded ${studentsToInsert.length} students across all departments (${departmentsConfig.length} departments x 6 students)!`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error seeding students:', err);
    process.exit(1);
  }
};

seedStudents();