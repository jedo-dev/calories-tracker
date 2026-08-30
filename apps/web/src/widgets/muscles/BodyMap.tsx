import { useTheme } from '../../theme/useTheme';
import { BODY_MODELS } from './bodyModel';
import type { MuscleSlug } from './muscleData';

export type BodyView = 'front' | 'back';
export type BodyGender = 'male' | 'female';

interface BodyMapProps {
  view: BodyView;
  gender: BodyGender;
  /** Интенсивность 0–3 по слагам (дней тренировок за период) */
  intensity: Partial<Record<MuscleSlug, number>>;
  selected: MuscleSlug | null;
  /** rect — положение нажатой мышцы на экране, для позиционирования тултипа */
  onSelect: (slug: MuscleSlug, rect: DOMRect) => void;
}

const INACTIVE_FILL = 'rgba(148, 190, 214, 0.13)';
const NEUTRAL_FILL = 'rgba(148, 190, 214, 0.07)';
// Тонкая обводка цвета фона отделяет соседние мышцы друг от друга
const SEPARATOR = 'rgba(8, 21, 35, 0.75)';
// Прозрачность акцента по интенсивности 1–3
const ALPHA = ['00', '55', '99', 'e6'];

// Анатомическая модель тела (react-native-body-highlighter, MIT), мужская
// или женская — по полу из профиля. Кликабельны только регионы с нашим
// слагом, остальное — силуэт.
export function BodyMap({ view, gender, intensity, selected, onSelect }: BodyMapProps) {
  const theme = useTheme();
  const model = BODY_MODELS[gender][view];

  return (
    <svg
      viewBox={model.viewBox}
      width="100%"
      style={{
        display: 'block',
        maxWidth: '270px',
        margin: '0 auto',
        // Убираем системную синюю подсветку тапа на мобильных
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
      }}
    >
      <path
        d={model.outline}
        fill="none"
        stroke="rgba(148, 190, 214, 0.4)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="butt"
      />

      {model.regions.map((region, index) => {
        if (!region.slug) {
          return (
            <g key={index} fill={NEUTRAL_FILL} stroke={SEPARATOR} strokeWidth="1">
              {region.paths.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
          );
        }

        const level = Math.max(0, Math.min(3, intensity[region.slug] || 0));
        const isSelected = selected === region.slug;
        // При выбранной мышце остальные приглушаем, чтобы она читалась
        const dimmed = selected !== null && !isSelected;
        const fill = level > 0 ? theme.palette.primary + ALPHA[level] : INACTIVE_FILL;
        return (
          <g
            key={index}
            fill={fill}
            opacity={dimmed ? 0.3 : 1}
            stroke={isSelected ? 'rgba(255,255,255,0.9)' : SEPARATOR}
            strokeWidth={isSelected ? 2.5 : 1}
            onClick={(e) => onSelect(region.slug as MuscleSlug, (e.currentTarget as SVGGElement).getBoundingClientRect())}
            style={{
              cursor: 'pointer',
              transition: 'fill 0.25s, opacity 0.25s',
              WebkitTapHighlightColor: 'transparent',
              outline: 'none',
            }}
          >
            {region.paths.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
