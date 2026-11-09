let ctx;

// Tawagin sa loob ng click o tap ng driver (kailangan ng browser ito para payagan ang tunog)
export function unlockAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = ctx || new AC();
    if (ctx.state === 'suspended') ctx.resume();
  } catch { /* ignore */ }
}

// Dalawang beep at vibration
export function alertDriver() {
  try { navigator.vibrate?.([300, 150, 300]); } catch { /* ignore */ }
  try {
    if (!ctx) return;
    const t0 = ctx.currentTime;
    [0, 0.25].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, t0 + offset);
      gain.gain.exponentialRampToValueAtTime(0.4, t0 + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + offset + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0 + offset);
      osc.stop(t0 + offset + 0.22);
    });
  } catch { /* ignore */ }
}