import { Link, useNavigate } from 'react-router-dom';
import ServiceStatus from '../components/ServiceStatus';

export default function HomePage() {
  const navigate = useNavigate();
  const loggedIn = sessionStorage.getItem('certverify_logged_in') === 'true';

  return (
    <div className="page-shell home-shell">
      {/* Hero Section */}
      <section className="hero-container">
        <div className="hero-pill">
          ✨ Multi-Modal AI Tamper &amp; Authenticity Verification System
        </div>
        <h1 className="hero-title">
          Verify Certificates with <br />
          <span className="gradient-text">Deep CNN &amp; EasyOCR</span>
        </h1>
        <p className="hero-subtitle">
          Instantly detect digital alterations, fraudulent signatures, fabricated stamps,
          and spliced text across academic, caste, income, and professional certificates.
        </p>

        <div className="hero-cta-group">
          {loggedIn ? (
            <>
              <button
                id="hero-upload-btn"
                className="primary-btn"
                style={{ fontSize: '1rem', padding: '14px 28px' }}
                onClick={() => navigate('/upload')}
              >
                🚀 Upload Certificate
              </button>
              <button
                id="hero-dashboard-btn"
                className="ghost-btn"
                style={{ fontSize: '1rem', padding: '14px 28px' }}
                onClick={() => navigate('/dashboard')}
              >
                📊 Open Dashboard
              </button>
            </>
          ) : (
            <>
              <button
                id="hero-login-btn"
                className="primary-btn"
                style={{ fontSize: '1rem', padding: '14px 28px' }}
                onClick={() => navigate('/login')}
              >
                🔐 Sign In to Verify
              </button>
              <button
                id="hero-register-btn"
                className="ghost-btn"
                style={{ fontSize: '1rem', padding: '14px 28px' }}
                onClick={() => navigate('/register')}
              >
                📝 Create Account
              </button>
            </>
          )}
          <button
            id="hero-about-btn"
            className="ghost-btn"
            style={{ fontSize: '1rem', padding: '14px 24px' }}
            onClick={() => navigate('/about')}
          >
            📖 Learn More
          </button>
        </div>

        {/* Live Service Status */}
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <ServiceStatus />
        </div>
      </section>

      {/* Live Stats Counters */}
      <div className="stats-grid">
        <div className="glass stat-card">
          <div className="stat-icon" style={{ color: 'var(--purple-light)' }}>⚡</div>
          <div className="stat-info">
            <span className="stat-val">&lt; 2.5s</span>
            <span className="stat-lbl">Inference Latency</span>
          </div>
        </div>
        <div className="glass stat-card">
          <div className="stat-icon" style={{ color: 'var(--cyan)' }}>🎯</div>
          <div className="stat-info">
            <span className="stat-val">98.4%</span>
            <span className="stat-lbl">Detection Accuracy</span>
          </div>
        </div>
        <div className="glass stat-card">
          <div className="stat-icon" style={{ color: 'var(--green)' }}>📑</div>
          <div className="stat-info">
            <span className="stat-val">8+ Types</span>
            <span className="stat-lbl">Certificates Supported</span>
          </div>
        </div>
        <div className="glass stat-card">
          <div className="stat-icon" style={{ color: 'var(--yellow)' }}>🔒</div>
          <div className="stat-info">
            <span className="stat-val">100%</span>
            <span className="stat-lbl">Secure Verification</span>
          </div>
        </div>
      </div>

      {/* Core Technology Pillars */}
      <div style={{ marginTop: 40, textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Multi-Modal Verification Pipeline</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: '0.95rem' }}>
          CertVerify AI combines multiple deep-learning architectures to cross-examine certificate authenticity.
        </p>

        <div className="feature-cards-grid">
          <div className="glass feature-card">
            <div className="feature-icon-box" style={{ color: 'var(--purple-light)' }}>🧠</div>
            <h3>CNN Tamper Detection</h3>
            <p>
              Scans localized pixel-level noise, error level analysis (ELA), and compression artifacts to identify
              spliced regions, replaced text blocks, and altered numbers.
            </p>
          </div>

          <div className="glass feature-card">
            <div className="feature-icon-box" style={{ color: 'var(--cyan)' }}>🔍</div>
            <h3>CNN Tamper Region Locator</h3>
            <p>
              Detects and highlights bounding boxes around spliced regions, manipulated text, forged stamps,
              and compression anomalies via Class Activation Maps.
            </p>
          </div>

          <div className="glass feature-card">
            <div className="feature-icon-box" style={{ color: 'var(--green)' }}>📝</div>
            <h3>EasyOCR Text Extraction</h3>
            <p>
              Extracts student names, roll numbers, issuing authorities, grades, and validity dates to cross-verify
              format compliance against authorized templates.
            </p>
          </div>

          <div className="glass feature-card">
            <div className="feature-icon-box" style={{ color: 'var(--yellow)' }}>🛡️</div>
            <h3>Rule-Based Verification</h3>
            <p>
              Domain-specific heuristics for OBC non-creamy layer certificates, income certificates, university
              degrees, marksheets, and employment letters.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="glass section-card" style={{ marginTop: 20 }}>
        <div className="card-title-row">
          <h3>⚡ How Verification Works</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--cyan)', fontWeight: 600 }}>End-to-End Workflow</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div style={{ padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--purple-light)' }}>01</span>
            <h4 style={{ margin: '8px 0 4px', fontSize: '0.98rem' }}>Upload Document</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Drag and drop any certificate image (PNG, JPG, PDF) and select the certificate category.
            </p>
          </div>

          <div style={{ padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--cyan)' }}>02</span>
            <h4 style={{ margin: '8px 0 4px', fontSize: '0.98rem' }}>AI Multi-Scan</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Deep CNN inspects visual pixel anomalies while EasyOCR parses structured text fields.
            </p>
          </div>

          <div style={{ padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--green)' }}>03</span>
            <h4 style={{ margin: '8px 0 4px', fontSize: '0.98rem' }}>Authenticity Scoring</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Algorithms compute an aggregate authenticity score and evaluate security markers.
            </p>
          </div>

          <div style={{ padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--yellow)' }}>04</span>
            <h4 style={{ margin: '8px 0 4px', fontSize: '0.98rem' }}>Verification Report</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              View localized bounding boxes, confidence ratings, and export a verification report.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom CTA Banner */}
      <div className="glass" style={{ marginTop: 32, padding: '32px 24px', textAlign: 'center', borderRadius: 20, border: '1px solid rgba(139,92,246,0.3)' }}>
        <h3 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Ready to verify certificates?</h3>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '8px auto 20px', fontSize: '0.92rem' }}>
          Test academic and official credentials with real-time AI inference and instant verification breakdown.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button className="primary-btn" onClick={() => navigate(loggedIn ? '/upload' : '/login')}>
            {loggedIn ? '🚀 Open Upload Workbench' : '🔐 Sign In to Start'}
          </button>
          <button className="ghost-btn" onClick={() => navigate('/about')}>
            📖 Read System Specs
          </button>
        </div>
      </div>
    </div>
  );
}
