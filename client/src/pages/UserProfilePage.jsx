import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function UserProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: 'Verification Officer',
    email: 'test@test.com',
    role: 'Lead Verification Officer',
    organization: 'Ideathon CS Lab',
    title: 'Senior Digital Credential Auditor',
    joinedDate: '2026-01-15',
    scansCount: 42,
    notifications: true,
    twoFactor: false,
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [passwordState, setPasswordState] = useState({
    current: '',
    newPass: '',
    confirm: '',
    passMsg: '',
  });

  useEffect(() => {
    // Check session user first
    try {
      const stored = sessionStorage.getItem('certverify_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setProfile((prev) => ({
          ...prev,
          name: parsed.name || prev.name,
          email: parsed.email || prev.email,
          role: parsed.role || prev.role,
          organization: parsed.organization || prev.organization,
        }));
      }
    } catch {
      // ignore
    }

    // Fetch full profile from API
    const loadProfile = async () => {
      try {
        const stored = sessionStorage.getItem('certverify_user');
        const userObj = stored ? JSON.parse(stored) : null;
        const queryEmail = userObj?.email || 'test@test.com';

        const res = await fetch(`/api/auth/profile?email=${encodeURIComponent(queryEmail)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setProfile((prev) => ({ ...prev, ...data.user }));
          }
        }
      } catch (err) {
        console.warn('Failed to load profile from server:', err);
      }
    };

    loadProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      const data = await res.json();
      if (data.success) {
        setMessage('✅ Profile details updated successfully.');
        // Update session
        sessionStorage.setItem('certverify_user', JSON.stringify({ ...profile }));
      } else {
        setMessage('❌ ' + (data.error || 'Failed to update profile.'));
      }
    } catch (err) {
      setMessage('❌ Update failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!passwordState.current || !passwordState.newPass) {
      setPasswordState((prev) => ({ ...prev, passMsg: 'Please fill in all password fields.' }));
      return;
    }
    if (passwordState.newPass !== passwordState.confirm) {
      setPasswordState((prev) => ({ ...prev, passMsg: 'New passwords do not match.' }));
      return;
    }
    if (passwordState.newPass.length < 6) {
      setPasswordState((prev) => ({ ...prev, passMsg: 'Password must be at least 6 characters.' }));
      return;
    }

    setPasswordState({ current: '', newPass: '', confirm: '', passMsg: '✅ Password changed successfully.' });
  };

  const handleLogout = () => {
    sessionStorage.removeItem('certverify_logged_in');
    sessionStorage.removeItem('certverify_user');
    navigate('/login');
  };

  const getInitials = (name) => {
    return (name || 'VO')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="page-shell profile-shell">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'inline-block', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', padding: '3px 12px', borderRadius: 999, fontSize: '0.74rem', color: 'var(--purple-light)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>
            USER ACCOUNT
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 900 }}>User Profile &amp; Settings</h2>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button id="profile-history-btn" className="ghost-btn" onClick={() => navigate('/history')}>
            📜 My Verification Logs
          </button>
          <button id="profile-logout-btn" className="reset-btn" onClick={handleLogout}>
            🚪 Sign Out
          </button>
        </div>
      </div>

      <div className="profile-grid">
        {/* Left Column: Avatar & Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass profile-avatar-card">
            <div className="big-avatar">
              {getInitials(profile.name)}
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{profile.name}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: 2 }}>{profile.email}</p>
            <div className="profile-role-badge">{profile.role || 'Verification Officer'}</div>

            <div style={{ width: '100%', marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 18, textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.84rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Organization:</span>
                <strong>{profile.organization}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.84rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Account Joined:</span>
                <strong>{profile.joinedDate}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Scans Conducted:</span>
                <strong style={{ color: 'var(--cyan)' }}>{profile.scansCount}</strong>
              </div>
            </div>
          </div>

          {/* Quick Stats Pill Card */}
          <div className="glass section-card">
            <h4 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: 12 }}>⚡ Verification Privileges</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--green)' }}>✓</span>
                <span>Unlimited Local Inference API access</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--green)' }}>✓</span>
                <span>Full Access to Bounding Box Visualizer</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--green)' }}>✓</span>
                <span>Audit Trail &amp; CSV Export Permission</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile & Security Forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Edit Profile Form */}
          <div className="glass section-card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 16 }}>
              👤 Personal &amp; Institutional Details
            </h3>

            <form onSubmit={handleUpdateProfile}>
              <div className="form-group-grid">
                <label>
                  Full Name
                  <input
                    id="profile-name-input"
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    required
                  />
                </label>

                <label>
                  Email Address
                  <input
                    id="profile-email-input"
                    type="email"
                    value={profile.email}
                    disabled
                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                  />
                </label>
              </div>

              <div className="form-group-grid" style={{ marginTop: 12 }}>
                <label>
                  Organization / University
                  <input
                    id="profile-org-input"
                    type="text"
                    value={profile.organization}
                    onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                  />
                </label>

                <label>
                  Job Title / Department
                  <input
                    id="profile-title-input"
                    type="text"
                    value={profile.title || ''}
                    onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                  />
                </label>
              </div>

              {/* Preferences */}
              <div style={{ marginTop: 18, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <h4 style={{ fontSize: '0.94rem', fontWeight: 700, marginBottom: 12 }}>Preferences</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label className="option-checkbox-card" style={{ border: 'none', background: 'rgba(255,255,255,0.02)' }}>
                    <input
                      type="checkbox"
                      className="custom-switch"
                      checked={profile.notifications}
                      onChange={(e) => setProfile({ ...profile, notifications: e.target.checked })}
                    />
                    <span style={{ fontSize: '0.85rem' }}>Send security email notifications when tampered certificates are detected</span>
                  </label>

                  <label className="option-checkbox-card" style={{ border: 'none', background: 'rgba(255,255,255,0.02)' }}>
                    <input
                      type="checkbox"
                      className="custom-switch"
                      checked={profile.twoFactor}
                      onChange={(e) => setProfile({ ...profile, twoFactor: e.target.checked })}
                    />
                    <span style={{ fontSize: '0.85rem' }}>Require Two-Factor Authentication (2FA) for admin actions</span>
                  </label>
                </div>
              </div>

              <button
                id="profile-save-btn"
                type="submit"
                className="primary-btn"
                disabled={saving}
                style={{ marginTop: 18, padding: '12px 24px' }}
              >
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>

              {message && (
                <p style={{ marginTop: 12, fontSize: '0.86rem', color: message.includes('✅') ? 'var(--green)' : '#fecaca' }}>
                  {message}
                </p>
              )}
            </form>
          </div>

          {/* Change Password Card */}
          <div className="glass section-card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 16 }}>
              🔒 Security &amp; Password
            </h3>

            <form onSubmit={handleChangePassword}>
              <div className="form-group-grid">
                <label>
                  Current Password
                  <input
                    type="password"
                    value={passwordState.current}
                    onChange={(e) => setPasswordState({ ...passwordState, current: e.target.value })}
                    placeholder="Enter current password"
                  />
                </label>

                <label>
                  New Password
                  <input
                    type="password"
                    value={passwordState.newPass}
                    onChange={(e) => setPasswordState({ ...passwordState, newPass: e.target.value })}
                    placeholder="At least 6 characters"
                  />
                </label>
              </div>

              <div style={{ marginTop: 12, maxWidth: 300 }}>
                <label>
                  Confirm New Password
                  <input
                    type="password"
                    value={passwordState.confirm}
                    onChange={(e) => setPasswordState({ ...passwordState, confirm: e.target.value })}
                    placeholder="Confirm new password"
                  />
                </label>
              </div>

              <button type="submit" className="ghost-btn" style={{ marginTop: 14 }}>
                Update Password
              </button>

              {passwordState.passMsg && (
                <p style={{ marginTop: 10, fontSize: '0.85rem', color: passwordState.passMsg.includes('✅') ? 'var(--green)' : '#fecaca' }}>
                  {passwordState.passMsg}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
