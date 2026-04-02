const mongoose = require('mongoose');

const societySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  logo: {
    url: String,
    filename: String 
  },
  category: { 
    type: String, 
    enum: ['Technical', 'Cultural', 'Sports', 'Social'] 
  },
  admin: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student'
  },
  socialLinks: {
    instagram: String,
    linkedin: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Society', societySchema);