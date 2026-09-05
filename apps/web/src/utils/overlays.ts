import { useEffect, useState } from 'react';

// Координация полноэкранных всплывашек (гайд установки PWA, тур): чтобы одно
// не показывалось поверх другого. Гайд «занимает» экран с момента, когда решил
// показаться (включая паузу перед появлением), и до ответа пользователя.
let installGuideBusy = false;
const listeners = new Set<(busy: boolean) => void>();

export function setInstallGuideBusy(busy: boolean): void {
  if (installGuideBusy === busy) return;
  installGuideBusy = busy;
  listeners.forEach((fn) => fn(busy));
}

export function isInstallGuideBusy(): boolean {
  return installGuideBusy;
}

export function useInstallGuideBusy(): boolean {
  const [busy, setBusy] = useState(installGuideBusy);
  useEffect(() => {
    listeners.add(setBusy);
    return () => {
      listeners.delete(setBusy);
    };
  }, []);
  return busy;
}
