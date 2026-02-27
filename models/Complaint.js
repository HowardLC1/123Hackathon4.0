const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  ticketId: { type: String, index: true },
  fullName: String,
  email: String,
  phone: String,
  location: String,
  category: { type: String, index: true },
  agency: String,
  department: String,
  title: String,
  description: String,
  attachment: String,
  status: { type: String, default: 'Pending', index: true },
  responseNote: String,
  submittedAt: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('Complaint', complaintSchema);
