import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const performLogin = async (loginEmail, loginPassword) => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // ── Wipe any stale data from a previous session ──────────
      sessionStorage.removeItem('certverify_history');
      sessionStorage.removeItem('certverify_last_result');

      sessionStorage.setItem('certverify_logged_in', 'true');
      sessionStorage.setItem('certverify_user', JSON.stringify(data.user));
      setIsSuccess(true);
      setMessage('✅ Authentication successful! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 600);

    } catch (err) {
      setIsSuccess(false);
      setMessage(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage('Please enter both email and password.');
      return;
    }
    performLogin(email, password);
  };

  const handleQuickDemo = () => {
    setEmail('test@test.com');
    setPassword('test123');
    performLogin('test@test.com', 'test123');
  };

  return (
    <div className="page-shell auth-shell">
      <div className="glass auth-card" style={{ maxWidth: 440, margin: '20px auto', padding: 32 }}>
        <div className="page-header-row" style={{ marginBottom: 16 }}>
          <Link to="/" className="ghost-btn">← Back to Home</Link>
          <span style={{ fontSize: '0.78rem', color: 'var(--cyan)', fontWeight: 700 }}>CERTVERIFY AUTH</span>
        </div>

        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>Sign In</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 20 }}>
          Access the certificate verification engine &amp; dashboards.
        </p>

        {/* Demo Shortcut Button */}
        <button
          id="quick-demo-btn"
          type="button"
          className="ghost-btn"
          onClick={handleQuickDemo}
          style={{
            width: '100%',
            marginBottom: 20,
            background: 'rgba(139,92,246,0.12)',
            borderColor: 'rgba(139,92,246,0.35)',
            color: 'var(--purple-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontWeight: 700,
          }}
        >
          ⚡ One-Click Demo Login (test@test.com)
        </button>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email Address
            <input
              id="login-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. test@test.com"
              autoComplete="username"
              required
            />
          </label>

          <label style={{ position: 'relative' }}>
            Password
            <input
              id="login-password-input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: 12,
                top: 36,
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              {showPassword ? '🙈 Hide' : '👁️ Show'}
            </button>
          </label>

          <button
            id="login-submit-btn"
            type="submit"
            className="primary-btn full-width"
            disabled={loading}
            style={{ marginTop: 12, padding: '12px' }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>

          {message && (
            <p
              className="auth-message"
              style={{
                color: isSuccess ? 'var(--green)' : '#fecaca',
                background: isSuccess ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                padding: '8px 12px',
                borderRadius: 8,
                marginTop: 12,
                textAlign: 'center',
                fontSize: '0.86rem',
              }}
            >
              {message}
            </p>
          )}
        </form>

        <div className="auth-switch-link" style={{ marginTop: 24, textAlign: 'center', fontSize: '0.9rem' }}>
          Don&apos;t have an account?{' '}
          <Link to="/register" style={{ color: 'var(--cyan)', fontWeight: 700 }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}