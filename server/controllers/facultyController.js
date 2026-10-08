const Faculty = require('../models/facultySchema');
const Student = require('../models/studentSchema');

exports.getDashboard = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.userId).select('-password');
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty profile not found.' });

    const departmentQuery = { role: 'Student', department: faculty.department };
    const [students, totalStudents, placedStudents, average] = await Promise.all([
      Student.find(departmentQuery)
        .select('username email usn department cgpa appliedCompanies facultyMentor')
        .populate('facultyMentor', 'username designation department')
        .sort({ usn: 1 }),
      Student.countDocuments(departmentQuery),
      Student.countDocuments({ ...departmentQuery, 'appliedCompanies.status': 'Placed' }),
      Student.aggregate([
        { $match: departmentQuery },
        { $group: { _id: null, averageCgpa: { $avg: '$cgpa' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        faculty,
        analytics: {
          totalStudents,
          placedStudents,
          placementRate: totalStudents ? Math.round((placedStudents / totalStudents) * 100) : 0,
          averageCgpa: Number((average[0]?.averageCgpa || 0).toFixed(2))
        },
        students: students.map(student => ({
          _id: student._id,
          username: student.username,
          email: student.email,
          usn: student.usn,
          department: student.department,
          cgpa: student.cgpa || 0,
          placementStatus: student.appliedCompanies.some(application => application.status === 'Placed')
            ? 'Placed'
            : student.appliedCompanies.length ? 'In Progress' : 'Unplaced',
          mentor: student.facultyMentor || null
        }))
      }
    });
  } catch (error) {
    console.error('Faculty dashboard error:', error);
    res.status(500).json({ success: false, message: 'Unable to load department dashboard.' });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.userId).select('department');
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty profile not found.' });
    const students = await Student.find({ role: 'Student', department: faculty.department })
      .select('username email usn department cgpa appliedCompanies facultyMentor')
      .populate('facultyMentor', 'username designation department')
      .sort({ usn: 1 });
    res.json({ success: true, data: students });
  } catch (error) {
    console.error('Faculty student list error:', error);
    res.status(500).json({ success: false, message: 'Unable to load department students.' });
  }
};

exports.updateMentorship = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.userId).select('department');
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty profile not found.' });
    const isRemovingSelf = req.body.assigned === false;
    const mentorScope = isRemovingSelf
      ? { facultyMentor: faculty._id }
      : { $or: [{ facultyMentor: null }, { facultyMentor: faculty._id }] };
    const student = await Student.findOneAndUpdate(
      { _id: req.params.studentId, role: 'Student', department: faculty.department, ...mentorScope },
      { $set: { facultyMentor: isRemovingSelf ? null : faculty._id } },
      { new: true }
    ).select('username usn department facultyMentor').populate('facultyMentor', 'username designation');
    if (!student) return res.status(404).json({ success: false, message: 'Student is not available for this mentorship change.' });
    res.json({ success: true, data: student, message: req.body.assigned === false ? 'Mentor removed.' : 'Student added to your mentees.' });
  } catch (error) {
    console.error('Faculty mentorship update error:', error);
    res.status(500).json({ success: false, message: 'Unable to update mentorship.' });
  }
};
