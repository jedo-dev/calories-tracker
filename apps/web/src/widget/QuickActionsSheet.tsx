import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pageBackground } from '../theme/styles';
import logo from '../assets/01_brand/logo_main.jpg';
import { t, todayISO } from '../i18n';
import { DailyTips } from '../features/TodayComponents/DailyTips';
//@ts-ignore
import { apiClient } from '../api/client';
import { useTheme } from '../theme/useTheme';
import { BottomSheet } from '../ui/BottomSheet';
import { hapticImpact } from '../utils/hapticFeedback';
import { calcWaterGoalMl } from '../widgets/water/waterGoal';
import { showToast } from '../ui/Toast';
import { ShareDaySheet } from '../widgets/share/ShareDaySheet';
import { renderDayReport } from '../widgets/share/shareDayImage';
import {
  IconBarcode,
  IconCamera,
  IconMic,
  IconDumbbell,
  IconRuler,
  IconScale,
  IconTemplate,
  IconShare,
} from '../ui/navIcons';

interface DashboardData {
  consumed: { kcal: number; protein: number; fat: number; carb: number };
  targets: { kcalTarget: number; proteinTargetG: number; fatTargetG: number; carbTargetG: number } | null;
  progress: { kcalPct: number; proteinPct: number; fatPct: number; carbPct: number } | null;
}

// Плитка быстрого действия: иконка + подпись, вход в трекинг за один тап.
function ActionTile({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        minHeight: '52px',
        padding: '10px 12px',
        borderRadius: '16px',
        border: '1px solid rgba(160, 200, 220, 0.18)',
        background: 'linear-gradient(180deg, rgba(17, 49, 69, 0.94), rgba(10, 32, 46, 0.94))',
        color: theme.palette.text,
        fontSize: '14px',
        fontWeight: 700,
        cursor: disabled ? 'wait' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: '10px',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        transition: 'transform 0.15s ease, border-color 0.15s ease',
      }}
      onPointerDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)'; }}
      onPointerUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
      onPointerLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
    >
      <span style={{ color: theme.palette.primary, display: 'flex' }}>{icon}</span>
      {label}
    </button>
  );
}

/**
 * Лист быстрых действий под центральной «+» в нижней панели.
 * Это центр действий (записать еду/воду/вес/тренировку), а не меню
 * навигации — каталог разделов живёт на /menu.
 */
export function QuickActionsSheet({ onClick, isOpen = false }: { onClick: (open: boolean) => void, isOpen: boolean }) {
  const theme = useTheme();
  const [shareBlob, setShareBlob] = useState<Blob | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [waterMl, setWaterMl] = useState(0);
  const [waterGoal, setWaterGoal] = useState(2000);
  const navigate = useNavigate();

  const todayDate = todayISO();

  // Prefetch on mount, so the first open animates without a content pop-in
  useEffect(() => {
    loadTipsStats();
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadTipsStats();
    }
  }, [isOpen, todayDate]);

  // Данные дня для блока «Совет дня»
  const loadTipsStats = async () => {
    try {
      const [dashboardRes, waterRes, weightRes] = await Promise.all([
        apiClient.get('/dashboard/day', { params: { date: todayDate } }),
        apiClient.get('/water', { params: { date: todayDate } }),
        apiClient.get('/weight/latest').catch(() => ({ data: null })),
      ]);
      setDashboard(dashboardRes.data);
      setWaterMl(waterRes.data?.totalMl || 0);
      setWaterGoal(calcWaterGoalMl(weightRes?.data?.weightKg));
    } catch (err) {
      console.error('Failed to load tips stats:', err);
    }
  };

  const handleClose = () => {
    onClick(false);
  };

  const handleNavigate = (path: string) => {
    handleClose();
    navigate(path);
  };

  const handleAddFood = () => {
    hapticImpact('medium');
    handleNavigate('/entry/new');
  };

  // Собираем данные дня и рисуем картинку-отчёт для шаринга
  const handleShareDay = async () => {
    if (shareLoading) return;
    hapticImpact('medium');
    setShareLoading(true);
    const todayDate = todayISO();
    try {
      const [entriesRes, dashboardRes, waterRes, weightRes] = await Promise.all([
        apiClient.get('/entries', { params: { date: todayDate } }),
        apiClient.get('/dashboard/day', { params: { date: todayDate } }),
        apiClient.get('/water', { params: { date: todayDate } }),
        apiClient.get('/weight/latest').catch(() => ({ data: null })),
      ]);
      const blob = await renderDayReport({
        dateISO: todayDate,
        entries: entriesRes.data || [],
        dashboard: dashboardRes.data,
        waterMl: waterRes.data?.totalMl || 0,
        waterGoalMl: calcWaterGoalMl(weightRes?.data?.weightKg),
      });
      setShareBlob(blob);
      setShareOpen(true);
    } catch (err) {
      console.error('Failed to build day report:', err);
      showToast('Не удалось создать отчёт');
    } finally {
      setShareLoading(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      background={pageBackground(theme.palette.bg)}
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
              aria-label="Закрыть"
              style={{
                background: 'none',
                border: 'none',
                color: theme.palette.textMuted,
                fontSize: '22px',
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
        {/* Совет дня */}
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

        <h2
          style={{
            color: theme.palette.text,
            fontSize: '16px',
            fontWeight: 700,
            margin: `0 0 ${theme.spacing.md}`,
          }}
        >
          {t('quickActions.title')}
        </h2>

        <button
          type="button"
          onClick={handleAddFood}
          style={{
            width: '100%',
            minHeight: '54px',
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
            marginBottom: theme.spacing.md,
          }}
        >
          + {t('quickActions.food')}
        </button>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: theme.spacing.sm,
            marginBottom: theme.spacing.md,
          }}
        >
          <ActionTile icon={<IconBarcode size={22} />} label={t('quickActions.barcode')} onClick={() => handleNavigate('/entry/new?mode=barcode')} />
          <ActionTile icon={<IconCamera size={22} />} label={t('quickActions.photo')} onClick={() => handleNavigate('/entry/new?mode=photo')} />
          <ActionTile icon={<IconMic size={22} />} label={t('quickActions.voice')} onClick={() => handleNavigate('/entry/new?mode=voice')} />
          <ActionTile icon={<IconDumbbell size={22} />} label={t('quickActions.workout')} onClick={() => handleNavigate('/workouts')} />
          <ActionTile icon={<IconRuler size={22} />} label={t('measurement.title')} onClick={() => handleNavigate('/measurements')} />
          <ActionTile icon={<IconScale size={22} />} label={t('quickActions.weight')} onClick={() => handleNavigate('/weight')} />
          <ActionTile icon={<IconTemplate size={22} />} label={t('quickActions.template')} onClick={() => handleNavigate('/templates')} />
        </div>

        <button
          type="button"
          onClick={handleShareDay}
          disabled={shareLoading}
          style={{
            width: '100%',
            minHeight: '48px',
            borderRadius: '16px',
            border: '1px solid rgba(83, 212, 107, 0.45)',
            background: 'linear-gradient(180deg, rgba(17, 49, 69, 0.94), rgba(10, 32, 46, 0.94))',
            color: theme.palette.primary,
            fontSize: '15px',
            fontWeight: 700,
            cursor: shareLoading ? 'wait' : 'pointer',
            opacity: shareLoading ? 0.7 : 1,
            outline: 'none',
            WebkitTapHighlightColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <IconShare size={20} />
          {shareLoading ? t('quickActions.sharePreparing') : t('quickActions.share')}
        </button>
      </div>

      <ShareDaySheet
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        onShared={() => {
          setShareOpen(false);
          handleClose();
        }}
        imageBlob={shareBlob}
      />
    </BottomSheet>
  );
}
