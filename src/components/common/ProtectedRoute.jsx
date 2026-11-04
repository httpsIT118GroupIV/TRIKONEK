import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ allow, children }) {
  const { session, role, loading } = useAuth();
  if (loading) return <p>Loading…</p>;
  if (!session) return <Navigate to="/login" replace />;
  if (!allow.includes(role)) return <Navigate to="/" replace />;
  return children;
}