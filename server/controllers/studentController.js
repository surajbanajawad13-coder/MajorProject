const Student = require('../models/studentSchema.js');

// 1. Get Complete Student Dashboard Data
exports.getStudentDashboard = async (req, res) => {
  try {
    // req.user.id comes from your JWT Auth middleware
    const student = await Student.findById(req.user.id)
      .select('-password') // Exclude password hash
      .populate('registeredEvents') // Fetch full event details
      .populate('appliedCompanies.companyId'); // Fetch full company details

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    // Response structure tailored for React frontend UI components
    res.status(200).json({
      success: true,
      data: {
        profile: {
          username: student.username,
          email: student.email,
          usn: student.usn,
          role: student.role,
          skills: student.skills,
          interests: student.interests
        },
        stats: {
          eventsCount: student.registeredEvents.length,
          appliedCompaniesCount: student.appliedCompanies.length,
          trainingsAttendedCount: student.trainingAttendance.filter(t => t.attended).length
        },
        registeredEvents: student.registeredEvents,
        appliedCompanies: student.appliedCompanies,
        trainingAttendance: student.trainingAttendance
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 2. Update Student Skills & Interests (For AI Recommender setup)
exports.updateStudentProfile = async (req, res) => {
  try {
    const { skills, interests } = req.body;

    const updatedStudent = await Student.findByIdAndUpdate(
      req.user.id,
      { 
        $set: { 
          skills: skills ? skills.map(s => s.toLowerCase().trim()) : [],
          interests: interests ? interests.map(i => i.toLowerCase().trim()) : []
        } 
      },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      data: updatedStudent
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};