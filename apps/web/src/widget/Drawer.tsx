import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
//@ts-ignore
import logo from '../assets/logo.png';
import badgeFirstWorkout from '../assets/07_achievements/badge_first_workout.jpg';
import badgeCalorieMaster from '../assets/07_achievements/badge_calorie_master.jpg';
import activityMedium from '../assets/12_activity/activity_medium.jpg';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';
//@ts-ignore
import { apiClient } from '../api/client';
import { useTheme } from '../theme/useTheme';
import { DailyTips } from '../features/TodayComponents/DailyTips';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { SectionIcon } from '../ui/SectionIcon';
import { hapticImpact } from '../utils/hapticFeedback';

interface DashboardData {
  consumed: { kcal: number; protein: number; fat: number; carb: number };
  targets: { kcalTarget: number; proteinTargetG: number; fatTargetG: number; carbTargetG: number } | null;
  progress: { kcalPct: number; proteinPct: number; fatPct: number; carbPct: number } | null;
}

export function Drawer({ onClick, isOpen = false }: { onClick: (boolean: boolean) => void, isOpen: boolean }) {
  const theme = useTheme();
  const { logout } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [waterMl, setWaterMl] = useState(0);
  const navigate = useNavigate();
  const waterGoal = 2000;

  const todayDate = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

  useEffect(() => {
    if (isOpen) {
      loadMenuStats();
    }
  }, [isOpen, todayDate]);

  const loadMenuStats = async () => {
    try {
      const [dashboardRes, waterRes] = await Promise.all([
        apiClient.get('/dashboard/day', { params: { date: todayDate } }),
        apiClient.get('/water', { params: { date: todayDate } }),
      ]);
      setDashboard(dashboardRes.data);
      setWaterMl(waterRes.data?.totalMl || 0);
    } catch (err) {
      console.error('Failed to load menu stats:', err);
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
        {/* Daily Tips */}
        {dashboard && (
          <div
            onClick={() => handleNavigate('/today')}
            style={{
              marginBottom: theme.spacing.lg,
              cursor: 'pointer',
            }}
          >
            <DailyTips dashboard={dashboard} waterMl={waterMl} waterGoal={waterGoal} />
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
              {t('commandCenter.selectDate')}
            </Button>
            <Button variant="secondary" onClick={() => handleNavigate('/workouts')} style={{ minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.xs }}>
              <SectionIcon src={badgeFirstWorkout} alt="" size={18} />
              {t('workout.title')}
            </Button>
            <Button variant="secondary" onClick={() => handleNavigate('/weight')} style={{ minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.xs }}>
              <SectionIcon src={activityMedium} alt="" size={18} />
              {t('weight.title')}
            </Button>
            <Button variant="secondary" onClick={() => handleNavigate('/reports')} style={{ minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.xs }}>
              <SectionIcon src={badgeCalorieMaster} alt="" size={18} />
              {t('report.title')}
            </Button>
            <Button variant="secondary" onClick={() => handleNavigate('/measurements')} style={{ minHeight: '44px' }}>
              {t('measurement.title')}
            </Button>
            <Button variant="secondary" onClick={() => handleNavigate('/templates')} style={{ minHeight: '44px' }}>
              {t('template.title')}
          </Button>
          <Button variant="secondary" onClick={() => handleNavigate('/recipes')} style={{ minHeight: '44px' }}>
             {t('recipes.title')}
          </Button>
          <Button variant="secondary" onClick={() => handleNavigate('/meal-plan')} style={{ minHeight: '44px' }}>
             {t('mealPlan.title')}
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
