import { useEffect, useState } from 'react';

// Лёгкий глобальный тост вместо браузерного alert().
// Использование: showToast('Текст'), showToast('Готово', 'success').

type ToastType = 'error' | 'success';
interface ToastData {
  id: number;
  message: string;
  type: ToastType;
}

let nextId = 1;
let listener: ((toast: ToastData) => void) | null = null;

export function showToast(message: string, type: ToastType = 'error'): void {
  listener?.({ id: nextId++, message, type });
}

/** Монтируется один раз в App. */
export function ToastHost() {
  const [toast, setToast] = useState<ToastData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    let clearTimer: ReturnType<typeof setTimeout> | null = null;
    listener = (t) => {
      if (hideTimer) clearTimeout(hideTimer);
      if (clearTimer) clearTimeout(clearTimer);
      setToast(t);
      setVisible(true);
      hideTimer = setTimeout(() => setVisible(false), 3000);
      clearTimer = setTimeout(() => setToast(null), 3350);
    };
    return () => {
      listener = null;
      if (hideTimer) clearTimeout(hideTimer);
      if (clearTimer) clearTimeout(clearTimer);
    };
  }, []);

  if (!toast) return null;

  const isError = toast.type === 'error';
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: '92px', // над нижней навигацией
        transform: `translateX(-50%) translateY(${visible ? 0 : 12}px)`,
        opacity: visible ? 1 : 0,
        transition: 'opacity 250ms ease, transform 250ms ease',
        // Выше нижней панели (100) и bottom-sheet'ов (120): тост о записанной
        // воде показывается, пока лист быстрых действий ещё закрывается.
        zIndex: 130,
        maxWidth: 'min(440px, calc(100vw - 32px))',
        padding: '11px 16px',
        borderRadius: '14px',
        background: isError
          ? 'linear-gradient(180deg, rgba(80, 26, 26, 0.97), rgba(56, 16, 16, 0.97))'
          : 'linear-gradient(180deg, rgba(20, 62, 34, 0.97), rgba(12, 44, 24, 0.97))',
        border: `1px solid ${isError ? 'rgba(255, 138, 138, 0.45)' : 'rgba(83, 212, 107, 0.45)'}`,
        boxShadow: '0 14px 30px rgba(0, 0, 0, 0.4)',
        color: isError ? '#ffb4b4' : '#8fe8a4',
        fontSize: '13px',
        fontWeight: 600,
        lineHeight: 1.35,
        pointerEvents: 'none',
        textAlign: 'center',
      }}
    >
      {toast.message}
    </div>
  );
}
