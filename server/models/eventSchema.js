const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  
  // Organization
  organizer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Society', 
    required: true 
  },
  
  // AI Recommendation Tags
  tags: [{ type: String }], 
  

  eventDate: { type: Date, required: true },
  venue: { type: String, required: true },
  
  
  registrationLink: String, // External or internal
  capacity: Number,
  registeredStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  
  // Visuals (Cloudinary)
  poster: {
    url: String,
    filename: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);