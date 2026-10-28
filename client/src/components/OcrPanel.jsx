/* OcrPanel.jsx — Displays extracted OCR fields with formatting and copy support */
import { useState } from 'react';

const FIELD_LABELS = {
  student:            { label: 'Student / Recipient', icon: '👤' },
  certificate_number: { label: 'Certificate Number',  icon: '🔢' },
  institute:          { label: 'Institution',          icon: '🏛️' },
  date:               { label: 'Issue Date',           icon: '📅' },
  course:             { label: 'Course / Degree',      icon: '🎓' },
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  if (!text || text === 'N/A' || text === 'Not detected') return null;
  return (
    <button
      className="field-copy-btn"
      title="Copy to clipboard"
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
    >
      {copied ? '✓' : '📋'}
    </button>
  );
}

export default function OcrPanel({ ocr = {} }) {
  return (
    <div className="glass ocr-panel">
      <p className="panel-title">
        <span className="panel-title-dot" style={{ background: 'var(--cyan)' }} />
        Extracted Information
      </p>
      <div className="ocr-fields">
        {Object.entries(FIELD_LABELS).map(([key, { label, icon }]) => {
          const value   = ocr[key];
          const isEmpty = !value || value === 'N/A';
          return (
            <div className="ocr-field" key={key} id={`ocr-${key}`}>
              <span className="ocr-key">{icon} {label}</span>
              <div className="ocr-value-row">
                <span className={`ocr-value${isEmpty ? ' not-available' : ''}`}>
                  {isEmpty ? 'Not detected' : value}
                </span>
                {key === 'certificate_number' && !isEmpty && (
                  <CopyButton text={value} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
