/* LoadingSpinner.jsx — Analysis progress indicator */
import { useState, useEffect } from 'react';

const STEPS = [
  { label: 'Uploading certificate image…', duration: 600 },
  { label: 'Running YOLO object detection…', duration: 1800 },
  { label: 'Extracting text with EasyOCR…', duration: 1500 },
  { label: 'Building analysis report…', duration: 800 },
];

export default function LoadingSpinner() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    let elapsed = 0;
    const timers = STEPS.map((step, i) => {
      const t = setTimeout(() => setActiveStep(i + 1), elapsed + step.duration);
      elapsed += step.duration;
      return t;
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="spinner-container glass">
      <div className="spinner-ring"></div>
      <p className="spinner-label">Analysing certificate…</p>
      <div className="spinner-steps">
        {STEPS.map((step, i) => (
          <div
            key={i}
            className={`step-item ${
              i < activeStep ? 'done' : i === activeStep ? 'active' : ''
            }`}
          >
            <span className="step-dot"></span>
            {i < activeStep ? '✓ ' : ''}{step.label}
          </div>
        ))}
      </div>
      <p style={{
        fontSize: '0.72rem',
        color: 'var(--text-muted)',
        textAlign: 'center',
        maxWidth: 260,
        lineHeight: 1.5,
        marginTop: 4,
      }}>
        ⏳ First analysis may take 1–3 min while the OCR model loads.
        Subsequent uploads will be instant.
      </p>
    </div>
  );
}
