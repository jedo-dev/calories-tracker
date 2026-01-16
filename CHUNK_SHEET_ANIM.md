# CHUNK_SHEET_ANIM.md — Micro animations for Bottom Sheet (Command Center)

## Цель

Сделать красивую анимированную bottom sheet:

- spring-like open/close
- backdrop fade
- drag-to-dismiss (свайп вниз)
- haptics через Telegram.WebApp.HapticFeedback

## Реализация

1. Создать компонент: apps/web/src/ui/BottomSheet.tsx
2. Шторка:
   - открытие translateY(100%) -> 0 за 280ms, easing cubic-bezier(0.2,0.9,0.2,1)
   - закрытие 200ms ease-in
3. Backdrop:
   - fixed fullscreen, opacity 0 -> 0.45
   - клик по backdrop вызывает onClose
4. Drag-to-dismiss:
   - drag only on header/handle area
   - threshold: 80px (или velocity)
   - при drag менять transform и opacity backdrop
   - при отпускании: закрыть или вернуть обратно
5. Добавить:
   - Esc закрывает (для browser)
   - prevent body scroll when open (lock scroll)
6. Haptics:
   - open: impactOccurred('light')
   - close: selectionChanged()
   - primary actions в sheet: impactOccurred('medium')

## Интеграция

- Заменить текущую реализацию Command Center на BottomSheet.
- Сохранить текущий UI контент внутри.

## Acceptance

- Плавное открытие/закрытие
- Свайп вниз закрывает
- Нажатие снаружи закрывает
- Не ломает скролл внутри контента
