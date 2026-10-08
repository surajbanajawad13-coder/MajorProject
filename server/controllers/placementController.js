const Company = require('../models/companySchema');
const Student = require('../models/studentSchema');
const nodemailer = require('nodemailer');
const Broadcast = require('../models/broadcastSchema');

const {
  buildProfilePayload,
  buildPlacementPayload,
  AI_SERVICE_URL
} = require('./recommendationController');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // 4. Broadcast Alert — personalized per student with their AI match score,
    //    instead of the same generic message to everyone.
    if (eligibleStudents.length > 0) {
      const placementPayload = buildPlacementPayload(newCompany);

      // Score every eligible student against this one drive. Done with
      // Promise.allSettled so one failed AI call can't take down the
      // whole broadcast for everyone else.
      const scoredStudents = await Promise.allSettled(
        eligibleStudents.map(async (student) => {
          try {
            const { data } = await axios.post(
              `${AI_SERVICE_URL}/recommend`,
              {
                profile: buildProfilePayload(student),
                resume: null,
                events: [],
                placements: [placementPayload],
              },
              { timeout: 10000 }
            );
            const result = data.placements?.[0];
            return {
              student,
              score: result?.score ?? null,
              rankLabel: result?.rank_label ?? null,
            };
          } catch (scoreErr) {
            console.error(`Match score failed for ${student.email}:`, scoreErr.message);
            return { student, score: null, rankLabel: null };
          }
        })
      );

      const results = scoredStudents.map((r) => r.value);

      // Email is best-effort: if SMTP isn't configured or fails, we still
      // want the drive to be created and in-app notifications to go out.
      // Sent as individual emails (not one bulk "to" list) so each
      // student's match score line is personal to them.
      for (const { student, score, rankLabel } of results) {
        const matchLine = score !== null
          ? `<p><strong>Your AI Match Score:</strong> ${score} pts — ${rankLabel}</p>`
          : '';
        try {
          const { data, error } = await resend.emails.send({
  from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
  to: student.email,
  subject: `New Placement Drive: ${name} is hiring!`,
  html: `
    <h2>${name} is visiting the campus!</h2>
    <p><strong>Role:</strong> ${jobRole}</p>
    <p><strong>Package:</strong> ${ctc}</p>
    <p><strong>Eligibility:</strong> ${cgpa} CGPA and above</p>
    ${matchLine}
    <p>Log into your CampusConnect dashboard to apply.</p>
  `,
});

if (error) {
  throw new Error(error.message);
}

console.log(`Placement email sent to ${student.email}:`, data?.id);
        } catch (mailErr) {
          console.error(`Placement email failed for ${student.email} (non-fatal):`, mailErr.message);
        }
      }

      // In-app notification (bell icon), also personalized with the score.
      const notificationDocs = results.map(({ student, score, rankLabel }) => ({
        user: student._id,
        title: `New placement drive: ${name}`,
        message:
          score !== null
            ? `${name} is hiring for ${jobRole} (${ctc}). Your match score: ${score} pts (${rankLabel}).`
            : `${name} is hiring for ${jobRole} (${ctc}). You meet the eligibility criteria — check it out!`,
        type: 'placement',
        relatedModel: 'Company',
        relatedId: newCompany._id,
      }));
      await Notification.insertMany(notificationDocs);
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
