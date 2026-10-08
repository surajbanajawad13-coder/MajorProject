const mongoose = require('mongoose');

const broadcastSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  message: { type: String, required: true },
  department: { type: String, default: 'All' },
  createdAt: { type: Date, default: Date.now, expires: '23d' } // Automatically deletes/expires after 23 days
});

module.exports = mongoose.model('Broadcast', broadcastSchema);