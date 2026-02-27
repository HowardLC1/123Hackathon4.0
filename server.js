const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const connectDB = require('./db');
require('dotenv').config(); // Load environment variables

const app = express();

// 🔌 Connect to MongoDB
connectDB();

// 📁 Ensure uploads directory exists
fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });

// 🔧 Middleware
const corsOptions = {
  origin: '*', // ✅ Change to specific origin (e.g., https://yourfrontend.com) in production
  methods: 'GET,POST,PUT,PATCH,DELETE',
  credentials: true
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 🗂 Serve static frontend + uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname)));

// 🔐 API routes
const authRoutes = require('./routes/auth');
const complaintsRouter = require('./routes/complaints');
const assistantRouter = require('./routes/assistant');
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintsRouter);
app.use('/api/assistant', assistantRouter);

// ❌ 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// 🚀 Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server is running on port ${PORT}`));

// 🧹 Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Gracefully shutting down...');
  mongoose.connection.close(() => {
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  });
});
