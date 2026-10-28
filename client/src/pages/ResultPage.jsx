import { Link, useLocation, useNavigate } from 'react-router-dom';
import ResultCard from '../components/ResultCard';

const DEMO_FALLBACK_RESULT = {
  id: 'demo-sample-01',
  timestamp: new Date().toISOString(),
  filename: 'OBC_Certificate_Candidate_Sample.jpg',
  cert_type: 'obc',
  prediction: 'Genuine',
  confidence: 94.2,
  model_used: 'Custom Deep CNN (TamperNet) + EasyOCR',
  ocr: {
    student: 'Aarav Patel',
    institute: 'Revenue Department, Govt of Gujarat',
    course: 'Other Backward Class (NCL) Certificate',
    issue_date: '14/08/2024',
    cert_number: 'OBC/2024/78291A',
    raw_text: 'GOVERNMENT OF GUJARAT\nOFFICE OF THE MAMLATDAR\nCERTIFICATE OF OTHER BACKWARD CLASSES\nThis is to certify that Shri Aarav Patel son of Shri Ramesh Patel belongs to OBC community which is recognized as a Backward Class under Government Resolution. It is certified that he does not belong to Creamy Layer.',
  },
  verification: {
    authenticity_score: 96,
    is_verified: true,
    check_summary: { passed: 6, failed: 0, total: 6 },
    checks: [
      { id: 'seal_check', label: 'Government Seal Verification', status: 'pass', detail: 'Official Mamlatdar round seal detected with 96% match.' },
      { id: 'creamy_clause', label: 'Non-Creamy Layer Clause', status: 'pass', detail: 'Statutory non-creamy layer disclaimer text verified.' },
      { id: 'tamper_pixel', label: 'CNN Pixel Tamper Analysis', status: 'pass', detail: 'Zero splice boundaries or font inconsistencies detected.' },
      { id: 'sig_check', label: 'Authorized Signatory', status: 'pass', detail: 'Valid sub-divisional magistrate signature localized.' },
      { id: 'resolution_no', label: 'Govt Resolution Reference', status: 'pass', detail: 'Standard gazette notification number confirmed.' },
      { id: 'date_validity', label: 'Date Format & Expiry Check', status: 'pass', detail: 'Issued 14/08/2024, valid for current academic cycle.' },
    ],
  },
  explanation: '✅ The certificate appears to be GENUINE with 94.2% confidence. Official emblem, Mamlatdar seal, and non-creamy layer clauses match authorized state templates. No suspicious pixel edits detected.',
  boxes: [
    { label: 'Govt Seal', confidence: 0.96, x1: 45, y1: 80, x2: 145, y2: 180 },
    { label: 'Authorized Signature', confidence: 0.92, x1: 320, y1: 440, x2: 480, y2: 520 },
    { label: 'Certificate No', confidence: 0.89, x1: 50, y1: 195, x2: 260, y2: 225 },
  ],
};

export default function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const savedResult = location.state?.result ?? (() => {
    try {
      const stored = sessionStorage.getItem('certverify_last_result');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const resultToRender = savedResult || DEMO_FALLBACK_RESULT;
  const isDemo = !savedResult;

  return (
    <div className="page-shell result-shell">
      {/* Top Breadcrumb & Actions Bar */}
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button id="result-back-upload-btn" className="ghost-btn" onClick={() => navigate('/upload')}>
            ← Upload Another
          </button>
          <button id="result-goto-dash-btn" className="ghost-btn" onClick={() => navigate('/dashboard')}>
            📊 Dashboard
          </button>
          <button id="result-goto-history-btn" className="ghost-btn" onClick={() => navigate('/history')}>
            📜 History
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            id="result-print-btn"
            className="ghost-btn"
            onClick={() => window.print()}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            🖨️ Print / Save PDF
          </button>
        </div>
      </div>

      {isDemo && (
        <div
          style={{
            padding: '12px 18px',
            marginBottom: 20,
            borderRadius: 12,
            background: 'rgba(34,211,238,0.1)',
            border: '1px solid rgba(34,211,238,0.25)',
            fontSize: '0.86rem',
            color: 'var(--cyan)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>ℹ️ Showing sample verification report. Upload a custom document anytime.</span>
          <button className="primary-btn small-btn" onClick={() => navigate('/upload')}>
            Upload Certificate
          </button>
        </div>
      )}

      <ResultCard
        result={resultToRender}
        imageFile={null}
        onReset={() => navigate('/upload')}
      />
    </div>
  );
}
