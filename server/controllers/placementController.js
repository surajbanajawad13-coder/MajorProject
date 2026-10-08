const Company = require('../models/companySchema');
const Student = require('../models/studentSchema');
const nodemailer = require('nodemailer');
const Broadcast = require('../models/broadcastSchema');

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.postNewDrive = async (req, res) => {
  try {
    const { name, jobRole, ctc, visitDate, cgpa, branches } = req.body;
    const branchArray = String(branches || 'All').split(',').map(b => b.trim()).filter(Boolean);
    const requestedTarget = req.body.targetDepartment;
    const targetDepartment = Array.isArray(requestedTarget)
      ? requestedTarget
      : typeof requestedTarget === 'string' && requestedTarget
        ? requestedTarget.split(',').map(value => value.trim())
        : ['All'];

    // 1. Local File Storage using your existing Multer middleware
    let jobDescription = { url: '', filename: '' };
    if (req.file) {
      jobDescription = { 
        // Force a relative web path based on where your Multer saves it
        url: `uploads/resumes/${req.file.filename}`, 
        filename: req.file.filename 
      };
    }

    // 2. Save Drive
    const newCompany = await Company.create({
      name,
      jobRole,
      ctc,
      visitDate,
      eligibilityCriteria: { cgpa: Number(cgpa), branches: branchArray },
      targetDepartment,
      jobDescription
    });

    // 3. Filter Students
    const eligibleStudents = await Student.find({
      role: 'Student',
      cgpa: { $gte: Number(cgpa) },
      department: { $in: branchArray.includes('All') ? await Student.distinct('department', { role: 'Student' }) : branchArray }
    });

    // 4. Broadcast Alert
    if (eligibleStudents.length > 0) {
      const studentEmails = eligibleStudents.map(student => student.email);

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: studentEmails, 
        subject: `New Placement Drive: ${name} is hiring!`,
        html: `
          <h2>${name} is visiting the campus!</h2>
          <p><strong>Role:</strong> ${jobRole}</p>
          <p><strong>Package:</strong> ${ctc}</p>
          <p><strong>Eligibility:</strong> ${cgpa} CGPA and above</p>
          <p>Log into your CampusConnect dashboard to apply.</p>
        `
      });
    }

    res.status(201).json({ success: true, data: newCompany });
  } catch (error) {
    console.error('Placement Post Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Server Error' });
  }
};


// Fetch all students who applied to a specific drive
exports.getDriveApplicants = async (req, res) => {
  try {
    const { companyId } = req.params;
    
    // Find all students where appliedCompanies contains this companyId
    const students = await Student.find({ 'appliedCompanies.companyId': companyId })
      .select('username email usn department cgpa resumeUrl appliedCompanies');

    // Map through students to extract just the status for this specific company
    const applicants = students.map(student => {
      const application = student.appliedCompanies.find(
        app => app.companyId.toString() === companyId.toString()
      );
      return {
        _id: student._id,
        username: student.username,
        email: student.email,
        usn: student.usn,
        department: student.department,
        cgpa: student.cgpa,
        resumeUrl: student.resumeUrl,
        status: application ? application.status : 'Unknown'
      };
    });

    res.status(200).json({ success: true, data: applicants });
  } catch (error) {
    console.error('Fetch Applicants Error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Update a student's status for a specific drive
exports.updateApplicantStatus = async (req, res) => {
  try {
    const { companyId, studentId } = req.params;
    const { status } = req.body; // 'Applied', 'Interviewing', 'Placed', 'Rejected'

    await Student.findOneAndUpdate(
      { _id: studentId, 'appliedCompanies.companyId': companyId },
      { $set: { 'appliedCompanies.$.status': status } }
    );

    res.status(200).json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    console.error('Update Status Error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getAllStudentsAnalytics = async (req, res) => {
  try {
    const students = await Student.find({ role: 'Student' })
      .select('username email usn department cgpa appliedCompanies resumeUrl')
      .populate('appliedCompanies.companyId', 'name jobRole');

    const analyticsData = students.map(student => {
      const totalApplied = student.appliedCompanies.length;
      const isPlaced = student.appliedCompanies.some(app => app.status === 'Placed');
      
      return {
        _id: student._id,
        username: student.username,
        email: student.email,
        usn: student.usn,
        department: student.department || 'N/A',
        cgpa: student.cgpa || 0,
        totalApplied,
        status: isPlaced ? 'Placed' : totalApplied > 0 ? 'In Progress' : 'Unplaced',
        resumeUrl: student.resumeUrl
      };
    });

    res.status(200).json({ success: true, data: analyticsData });
  } catch (error) {
    console.error('Student Analytics Error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};


const transporter1 = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.broadcastAlert = async (req, res) => {
  try {
    const { subject, message, department } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ success: false, error: 'Subject and message are required.' });
    }

    // Filter students by department if specified, otherwise grab all students
    let query = { role: 'Student' };
    if (department && department !== 'All') {
      query.department = department;
    }

    const students = await Student.find(query).select('email');
    if (students.length === 0) {
      return res.status(404).json({ success: false, error: 'No students found for this filter.' });
    }

    const studentEmails = students.map(s => s.email);

    //
    await Broadcast.create({ subject, message, department });

    // Send email broadcast via Nodemailer
    await transporter1.sendMail({
      from: process.env.EMAIL_USER,
      bcc: studentEmails, // Use BCC to protect student privacy
      subject: `CampusConnect Announcement ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #6366f1;">CampusConnect Placement Cell</h2>
          <p style="font-size: 15px; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">This is an official automated broadcast from your Placement Office. Do not reply to this email.</p>
        </div>
      `
    });

    res.status(200).json({ success: true, message: `Broadcast sent to ${studentEmails.length} students!` });
  } catch (error) {
    console.error('Broadcast Error:', error);
    res.status(500).json({ success: false, error: 'Failed to send broadcast email.' });
  }
};
