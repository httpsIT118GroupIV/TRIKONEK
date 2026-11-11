import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useLang } from './context/LanguageContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import { HOME } from './utils/roleHome';
import Login from './pages/Login';
import Register from './pages/Register';
import CommuterHome from './pages/CommuterHome';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Faq from './pages/Faq';

function RoleRedirect() {
  const { session, role, loading, signOut } = useAuth();
  const { t } = useLang();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-soft">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-dark border-t-transparent" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-soft p-4">
        <div className="card max-w-md space-y-4">
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-full">{t('auth.noProfile')}</p>
          <button onClick={signOut} className="btn-dark">{t('common.signOut')}</button>
        </div>
      </div>
    );
  }
  return <Navigate to={HOME[role]} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RoleRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/commuter" element={<ProtectedRoute allow={['commuter']}><CommuterHome /></ProtectedRoute>} />
          <Route path="/driver" element={<ProtectedRoute allow={['driver']}><DriverDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute allow={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute allow={['commuter', 'driver', 'admin']}><Profile /></ProtectedRoute>} />
          <Route path="/faq" element={<ProtectedRoute allow={['commuter', 'driver', 'admin']}><Faq /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}