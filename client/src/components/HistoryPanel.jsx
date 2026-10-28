/**
 * HistoryPanel.jsx — Shows the last 5 analysis results from this session.
 * Reads from sessionStorage which is populated by App.jsx on each result.
 */
import { useMemo } from 'react';

const MAX_VISIBLE = 5;

function timeAgo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function HistoryPanel({ history = [], onSelect }) {
  const recent = useMemo(() => history.slice(0, MAX_VISIBLE), [history]);

  if (!recent.length) return null;

  return (
    <section className="history-panel" id="history-panel" aria-label="Recent analyses">
      <div className="history-header">
        <span className="history-title">
          <span className="panel-title-dot" style={{ background: 'var(--yellow)' }} />
          Recent Analyses
        </span>
        <span className="history-count">{recent.length} result{recent.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="history-list" role="list">
        {recent.map((item, idx) => (
          <button
            key={item.id ?? idx}
            className={`history-item ${item.prediction === 'Fake' ? 'fake' : 'genuine'}`}
            id={`history-item-${idx}`}
            onClick={() => onSelect && onSelect(item)}
            role="listitem"
            aria-label={`${item.filename} — ${item.prediction}`}
          >
            <span className={`history-verdict-dot ${item.prediction === 'Fake' ? 'fake' : 'genuine'}`} />

            <span className="history-item-info">
              <span className="history-filename">{item.filename}</span>
              <span className="history-meta">
                {item.prediction} · {item.confidence}% · {timeAgo(item.timestamp)}
              </span>
            </span>

            <span className={`history-badge ${item.prediction === 'Fake' ? 'fake' : 'genuine'}`}>
              {item.prediction === 'Fake' ? '⚠ FAKE' : '✓ OK'}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
