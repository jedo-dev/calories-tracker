import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';
import { IconButton } from '../ui/IconButton';
import { BackIcon } from '../ui/icons';
import { BottomSheet } from '../ui/BottomSheet';
import { hapticImpact } from '../utils/hapticFeedback';
import { workoutPageBackground } from './workoutShared';
import { ExerciseSlide } from '../widgets/workout/ExerciseSlide';
import { RestTimerBar } from '../widgets/workout/RestTimerBar';
import { WorkoutProgressBar } from '../widgets/workout/WorkoutProgressBar';
import { ConfirmSheet } from '../widgets/workout/ConfirmSheet';
import { Thumb } from '../widgets/workout/Thumb';
import type { LastPerformance, SessionLog, SetDetail, WorkoutSessionInfo } from '../widgets/workout/types';

interface CatalogExercise {
  _id: string;
  name: string;
  description?: string;
  gifUrl?: string;
  defaultSets: number;
  defaultReps: number;
}

// Older logs have no per-set data; synthesize rows from the aggregates so the
// player can drive them (persisted on the first PATCH).
function ensureSetsDetail(log: SessionLog): SessionLog {
  if (log.setsDetail && log.setsDetail.length > 0) return log;
  const sets = Math.max(1, log.sets || 3);
  const setsDetail: SetDetail[] = Array.from({ length: sets }, (_, i) => ({
    setNumber: i + 1,
    weightKg: log.weightKg ?? null,
    reps: log.reps > 0 ? log.reps : null,
    durationSec: log.reps > 0 ? null : Math.round((log.durationSec || 0) / sets) || null,
    done: false,
  }));
  return { ...log, setsDetail };
}

export function ActiveWorkoutPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  const [session, setSession] = useState<WorkoutSessionInfo | null>(null);
  const [logs, setLogs] = useState<SessionLog[]>([]);
  const [lastPerf, setLastPerf] = useState<Record<string, LastPerformance>>({});
  const [catalog, setCatalog] = useState<CatalogExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [restTimer, setRestTimer] = useState<{ key: string; restSec: number } | null>(null);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  const patchTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sessionRes, logsRes, catalogRes] = await Promise.all([
          apiClient.get(`/workouts/sessions/${sessionId}`),
          apiClient.get(`/workouts/sessions/${sessionId}/logs`),
          apiClient.get('/workouts/exercises').catch(() => ({ data: [] })),
        ]);
        if (cancelled) return;
        const loaded: SessionLog[] = logsRes.data.map(ensureSetsDetail);
        setSession(sessionRes.data);
        setLogs(loaded);
        setCatalog(catalogRes.data);

        const firstUndone = loaded.findIndex((l) => l.setsDetail.some((s) => !s.done));
        setCurrentIndex(firstUndone === -1 ? Math.max(0, loaded.length - 1) : firstUndone);

        const ids = [...new Set(loaded.map((l) => l.exerciseId))];
        if (ids.length) {
          apiClient
            .get('/workouts/exercises/last', {
              params: { ids: ids.join(','), excludeSessionId: sessionId },
            })
            .then((res) => !cancelled && setLastPerf(res.data))
            .catch(() => {});
        }
      } catch (err) {
        console.error('Failed to load session', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const catalogById = useMemo(() => new Map(catalog.map((ex) => [ex._id, ex])), [catalog]);

  const totalSets = logs.reduce((sum, l) => sum + l.setsDetail.length, 0);
  const doneSets = logs.reduce((sum, l) => sum + l.setsDetail.filter((s) => s.done).length, 0);
  const currentLog = logs[currentIndex];

  const schedulePatch = (log: SessionLog, immediate = false) => {
    const existing = patchTimers.current.get(log._id);
    if (existing) clearTimeout(existing);
    const send = () => {
      patchTimers.current.delete(log._id);
      apiClient
        .patch(`/workouts/logs/${log._id}`, {
          setsDetail: log.setsDetail.map((s) => ({
            setNumber: s.setNumber,
            weightKg: s.weightKg ?? undefined,
            reps: s.reps ?? undefined,
            durationSec: s.durationSec ?? undefined,
            done: s.done,
          })),
        })
        .catch((err) => console.error('Failed to save set', err));
    };
    if (immediate) send();
    else patchTimers.current.set(log._id, setTimeout(send, 600));
  };

  const updateLog = (logIndex: number, updater: (log: SessionLog) => SessionLog, immediate = false) => {
    // schedulePatch must stay outside the setLogs updater: React StrictMode
    // runs updaters twice, which would fire duplicate concurrent PATCHes
    const nextLog = updater(logs[logIndex]);
    setLogs((prev) => {
      const next = [...prev];
      next[logIndex] = nextLog;
      return next;
    });
    schedulePatch(nextLog, immediate);
  };

  const handleSetChange = (logIndex: number, setIndex: number, set: SetDetail) => {
    updateLog(logIndex, (log) => {
      const setsDetail = [...log.setsDetail];
      setsDetail[setIndex] = set;
      return { ...log, setsDetail };
    });
  };

  const handleToggleDone = (logIndex: number, setIndex: number) => {
    const log = logs[logIndex];
    const set = log.setsDetail[setIndex];
    const nowDone = !set.done;

    updateLog(
      logIndex,
      (l) => {
        const setsDetail = [...l.setsDetail];
        setsDetail[setIndex] = { ...setsDetail[setIndex], done: nowDone };
        return { ...l, setsDetail };
      },
      true,
    );

    if (nowDone) {
      hapticImpact('medium');
      const isLastSetOfLog = log.setsDetail.every((s, i) => (i === setIndex ? true : s.done));
      const isLastLog = logIndex === logs.length - 1;
      if (!(isLastSetOfLog && isLastLog)) {
        setRestTimer({ key: `${log._id}-${set.setNumber}-${Date.now()}`, restSec: log.restSec || 60 });
      }
      if (isLastSetOfLog && !isLastLog) {
        setTimeout(() => setCurrentIndex((i) => Math.min(i + 1, logs.length - 1)), 350);
      }
    }
  };

  const handleAddSet = (logIndex: number) => {
    updateLog(logIndex, (log) => {
      const lastSet = log.setsDetail[log.setsDetail.length - 1];
      return {
        ...log,
        setsDetail: [
          ...log.setsDetail,
          {
            setNumber: log.setsDetail.length + 1,
            weightKg: lastSet?.weightKg ?? null,
            reps: lastSet?.reps ?? null,
            durationSec: lastSet?.durationSec ?? null,
            done: false,
          },
        ],
      };
    });
  };

  const handleRemoveCurrent = async () => {
    if (!currentLog) return;
    try {
      await apiClient.delete(`/workouts/logs/${currentLog._id}`);
      setLogs((prev) => prev.filter((l) => l._id !== currentLog._id));
      setCurrentIndex((i) => Math.max(0, Math.min(i, logs.length - 2)));
    } catch (err) {
      console.error('Failed to remove exercise', err);
    }
  };

  const handleAddExercise = async (exercise: CatalogExercise) => {
    setShowPicker(false);
    try {
      const res = await apiClient.post(`/workouts/sessions/${sessionId}/exercises`, {
        exerciseId: exercise._id,
      });
      const newLog = ensureSetsDetail(res.data);
      setLogs((prev) => {
        setCurrentIndex(prev.length);
        return [...prev, newLog];
      });
    } catch (err) {
      console.error('Failed to add exercise', err);
    }
  };

  const handleFinish = async () => {
    setFinishing(true);
    try {
      // flush pending debounced patches before finishing
      for (const timer of patchTimers.current.values()) clearTimeout(timer);
      patchTimers.current.clear();
      await Promise.all(
        logs.map((log) =>
          apiClient
            .patch(`/workouts/logs/${log._id}`, {
              setsDetail: log.setsDetail.map((s) => ({
                setNumber: s.setNumber,
                weightKg: s.weightKg ?? undefined,
                reps: s.reps ?? undefined,
                durationSec: s.durationSec ?? undefined,
                done: s.done,
              })),
            })
            .catch(() => {}),
        ),
      );
      const res = await apiClient.post(`/workouts/sessions/${sessionId}/finish`);
      navigate(`/workout/${sessionId}/summary`, { state: { summary: res.data.summary } });
    } catch (err) {
      console.error('Failed to finish workout', err);
      setFinishing(false);
      setConfirmFinish(false);
    }
  };

  const handleCancel = async () => {
    setFinishing(true);
    try {
      await apiClient.delete(`/workouts/sessions/${sessionId}`);
      navigate('/workouts');
    } catch (err) {
      console.error('Failed to cancel workout', err);
      setFinishing(false);
      setConfirmCancel(false);
    }
  };

  const filteredCatalog = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((ex) => ex.name.toLowerCase().includes(q));
  }, [catalog, pickerSearch]);

  if (loading) return <Loader />;
  if (!session) return <Text>{t('common.error')}</Text>;

  const navBtnStyle = (disabled: boolean): React.CSSProperties => ({
    flex: 1,
    height: '46px',
    borderRadius: '16px',
    border: '1px solid rgba(160, 200, 220, 0.24)',
    background: 'rgba(255,255,255,0.06)',
    color: disabled ? theme.palette.textMuted : theme.palette.text,
    fontSize: '13px',
    fontWeight: 700,
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    fontFamily: 'inherit',
  });

  return (
    <div
      style={{
        padding: '12px',
        maxWidth: '520px',
        margin: '0 auto',
        minHeight: '100vh',
        paddingBottom: '160px',
        background: workoutPageBackground(theme.palette.bg),
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <IconButton label={t('common.back')} onClick={() => navigate('/workouts')}>
          <BackIcon />
        </IconButton>
        <Text variant="h2" bold style={{ fontSize: '18px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {session.name || t('workout.activeWorkout')}
        </Text>
        <button
          type="button"
          onClick={() => setConfirmCancel(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#ff8a8a',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            padding: '6px',
          }}
        >
          {t('workout.cancelWorkout')}
        </button>
      </div>

      {logs.length > 0 ? (
        <>
          <WorkoutProgressBar
            currentIndex={currentIndex}
            totalExercises={logs.length}
            doneSets={doneSets}
            totalSets={totalSets}
          />

          {currentLog && (
            <ExerciseSlide
              key={currentLog._id}
              log={currentLog}
              last={lastPerf[currentLog.exerciseId]}
              description={catalogById.get(currentLog.exerciseId)?.description}
              onSetChange={(setIndex, set) => handleSetChange(currentIndex, setIndex, set)}
              onToggleDone={(setIndex) => handleToggleDone(currentIndex, setIndex)}
              onAddSet={() => handleAddSet(currentIndex)}
            />
          )}

          {/* Prev / next navigation */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              style={navBtnStyle(currentIndex === 0)}
            >
              ← {t('workout.prev')}
            </button>
            <button
              type="button"
              disabled={currentIndex >= logs.length - 1}
              onClick={() => setCurrentIndex((i) => Math.min(logs.length - 1, i + 1))}
              style={navBtnStyle(currentIndex >= logs.length - 1)}
            >
              {t('workout.next')} →
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => { setPickerSearch(''); setShowPicker(true); }}
              style={{ ...navBtnStyle(false), height: '40px', fontSize: '12px' }}
            >
              + {t('workout.addExercise')}
            </button>
            <button
              type="button"
              onClick={handleRemoveCurrent}
              style={{ ...navBtnStyle(false), height: '40px', fontSize: '12px', color: '#ff8a8a' }}
            >
              ✕ {t('workout.removeExercise')}
            </button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '30px 0' }}>
          <Text muted style={{ display: 'block', marginBottom: '14px' }}>{t('workout.noExercises')}</Text>
          <button
            type="button"
            onClick={() => { setPickerSearch(''); setShowPicker(true); }}
            style={{ ...navBtnStyle(false), padding: '0 20px' }}
          >
            + {t('workout.addExercise')}
          </button>
        </div>
      )}

      {/* Finish CTA */}
      {logs.length > 0 && (
        <button
          type="button"
          onClick={() => setConfirmFinish(true)}
          disabled={finishing}
          style={{
            width: '100%',
            height: '52px',
            borderRadius: '18px',
            border: 'none',
            background: 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))',
            color: '#07210f',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 18px 30px rgba(83, 212, 107, 0.24)',
            opacity: finishing ? 0.6 : 1,
            fontFamily: 'inherit',
          }}
        >
          {t('workout.finishWorkout')}
        </button>
      )}

      {/* Rest timer overlay */}
      {restTimer && (
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(70px + env(safe-area-inset-bottom))',
            left: '12px',
            right: '12px',
            maxWidth: '496px',
            margin: '0 auto',
            zIndex: 6,
          }}
        >
          <RestTimerBar
            timerKey={restTimer.key}
            restSec={restTimer.restSec}
            onFinish={() => setRestTimer(null)}
          />
        </div>
      )}

      {/* Exercise picker */}
      <BottomSheet isOpen={showPicker} onClose={() => setShowPicker(false)}>
        <div style={{ padding: '16px 16px 24px', maxWidth: '520px', margin: '0 auto' }}>
          <Text variant="h2" bold style={{ display: 'block', fontSize: '17px', marginBottom: '10px' }}>
            {t('workout.addExercise')}
          </Text>
          <input
            type="text"
            placeholder={t('common.search')}
            value={pickerSearch}
            onChange={(e) => setPickerSearch(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              height: '40px',
              padding: '0 12px',
              borderRadius: '12px',
              border: '1px solid rgba(160, 200, 220, 0.18)',
              background: 'rgba(255, 255, 255, 0.06)',
              color: theme.palette.text,
              fontSize: '14px',
              outline: 'none',
              marginBottom: '10px',
            }}
          />
          <div style={{ maxHeight: '45vh', overflowY: 'auto' }}>
            {filteredCatalog.map((ex) => (
              <button
                key={ex._id}
                type="button"
                onClick={() => handleAddExercise(ex)}
                style={{
                  width: '100%',
                  padding: '8px 0',
                  border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                  background: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: theme.palette.text,
                  fontFamily: 'inherit',
                }}
              >
                <Thumb src={ex.gifUrl} alt={ex.name} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text bold style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ex.name}
                  </Text>
                  <Text variant="small" muted>{ex.defaultSets}×{ex.defaultReps}</Text>
                </div>
              </button>
            ))}
            {filteredCatalog.length === 0 && (
              <Text variant="small" muted style={{ display: 'block', padding: '10px 0' }}>
                {t('workout.noExercises')}
              </Text>
            )}
          </div>
        </div>
      </BottomSheet>

      <ConfirmSheet
        isOpen={confirmFinish}
        title={t('workout.confirmFinish')}
        description={t('workout.confirmFinishDesc')}
        confirmLabel={t('workout.finishWorkout')}
        busy={finishing}
        onConfirm={handleFinish}
        onClose={() => setConfirmFinish(false)}
      />
      <ConfirmSheet
        isOpen={confirmCancel}
        title={t('workout.confirmCancel')}
        description={t('workout.confirmCancelDesc')}
        confirmLabel={t('workout.exitNoSave')}
        danger
        busy={finishing}
        onConfirm={handleCancel}
        onClose={() => setConfirmCancel(false)}
      />
    </div>
  );
}
