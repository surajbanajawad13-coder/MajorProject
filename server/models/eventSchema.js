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

  // ── Fields consumed by the AI recommendation engine (ai/recommender.py) ──
  category: {
    type: String,
    enum: ['Technical', 'Cultural', 'Sports', 'Workshop', 'Hackathon', 'Seminar', 'Other'],
    default: 'Technical',
  },
  domain: { type: String, default: '' },            // e.g. "web development", "ai"
  required_skills: [{ type: String }],               // matched against learner skills (+3 pt each)
  eligibility_branch: [{ type: String }],             // e.g. ["CSE", "ISE"] - empty = open to all
  eligibility_year: [{ type: String }],               // e.g. ["3", "4"] - empty = open to all
  min_cgpa: { type: Number, default: null },
  

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