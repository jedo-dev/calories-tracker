// Установка PWA: детекция платформы и захват нативного события установки.
// Модуль импортируется в main.tsx ради side-effect: beforeinstallprompt
// стреляет один раз на раннем этапе загрузки, позже его уже не поймать.

let deferredPrompt: any = null;
let installed = false;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferredPrompt = null;
  });
}

/** Приложение уже открыто как установленное PWA */
export function isStandalone(): boolean {
  return (
    installed ||
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  );
}

export function isIOS(): boolean {
  const ua = navigator.userAgent;
  // iPadOS 13+ маскируется под Mac, но у Mac нет тач-экрана
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

export function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

/** iOS: установка возможна только из Safari */
export function isIOSSafari(): boolean {
  const ua = navigator.userAgent;
  return isIOS() && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser/.test(ua);
}

/** iOS: встроенный webview мессенджера/соцсети (Telegram, Instagram и т.п.) */
export function isIOSInAppBrowser(): boolean {
  if (!isIOS()) return false;
  const ua = navigator.userAgent;
  // Явные маркеры популярных приложений
  if (/Telegram|Instagram|FBAN|FBAV|VKApp|OKApp|Snapchat/i.test(ua)) return true;
  // WKWebView не добавляет токен Safari в UA, а сторонние браузеры
  // (Chrome, Firefox и т.д.) помечают себя своими маркерами
  return !/Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser/.test(ua);
}

export function hasNativeInstall(): boolean {
  return deferredPrompt !== null;
}

/** Android/Chrome: показывает системный диалог установки. true = установил. */
export async function promptNativeInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  const prompt = deferredPrompt;
  deferredPrompt = null;
  prompt.prompt();
  const choice = await prompt.userChoice.catch(() => ({ outcome: 'dismissed' }));
  return choice?.outcome === 'accepted';
}
