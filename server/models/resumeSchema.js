/**
 * CampusConnect - AI-Driven Campus Event & Placement Analytics Portal
 * ---------------------------------------------------------------------
 * Model: Resume
 * Purpose: Persists every resume a learner uploads, along with the
 *          structured data extracted by the Python AI microservice
 *          (ai/resume_parser.py). A student may upload more than once;
 *          the most recent document is treated as "current" by the
 *          recommendation engine.
 *
 * Project by: Vikas (USN: 4CB23CS186)
 * ---------------------------------------------------------------------
 */

const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },

    fileName: { type: String, required: true },
    filePath: { type: String, required: true }, // path on disk / uploads URL

    extractedText: { type: String, default: '' },

    // ── Structured fields produced by ai/resume_parser.py ──
    parsedSkills: [{ type: String }],
    programmingLanguages: [{ type: String }],
    tools: [{ type: String }],
    parsedProjects: {
      titles: [{ type: String }],
      keywords: [{ type: String }],
    },
    certifications: [{ type: String }],

    uploadDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

resumeSchema.index({ user: 1, uploadDate: -1 });

module.exports = mongoose.model('Resume', resumeSchema);
