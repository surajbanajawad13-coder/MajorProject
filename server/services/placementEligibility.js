const buildStudentPlacementQuery = (student, now = new Date()) => ({
  $and: [
    {
      $or: [
        { targetDepartment: 'All' },
        { targetDepartment: student.department },
        { targetDepartment: { $exists: false } },
        { targetDepartment: { $size: 0 } },
      ],
    },
    {
      $or: [
        { applicationDeadline: null },
        { applicationDeadline: { $gte: now } },
      ],
    },
  ],
});

const normalizeYear = value => {
  const normalized = String(value || '').trim().toLowerCase();
  const year = normalized.match(/\b([1-4])(?:st|nd|rd|th)?(?:\s*year)?\b/);
  if (year) return year[1];
  const wordYear = normalized.match(/\b(first|second|third|fourth)(?:\s+year)?\b/);
  return wordYear
    ? { first: '1', second: '2', third: '3', fourth: '4' }[wordYear[1]]
    : normalized;
};

const getPlacementEligibilityReason = (company, student, now = new Date()) => {
  const targetDepartments = company.targetDepartment || [];
  const withinTargetDepartment = !targetDepartments.length
    || targetDepartments.includes('All')
    || targetDepartments.includes(student.department);
  const branches = company.eligibilityCriteria?.branches || [];
  const withinBranches = !branches.length
    || branches.includes('All')
    || branches.includes(student.department);
  const years = company.eligibilityYears || [];
  const studentYear = normalizeYear(student.year);
  const withinYears = !years.length || years.some(year => normalizeYear(year) === studentYear);
  const meetsCgpa = Number(student.cgpa || 0) >= Number(company.eligibilityCriteria?.cgpa || 0);
  const beforeDeadline = !company.applicationDeadline || company.applicationDeadline >= now;

  if (!withinTargetDepartment) return 'This drive is not targeted to your department.';
  if (!withinBranches) return 'Your branch is not eligible for this drive.';
  if (!withinYears) return 'Your year of study is not eligible for this drive.';
  if (!meetsCgpa) return `Minimum CGPA is ${company.eligibilityCriteria?.cgpa}.`;
  if (!beforeDeadline) return 'The application deadline has passed.';
  return '';
};

const isStudentEligibleForPlacement = (company, student, now = new Date()) =>
  !getPlacementEligibilityReason(company, student, now);

module.exports = {
  buildStudentPlacementQuery,
  getPlacementEligibilityReason,
  isStudentEligibleForPlacement,
};
