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
const Event = require('../models/eventTrainingSchema');
const Company = require('../models/companySchema');
const Resume = require('../models/resumeSchema');
const AnalyticsLog = require('../models/analyticsLogSchema');
const Notification = require('../models/notificationSchema');
const { analyzeStoredJobDescription } = require('../services/jobDescriptionAnalysis');
const { startOfToday, isRegistrationOpen, canStudentRegister } = require('../services/eventProgramWindow');

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
  const targetDepartments = event.eligibilityBranches?.length
    ? event.eligibilityBranches
    : (event.targetDepartment || []);
  return {
    _id: event._id,
    title: event.title,
    description: event.description,
    required_skills: event.requiredSkills || event.tags || [],
    domain: event.domain || event.category || '',
    category: event.category || '',
    eligibility_branch: targetDepartments.includes('All') ? [] : targetDepartments,
    eligibility_year: event.eligibilityYears || [],
    min_cgpa: event.minCgpa ?? null,
    required_certifications: event.requiredCertifications || [],
    domain_keywords: event.domainKeywords || [],
    type: event.type,
  };
}

/**
 * Maps a Company (placement drive) document to the shape the
 * recommender expects.
 */
function buildPlacementPayload(company) {
  const criteria = company.eligibilityCriteria || {};
  const eligibleBranches = criteria.branches || [];
  const requiredSkills = [...new Map(
    [...(company.requiredSkills || []), ...(company.jobDescriptionAnalysis?.requiredSkills || [])]
      .map(skill => [String(skill).trim().toLowerCase(), String(skill).trim()])
      .filter(([normalized]) => normalized)
  ).values()];
  return {
    _id: company._id,
    title: company.name,
    company_name: company.name,
    description: [
      company.description || '',
      company.jobDescriptionAnalysis?.extractedText || '',
      company.jobRole || '',
      company.domain || '',
      ...(company.requiredSkills || []),
    ].filter(Boolean).join(' '),
    required_skills: requiredSkills,
    preferred_skills: company.preferredSkills || [],
    domain: company.domain || '',
    category: company.jobRole || '',
    job_description_text: company.jobDescriptionAnalysis?.extractedText || '',
    domain_keywords: company.jobDescriptionAnalysis?.roleInterestKeywords || [],
    required_certifications: company.jobDescriptionAnalysis?.certifications || [],
    eligibility_branch: eligibleBranches.includes('All') ? [] : eligibleBranches,
    eligibility_year: company.eligibilityYears || [],
    min_cgpa: criteria.cgpa || null,
  };
}

async function analyzeLegacyJobDescriptions(companies) {
  return Promise.all(companies.map(async company => {
    if (!company.jobDescription?.url) {
      return { ...company, jobDescriptionAnalysisStatus: 'unavailable' };
    }

    try {
      const parsed = await analyzeStoredJobDescription(company);
      if (!parsed) {
        return {
          ...company,
          jobDescriptionAnalysisStatus: company.jobDescriptionAnalysis?.extractedText ? 'analyzed' : 'unavailable',
        };
      }

      const updated = {
        ...company,
        ...parsed,
        jobDescriptionAnalysisStatus: 'analyzed',
      };
      try {
        await Company.updateOne(
          { _id: company._id },
          { $set: { jobDescriptionAnalysis: parsed.jobDescriptionAnalysis, requiredSkills: parsed.requiredSkills } }
        );
      } catch (saveError) {
        console.error(`Unable to cache job description analysis for ${company._id}:`, saveError.message);
      }
      return updated;
    } catch (error) {
      console.error(`Job description analysis failed for ${company._id}:`, error.message);
      throw new Error(`Unable to refresh job description analysis for ${company.name}: ${error.message}`);
    }
  }));
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

    const [events, rawPlacements, latestResume] = await Promise.all([
      Event.find({ date: { $gt: new Date() } }).lean(),
      Company.find({ $or: [{ applicationDeadline: null }, { applicationDeadline: { $gte: new Date() } }] }).lean(),
      Resume.findOne({ user: userId }).sort({ uploadDate: -1 }).lean(),
    ]);
    const placements = await analyzeLegacyJobDescriptions(rawPlacements);

    const resumePayload = latestResume
      ? {
          parsed_skills: latestResume.parsedSkills || [],
          role_interest_keywords: latestResume.roleInterestKeywords || [],
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

exports.getMyStudentAnalysis = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const student = await Student.findOne({ _id: req.userId, role: 'Student' }).select('-password').lean();
    if (!student) return res.status(404).json({ success: false, message: 'Learner profile not found.' });

    const [events, rawPlacements, latestResume] = await Promise.all([
      Event.find({
        date: { $gte: startOfToday() },
        targetDepartment: { $in: ['All', student.department] },
      }).sort({ date: 1 }).lean(),
      Company.find({
        $or: [
          { applicationDeadline: null },
          { applicationDeadline: { $gte: new Date() } },
          { applicationDeadline: { $exists: false } },
        ],
      }).sort({ applicationDeadline: 1 }).lean(),
      Resume.findOne({ user: req.userId }).sort({ uploadDate: -1 }).lean(),
    ]);
    const placements = await analyzeLegacyJobDescriptions(rawPlacements);
    const resumePayload = latestResume
      ? {
          parsed_skills: latestResume.parsedSkills || [],
          role_interest_keywords: latestResume.roleInterestKeywords || [],
          parsed_projects: latestResume.parsedProjects || { titles: [], keywords: [] },
          certifications: latestResume.certifications || [],
        }
      : null;

    const { data } = await axios.post(`${AI_SERVICE_URL}/recommend`, {
      profile: buildProfilePayload(student),
      resume: resumePayload,
      events: events.map(buildEventPayload),
      placements: placements.map(buildPlacementPayload),
    }, { timeout: 15000 });

    const eventsById = new Map(events.map(event => [event._id.toString(), event]));
    const placementsById = new Map(placements.map(company => [company._id.toString(), company]));
    const studentResume = latestResume || null;
    const eventResults = (data.events || []).map(result => {
      const event = eventsById.get(String(result.opportunity_id));
      if (!event) return result;
      const registration = canStudentRegister(student, event, studentResume);
      return {
        ...result,
        description: event.description,
        date: event.date,
        category: event.category,
        type: event.type,
        targetDepartment: event.targetDepartment,
        registrationCount: event.registeredStudents?.length || 0,
        isRegistered: (event.registeredStudents || []).some(id => id.toString() === student._id.toString()),
        canRegister: registration.allowed,
        registrationReason: registration.reason,
      };
    });
    const placementResults = (data.placements || []).map(result => {
      const company = placementsById.get(String(result.opportunity_id));
      if (!company) return result;
      const criteria = company.eligibilityCriteria || {};
      const branches = (criteria.branches || []).filter(branch => branch.toLowerCase() !== 'all');
      const targetDepartments = company.targetDepartment || ['All'];
      const withinTargetDepartment = targetDepartments.includes('All') || targetDepartments.includes(student.department);
      const withinBranches = !branches.length || branches.includes(student.department);
      const withinYears = !company.eligibilityYears?.length || company.eligibilityYears.includes(String(student.year || ''));
      const meetsCgpa = student.cgpa >= Number(criteria.cgpa || 0);
      const canApply = withinTargetDepartment && withinBranches && withinYears && meetsCgpa;
      const reason = !withinTargetDepartment || !withinBranches
        ? 'Your department is not eligible.'
        : !withinYears
          ? 'Your year of study is not eligible.'
          : !meetsCgpa
            ? `Minimum CGPA is ${criteria.cgpa}.`
            : 'You meet the listed placement eligibility requirements.';
      return {
        ...result,
        description: company.jobDescriptionAnalysis?.extractedText || company.description || '',
        companyName: company.name,
        jobRole: company.jobRole,
        applicationDeadline: company.applicationDeadline,
        requiredSkills: buildPlacementPayload(company).required_skills,
        canApply,
        eligibilityReason: reason,
        jobDescriptionAnalyzed: company.jobDescriptionAnalysisStatus === 'analyzed',
      };
    });

    return res.json({
      success: true,
      data: {
        resume: latestResume ? {
          fileName: latestResume.fileName,
          skills: latestResume.parsedSkills || [],
          programmingLanguages: latestResume.programmingLanguages || [],
          tools: latestResume.tools || [],
          projects: latestResume.parsedProjects?.titles || [],
          projectKeywords: latestResume.parsedProjects?.keywords || [],
          certifications: latestResume.certifications || [],
          roleInterests: latestResume.roleInterestKeywords || [],
          education: latestResume.education || '',
          keywordScore: latestResume.keywordScore || 0,
          missingSkillFlags: latestResume.missingSkillFlags || [],
        } : null,
        profileSkills: student.skills || [],
        profileInterests: student.interests || [],
        events: eventResults,
        placements: placementResults,
      },
    });
  } catch (error) {
    console.error('Student AI analysis error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ success: false, message: 'AI recommendation service is unavailable. Please try again shortly.' });
    }
    return res.status(500).json({ success: false, message: 'Unable to generate your AI analysis.' });
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
  res.set('Cache-Control', 'no-store');
  try {
    const student = await Student.findById(req.userId).select('-password');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Learner profile not found' });
    }

    const rawPlacements = await Company.find({}).lean();
    const placements = await analyzeLegacyJobDescriptions(rawPlacements);

    const payload = {
      profile: buildProfilePayload(student),
      resume: null,
      events: [],
      placements: placements.map(buildPlacementPayload),
    };

    const { data } = await axios.post(`${AI_SERVICE_URL}/recommend`, payload, {
      timeout: 15000,
    });

    // Turn the array into a { companyId: { score, max_possible_points,
    // match_percentage, rank_label, breakdown } } map for card rendering.
    const scoreMap = {};
    const placementById = new Map(placements.map(placement => [placement._id.toString(), placement]));
    (data.placements || []).forEach((p) => {
      if (p.opportunity_id) {
        const placement = placementById.get(p.opportunity_id.toString());
        scoreMap[p.opportunity_id] = {
          score: p.score,
          max_possible_points: p.max_possible_points,
          match_percentage: p.match_percentage,
          rank_label: p.rank_label,
          breakdown: p.breakdown,
          job_description_analyzed: placement?.jobDescriptionAnalysisStatus === 'analyzed',
        };
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
    const path = require('path');
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fs.createReadStream(req.file.path), req.file.originalname);

    const { data } = await axios.post(`${AI_SERVICE_URL}/resume/upload`, form, {
      headers: form.getHeaders(),
      timeout: 20000,
    });

    const resumeUrl = `uploads/resumes/${path.basename(req.file.path)}`;
    const resumeDoc = await Resume.create({
      user: req.userId,
      fileName: req.file.originalname,
      filePath: resumeUrl,
      extractedText: data.extracted_text || '',
      parsedSkills: data.parsed_skills || [],
      programmingLanguages: data.programming_languages || [],
      tools: data.tools || [],
      roleInterestKeywords: data.role_interest_keywords || [],
      parsedProjects: data.parsed_projects || { titles: [], keywords: [] },
      certifications: data.certifications || [],
      education: data.education || '',
      keywordScore: data.keyword_score || 0,
      missingSkillFlags: data.missing_skill_flags || [],
    });

    const updatedStudent = await Student.findByIdAndUpdate(req.userId, {
      resumeUrl,
      resumeOriginalName: req.file.originalname,
    }, { new: true }).select('resumeUrl resumeOriginalName');

    if (!updatedStudent) {
      return res.status(404).json({ success: false, message: 'Learner profile not found.' });
    }

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

    const careerData = await require('./careerGuidanceController').getCareerData(req.userId);
    resumeDoc.missingSkillFlags = (careerData?.missingSkills || []).map(({ skill }) => skill);
    await resumeDoc.save();
    data.missing_skill_flags = resumeDoc.missingSkillFlags;

    return res.status(200).json({
      success: true,
      data: {
        ...data,
        resumeId: resumeDoc._id,
        resumeUrl: updatedStudent.resumeUrl,
        resumeOriginalName: updatedStudent.resumeOriginalName,
      },
    });
  } catch (error) {
    console.error('Resume Analyze Error:', error.message);
    if (error.response?.status === 422) {
      return res.status(422).json({
        success: false,
        message: error.response.data?.error || 'Resume could not be parsed.',
      });
    }
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'AI resume analysis service is unavailable. Please try again shortly.',
      });
    }
    return res.status(500).json({ success: false, message: 'Failed to analyze resume' });
  }
};
