import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/01_brand/logo_main.jpg';
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

  // Prefetch on mount, so the first open animates without a content pop-in
  useEffect(() => {
    loadMenuStats();
  }, []);

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

  const MenuTile = ({ path, icon, children }: { path: string; icon?: React.ReactNode; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={() => handleNavigate(path)}
      style={{
        minHeight: '48px',
        padding: '10px 12px',
        borderRadius: '14px',
        border: '1px solid rgba(160, 200, 220, 0.18)',
        background: 'linear-gradient(180deg, rgba(17, 49, 69, 0.9), rgba(10, 32, 46, 0.9))',
        color: theme.palette.text,
        fontSize: '14px',
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.xs,
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        transition: 'transform 0.15s ease, border-color 0.15s ease',
      }}
      onPointerDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)'; }}
      onPointerUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
      onPointerLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
    >
      {icon}
      {children}
    </button>
  );


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
          <button
            type="button"
            onClick={handleAddEntry}
            style={{
              gridColumn: '1 / -1',
              minHeight: '50px',
              borderRadius: '16px',
              border: 'none',
              background: 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))',
              color: '#07210f',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 14px 26px rgba(83, 212, 107, 0.22)',
              outline: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            + {t('commandCenter.addEntry')}
          </button>
          <MenuTile path="/today">{t('commandCenter.selectDate')}</MenuTile>
          <MenuTile path="/workouts" icon={<SectionIcon src={badgeFirstWorkout} alt="" size={18} />}>
            {t('workout.title')}
          </MenuTile>
          <MenuTile path="/weight" icon={<SectionIcon src={activityMedium} alt="" size={18} />}>
            {t('weight.title')}
          </MenuTile>
          <MenuTile path="/reports" icon={<SectionIcon src={badgeCalorieMaster} alt="" size={18} />}>
            {t('report.title')}
          </MenuTile>
          <MenuTile path="/measurements">{t('measurement.title')}</MenuTile>
          <MenuTile path="/templates">{t('template.title')}</MenuTile>
          <MenuTile path="/recipes">{t('recipes.title')}</MenuTile>
          <MenuTile path="/meal-plan">{t('mealPlan.title')}</MenuTile>
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
