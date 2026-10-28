import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadZone from '../components/UploadZone';
import LoadingSpinner from '../components/LoadingSpinner';
import CertTypeSelector from '../components/CertTypeSelector';
import ServiceStatus from '../components/ServiceStatus';

const SESSION_KEY = 'certverify_history';
const LAST_RESULT_KEY = 'certverify_last_result';

export default function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [certType, setCertType] = useState('obc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Inspection pass toggles
  const [runCnn, setRunCnn] = useState(true);
  const [runYolo, setRunYolo] = useState(true);
  const [runOcr, setRunOcr] = useState(true);

  const handleAnalyse = useCallback(async () => {
    if (!file) return;

    setLoading(true);
    setError('');

    // Get the logged-in user's id/email to scope history
    let userId = 'anonymous';
    try {
      const u = JSON.parse(sessionStorage.getItem('certverify_user') || '{}');
      userId = u.id || u.email || 'anonymous';
    } catch { /* ignore */ }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('cert_type', certType);
    formData.append('userId', userId);
    formData.append('enable_cnn', runCnn);
    formData.append('enable_yolo', runYolo);
    formData.append('enable_ocr', runOcr);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      const entry = {
        id: data.id ?? `${Date.now()}`,
        timestamp: data.timestamp ?? new Date().toISOString(),
        filename: file.name,
        filesize: file.size,
        cert_type: certType,
        prediction: data.prediction,
        confidence: data.confidence,
        model_used: data.model_used,
        student: data.ocr?.student ?? 'N/A',
        institute: data.ocr?.institute ?? 'N/A',
        course: data.ocr?.course ?? 'N/A',
        authenticity_score: data.verification?.authenticity_score ?? null,
        is_verified: data.verification?.is_verified ?? null,
      };

      // Update session history (dashboard polls this)
      try {
        const history = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]');
        const updated = [entry, ...history].slice(0, 50);
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
        // Manually dispatch storage event so same-tab listeners (DashboardPage) fire
        window.dispatchEvent(new StorageEvent('storage', {
          key: SESSION_KEY,
          newValue: JSON.stringify(updated),
        }));
      } catch { /* ignore */ }

      try {
        sessionStorage.setItem(
          LAST_RESULT_KEY,
          JSON.stringify({ ...data, filename: file.name, timestamp: entry.timestamp, cert_type: certType })
        );
      } catch {
        try {
          const { preview_image, ...withoutImg } = data;
          sessionStorage.setItem(
            LAST_RESULT_KEY,
            JSON.stringify({ ...withoutImg, filename: file.name, timestamp: entry.timestamp, cert_type: certType })
          );
        } catch { /* ignore */ }
      }

      navigate('/result', {
        state: { result: { ...data, filename: file.name, cert_type: certType } },
      });
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(
        err.message.includes('fetch')
          ? 'Cannot connect to the server. Make sure the Node.js and Flask services are running.'
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }, [file, certType, runCnn, runYolo, runOcr, navigate]);


  const handleReset = () => {
    setFile(null);
    setError('');
  };

  return (
    <div className="page-shell workbench-shell">
      {/* Workbench Header */}
      <div className="workbench-header">
        <div style={{ display: 'inline-block', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.35)', padding: '4px 14px', borderRadius: 999, fontSize: '0.74rem', color: 'var(--purple-light)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>
          VERIFICATION WORKBENCH
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 8 }}>
          Upload &amp; Analyze Certificate
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 580, margin: '0 auto', fontSize: '0.94rem' }}>
          Select the document category, configure AI detection passes, and upload the scanned certificate.
        </p>
      </div>

      <ServiceStatus />

      {/* 1. Category Selection */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>
          1. Select Certificate Category
        </h3>
        <CertTypeSelector selected={certType} onSelect={setCertType} />
      </div>

      {/* 2. Detection Options Group */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>
          2. Multi-Modal Analysis Passes
        </h3>
        <div className="workbench-options">
          <label className={`option-checkbox-card ${runCnn ? 'checked' : ''}`}>
            <input
              type="checkbox"
              className="custom-switch"
              checked={runCnn}
              onChange={(e) => setRunCnn(e.target.checked)}
            />
            <div>
              <strong style={{ fontSize: '0.88rem', display: 'block' }}>CNN Tamper Analysis</strong>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Pixel noise &amp; digital splicing</span>
            </div>
          </label>

          <label className={`option-checkbox-card ${runYolo ? 'checked' : ''}`}>
            <input
              type="checkbox"
              className="custom-switch"
              checked={runYolo}
              onChange={(e) => setRunYolo(e.target.checked)}
            />
            <div>
              <strong style={{ fontSize: '0.88rem', display: 'block' }}>CNN Visual Region Locator</strong>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>CAM heatmaps &amp; tampered regions</span>
            </div>
          </label>

          <label className={`option-checkbox-card ${runOcr ? 'checked' : ''}`}>
            <input
              type="checkbox"
              className="custom-switch"
              checked={runOcr}
              onChange={(e) => setRunOcr(e.target.checked)}
            />
            <div>
              <strong style={{ fontSize: '0.88rem', display: 'block' }}>EasyOCR Text Extractor</strong>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Candidate name &amp; dates</span>
            </div>
          </label>
        </div>
      </div>

      {/* 3. Upload Zone */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>
          3. Upload Document File (JPG, PNG, PDF)
        </h3>
        <UploadZone
          onFileSelect={setFile}
          file={file}
          onAnalyse={handleAnalyse}
          loading={loading}
          certType={certType}
        />
      </div>

      {loading && <LoadingSpinner />}

      {error && (
        <div className="error-card" style={{ marginTop: 24 }} id="error-card">
          <div className="error-icon">❌</div>
          <p className="error-title">Analysis Failed</p>
          <p className="error-msg">{error}</p>
          <button className="reset-btn" style={{ marginTop: 16 }} onClick={handleReset} id="error-retry-btn">
            ↩ Try Again
          </button>
        </div>
      )}
    </div>
  );
}
