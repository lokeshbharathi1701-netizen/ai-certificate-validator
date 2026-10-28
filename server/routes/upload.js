/**
 * routes/upload.js — Certificate Upload & Analysis Route
 * ========================================================
 * Handles multipart image uploads from the React frontend,
 * forwards them to the Flask ML API for CNN+OCR analysis,
 * and returns the structured JSON result.
 *
 * Routes:
 *   POST /api/upload         — Analyze a certificate image
 *   GET  /api/health         — Proxy health check to Flask
 *   GET  /api/history        — Return history for a specific user
 *   DELETE /api/history      — Clear history for a specific user
 */

const express  = require('express');
const multer   = require('multer');
const axios    = require('axios');
const FormData = require('form-data');
const path     = require('path');

const router = express.Router();

// ── Flask ML API base URL ─────────────────────────────────────
const FLASK_URL = process.env.FLASK_URL || 'http://localhost:5000';

// ── Per-user history store: Map<userId, entry[]> ─────────────
//    Each user's uploads are kept separate so dashboards start
//    completely fresh on first login.
const userHistory = new Map();
const MAX_HISTORY = 50;

function getHistory(userId) {
  const key = userId || 'anonymous';
  if (!userHistory.has(key)) userHistory.set(key, []);
  return userHistory.get(key);
}

// ── Multer — In-memory storage (forward directly to Flask) ────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.bmp', '.webp', '.tiff', '.tif', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Allowed: ${allowed.join(', ')}`));
    }
  },
});


// ── POST /api/upload ──────────────────────────────────────────
router.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided. Use field name "image".' });
  }

  const filename  = req.file.originalname;
  const filesize  = req.file.size;
  const timestamp = new Date().toISOString();
  const certType  = req.body.cert_type || 'general';
  // userId sent by the client (user's email or id from sessionStorage)
  const userId    = req.body.userId || req.query.userId || 'anonymous';

  console.log(`\n📨  Upload: ${filename} (${(filesize / 1024).toFixed(1)} KB) | type: ${certType} | user: ${userId}`);

  // Build multipart form to forward to Flask
  const form = new FormData();
  form.append('image', req.file.buffer, { filename, contentType: req.file.mimetype });
  form.append('cert_type', certType);

  try {
    console.log(`🔁  Forwarding to Flask: ${FLASK_URL}/predict`);

    const flaskResponse = await axios.post(`${FLASK_URL}/predict`, form, {
      headers:          { ...form.getHeaders() },
      maxBodyLength:    Infinity,
      maxContentLength: Infinity,
      timeout:          300_000,  // 5 min — EasyOCR loads ~100 MB model on first call
    });

    const data = flaskResponse.data;
    console.log(`✅  Flask: ${data.prediction} (${data.confidence}%) in ${data.processing_time_ms ?? '?'}ms`);

    // Build & store history entry for this user
    const entry = {
      id:                 `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp,
      filename,
      filesize,
      cert_type:          certType,
      prediction:         data.prediction,
      confidence:         data.confidence,
      model_used:         data.model_used,
      student:            data.ocr?.student          ?? 'N/A',
      institute:          data.ocr?.institute         ?? 'N/A',
      course:             data.ocr?.course            ?? 'N/A',
      authenticity_score: data.verification?.authenticity_score ?? null,
      is_verified:        data.verification?.is_verified        ?? null,
      boxes:              data.boxes                  ?? [],
      summary:            data.summary                ?? '',
      preview_image:      data.preview_image          ?? null,
    };

    const hist = getHistory(userId);
    hist.unshift(entry);
    if (hist.length > MAX_HISTORY) hist.pop();

    return res.json({ success: true, filename, timestamp, id: entry.id, ...data });

  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      console.error('❌  Flask ML API unreachable at', FLASK_URL);
      return res.status(503).json({
        error: `Flask ML API is unavailable. Please ensure it is running at ${FLASK_URL}.`,
        code:  'FLASK_UNAVAILABLE',
      });
    }
    if (err.response) {
      console.error('❌  Flask error:', err.response.status, err.response.data);
      return res.status(err.response.status).json(err.response.data);
    }
    console.error('❌  Unexpected error:', err.message);
    return res.status(500).json({ error: `Upload processing failed: ${err.message}` });
  }
});


// ── GET /api/health ───────────────────────────────────────────
router.get('/health', async (_req, res) => {
  let flaskStatus  = 'unavailable';
  let flaskDetails = null;
  try {
    const resp   = await axios.get(`${FLASK_URL}/health`, { timeout: 5000 });
    flaskStatus  = 'ok';
    flaskDetails = resp.data;
  } catch { /* ignore */ }

  res.json({
    nodeServer: { status: 'ok', port: process.env.PORT || 3001 },
    flaskApi:   { status: flaskStatus, url: FLASK_URL, details: flaskDetails },
    timestamp:  new Date().toISOString(),
  });
});


// ── GET /api/history?userId=<id> ──────────────────────────────
router.get('/history', (req, res) => {
  const userId = req.query.userId || 'anonymous';
  const hist   = getHistory(userId);
  res.json({ history: hist, count: hist.length });
});


// ── DELETE /api/history?userId=<id> ──────────────────────────
router.delete('/history', (req, res) => {
  const userId = req.query.userId || req.body?.userId || 'anonymous';
  const hist   = getHistory(userId);
  hist.length  = 0;
  res.json({ message: 'History cleared.' });
});


module.exports = router;
