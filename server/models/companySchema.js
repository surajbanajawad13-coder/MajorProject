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
  domain: { type: String, trim: true, default: '' },
  requiredSkills: [{ type: String, trim: true }],
  jobDescriptionAnalysis: {
    extractedText: { type: String, default: '' },
    requiredSkills: [{ type: String, trim: true }],
    programmingLanguages: [{ type: String, trim: true }],
    tools: [{ type: String, trim: true }],
    roleInterestKeywords: [{ type: String, trim: true }],
    certifications: [{ type: String, trim: true }],
    keywordScore: { type: Number, min: 0, default: 0 },
  },
  eligibilityYears: [{ type: String, trim: true }],
  applicationDeadline: { type: Date, default: null },
  selectionStages: [{ type: String, trim: true }],
  description: { type: String, default: '' },
  
  eligibilityCriteria: {
    cgpa: { type: Number, default: 0 },
    backlogsAllowed: { type: Boolean, default: false },
    branches: [String] 
  },

  targetDepartment: { type: [String], default: ['All'] },


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
