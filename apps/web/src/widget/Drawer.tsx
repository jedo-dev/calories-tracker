import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
//@ts-ignore
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';
//@ts-ignore
import { apiClient } from '../api/client';
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

export function Drawer({ onClick, isOpen = false }: { onClick: (boolean: boolean) => void, isOpen: boolean }) {
  const theme = useTheme();
  const { logout } = useAuth();
  const [socialStats, setSocialStats] = useState<SocialStats | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
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
    const now = new Date();
    dateInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    dateInput.onchange = (e: any) => {
      const selectedDate = e.target.value;
      if (selectedDate) {
        handleClose();
        navigate(`/today?date=${selectedDate}`);
      }
    };
    dateInput.click();
  };

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
                  color: theme.palette.text,
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
                color: theme.palette.text,
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
            onClick={() => handleNavigate('/today')}
            style={{
              padding: theme.spacing.md,
              backgroundColor: theme.palette.surface,
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
              <span style={{ fontSize: '24px' }}>🔥</span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    color: theme.palette.text,
                    fontSize: theme.typography.body.fontSize,
                    fontWeight: '600',
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  {t('commandCenter.streak')}: {t('commandCenter.days', { count: socialStats.stats.currentStreak })}
                </div>
                <div
                  style={{
                    color: theme.palette.textMuted,
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
            gap: theme.spacing.sm,
            marginBottom: theme.spacing.md,
          }}
        >
          <Button
            variant="primary"
            onClick={handleAddEntry}
            style={{ gridColumn: '1 / -1', minHeight: '48px' }}
          >
            + {t('commandCenter.addEntry')}
          </Button>
          <Button variant="secondary" onClick={handleSelectDate} style={{ minHeight: '44px' }}>
            📅 {t('commandCenter.selectDate')}
          </Button>
          <Button variant="secondary" onClick={() => handleNavigate('/workouts')} style={{ minHeight: '44px' }}>
            🏋️ {t('workout.title')}
          </Button>
          <Button variant="secondary" onClick={() => handleNavigate('/weight')} style={{ minHeight: '44px' }}>
            ⚖️ {t('weight.title')}
          </Button>
          <Button variant="secondary" onClick={() => handleNavigate('/reports')} style={{ minHeight: '44px' }}>
            📊 {t('report.title')}
          </Button>
          <Button variant="secondary" onClick={() => handleNavigate('/measurements')} style={{ minHeight: '44px' }}>
            📏 {t('measurement.title')}
          </Button>
          <Button variant="secondary" onClick={() => handleNavigate('/templates')} style={{ minHeight: '44px' }}>
            📋 {t('template.title')}
          </Button>
          <Button variant="secondary" onClick={() => handleNavigate('/recipes')} style={{ minHeight: '44px' }}>
            🍽️ {t('recipes.title')}
          </Button>
        </div>

        {/* Logout */}
        <div
          style={{
            paddingTop: theme.spacing.md,
            borderTop: `1px solid ${theme.palette.border}`,
            marginTop: theme.spacing.md,
          }}
        >
          <button
            onClick={() => {
              logout();
              handleClose();
              navigate('/login');
            }}
            style={{
              background: 'none',
              border: `1px solid ${theme.palette.danger}`,
              color: theme.palette.danger,
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              borderRadius: theme.radius.md,
              cursor: 'pointer',
              fontSize: theme.typography.body.fontSize,
              width: '100%',
            }}
          >
            {t('auth.logout')}
          </button>
          <div
            style={{
              color: theme.palette.textMuted,
              fontSize: theme.typography.small.fontSize,
              textAlign: 'center',
              marginTop: theme.spacing.sm,
            }}
          >
            version: {__APP_VERSION__}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
