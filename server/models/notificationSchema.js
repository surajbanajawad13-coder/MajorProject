/**
 * CampusConnect - AI-Driven Campus Event & Placement Analytics Portal
 * ---------------------------------------------------------------------
 * Model: Notification
 * Purpose: In-app / email notification log for a learner (new event
 *          posted, new placement drive posted, application status
 *          change, AI recommendation ready, etc).
 *
 * Project by: Vikas (USN: 4CB23CS186)
 * ---------------------------------------------------------------------
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    // Recipient - references the Student collection (see studentSchema.js)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },

    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },

    type: {
      type: String,
      enum: [
        'event',
        'placement',
        'application_status',
        'recommendation',
        'system',
      ],
      default: 'system',
    },

    // Optional link back to the source document (Event / Company / Application)
    relatedModel: {
      type: String,
      enum: ['Event', 'Company', 'Application', null],
      default: null,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
