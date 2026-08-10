import type { CSSProperties } from 'react';

/**
 * Единая точка входа для кастомного набора иконок.
 *
 * Иконки многоцветные по задумке — их НЕЛЬЗЯ перекрашивать через currentColor
 * или CSS filter. SVG инлайнятся в бандл (никаких лишних запросов и мигания
 * при первой отрисовке).
 *
 * Источник — apps/web/src/assets/pack/svg/*.svg (viewBox 0 0 64 64).
 */

// Инлайн исходников SVG на этапе сборки. Ключ — имя файла без расширения.
const modules = import.meta.glob('../assets/pack/svg/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const REGISTRY: Record<string, string> = {};
for (const [path, raw] of Object.entries(modules)) {
  const name = path.split('/').pop()!.replace(/\.svg$/, '');
  REGISTRY[name] = raw;
}

export type IconName =
  | 'medal-gold'
  | 'medal-silver'
  | 'medal-bronze'
  | 'xp-bolt'
  | 'meal'
  | 'note'
  | 'workout'
  | 'water'
  | 'follow'
  | 'fire'
  | 'muscle'
  | 'clap'
  | 'trophy'
  | 'target'
  | 'streak'
  | 'cardio'
  | 'weight'
  | 'steps';

export interface IconProps {
  name: IconName;
  /** Оптический размер в px (сторона квадрата). По умолчанию 24. */
  size?: number;
  className?: string;
  style?: CSSProperties;
  /**
   * Если иконка несёт смысл и рядом нет текста (напр. кнопка-реакция без
   * подписи) — передай label, он станет aria-label + role="img".
   * По умолчанию иконка декоративная (aria-hidden).
   */
  label?: string;
}

export function Icon({ name, size = 24, className, style, label }: IconProps) {
  const raw = REGISTRY[name];
  if (!raw) {
    if (import.meta.env.DEV) console.warn(`Icon: unknown name "${name}"`);
    return null;
  }
  return (
    <span
      className={className ? `app-icon ${className}` : 'app-icon'}
      style={{ width: size, height: size, ...style }}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      dangerouslySetInnerHTML={{ __html: raw }}
    />
  );
}

/**
 * Маппинг emoji → имя иконки в одном месте.
 * Нужен там, где эмодзи приходит из данных/конфига (лента, реакции, бэкенд),
 * а не захардкожен в разметке.
 */
const EMOJI_TO_ICON: Record<string, IconName> = {
  '🥇': 'medal-gold',
  '🥈': 'medal-silver',
  '🥉': 'medal-bronze',
  '⚡': 'xp-bolt',
  '🍽': 'meal',
  '📝': 'note',
  '🏋': 'workout',
  '💧': 'water',
  '➕': 'follow',
  '🔥': 'fire',
  '💪': 'muscle',
  '👏': 'clap',
  // Не из основной карты замен, но иконка есть в наборе и эмодзи однозначно
  // ей соответствует — маппим для единообразия ленты/статистики.
  '🏆': 'trophy',
};

/** Возвращает имя иконки для эмодзи (без учёта variation selector) или null. */
export function iconNameForEmoji(emoji?: string | null): IconName | null {
  if (!emoji) return null;
  const key = emoji.replace(/️/g, ''); // убрать variation selector (🍽️ → 🍽)
  return EMOJI_TO_ICON[key] ?? null;
}

export interface EmojiIconProps {
  emoji?: string | null;
  size?: number;
  className?: string;
  style?: CSSProperties;
  label?: string;
}

/**
 * Рендерит кастомную иконку, если для эмодзи есть маппинг; иначе показывает
 * сам эмодзи как есть (для тех, у кого нет иконки в наборе).
 */
export function EmojiIcon({ emoji, size = 24, className, style, label }: EmojiIconProps) {
  const name = iconNameForEmoji(emoji);
  if (!name) {
    return (
      <span className={className} style={style} aria-hidden="true">
        {emoji}
      </span>
    );
  }
  return <Icon name={name} size={size} className={className} style={style} label={label} />;
}
