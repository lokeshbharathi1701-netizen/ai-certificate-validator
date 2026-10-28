/* CertTypeSelector.jsx — Government certificate type chooser */

const CERT_TYPES = [
  {
    id:          'obc',
    label:       'OBC Certificate',
    icon:        '🏛️',
    color:       '#f59e0b',
    colorLight:  'rgba(245,158,11,0.12)',
    colorBorder: 'rgba(245,158,11,0.35)',
    description: 'Other Backward Class caste certificate issued by state government',
    fields:      ['Applicant Name', "Father's Name", 'Caste', 'District', 'Issuing Authority', 'Issue Date'],
  },
  {
    id:          'income',
    label:       'Income Certificate',
    icon:        '💰',
    color:       '#10b981',
    colorLight:  'rgba(16,185,129,0.12)',
    colorBorder: 'rgba(16,185,129,0.35)',
    description: 'Annual family income certificate for government schemes and scholarships',
    fields:      ['Applicant Name', 'Annual Income', 'Financial Year', 'Source of Income', 'Issuing Authority'],
  },
  {
    id:          'marksheet',
    label:       'Mark Sheet',
    icon:        '📋',
    color:       '#8b5cf6',
    colorLight:  'rgba(139,92,246,0.12)',
    colorBorder: 'rgba(139,92,246,0.35)',
    description: 'Board/University mark sheet issued by a recognized examination authority',
    fields:      ['Student Name', 'Roll Number', 'Board/University', 'Examination', 'Total Marks', 'Result'],
  },
  {
    id:          'general',
    label:       'General Certificate',
    icon:        '📄',
    color:       '#22d3ee',
    colorLight:  'rgba(34,211,238,0.12)',
    colorBorder: 'rgba(34,211,238,0.35)',
    description: 'Any other government or institutional certificate for general verification',
    fields:      ['Recipient Name', 'Certificate No.', 'Institution', 'Issue Date', 'Course'],
  },
];

export { CERT_TYPES };

export default function CertTypeSelector({ selected, onSelect }) {
  return (
    <div className="cert-type-section">
      <div className="cert-type-header">
        <span className="panel-title-dot" style={{ background: 'var(--yellow)' }} />
        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Select Certificate Type</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: 8 }}>
          — Enables targeted government document verification
        </span>
      </div>
      <div className="cert-type-grid">
        {CERT_TYPES.map(ct => {
          const isSelected = selected === ct.id;
          return (
            <button
              key={ct.id}
              id={`cert-type-${ct.id}`}
              className={`cert-type-card${isSelected ? ' selected' : ''}`}
              style={{
                '--ct-color':        ct.color,
                '--ct-color-light':  ct.colorLight,
                '--ct-color-border': ct.colorBorder,
              }}
              onClick={() => onSelect(ct.id)}
              aria-pressed={isSelected}
              title={ct.description}
            >
              <span className="ct-icon">{ct.icon}</span>
              <span className="ct-label">{ct.label}</span>
              {isSelected && <span className="ct-check">✓</span>}
            </button>
          );
        })}
      </div>
      {selected && (() => {
        const ct = CERT_TYPES.find(c => c.id === selected);
        if (!ct) return null;
        return (
          <div
            className="cert-type-info"
            style={{
              borderColor: ct.colorBorder,
              background:  ct.colorLight,
            }}
          >
            <span className="ct-info-icon">{ct.icon}</span>
            <div>
              <p className="ct-info-title" style={{ color: ct.color }}>{ct.label} — Verification Checks</p>
              <p className="ct-info-desc">{ct.description}</p>
              <div className="ct-field-tags">
                {ct.fields.map(f => (
                  <span key={f} className="ct-field-tag" style={{ borderColor: ct.colorBorder, color: ct.color }}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
