const mongoose = require('mongoose');
const Student = require('../models/studentSchema');
const Resume = require('../models/resumeSchema');
const EventTraining = require('../models/eventTrainingSchema');
const Company = require('../models/companySchema');
const {
  normalize,
  buildSkillGap,
  summarizeResumeSections,
  buildCareerSuggestions,
} = require('../services/careerGuidance');

const getCareerData = async userId => {
  const [student, resume] = await Promise.all([
    Student.findById(userId).select('-password').lean(),
    Resume.findOne({ user: userId }).sort({ uploadDate: -1 }).lean(),
  ]);

  if (!student) return null;

  const [events, placements] = await Promise.all([
    EventTraining.find({ date: { $gt: new Date() } }).select('title type requiredSkills').lean(),
    Company.find({
      $or: [
        { applicationDeadline: null },
        { applicationDeadline: { $gte: new Date() } },
        { applicationDeadline: { $exists: false } },
      ],
    }).select('name jobRole requiredSkills jobDescriptionAnalysis.requiredSkills').lean(),
  ]);

  const resumeSkills = normalize(resume?.parsedSkills);
  const profileSkills = normalize(student.skills);
  const knownSkills = new Set([
    ...profileSkills,
    ...resumeSkills,
    ...normalize(student.certifications),
    ...normalize((student.projects || []).flatMap(project => project.keywords || [])),
  ]);
  const missingSkills = buildSkillGap(
    [...events, ...placements].map(opportunity => [
      ...(opportunity.requiredSkills || []),
      ...(opportunity.jobDescriptionAnalysis?.requiredSkills || []),
    ]),
    [...knownSkills]
  );
  const resumeSummary = summarizeResumeSections(resume?.extractedText);

  return {
    student,
    resume,
    missingSkills,
    resumeSections: resumeSummary.sections,
    missingSections: resumeSummary.missingSections,
    resumeScore: resumeSummary.score,
    opportunities: {
      events: events.length,
      placements: placements.length,
    },
  };
};

const getUserId = (req, res) => {
  const requestedId = req.params.userId || req.userId;
  if (!mongoose.Types.ObjectId.isValid(requestedId)) {
    res.status(400).json({ success: false, message: 'A valid learner ID is required.' });
    return null;
  }
  if (req.role === 'Student' && requestedId.toString() !== req.userId.toString()) {
    res.status(403).json({ success: false, message: 'You can only view your own career guidance.' });
    return null;
  }
  return requestedId;
};

exports.getCareerGuidance = async (req, res) => {
  const userId = getUserId(req, res);
  if (!userId) return;

  try {
    const data = await getCareerData(userId);
    if (!data) return res.status(404).json({ success: false, message: 'Learner profile not found.' });

    const suggestions = buildCareerSuggestions({
      resume: data.resume,
      missingSections: data.missingSections,
      missingSkills: data.missingSkills,
      student: data.student,
    });

    return res.json({
      success: true,
      data: {
        resumeScore: data.resumeScore,
        resumeSections: data.resumeSections,
        missingSections: data.missingSections,
        matchedSkills: [...new Set([
          ...normalize(data.student.skills),
          ...normalize(data.resume?.parsedSkills),
          ...normalize(data.student.certifications),
          ...normalize((data.student.projects || []).flatMap(project => project.keywords || [])),
        ])].sort(),
        missingSkills: data.missingSkills,
        suggestions,
        opportunities: data.opportunities,
      },
    });
  } catch (error) {
    console.error('Career guidance error:', error.message);
    return res.status(500).json({ success: false, message: 'Unable to generate career guidance.' });
  }
};

exports.getSkillGap = async (req, res) => {
  const userId = getUserId(req, res);
  if (!userId) return;

  try {
    const data = await getCareerData(userId);
    if (!data) return res.status(404).json({ success: false, message: 'Learner profile not found.' });
    return res.json({
      success: true,
      data: {
        department: data.student.department,
        knownSkills: [...new Set([
          ...normalize(data.student.skills),
          ...normalize(data.resume?.parsedSkills),
          ...normalize(data.student.certifications),
          ...normalize((data.student.projects || []).flatMap(project => project.keywords || [])),
        ])].sort(),
        missingSkills: data.missingSkills,
        opportunities: data.opportunities,
      },
    });
  } catch (error) {
    console.error('Skill gap error:', error.message);
    return res.status(500).json({ success: false, message: 'Unable to calculate the skill gap.' });
  }
};

exports.getCareerData = getCareerData;
