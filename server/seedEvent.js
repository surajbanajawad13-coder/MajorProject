require('dotenv').config();
const mongoose = require('mongoose');
const EventTraining = require('./models/eventTrainingSchema'); 

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/campusconnect';

const dummyEvents = [
  {
    title: "Mastering Cloud Architecture & Microservices",
    description: "Join us for an intensive hands-on session covering cloud deployment strategies, Docker containerization, and horizontal scaling.",
    type: "Training",
    category: "Workshop",
    organizer: "Google Developer Student Clubs (GDSC)",
    date: new Date("2026-10-20T06:00:00.000Z"),
    targetDepartment: ["All"],
    registeredStudents: []
  },
  {
    title: "React & Modern Web Development Workshop",
    description: "Learn React, component-based development and modern frontend practices.",
    type: "Training",
    category: "Workshop",
    organizer: "CampusConnect",
    date: new Date("2026-11-29T00:00:00.000Z"),
    targetDepartment: ["CSE", "ISE"],
    registeredStudents: []
  },
  {
    title: "Campus Hackathon 2026",
    description: "Build innovative solutions and compete with students across campus.",
    type: "Event",
    category: "Hackathon",
    organizer: "Technical Club",
    date: new Date("2026-11-20T00:00:00.000Z"),
    targetDepartment: ["All"],
    registeredStudents: []
  },
  {
    title: "Coding Bootcamp",
    description: "Strengthen your programming and problem-solving skills.",
    type: "Training",
    category: "Coding Bootcamp",
    organizer: "Training Cell",
    date: new Date("2026-12-05T00:00:00.000Z"),
    targetDepartment: ["CSE", "ISE", "AIML"],
    registeredStudents: []
  },
  {
    title: "AI & Machine Learning Seminar",
    description: "Explore current trends in Artificial Intelligence and Machine Learning.",
    type: "Event",
    category: "Seminar",
    organizer: "AI Club",
    date: new Date("2026-12-10T00:00:00.000Z"),
    targetDepartment: ["All"],
    registeredStudents: []
  }
];

const seedEvents = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to Database for Event Seeding...');

    await EventTraining.deleteMany({});
    console.log('Previous events/trainings cleared.');

    await EventTraining.insertMany(dummyEvents);
    console.log('Dummy events and trainings successfully seeded!');
    
    process.exit(0);
  } catch (err) {
    console.error('Error seeding events:', err);
    process.exit(1);
  }
};

seedEvents();