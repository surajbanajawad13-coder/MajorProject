/**
 * CampusConnect - AI-Driven Campus Event & Placement Analytics Portal
 * ---------------------------------------------------------------------
 * Controller: adminController.js
 * Purpose: User management (list/search/update-role/deactivate/delete)
 *          for the Administrator dashboard. Global analytics live in
 *          analyticsController.js and are reused here where relevant.
 *
 * Project by: Vikas (USN: 4CB23CS186)
 * ---------------------------------------------------------------------
 */

const Student = require('../models/studentSchema');
const Event = require('../models/eventSchema');
const Company = require('../models/companySchema');

// GET /api/admin/users?role=&department=&search=
exports.getAllUsers = async (req, res) => {
  try {
    const { role, department, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (department) filter.department = department;
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { usn: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await Student.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: users, count: users.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/admin/users/:id
exports.getUserById = async (req, res) => {
  try {
    const user = await Student.findById(req.params.id)
      .select('-password')
      .populate('registeredEvents')
      .populate('appliedCompanies.companyId');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/admin/users/:id/role
// Body: { role: 'Student' | 'Society Admin' | 'Placement Officer' | 'Admin' }
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['Student', 'Society Admin', 'Placement Officer', 'Admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const updated = await Student.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const deleted = await Student.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/admin/summary
// Quick combined snapshot for the top of the Administrator dashboard.
exports.getAdminSummary = async (req, res) => {
  try {
    const [totalUsers, totalStudents, totalCoordinators, totalTPOs, totalEvents, totalCompanies] =
      await Promise.all([
        Student.countDocuments({}),
        Student.countDocuments({ role: 'Student' }),
        Student.countDocuments({ role: 'Society Admin' }),
        Student.countDocuments({ role: 'Placement Officer' }),
        Event.countDocuments({}),
        Company.countDocuments({}),
      ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalStudents,
        totalCoordinators,
        totalTPOs,
        totalEvents,
        totalCompanies,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
