const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    trim: true 
  }, 
  
  description: { type: String },
  
  trainingType: {
    type: String,
    required: true,
    enum: ['Wednesday Weekly', '10-Day Post-Sem'], 
  },

  // Schedule Logic
  startDate: { type: Date, required: true },
  endDate: { type: Date }, 
  startTime: { type: String }, 
  
  location: { 
    type: String, 
    default: 'College Seminar Hall' 
  },

 
  targetCompanies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }],

  // Resources (Cloudinary links for PPTs/Notes)
  studyMaterial: [{
    url: String,
    filename: String,
    title: String
  }],

  trainerName: String,
  
  // Attendance tracking
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Training', trainingSchema);