const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const path = require('path');
const Complaint = require('../models/Complaint');
const router = express.Router();

// === Category to Agency and Department Routing Maps ===
const categoryToAgency = {
  Health: 'Health Department',
  Education: 'Education Department',
  Sport: 'Ministry of Sport',
  Sanitation: 'City Sanitation Authority',
  Transport: 'Department of Public Transport'
};

const categoryToDepartment = {
  Health: 'Healthcare Division',
  Education: 'Academic Affairs',
  Sport: 'Sports Administration',
  Sanitation: 'Waste Management Division',
  Transport: 'Transport and Infrastructure'
};

// === Multer Storage Configuration ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(4).toString('hex');
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// === POST /api/complaints ===
router.post('/', upload.single('attachment'), async (req, res) => {
  const { fullName, email, phone, location, category, title, description } = req.body;

  const complaint = new Complaint({
    ticketId: 'TKT' + Date.now() + '-' + Math.floor(Math.random() * 10000),
    fullName,
    email,
    phone,
    location,
    category,
    agency: categoryToAgency[category] || 'General',
    department: categoryToDepartment[category] || 'General Affairs',
    title,
    description,
    attachment: req.file ? `/uploads/${req.file.filename}` : null,
    status: 'Pending',
    submittedAt: new Date()
  });

  try {
    const savedComplaint = await complaint.save();
    res.status(201).json({
      message: 'Complaint submitted successfully',
      ticketId: savedComplaint.ticketId
    });
  } catch (error) {
    console.error('Error saving complaint:', error);
    res.status(500).json({ message: 'Error saving complaint' });
  }
});

// === GET /api/complaints/status/:ticketId ===
router.get('/status/:ticketId', async (req, res) => {
  const ticketId = req.params.ticketId;
  try {
    const complaint = await Complaint.findOne({ ticketId });
    if (!complaint) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.json({
      ticketId: complaint.ticketId,
      status: complaint.status,
      submittedAt: complaint.submittedAt,
      category: complaint.category,
      agency: complaint.agency,
      department: complaint.department,
      responseNote: complaint.responseNote || null
    });
  } catch (error) {
    console.error('Error fetching complaint:', error);
    res.status(500).json({ message: 'Error fetching complaint' });
  }
});

// === PATCH /api/complaints/status/:ticketId ===
router.patch('/status/:ticketId', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // Optional: check for institution or adminId
    if (!decoded.adminId || !decoded.institution) {
      return res.status(403).json({ message: 'Forbidden: Invalid token' });
    }

    const ticketId = req.params.ticketId;
    const { status, responseNote } = req.body;

    const complaint = await Complaint.findOne({ ticketId });
    if (!complaint) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    complaint.status = status;
    if (responseNote) {
      complaint.responseNote = responseNote;
    }

    await complaint.save();

    res.json({
      message: 'Complaint status updated successfully',
      ticketId: complaint.ticketId,
      status: complaint.status,
      responseNote: complaint.responseNote
    });
  } catch (error) {
    console.error('Error updating complaint status:', error);
    res.status(500).json({ message: 'Error updating complaint status' });
  }
});

// === PATCH /api/complaints/response/:ticketId ===
// Backwards-compatible endpoint for admin.html (response note only).
router.patch('/response/:ticketId', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(403).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    if (!decoded.adminId || !decoded.institution) {
      return res.status(403).json({ message: 'Forbidden: Invalid token' });
    }

    const ticketId = req.params.ticketId;
    const { responseNote } = req.body;
    if (!responseNote || !String(responseNote).trim()) {
      return res.status(400).json({ message: 'responseNote is required' });
    }

    const complaint = await Complaint.findOne({ ticketId });
    if (!complaint) return res.status(404).json({ message: 'Ticket not found' });

    complaint.responseNote = String(responseNote).trim();
    await complaint.save();

    res.json({
      message: 'Response note updated successfully',
      ticketId: complaint.ticketId,
      responseNote: complaint.responseNote
    });
  } catch (error) {
    console.error('Error updating response note:', error);
    res.status(500).json({ message: 'Error updating response note' });
  }
});


router.get('/dashboard', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret'); // Use the same secret key as during login
    if (!decoded.institution) {
      return res.status(403).json({ message: 'Invalid token' });
    }

    const complaints = await Complaint.find({ category: decoded.institution }).sort({ submittedAt: -1 });
    res.json(complaints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
});

router.get('/all', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(403).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    const institution = decoded.institution;

    if (!institution) return res.status(403).json({ message: 'Forbidden' });

    const complaints = await Complaint.find({ category: institution }).sort({ submittedAt: -1 });
    res.json(complaints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching complaints' });
  }
});


module.exports = router;
