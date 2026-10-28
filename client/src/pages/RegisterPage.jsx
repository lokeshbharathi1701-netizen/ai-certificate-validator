import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      setMessage('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setIsSuccess(true);
      setMessage('✅ Account created successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setIsSuccess(false);
      setMessage(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell auth-shell">
      <div className="glass auth-card" style={{ maxWidth: 480, margin: '20px auto', padding: 32 }}>
        <div className="page-header-row" style={{ marginBottom: 16 }}>
          <Link to="/" className="ghost-btn">← Home</Link>
          <span style={{ fontSize: '0.78rem', color: 'var(--cyan)', fontWeight: 700 }}>NEW ACCOUNT</span>
        </div>

        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>Create Account</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 20 }}>
          Register to access the certificate verification workbench.
        </p>

        <form onSubmit={handleRegister} className="auth-form">
          <label>
            Full Name *
            <input
              id="register-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Jane Smith"
              required
            />
          </label>

          <label>
            Email Address *
            <input
              id="register-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. janesmith@university.edu"
              autoComplete="username"
              required
            />
          </label>



          <label>
            Password *
            <input
              id="register-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              required
            />
          </label>

          <label>
            Confirm Password *
            <input
              id="register-confirm-password-input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              autoComplete="new-password"
              required
            />
          </label>

          <button
            id="register-submit-btn"
            type="submit"
            className="primary-btn full-width"
            disabled={loading}
            style={{ marginTop: 14, padding: '12px' }}
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
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
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--cyan)', fontWeight: 700 }}>
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
