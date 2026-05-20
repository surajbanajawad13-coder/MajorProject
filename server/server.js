const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');



const app = express();


app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes); 
app.get('/api/test', (req, res) => {
    res.send("CampusConnect Backend is running successfully! 🚀" );
});


const PORT = process.env.PORT || 8000;
const start=async()=>{
    const mongooseDB=await mongoose.connect(process.env.mongo_uri,);
    console.log("Connected to MongoDB Atlas successfully! 🎉");
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
}

start();
