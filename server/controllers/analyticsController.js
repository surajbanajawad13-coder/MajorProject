/**
 * CampusConnect - AI-Driven Campus Event & Placement Analytics Portal
 * ---------------------------------------------------------------------
 * Controller: analyticsController.js
 * Purpose: Aggregation endpoints that power the Coordinator and
 *          Administrator dashboard charts (event participation,
 *          placement application funnel, platform-wide stats).
 *
 * Project by: Vikas (USN: 4CB23CS186)
 * ---------------------------------------------------------------------
 */

const Student = require('../models/studentSchema');
const Event = require('../models/eventSchema');
const Company = require('../models/companySchema');
const AnalyticsLog = require('../models/analyticsLogSchema');

// GET /api/analytics/events
// Registrations per event -> feeds a bar/line chart on the Coordinator dashboard.
exports.getEventParticipationStats = async (req, res) => {
  try {
    const events = await Event.find({}).select('title eventDate registeredStudents capacity');
    const data = events.map((e) => ({
      eventId: e._id,
      title: e.title,
      eventDate: e.eventDate,
      registrations: e.registeredStudents.length,
      capacity: e.capacity || null,
    }));
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/analytics/placements
// Applicant funnel per placement drive (Applied / Interviewing / Placed / Rejected)
exports.getPlacementApplicationStats = async (req, res) => {
  try {
    const companies = await Company.find({}).select('name jobRole');
    const students = await Student.find({}).select('appliedCompanies');

    const statusCounts = {}; // companyId -> { Applied, Interviewing, Placed, Rejected }
    for (const student of students) {
      for (const app of student.appliedCompanies) {
        const cid = app.companyId?.toString();
        if (!cid) continue;
        if (!statusCounts[cid]) {
          statusCounts[cid] = { Applied: 0, Interviewing: 0, Placed: 0, Rejected: 0 };
        }
        statusCounts[cid][app.status] = (statusCounts[cid][app.status] || 0) + 1;
      }
    }

    const data = companies.map((c) => ({
      companyId: c._id,
      name: c.name,
      jobRole: c.jobRole,
      statusCounts: statusCounts[c._id.toString()] || {
        Applied: 0,
        Interviewing: 0,
        Placed: 0,
        Rejected: 0,
      },
    }));

    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/analytics/overview
// Platform-wide counters for the Administrator dashboard.
exports.getPlatformOverview = async (req, res) => {
  try {
    const [totalStudents, totalEvents, totalCompanies, totalPlaced, roleBreakdown] =
      await Promise.all([
        Student.countDocuments({ role: 'Student' }),
        Event.countDocuments({}),
        Company.countDocuments({}),
        Student.countDocuments({ 'appliedCompanies.status': 'Placed' }),
        Student.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      ]);

    const departmentBreakdown = await Student.aggregate([
      { $match: { role: 'Student' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalEvents,
        totalCompanies,
        totalPlaced,
        roleBreakdown,
        departmentBreakdown,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/analytics/activity
// Recent platform activity feed (from AnalyticsLog) for the admin dashboard.
exports.getRecentActivity = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 25, 100);
    const logs = await AnalyticsLog.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('user', 'username usn');

    res.status(200).json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
