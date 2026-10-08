/**
 * CampusConnect - AI-Driven Campus Event & Placement Analytics Portal
 * ---------------------------------------------------------------------
 * Server entrypoint (Node.js / Express).
 * Project by: Vikas (USN: 4CB23CS186)
 * ---------------------------------------------------------------------
 */

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const studentRoute = require('./routes/studentRoutes');
const placementRoutes = require('./routes/placementRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const departmentCoordinatorRoutes = require('./routes/departmentCoordinatorRoutes');
const eventTrainingRoutes = require('./routes/eventTrainingRoutes');

const app = express();

app.use(cors("*"));
app.use(express.json());

// Serve uploaded files (resumes, etc.)
app.use('/uploads', express.static('uploads'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoute);
app.use('/api/placements', placementRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/department-coordinator', departmentCoordinatorRoutes);
app.use('/api/events', eventTrainingRoutes);
app.get('/api/test', (req, res) => {
    res.send("CampusConnect Backend is running successfully! " );
});


const PORT = process.env.PORT || 8000;
const start=async()=>{
    const mongooseDB=await mongoose.connect(process.env.mongo_uri,);
    console.log("Connected to MongoDB Atlas successfully! ");
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
}

start();
