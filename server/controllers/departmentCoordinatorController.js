const Student = require('../models/studentSchema');
const Company = require('../models/companySchema');
const placementController = require('./placementController');

const departments = ['CSE', 'ISE', 'ECE', 'ME', 'CE'];

exports.getDepartmentAnalytics = async (req, res) => {
  try {
    // Coordinator scope always comes from the verified JWT. Admin may optionally inspect one branch.
    const department = req.role === 'Admin'
      ? (departments.includes(req.query.department) ? req.query.department : null)
      : req.user?.department;

    if (req.role !== 'Admin' && !departments.includes(department)) {
      return res.status(403).json({ success: false, error: 'A valid coordinator department is required.' });
    }

    const studentQuery = { role: 'Student', ...(department ? { department } : {}) };
    const students = await Student.find(studentQuery)
      .select('username usn email department cgpa resumeUrl appliedCompanies')
      .lean();
    const placedStudents = students.filter(student =>
      student.appliedCompanies?.some(application => application.status === 'Placed')
    ).length;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const driveScope = department
      ? { $or: [
        { targetDepartment: 'All' },
        { targetDepartment: department },
        { targetDepartment: { $exists: false } },
        { targetDepartment: { $size: 0 } }
      ] }
      : {};
    const activeDrives = await Company.countDocuments({ visitDate: { $gte: startOfToday }, ...driveScope });

    const safeStudents = students.map(student => ({
      _id: student._id,
      username: student.username,
      usn: student.usn,
      email: student.email,
      department: student.department,
      cgpa: student.cgpa || 0,
      resumeUrl: student.resumeUrl,
      applicationCount: student.appliedCompanies?.length || 0,
      placementStatus: student.appliedCompanies?.some(application => application.status === 'Placed')
        ? 'Placed'
        : student.appliedCompanies?.some(application => application.status === 'Interviewing')
          ? 'In Progress'
          : 'Unplaced'
    }));

    res.json({
      success: true,
      data: {
        department: department || 'All',
        totalStudents: students.length,
        placedStudents,
        placementRate: students.length ? Number(((placedStudents / students.length) * 100).toFixed(1)) : 0,
        activeDrives,
        averageCgpa: students.length
          ? Number((students.reduce((sum, student) => sum + (Number(student.cgpa) || 0), 0) / students.length).toFixed(2))
          : 0,
        students: safeStudents
      }
    });
  } catch (error) {
    console.error('Department coordinator analytics error:', error);
    res.status(500).json({ success: false, error: 'Unable to load department data.' });
  }
};

exports.postDepartmentDrive = async (req, res) => {
  try {
    if (req.role !== 'Admin' && !departments.includes(req.user?.department)) {
      return res.status(403).json({ success: false, error: 'A valid coordinator department is required.' });
    }
    const visibility = req.body.visibility;
    if (!['department', 'all'].includes(visibility)) {
      return res.status(400).json({ success: false, error: 'Choose My Department or All Departments.' });
    }

    const department = req.role === 'Admin'
      ? (departments.includes(req.body.adminDepartment) ? req.body.adminDepartment : null)
      : req.user.department;
    if (visibility === 'department' && !department) {
      return res.status(400).json({ success: false, error: 'Select a valid department for this drive.' });
    }

    // Ignore any client-supplied targetDepartment. Coordinator scope is derived from the JWT.
    req.body.targetDepartment = visibility === 'all' ? ['All'] : [department];
    if (visibility === 'department') req.body.branches = department;

    // Reuse the TPO implementation for the shared Company schema, validation, upload, and notifications.
    return placementController.postNewDrive(req, res);
  } catch (error) {
    console.error('Department drive creation error:', error);
    return res.status(500).json({ success: false, error: 'Unable to create placement drive.' });
  }
};
