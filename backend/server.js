require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const projectRoutes = require('./routes/projectRoutes');
const likeRoutes = require('./routes/likeRoutes');
const commentRoutes = require('./routes/commentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/comments', commentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Ahmad Portfolio API is running', timestamp: new Date() });
});

// Catch-all → serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`📁 Serving frontend from: ../frontend`);
  console.log(`🔗 API endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/projects`);
  console.log(`   GET  /api/likes`);
  console.log(`   POST /api/likes`);
  console.log(`   GET  /api/comments`);
  console.log(`   POST /api/comments`);
  console.log(`   POST /api/comments/:id/like\n`);
});
