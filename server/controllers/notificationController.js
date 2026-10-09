/**
 * CampusConnect - AI-Driven Campus Event & Placement Analytics Portal
 * ---------------------------------------------------------------------
 * Controller: notificationController.js
 * Project by: Vikas (USN: 4CB23CS186)
 * ---------------------------------------------------------------------
 */

const Notification = require('../models/notificationSchema');
const Student = require('../models/studentSchema');

// GET /api/notifications  (current user's notifications, newest first)
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.params.userId || req.userId;
    if (req.role === 'Student' && userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only view your own notifications.' });
    }
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.status(200).json({ success: true, data: notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMyNotifications = exports.getNotifications;

// PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.status(200).json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.userId, isRead: false }, { isRead: true });
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.sendNotification = async (req, res) => {
  try {
    const { title, message, department = 'All', type = 'system' } = req.body;
    if (typeof title !== 'string' || !title.trim() || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Title and message are required.' });
    }
    if (!['event', 'placement', 'application_status', 'recommendation', 'system'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Choose a valid notification type.' });
    }

    const filter = { role: 'Student' };
    if (department !== 'All') filter.department = department;
    const recipients = await Student.find(filter).select('_id');
    if (!recipients.length) return res.status(404).json({ success: false, message: 'No learners match this audience.' });

    const notifications = await Notification.insertMany(recipients.map(({ _id }) => ({
      user: _id,
      title: title.trim(),
      message: message.trim(),
      type,
    })));
    return res.status(201).json({ success: true, sent: notifications.length });
  } catch (err) {
    console.error('Send notification error:', err.message);
    return res.status(500).json({ success: false, message: 'Unable to send notification.' });
  }
};
