const Company = require('../models/companySchema');
const Student = require('../models/studentSchema');
const EventTraining = require('../models/eventTrainingSchema');
const Notification = require('../models/notificationSchema');

const getEligibleStudents = async ({ targetDepartment, eligibleBranches, minCgpa, eligibleYears }) => {
  const targets = targetDepartment || [];
  const branches = eligibleBranches || [];
  const unrestrictedTarget = !targets.length || targets.includes('All');
  const unrestrictedBranch = !branches.length || branches.includes('All');
  let departments = [];
  if (unrestrictedTarget && unrestrictedBranch) departments = [];
  else if (unrestrictedTarget) departments = branches;
  else if (unrestrictedBranch) departments = targets;
  else departments = targets.filter(department => branches.includes(department));

  const query = { role: 'Student' };
  if (!unrestrictedTarget || !unrestrictedBranch) query.department = { $in: departments };
  if (minCgpa != null) query.cgpa = { $gte: minCgpa };
  if (eligibleYears?.length) query.year = { $in: eligibleYears };
  return Student.find(query).select('_id appliedCompanies');
};

async function createDeadlineReminders() {
  const now = new Date();
  const reminderWindow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const [drives, programs] = await Promise.all([
    Company.find({
    applicationDeadline: { $gte: now, $lte: reminderWindow },
    }).select('name jobRole applicationDeadline targetDepartment eligibilityCriteria eligibilityYears'),
    EventTraining.find({ registrationDeadline: { $gte: now, $lte: reminderWindow } })
      .select('title registrationDeadline targetDepartment eligibilityBranches eligibilityYears minCgpa registeredStudents'),
  ]);

  for (const drive of drives) {
    const students = await getEligibleStudents({
      targetDepartment: drive.targetDepartment,
      eligibleBranches: drive.eligibilityCriteria?.branches,
      minCgpa: drive.eligibilityCriteria?.cgpa,
      eligibleYears: drive.eligibilityYears,
    });
    const recipients = students.filter(student =>
      !student.appliedCompanies.some(application => application.companyId?.equals(drive._id))
    );

    const deadline = drive.applicationDeadline.toISOString();
    const results = await Promise.allSettled(recipients.map(student => {
      const dedupeKey = `deadline:${drive._id}:${student._id}:${deadline}`;
      return Notification.updateOne(
        { dedupeKey },
        { $setOnInsert: {
          user: student._id,
          title: `Application deadline approaching: ${drive.name}`,
          message: `Apply for ${drive.jobRole} by ${drive.applicationDeadline.toLocaleDateString()}.`,
          type: 'placement',
          relatedModel: 'Company',
          relatedId: drive._id,
          dedupeKey,
        } },
        { upsert: true }
      );
    }));
    results.forEach(result => {
      if (result.status === 'rejected') console.error('Deadline reminder write failed:', result.reason.message);
    });
  }

  for (const program of programs) {
    const students = await getEligibleStudents({
      targetDepartment: program.targetDepartment,
      eligibleBranches: program.eligibilityBranches,
      minCgpa: program.minCgpa,
      eligibleYears: program.eligibilityYears,
    });
    const recipients = students.filter(student =>
      !program.registeredStudents.some(studentId => studentId.equals(student._id))
    );
    const deadline = program.registrationDeadline.toISOString();
    const results = await Promise.allSettled(recipients.map(student => {
      const dedupeKey = `event-deadline:${program._id}:${student._id}:${deadline}`;
      return Notification.updateOne(
        { dedupeKey },
        { $setOnInsert: {
          user: student._id,
          title: `Registration deadline approaching: ${program.title}`,
          message: `Register for ${program.title} by ${program.registrationDeadline.toLocaleDateString()}.`,
          type: 'event',
          relatedModel: 'Event',
          relatedId: program._id,
          dedupeKey,
        } },
        { upsert: true }
      );
    }));
    results.forEach(result => {
      if (result.status === 'rejected') console.error('Event deadline reminder write failed:', result.reason.message);
    });
  }
}

function startDeadlineReminderJob() {
  const run = () => createDeadlineReminders().catch(error => {
    console.error('Deadline reminder job failed:', error.message);
  });
  run();
  const timer = setInterval(run, 24 * 60 * 60 * 1000);
  timer.unref();
}

module.exports = { createDeadlineReminders, startDeadlineReminderJob };
