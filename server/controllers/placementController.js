const Company = require('../models/companySchema');
const Student = require('../models/studentSchema');
const Resume = require('../models/resumeSchema');
const nodemailer = require('nodemailer');
const Broadcast = require('../models/broadcastSchema');
const axios = require('axios');
const Notification = require('../models/notificationSchema');

const {
  buildProfilePayload,
  buildPlacementPayload,
  AI_SERVICE_URL
} = require('./recommendationController');
const { Resend } = require('resend');
const { analyzeJobDescriptionFile, normalizeSkills } = require('../services/jobDescriptionAnalysis');

const resend = new Resend(process.env.RESEND_API_KEY);

const parseList = value => Array.isArray(value)
  ? value.map(item => String(item).trim()).filter(Boolean)
  : String(value || '').split(',').map(item => item.trim()).filter(Boolean);

exports.postNewDrive = async (req, res) => {
  try {
    const {
      name, jobRole, ctc, visitDate, cgpa, branches, domain,
      requiredSkills, eligibilityYears, applicationDeadline,
      selectionStages, description,
    } = req.body;
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
    const jobDescriptionAnalysis = req.file
      ? await analyzeJobDescriptionFile(req.file)
      : undefined;
    const manuallyEnteredSkills = parseList(requiredSkills);
    const combinedRequiredSkills = normalizeSkills(manuallyEnteredSkills, jobDescriptionAnalysis?.requiredSkills || []);

    // 2. Save Drive
    const newCompany = await Company.create({
      name,
      jobRole,
      ctc,
      visitDate,
      eligibilityCriteria: { cgpa: Number(cgpa), branches: branchArray },
      targetDepartment,
      jobDescription,
      domain: domain || '',
      requiredSkills: combinedRequiredSkills,
      ...(jobDescriptionAnalysis ? { jobDescriptionAnalysis } : {}),
      eligibilityYears: parseList(eligibilityYears),
      applicationDeadline: applicationDeadline || null,
      selectionStages: parseList(selectionStages),
      description: description || '',
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
      const resumes = await Resume.find({ user: { $in: eligibleStudents.map(student => student._id) } })
        .sort({ user: 1, uploadDate: -1 })
        .lean();
      const latestResumeByStudent = new Map();
      for (const resume of resumes) {
        const studentId = resume.user.toString();
        if (!latestResumeByStudent.has(studentId)) latestResumeByStudent.set(studentId, resume);
      }

      // Score every eligible student against this one drive. Done with
      // Promise.allSettled so one failed AI call can't take down the
      // whole broadcast for everyone else.
      const scoredStudents = await Promise.allSettled(
        eligibleStudents.map(async (student) => {
          const latestResume = latestResumeByStudent.get(student._id.toString());
          const resumePayload = latestResume
            ? {
                parsed_skills: latestResume.parsedSkills || [],
                role_interest_keywords: latestResume.roleInterestKeywords || [],
                parsed_projects: latestResume.parsedProjects || { titles: [], keywords: [] },
                certifications: latestResume.certifications || [],
              }
            : null;
          try {
            const { data } = await axios.post(
              `${AI_SERVICE_URL}/recommend`,
              {
                profile: buildProfilePayload(student),
                resume: resumePayload,
                events: [],
                placements: [placementPayload],
              },
              { timeout: 10000 }
            );
            const result = data.placements?.[0];
            return {
              student,
              score: result?.score ?? null,
              matchPercentage: result?.match_percentage ?? null,
              rankLabel: result?.rank_label ?? null,
            };
          } catch (scoreErr) {
            console.error(`Match score failed for ${student.email}:`, scoreErr.message);
            return { student, score: null, matchPercentage: null, rankLabel: null };
          }
        })
      );

      const results = scoredStudents.map((r) => r.value);

      // Email is best-effort: if SMTP isn't configured or fails, we still
      // want the drive to be created and in-app notifications to go out.
      // Sent as individual emails (not one bulk "to" list) so each
      // student's match score line is personal to them.
      for (const { student, score, matchPercentage, rankLabel } of results) {
        const matchLine = score !== null
          ? `<p><strong>Your AI Match Score:</strong> ${score}/14 pts (${matchPercentage}%) — ${rankLabel}</p>`
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
      const notificationDocs = results.map(({ student, score, matchPercentage, rankLabel }) => ({
        user: student._id,
        title: `New placement drive: ${name}`,
        message:
          score !== null
            ? `${name} is hiring for ${jobRole} (${ctc}). Your match score: ${score}/14 pts (${matchPercentage}%, ${rankLabel}).`
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
    res.status(error.status || 500).json({ success: false, error: error.message || 'Server Error' });
  }
};

exports.getDrive = async (req, res) => {
  try {
    const drive = await Company.findById(req.params.companyId);
    if (!drive) return res.status(404).json({ success: false, message: 'Placement opportunity not found.' });
    if (req.role === 'Student') {
      const student = await Student.findById(req.userId).select('department cgpa year');
      if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });
      const targets = drive.targetDepartment || [];
      if (targets.length && !targets.includes('All') && !targets.includes(student.department)) {
        return res.status(403).json({ success: false, message: 'This placement opportunity is not available to your department.' });
      }
      if (student.cgpa < (drive.eligibilityCriteria?.cgpa || 0)) {
        return res.status(403).json({ success: false, message: 'Your CGPA does not meet this placement opportunity’s requirement.' });
      }
      const eligibleBranches = drive.eligibilityCriteria?.branches || [];
      if (eligibleBranches.length && !eligibleBranches.includes('All') && !eligibleBranches.includes(student.department)) {
        return res.status(403).json({ success: false, message: 'Your department is not eligible for this placement opportunity.' });
      }
      if (drive.eligibilityYears?.length && !drive.eligibilityYears.includes(String(student.year || ''))) {
        return res.status(403).json({ success: false, message: 'Your year of study is not eligible for this placement opportunity.' });
      }
    }
    return res.json({ success: true, data: drive });
  } catch (error) {
    console.error('Fetch Placement Error:', error.message);
    return res.status(500).json({ success: false, message: 'Unable to load placement opportunity.' });
  }
};

exports.updateDrive = async (req, res) => {
  try {
    const fields = ['name', 'jobRole', 'ctc', 'visitDate', 'domain', 'requiredSkills', 'eligibilityYears', 'applicationDeadline', 'selectionStages', 'description', 'targetDepartment'];
    const update = Object.fromEntries(
      fields.filter(field => req.body[field] !== undefined).map(field => [field, req.body[field]])
    );
    if (req.body.requiredSkills !== undefined) {
      update.requiredSkills = parseList(req.body.requiredSkills);
    }
    if (req.body.cgpa !== undefined || req.body.branches !== undefined) {
      update.eligibilityCriteria = {};
      if (req.body.cgpa !== undefined) {
        const cgpa = Number(req.body.cgpa);
        if (!Number.isFinite(cgpa) || cgpa < 0 || cgpa > 10) {
          return res.status(400).json({ success: false, message: 'Minimum CGPA must be between 0 and 10.' });
        }
        update.eligibilityCriteria.cgpa = cgpa;
      }
      if (req.body.branches !== undefined) {
        update.eligibilityCriteria.branches = Array.isArray(req.body.branches)
          ? req.body.branches
          : String(req.body.branches).split(',').map(branch => branch.trim()).filter(Boolean);
      }
    }
    if (req.body.targetDepartment !== undefined && !Array.isArray(update.targetDepartment)) {
      update.targetDepartment = String(update.targetDepartment).split(',').map(value => value.trim()).filter(Boolean);
    }
    if (req.file) {
      const analysis = await analyzeJobDescriptionFile(req.file);
      const manualSkills = parseList(req.body.requiredSkills);
      update.requiredSkills = normalizeSkills(manualSkills, analysis.requiredSkills || []);
      update.jobDescriptionAnalysis = analysis;
      update.jobDescription = {
        url: `uploads/resumes/${req.file.filename}`,
        filename: req.file.filename,
      };
    }
    if (!Object.keys(update).length) {
      return res.status(400).json({ success: false, message: 'Provide at least one field to update.' });
    }

    const drive = await Company.findByIdAndUpdate(req.params.companyId, update, { new: true, runValidators: true });
    if (!drive) return res.status(404).json({ success: false, message: 'Placement opportunity not found.' });
    return res.json({ success: true, data: drive });
  } catch (error) {
    console.error('Update Placement Error:', error.message);
    return res.status(error.status || 400).json({ success: false, message: error.message || 'Unable to update placement opportunity.' });
  }
};

exports.deleteDrive = async (req, res) => {
  try {
    const drive = await Company.findByIdAndDelete(req.params.companyId);
    if (!drive) return res.status(404).json({ success: false, message: 'Placement opportunity not found.' });
    await Promise.all([
      Student.updateMany({}, { $pull: { appliedCompanies: { companyId: drive._id } } }),
      require('../models/notificationSchema').deleteMany({ relatedId: drive._id, relatedModel: 'Company' }),
    ]);
    return res.json({ success: true, message: 'Placement opportunity deleted.' });
  } catch (error) {
    console.error('Delete Placement Error:', error.message);
    return res.status(500).json({ success: false, message: 'Unable to delete placement opportunity.' });
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
    if (!['Applied', 'Interviewing', 'Placed', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid application status.' });
    }

    const student = await Student.findOneAndUpdate(
      { _id: studentId, 'appliedCompanies.companyId': companyId },
      { $set: { 'appliedCompanies.$.status': status } },
      { new: true }
    );

    if (!student) return res.status(404).json({ success: false, error: 'Application not found.' });
    const drive = await Company.findById(companyId).select('name jobRole');
    const notificationResult = await Promise.allSettled([
      require('../models/notificationSchema').create({
        user: student._id,
        title: 'Placement application status updated',
        message: `Your application for ${drive?.name || 'the placement drive'} is now ${status}.`,
        type: 'application_status',
        relatedModel: 'Company',
        relatedId: companyId,
      }),
    ]);
    notificationResult.forEach(result => {
      if (result.status === 'rejected') console.error('Application status notification failed:', result.reason.message);
    });
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
