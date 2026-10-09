const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildStudentPlacementQuery,
  getPlacementEligibilityReason,
  isStudentEligibleForPlacement,
} = require('../services/placementEligibility');

test('student placement listing query keeps department-targeted active drives visible regardless of eligibility', () => {
  const query = buildStudentPlacementQuery(
    { department: 'CSE', cgpa: 8.5 },
    new Date('2026-10-09T00:00:00.000Z')
  );

  assert.deepEqual(query.$and[0], {
    $or: [
      { targetDepartment: 'All' },
      { targetDepartment: 'CSE' },
      { targetDepartment: { $exists: false } },
      { targetDepartment: { $size: 0 } },
    ],
  });
  assert.deepEqual(query.$and[1], {
    $or: [
      { applicationDeadline: null },
      { applicationDeadline: { $gte: new Date('2026-10-09T00:00:00.000Z') } },
    ],
  });
});

test('placement eligibility rejects a student below the CGPA cutoff', () => {
  const eligible = isStudentEligibleForPlacement(
    {
      targetDepartment: ['All'],
      eligibilityCriteria: { branches: ['CSE'], cgpa: 7.0 },
      eligibilityYears: ['3'],
    },
    { department: 'CSE', year: '3', cgpa: 6.9 }
  );

  assert.equal(eligible, false);
});

test('matching branch, year, and CGPA are placement eligible', () => {
  const eligible = isStudentEligibleForPlacement(
    {
      targetDepartment: ['All'],
      eligibilityCriteria: { branches: ['CSE'], cgpa: 7.0 },
      eligibilityYears: ['3'],
    },
    { department: 'CSE', year: '3', cgpa: 8.0 }
  );

  assert.equal(eligible, true);
});

test('ineligible company remains viewable but returns a clear reason and cannot be applied to', () => {
  const company = {
    targetDepartment: ['All'],
    eligibilityCriteria: { branches: ['ECE', 'EEE', 'Mechanical'], cgpa: 9.0 },
    eligibilityYears: ['3rd year', '4th year'],
  };
  const student = { department: 'CSE', year: '4', cgpa: 8.5 };

  assert.equal(isStudentEligibleForPlacement(company, student), false);
  assert.equal(getPlacementEligibilityReason(company, student), 'Your branch is not eligible for this drive.');
});

test('student meeting branch/year but below minimum CGPA gets a CGPA reason', () => {
  const reason = getPlacementEligibilityReason(
    {
      targetDepartment: ['All'],
      eligibilityCriteria: { branches: ['CSE'], cgpa: 9.0 },
      eligibilityYears: ['4'],
    },
    { department: 'CSE', year: '4', cgpa: 8.5 }
  );

  assert.equal(reason, 'Minimum CGPA is 9.');
});

test('ordinal year formats match the student year value', () => {
  const eligible = isStudentEligibleForPlacement(
    {
      targetDepartment: ['All'],
      eligibilityCriteria: { branches: ['CSE'], cgpa: 8.0 },
      eligibilityYears: ['3rd year', '4th year'],
    },
    { department: 'CSE', year: '4', cgpa: 8.5 }
  );

  assert.equal(eligible, true);
});
