import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '../../../api/client';
import { useDebounce } from '../../../hooks/useDebounce';
import { t } from '../../../i18n';
import { useTheme } from '../../../theme/useTheme';
import { Text } from '../../../ui/Text';
import { Button } from '../../../ui/Button';
import Loader from '../../../ui/Loader';
import { EditIcon } from '../../../ui/icons';
import DeleteIcon from '../../../assets/DeleteIcon';
import { workoutCardStyle } from '../../../pages/workoutShared';
import { Thumb } from '../Thumb';
import { ConfirmSheet } from '../ConfirmSheet';
import { PhotoDropzone } from './PhotoDropzone';
import type { WorkoutCategory } from '../types';

export interface AdminExercise {
  _id: string;
  name: string;
  description?: string;
  gifUrl?: string;
  type: string;
  metValue?: number;
  muscleGroups?: string[];
  difficulty?: string;
  equipment?: string;
  defaultSets: number;
  defaultReps: number;
  defaultDurationSec?: number;
  categoryId?: string;
}

interface AdminExercisesTabProps {
  categories: WorkoutCategory[];
}

interface EditorState {
  _id: string | null;
  gifUrl: string;
  name: string;
  description: string;
  categoryId: string;
  type: string;
  metValue: string;
  muscleGroups: string;
  equipment: string;
  difficulty: string;
  defaultSets: string;
  defaultReps: string;
  defaultDurationSec: string;
}

const PAGE_SIZE = 20;

const emptyEditor = (categoryId: string): EditorState => ({
  _id: null,
  gifUrl: '',
  name: '',
  description: '',
  categoryId,
  type: 'strength',
  metValue: '5',
  muscleGroups: '',
  equipment: '',
  difficulty: 'beginner',
  defaultSets: '3',
  defaultReps: '12',
  defaultDurationSec: '',
});

async function uploadExercisePhoto(exerciseId: string, file: File): Promise<string> {
  const form = new FormData();
  form.append('photo', file);
  const res = await apiClient.post(`/workouts/exercises/${exerciseId}/photo`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.gifUrl as string;
}

export function AdminExercisesTab({ categories }: AdminExercisesTabProps) {
  const theme = useTheme();
  const [items, setItems] = useState<AdminExercise[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [editor, setEditor] = useState<EditorState | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminExercise | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);
  // guards against parallel loads from the observer firing during a fetch
  const loadingRef = useRef(false);

  const loadPage = useCallback(
    async (offset: number, append: boolean) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setListLoading(true);
      try {
        const res = await apiClient.get('/workouts/exercises', {
          params: { search: debouncedSearch.trim() || undefined, limit: PAGE_SIZE, offset },
        });
        const page: AdminExercise[] = res.data;
        setItems((prev) => (append ? [...prev, ...page] : page));
        setHasMore(page.length === PAGE_SIZE);
      } catch (err) {
        console.error('Failed to load exercises', err);
      } finally {
        loadingRef.current = false;
        setListLoading(false);
      }
    },
    [debouncedSearch],
  );

  // new search → restart from the first page
  useEffect(() => {
    setItems([]);
    setHasMore(true);
    loadPage(0, false);
  }, [loadPage]);

  // infinite scroll: plain scroll listener — reliable in Telegram WebView,
  // where IntersectionObserver can be throttled or unavailable
  useEffect(() => {
    if (editor || !hasMore) return;
    const check = () => {
      const sentinel = sentinelRef.current;
      if (!sentinel || loadingRef.current) return;
      const rect = sentinel.getBoundingClientRect();
      if (rect.top < window.innerHeight + 200) {
        loadPage(items.length, true);
      }
    };
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [items.length, hasMore, editor, loadPage]);

  const inputStyle: React.CSSProperties = {
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
  };

  const fieldLabel = (label: string) => (
    <Text variant="small" muted style={{ display: 'block', marginBottom: '4px', fontSize: '11px' }}>
      {label}
    </Text>
  );

  const openEdit = (ex: AdminExercise) => {
    setPendingPhoto(null);
    setError(null);
    setEditor({
      _id: ex._id,
      gifUrl: ex.gifUrl || '',
      name: ex.name,
      description: ex.description || '',
      categoryId: ex.categoryId || categories[0]?._id || '',
      type: ex.type || 'strength',
      metValue: String(ex.metValue ?? 5),
      muscleGroups: (ex.muscleGroups || []).join(', '),
      equipment: ex.equipment || '',
      difficulty: ex.difficulty || 'beginner',
      defaultSets: String(ex.defaultSets ?? 3),
      defaultReps: String(ex.defaultReps ?? 12),
      defaultDurationSec: ex.defaultDurationSec ? String(ex.defaultDurationSec) : '',
    });
  };

  const handlePhotoSelect = async (file: File) => {
    if (!editor) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Фото больше 5 МБ');
      return;
    }
    if (editor._id) {
      setUploadingPhoto(true);
      setError(null);
      try {
        const url = await uploadExercisePhoto(editor._id, file);
        setEditor((prev) => (prev ? { ...prev, gifUrl: url } : prev));
        setItems((prev) => prev.map((ex) => (ex._id === editor._id ? { ...ex, gifUrl: url } : ex)));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Не удалось загрузить фото');
      } finally {
        setUploadingPhoto(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        setEditor((prev) => (prev ? { ...prev, gifUrl: reader.result as string } : prev));
        setPendingPhoto(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!editor || editor.name.trim().length < 2) {
      setError('Название от 2 символов');
      return;
    }
    setSaving(true);
    setError(null);
    const payload: Record<string, any> = {
      name: editor.name.trim(),
      description: editor.description.trim() || undefined,
      categoryId: editor.categoryId || undefined,
      type: editor.type,
      metValue: parseFloat(editor.metValue) || 5,
      muscleGroups: editor.muscleGroups.split(',').map((s) => s.trim()).filter(Boolean),
      equipment: editor.equipment.trim() || undefined,
      difficulty: editor.difficulty,
      defaultSets: parseInt(editor.defaultSets, 10) || 3,
      defaultReps: parseInt(editor.defaultReps, 10) || 12,
      defaultDurationSec: editor.defaultDurationSec ? parseInt(editor.defaultDurationSec, 10) : undefined,
    };
    try {
      if (editor._id) {
        await apiClient.patch(`/workouts/exercises/${editor._id}`, payload);
      } else {
        const created = await apiClient.post('/workouts/exercises', payload);
        if (pendingPhoto) {
          try {
            await uploadExercisePhoto(created.data._id, pendingPhoto);
          } catch {
            // exercise is saved; photo can be re-uploaded from the editor later
          }
        }
      }
      setEditor(null);
      setPendingPhoto(null);
      loadPage(0, false);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await apiClient.delete(`/workouts/exercises/${deleteTarget._id}`);
      setDeleteTarget(null);
      setEditor(null);
      setItems((prev) => prev.filter((ex) => ex._id !== deleteTarget._id));
    } catch (err: any) {
      setDeleteTarget(null);
      setDeleteError(err.response?.data?.message || err.message);
    }
  };

  // --- editor form ---
  if (editor) {
    return (
      <div style={{ ...workoutCardStyle, padding: '14px' }}>
        <Text variant="h2" bold style={{ display: 'block', fontSize: '17px', marginBottom: '10px' }}>
          {editor._id ? 'Редактировать упражнение' : 'Новое упражнение'}
        </Text>

        <PhotoDropzone
          photoUrl={editor.gifUrl}
          alt={editor.name || 'Фото упражнения'}
          onSelect={handlePhotoSelect}
          busy={uploadingPhoto}
        />

        <label style={{ display: 'block', marginBottom: '8px' }}>
          {fieldLabel('Название')}
          <input style={inputStyle} value={editor.name} onChange={(e) => setEditor({ ...editor, name: e.target.value })} />
        </label>

        <label style={{ display: 'block', marginBottom: '8px' }}>
          {fieldLabel('Описание техники')}
          <textarea
            rows={4}
            style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical', lineHeight: 1.45 }}
            value={editor.description}
            onChange={(e) => setEditor({ ...editor, description: e.target.value })}
          />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
          <label>
            {fieldLabel('Категория')}
            <select style={inputStyle} value={editor.categoryId} onChange={(e) => setEditor({ ...editor, categoryId: e.target.value })}>
              {categories.map((c) => (
                <option key={c._id} value={c._id} style={{ color: '#000' }}>{c.name}</option>
              ))}
            </select>
          </label>
          <label>
            {fieldLabel('Тип')}
            <select style={inputStyle} value={editor.type} onChange={(e) => setEditor({ ...editor, type: e.target.value })}>
              <option value="strength" style={{ color: '#000' }}>{t('workout.strength')}</option>
              <option value="cardio" style={{ color: '#000' }}>{t('workout.cardio')}</option>
              <option value="flexibility" style={{ color: '#000' }}>{t('workout.flexibility')}</option>
            </select>
          </label>
          <label>
            {fieldLabel('Сложность')}
            <select style={inputStyle} value={editor.difficulty} onChange={(e) => setEditor({ ...editor, difficulty: e.target.value })}>
              <option value="beginner" style={{ color: '#000' }}>{t('workout.beginner')}</option>
              <option value="intermediate" style={{ color: '#000' }}>{t('workout.intermediate')}</option>
              <option value="advanced" style={{ color: '#000' }}>{t('workout.advanced')}</option>
            </select>
          </label>
          <label>
            {fieldLabel('MET (интенсивность)')}
            <input type="number" step="0.5" min="0.5" style={inputStyle} value={editor.metValue} onChange={(e) => setEditor({ ...editor, metValue: e.target.value })} />
          </label>
          <label>
            {fieldLabel('Подходы по умолчанию')}
            <input type="number" min="1" style={inputStyle} value={editor.defaultSets} onChange={(e) => setEditor({ ...editor, defaultSets: e.target.value })} />
          </label>
          <label>
            {fieldLabel('Повторы по умолчанию')}
            <input type="number" min="1" style={inputStyle} value={editor.defaultReps} onChange={(e) => setEditor({ ...editor, defaultReps: e.target.value })} />
          </label>
          <label>
            {fieldLabel('Время, сек (для планок/кардио)')}
            <input type="number" min="1" placeholder="—" style={inputStyle} value={editor.defaultDurationSec} onChange={(e) => setEditor({ ...editor, defaultDurationSec: e.target.value })} />
          </label>
          <label>
            {fieldLabel('Оборудование')}
            <input placeholder="Штанга, скамья…" style={inputStyle} value={editor.equipment} onChange={(e) => setEditor({ ...editor, equipment: e.target.value })} />
          </label>
        </div>

        <label style={{ display: 'block', marginBottom: '10px' }}>
          {fieldLabel('Группы мышц (через запятую)')}
          <input placeholder="Большая грудная, Трицепс" style={inputStyle} value={editor.muscleGroups} onChange={(e) => setEditor({ ...editor, muscleGroups: e.target.value })} />
        </label>

        {error && (
          <Text variant="small" style={{ display: 'block', color: '#ff8a8a', marginBottom: '8px' }}>{error}</Text>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => { setEditor(null); setPendingPhoto(null); }}
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
        onClick={() => { setPendingPhoto(null); setError(null); setEditor(emptyEditor(categories[0]?._id || '')); }}
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
          marginBottom: '10px',
          fontFamily: 'inherit',
        }}
      >
        + Новое упражнение
      </button>

      <input
        type="text"
        placeholder={t('common.search')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ ...inputStyle, height: '40px', marginBottom: '10px' }}
      />

      {deleteError && (
        <Text variant="small" style={{ display: 'block', color: '#ff8a8a', marginBottom: '8px' }}>{deleteError}</Text>
      )}

      {items.map((ex) => (
        <div
          key={ex._id}
          style={{ ...workoutCardStyle, marginBottom: '10px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <Thumb src={ex.gifUrl} alt={ex.name} size={46} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text bold style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ex.name}
            </Text>
            <Text variant="small" muted style={{ fontSize: '11px' }}>
              {t(`workout.${ex.type}`) || ex.type} · MET {ex.metValue ?? '—'} ·{' '}
              {ex.defaultSets}×{ex.defaultDurationSec ? `${ex.defaultDurationSec}${t('workout.sec')}` : ex.defaultReps}
            </Text>
          </div>
          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEdit(ex)}
              style={{ padding: '8px', minWidth: '36px', minHeight: '36px', width: 'auto' }}
              aria-label="Редактировать"
            >
              <EditIcon />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteTarget(ex)}
              style={{ padding: '8px', minWidth: '36px', minHeight: '36px', width: 'auto' }}
              aria-label="Удалить"
            >
              <DeleteIcon />
            </Button>
          </div>
        </div>
      ))}

      {!listLoading && items.length === 0 && (
        <Text variant="small" muted style={{ display: 'block', textAlign: 'center', padding: '16px 0' }}>
          Ничего не найдено
        </Text>
      )}

      {listLoading && <Loader />}

      {/* infinite scroll sentinel */}
      <div ref={sentinelRef} style={{ height: '1px' }} />

      {!listLoading && hasMore && items.length > 0 && (
        <button
          type="button"
          onClick={() => loadPage(items.length, true)}
          style={{
            width: '100%',
            height: '40px',
            borderRadius: '13px',
            border: '1px dashed rgba(160, 200, 220, 0.35)',
            background: 'rgba(255,255,255,0.03)',
            color: theme.palette.textMuted,
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: '10px',
            fontFamily: 'inherit',
          }}
        >
          Показать ещё
        </button>
      )}

      <ConfirmSheet
        isOpen={deleteTarget !== null}
        title="Удалить упражнение?"
        description={deleteTarget ? `${deleteTarget.name}. Прошлые тренировки не пострадают, но добавить его заново будет нельзя.` : undefined}
        confirmLabel={t('common.delete')}
        danger
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
