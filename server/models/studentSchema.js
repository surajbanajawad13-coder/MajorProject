const mongoose=require('mongoose');
const studentSchema=new mongoose.Schema({
    username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  // College Identity
  usn: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true 
  },
  role: { 
    type: String, 
    default: 'Student',
    enum: ['Student', 'Admin', 'Placement Officer'] 
  },
  // AI & Personalization Data
  skills:[{type:String}],
  interests:[{type:String}],

  // Resume
  resumeUrl: { type: String, default: null },
  resumeOriginalName: { type: String, default: null },

  trainingAttendance: [{
    trainingType: { type: String, enum: ['Wednesday Session', '10-Day Bootcamp'] },
    date: Date,
    attended: { type: Boolean, default: false }
  }],
  appliedCompanies: [{
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    status: { 
        type: String, 
        enum: ['Applied', 'Interviewing', 'Placed', 'Rejected'],
        default: 'Applied'
    }
  }],
  // Academic Filtering Data
  cgpa: { 
    type: Number, 
    default: 0 
  },
  department: { 
    type: String, 
    enum: ['CSE', 'ISE', 'ECE', 'ME', 'CE','AIML','CSB','CSD'], // Adjust to match your exact branches
    required: true,
    default: 'CSE'
  },
  registeredEvents:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Event'
  }]
},{timestamps:true});

module.exports=mongoose.model('Student',studentSchema);