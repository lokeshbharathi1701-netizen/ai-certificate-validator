/* ResultCard.jsx — Full verdict display with confidence meter */
import { useEffect, useState } from 'react';
import BoxOverlay from './BoxOverlay';
import OcrPanel   from './OcrPanel';

export default function ResultCard({ result, imageFile, onReset }) {
  const isFake     = result.prediction === 'Fake';
  const confidence = result.confidence ?? 0;

  // Animate confidence bar after mount
  const [barWidth, setBarWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setBarWidth(confidence), 120);
    return () => clearTimeout(t);
  }, [confidence]);

  const imageUrl = imageFile ? URL.createObjectURL(imageFile) : null;
  const boxes    = result.boxes ?? [];

  return (
    <div className="result-section" id="result-section">

      {/* ── Verdict Banner ─────────────────────────────────────── */}
      <div className={`verdict-banner ${isFake ? 'fake' : 'genuine'}`} id="verdict-banner">
        <div className="verdict-left">
          <span className="verdict-icon">{isFake ? '⚠️' : '✅'}</span>
          <div>
            <p className="verdict-label">AI Verdict</p>
            <p className="verdict-text" id="verdict-text">
              {isFake ? 'FAKE' : 'GENUINE'}
            </p>
          </div>
        </div>

        <div className="verdict-right">
          <p className="confidence-label">Confidence</p>
          <p className="confidence-value" id="confidence-value">{confidence}%</p>
          <div className="confidence-bar-wrap">
            <div
              className="confidence-bar-fill"
              id="confidence-bar"
              style={{ width: `${barWidth}%` }}
            />
          </div>
          {result.model_used && (
            <span className="model-chip">🤖 {result.model_used}</span>
          )}
        </div>
      </div>

      {/* ── Image + OCR Grid ──────────────────────────────────── */}
      <div className="results-grid">
        {/* Certificate image with bounding boxes */}
        <div className="glass image-panel" id="image-panel">
          <p className="panel-title">
            <span className="panel-title-dot"></span>
            Certificate Image
            {boxes.length > 0 && (
              <span className="region-badge">
                ⚠ {boxes.length} region{boxes.length !== 1 ? 's' : ''} flagged
              </span>
            )}
          </p>
          {imageUrl ? (
            <BoxOverlay imageSrc={imageUrl} boxes={boxes} isFake={isFake} />
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Image preview unavailable
            </p>
          )}
          {boxes.length === 0 && !isFake && (
            <p className="region-count">
              ✅ No suspicious regions detected
            </p>
          )}
        </div>

        {/* OCR extracted fields */}
        <OcrPanel ocr={result.ocr ?? {}} />
      </div>

      {/* ── Summary ───────────────────────────────────────────── */}
      {result.summary && (
        <div className="glass summary-card" id="summary-card">
          <p className="panel-title">
            <span className="panel-title-dot" style={{ background: 'var(--yellow)' }}></span>
            Analysis Summary
          </p>
          <p className="summary-text">{result.summary}</p>
        </div>
      )}

      {/* ── Reset ─────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button
          id="reset-btn"
          className="reset-btn"
          onClick={onReset}
        >
          🔄 Analyse Another Certificate
        </button>
      </div>
    </div>
  );
}
