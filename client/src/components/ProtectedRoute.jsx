import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const isLoggedIn = sessionStorage.getItem('certverify_logged_in') === 'true';
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}
