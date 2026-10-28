import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="page-shell">
      <div className="page-header-row">
        <Link to="/" className="ghost-btn">← Home</Link>
        <h2>About CertVerify AI</h2>
      </div>

      {/* Main Highlights Card */}
      <div className="glass page-card" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'inline-block', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.35)', padding: '4px 14px', borderRadius: 999, fontSize: '0.76rem', color: 'var(--purple-light)', fontWeight: 700, marginBottom: 14 }}>
          IDEATHON 2026 INNOVATION PROJECT
        </div>
        <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 12 }}>
          Intelligent Multi-Modal Certificate Tampering Detection
        </h3>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--text-primary)', marginBottom: 14 }}>
          CertVerify AI combines a <strong>Custom Deep CNN (TamperNet)</strong>, <strong>Class Activation Mapping (CAM) localization</strong>, and <strong>EasyOCR</strong> to analyze certificate images for signs of tampering and to extract textual fields.
        </p>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.94rem' }}>
          Traditional certificate validation relies heavily on slow manual verification or centralized databases which are frequently unavailable or fragmented across universities, state boards, and employers. CertVerify AI bridges this gap through computer vision and machine learning that evaluates physical and visual authenticity markers right from the uploaded image.
        </p>
      </div>

      {/* Architecture Deep Dive */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: 16 }}>Technology Architecture</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
          
          <div className="glass" style={{ padding: 22, borderRadius: 16 }}>
            <div style={{ fontSize: '1.6rem', marginBottom: 10 }}>🧠</div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--purple-light)', marginBottom: 8 }}>
              5-Stage Deep CNN (TamperNet)
            </h4>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              A 5-stage Convolutional Neural Network trained to identify visual anomalies invisible to the human eye. By analyzing pixel residuals, color gradient mismatches, and compression discrepancies, the CNN detects cloned regions, erased text, and font substitutions.
            </p>
          </div>

          <div className="glass" style={{ padding: 22, borderRadius: 16 }}>
            <div style={{ fontSize: '1.6rem', marginBottom: 10 }}>🎯</div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--cyan)', marginBottom: 8 }}>
              CAM &amp; ELA Region Localization
            </h4>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Class Activation Maps (CAM) projected from deep convolutional feature maps alongside Error Level Analysis (ELA) localize suspicious regions, generating high-precision bounding boxes around forged stamps, altered text, and splicing boundaries.
            </p>
          </div>

          <div className="glass" style={{ padding: 22, borderRadius: 16 }}>
            <div style={{ fontSize: '1.6rem', marginBottom: 10 }}>🔤</div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--green)', marginBottom: 8 }}>
              EasyOCR Text Extraction
            </h4>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              CRAFT text detection combined with a ResNet-LSTM deep sequence recognizer extracts text fields even from noisy scans, crumpled paper, and tilted mobile photos. Enables automated verification of student name, roll number, and issuing date.
            </p>
          </div>

          <div className="glass" style={{ padding: 22, borderRadius: 16 }}>
            <div style={{ fontSize: '1.6rem', marginBottom: 10 }}>⚖️</div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--yellow)', marginBottom: 8 }}>
              Rule-Based Verification Engine
            </h4>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Synthesizes predictions into an aggregate Authenticity Score. Evaluates category-specific constraints for OBC certificates (creamy layer clauses, resolution numbers), income certificates, marksheets, and university degree transcripts.
            </p>
          </div>

        </div>
      </div>

      {/* Supported Documents & Benchmarks */}
      <div className="glass section-card" style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 14 }}>Supported Certificate Categories</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
            <strong>OBC Caste Certificate</strong>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>Validates Non-Creamy Layer, issuing Tehsildar, and resolution clauses.</p>
          </div>
          <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
            <strong>Degree Certificate</strong>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>Checks university emblem, chancellor signature, degree title, and division.</p>
          </div>
          <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
            <strong>Income Certificate</strong>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>Verifies revenue stamp, financial year, family annual income, and officer seal.</p>
          </div>
          <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
            <strong>Marksheet / Transcript</strong>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>Evaluates subject table boundaries, total marks, grade, and board emblem.</p>
          </div>
          <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
            <strong>Experience Certificate</strong>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>Checks company letterhead, tenure dates, HR signature, and designation.</p>
          </div>
        </div>
      </div>

      {/* Ideathon Notes */}
      <div className="glass section-card" style={{ borderLeft: '4px solid var(--purple)' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 8 }}>Ideathon 2026 Project Note</h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Designed and built for Ideathon 2026 as a modular audit application for academic institutions, corporate HR departments, and government bodies. Features complete local and on-premise execution capabilities to preserve student data privacy.
        </p>
      </div>
    </div>
  );
}
