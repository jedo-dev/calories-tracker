import { useEffect, useState } from 'react';
import { pageBackground } from '../theme/styles';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import emptyTemplates from '../assets/03_empty_states/empty_templates.png';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { EmptyState } from '../ui/EmptyState';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';
import { ConfirmSheet } from '../ui/ConfirmSheet';
import { TemplateCard, Template } from '../widgets/templates/TemplateCard';
import { TemplateCreateCard } from '../widgets/templates/TemplateCreateCard';

export function TemplatesPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await apiClient.get('/templates');
      setTemplates(res.data);
    } catch (err) {
      console.error('Failed to load templates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApply = async (tpl: Template) => {
    setApplyingId(tpl._id);
    setError(null);
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    try {
      for (const item of tpl.items) {
        if (item.productId) {
          await apiClient.post('/entries', {
            date: today,
            mealType: tpl.mealType || 'other',
            productId: item.productId,
            grams: item.grams,
          });
        }
      }
      navigate('/today');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('common.error'));
      setApplyingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiClient.delete(`/templates/${deleteTarget._id}`);
      setTemplates((prev) => prev.filter((tpl) => tpl._id !== deleteTarget._id));
    } catch (err) {
      console.error('Failed to delete template', err);
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) return <Loader />;

  return (
    <div
      style={{
        minHeight: '100vh',
        maxWidth: '520px',
        margin: '0 auto',
        padding: '12px',
        paddingBottom: '100px',
        background: pageBackground(theme.palette.bg),
      }}
    >
      <Text variant="h2" bold style={{ display: 'block', fontSize: '20px', marginBottom: '12px' }}>
        {t('template.title')}
      </Text>

      {!showCreate && (
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          style={{
            width: '100%',
            height: '48px',
            borderRadius: '16px',
            border: 'none',
            background: 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))',
            color: '#07210f',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 14px 26px rgba(83, 212, 107, 0.22)',
            marginBottom: '12px',
            fontFamily: 'inherit',
          }}
        >
          + {t('template.create')}
        </button>
      )}

      {showCreate && (
        <TemplateCreateCard
          onSaved={() => {
            setShowCreate(false);
            setLoading(true);
            load();
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {error && (
        <Text variant="small" style={{ display: 'block', color: '#ff8a8a', marginBottom: '10px' }}>
          {error}
        </Text>
      )}

      {templates.length === 0 && !showCreate ? (
        <EmptyState image={emptyTemplates} title={t('template.noTemplates')} description={t('template.noTemplatesDesc')} />
      ) : (
        templates.map((tpl) => (
          <TemplateCard
            key={tpl._id}
            template={tpl}
            applying={applyingId === tpl._id}
            onApply={() => handleApply(tpl)}
            onDelete={() => setDeleteTarget(tpl)}
          />
        ))
      )}

      <ConfirmSheet
        isOpen={deleteTarget !== null}
        title={t('template.confirmDelete')}
        description={deleteTarget ? `${deleteTarget.name}. ${t('template.confirmDeleteDesc')}` : undefined}
        confirmLabel={t('common.delete')}
        danger
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
