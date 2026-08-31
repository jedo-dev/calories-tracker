import { useEffect, useRef, useState } from 'react';

/**
 * Сглаживает мигание лоадера на быстрых запросах — та же идея, что у
 * полноэкранного оверлея в ui/Loader.tsx: показ с задержкой (мгновенные
 * ответы вообще не показывают лоадер), затем минимум minVisible на экране
 * и плавное угасание за fadeMs.
 */
export function useSmoothLoader(
  loading: boolean,
  { showDelay = 150, minVisible = 600, fadeMs = 280 } = {},
) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const shownAt = useRef(0);

  useEffect(() => {
    if (loading) {
      setFading(false);
      if (!visible) {
        const t = setTimeout(() => {
          shownAt.current = Date.now();
          setVisible(true);
        }, showDelay);
        return () => clearTimeout(t);
      }
      return;
    }
    if (!visible) return;
    const wait = Math.max(0, minVisible - (Date.now() - shownAt.current));
    const t1 = setTimeout(() => setFading(true), wait);
    const t2 = setTimeout(() => {
      setVisible(false);
      setFading(false);
    }, wait + fadeMs);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [loading, visible, showDelay, minVisible, fadeMs]);

  return { visible, fading, fadeMs };
}
