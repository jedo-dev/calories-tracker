import { useEffect, useState } from 'react';
import { apiClient } from '../../../api/client';
import { useDebounce } from '../../../hooks/useDebounce';
import { InlineLoader } from '../../../ui/Loader';
import { t } from '../../../i18n';
import { useTheme } from '../../../theme/useTheme';
import { Text } from '../../../ui/Text';
import { Button } from '../../../ui/Button';
import { EditIcon } from '../../../ui/icons';
import DeleteIcon from '../../../assets/DeleteIcon';
import { workoutCardStyle } from '../../../pages/workoutShared';
import { Thumb } from '../Thumb';
import { ConfirmSheet } from '../ConfirmSheet';
import { PhotoDropzone } from './PhotoDropzone';
import type { WorkoutCategory } from '../types';
import type { AdminExercise } from './AdminExercisesTab';

export interface AdminProgramItem {
  exerciseId: string;
  // denormalized for display so the editor doesn't need the full catalog
  name?: string;
  gifUrl?: string;
  sets: number;
  reps?: number | null;
  durationSec?: number | null;
  restSec: number;
}

export interface AdminProgram {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  categoryId?: string;
  level: string;
  sortOrder: number;
  exerciseCount: number;
}

interface AdminProgramsTabProps {
  programs: AdminProgram[];
  categories: WorkoutCategory[];
  onChanged: () => void;
}

const inputStyle = (theme: any): React.CSSProperties => ({
  width: '100%',
  boxSizing: 'border-box',
  height: '40px',
  padding: '0 12px',
  borderRadius: '12px',
  border: '1px solid rgba(160, 200, 220, 0.18)',
  background: 'rgba(255, 255, 255, 0.06)',
  color: theme.palette.text,
  fontSize: '13px',
  outline: 'none',
  fontFamily: 'inherit',
});

const numInputStyle = (theme: any): React.CSSProperties => ({
  ...inputStyle(theme),
  height: '34px',
  padding: '0 8px',
});

async function uploadProgramPhoto(programId: string, file: File): Promise<string> {
  const form = new FormData();
  form.append('photo', file);
  const res = await apiClient.post(`/workouts/programs/${programId}/photo`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.imageUrl as string;
}

interface EditorState {
  _id: string | null;
  imageUrl: string;
  name: string;
  description: string;
  categoryId: string;
  level: string;
  items: AdminProgramItem[];
}

export function AdminProgramsTab({ programs, categories, onChanged }: AdminProgramsTabProps) {
  const theme = useTheme();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProgram | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const [pickerResults, setPickerResults] = useState<AdminExercise[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const debouncedPickerSearch = useDebounce(pickerSearch, 300);

  // server-side exercise search for the picker (no full-catalog preload)
  useEffect(() => {
    if (!showPicker) return;
    let cancelled = false;
    setPickerLoading(true);
    apiClient
      .get('/workouts/exercises', {
        params: { search: debouncedPickerSearch.trim() || undefined, limit: 20 },
      })
      .then((res) => !cancelled && setPickerResults(res.data))
      .catch(() => !cancelled && setPickerResults([]))
      .finally(() => !cancelled && setPickerLoading(false));
    return () => {
      cancelled = true;
    };
  }, [showPicker, debouncedPickerSearch]);

  const openNew = () => {
    setPendingPhoto(null);
    setEditor({ _id: null, imageUrl: '', name: '', description: '', categoryId: categories[0]?._id || '', level: 'beginner', items: [] });
  };

  const openEdit = async (p: AdminProgram) => {
    setPendingPhoto(null);
    // the list endpoint omits items — fetch the full program
    try {
      const res = await apiClient.get(`/workouts/programs/${p._id}`);
      setEditor({
        _id: p._id,
        imageUrl: res.data.imageUrl || '',
        name: res.data.name,
        description: res.data.description || '',
        categoryId: res.data.categoryId || '',
        level: res.data.level,
        items: res.data.items.map((i: any) => ({
          exerciseId: typeof i.exerciseId === 'string' ? i.exerciseId : i.exercise?._id,
          name: i.exercise?.name,
          gifUrl: i.exercise?.gifUrl,
          sets: i.sets,
          reps: i.reps,
          durationSec: i.durationSec,
          restSec: i.restSec,
        })),
      });
    } catch (err) {
      console.error('Failed to load program', err);
    }
  };

  const updateItem = (index: number, patch: Partial<AdminProgramItem>) => {
    setEditor((prev) => {
      if (!prev) return prev;
      const items = [...prev.items];
      items[index] = { ...items[index], ...patch };
      return { ...prev, items };
    });
  };

  const moveItem = (index: number, dir: -1 | 1) => {
    setEditor((prev) => {
      if (!prev) return prev;
      const items = [...prev.items];
      const j = index + dir;
      if (j < 0 || j >= items.length) return prev;
      [items[index], items[j]] = [items[j], items[index]];
      return { ...prev, items };
    });
  };

  const handleSave = async () => {
    if (!editor || editor.name.trim().length < 3 || editor.items.length === 0) {
      setError('Название от 3 символов и хотя бы одно упражнение');
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      name: editor.name.trim(),
      description: editor.description.trim() || undefined,
      categoryId: editor.categoryId || undefined,
      level: editor.level,
      items: editor.items.map((i) => ({
        exerciseId: i.exerciseId,
        sets: i.sets,
        reps: i.reps ?? undefined,
        durationSec: i.durationSec ?? undefined,
        restSec: i.restSec,
      })),
    };
    try {
      if (editor._id) {
        await apiClient.patch(`/workouts/programs/${editor._id}`, payload);
      } else {
        const created = await apiClient.post('/workouts/programs', payload);
        if (pendingPhoto) {
          try {
            await uploadProgramPhoto(created.data._id, pendingPhoto);
          } catch {
            // program is saved; the cover can be re-uploaded from the editor later
          }
        }
      }
      setEditor(null);
      setPendingPhoto(null);
      onChanged();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiClient.delete(`/workouts/programs/${deleteTarget._id}`);
      setDeleteTarget(null);
      setEditor(null);
      onChanged();
    } catch (err) {
      console.error('Failed to delete program', err);
    }
  };


  // --- editor form ---
  if (editor) {
    return (
      <div style={{ ...workoutCardStyle, padding: '14px' }}>
        <Text variant="h2" bold style={{ display: 'block', fontSize: '17px', marginBottom: '10px' }}>
          {editor._id ? t('workout.editProgram') : t('workout.newProgram')}
        </Text>

        <PhotoDropzone
          photoUrl={editor.imageUrl}
          alt={editor.name || 'Обложка программы'}
          busy={uploadingPhoto}
          onSelect={async (file) => {
            if (file.size > 5 * 1024 * 1024) {
              setError('Фото больше 5 МБ');
              return;
            }
            if (editor._id) {
              setUploadingPhoto(true);
              setError(null);
              try {
                const url = await uploadProgramPhoto(editor._id, file);
                setEditor((prev) => (prev ? { ...prev, imageUrl: url } : prev));
                onChanged();
              } catch (err: any) {
                setError(err.response?.data?.message || 'Не удалось загрузить фото');
              } finally {
                setUploadingPhoto(false);
              }
            } else {
              const reader = new FileReader();
              reader.onload = () => {
                setEditor((prev) => (prev ? { ...prev, imageUrl: reader.result as string } : prev));
                setPendingPhoto(file);
              };
              reader.readAsDataURL(file);
            }
          }}
        />

        <label style={{ display: 'block', marginBottom: '8px' }}>
          <Text variant="small" muted style={{ display: 'block', marginBottom: '4px' }}>{t('workout.programName')}</Text>
          <input style={inputStyle(theme)} value={editor.name} onChange={(e) => setEditor({ ...editor, name: e.target.value })} />
        </label>

        <label style={{ display: 'block', marginBottom: '8px' }}>
          <Text variant="small" muted style={{ display: 'block', marginBottom: '4px' }}>{t('workout.programDescription')}</Text>
          <textarea
            rows={3}
            style={{ ...inputStyle(theme), height: 'auto', padding: '10px 12px', resize: 'vertical', lineHeight: 1.4 }}
            value={editor.description}
            onChange={(e) => setEditor({ ...editor, description: e.target.value })}
          />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
          <label>
            <Text variant="small" muted style={{ display: 'block', marginBottom: '4px' }}>{t('workout.programCategory')}</Text>
            <select
              style={inputStyle(theme)}
              value={editor.categoryId}
              onChange={(e) => setEditor({ ...editor, categoryId: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c._id} value={c._id} style={{ color: '#000' }}>{c.name}</option>
              ))}
            </select>
          </label>
          <label>
            <Text variant="small" muted style={{ display: 'block', marginBottom: '4px' }}>{t('workout.programLevel')}</Text>
            <select
              style={inputStyle(theme)}
              value={editor.level}
              onChange={(e) => setEditor({ ...editor, level: e.target.value })}
            >
              <option value="beginner" style={{ color: '#000' }}>{t('workout.beginner')}</option>
              <option value="intermediate" style={{ color: '#000' }}>{t('workout.intermediate')}</option>
              <option value="advanced" style={{ color: '#000' }}>{t('workout.advanced')}</option>
            </select>
          </label>
        </div>

        <Text variant="small" muted style={{ display: 'block', marginBottom: '6px' }}>{t('workout.exercises')}</Text>
        {editor.items.map((item, i) => {
          const durationBased = item.durationSec != null && item.reps == null;
          return (
            <div
              key={`${item.exerciseId}-${i}`}
              style={{
                padding: '8px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                marginBottom: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Thumb src={item.gifUrl} alt={item.name || ''} size={32} />
                <Text bold style={{ flex: 1, minWidth: 0, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.name || item.exerciseId}
                </Text>
                <button type="button" aria-label="Вверх" onClick={() => moveItem(i, -1)} style={{ ...numInputStyle(theme), width: '32px', cursor: 'pointer' }}>↑</button>
                <button type="button" aria-label="Вниз" onClick={() => moveItem(i, 1)} style={{ ...numInputStyle(theme), width: '32px', cursor: 'pointer' }}>↓</button>
                <button
                  type="button"
                  aria-label={t('common.delete')}
                  onClick={() => setEditor({ ...editor, items: editor.items.filter((_, j) => j !== i) })}
                  style={{ ...numInputStyle(theme), width: '32px', cursor: 'pointer', color: '#ff8a8a' }}
                >
                  ✕
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                <label>
                  <Text variant="small" muted style={{ fontSize: '10px' }}>{t('workout.sets')}</Text>
                  <input
                    type="number" min={1} style={numInputStyle(theme)} value={item.sets}
                    onChange={(e) => updateItem(i, { sets: parseInt(e.target.value, 10) || 1 })}
                  />
                </label>
                {durationBased ? (
                  <label>
                    <Text variant="small" muted style={{ fontSize: '10px' }}>{t('workout.duration')}</Text>
                    <input
                      type="number" min={1} style={numInputStyle(theme)} value={item.durationSec ?? ''}
                      onChange={(e) => updateItem(i, { durationSec: parseInt(e.target.value, 10) || null })}
                    />
                  </label>
                ) : (
                  <label>
                    <Text variant="small" muted style={{ fontSize: '10px' }}>{t('workout.reps')}</Text>
                    <input
                      type="number" min={1} style={numInputStyle(theme)} value={item.reps ?? ''}
                      onChange={(e) => updateItem(i, { reps: parseInt(e.target.value, 10) || null })}
                    />
                  </label>
                )}
                <label>
                  <Text variant="small" muted style={{ fontSize: '10px' }}>{t('workout.rest')} ({t('workout.sec')})</Text>
                  <input
                    type="number" min={0} style={numInputStyle(theme)} value={item.restSec}
                    onChange={(e) => updateItem(i, { restSec: parseInt(e.target.value, 10) || 0 })}
                  />
                </label>
              </div>
            </div>
          );
        })}

        {showPicker ? (
          <div style={{ marginBottom: '8px' }}>
            <input
              type="text"
              autoFocus
              placeholder={t('common.search')}
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              style={{ ...inputStyle(theme), marginBottom: '6px' }}
            />
            <div style={{ maxHeight: '220px', overflowY: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              {pickerLoading && <InlineLoader size={44} />}
              {!pickerLoading && pickerResults.length === 0 && (
                <Text variant="small" muted style={{ display: 'block', padding: '10px 12px' }}>
                  Ничего не найдено
                </Text>
              )}
              {!pickerLoading && pickerResults.map((ex) => (
                <button
                  key={ex._id}
                  type="button"
                  onClick={() => {
                    setEditor({
                      ...editor,
                      items: [
                        ...editor.items,
                        {
                          exerciseId: ex._id,
                          name: ex.name,
                          gifUrl: ex.gifUrl,
                          sets: ex.defaultSets,
                          reps: ex.defaultDurationSec ? null : ex.defaultReps,
                          durationSec: ex.defaultDurationSec || null,
                          restSec: 60,
                        },
                      ],
                    });
                    setShowPicker(false);
                    setPickerSearch('');
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: theme.palette.text,
                    fontFamily: 'inherit',
                  }}
                >
                  <Thumb src={ex.gifUrl} alt={ex.name} size={28} />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{ex.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            style={{
              width: '100%',
              height: '38px',
              borderRadius: '12px',
              border: '1px dashed rgba(160, 200, 220, 0.35)',
              background: 'rgba(255,255,255,0.03)',
              color: theme.palette.textMuted,
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: '8px',
              fontFamily: 'inherit',
            }}
          >
            + {t('workout.addToProgram')}
          </button>
        )}

        {error && (
          <Text variant="small" style={{ display: 'block', color: '#ff8a8a', marginBottom: '8px' }}>{error}</Text>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setEditor(null)}
            style={{
              flex: 1,
              height: '44px',
              borderRadius: '14px',
              border: '1px solid rgba(160, 200, 220, 0.24)',
              background: 'rgba(255,255,255,0.06)',
              color: theme.palette.text,
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            style={{
              flex: 2,
              height: '44px',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))',
              color: '#07210f',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              opacity: saving ? 0.6 : 1,
              fontFamily: 'inherit',
            }}
          >
            {t('workout.saveProgram')}
          </button>
        </div>
      </div>
    );
  }

  // --- list ---
  return (
    <>
      <button
        type="button"
        onClick={openNew}
        style={{
          width: '100%',
          height: '46px',
          borderRadius: '16px',
          border: 'none',
          background: 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))',
          color: '#07210f',
          fontSize: '14px',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 14px 26px rgba(83, 212, 107, 0.2)',
          marginBottom: '12px',
          fontFamily: 'inherit',
        }}
      >
        + {t('workout.newProgram')}
      </button>

      {programs.map((p) => (
        <div
          key={p._id}
          style={{ ...workoutCardStyle, marginBottom: '10px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <Thumb src={p.imageUrl} alt={p.name} size={46} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text bold style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p.name}
            </Text>
            <Text variant="small" muted>
              {p.exerciseCount} {t('workout.exerciseCount').toLowerCase()} · {t(`workout.${p.level}`)}
            </Text>
          </div>
          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEdit(p)}
              style={{ padding: '8px', minWidth: '36px', minHeight: '36px', width: 'auto' }}
              aria-label="Редактировать"
            >
              <EditIcon />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteTarget(p)}
              style={{ padding: '8px', minWidth: '36px', minHeight: '36px', width: 'auto' }}
              aria-label="Удалить"
            >
              <DeleteIcon />
            </Button>
          </div>
        </div>
      ))}

      <ConfirmSheet
        isOpen={deleteTarget !== null}
        title={t('workout.confirmDeleteProgram')}
        description={deleteTarget ? `${deleteTarget.name}. ${t('workout.confirmDeleteProgramDesc')}` : undefined}
        confirmLabel={t('common.delete')}
        danger
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
