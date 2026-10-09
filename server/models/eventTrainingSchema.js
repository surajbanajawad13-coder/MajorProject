const mongoose = require('mongoose');

const departments = ['All', 'CSE', 'ISE', 'ECE', 'ME', 'CE', 'AIML', 'CSB', 'CSD'];

const eventTrainingSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  type: { type: String, enum: ['Event', 'Training'], required: true },
  category: { type: String, required: true, trim: true },
  domain: { type: String, trim: true, default: '' },
  organizer: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  registrationDeadline: { type: Date, default: null },
  requiredSkills: [{ type: String, trim: true }],
  eligibilityBranches: [{ type: String, enum: departments.slice(1) }],
  eligibilityYears: [{ type: String, trim: true }],
  minCgpa: { type: Number, min: 0, max: 10, default: null },
  targetDepartment: {
    type: [{ type: String, enum: departments }],
    default: ['All'],
    validate: value => value.length > 0 && (value.length === 1 || !value.includes('All'))
  },
  registeredStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
}, { timestamps: true });

module.exports = mongoose.model('EventTraining', eventTrainingSchema);
