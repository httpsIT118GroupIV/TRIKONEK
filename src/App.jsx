import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import CommuterHome from './pages/CommuterHome';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';

const HOME = { commuter: '/commuter', driver: '/driver', admin: '/admin' };

function RoleRedirect() {
  const { session, role, loading } = useAuth();
  if (loading) return <p>Loading…</p>;
  if (!session) return <Navigate to="/login" replace />;
  return <Navigate to={HOME[role] ?? '/login'} replace />;
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
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}