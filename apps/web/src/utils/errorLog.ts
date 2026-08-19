// Кольцевой буфер последних ошибок фронта. Импортируется в main.tsx ради
// side-effect (глобальные обработчики), содержимое прикладывается к письму
// фидбека — дешёвая замена Sentry на старте.

const MAX_ENTRIES = 20;
const MAX_LEN = 400;

const buffer: string[] = [];

function push(kind: string, text: string) {
  const time = new Date().toISOString().slice(11, 19);
  buffer.push(`[${time}] ${kind}: ${text}`.slice(0, MAX_LEN));
  if (buffer.length > MAX_ENTRIES) buffer.shift();
}

/** Упавший API-запрос — вызывается из интерсептора apiClient */
export function logApiError(method: string, url: string, status: number | string, message: string) {
  push('api', `${method.toUpperCase()} ${url} → ${status}: ${message}`);
}

export function getErrorLog(): string[] {
  return [...buffer];
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    push('js', `${e.message} (${e.filename?.split('/').pop() || '?'}:${e.lineno})`);
  });
  window.addEventListener('unhandledrejection', (e) => {
    const reason: any = e.reason;
    push('promise', reason?.message || String(reason));
  });
}
