import { apiClient } from '../api/client';

// Лёгкий продуктовый трекер: события копятся в очереди и уходят батчем раз в
// 15 секунд или при сворачивании вкладки. Ошибки отправки игнорируются —
// аналитика никогда не должна мешать работе приложения.

interface QueuedEvent {
  name: string;
  ts: string;
  props?: Record<string, any>;
}

const FLUSH_INTERVAL_MS = 15_000;
const MAX_QUEUE = 50;

let queue: QueuedEvent[] = [];
let timer: number | null = null;

function hasAuth(): boolean {
  return !!localStorage.getItem('token');
}

async function flush(useBeacon = false) {
  if (!queue.length || !hasAuth()) return;
  const events = queue.splice(0, MAX_QUEUE);
  const url = `${apiClient.defaults.baseURL}/analytics/events`;
  try {
    if (useBeacon) {
      // При закрытии вкладки axios не успевает — шлём fetch с keepalive
      await fetch(url, {
        method: 'POST',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ events }),
      });
    } else {
      await apiClient.post('/analytics/events', { events });
    }
  } catch {
    // Не возвращаем события в очередь: потерять пару событий дешевле,
    // чем зациклиться на нерабочем эндпоинте
  }
}

export function track(name: string, props?: Record<string, any>) {
  if (!hasAuth()) return;
  if (queue.length >= MAX_QUEUE) queue.shift();
  queue.push({ name, ts: new Date().toISOString(), props });
  if (timer == null) {
    timer = window.setTimeout(() => {
      timer = null;
      void flush();
    }, FLUSH_INTERVAL_MS);
  }
}

// Динамические сегменты путей схлопываем, чтобы дашборд не тонул в id
export function normalizePath(pathname: string): string {
  return pathname
    .split('/')
    .map((seg) => (/^[0-9a-f]{24}$/i.test(seg) || /^\d+$/.test(seg) ? ':id' : seg))
    .join('/') || '/';
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') void flush(true);
});
