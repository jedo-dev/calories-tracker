import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { t } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/useTheme';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';
import { PageHeader } from '../ui/PageHeader';
import { workoutPageBackground } from './workoutShared';
import { AdminCategoriesTab } from '../widgets/workout/admin/AdminCategoriesTab';
import { AdminExercisesTab } from '../widgets/workout/admin/AdminExercisesTab';
import { AdminProgramsTab, AdminProgram } from '../widgets/workout/admin/AdminProgramsTab';
import type { WorkoutCategory } from '../widgets/workout/types';

const EDITOR_ROLES = ['admin', 'trainer'];
type Tab = 'programs' | 'exercises' | 'categories';

export function AdminWorkoutsPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>('programs');
  const [programs, setPrograms] = useState<AdminProgram[]>([]);
  const [categories, setCategories] = useState<WorkoutCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const canEdit = !!user?.role && EDITOR_ROLES.includes(user.role);

  const loadData = useCallback(() => {
    return Promise.all([
      apiClient.get('/workouts/programs').catch(() => null),
      apiClient.get('/workouts/categories').catch(() => null),
    ]).then(([programsRes, catRes]) => {
      if (programsRes) setPrograms(programsRes.data);
      if (catRes) setCategories(catRes.data);
    });
  }, []);

  useEffect(() => {
    if (!canEdit) {
      setLoading(false);
      return;
    }
    loadData().finally(() => setLoading(false));
  }, [canEdit, loadData]);

  if (authLoading || loading) return <Loader />;

  const tabButton = (key: Tab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      style={{
        padding: '8px 12px',
        borderRadius: '12px',
        border: `1px solid ${tab === key ? theme.palette.primary : 'rgba(255,255,255,0.12)'}`,
        background: tab === key
          ? `linear-gradient(180deg, ${theme.palette.primary}33, ${theme.palette.primary}1f)`
          : 'rgba(255,255,255,0.06)',
        color: tab === key ? theme.palette.primary : theme.palette.textMuted,
        fontSize: '12px',
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        padding: '12px',
        maxWidth: '520px',
        margin: '0 auto',
        minHeight: '100vh',
        paddingBottom: '100px',
        background: workoutPageBackground(theme.palette.bg),
      }}
    >
      <PageHeader title={t('workout.adminTitle')} onBack={() => navigate('/workouts')} />

      {!canEdit ? (
        <Text muted style={{ display: 'block', padding: '20px 0', textAlign: 'center' }}>
          {t('workout.adminNoAccess')}
        </Text>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            {tabButton('programs', t('workout.adminPrograms'))}
            {tabButton('exercises', t('workout.adminExercises'))}
            {tabButton('categories', t('workout.adminCategories'))}
          </div>

          {tab === 'programs' && (
            <AdminProgramsTab programs={programs} categories={categories} onChanged={loadData} />
          )}
          {tab === 'exercises' && <AdminExercisesTab categories={categories} />}
          {tab === 'categories' && (
            <AdminCategoriesTab
              categories={categories}
              onPhotoUploaded={(id, url) =>
                setCategories((prev) => prev.map((c) => (c._id === id ? { ...c, imageUrl: url } : c)))
              }
            />
          )}
        </>
      )}
    </div>
  );
}
