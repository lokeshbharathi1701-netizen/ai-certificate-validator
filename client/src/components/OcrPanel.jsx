/* OcrPanel.jsx — Displays extracted OCR fields */

const FIELD_LABELS = {
  student:            { label: 'Student / Recipient', icon: '👤' },
  certificate_number: { label: 'Certificate Number',  icon: '🔢' },
  institute:          { label: 'Institution',          icon: '🏛️' },
  date:               { label: 'Issue Date',           icon: '📅' },
  course:             { label: 'Course / Degree',      icon: '🎓' },
};

export default function OcrPanel({ ocr = {} }) {
  return (
    <div className="glass ocr-panel">
      <p className="panel-title">
        <span className="panel-title-dot" style={{ background: 'var(--cyan)' }}></span>
        Extracted Information
      </p>
      <div className="ocr-fields">
        {Object.entries(FIELD_LABELS).map(([key, { label, icon }]) => {
          const value = ocr[key];
          const isEmpty = !value || value === 'N/A';
          return (
            <div className="ocr-field" key={key} id={`ocr-${key}`}>
              <span className="ocr-key">{icon} {label}</span>
              <span className={`ocr-value${isEmpty ? ' not-available' : ''}`}>
                {isEmpty ? 'Not detected' : value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
