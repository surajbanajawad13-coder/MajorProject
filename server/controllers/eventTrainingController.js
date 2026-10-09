const EventTraining = require('../models/eventTrainingSchema');
const Student = require('../models/studentSchema');
const Resume = require('../models/resumeSchema');
const Notification = require('../models/notificationSchema');
const { startOfToday, isRegistrationOpen, canStudentRegister } = require('../services/eventProgramWindow');

const departments = ['CSE', 'ISE', 'ECE', 'ME', 'CE', 'AIML', 'CSB', 'CSD'];
const isCoordinator = role => ['Event Coordinator', 'Admin'].includes(role);
const errorMessage = err => err?.name === 'ValidationError'
  ? err.message
  : 'Unable to complete the event request.';

exports.createProgram = async (req, res) => {
  try {
    const {
      title, description, type, category, organizer, date, domain,
      registrationDeadline, minCgpa,
    } = req.body;
    const parseList = value => Array.isArray(value)
      ? value.map(item => String(item).trim()).filter(Boolean)
      : typeof value === 'string'
        ? value.split(',').map(item => item.trim()).filter(Boolean)
        : [];
    const requiredSkills = parseList(req.body.requiredSkills);
    const eligibilityBranches = parseList(req.body.eligibilityBranches);
    const eligibilityYears = parseList(req.body.eligibilityYears);
    let targetDepartment = req.body.targetDepartment ?? ['All'];
    if (typeof targetDepartment === 'string') targetDepartment = parseList(targetDepartment);
    if (!Array.isArray(targetDepartment) || !targetDepartment.length || targetDepartment.some(department => !['All', ...departments].includes(department))) {
      return res.status(400).json({ success: false, message: 'Choose one or more valid target departments.' });
    }
    if (targetDepartment.includes('All')) targetDepartment = ['All'];
    if (![title, description, type, category, organizer, date].every(value => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ success: false, message: 'Title, description, type, category, organizer, and date are required.' });
    }
    if (!['Event', 'Training'].includes(type)) return res.status(400).json({ success: false, message: 'Type must be Event or Training.' });
    if (Number.isNaN(Date.parse(date))) return res.status(400).json({ success: false, message: 'Enter a valid date.' });
    if (new Date(date) <= new Date()) return res.status(400).json({ success: false, message: 'Choose a future date and time for this program.' });
    if (eligibilityBranches.some(department => !departments.includes(department))) {
      return res.status(400).json({ success: false, message: 'Choose valid eligible departments.' });
    }
    if (eligibilityYears.some(year => !['1', '2', '3', '4'].includes(year))) {
      return res.status(400).json({ success: false, message: 'Eligible years must be between 1 and 4.' });
    }

    if (minCgpa !== undefined && (!Number.isFinite(Number(minCgpa)) || Number(minCgpa) < 0 || Number(minCgpa) > 10)) {
      return res.status(400).json({ success: false, message: 'Minimum CGPA must be between 0 and 10.' });
    }
    const program = await EventTraining.create({
      title, description, type, category, organizer, date, targetDepartment,
      domain, registrationDeadline, requiredSkills, eligibilityBranches,
      eligibilityYears, minCgpa,
    });
    let departmentsForProgram = targetDepartment.includes('All') ? departments : targetDepartment;
    if (eligibilityBranches?.length) {
      departmentsForProgram = departmentsForProgram.filter(department => eligibilityBranches.includes(department));
    }
    const audienceQuery = { role: 'Student', department: { $in: departmentsForProgram } };
    if (minCgpa !== undefined && minCgpa !== '') audienceQuery.cgpa = { $gte: Number(minCgpa) };
    if (eligibilityYears?.length) audienceQuery.year = { $in: eligibilityYears.map(String) };
    try {
      const audience = await Student.find(audienceQuery).select('_id');
      const notificationWrites = await Promise.allSettled(audience.map(({ _id }) => Notification.updateOne(
        { dedupeKey: `event:${program._id}:${_id}` },
        { $setOnInsert: {
          user: _id,
          title: `New ${type.toLowerCase()}: ${title}`,
          message: `${title} is scheduled for ${new Date(date).toLocaleDateString()}.`,
          type: 'event',
          relatedModel: 'Event',
          relatedId: program._id,
          dedupeKey: `event:${program._id}:${_id}`,
        } },
        { upsert: true }
      )));
      notificationWrites.forEach(result => {
        if (result.status === 'rejected') console.error('Event notification write failed:', result.reason.message);
      });
    } catch (notificationError) {
      console.error('Event created but its notifications could not be queued:', notificationError.message);
    }
    return res.status(201).json({ success: true, message: 'Event created successfully', data: program });
  } catch (err) {
    console.error('Create event/training error:', err);
    return res.status(500).json({ success: false, message: errorMessage(err) });
  }
};

exports.getProgram = async (req, res) => {
  try {
    const program = await EventTraining.findById(req.params.id);
    if (!program) return res.status(404).json({ success: false, message: 'Event or training not found.' });
    const data = program.toObject();
    data.registrationCount = program.registeredStudents.length;
    if (req.role === 'Student') {
      const student = await Student.findById(req.userId).select('department cgpa year');
      if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });
      if (!program.targetDepartment.includes('All') && !program.targetDepartment.includes(student.department)) {
        return res.status(403).json({ success: false, message: 'This program is not available to your department.' });
      }
      if (program.eligibilityBranches?.length && !program.eligibilityBranches.includes(student.department)) {
        return res.status(403).json({ success: false, message: 'Your department is not eligible for this program.' });
      }
      if (program.eligibilityYears?.length && !program.eligibilityYears.includes(String(student.year || ''))) {
        return res.status(403).json({ success: false, message: 'Your year of study is not eligible for this program.' });
      }
      if (program.minCgpa != null && student.cgpa < program.minCgpa) {
        return res.status(403).json({ success: false, message: 'Your CGPA does not meet this program’s requirement.' });
      }
      data.isRegistered = program.registeredStudents.some(id => id.equals(student._id));
    }
    return res.json({ success: true, data });
  } catch (err) {
    console.error('Get event/training error:', err);
    return res.status(500).json({ success: false, message: 'Unable to load this event or training.' });
  }
};

exports.updateProgram = async (req, res) => {
  try {
    const editableFields = [
      'title', 'description', 'type', 'category', 'domain', 'organizer',
      'date', 'registrationDeadline', 'targetDepartment', 'requiredSkills',
      'eligibilityBranches', 'eligibilityYears', 'minCgpa',
    ];
    const update = Object.fromEntries(
      editableFields.filter(field => req.body[field] !== undefined).map(field => [field, req.body[field]])
    );
    const parseList = value => Array.isArray(value)
      ? value.map(item => String(item).trim()).filter(Boolean)
      : typeof value === 'string'
        ? value.split(',').map(item => item.trim()).filter(Boolean)
        : [];
    if (update.targetDepartment !== undefined) update.targetDepartment = parseList(update.targetDepartment);
    for (const field of ['requiredSkills', 'eligibilityBranches', 'eligibilityYears']) {
      if (update[field] !== undefined) update[field] = parseList(update[field]);
    }
    if (update.eligibilityBranches?.some(department => !departments.includes(department))) {
      return res.status(400).json({ success: false, message: 'Choose valid eligible departments.' });
    }
    if (update.eligibilityYears?.some(year => !['1', '2', '3', '4'].includes(year))) {
      return res.status(400).json({ success: false, message: 'Eligible years must be between 1 and 4.' });
    }
    if (update.type && !['Event', 'Training'].includes(update.type)) {
      return res.status(400).json({ success: false, message: 'Type must be Event or Training.' });
    }
    if (update.date && Number.isNaN(Date.parse(update.date))) {
      return res.status(400).json({ success: false, message: 'Enter a valid date.' });
    }
    if (update.minCgpa !== undefined && (!Number.isFinite(Number(update.minCgpa)) || Number(update.minCgpa) < 0 || Number(update.minCgpa) > 10)) {
      return res.status(400).json({ success: false, message: 'Minimum CGPA must be between 0 and 10.' });
    }
    if (!Object.keys(update).length) {
      return res.status(400).json({ success: false, message: 'Provide at least one field to update.' });
    }
    const program = await EventTraining.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!program) return res.status(404).json({ success: false, message: 'Event or training not found.' });
    return res.json({ success: true, data: program });
  } catch (err) {
    console.error('Update event/training error:', err);
    return res.status(400).json({ success: false, message: errorMessage(err) });
  }
};

exports.deleteProgram = async (req, res) => {
  try {
    const program = await EventTraining.findByIdAndDelete(req.params.id);
    if (!program) return res.status(404).json({ success: false, message: 'Event or training not found.' });
    await Student.updateMany({ registeredEvents: program._id }, { $pull: { registeredEvents: program._id } });
    return res.json({ success: true, message: 'Event or training deleted.' });
  } catch (err) {
    console.error('Delete event/training error:', err);
    return res.status(500).json({ success: false, message: 'Unable to delete this event or training.' });
  }
};

exports.getPrograms = async (req, res) => {
  try {
    const query = {};
    let studentId = null;
    let studentProfile = null;
    let latestResume = null;
    if (req.role === 'Student') {
      const [student, resume] = await Promise.all([
        Student.findOne({ _id: req.userId, role: 'Student' }).select('department cgpa year skills certifications projects'),
        Resume.findOne({ user: req.userId }).sort({ uploadDate: -1 }).lean(),
      ]);
      if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });
      studentProfile = student;
      latestResume = resume;
      studentId = student._id;
      query.date = { $gte: startOfToday() };
      query.targetDepartment = { $in: ['All', student.department] };
      query.$or = [
        { registrationDeadline: null },
        { registrationDeadline: { $gte: new Date() } },
        { registrationDeadline: { $exists: false } },
      ];
    }
    const programs = await EventTraining.find(query).sort({ date: 1 });
    const eligiblePrograms = studentProfile ? programs.filter(program =>
      (!program.eligibilityBranches?.length || program.eligibilityBranches.includes(studentProfile.department))
      && (!program.eligibilityYears?.length || program.eligibilityYears.includes(String(studentProfile.year || '')))
      && (program.minCgpa == null || Number(studentProfile.cgpa || 0) >= program.minCgpa)
    ) : programs;
    const data = eligiblePrograms.map(program => {
      const item = program.toObject();
      item.registrationCount = program.registeredStudents.length;
      item.registrationOpen = isRegistrationOpen(program.date, program.registrationDeadline);
      if (studentId) {
        item.isRegistered = program.registeredStudents.some(id => id.equals(studentId));
        const registration = canStudentRegister(studentProfile, program, latestResume);
        item.canRegister = registration.allowed;
        item.registrationReason = registration.reason;
      }
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
    const [student, resume] = await Promise.all([
      Student.findOne({ _id: req.userId, role: 'Student' }).select('department cgpa year skills certifications projects'),
      Resume.findOne({ user: req.userId }).sort({ uploadDate: -1 }).lean(),
    ]);
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });
    const program = await EventTraining.findById(req.params.id);
    if (!program) return res.status(404).json({ success: false, message: 'Event or training not found.' });
    if (program.registeredStudents.some(id => id.equals(student._id))) {
      return res.status(409).json({ success: false, message: 'You are already registered for this program' });
    }
    const registration = canStudentRegister(student, program, resume);
    if (!registration.allowed) {
      const status = /deadline has passed|registration is closed/i.test(registration.reason) ? 400 : 403;
      return res.status(status).json({ success: false, message: registration.reason });
    }

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
