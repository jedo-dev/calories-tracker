/**
 * Safe wrapper for Telegram.WebApp.HapticFeedback
 * Silently fails if Telegram.WebApp is not available
 */

export function hapticImpact(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light'): void {
  try {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback?.impactOccurred) {
      tg.HapticFeedback.impactOccurred(style);
    }
  } catch (e) {
    // Silently fail if Telegram.WebApp is not available
  }
}

export function hapticSelectionChanged(): void {
  try {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback?.selectionChanged) {
      tg.HapticFeedback.selectionChanged();
    }
  } catch (e) {
    // Silently fail if Telegram.WebApp is not available
  }
}

export function hapticNotification(type: 'error' | 'success' | 'warning' = 'success'): void {
  try {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback?.notificationOccurred) {
      tg.HapticFeedback.notificationOccurred(type);
    }
  } catch (e) {
    // Silently fail if Telegram.WebApp is not available
  }
}
