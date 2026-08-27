import { useEffect, useRef } from 'react';

// Держит Screen Wake Lock, пока active=true, чтобы экран не гас
// (тренировка, таймеры). Система отпускает лок при сворачивании вкладки —
// при возврате берём заново.
export function useWakeLock(active: boolean) {
  const lockRef = useRef<{ release?: () => Promise<void> } | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    const acquire = async () => {
      try {
        const lock = await (navigator as unknown as {
          wakeLock?: { request: (type: 'screen') => Promise<{ release?: () => Promise<void> }> };
        }).wakeLock?.request('screen');
        if (cancelled) {
          void lock?.release?.().catch(() => {});
        } else {
          lockRef.current = lock ?? null;
        }
      } catch {
        // Wake Lock не поддержан или запрещён — экран будет гаснуть как обычно
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') void acquire();
    };

    void acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void lockRef.current?.release?.().catch(() => {});
      lockRef.current = null;
    };
  }, [active]);
}
