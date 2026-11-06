import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ allow, children }) {
  const { session, role, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-soft">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-dark border-t-transparent" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  if (!allow.includes(role)) return <Navigate to="/" replace />;
  return children;
}