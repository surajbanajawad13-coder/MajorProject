require('../models/eventSchema.js');
require('../models/companySchema.js');

const Student = require('../models/studentSchema.js');
const path = require('path');
const fs = require('fs');

// ─────────────────────────────────────────────
// 1. Get Complete Student Dashboard Data
// ─────────────────────────────────────────────
exports.getStudentDashboard = async (req, res) => {
  try {
    const student = await Student.findById(req.userId)
      .select('-password')
      .populate('registeredEvents')
      .populate('appliedCompanies.companyId');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        profile: {
          username: student.username,
          email: student.email,
          usn: student.usn,
          role: student.role,
          skills: student.skills,
          interests: student.interests,
          resumeUrl: student.resumeUrl,
          resumeOriginalName: student.resumeOriginalName,
        },
        stats: {
          eventsCount: student.registeredEvents.length,
          appliedCompaniesCount: student.appliedCompanies.length,
          trainingsAttendedCount: student.trainingAttendance.filter(t => t.attended).length,
        },
        registeredEvents: student.registeredEvents,
        appliedCompanies: student.appliedCompanies,
        trainingAttendance: student.trainingAttendance,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─────────────────────────────────────────────
// 2. Update Student Profile
//    Accepts multipart/form-data with optional resume file.
//    Fields: skills (JSON array string), interests (JSON array string),
//            username, email
// ─────────────────────────────────────────────
exports.updateStudentProfile = async (req, res) => {
  try {
    const { username, email, skills, interests, cgpa, department } = req.body;
    // Parse skills / interests – they come as JSON strings from FormData
    const parsedSkills    = skills    ? JSON.parse(skills).map(s => s.toLowerCase().trim())    : undefined;
    const parsedInterests = interests ? JSON.parse(interests).map(i => i.toLowerCase().trim()) : undefined;

    const updateFields = {};
    if (parsedSkills    !== undefined) updateFields.skills    = parsedSkills;
    if (parsedInterests !== undefined) updateFields.interests = parsedInterests;
    if (username?.trim()) updateFields.username = username.trim();
    if (email?.trim())    updateFields.email    = email.trim().toLowerCase();
    if (cgpa)              updateFields.cgpa     = parseFloat(cgpa);
    if (department)        updateFields.department = department;

    // Handle resume upload
    if (req.file) {
      // Delete old resume file if it exists
      const existing = await Student.findById(req.userId).select('resumeUrl');
      if (existing?.resumeUrl) {
        const oldPath = path.join(__dirname, '..', existing.resumeUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      // Store path relative to server root (so we can serve it)
      updateFields.resumeUrl          = `uploads/resumes/${req.file.filename}`;
      updateFields.resumeOriginalName = req.file.originalname;
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedStudent) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      data: {
        username:           updatedStudent.username,
        email:              updatedStudent.email,
        usn:                updatedStudent.usn,
        role:               updatedStudent.role,
        skills:             updatedStudent.skills,
        interests:          updatedStudent.interests,
        resumeUrl:          updatedStudent.resumeUrl,
        resumeOriginalName: updatedStudent.resumeOriginalName,
        cgpa:               updatedStudent.cgpa,
        department:         updatedStudent.department,
      },
    });
  } catch (err) {
    console.error('Update Profile Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};


exports.applyForDrive = async (req, res) => {
  try {
    const studentId = req.userId; // safely pulled from middleware
    const { companyId } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    // Safely check if already applied (handles potential nulls)
    const alreadyApplied = student.appliedCompanies.some((app) => {
      const existingId = app.companyId?._id ? app.companyId._id.toString() : app.companyId?.toString();
      return existingId === companyId?.toString();
    });

    if (alreadyApplied) {
      return res.status(400).json({ success: false, error: 'Already applied to this drive.' });
    }

    student.appliedCompanies.push({ companyId, status: 'Applied' });
    await student.save();

    return res.status(200).json({ success: true, message: 'Successfully applied!' });
  } catch (error) {
    console.error('Apply Error:', error);
    return res.status(500).json({ success: false, error: 'Server Error during application' });
  }
};