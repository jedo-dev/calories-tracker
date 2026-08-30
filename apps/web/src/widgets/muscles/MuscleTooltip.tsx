import { useNavigate } from 'react-router-dom';
import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { MUSCLES, MuscleSlug } from './muscleData';

export interface TooltipAnchor {
  /** Координаты нажатой мышцы относительно карточки с картой */
  x: number;
  top: number;
  bottom: number;
  /** Ширина карточки — для зажима тултипа по краям */
  containerWidth: number;
}

interface MuscleTooltipProps {
  slug: MuscleSlug;
  /** Уникальные дни тренировок этой мышцы за 30 дней */
  trainedDays: string[];
  /** Категория, куда ведёт ссылка «схожие упражнения» (доминирующая у мышцы) */
  categoryId: string | null;
  anchor: TooltipAnchor;
  onClose: () => void;
}

const WIDTH = 252;

function formatDay(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

// Компактный тултип поверх карты тела: висит над нажатой мышцей (или под
// ней, если мышца у верхнего края), layout страницы не двигает.
export function MuscleTooltip({ slug, trainedDays, categoryId, anchor, onClose }: MuscleTooltipProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const info = MUSCLES[slug];
  const lastDay = trainedDays.length > 0 ? [...trainedDays].sort().pop()! : null;

  const left = Math.max(6, Math.min(anchor.x - WIDTH / 2, anchor.containerWidth - WIDTH - 6));
  // Стрелка указывает на мышцу, даже когда тултип зажат у края
  const arrowX = Math.max(14, Math.min(anchor.x - left, WIDTH - 14));
  // Возле верхнего края (голова/плечи) показываем тултип под мышцей
  const below = anchor.top < 170;

  const arrowStyle: React.CSSProperties = {
    position: 'absolute',
    left: arrowX - 6,
    width: '12px',
    height: '12px',
    transform: 'rotate(45deg)',
    background: below ? 'rgba(18, 52, 72, 0.98)' : 'rgba(10, 32, 46, 0.98)',
    ...(below
      ? { top: '-6px', borderLeft: '1px solid rgba(160, 200, 220, 0.28)', borderTop: '1px solid rgba(160, 200, 220, 0.28)' }
      : { bottom: '-6px', borderRight: '1px solid rgba(160, 200, 220, 0.28)', borderBottom: '1px solid rgba(160, 200, 220, 0.28)' }),
  };

  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 5,
        width: `${WIDTH}px`,
        left: `${left}px`,
        ...(below
          ? { top: `${anchor.bottom + 10}px` }
          : { top: `${anchor.top - 10}px`, transform: 'translateY(-100%)' }),
        padding: '10px 12px',
        borderRadius: '14px',
        background: 'linear-gradient(180deg, rgba(18, 52, 72, 0.98), rgba(10, 32, 46, 0.98))',
        border: '1px solid rgba(160, 200, 220, 0.28)',
        boxShadow: '0 12px 26px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div style={arrowStyle} />

      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: theme.palette.text }}>{info.name}</span>
            <span style={{ fontSize: '11px', fontStyle: 'italic', color: theme.palette.textMuted, marginLeft: '6px' }}>
              {info.latin}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.cancel')}
            style={{
              background: 'none',
              border: 'none',
              color: theme.palette.textMuted,
              cursor: 'pointer',
              fontSize: '15px',
              lineHeight: 1,
              padding: '1px 3px',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ fontSize: '12px', lineHeight: 1.35, color: theme.palette.textMuted, marginTop: '4px' }}>
          {info.description}
        </div>

        <div style={{ fontSize: '12px', fontWeight: 600, color: theme.palette.text, marginTop: '6px' }}>
          <span style={{ color: theme.palette.primary, fontWeight: 800 }}>{trainedDays.length}</span>{' '}
          {t('muscles.statTrainings')}
          {lastDay && (
            <span style={{ color: theme.palette.textMuted }}> · {t('muscles.statLast')} {formatDay(lastDay)}</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => navigate(categoryId ? `/workout/category/${categoryId}` : '/workouts')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            marginTop: '8px',
            padding: 0,
            background: 'none',
            border: 'none',
            color: theme.palette.primary,
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {t('muscles.toExercises')}
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
