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
const recommendationRoutes = require('./routes/recommendationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const profileRoutes = require('./routes/profileRoutes');
const careerGuidanceRoutes = require('./routes/careerGuidanceRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const { startDeadlineReminderJob } = require('./services/deadlineReminders');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.push('http://localhost:5173', 'http://127.0.0.1:5173');
}
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(null, false);
    },
    credentials: true,
}));
app.use(express.json());

// Serve uploaded files (resumes, etc.)
const uploadRoot = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadRoot));

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoute);
app.use('/api/placements', placementRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/department-coordinator', departmentCoordinatorRoutes);
app.use('/api/events', eventTrainingRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api', careerGuidanceRoutes);
app.use('/api/resume', resumeRoutes);
app.get('/api/test', (req, res) => {
    res.send("CampusConnect Backend is running successfully! " );
});


const PORT = process.env.PORT || 8000;
const mongoUri = process.env.mongo_uri || process.env.MONGO_URI;
const start=async()=>{
    if (!mongoUri) {
        throw new Error('Set mongo_uri or MONGO_URI in the server environment before starting the backend.');
    }
    if (!process.env.JWT_SECRET) {
        throw new Error('Set JWT_SECRET before starting the backend.');
    }
    if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.length < 32) {
        throw new Error('In production, JWT_SECRET must be a random value of at least 32 characters.');
    }
    if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
        throw new Error('Set CORS_ORIGINS to the production frontend origin(s), comma-separated.');
    }
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB Atlas successfully! ");
startDeadlineReminderJob();
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
}

start();
