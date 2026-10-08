const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  department: {
    type: String,
    required: true,
    enum: ['CSE', 'ISE', 'ECE', 'ME', 'CE', 'AIML', 'CSB', 'CSD']
  },
  designation: { type: String, required: true, trim: true },
  role: { type: String, default: 'Faculty', enum: ['Faculty', 'Department Placement Coordinator'] }
}, { timestamps: true });

// A department may have many faculty members, but only one placement coordinator.
facultySchema.index(
  { department: 1 },
  {
    unique: true,
    partialFilterExpression: { role: 'Department Placement Coordinator' },
    name: 'one_placement_coordinator_per_department'
  }
);

module.exports = mongoose.model('Faculty', facultySchema);
