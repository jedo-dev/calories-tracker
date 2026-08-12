import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
//@ts-ignore
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';
import { pageBackground } from '../theme/styles';
import { useTheme } from '../theme/useTheme';
import {
  IconBell,
  IconCalendar,
  IconChevronRight,
  IconClub,
  IconDish,
  IconDumbbell,
  IconLogout,
  IconRuler,
  IconScale,
  IconSearch,
  IconSettings,
  IconSparkles,
  IconTemplate,
  IconTrophy,
} from '../ui/navIcons';

interface MenuRow {
  icon: React.ReactNode;
  /** Цвет тонировки кружка с иконкой (акцент группы). */
  tint: string;
  label: string;
  /** Актуальное значение справа («80 кг») — ускоряет сканирование списка. */
  value?: string;
  path?: string;
  onClick?: () => void;
  danger?: boolean;
}

interface MenuGroup {
  title: string;
  rows: MenuRow[];
}

const TINT = {
  diaries: '#53D46B',
  nutrition: '#4DA3FF',
  club: '#FFC24B',
  ai: '#A78BFA',
  neutral: '#94A3B8',
  danger: '#FF8A8A',
};

function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/**
 * Экран «Ещё» — каталог всех разделов приложения сгруппированным списком.
 * Заменяет сетку из 12 одинаковых плиток в старом выпадающем меню.
 */
export function MenuPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [weightKg, setWeightKg] = useState<number | null>(null);

  useEffect(() => {
    apiClient
      .get('/weight/latest')
      .then((res: any) => {
        if (typeof res?.data?.weightKg === 'number') setWeightKg(res.data.weightKg);
      })
      .catch(() => {});
  }, []);

  const isTrainer = user?.role === 'admin' || user?.role === 'trainer';

  const groups: MenuGroup[] = [
    {
      title: t('menu.diaries'),
      rows: [
        {
          icon: <IconScale size={20} />,
          tint: TINT.diaries,
          label: t('weight.title'),
          value: weightKg != null ? `${weightKg} кг` : undefined,
          path: '/weight',
        },
        { icon: <IconRuler size={20} />, tint: TINT.diaries, label: t('measurement.title'), path: '/measurements' },
        { icon: <IconDumbbell size={20} />, tint: TINT.diaries, label: t('workout.title'), path: '/workouts' },
      ],
    },
    {
      title: t('menu.nutrition'),
      rows: [
        { icon: <IconDish size={20} />, tint: TINT.nutrition, label: t('recipes.title'), path: '/recipes' },
        { icon: <IconCalendar size={20} />, tint: TINT.nutrition, label: t('mealPlan.title'), path: '/meal-plan' },
        { icon: <IconTemplate size={20} />, tint: TINT.nutrition, label: t('template.title'), path: '/templates' },
        { icon: <IconSearch size={20} />, tint: TINT.nutrition, label: t('products.title'), path: '/products' },
      ],
    },
    {
      title: t('menu.club'),
      rows: [
        { icon: <IconBell size={20} />, tint: TINT.club, label: t('feed.title'), path: '/feed' },
        { icon: <IconClub size={20} />, tint: TINT.club, label: t('friends.title'), path: '/friends' },
        { icon: <IconTrophy size={20} />, tint: TINT.club, label: t('achievements.title'), path: '/achievements' },
      ],
    },
    {
      title: t('menu.account'),
      rows: [
        { icon: <IconSettings size={20} />, tint: TINT.neutral, label: t('menu.settingsGoal'), path: '/profile' },
        { icon: <IconSparkles size={20} />, tint: TINT.ai, label: t('menu.aiLimits'), path: '/ai-limits' },
        ...(isTrainer
          ? [{ icon: <IconDumbbell size={20} />, tint: TINT.neutral, label: t('workout.adminTitle'), path: '/admin/workouts' } satisfies MenuRow]
          : []),
        {
          icon: <IconLogout size={20} />,
          tint: TINT.danger,
          label: t('auth.logout'),
          danger: true,
          onClick: () => {
            logout();
            navigate('/login');
          },
        },
      ],
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        maxWidth: '520px',
        margin: '0 auto',
        padding: '12px',
        paddingBottom: '100px',
        background: pageBackground(theme.palette.bg),
      }}
    >
      <h1
        style={{
          color: theme.palette.text,
          fontSize: theme.typography.h1.fontSize,
          fontWeight: theme.typography.h1.fontWeight,
          margin: '8px 4px 16px',
        }}
      >
        {t('menu.title')}
      </h1>

      {groups.map((group) => (
        <section key={group.title} style={{ marginBottom: '18px' }}>
          <div
            style={{
              color: theme.palette.textMuted,
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              margin: '0 4px 8px',
            }}
          >
            {group.title}
          </div>
          <div
            style={{
              borderRadius: '20px',
              background: 'linear-gradient(180deg, rgba(17, 49, 69, 0.94), rgba(10, 32, 46, 0.94))',
              border: '1px solid rgba(160, 200, 220, 0.18)',
              overflow: 'hidden',
            }}
          >
            {group.rows.map((row, i) => (
              <button
                key={row.label}
                type="button"
                onClick={row.onClick ?? (() => navigate(row.path!))}
                style={{
                  width: '100%',
                  minHeight: '52px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 14px',
                  background: 'none',
                  border: 'none',
                  borderTop: i > 0 ? '1px solid rgba(160, 200, 220, 0.10)' : 'none',
                  color: row.danger ? TINT.danger : theme.palette.text,
                  fontSize: '15px',
                  fontWeight: 600,
                  textAlign: 'left',
                  cursor: 'pointer',
                  outline: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    color: row.tint,
                    background: hexToRgba(row.tint, 0.14),
                  }}
                >
                  {row.icon}
                </span>
                <span style={{ flex: 1 }}>{row.label}</span>
                {row.value && (
                  <span style={{ color: theme.palette.textMuted, fontSize: '14px', fontWeight: 500 }}>
                    {row.value}
                  </span>
                )}
                {!row.danger && (
                  <span style={{ color: theme.palette.textMuted, display: 'flex', opacity: 0.7 }}>
                    <IconChevronRight size={18} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      ))}

      <div
        style={{
          color: theme.palette.textMuted,
          fontSize: theme.typography.small.fontSize,
          textAlign: 'center',
        }}
      >
        version: {__APP_VERSION__}
      </div>
      <div
        style={{
          color: theme.palette.textMuted,
          fontSize: '11px',
          textAlign: 'center',
          marginTop: '4px',
          opacity: 0.7,
        }}
      >
        Иллюстрации упражнений: wger.de (CC BY-SA)
      </div>
    </div>
  );
}
