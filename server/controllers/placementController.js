const Company = require('../models/companySchema');
const Student = require('../models/studentSchema');
const nodemailer = require('nodemailer');

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
    const branchArray = branches.split(',').map(b => b.trim());

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
      jobDescription
    });

    // 3. Filter Students
    const eligibleStudents = await Student.find({
      role: 'Student',
      cgpa: { $gte: Number(cgpa) },
      department: { $in: branchArray }
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
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};