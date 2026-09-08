/**
 * CampusConnect - AI-Driven Campus Event & Placement Analytics Portal
 * ---------------------------------------------------------------------
 * Model: AnalyticsLog
 * Purpose: Lightweight event-tracking log used to power the
 *          Coordinator/Administrator analytics dashboards (event
 *          participation trends, placement application trends,
 *          resume upload activity, recommendation click-through, etc).
 *
 * Each document is a single tracked action - keep writes cheap and
 * avoid heavy joins here; aggregate on read instead.
 *
 * Project by: Vikas (USN: 4CB23CS186)
 * ---------------------------------------------------------------------
 */

const mongoose = require('mongoose');

const analyticsLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      default: null, // null for anonymous/system-level events
    },

    action: {
      type: String,
      required: true,
      enum: [
        'event_view',
        'event_register',
        'placement_view',
        'placement_apply',
        'resume_upload',
        'resume_analyzed',
        'recommendation_generated',
        'recommendation_clicked',
        'login',
        'signup',
      ],
      index: true,
    },

    // Free-form context (e.g. { eventId, matchScore }) kept schema-less
    // on purpose since analytics payloads vary a lot by action type.
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Convenience denormalized fields for fast dashboard aggregation
    // without needing to look inside `metadata` every time.
    targetModel: {
      type: String,
      enum: ['Event', 'Company', 'Resume', null],
      default: null,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  { timestamps: true }
);

analyticsLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AnalyticsLog', analyticsLogSchema);
