const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

const normalizeSkills = (...lists) => [...new Map(
  lists.flat().filter(Boolean)
    .map(skill => [String(skill).trim().toLowerCase(), String(skill).trim()])
    .filter(([normalized]) => normalized)
).values()];

const analyzeJobDescriptionFile = async file => {
  const form = new FormData();
  form.append('file', fs.createReadStream(file.path), file.originalname);

  try {
    const { data } = await axios.post(`${AI_SERVICE_URL}/job-description/parse`, form, {
      headers: form.getHeaders(),
      timeout: 20000,
    });
    if (!data.extracted_text) {
      throw new Error('The job description could not be read. Upload a text-based PDF or DOCX.');
    }
    return {
      extractedText: data.extracted_text,
      requiredSkills: data.required_skills || [],
      programmingLanguages: data.programming_languages || [],
      tools: data.tools || [],
      roleInterestKeywords: data.role_interest_keywords || [],
      certifications: data.certifications || [],
      keywordScore: data.keyword_score || 0,
    };
  } catch (error) {
    const message = error.response?.data?.error || error.message;
    const parseError = new Error(`Job description analysis failed: ${message}`);
    parseError.status = error.response?.status || (error.code === 'ECONNREFUSED' ? 503 : 422);
    throw parseError;
  }
};

const analyzeStoredJobDescription = async company => {
  const url = company.jobDescription?.url || '';
  const pathname = /^https?:\/\//i.test(url) ? new URL(url).pathname : url;
  const match = pathname.replace(/\\/g, '/').match(/^\/?uploads\/resumes\/([^/]+)$/i);
  if (!match) return null;

  const filename = path.basename(match[1]);
  const uploadRoot = process.env.UPLOAD_DIR || path.resolve(__dirname, '..', 'uploads');
  const filePath = path.resolve(uploadRoot, 'resumes', filename);
  if (!['.pdf', '.docx'].includes(path.extname(filename).toLowerCase())) return null;
  if (!fs.existsSync(filePath)) {
    throw new Error(`Stored job description file not found: ${filename}`);
  }

  const jobDescriptionAnalysis = await analyzeJobDescriptionFile({
    path: filePath,
    originalname: company.jobDescription.filename || filename,
  });
  return {
    jobDescriptionAnalysis,
    requiredSkills: normalizeSkills(company.requiredSkills || [], jobDescriptionAnalysis.requiredSkills),
  };
};

module.exports = {
  analyzeJobDescriptionFile,
  analyzeStoredJobDescription,
  normalizeSkills,
};
