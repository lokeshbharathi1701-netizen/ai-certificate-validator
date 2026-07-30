/**
 * routes/upload.js — Certificate Upload & Analysis Route
 * ========================================================
 * Handles multipart image uploads from the React frontend,
 * forwards them to the Flask ML API for YOLO+OCR analysis,
 * and returns the structured JSON result.
 *
 * Routes:
 *   POST /api/upload  — Analyze a certificate image
 *   GET  /api/health  — Proxy health check to Flask
 */

const express  = require('express');
const multer   = require('multer');
const axios    = require('axios');
const FormData = require('form-data');
const path     = require('path');
const fs       = require('fs');

const router = express.Router();

// ── Flask ML API base URL ─────────────────────────────────────
const FLASK_URL = process.env.FLASK_URL || 'http://localhost:5000';

// ── Multer — In-memory storage (forward directly to Flask) ────
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.bmp', '.webp', '.tiff', '.tif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Allowed: ${allowed.join(', ')}`));
    }
  },
});


// ── POST /api/upload ──────────────────────────────────────────
/**
 * Analyze a certificate image for forgery.
 *
 * Request:  multipart/form-data   field: "image"
 * Response: { prediction, confidence, boxes, ocr, summary, model_used }
 */
router.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided. Use field name "image".' });
  }

  console.log(`\n📨  Received upload: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);

  // Build multipart form to forward to Flask
  const form = new FormData();
  form.append('image', req.file.buffer, {
    filename:    req.file.originalname,
    contentType: req.file.mimetype,
  });

  try {
    console.log(`🔁  Forwarding to Flask: ${FLASK_URL}/predict`);

    const flaskResponse = await axios.post(`${FLASK_URL}/predict`, form, {
      headers:          { ...form.getHeaders() },
      maxBodyLength:    Infinity,
      maxContentLength: Infinity,
      // 5 min — EasyOCR downloads & loads a ~100 MB model on first request;
      // subsequent requests are fast (model stays cached in Flask process)
      timeout:          300_000,
    });

    console.log(`✅  Flask responded: ${flaskResponse.data.prediction} (${flaskResponse.data.confidence}%)`);

    return res.json({
      success: true,
      ...flaskResponse.data,
    });

  } catch (err) {
    // Flask not running or returned an error
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      console.error('❌  Flask ML API is not running at', FLASK_URL);
      return res.status(503).json({
        error: `Flask ML API is unavailable. Please ensure it is running at ${FLASK_URL}.`,
        code:  'FLASK_UNAVAILABLE',
      });
    }

    if (err.response) {
      // Flask returned an HTTP error
      console.error('❌  Flask error:', err.response.status, err.response.data);
      return res.status(err.response.status).json(err.response.data);
    }

    console.error('❌  Unexpected error:', err.message);
    return res.status(500).json({ error: `Upload processing failed: ${err.message}` });
  }
});


// ── GET /api/health ───────────────────────────────────────────
/**
 * Proxy health check — reports status of both Node and Flask.
 */
router.get('/health', async (req, res) => {
  let flaskStatus = 'unreachable';
  let flaskDetails = null;

  try {
    const resp = await axios.get(`${FLASK_URL}/health`, { timeout: 5000 });
    flaskStatus  = 'ok';
    flaskDetails = resp.data;
  } catch {
    flaskStatus = 'unavailable';
  }

  res.json({
    nodeServer: { status: 'ok', port: process.env.PORT || 3001 },
    flaskApi:   { status: flaskStatus, url: FLASK_URL, details: flaskDetails },
    timestamp:  new Date().toISOString(),
  });
});


module.exports = router;
