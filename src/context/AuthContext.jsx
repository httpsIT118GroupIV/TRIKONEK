import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// May ilang segundong pagitan bago lumabas ang profile ng bagong user, kaya sinusubukan ulit
async function fetchRole(userId) {
  for (let i = 0; i < 4; i++) {
    const { data } = await supabase.from('users').select('role').eq('id', userId).maybeSingle();
    if (data?.role) return data.role;
    await new Promise((r) => setTimeout(r, 400));
  }
  return null;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true); // true hanggang alam na ang session AT role
  const currentUser = useRef(null);

  useEffect(() => {
    async function apply(s) {
      if (!s) {
        currentUser.current = null;
        setSession(null);
        setRole(null);
        setLoading(false);
        return;
      }
      // Parehong user lang (hal. token refresh): huwag nang i-reload ang role
      if (currentUser.current === s.user.id) {
        setSession(s);
        return;
      }
      currentUser.current = s.user.id;
      setLoading(true);
      setSession(s);
      const r = await fetchRole(s.user.id);
      setRole(r);
      setLoading(false);
    }

    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setTimeout(() => apply(s), 0); // iwas sa await mismo sa loob ng callback
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ session, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}