/**
 * ServiceStatus.jsx — Live health status bar for Node.js + Flask services
 * Polls /api/health every 30 seconds and displays coloured indicators.
 */
import { useState, useEffect, useCallback } from 'react';

export default function ServiceStatus() {
  const [status, setStatus]   = useState(null);   // null = loading
  const [lastCheck, setLast]  = useState(null);

  const check = useCallback(async () => {
    try {
      const res  = await fetch('/api/health', { signal: AbortSignal.timeout(6000) });
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ nodeServer: { status: 'error' }, flaskApi: { status: 'unavailable' } });
    }
    setLast(new Date());
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, [check]);

  if (!status) return null;

  const nodeOk  = status.nodeServer?.status === 'ok';
  const flaskOk = status.flaskApi?.status   === 'ok';

  return (
    <div className="service-status-bar" id="service-status-bar" role="status">
      <span className="status-label">Services</span>

      <span className={`status-pill ${nodeOk ? 'ok' : 'err'}`} id="node-status">
        <span className={`status-dot ${nodeOk ? 'ok' : 'err'}`} />
        Node.js
      </span>

      <span className={`status-pill ${flaskOk ? 'ok' : 'err'}`} id="flask-status">
        <span className={`status-dot ${flaskOk ? 'ok' : 'err'}`} />
        Flask ML
      </span>

      {!flaskOk && (
        <span className="status-warn" id="flask-warning">
          ⚠ Flask offline — run <code>python app.py</code> in <code>ml/</code>
        </span>
      )}

      {lastCheck && (
        <span className="status-time">
          checked {lastCheck.toLocaleTimeString()}
        </span>
      )}

      <button
        className="status-refresh-btn"
        onClick={check}
        title="Refresh status"
        id="status-refresh-btn"
      >
        ↻
      </button>
    </div>
  );
}
