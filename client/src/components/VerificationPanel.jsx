/* VerificationPanel.jsx — Government certificate type-specific verification display */
import { useState } from 'react';

const STATUS_META = {
  pass: { icon: '✅', label: 'Passed',  cls: 'check-pass' },
  warn: { icon: '⚠️', label: 'Warning', cls: 'check-warn' },
  fail: { icon: '❌', label: 'Failed',  cls: 'check-fail' },
};

// Human-readable label map for field keys
const FIELD_LABELS = {
  // OBC
  applicant_name:    '👤 Applicant Name',
  fathers_name:      '👨 Father\'s Name',
  caste:             '🏷️ Caste',
  sub_caste:         '🏷️ Sub-Caste',
  state:             '🗺️ State',
  district:          '📍 District',
  issuing_authority: '🏛️ Issuing Authority',
  issue_date:        '📅 Issue Date',
  certificate_no:    '🔢 Certificate No.',
  validity:          '⏳ Validity',
  // Income
  annual_income:     '💰 Annual Income',
  income_source:     '💼 Income Source',
  financial_year:    '📆 Financial Year',
  validity_period:   '⏳ Validity Period',
  // Marksheet
  student_name:      '👤 Student Name',
  roll_number:       '🔢 Roll Number',
  registration_no:   '📋 Registration No.',
  board_university:  '🏛️ Board / University',
  examination:       '📖 Examination',
  exam_year:         '📆 Exam Year',
  total_marks:       '📊 Total Marks',
  percentage_grade:  '📈 Percentage / Grade',
  result:            '🎯 Result',
  // General
  recipient_name:    '👤 Recipient Name',
  certificate_number:'🔢 Certificate No.',
  institution:       '🏛️ Institution',
  course:            '🎓 Course',
};

function AuthenticityGauge({ score, isVerified }) {
  const color = isVerified
    ? score >= 80 ? '#10b981' : '#f59e0b'
    : '#ef4444';

  const r  = 36;
  const cx = 48;
  const cy = 48;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="auth-gauge-wrapper">
      <svg viewBox="0 0 96 96" className="auth-gauge-svg" aria-hidden="true">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)',
            transformOrigin: 'center',
            transform: 'rotate(-90deg)',
          }}
        />
        <text x={cx} y={cy - 4}  textAnchor="middle" fill={color}               fontSize="14" fontWeight="800">{score}%</text>
        <text x={cx} y={cy + 11} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="6.5" fontWeight="600" letterSpacing="0.8">AUTH</text>
      </svg>
      <div className="auth-gauge-label" style={{ color }}>
        {isVerified ? '✅ Verified' : '❌ Not Verified'}
      </div>
    </div>
  );
}

export default function VerificationPanel({ verification }) {
  const [showAll, setShowAll] = useState(false);

  if (!verification) return null;

  const {
    cert_type_label,
    fields = {},
    checks = [],
    authenticity_score,
    verdict_reason,
    is_verified,
    check_summary = {},
  } = verification;

  const visibleChecks = showAll ? checks : checks.slice(0, 5);

  // Filter out N/A fields for display
  const fieldEntries = Object.entries(fields).filter(([, v]) => v && v !== 'N/A');

  return (
    <div className="verification-panel glass" id="verification-panel">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="vp-header">
        <div>
          <p className="panel-title" style={{ marginBottom: 4 }}>
            <span className="panel-title-dot" style={{ background: '#f59e0b' }} />
            Government Certificate Verification
          </p>
          <p className="vp-type-label">{cert_type_label}</p>
        </div>
        <AuthenticityGauge score={authenticity_score} isVerified={is_verified} />
      </div>

      {/* ── Score summary bar ────────────────────────────────── */}
      <div className="vp-score-row">
        <span className="vp-score-pill pass">✅ {check_summary.passed} Passed</span>
        {check_summary.warned > 0 && (
          <span className="vp-score-pill warn">⚠️ {check_summary.warned} Warning</span>
        )}
        {check_summary.failed > 0 && (
          <span className="vp-score-pill fail">❌ {check_summary.failed} Failed</span>
        )}
      </div>

      {/* ── Verdict reason ───────────────────────────────────── */}
      <p className="vp-verdict" style={{ color: is_verified ? 'var(--green)' : authenticity_score >= 40 ? 'var(--yellow)' : 'var(--red)' }}>
        {verdict_reason}
      </p>

      {/* ── Extracted fields ─────────────────────────────────── */}
      {fieldEntries.length > 0 && (
        <div className="vp-fields-section">
          <p className="vp-section-title">Extracted Fields</p>
          <div className="vp-fields-grid">
            {fieldEntries.map(([key, value]) => (
              <div key={key} className="vp-field-item">
                <span className="vp-field-key">{FIELD_LABELS[key] || key.replace(/_/g, ' ')}</span>
                <span className="vp-field-value">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Verification checks ──────────────────────────────── */}
      <div className="vp-checks-section">
        <p className="vp-section-title">Verification Checks</p>
        <div className="vp-checks-list">
          {visibleChecks.map((check, i) => {
            const meta = STATUS_META[check.status] || STATUS_META.warn;
            return (
              <div key={i} className={`vp-check-item ${meta.cls}`}>
                <span className="vp-check-icon">{meta.icon}</span>
                <div className="vp-check-text">
                  <span className="vp-check-label">{check.label}</span>
                  <span className="vp-check-detail">{check.detail}</span>
                </div>
              </div>
            );
          })}
        </div>
        {checks.length > 5 && (
          <button
            className="vp-toggle-btn"
            onClick={() => setShowAll(v => !v)}
            id="vp-toggle-checks"
          >
            {showAll ? '▲ Show fewer checks' : `▼ Show all ${checks.length} checks`}
          </button>
        )}
      </div>
    </div>
  );
}
