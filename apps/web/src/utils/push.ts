import { apiClient } from '../api/client';

// Хелперы подписки на Web Push. Разрешение браузера запрашивается ТОЛЬКО из
// subscribeToPush — то есть только после явного действия пользователя
// (тумблер в профиле), никогда при загрузке страницы.

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type SubscribeResult = 'ok' | 'denied' | 'unsupported' | 'error';

export async function subscribeToPush(): Promise<SubscribeResult> {
  if (!isPushSupported()) return 'unsupported';
  try {
    const { data } = await apiClient.get('/notifications/public-key');
    if (!data?.key) return 'error';

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return 'denied';

    const registration = await navigator.serviceWorker.ready;
    const subscription =
      (await registration.pushManager.getSubscription()) ||
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.key),
      }));

    await apiClient.post('/notifications/subscribe', {
      subscription: subscription.toJSON(),
      tzOffsetMinutes: new Date().getTimezoneOffset(),
      userAgent: navigator.userAgent,
    });
    return 'ok';
  } catch {
    return 'error';
  }
}

/** Отписывает текущий браузер и сообщает серверу. */
export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await apiClient.delete('/notifications/subscribe', {
        data: { endpoint: subscription.endpoint },
      });
      await subscription.unsubscribe();
    }
  } catch {
    // Даже если браузерная отписка упала, сервер больше не будет слать пуши
  }
}
