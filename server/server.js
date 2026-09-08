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
const eventRoutes = require('./routes/eventRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(cors("*"));
app.use(express.json());

// Serve uploaded files (resumes, etc.)
app.use('/uploads', express.static('uploads'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoute);
app.use('/api/placements', placementRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
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
