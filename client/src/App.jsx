/**
 * App.jsx — Root Application Component
 * ======================================
 * Manages the three states of the app:
 *   idle     → UploadZone (waiting for file)
 *   loading  → LoadingSpinner (analysis in progress)
 *   result   → ResultCard (verdict + details)
 *   error    → Error card
 */

import { useState, useCallback } from 'react';
import Header        from './components/Header';
import UploadZone    from './components/UploadZone';
import LoadingSpinner from './components/LoadingSpinner';
import ResultCard    from './components/ResultCard';

// API endpoint — Vite proxy will forward /api → Node.js :3001
const API_URL = '/api/upload';

export default function App() {
  const [file,   setFile]   = useState(null);
  const [state,  setState]  = useState('idle');   // idle | loading | result | error
  const [result, setResult] = useState(null);
  const [errMsg, setErrMsg] = useState('');

  // ── Upload + Analyse ─────────────────────────────────────────
  const handleAnalyse = useCallback(async () => {
    if (!file) return;

    setState('loading');
    setResult(null);
    setErrMsg('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body:   formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      setResult(data);
      setState('result');
    } catch (err) {
      console.error('Analysis failed:', err);
      setErrMsg(
        err.message.includes('fetch')
          ? 'Cannot connect to the server. Make sure the Node.js and Flask services are running.'
          : err.message
      );
      setState('error');
    }
  }, [file]);

  // ── Reset ─────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setFile(null);
    setResult(null);
    setErrMsg('');
    setState('idle');
  }, []);

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="app">
      <div className="app-content">
        <Header />

        {/* Upload zone — always visible when not in result state */}
        {state !== 'result' && (
          <UploadZone
            onFileSelect={setFile}
            file={file}
            onAnalyse={handleAnalyse}
            loading={state === 'loading'}
          />
        )}

        {/* Loading spinner */}
        {state === 'loading' && <LoadingSpinner />}

        {/* Error */}
        {state === 'error' && (
          <div className="error-card" style={{ marginTop: 24 }} id="error-card">
            <div className="error-icon">❌</div>
            <p className="error-title">Analysis Failed</p>
            <p className="error-msg">{errMsg}</p>
            <button
              className="reset-btn"
              style={{ marginTop: 16 }}
              onClick={handleReset}
              id="error-retry-btn"
            >
              ↩ Try Again
            </button>
          </div>
        )}

        {/* Results */}
        {state === 'result' && result && (
          <ResultCard
            result={result}
            imageFile={file}
            onReset={handleReset}
          />
        )}

        <footer className="footer">
          <p>
            Powered by YOLOv8 &amp; EasyOCR · Built for Ideathon 2026
          </p>
        </footer>
      </div>
    </div>
  );
}
