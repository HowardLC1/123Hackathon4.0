const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password_hash: String,
  institution: { type: String, enum: ['Health', 'Education', 'Sport'] },
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
