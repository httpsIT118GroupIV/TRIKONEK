import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function useProfile() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('users')
      .select('id, username, email, role, full_name, phone')
      .eq('id', userId)
      .single();
    setProfile(data ?? null);
    setLoading(false);
  }, [userId]);

  useEffect(() => { reload(); }, [reload]);

  return { profile, loading, reload };
}