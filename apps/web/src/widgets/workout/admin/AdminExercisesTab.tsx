import { useMemo, useState } from 'react';
import { apiClient } from '../../../api/client';
import { t } from '../../../i18n';
import { useTheme } from '../../../theme/useTheme';
import { Text } from '../../../ui/Text';
import { workoutCardStyle } from '../../../pages/workoutShared';
import { Thumb } from '../Thumb';
import { PhotoUploadButton } from './PhotoUploadButton';

export interface AdminExercise {
  _id: string;
  name: string;
  description?: string;
  gifUrl?: string;
  type: string;
  difficulty?: string;
  equipment?: string;
  defaultSets: number;
  defaultReps: number;
  defaultDurationSec?: number;
  categoryId?: string;
}

interface AdminExercisesTabProps {
  exercises: AdminExercise[];
  onExerciseChanged: (exercise: AdminExercise) => void;
}

export function AdminExercisesTab({ exercises, onExerciseChanged }: AdminExercisesTabProps) {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draftDescription, setDraftDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter((ex) => ex.name.toLowerCase().includes(q));
  }, [exercises, search]);

  const openEditor = (ex: AdminExercise) => {
    setExpandedId(ex._id);
    setDraftDescription(ex.description || '');
    setSavedId(null);
  };

  const handleSaveDescription = async (ex: AdminExercise) => {
    setSaving(true);
    try {
      const res = await apiClient.patch(`/workouts/exercises/${ex._id}`, {
        description: draftDescription,
      });
      onExerciseChanged(res.data);
      setSavedId(ex._id);
    } catch (err) {
      console.error('Failed to save exercise', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <input
        type="text"
        placeholder={t('common.search')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
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
      {filtered.map((ex) => {
        const isExpanded = expandedId === ex._id;
        return (
          <div key={ex._id} style={{ ...workoutCardStyle, marginBottom: '10px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => (isExpanded ? setExpandedId(null) : openEditor(ex))}
                aria-expanded={isExpanded}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  flex: 1,
                  minWidth: 0,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: theme.palette.text,
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
              >
                <Thumb src={ex.gifUrl} alt={ex.name} size={46} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text bold style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ex.name}
                  </Text>
                  <Text variant="small" muted>
                    {ex.defaultSets}×{ex.defaultDurationSec ? `${ex.defaultDurationSec}${t('workout.sec')}` : ex.defaultReps}
                  </Text>
                </div>
              </button>
              <PhotoUploadButton
                compact
                uploadUrl={`/workouts/exercises/${ex._id}/photo`}
                onUploaded={(url) => onExerciseChanged({ ...ex, gifUrl: url })}
              />
            </div>

            {isExpanded && (
              <div style={{ marginTop: '10px' }}>
                <textarea
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  rows={5}
                  placeholder={t('workout.noTechnique')}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: '1px solid rgba(160, 200, 220, 0.18)',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: theme.palette.text,
                    fontSize: '13px',
                    lineHeight: 1.5,
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveDescription(ex)}
                  style={{
                    marginTop: '8px',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))',
                    color: '#07210f',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    opacity: saving ? 0.6 : 1,
                    fontFamily: 'inherit',
                  }}
                >
                  {savedId === ex._id ? `✓ ${t('workout.saved')}` : t('workout.saveProgram')}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
