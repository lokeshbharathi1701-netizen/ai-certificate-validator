/* LoadingSpinner.jsx — Animated loading state during analysis */
import { useState, useEffect } from 'react';

const STEPS = [
  { id: 'upload',    label: 'Uploading certificate...',           duration: 800  },
  { id: 'cnn',       label: 'Running Deep CNN tamper scan...',     duration: 2000 },
  { id: 'ocr',       label: 'Extracting text with OCR...',        duration: 3000 },
  { id: 'analyzing', label: 'Analyzing results...',               duration: 800  },
];

export default function LoadingSpinner() {
  const [activeStep, setActiveStep] = useState(0);
  const [elapsed,    setElapsed]    = useState(0);
  const [showSlowWarn, setShowSlowWarn] = useState(false);

  useEffect(() => {
    // Step progression
    let step = 0;
    const advance = () => {
      step++;
      if (step < STEPS.length) {
        setActiveStep(step);
        setTimeout(advance, STEPS[step].duration);
      }
    };
    const first = setTimeout(advance, STEPS[0].duration);
    return () => clearTimeout(first);
  }, []);

  // Elapsed timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(s => {
        if (s + 1 >= 8) setShowSlowWarn(true);
        return s + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="spinner-container glass" id="loading-spinner">
      <div className="spinner-ring" />

      <div className="spinner-label">
        Analysing Certificate...
        <span className="elapsed-timer"> {elapsed}s</span>
      </div>

      <div className="spinner-steps">
        {STEPS.map((step, idx) => {
          const isDone   = idx < activeStep;
          const isActive = idx === activeStep;
          return (
            <div
              key={step.id}
              className={`step-item${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}
              id={`step-${step.id}`}
            >
              <span className="step-dot" />
              <span>{step.label}</span>
              {isDone && <span className="step-check">✓</span>}
            </div>
          );
        })}
      </div>

      {showSlowWarn && (
        <div className="slow-warn" id="slow-warn">
          ℹ️ First-time OCR model load can take <strong>1–3 minutes</strong> as it downloads
          the EasyOCR model (~100 MB). Subsequent analyses will be much faster.
        </div>
      )}
    </div>
  );
}
