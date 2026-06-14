require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const projectRoutes = require('./routes/projectRoutes');
const likeRoutes    = require('./routes/likeRoutes');
const commentRoutes = require('./routes/commentRoutes');
const contactRoutes = require('./routes/contactRoutes');

const app  = express();
const PORT = process.env.PORT || 5000;

// CORS — Cloudflare Pages frontend allow karo
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5500'
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // No origin = same-origin / curl / Render health check
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/likes',    likeRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/contact',  contactRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Ahmad Portfolio API is running',
    timestamp: new Date()
  });
});

// Root
app.get('/', (req, res) => {
  res.json({ message: 'Ahmad Portfolio API — use /api/health to check status' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health\n`);
});
