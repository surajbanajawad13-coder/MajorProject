/**
 * CampusConnect - AI-Driven Campus Event & Placement Analytics Portal
 * ---------------------------------------------------------------------
 * Controller: recommendationController.js
 * Purpose: Gathers a learner's profile + resume data from MongoDB,
 *          sends it to the Python AI microservice's strict-scoring
 *          recommendation engine (see ai/recommender.py), and returns
 *          the ranked events + placements to the frontend.
 *
 * Project by: Vikas (USN: 4CB23CS186)
 * ---------------------------------------------------------------------
 */

const axios = require('axios');

const Student = require('../models/studentSchema');
const Event = require('../models/eventSchema');
const Company = require('../models/companySchema');
const Resume = require('../models/resumeSchema');
const AnalyticsLog = require('../models/analyticsLogSchema');
const Notification = require('../models/notificationSchema');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

/**
 * Maps a Student document (this project's "profile" source of truth)
 * into the flat profile shape expected by the Python recommender.
 */
function buildProfilePayload(student) {
  return {
    skills: student.skills || [],
    interests: student.interests || [],
    department: student.department || '',
    year: student.year || '',
    cgpa: student.cgpa || 0,
    certifications: student.certifications || [],
    projects: student.projects || [],
  };
}

/**
 * Maps an Event document to the shape the recommender expects.
 */
function buildEventPayload(event) {
  return {
    _id: event._id,
    title: event.title,
    description: event.description,
    required_skills: event.tags || event.required_skills || [],
    domain: event.domain || '',
    category: event.category || '',
    eligibility_branch: event.eligibility_branch || [],
    eligibility_year: event.eligibility_year || [],
    min_cgpa: event.min_cgpa || null,
  };
}

/**
 * Maps a Company (placement drive) document to the shape the
 * recommender expects.
 */
function buildPlacementPayload(company) {
  const criteria = company.eligibilityCriteria || {};
  return {
    _id: company._id,
    title: company.name,
    company_name: company.name,
    description: company.jobRole || '',
    required_skills: company.required_skills || [],
    domain: company.domain || '',
    category: company.category || '',
    eligibility_branch: criteria.branches || [],
    eligibility_year: [],
    min_cgpa: criteria.cgpa || null,
  };
}

// Exported so other controllers (e.g. placementController's email
// broadcast) can reuse the exact same payload shape the AI service
// expects, instead of re-implementing this mapping.
exports.buildProfilePayload = buildProfilePayload;
exports.buildPlacementPayload = buildPlacementPayload;
exports.AI_SERVICE_URL = AI_SERVICE_URL;

/**
 * GET /api/recommendations/:userId
 *
 * Pulls the learner's profile, all upcoming events, and all open
 * placement drives, sends them to the AI microservice, and returns
 * the ranked + labelled ("highly recommended" / "recommended" /
 * "low priority") list back to the client.
 */
exports.getRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;

    const student = await Student.findById(userId).select('-password');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Learner profile not found' });
    }

    const [events, placements, latestResume] = await Promise.all([
      Event.find({}).lean(),
      Company.find({}).lean(),
      Resume.findOne({ user: userId }).sort({ uploadDate: -1 }).lean(),
    ]);

    const resumePayload = latestResume
      ? {
          parsed_skills: latestResume.parsedSkills || [],
          parsed_projects: latestResume.parsedProjects || { titles: [], keywords: [] },
          certifications: latestResume.certifications || [],
        }
      : null;

    const payload = {
      profile: buildProfilePayload(student),
      resume: resumePayload,
      events: events.map(buildEventPayload),
      placements: placements.map(buildPlacementPayload),
    };

    const { data } = await axios.post(`${AI_SERVICE_URL}/recommend`, payload, {
      timeout: 15000,
    });

    // Fire-and-forget analytics log; failure here should never block the response.
    AnalyticsLog.create({
      user: student._id,
      action: 'recommendation_generated',
      metadata: {
        eventCount: data.events?.length || 0,
        placementCount: data.placements?.length || 0,
      },
    }).catch((err) => console.error('AnalyticsLog write failed:', err.message));

    return res.status(200).json({
      success: true,
      data: {
        events: data.events || [],
        placements: data.placements || [],
        combined: data.combined || [],
      },
    });
  } catch (error) {
    console.error('Recommendation Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'AI recommendation service is unavailable. Please try again shortly.',
      });
    }
    return res.status(500).json({ success: false, message: 'Failed to generate recommendations' });
  }
};

/**
 * GET /api/placements/match-scores
 * (mounted under placementRoutes, handled here to reuse the payload
 * builders above)
 *
 * Returns a match score for the LOGGED-IN student against every
 * placement drive, so the frontend can show "Match: 82% — highly
 * recommended" on each company card before/while applying. Uses the
 * exact same scoring rubric as the full recommendation engine, just
 * scoped to placements only and returned as a lookup map for quick
 * lookup by companyId.
 */
exports.getMyPlacementMatchScores = async (req, res) => {
  try {
    const student = await Student.findById(req.userId).select('-password');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Learner profile not found' });
    }

    const [placements, latestResume] = await Promise.all([
      Company.find({}).lean(),
      Resume.findOne({ user: req.userId }).sort({ uploadDate: -1 }).lean(),
    ]);

    const resumePayload = latestResume
      ? {
          parsed_skills: latestResume.parsedSkills || [],
          parsed_projects: latestResume.parsedProjects || { titles: [], keywords: [] },
          certifications: latestResume.certifications || [],
        }
      : null;

    const payload = {
      profile: buildProfilePayload(student),
      resume: resumePayload,
      events: [],
      placements: placements.map(buildPlacementPayload),
    };

    const { data } = await axios.post(`${AI_SERVICE_URL}/recommend`, payload, {
      timeout: 15000,
    });

    // Turn the array into a { companyId: { score, rank_label } } map so
    // the frontend can look up a card's score in O(1) while rendering.
    const scoreMap = {};
    (data.placements || []).forEach((p) => {
      if (p.opportunity_id) {
        scoreMap[p.opportunity_id] = { score: p.score, rank_label: p.rank_label };
      }
    });

    return res.status(200).json({ success: true, data: scoreMap });
  } catch (error) {
    console.error('Placement Match Score Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'AI recommendation service is unavailable. Please try again shortly.',
      });
    }
    return res.status(500).json({ success: false, message: 'Failed to compute match scores' });
  }
};
exports.analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No resume file uploaded' });
    }

    const fs = require('fs');
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fs.createReadStream(req.file.path), req.file.originalname);

    const { data } = await axios.post(`${AI_SERVICE_URL}/resume/upload`, form, {
      headers: form.getHeaders(),
      timeout: 20000,
    });

    const resumeDoc = await Resume.create({
      user: req.userId,
      fileName: req.file.originalname,
      filePath: req.file.path,
      extractedText: data.extracted_text || '',
      parsedSkills: data.parsed_skills || [],
      programmingLanguages: data.programming_languages || [],
      tools: data.tools || [],
      parsedProjects: data.parsed_projects || { titles: [], keywords: [] },
      certifications: data.certifications || [],
    });

    await Student.findByIdAndUpdate(req.userId, {
      resumeUrl: req.file.path,
      resumeOriginalName: req.file.originalname,
    });

    await AnalyticsLog.create({
      user: req.userId,
      action: 'resume_analyzed',
      targetModel: 'Resume',
      targetId: resumeDoc._id,
      metadata: { skillsFound: data.parsed_skills?.length || 0 },
    });

    await Notification.create({
      user: req.userId,
      title: 'Resume analyzed',
      message: `We found ${data.parsed_skills?.length || 0} skills in your resume. Check your recommendations!`,
      type: 'recommendation',
    });

    return res.status(200).json({ success: true, data: { ...data, resumeId: resumeDoc._id } });
  } catch (error) {
    console.error('Resume Analyze Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'AI resume analysis service is unavailable. Please try again shortly.',
      });
    }
    return res.status(500).json({ success: false, message: 'Failed to analyze resume' });
  }
};
