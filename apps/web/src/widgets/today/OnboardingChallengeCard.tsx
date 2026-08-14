import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { glassCardStyle } from '../../theme/styles';

interface OnboardingChallengeCardProps {
  currentStreak: number;
  bestStreak: number;
  hasEntriesToday: boolean;
}

// Челлендж «3 дня подряд» для новичков на главной. Ранняя цель с видимым
// прогрессом — самый дешёвый способ довести пользователя до привычки.
// Карточка исчезает сама, как только челлендж выполнен (bestStreak >= 3).
export function OnboardingChallengeCard({
  currentStreak,
  bestStreak,
  hasEntriesToday,
}: OnboardingChallengeCardProps) {
  const theme = useTheme();

  if (bestStreak >= 3) return null;

  // Сегодняшняя запись уже двигает прогресс, даже если стрик ещё не пересчитан
  const progress = Math.min(3, Math.max(currentStreak, hasEntriesToday ? 1 : 0));

  return (
    <div style={{ ...glassCardStyle, marginBottom: theme.spacing.md }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontSize: '28px', flex: '0 0 auto' }}>🎯</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: theme.palette.text }}>
            {t('challenge.title')}
          </div>
          <div style={{ fontSize: '12px', color: theme.palette.textMuted, marginTop: '2px' }}>
            {t('challenge.desc')}
          </div>
        </div>
        <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#7BD98A' }}>
            {t('challenge.progress', { n: progress })}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: '8px',
              borderRadius: '4px',
              background:
                i < progress ? 'rgba(83, 212, 107, 0.85)' : 'rgba(160, 200, 220, 0.18)',
              transition: 'background .2s',
            }}
          />
        ))}
      </div>

      <div
        style={{
          fontSize: '12px',
          marginTop: '8px',
          color: hasEntriesToday ? '#7BD98A' : theme.palette.textMuted,
          fontWeight: hasEntriesToday ? 600 : 400,
        }}
      >
        {t(hasEntriesToday ? 'challenge.doneToday' : 'challenge.todoToday')}
      </div>
    </div>
  );
}
