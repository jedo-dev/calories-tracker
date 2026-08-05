import classic from '../assets/avatars/png/01_classic_256.png';
import wink from '../assets/avatars/png/02_wink_256.png';
import headband from '../assets/avatars/png/03_headband_256.png';
import happyCream from '../assets/avatars/png/04_happy_cream_256.png';
import capGreen from '../assets/avatars/png/05_cap_green_256.png';
import cheekyOrange from '../assets/avatars/png/06_cheeky_orange_256.png';

// Связка "эмодзи в БД (user.avatarEmoji) → картинка аватара"
export const AVATARS = [
  { key: 'classic', emoji: '🦊', image: classic },
  { key: 'wink', emoji: '😉', image: wink },
  { key: 'headband', emoji: '💪', image: headband },
  { key: 'happy_cream', emoji: '😊', image: happyCream },
  { key: 'cap_green', emoji: '🧢', image: capGreen },
  { key: 'cheeky_orange', emoji: '😜', image: cheekyOrange },
] as const;

export type AvatarOption = (typeof AVATARS)[number];
export type AvatarEmoji = AvatarOption['emoji'];

const IMAGE_BY_EMOJI: Record<string, string> = Object.fromEntries(
  AVATARS.map((a) => [a.emoji, a.image]),
);

// null — эмодзи не из каталога, рендерим его как текст (обратная совместимость)
export function avatarImage(emoji?: string | null): string | null {
  if (!emoji) return IMAGE_BY_EMOJI['🦊'];
  return IMAGE_BY_EMOJI[emoji] || null;
}
