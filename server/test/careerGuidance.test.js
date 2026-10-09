const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildSkillGap,
  summarizeResumeSections,
  buildCareerSuggestions,
} = require('../services/careerGuidance');
const { canStudentRegister, isRegistrationOpen, isVisibleTodayOrLater } = require('../services/eventProgramWindow');

test('skill gap ranks recurring opportunity skills and excludes known profile skills', () => {
  const gaps = buildSkillGap(
    [['Python', 'SQL', 'Python'], ['SQL', 'Docker'], ['SQL']],
    ['python']
  );

  assert.deepEqual(gaps, [
    { skill: 'sql', opportunityCount: 3 },
    { skill: 'docker', opportunityCount: 1 },
  ]);
});

test('resume section summary reports missing sections and completeness', () => {
  const summary = summarizeResumeSections('EDUCATION\nCSE\nSKILLS\nPython\nProjects\nCampus app');
  assert.equal(summary.score, 75);
  assert.deepEqual(summary.missingSections, ['certifications']);
  assert.equal(summary.sections.education, true);
});

test('resume section summary handles an empty resume', () => {
  const summary = summarizeResumeSections('');
  assert.equal(summary.score, 0);
  assert.deepEqual(summary.missingSections, ['education', 'skills', 'projects', 'certifications']);
});

test('weak resume receives concrete improvement suggestions', () => {
  const suggestions = buildCareerSuggestions({
    resume: { parsedProjects: { titles: [] }, certifications: [] },
    missingSections: ['skills', 'projects', 'certifications'],
    missingSkills: [{ skill: 'python' }, { skill: 'sql' }],
    student: { projects: [], certifications: [] },
  });

  assert.ok(suggestions.some(suggestion => suggestion.includes('skills, projects, certifications')));
  assert.ok(suggestions.some(suggestion => suggestion.includes('python, sql')));
  assert.ok(suggestions.some(suggestion => suggestion.includes('Add one or more projects')));
  assert.ok(suggestions.some(suggestion => suggestion.includes('relevant certifications')));
});

test('program that started earlier today remains visible but registration closes', () => {
  const now = new Date(2026, 9, 8, 22, 36);
  const eventDate = new Date(2026, 9, 8, 22, 33);

  assert.equal(isVisibleTodayOrLater(eventDate, now), true);
  assert.equal(isRegistrationOpen(eventDate, null, now), false);
});

test('future program remains visible and registration opens before its deadline', () => {
  const now = new Date(2026, 9, 8, 10, 0);
  const eventDate = new Date(2026, 9, 9, 10, 0);
  const deadline = new Date(2026, 9, 8, 23, 0);

  assert.equal(isVisibleTodayOrLater(eventDate, now), true);
  assert.equal(isRegistrationOpen(eventDate, deadline, now), true);
});

test('event registration eligibility includes parsed resume skills', () => {
  const now = new Date(2026, 9, 8, 10, 0);
  const student = {
    _id: 'student-1',
    department: 'CSE',
    year: '3',
    cgpa: 8,
    skills: [],
    projects: [],
  };
  const event = {
    _id: 'event-1',
    date: new Date(2026, 9, 9, 10, 0),
    targetDepartment: ['All'],
    eligibilityBranches: ['CSE'],
    eligibilityYears: ['3'],
    minCgpa: 7,
    requiredSkills: ['React'],
    registeredStudents: [],
  };

  assert.deepEqual(
    canStudentRegister(student, event, { parsedSkills: ['react'] }, now),
    { allowed: true, reason: 'You meet the registration requirements.' }
  );
});

test('started events are reported as not registerable', () => {
  const now = new Date(2026, 9, 8, 22, 36);
  const registration = canStudentRegister(
    { _id: 'student-1', department: 'CSE', year: '3', cgpa: 8, skills: [], projects: [] },
    { _id: 'event-1', date: new Date(2026, 9, 8, 22, 33), targetDepartment: ['All'], registeredStudents: [] },
    null,
    now
  );

  assert.equal(registration.allowed, false);
  assert.match(registration.reason, /has started/);
});
