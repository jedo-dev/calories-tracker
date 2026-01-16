import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
//@ts-ignore
import logo from '../assets/logo.png';
import { t } from '../i18n';
//@ts-ignore
import leagueIcon from '../assets/trophy.png';
//@ts-ignore
import friendsIcon from '../assets/friend.png';
//@ts-ignore
import feedIcon from '../assets/feed.png';
//@ts-ignore
import { apiClient } from '../api/client';
import productsIcon from '../assets/products.png';
import { useTheme } from '../theme/useTheme';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { hapticImpact } from '../utils/hapticFeedback';

interface SocialStats {
  user: {
    id: string;
    username?: string;
    displayName: string;
    avatarEmoji: string;
  };
  stats: {
    xpTotal: number;
    xpWeek: number;
    currentStreak: number;
    bestStreak: number;
  };
}

export function Drawer({ onClick, isOpen = false, isActive = '' }: { onClick: (boolean: boolean) => void, isOpen: boolean, isActive: string }) {
  const theme = useTheme();
  const [socialStats, setSocialStats] = useState<SocialStats | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      // Загрузка данных пользователя
      loadSocialStats();
    }
  }, [isOpen]);

  const loadSocialStats = async () => {
    try {
      const response = await apiClient.get('/social/me');
      setSocialStats(response.data);
    } catch (err) {
      console.error('Failed to load social stats:', err);
    }
  };

  const handleClose = () => {
    onClick(false);
  };

  const handleNavigate = (path: string) => {
    handleClose();
    navigate(path);
  };

  const handleAddEntry = () => {
    hapticImpact('medium');
    handleNavigate('/entry/new');
  };

  const handleSelectDate = () => {
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.value = new Date().toISOString().split('T')[0];
    dateInput.onchange = (e: any) => {
      const selectedDate = e.target.value;
      if (selectedDate) {
        handleClose();
        navigate(`/today?date=${selectedDate}`);
      }
    };
    dateInput.click();
  };

  const navigationItems = [
    { title: t('league.title'), icon: leagueIcon, link: '/league', emoji: '🏆' },
    { title: t('friends.title'), icon: friendsIcon, link: '/friends', emoji: '👥' },
    { title: t('feed.title'), icon: feedIcon, link: '/feed', emoji: '📰' },
    { title: t('products.title'), icon: productsIcon, link: '/products', emoji: '🛒' },
    { title: t('profile.title'), icon: null, link: '/profile', emoji: '👤' },
  ];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      handle={
        <div
          style={{
            width: '40px',
            height: '4px',
            backgroundColor: theme.palette.border,
            borderRadius: '2px',
            margin: `${theme.spacing.sm} auto ${theme.spacing.md}`,
            cursor: 'grab',
          }}
        />
      }
      header={
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: `0 ${theme.spacing.lg} ${theme.spacing.md}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.md,
                flex: 1,
                justifyContent: 'center',
              }}
            >
              <img src={logo} alt="logo" width={40} height={40} style={{ borderRadius: theme.radius.md }} />
              <h1
                style={{
                  color: theme.palette.primaryText,
                  fontSize: theme.typography.h2.fontSize,
                  fontWeight: theme.typography.h2.fontWeight,
                  margin: 0,
                }}
              >
                {t('app.name')}
              </h1>
            </div>
            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                color: theme.palette.primaryText,
                fontSize: '24px',
                cursor: 'pointer',
                padding: theme.spacing.sm,
                lineHeight: 1,
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>

          <div
            style={{
              width: '100%',
              height: '1px',
              backgroundColor: theme.palette.border,
              marginBottom: theme.spacing.lg,
            }}
          />
        </>
      }
    >
      <div style={{ padding: `0 ${theme.spacing.lg}`, paddingBottom: theme.spacing.xl }}>
        {/* User Status Block */}
        {socialStats && (
          <div
            onClick={() => handleNavigate('/profile')}
            style={{
              padding: theme.spacing.md,
              backgroundColor: theme.palette.bg,
              borderRadius: theme.radius.md,
              marginBottom: theme.spacing.lg,
              cursor: 'pointer',
              border: `1px solid ${theme.palette.border}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: theme.spacing.md,
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '20px' }}>🔥</span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    color: theme.palette.primaryText,
                    fontSize: theme.typography.body.fontSize,
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  {t('commandCenter.streak')}: {t('commandCenter.days', { count: socialStats.stats.currentStreak })}
                </div>
                <div
                  style={{
                    color: theme.palette.primaryText,
                    fontSize: theme.typography.small.fontSize,
                  }}
                >
                  ⚡ {t('commandCenter.xpWeek')}: {socialStats.stats.xpWeek}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: theme.spacing.md,
            marginBottom: theme.spacing.lg,
          }}
        >
          <Button
            variant="primaryReverse"
            onClick={handleAddEntry}
            style={{
              gridColumn: '1 / -1',
              minHeight: '48px',
              color: theme.palette.text,
            }}
          >
            {t('commandCenter.addEntry')}
          </Button>
          <Button
            variant="primaryReverse"
            onClick={handleSelectDate}
            style={{ minHeight: '48px' }}
          >
            📅 {t('commandCenter.selectDate')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleNavigate('/products?tab=favorites')}
            style={{ minHeight: '48px' }}
          >
            ⭐ {t('commandCenter.favoriteProducts')}
          </Button>
        </div>

        {/* Navigation */}
        <div
          style={{
            marginBottom: theme.spacing.lg,
          }}
        >
          {navigationItems.map((item) => (
            <button
              key={item.link}
              onClick={() => handleNavigate(item.link)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.md,
                padding: theme.spacing.md,
                background: 'none',
                border: 'none',
                color: isActive === item.link ? theme.palette.secondaryText : theme.palette.text,
                fontSize: theme.typography.body.fontSize,
                cursor: 'pointer',
                textAlign: 'left',
                borderRadius: theme.radius.sm,
                marginBottom: theme.spacing.xs,
              }}
              onMouseEnter={(e) => {
                if (isActive !== item.link) {
                  e.currentTarget.style.backgroundColor = theme.palette.bg;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {item.icon ? (
                <img src={item.icon} alt={item.title} width={20} height={20} />
              ) : (
                <span style={{ fontSize: '20px' }}>{item.emoji}</span>
              )}
              <span>{item.title}</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            paddingTop: theme.spacing.md,
            borderTop: `1px solid ${theme.palette.border}`,
            textAlign: 'center',
          }}
        >
          <span
            style={{
              color: theme.palette.textMuted,
              fontSize: theme.typography.small.fontSize,
            }}
          >
            version: {__APP_VERSION__}
          </span>
        </div>
      </div>
    </BottomSheet>
  );
}