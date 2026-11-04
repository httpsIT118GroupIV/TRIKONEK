import { useAuth } from '../context/AuthContext';
export default function CommuterHome() {
  const { signOut } = useAuth();
  return (<div><h1>Commuter screen</h1><button onClick={signOut}>Sign out</button></div>);
}