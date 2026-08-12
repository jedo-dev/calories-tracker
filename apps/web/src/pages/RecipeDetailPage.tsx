import { PageHeader } from '../ui/PageHeader';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { t } from '../i18n';
import { showToast } from '../ui/Toast';
import { glassCardStyle, pageBackground } from '../theme/styles';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import Loader from '../ui/Loader';
import { Avatar } from '../ui/Avatar';
import { RichTextViewer } from '../ui/RichTextViewer';
import { IconButton } from '../ui/IconButton';
import {
  ArchiveIcon,
  BackIcon,
  DuplicateIcon,
  EditIcon,
  ForkIcon,
  PublishIcon,
  UnpublishIcon,
} from '../ui/icons';
import productsImage from '../assets/products.png';
import { AddToDiarySheet } from '../widgets/recipeDetail/AddToDiarySheet';
import { RecipeNutritionCards } from '../widgets/recipeDetail/RecipeNutritionCards';
import type { Recipe } from '../widgets/recipeDetail/types';

const cardStyle = glassCardStyle;

const overlayButtonStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.18)',
  background: 'rgba(3, 18, 28, 0.72)',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(6px)',
  padding: 0,
};

export function RecipeDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const theme = useTheme();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddToDiary, setShowAddToDiary] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadRecipe();
    loadMyUserId();
  }, [id]);

  const loadMyUserId = async () => {
    try {
      const res = await apiClient.get('/social/me');
      setMyUserId(res.data.user.id);
    } catch (err) {
      console.error(err);
    }
  };

  const loadRecipe = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/recipes/${id}`);
      setRecipe(response.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError(t('recipes.accessDenied'));
      } else {
        setError(err.response?.data?.message || t('recipes.loadFailed'));
      }
    } finally {
      setLoading(false);
    }
  };


  const handleArchive = async () => {
    if (!recipe) return;
    try {
      await apiClient.delete(`/recipes/${recipe._id}`);
      navigate('/recipes');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicate = async () => {
    if (!recipe) return;
    try {
      const response = await apiClient.post(`/recipes/${recipe._id}/duplicate`);
      navigate(`/recipes/${response.data._id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFork = async () => {
    if (!recipe) return;
    try {
      const response = await apiClient.post(`/recipes/${recipe._id}/fork`);
      showToast(t('recipes.forkSuccess'), 'success');
      navigate(`/recipes/${response.data._id}`);
    } catch (err: any) {
      showToast(err.response?.data?.message || t('recipes.forkFailed'));
    }
  };

  const handlePublish = async () => {
    if (!recipe) return;
    try {
      await apiClient.post(`/recipes/${recipe._id}/publish`);
      loadRecipe();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnpublish = async () => {
    if (!recipe) return;
    try {
      await apiClient.post(`/recipes/${recipe._id}/unpublish`);
      loadRecipe();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <Loader />;

  if (error) {
    return (
      <div style={{ padding: '12px', maxWidth: '520px', margin: '0 auto', paddingBottom: '100px', background: pageBackground(theme.palette.bg), minHeight: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: theme.spacing.lg }}>
          <IconButton label={t('common.back')} onClick={() => navigate('/recipes')}>
            <BackIcon />
          </IconButton>
          <Text variant="h1" style={{ flex: 1 }}>{t('recipes.accessDenied')}</Text>
        </div>
        <Card style={{ ...cardStyle, textAlign: 'center', padding: theme.spacing.xl }}>
          <div style={{ marginBottom: theme.spacing.md, display: 'flex', justifyContent: 'center' }}>
            <img src={productsImage} alt="" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          </div>
          <Text variant="h2" style={{ marginBottom: theme.spacing.sm }}>{t('recipes.accessDenied')}</Text>
          <Text muted>{t('recipes.accessDeniedDesc')}</Text>
          <Button onClick={() => navigate('/recipes')} style={{ marginTop: theme.spacing.lg }}>
            {t('recipes.title')}
          </Button>
        </Card>
      </div>
    );
  }

  if (!recipe) return <Text>{t('recipes.notFound')}</Text>;

  const isMine = myUserId && recipe.userId === myUserId;
  const isPublished = recipe.visibility === 'public';
  const author = recipe.authorSnapshot;



  return (
    <div style={{ padding: '12px', maxWidth: '520px', margin: '0 auto', paddingBottom: '100px', background: pageBackground(theme.palette.bg), minHeight: '100vh' }}>
      {/* Header / cover hero */}
      {recipe.photoUrl ? (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ position: 'relative' }}>
            <img
              src={recipe.photoUrl}
              alt={recipe.name}
              style={{
                width: '100%',
                height: '220px',
                objectFit: 'cover',
                borderRadius: '22px',
                display: 'block',
                border: '1px solid rgba(160, 200, 220, 0.18)',
                boxShadow: '0 22px 44px rgba(0, 0, 0, 0.28)',
              }}
            />
            <button type="button" onClick={() => navigate('/recipes')} style={{ ...overlayButtonStyle, position: 'absolute', top: '10px', left: '10px' }}>
              ←
            </button>
            {isMine && (
              <button
                type="button"
                onClick={() => navigate(`/recipes/${recipe._id}/edit`)}
                style={{ ...overlayButtonStyle, position: 'absolute', top: '10px', right: '10px', width: 'auto', padding: '0 12px', fontSize: '12px' }}
              >
                {t('recipes.edit')}
              </button>
            )}
          </div>
          <Text variant="h1" style={{ display: 'block', marginTop: '12px' }}>{recipe.name}</Text>
        </div>
      ) : (
        <PageHeader
          title={recipe.name}
          onBack={() => navigate('/recipes')}
          right={isMine ? (
            <IconButton label={t('recipes.edit')} onClick={() => navigate(`/recipes/${recipe._id}/edit`)}>
              <EditIcon />
            </IconButton>
          ) : undefined}
          style={{ marginBottom: theme.spacing.lg }}
        />
      )}

      {/* Author info for public recipes */}
      {!isMine && author && (
        <Card
          style={{ ...cardStyle, marginBottom: '12px', cursor: 'pointer' }}
          onClick={() => navigate(`/users/${author.userId}`)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            <Avatar
              emoji={author.avatarEmoji}
              size={44}
              borderWidth={2.5}
              borderColor={theme.palette.primary}
            />
            <div>
              <Text bold>{author.displayName || author.username}</Text>
              {author.username && (
                <Text variant="small" muted>@{author.username}</Text>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Visibility badge for own recipes */}
      {isMine && (
        <Card style={{ ...cardStyle, marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
              <span style={{
                fontSize: '12px',
                padding: '4px 10px',
                borderRadius: '8px',
                backgroundColor: isPublished ? theme.palette.success + '20' : theme.palette.surface,
                color: isPublished ? theme.palette.success : theme.palette.textMuted,
                fontWeight: '600',
              }}>
                {isPublished ? ` ${t('recipes.published')}` : ` ${t('recipes.private')}`}
              </span>
              {isPublished && recipe.likesCount !== undefined && recipe.likesCount > 0 && (
                <Text variant="small" muted> {recipe.likesCount}</Text>
              )}
              {isPublished && recipe.forkCount !== undefined && recipe.forkCount > 0 && (
                <Text variant="small" muted> {recipe.forkCount}</Text>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Description */}
      {recipe.description && (
        <Card style={{ ...cardStyle, marginBottom: '12px' }}>
          <RichTextViewer html={recipe.description} />
        </Card>
      )}

      <RecipeNutritionCards recipe={recipe} />

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
        <button
          type="button"
          onClick={() => setShowAddToDiary(true)}
          style={{
            width: '100%',
            height: '52px',
            borderRadius: '18px',
            border: 'none',
            background: 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))',
            color: '#07210f',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 18px 30px rgba(83, 212, 107, 0.24)',
          }}
        >
          {t('recipes.addToDiary')}
        </button>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          {isMine ? (
            <>
              {isPublished ? (
                <IconButton label={t('recipes.unpublish')} onClick={handleUnpublish} size={44}>
                  <UnpublishIcon size={20} />
                </IconButton>
              ) : (
                <IconButton label={t('recipes.publish')} onClick={handlePublish} size={44}>
                  <PublishIcon size={20} />
                </IconButton>
              )}
              <IconButton label={t('recipes.duplicate')} onClick={handleDuplicate} size={44}>
                <DuplicateIcon size={20} />
              </IconButton>
              <IconButton label={t('recipes.archive')} onClick={handleArchive} danger size={44}>
                <ArchiveIcon size={20} />
              </IconButton>
            </>
          ) : (
            <IconButton label={t('recipes.fork')} onClick={handleFork} size={44}>
              <ForkIcon size={20} />
            </IconButton>
          )}
        </div>
      </div>

      <AddToDiarySheet
        recipe={recipe}
        isOpen={showAddToDiary}
        onClose={() => setShowAddToDiary(false)}
      />
    </div>
  );
}
