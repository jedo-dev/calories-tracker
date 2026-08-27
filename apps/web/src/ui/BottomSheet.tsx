import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '../theme/useTheme';
import { hapticImpact, hapticSelectionChanged } from '../utils/hapticFeedback';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  header?: ReactNode;
  handle?: ReactNode;
  background?: string;
}

// Открытый лист приподнят над нижней панелью: 80px — её базовая высота,
// env(safe-area-inset-bottom) — home-индикатор iPhone, иначе низ листа
// ложится поверх панели и обрезает иконки.
const SHEET_LIFT = 'calc(-80px - env(safe-area-inset-bottom, 0px))';

export function BottomSheet({ isOpen, onClose, children, header, handle, background }: BottomSheetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const theme = useTheme();
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef<number>(0);
  const dragCurrentY = useRef<number>(0);
  const dragStartTime = useRef<number>(0);
  const dragVelocity = useRef<number>(0);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalWidth = document.body.style.width;
      const scrollY = window.scrollY;

      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollY}px`;

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.width = originalWidth;
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Open/close animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });

      // Haptic feedback on open
      hapticImpact('light');
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsDragging(false);
      }, 260);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        hapticSelectionChanged();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleClose = () => {
    hapticSelectionChanged();
    onClose();
  };

  // Check if drag starts on header/handle area
  const isDragTarget = (target: EventTarget | null): boolean => {
    if (!target || !(target instanceof Node)) return false;
    // Кнопки в шапке (крестик и т.п.) должны получать обычный клик,
    // иначе тап по ним запускает drag и клик не срабатывает.
    if (target instanceof Element && target.closest('button, a, input, select, textarea, [role="button"]')) {
      return false;
    }
    return (
      headerRef.current?.contains(target) ||
      handleRef.current?.contains(target) ||
      false
    );
  };

  // Touch handlers for drag-to-dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isDragTarget(e.target)) return;

    const touch = e.touches[0];
    dragStartY.current = touch.clientY;
    dragCurrentY.current = 0;
    dragStartTime.current = Date.now();
    dragVelocity.current = 0;
    setIsDragging(true);

    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none';
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !sheetRef.current || !backdropRef.current) return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - dragStartY.current;

    // Only allow downward drag
    if (deltaY > 0) {
      dragCurrentY.current = deltaY;

      // Update sheet position
      sheetRef.current.style.transform = `translateY(calc(${deltaY}px + ${SHEET_LIFT}))`;

      // Update backdrop opacity (fade out as we drag down)
      const opacity = Math.max(0, 0.45 * (1 - deltaY / 300));
      backdropRef.current.style.opacity = String(opacity);

      // Calculate velocity
      const timeDelta = Date.now() - dragStartTime.current;
      if (timeDelta > 0) {
        dragVelocity.current = deltaY / timeDelta;
      }
    }

    e.preventDefault();
  };

  const handleTouchEnd = () => {
    if (!isDragging || !sheetRef.current || !backdropRef.current) return;

    const threshold = 80;
    const shouldClose =
      dragCurrentY.current > threshold ||
      dragVelocity.current > 0.5;

    if (shouldClose) {
      handleClose();
    } else {
      // Snap back
      sheetRef.current.style.transition = 'transform 200ms ease-out';
      sheetRef.current.style.transform = `translateY(${SHEET_LIFT})`;

      backdropRef.current.style.transition = 'opacity 200ms ease-out';
      backdropRef.current.style.opacity = '0.45';
    }

    setIsDragging(false);
    dragCurrentY.current = 0;
    dragVelocity.current = 0;
  };

  // Mouse handlers for desktop drag support
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDragTarget(e.target)) return;

    dragStartY.current = e.clientY;
    dragCurrentY.current = 0;
    dragStartTime.current = Date.now();
    dragVelocity.current = 0;
    setIsDragging(true);

    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none';
    }

    e.preventDefault();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !sheetRef.current || !backdropRef.current) return;

    const deltaY = e.clientY - dragStartY.current;

    if (deltaY > 0) {
      dragCurrentY.current = deltaY;
      sheetRef.current.style.transform = `translateY(calc(${deltaY}px + ${SHEET_LIFT}))`;

      const opacity = Math.max(0, 0.45 * (1 - deltaY / 300));
      backdropRef.current.style.opacity = String(opacity);

      const timeDelta = Date.now() - dragStartTime.current;
      if (timeDelta > 0) {
        dragVelocity.current = deltaY / timeDelta;
      }
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !sheetRef.current || !backdropRef.current) return;

    const threshold = 80;
    const shouldClose =
      dragCurrentY.current > threshold ||
      dragVelocity.current > 0.5;

    if (shouldClose) {
      handleClose();
    } else {
      sheetRef.current.style.transition = 'transform 200ms ease-out';
      sheetRef.current.style.transform = `translateY(${SHEET_LIFT})`;

      backdropRef.current.style.transition = 'opacity 200ms ease-out';
      backdropRef.current.style.opacity = '0.45';
    }

    setIsDragging(false);
    dragCurrentY.current = 0;
    dragVelocity.current = 0;
  }, [isDragging, handleClose]);

  // Mouse drag handlers (attach to window)
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isVisible) {
    return null;
  }

  const sheetTransform = isAnimating && !isDragging
    ? `translate3d(0, ${SHEET_LIFT}, 0)`
    : isDragging
      ? undefined
      : 'translate3d(0, 100%, 0)';

  const sheetTransition = isDragging
    ? 'none'
    : isAnimating
      ? 'transform 420ms cubic-bezier(0.22, 0.9, 0.24, 1)'
      : 'transform 260ms cubic-bezier(0.4, 0, 0.7, 1)';

  const backdropOpacity = isAnimating && !isDragging
    ? '0.45'
    : '0';

  const backdropTransition = isDragging
    ? 'none'
    : 'opacity 420ms cubic-bezier(0.22, 0.9, 0.24, 1)';

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={handleClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 110,
          backgroundColor: 'rgba(15, 12, 12, 0.45)',
          opacity: backdropOpacity,
          transition: backdropTransition,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        style={{
          position: 'fixed',
          left: 0,
          width: '100%',
          maxHeight: '80%',
          bottom: 0,
          background: background ?? theme.palette.surface,
          borderTopLeftRadius: theme.radius.lg,
          borderTopRightRadius: theme.radius.lg,
          transform: sheetTransform,
          transition: sheetTransition,
          willChange: 'transform',
          // Выше нижней панели (z-index: 100): раньше футер лежал поверх
          // листа и перекрывал его нижние кнопки.
          zIndex: 120,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          boxShadow: theme.shadow.md,
          WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
        }}
      >
        {/* Handle */}
        {handle && (
          <div ref={handleRef} style={{ touchAction: 'none', userSelect: 'none' }}>
            {handle}
          </div>
        )}

        {/* Header */}
        {header && (
          <div ref={headerRef} style={{ touchAction: 'none', userSelect: 'none' }}>
            {header}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </>
  );
}
