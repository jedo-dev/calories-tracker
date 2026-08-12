import { useLocation, useNavigate } from 'react-router-dom';
import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';

/**
 * Шапка раздела «Клуб»: общий заголовок + сегмент-переключатель
 * Лига / Лента / Друзья. Три соц. страницы остаются отдельными роутами,
 * но для пользователя выглядят табами одного раздела (слот «Клуб» в футере).
 */
export function ClubHeader() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const tabs = [
    { path: '/league', label: t('league.title') },
    { path: '/feed', label: t('feed.title') },
    { path: '/friends', label: t('friends.title') },
  ];

  return (
    <>
      <Text variant="h2" bold style={{ display: 'block', fontSize: '20px', marginBottom: '12px' }}>
        {t('nav.club')}
      </Text>

      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: '4px',
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(160, 200, 220, 0.14)',
          marginBottom: '14px',
        }}
      >
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.path);
          return (
            <button
              key={tab.path}
              type="button"
              // replace: переключение табов не должно наслаивать историю —
              // «назад» из Клуба ведёт на предыдущий раздел, а не по табам.
              onClick={() => { if (!active) navigate(tab.path, { replace: true }); }}
              aria-current={active ? 'page' : undefined}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '12px',
                border: 'none',
                background: active
                  ? `linear-gradient(180deg, ${theme.palette.primary}33, ${theme.palette.primary}1f)`
                  : 'none',
                color: active ? theme.palette.primary : theme.palette.textMuted,
                fontSize: '13px',
                fontWeight: 700,
                cursor: active ? 'default' : 'pointer',
                fontFamily: 'inherit',
                outline: 'none',
                WebkitTapHighlightColor: 'transparent',
                transition: 'color 0.15s ease, background 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
