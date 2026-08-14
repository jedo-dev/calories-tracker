/* Сервис-воркер FlareonFit: приём Web Push и открытие приложения по клику.
   Кэширования здесь нет — только уведомления. */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'FlareonFit', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'FlareonFit';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      // tag схлопывает повторные уведомления одного типа в одно
      tag: data.tag || 'flareonfit',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Если приложение уже открыто — фокусируем вкладку и переходим по url
      for (const client of clients) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) client.navigate(url);
          return;
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
