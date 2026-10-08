const EventTraining = require('../models/eventTrainingSchema');
const Student = require('../models/studentSchema');

const departments = ['CSE', 'ISE', 'ECE', 'ME', 'CE', 'AIML', 'CSB', 'CSD'];
const isCoordinator = role => ['Event Coordinator', 'Admin'].includes(role);
const errorMessage = err => err?.name === 'ValidationError'
  ? err.message
  : 'Unable to complete the event request.';

exports.createProgram = async (req, res) => {
  try {
    const { title, description, type, category, organizer, date } = req.body;
    let targetDepartment = req.body.targetDepartment ?? ['All'];
    if (typeof targetDepartment === 'string') targetDepartment = [targetDepartment];
    if (!Array.isArray(targetDepartment) || !targetDepartment.length || targetDepartment.some(department => !['All', ...departments].includes(department))) {
      return res.status(400).json({ success: false, message: 'Choose one or more valid target departments.' });
    }
    if (targetDepartment.includes('All')) targetDepartment = ['All'];
    if (![title, description, type, category, organizer, date].every(value => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ success: false, message: 'Title, description, type, category, organizer, and date are required.' });
    }
    if (!['Event', 'Training'].includes(type)) return res.status(400).json({ success: false, message: 'Type must be Event or Training.' });
    if (Number.isNaN(Date.parse(date))) return res.status(400).json({ success: false, message: 'Enter a valid date.' });

    const program = await EventTraining.create({ title, description, type, category, organizer, date, targetDepartment });
    return res.status(201).json({ success: true, message: 'Event created successfully', data: program });
  } catch (err) {
    console.error('Create event/training error:', err);
    return res.status(500).json({ success: false, message: errorMessage(err) });
  }
};

exports.getPrograms = async (req, res) => {
  try {
    const query = {};
    let studentId = null;
    if (req.role === 'Student') {
      const student = await Student.findOne({ _id: req.userId, role: 'Student' }).select('department');
      if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });
      studentId = student._id;
      query.date = { $gte: new Date() };
      query.targetDepartment = { $in: ['All', student.department] };
    }
    const programs = await EventTraining.find(query).sort({ date: 1 });
    const data = programs.map(program => {
      const item = program.toObject();
      item.registrationCount = program.registeredStudents.length;
      if (studentId) item.isRegistered = program.registeredStudents.some(id => id.equals(studentId));
      return item;
    });
    return res.json({ success: true, data });
  } catch (err) {
    console.error('Get events/trainings error:', err);
    return res.status(500).json({ success: false, message: 'Unable to load events and trainings.' });
  }
};

exports.registerStudent = async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.userId, role: 'Student' }).select('department');
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });
    const program = await EventTraining.findById(req.params.id);
    if (!program) return res.status(404).json({ success: false, message: 'Event or training not found.' });
    if (program.registeredStudents.some(id => id.equals(student._id))) {
      return res.status(409).json({ success: false, message: 'You are already registered for this program' });
    }
    if (!program.targetDepartment.includes('All') && !program.targetDepartment.includes(student.department)) {
      return res.status(403).json({ success: false, message: 'This program is not available to your department.' });
    }
    if (program.date <= new Date()) return res.status(400).json({ success: false, message: 'Registration is closed for this program.' });

    const updated = await EventTraining.findOneAndUpdate(
      { _id: program._id, date: { $gt: new Date() }, registeredStudents: { $ne: student._id } },
      { $addToSet: { registeredStudents: student._id } },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(409).json({ success: false, message: 'You are already registered for this program' });
    const data = updated.toObject();
    data.isRegistered = true;
    data.registrationCount = updated.registeredStudents.length;
    return res.json({ success: true, message: 'Registered successfully', data });
  } catch (err) {
    console.error('Event registration error:', err);
    return res.status(500).json({ success: false, message: 'Unable to register for this program.' });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const programs = await EventTraining.find().select('title type date registeredStudents').sort({ date: 1 });
    const studentIds = [...new Set(programs.flatMap(program => program.registeredStudents.map(id => id.toString())))];
    const students = studentIds.length
      ? await Student.find({ _id: { $in: studentIds }, role: 'Student' }).select('department')
      : [];
    const departmentCounts = new Map();
    students.forEach(student => {
      const count = programs.reduce((total, program) => total + program.registeredStudents.filter(id => id.equals(student._id)).length, 0);
      departmentCounts.set(student.department || 'Unknown', (departmentCounts.get(student.department || 'Unknown') || 0) + count);
    });
    return res.json({ success: true, data: {
      totalPrograms: programs.length,
      totalEvents: programs.filter(program => program.type === 'Event').length,
      totalTrainings: programs.filter(program => program.type === 'Training').length,
      totalRegistrations: programs.reduce((total, program) => total + program.registeredStudents.length, 0),
      departmentWise: [...departmentCounts].map(([department, count]) => ({ department, count })).sort((a, b) => a.department.localeCompare(b.department)),
      programs: programs.map(program => ({ _id: program._id, title: program.title, type: program.type, date: program.date, registrations: program.registeredStudents.length }))
    } });
  } catch (err) {
    console.error('Event analytics error:', err);
    return res.status(500).json({ success: false, message: 'Unable to load event analytics.' });
  }
};

exports.isCoordinator = isCoordinator;
