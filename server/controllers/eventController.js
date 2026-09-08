/**
 * CampusConnect - AI-Driven Campus Event & Placement Analytics Portal
 * ---------------------------------------------------------------------
 * Controller: eventController.js
 * Purpose: Full CRUD for technical events, plus a lightweight
 *          registration endpoint used by learners.
 *
 * Project by: Vikas (USN: 4CB23CS186)
 * ---------------------------------------------------------------------
 */

const Event = require('../models/eventSchema');
const Student = require('../models/studentSchema');
const AnalyticsLog = require('../models/analyticsLogSchema');
const Notification = require('../models/notificationSchema');

// GET /api/events  (public list, supports optional ?category= filter)
exports.getAllEvents = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;

    const events = await Event.find(filter)
      .populate('organizer', 'name category')
      .sort({ eventDate: 1 });

    res.status(200).json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/events/:id
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name category');
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    AnalyticsLog.create({
      user: req.userId || null,
      action: 'event_view',
      targetModel: 'Event',
      targetId: event._id,
    }).catch(() => {});

    res.status(200).json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/events  (Coordinator / Society Admin only)
exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      organizer,
      tags,
      eventDate,
      venue,
      registrationLink,
      capacity,
    } = req.body;

    if (!title || !description || !organizer || !eventDate || !venue) {
      return res.status(400).json({
        success: false,
        message: 'title, description, organizer, eventDate, and venue are required',
      });
    }

    const newEvent = await Event.create({
      title,
      description,
      organizer,
      tags: Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map((t) => t.trim()) : []),
      eventDate,
      venue,
      registrationLink,
      capacity,
    });

    res.status(201).json({ success: true, data: newEvent });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/events/:id  (Coordinator / Society Admin only)
exports.updateEvent = async (req, res) => {
  try {
    const updateFields = { ...req.body };
    if (updateFields.tags && typeof updateFields.tags === 'string') {
      updateFields.tags = updateFields.tags.split(',').map((t) => t.trim());
    }

    const updated = await Event.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/events/:id  (Coordinator / Society Admin only)
exports.deleteEvent = async (req, res) => {
  try {
    const deleted = await Event.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/events/:id/register  (Student only)
exports.registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const alreadyRegistered = event.registeredStudents.some(
      (id) => id.toString() === req.userId.toString()
    );
    if (alreadyRegistered) {
      return res.status(400).json({ success: false, message: 'Already registered for this event' });
    }
    if (event.capacity && event.registeredStudents.length >= event.capacity) {
      return res.status(400).json({ success: false, message: 'Event is at full capacity' });
    }

    event.registeredStudents.push(req.userId);
    await event.save();

    await Student.findByIdAndUpdate(req.userId, {
      $addToSet: { registeredEvents: event._id },
    });

    AnalyticsLog.create({
      user: req.userId,
      action: 'event_register',
      targetModel: 'Event',
      targetId: event._id,
    }).catch(() => {});

    Notification.create({
      user: req.userId,
      title: 'Event registration confirmed',
      message: `You're registered for "${event.title}" on ${new Date(event.eventDate).toDateString()}.`,
      type: 'event',
      relatedModel: 'Event',
      relatedId: event._id,
    }).catch(() => {});

    res.status(200).json({ success: true, message: 'Successfully registered for event' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/events/:id/participation  (Coordinator/Admin analytics)
exports.getEventParticipation = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      'registeredStudents',
      'username usn department cgpa'
    );
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.status(200).json({
      success: true,
      data: {
        eventId: event._id,
        title: event.title,
        totalRegistrations: event.registeredStudents.length,
        capacity: event.capacity || null,
        students: event.registeredStudents,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
