import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const SESSION_KEY = 'certverify_history';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVerdict, setFilterVerdict] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const fetchHistory = async () => {
      // Determine the logged-in user
      let userId = 'anonymous';
      try {
        const u = JSON.parse(sessionStorage.getItem('certverify_user') || '{}');
        userId = u.id || u.email || 'anonymous';
      } catch { /* ignore */ }

      let items = [];

      // 1. Try server-side per-user history
      try {
        const res = await fetch(`/api/history?userId=${encodeURIComponent(userId)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.history) && data.history.length > 0) {
            items = data.history;
          }
        }
      } catch { /* network error — fall through */ }

      // 2. Fallback: this session's uploads (never show sample data)
      if (!items.length) {
        try {
          items = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]');
        } catch { items = []; }
      }

      setHistory(items);
    };

    fetchHistory();
  }, []);

  const handleInspect = (item) => {
    sessionStorage.setItem('certverify_last_result', JSON.stringify(item));
    navigate('/result', { state: { result: item } });
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your verification history?')) return;
    try {
      let userId = 'anonymous';
      try {
        const u = JSON.parse(sessionStorage.getItem('certverify_user') || '{}');
        userId = u.id || u.email || 'anonymous';
      } catch { /* ignore */ }
      await fetch(`/api/history?userId=${encodeURIComponent(userId)}`, { method: 'DELETE' });
    } catch { /* ignore */ }
    sessionStorage.removeItem(SESSION_KEY);
    setHistory([]);
  };

  const handleExportCSV = () => {
    if (!history.length) return;
    const headers = ['Filename', 'Category', 'Verdict', 'Confidence', 'Candidate', 'Institute', 'Timestamp'];
    const rows = history.map((h) => [
      `"${h.filename || ''}"`,
      `"${h.cert_type || ''}"`,
      `"${h.prediction || ''}"`,
      `"${h.confidence || ''}%"`,
      `"${h.student || ''}"`,
      `"${h.institute || ''}"`,
      `"${h.timestamp || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `certverify_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      (item.filename || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.student || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.institute || '').toLowerCase().includes(searchTerm.toLowerCase());

    const isFake = (item.prediction || '').toLowerCase() === 'fake';
    const matchesVerdict =
      filterVerdict === 'all' ||
      (filterVerdict === 'genuine' && !isFake) ||
      (filterVerdict === 'fake' && isFake);

    const matchesType =
      filterType === 'all' ||
      (item.cert_type || '').toLowerCase() === filterType.toLowerCase();

    return matchesSearch && matchesVerdict && matchesType;
  });

  return (
    <div className="page-shell history-shell">
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'inline-block', background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.3)', padding: '3px 12px', borderRadius: 999, fontSize: '0.74rem', color: 'var(--cyan)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>
            AUDIT TRAILS
          </div>
          <h2 style={{ fontSize: '1.9rem', fontWeight: 900 }}>Verification History</h2>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button id="history-upload-btn" className="primary-btn" onClick={() => navigate('/upload')}>
            + Upload New
          </button>
          <button id="history-export-btn" className="ghost-btn" onClick={handleExportCSV} disabled={!history.length}>
            📥 Export CSV
          </button>
          <button id="history-clear-btn" className="reset-btn" onClick={handleClearHistory} disabled={!history.length}>
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="glass" style={{ padding: '16px 20px', borderRadius: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <input
              id="history-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Search candidate name, certificate file, institute..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
              }}
            />
          </div>

          {/* Verdict Filter */}
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'genuine', 'fake'].map((v) => (
              <button
                key={v}
                onClick={() => setFilterVerdict(v)}
                className={`ghost-btn small-btn ${filterVerdict === v ? 'active' : ''}`}
                style={{
                  background: filterVerdict === v ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.05)',
                  borderColor: filterVerdict === v ? 'var(--purple)' : 'var(--border)',
                  color: filterVerdict === v ? 'var(--purple-light)' : 'var(--text-secondary)',
                  textTransform: 'capitalize',
                }}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <select
            id="history-type-filter"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
            }}
          >
            <option value="all">All Categories</option>
            <option value="obc">OBC Certificate</option>
            <option value="degree">Degree Certificate</option>
            <option value="income">Income Certificate</option>
            <option value="marksheet">Marksheet</option>
            <option value="experience">Experience Letter</option>
          </select>
        </div>
      </div>

      {/* History Items List */}
      {filteredHistory.length === 0 ? (
        <div className="glass empty-state" style={{ padding: 40, textAlign: 'center', borderRadius: 16 }}>
          <p style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</p>
          {history.length === 0 ? (
            <>
              <h3 style={{ fontSize: '1.2rem', marginBottom: 6 }}>No verification history yet</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 16 }}>
                Your uploaded certificates will appear here after your first scan.
              </p>
              <button className="primary-btn" onClick={() => navigate('/upload')}>Upload a Certificate</button>
            </>
          ) : (
            <>
              <h3 style={{ fontSize: '1.2rem', marginBottom: 6 }}>No matching results</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 16 }}>
                Try resetting your search or filters.
              </p>
              <button className="ghost-btn" onClick={() => { setSearchTerm(''); setFilterVerdict('all'); setFilterType('all'); }}>
                Reset Filters
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="history-list-page">
          {filteredHistory.map((item, idx) => {
            const isFake = (item.prediction || '').toLowerCase() === 'fake';
            return (
              <div key={item.id ?? idx} className="glass history-entry" style={{ borderRadius: 16, border: '1px solid var(--border)' }}>
                <div className="history-entry-top">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className={`history-badge ${isFake ? 'fake' : 'genuine'}`}>
                      {isFake ? '⚠ TAMPERED / FAKE' : '✓ VERIFIED GENUINE'}
                    </span>
                    <span style={{ fontSize: '0.74rem', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase' }}>
                      {item.cert_type || 'General'}
                    </span>
                  </div>
                  <span className="history-meta" style={{ fontWeight: 700, color: isFake ? 'var(--red)' : 'var(--green)' }}>
                    {item.confidence ?? 0}% confidence
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8 }}>
                      {item.filename || 'Certificate Document'}
                    </h3>
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                      <strong>Candidate:</strong> {item.student || 'N/A'}
                    </p>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                      <strong>Issuing Authority:</strong> {item.institute || 'N/A'}
                    </p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      <strong>Model Pipeline:</strong> {item.model_used || 'Deep CNN + EasyOCR'} · {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                    {item.authenticity_score !== null && item.authenticity_score !== undefined && (
                      <div style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border)' }}>
                        Authenticity Score: <strong>{item.authenticity_score}/100</strong>
                      </div>
                    )}
                    <button
                      className="primary-btn small-btn"
                      onClick={() => handleInspect(item)}
                      style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                    >
                      Inspect Report →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
