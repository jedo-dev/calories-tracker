import { useEffect, useState } from 'react';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { stopTour, subscribeTour, tourEvent, type TourState } from './tour';

type Rect = { top: number; left: number; width: number; height: number };

// Оверлей тура: рамка-подсветка вокруг элемента текущего шага и тултип с
// пояснением. Клики не перехватывает (pointerEvents: none у подсветки) —
// пользователь выполняет реальные действия в приложении. Позиция якоря
// поллится: элементы появляются асинхронно (роутинг, загрузка данных),
// а на iOS тултип должен переезжать при скролле и открытии клавиатуры.
export function TourOverlay() {
  const theme = useTheme();
  const [tour, setTour] = useState<TourState | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => subscribeTour((s) => setTour(s ? { ...s } : null)), []);

  const step = tour ? tour.scenario.steps[tour.stepIndex] : null;
  const anchor = step?.anchor;

  useEffect(() => {
    if (!anchor) {
      setRect(null);
      return;
    }
    let scrolled = false;
    const tick = () => {
      const el = document.querySelector(`[data-tour="${anchor}"]`);
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      if (!scrolled) {
        scrolled = true;
        // Прокручиваем только если элемент вне видимой области
        if (r.top < 0 || r.bottom > window.innerHeight) {
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }
      setRect((prev) =>
        prev &&
        Math.abs(prev.top - r.top) < 1 &&
        Math.abs(prev.left - r.left) < 1 &&
        Math.abs(prev.width - r.width) < 1 &&
        Math.abs(prev.height - r.height) < 1
          ? prev
          : { top: r.top, left: r.left, width: r.width, height: r.height },
      );
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [anchor, tour?.stepIndex]);

  if (!tour || !step) return null;

  const totalSteps = tour.scenario.steps.length;

  // Финальный шаг без якоря — карточка по центру с кнопкой завершения
  if (!anchor) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1300,
          background: 'rgba(3, 12, 20, 0.72)',
          display: 'grid',
          placeItems: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '360px',
            borderRadius: '22px',
            background: 'linear-gradient(180deg, rgba(17, 49, 69, 0.99), rgba(10, 32, 46, 0.99))',
            border: '1px solid rgba(160, 200, 220, 0.22)',
            padding: '22px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '34px', marginBottom: '8px' }}>🎉</div>
          <div style={{ fontSize: '15px', color: theme.palette.text, lineHeight: 1.45, marginBottom: '16px' }}>
            {t(step.textKey)}
          </div>
          <button
            type="button"
            onClick={() => tourEvent(step.advanceOn)}
            style={{
              width: '100%',
              height: '48px',
              borderRadius: '16px',
              border: 'none',
              background: 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))',
              color: '#07210f',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {t('tour.done')}
          </button>
        </div>
      </div>
    );
  }

  // Тултип прижат к противоположному от якоря краю экрана: вплотную к якорю
  // нельзя — под поиском, например, выпадает список результатов, и тултип его
  // загораживал. Якорь в верхней половине → тултип внизу над навигацией.
  // Якорь пропал (например, закрылся шит) → наверх: снизу живут bottom-sheet'ы
  // с кнопками подтверждения.
  const anchorInTopHalf = rect ? rect.top + rect.height / 2 < window.innerHeight / 2 : false;
  const tooltipPos: React.CSSProperties = anchorInTopHalf
    ? { bottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }
    : { top: 'calc(12px + env(safe-area-inset-top, 0px))' };

  return (
    <>
      <style>{`@keyframes tour-pulse {
        0%, 100% { box-shadow: 0 0 0 4px rgba(83, 212, 107, 0.18), 0 0 22px rgba(83, 212, 107, 0.35); }
        50% { box-shadow: 0 0 0 9px rgba(83, 212, 107, 0.10), 0 0 30px rgba(83, 212, 107, 0.5); }
      }`}</style>

      {rect && (
        <>
          {/* Затемнение всего, кроме якоря: вырез тем же box-shadow-приёмом,
              что и в сканере штрих-кодов. Клики не блокирует. */}
          <div
            style={{
              position: 'fixed',
              top: `${rect.top - 5}px`,
              left: `${rect.left - 5}px`,
              width: `${rect.width + 10}px`,
              height: `${rect.height + 10}px`,
              borderRadius: '18px',
              boxShadow: '0 0 0 9999px rgba(3, 12, 20, 0.55)',
              pointerEvents: 'none',
              zIndex: 1299,
              transition: 'top 200ms ease, left 200ms ease, width 200ms ease, height 200ms ease',
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: `${rect.top - 5}px`,
              left: `${rect.left - 5}px`,
              width: `${rect.width + 10}px`,
              height: `${rect.height + 10}px`,
              borderRadius: '18px',
              border: `2px solid ${theme.palette.primary}`,
              animation: 'tour-pulse 1.8s ease-in-out infinite',
              pointerEvents: 'none',
              zIndex: 1300,
              transition: 'top 200ms ease, left 200ms ease, width 200ms ease, height 200ms ease',
            }}
          />
        </>
      )}

      {/* pointerEvents: none — тултип не должен проглатывать клики по элементам
          под ним (кнопки bottom-sheet'ов); кликабелен только «Пропустить» */}
      <div
        style={{
          position: 'fixed',
          left: '12px',
          right: '12px',
          maxWidth: '456px',
          margin: '0 auto',
          zIndex: 1301,
          borderRadius: '18px',
          background: 'linear-gradient(180deg, rgba(17, 49, 69, 0.99), rgba(10, 32, 46, 0.99))',
          border: '1px solid rgba(160, 200, 220, 0.28)',
          boxShadow: '0 14px 34px rgba(0, 0, 0, 0.45)',
          padding: '14px 16px',
          pointerEvents: 'none',
          ...tooltipPos,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: theme.palette.primary }}>
            {t('tour.stepCounter', { current: tour.stepIndex + 1, total: totalSteps })}
          </span>
          <button
            type="button"
            onClick={() => stopTour(false)}
            style={{
              background: 'none',
              border: 'none',
              color: theme.palette.textMuted,
              fontSize: '12px',
              cursor: 'pointer',
              padding: '4px',
              pointerEvents: 'auto',
            }}
          >
            {t('tour.skip')}
          </button>
        </div>
        <div style={{ fontSize: '14px', color: theme.palette.text, lineHeight: 1.45 }}>
          {t(step.textKey)}
        </div>
        {step.next && (
          <button
            type="button"
            onClick={() => tourEvent(step.advanceOn)}
            style={{
              marginTop: '12px',
              width: '100%',
              height: '42px',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))',
              color: '#07210f',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              pointerEvents: 'auto',
            }}
          >
            {tour.stepIndex >= totalSteps - 1 ? t('tour.done') : t('tour.next')}
          </button>
        )}
      </div>
    </>
  );
}
