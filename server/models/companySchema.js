const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  logo: {
    url: String,
    filename: String // Cloudinary filename
  },
  
  jobDescription: {
    url: { type: String, required: true }, // The link to the PDF/Image on Cloudinary
    filename: { type: String } // For managing the file in Cloudinary
  },

  jobRole: { type: String, required: true },
  ctc: String,
  
  eligibilityCriteria: {
    cgpa: { type: Number, default: 0 },
    backlogsAllowed: { type: Boolean, default: false },
    branches: [String] 
  },


  visitDate: { 
    type: Date, 
    required: true 
  },

  // Link to specific training (Wednesday/10-day)
  relatedTraining: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Training' 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true }, // Ensure virtuals show up in API responses
  toObject: { virtuals: true }
});

// AUTOMATION: Virtual field to calculate status based on today's date
companySchema.virtual('visitStatus').get(function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const vDate = new Date(this.visitDate);
  vDate.setHours(0, 0, 0, 0);

  if (vDate.getTime() === today.getTime()) {
    return 'Today';
  } else if (vDate.getTime() > today.getTime()) {
    return 'Upcoming';
  } else {
    return 'Visited';
  }
});

module.exports = mongoose.model('Company', companySchema);