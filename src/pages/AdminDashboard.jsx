import { useAuth } from '../context/AuthContext';
export default function AdminDashboard() {
  const { signOut } = useAuth();
  return (<div><h1>Admin dashboard</h1><button onClick={signOut}>Sign out</button></div>);
}