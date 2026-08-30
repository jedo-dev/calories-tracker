import { useNavigate } from 'react-router-dom';
import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { BottomSheet } from '../../ui/BottomSheet';
import { Text } from '../../ui/Text';
import { MUSCLES, MuscleSlug } from './muscleData';

export interface MuscleExercise {
  _id: string;
  name: string;
  categoryId?: string;
  difficulty?: string;
}

interface MuscleSheetProps {
  slug: MuscleSlug | null;
  /** Уникальные дни тренировок этой мышцы за 30 дней */
  trainedDays: string[];
  exercises: MuscleExercise[];
  onClose: () => void;
}

const MAX_EXERCISES = 8;

const statBox: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: '10px 12px',
  borderRadius: '14px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(160, 200, 220, 0.16)',
};

function formatDay(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

// Карточка группы мышц: описание, статистика пользователя за 30 дней
// и упражнения из каталога, которые её задействуют.
export function MuscleSheet({ slug, trainedDays, exercises, onClose }: MuscleSheetProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const info = slug ? MUSCLES[slug] : null;

  const lastDay = trainedDays.length > 0 ? [...trainedDays].sort().pop()! : null;
  const shown = exercises.slice(0, MAX_EXERCISES);

  return (
    <BottomSheet isOpen={slug !== null} onClose={onClose}>
      {info && (
        <div style={{ padding: '4px 16px 28px', maxWidth: '520px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
            <Text variant="h2" bold>{info.name}</Text>
            <Text variant="small" muted style={{ fontStyle: 'italic' }}>{info.latin}</Text>
          </div>
          <Text variant="small" muted style={{ display: 'block', marginTop: '6px', lineHeight: 1.45 }}>
            {info.description}
          </Text>

          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <div style={statBox}>
              <span style={{ fontSize: '20px', fontWeight: 800, color: theme.palette.primary }}>
                {trainedDays.length}
              </span>
              <Text variant="small" muted style={{ display: 'block', marginTop: '2px' }}>
                {t('muscles.statTrainings')}
              </Text>
            </div>
            <div style={statBox}>
              <span style={{ fontSize: '20px', fontWeight: 800, color: lastDay ? theme.palette.text : theme.palette.textMuted }}>
                {lastDay ? formatDay(lastDay) : '—'}
              </span>
              <Text variant="small" muted style={{ display: 'block', marginTop: '2px' }}>
                {t('muscles.statLast')}
              </Text>
            </div>
          </div>

          <Text bold style={{ display: 'block', margin: '16px 0 8px' }}>
            {t('muscles.exercisesTitle')}
          </Text>
          {shown.length === 0 ? (
            <Text variant="small" muted>{t('muscles.noExercises')}</Text>
          ) : (
            shown.map((ex) => (
              <button
                key={ex._id}
                type="button"
                onClick={() => {
                  onClose();
                  if (ex.categoryId) navigate(`/workout/category/${ex.categoryId}`);
                  else navigate('/workouts');
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  padding: '11px 12px',
                  marginBottom: '6px',
                  borderRadius: '14px',
                  border: '1px solid rgba(160, 200, 220, 0.16)',
                  background: 'rgba(255,255,255,0.05)',
                  color: theme.palette.text,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ex.name}
                </span>
                <span style={{ color: theme.palette.textMuted, flexShrink: 0 }}>›</span>
              </button>
            ))
          )}

          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/workouts');
            }}
            style={{
              width: '100%',
              height: '48px',
              marginTop: '12px',
              borderRadius: '16px',
              border: `1px solid ${theme.palette.primary}55`,
              background: theme.palette.primary + '1f',
              color: theme.palette.primary,
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {t('muscles.toWorkouts')}
          </button>
        </div>
      )}
    </BottomSheet>
  );
}
