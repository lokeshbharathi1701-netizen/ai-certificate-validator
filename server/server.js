/**
 * server.js — Express Application Entry Point
 * =============================================
 * Starts the Node.js/Express backend server.
 *
 * Responsibilities:
 *   • Apply middleware (CORS, JSON body parser, static files)
 *   • Mount API routes under /api
 *   • Act as a proxy between React frontend and Flask ML API
 *
 * Usage:
 *   node server.js         (production)
 *   npm run dev            (development, with nodemon)
 *
 * Environment Variables (see .env.example):
 *   PORT      — Server port (default: 3001)
 *   FLASK_URL — Flask API base URL (default: http://localhost:5000)
 */

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const uploadRoutes = require('./routes/upload');
const authRoutes   = require('./routes/auth');
const adminRoutes  = require('./routes/admin');

// ── Create Express app ────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3001;

// ── Ensure uploads directory exists ──────────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ── CORS ──────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',     // Vite dev server
    'http://localhost:5174',
    'http://localhost:4173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ],
  methods:      ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body Parsers ──────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── Static Files ──────────────────────────────────────────────
app.use('/uploads', express.static(uploadsDir));

// ── Routes ────────────────────────────────────────────────────
app.use('/api', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Root info endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🟢 AI Certificate Detection — Node.js Backend',
    version: '1.0.0',
    port:    PORT,
    endpoints: {
      health:  'GET  /health',
      upload:  'POST /api/upload',
      history: 'GET  /api/history',
    },
  });
});

// Server health check
app.get('/health', (req, res) => {
  res.json({
    status:    'ok',
    service:   'Node.js Backend',
    port:      PORT,
    flaskUrl:  process.env.FLASK_URL || 'http://localhost:5000',
    timestamp: new Date().toISOString(),
  });
});

// ── Global Error Handler ──────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('❌  Unhandled error:', err.message);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum allowed size is 10 MB.' });
  }

  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// ── Start Server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n🟢  Node.js server started');
  console.log(`   URL      : http://localhost:${PORT}`);
  console.log(`   Flask    : ${process.env.FLASK_URL || 'http://localhost:5000'}`);
  console.log(`   Uploads  : ${uploadsDir}`);
  console.log('   Routes   : POST /api/upload | GET /api/health | GET /api/history\n');
});
