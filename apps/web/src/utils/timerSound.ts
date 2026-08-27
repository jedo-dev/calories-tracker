// Звуковой сигнал окончания таймера (Web Audio, без аудио-файлов).
// iOS/Android разрешают звук только после жеста пользователя, поэтому
// контекст создаётся и разблокируется в unlockTimerSound() — её нужно
// вызывать из обработчика клика, запускающего таймер.
let ctx: AudioContext | null = null;

export function unlockTimerSound() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    // Web Audio недоступен — таймер просто останется беззвучным
  }
}

export function playTimerFinishSound() {
  if (!ctx || ctx.state !== 'running') return;
  try {
    const now = ctx.currentTime;
    // Три коротких бипа
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      const t0 = now + i * 0.22;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.3, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.2);
    }
  } catch {
    // звук — необязательная фича, ошибки глотаем
  }
}
