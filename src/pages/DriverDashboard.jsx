import { useAuth } from '../context/AuthContext';
export default function DriverDashboard() {
  const { signOut } = useAuth();
  return (<div><h1>Driver dashboard</h1><button onClick={signOut}>Sign out</button></div>);
}