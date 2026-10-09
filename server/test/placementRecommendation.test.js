const test = require('node:test');
const assert = require('node:assert/strict');
const {
  analyzeLegacyJobDescriptions,
  buildPlacementPayload,
} = require('../controllers/recommendationController');

test('placement recommendation payload includes extracted JD requirements and context', () => {
  const payload = buildPlacementPayload({
    _id: 'drive-1',
    name: 'Example Co',
    jobRole: 'Web Developer',
    preferredSkills: ['typescript'],
    description: 'Build customer-facing tools.',
    domain: '',
    requiredSkills: ['python'],
    jobDescriptionAnalysis: {
      extractedText: 'Develop web apps with Python and React.',
      requiredSkills: ['python', 'react'],
      roleInterestKeywords: ['web development'],
    },
    eligibilityCriteria: { cgpa: 7.5, branches: ['CSE'] },
    eligibilityYears: ['3'],
  });

  assert.deepEqual(payload.required_skills, ['python', 'react']);
  assert.deepEqual(payload.preferred_skills, ['typescript']);
  assert.ok(payload.description.includes('Develop web apps with Python and React.'));
  assert.deepEqual(payload.domain_keywords, ['web development']);
  assert.deepEqual(payload.eligibility_branch, ['CSE']);
  assert.deepEqual(payload.eligibility_year, ['3']);
  assert.equal(payload.min_cgpa, 7.5);
  assert.ok(payload.job_description_text.includes('Develop web apps with Python and React.'));
});

test('placement recommendation uses the stored company eligibility instead of defaults', () => {
  const payload = buildPlacementPayload({
    _id: 'tech-mahindra',
    name: 'TECH MAHINDRA',
    jobRole: 'Cloud/DevOps Engineer',
    domain: 'Cloud Infrastructure',
    requiredSkills: ['AWS', 'Docker', 'Kubernetes', 'Linux'],
    eligibilityCriteria: { cgpa: 9.0, branches: ['ECE', 'EEE', 'Mechanical'] },
    eligibilityYears: ['3rd year', '4th year'],
    jobDescriptionAnalysis: {
      extractedText: 'Cloud Deployment with Docker and Kubernetes. AWS or Azure certification.',
      requiredSkills: ['AWS', 'Docker', 'Kubernetes', 'Linux'],
      roleInterestKeywords: ['DevOps'],
      certifications: ['AWS', 'Azure'],
    },
  });

  assert.equal(payload.min_cgpa, 9);
  assert.deepEqual(payload.eligibility_branch, ['ECE', 'EEE', 'Mechanical']);
  assert.deepEqual(payload.eligibility_year, ['3rd year', '4th year']);
  assert.deepEqual(payload.required_skills, ['AWS', 'Docker', 'Kubernetes', 'Linux']);
  assert.deepEqual(payload.required_certifications, ['AWS', 'Azure']);
  assert.ok(payload.job_description_text.includes('Cloud Deployment'));
});

test('legacy missing JD files do not prevent recommendations from using saved company criteria', async () => {
  const [company] = await analyzeLegacyJobDescriptions([{
    _id: 'legacy-company',
    name: 'Legacy Company',
    description: 'Backend engineering role',
    domain: 'Software Engineering',
    requiredSkills: ['Node.js'],
    eligibilityCriteria: { cgpa: 7.5, branches: ['CSE'] },
    jobDescription: { url: '/uploads/resumes/__missing_legacy_jd_test__.pdf' },
  }]);

  assert.equal(company.jobDescriptionAnalysisStatus, 'unavailable');
  assert.deepEqual(buildPlacementPayload(company).required_skills, ['Node.js']);
  assert.deepEqual(buildPlacementPayload(company).eligibility_branch, ['CSE']);
  assert.equal(buildPlacementPayload(company).min_cgpa, 7.5);
});

test('cached JD analysis is kept without requiring its original upload file', async () => {
  const cachedAnalysis = {
    extractedText: 'Build cloud infrastructure.',
    requiredSkills: ['AWS'],
    roleInterestKeywords: ['Cloud Computing'],
  };
  const [company] = await analyzeLegacyJobDescriptions([{
    _id: 'cached-company',
    name: 'Cached Company',
    requiredSkills: ['Terraform'],
    jobDescription: { url: '/uploads/resumes/__missing_cached_jd_test__.pdf' },
    jobDescriptionAnalysis: cachedAnalysis,
  }]);

  assert.equal(company.jobDescriptionAnalysisStatus, 'analyzed');
  assert.equal(company.jobDescriptionAnalysis, cachedAnalysis);
});
