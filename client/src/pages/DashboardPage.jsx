import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ServiceStatus from '../components/ServiceStatus';

// ── helpers ──────────────────────────────────────────────────
const SESSION_HIST_KEY = 'certverify_history';

function computeMetrics(entries) {
  if (!entries.length) return { total: 0, genuine: 0, fake: 0, avgConfidence: 0 };
  const total   = entries.length;
  const genuine = entries.filter((e) => (e.prediction || '').toLowerCase() === 'genuine').length;
  const fake    = total - genuine;
  const sumConf = entries.reduce((acc, e) => acc + (Number(e.confidence) || 0), 0);
  return { total, genuine, fake, avgConfidence: Math.round(sumConf / total) };
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user,    setUser]    = useState(null);
  const [history, setHistory] = useState([]);       // starts EMPTY — fresh every login
  const [metrics, setMetrics] = useState({ total: 0, genuine: 0, fake: 0, avgConfidence: 0 });

  // ── Load user + fetch their history ──────────────────────────
  const loadHistory = useCallback(async (currentUser) => {
    const uid = currentUser?.id || currentUser?.email || null;
    let entries = [];

    // 1. Try server-side per-user history
    if (uid) {
      try {
        const res = await fetch(`/api/history?userId=${encodeURIComponent(uid)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.history) && data.history.length > 0) {
            entries = data.history;
          }
        }
      } catch { /* network error — fall through */ }
    }

    // 2. Fallback: session-scoped local history (never show demo data)
    if (!entries.length) {
      try {
        entries = JSON.parse(sessionStorage.getItem(SESSION_HIST_KEY) || '[]');
      } catch { entries = []; }
    }

    setHistory(entries);
    setMetrics(computeMetrics(entries));
  }, []);

  useEffect(() => {
    let currentUser = null;
    try {
      const stored = sessionStorage.getItem('certverify_user');
      if (stored) { currentUser = JSON.parse(stored); setUser(currentUser); }
    } catch { /* ignore */ }

    loadHistory(currentUser);

    // ── Live update when UploadPage saves a new entry to sessionStorage ──
    const onStorage = (e) => {
      if (e.key === SESSION_HIST_KEY) loadHistory(currentUser);
    };
    window.addEventListener('storage', onStorage);

    // ── Polling fallback (same tab — storage event doesn't fire in same tab) ─
    const poll = setInterval(() => {
      try {
        const entries = JSON.parse(sessionStorage.getItem(SESSION_HIST_KEY) || '[]');
        setHistory((prev) => {
          if (prev.length !== entries.length) {
            setMetrics(computeMetrics(entries));
            return entries;
          }
          return prev;
        });
      } catch { /* ignore */ }
    }, 3000); // check every 3 s

    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(poll);
    };
  }, [loadHistory]);

  const handleInspect = (entry) => {
    sessionStorage.setItem('certverify_last_result', JSON.stringify(entry));
    navigate('/result', { state: { result: entry } });
  };

  const userName = user?.name || user?.email?.split('@')[0] || 'Certificate Examiner';

  // ── Animated counter helper ───────────────────────────────────
  const StatCard = ({ icon, color, bg, value, label, suffix = '' }) => (
    <div className="glass stat-card">
      <div className="stat-icon" style={{ color, background: bg }}>{icon}</div>
      <div className="stat-info">
        <span className="stat-val">
          {value}{suffix}
        </span>
        <span className="stat-lbl">{label}</span>
      </div>
    </div>
  );

  return (
    <div className="page-shell dashboard-shell">
      {/* Welcome Banner */}
      <div className="glass" style={{ padding: '24px 28px', borderRadius: 20, marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-block', background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.3)', padding: '3px 12px', borderRadius: 999, fontSize: '0.74rem', color: 'var(--cyan)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
            SYSTEM DASHBOARD
          </div>
          <h2 style={{ fontSize: '1.9rem', fontWeight: 900, marginBottom: 6 }}>
            Welcome back, <span className="gradient-text">{userName}</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: 640 }}>
            Upload a certificate to start your verification session. Your stats and history will update in real-time.
          </p>
        </div>

        <div style={{ marginTop: 18, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button id="dash-quick-upload-btn" className="primary-btn" onClick={() => navigate('/upload')}>
            🚀 Upload Certificate
          </button>
          <button id="dash-quick-history-btn" className="ghost-btn" onClick={() => navigate('/history')}>
            📜 View Full History
          </button>
          <button id="dash-quick-admin-btn" className="ghost-btn" onClick={() => navigate('/admin')}>
            ⚙️ Admin Console
          </button>
        </div>
      </div>

      {/* Service Health Widget */}
      <ServiceStatus />

      {/* Metrics Counter Grid — start at 0, grow live */}
      <div className="stats-grid">
        <StatCard
          icon="📊"
          color="var(--purple-light)"
          bg="rgba(139,92,246,0.12)"
          value={metrics.total}
          label="Total Certificates Scanned"
        />
        <StatCard
          icon="✅"
          color="var(--green)"
          bg="rgba(16,185,129,0.12)"
          value={metrics.genuine}
          label="Verified Genuine"
        />
        <StatCard
          icon="⚠️"
          color="var(--red)"
          bg="rgba(239,68,68,0.12)"
          value={metrics.fake}
          label="Tampered / Altered Flags"
        />
        <StatCard
          icon="🎯"
          color="var(--cyan)"
          bg="rgba(34,211,238,0.12)"
          value={metrics.avgConfidence}
          suffix="%"
          label="Average AI Confidence"
        />
      </div>

      {/* Main Grid: Recent Activity Feed & Distribution */}
      <div className="dashboard-grid">
        {/* Left: Recent Activity Feed */}
        <div className="glass section-card">
          <div className="card-title-row">
            <h3>🕒 Recent Certificate Scans</h3>
            <button className="ghost-btn small-btn" onClick={() => navigate('/history')}>
              View All ({history.length})
            </button>
          </div>

          {history.length === 0 ? (
            <div className="empty-state" style={{ padding: '36px 12px' }}>
              <p style={{ fontSize: '2.4rem', marginBottom: 12 }}>📁</p>
              <h4 style={{ fontSize: '1.1rem', marginBottom: 6 }}>No verifications yet</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginBottom: 16 }}>
                Upload your first certificate to trigger the Deep CNN &amp; EasyOCR analysis pipeline.
                Your stats will appear here immediately.
              </p>
              <button className="primary-btn" onClick={() => navigate('/upload')}>
                Upload Certificate
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {history.slice(0, 5).map((item, idx) => {
                const isFake = (item.prediction || '').toLowerCase() === 'fake';
                return (
                  <div
                    key={item.id || idx}
                    className="history-item"
                    style={{ padding: '12px 16px', borderRadius: 12 }}
                  >
                    <div className="history-item-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                          {item.filename || 'certificate.jpg'}
                        </span>
                        <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase' }}>
                          {item.cert_type || 'General'}
                        </span>
                      </div>
                      <span className="history-meta">
                        {item.student && item.student !== 'N/A' ? `Candidate: ${item.student} · ` : ''}
                        {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className={`history-badge ${isFake ? 'fake' : 'genuine'}`}>
                        {item.prediction || 'Genuine'} ({item.confidence || 0}%)
                      </span>
                      <button
                        className="ghost-btn small-btn"
                        onClick={() => handleInspect(item)}
                        style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Quick Launch & Rule Engine Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Quick Launch Card */}
          <div className="glass section-card" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(34,211,238,0.06))' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 8 }}>⚡ Rapid Inspection</h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
              Have an academic degree, caste, or income certificate to test right now?
            </p>
            <button className="primary-btn full-width" onClick={() => navigate('/upload')}>
              Open Upload Workbench →
            </button>
          </div>

          {/* Supported Types Status */}
          <div className="glass section-card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 14 }}>📂 Active Rule Engines</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { name: 'OBC Certificate Rule',   desc: 'Validates Non-Creamy Layer & Seal' },
                { name: 'University Degree Engine', desc: 'Emblem, Chancellor Signature' },
                { name: 'Income Certificate Rule', desc: 'Revenue stamp, Financial year' },
                { name: 'Marksheet / Transcripts', desc: 'Subject grids & Total CGPA' },
                { name: 'Experience Letter',       desc: 'HR Signature & Letterhead' },
              ].map((rule, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>{rule.name}</strong>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.74rem' }}>{rule.desc}</div>
                  </div>
                  <span style={{ color: 'var(--green)', fontWeight: 700, fontSize: '0.74rem', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 4 }}>
                    ● Ready
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
