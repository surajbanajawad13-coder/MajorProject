const startOfToday = (now = new Date()) => {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return start;
};

const isVisibleTodayOrLater = (date, now = new Date()) => new Date(date) >= startOfToday(now);

const isRegistrationOpen = (date, deadline, now = new Date()) =>
  new Date(date) > now && (!deadline || new Date(deadline) > now);

const canStudentRegister = (student, program, resume, now = new Date()) => {
  if (program.registeredStudents?.some(id => id.equals?.(student._id) || id.toString() === student._id.toString())) {
    return { allowed: false, reason: 'Already registered.' };
  }
  if (!program.targetDepartment?.includes('All') && !program.targetDepartment?.includes(student.department)) {
    return { allowed: false, reason: 'This program is not available to your department.' };
  }
  if (program.eligibilityBranches?.length && !program.eligibilityBranches.includes(student.department)) {
    return { allowed: false, reason: 'Your department is not eligible for this program.' };
  }
  if (program.eligibilityYears?.length && !program.eligibilityYears.includes(String(student.year || ''))) {
    return { allowed: false, reason: 'Your year of study is not eligible for this program.' };
  }
  if (program.minCgpa != null && Number(student.cgpa || 0) < program.minCgpa) {
    return { allowed: false, reason: 'Your CGPA does not meet this program’s requirement.' };
  }
  if (program.registrationDeadline && new Date(program.registrationDeadline) <= now) {
    return { allowed: false, reason: 'Registration deadline has passed.' };
  }
  if (new Date(program.date) <= now) {
    return { allowed: false, reason: 'Registration is closed because this program has started.' };
  }

  const knownSkills = new Set([
    ...(student.skills || []),
    ...(student.certifications || []),
    ...(student.projects || []).flatMap(project => project.keywords || []),
    ...(resume?.parsedSkills || []),
  ].map(skill => String(skill).trim().toLowerCase()));
  const requiredSkills = (program.requiredSkills || []).map(skill => String(skill).trim().toLowerCase());
  if (requiredSkills.length && !requiredSkills.some(skill => knownSkills.has(skill))) {
    return { allowed: false, reason: 'Your profile/resume does not match the required skills for this program.' };
  }
  return { allowed: true, reason: 'You meet the registration requirements.' };
};

module.exports = { startOfToday, isVisibleTodayOrLater, isRegistrationOpen, canStudentRegister };
