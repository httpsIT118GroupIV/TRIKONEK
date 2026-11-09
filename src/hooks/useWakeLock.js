import { useEffect } from 'react';

export default function useWakeLock(active) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock = null;
    let cancelled = false;

    const request = async () => {
      try { lock = await navigator.wakeLock.request('screen'); } catch { /* ignore */ }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !cancelled) request();
    };

    request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      try { lock?.release()?.catch(() => {}); } catch { /* ignore */ }
    };
  }, [active]);
}