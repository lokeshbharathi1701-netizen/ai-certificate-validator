import { Link, NavLink, useNavigate } from 'react-router-dom';

export default function TopNav() {
  const navigate = useNavigate();
  const loggedIn = sessionStorage.getItem('certverify_logged_in') === 'true';

  let userName = 'Analyst';
  try {
    const user = JSON.parse(sessionStorage.getItem('certverify_user') || '{}');
    if (user?.name) userName = user.name.split(' ')[0];
  } catch {
    // ignore
  }

  const handleLogout = () => {
    sessionStorage.removeItem('certverify_logged_in');
    sessionStorage.removeItem('certverify_user');
    navigate('/login');
  };

  return (
    <nav className="top-nav glass">
      <Link to="/" className="nav-brand-group">
        <div className="brand-icon-badge">🛡️</div>
        <div>
          <div className="nav-brand-title">CertVerify AI</div>
          <div className="nav-brand-sub">Multi-Modal Verification</div>
        </div>
      </Link>

      <div className="nav-links">
        <NavLink to="/home" className={({ isActive }) => (isActive ? 'active' : '')}>
          Home
        </NavLink>
        <NavLink to="/about" className={({ isActive }) => (isActive ? 'active' : '')}>
          About
        </NavLink>

        {loggedIn ? (
          <>
            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
              Dashboard
            </NavLink>
            <NavLink to="/upload" className={({ isActive }) => (isActive ? 'active' : '')}>
              Upload Certificate
            </NavLink>
            <NavLink to="/history" className={({ isActive }) => (isActive ? 'active' : '')}>
              History
            </NavLink>
            <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')}>
              Admin
            </NavLink>

            {/* User Profile Pill */}
            <NavLink to="/profile" className="nav-profile-pill">
              <span className="nav-avatar-mini">{userName[0]}</span>
              <span>{userName}</span>
            </NavLink>

            <button
              id="nav-logout-btn"
              className="ghost-btn small-btn"
              onClick={handleLogout}
              style={{ marginLeft: 4 }}
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className={({ isActive }) => (isActive ? 'active' : '')}>
              Login
            </NavLink>
            <NavLink to="/register" className={({ isActive }) => (isActive ? 'active' : '')}>
              Register
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}
