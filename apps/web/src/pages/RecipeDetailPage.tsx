import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Text } from '../ui/Text';
import Loader from '../ui/Loader';
import productsImage from '../assets/products.png';

interface Ingredient {
  productId?: string;
  productName: string;
  grams: number;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbPer100g: number;
  kcal: number;
  protein: number;
  fat: number;
  carb: number;
}

interface Recipe {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  photoUrl?: string;
  mealTypes: string[];
  tags: string[];
  servingName?: string;
  servingGrams?: number;
  totalCookedWeightG: number;
  calculationMode: string;
  ingredients: Ingredient[];
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbPer100g: number;
  totalKcal: number;
  totalProtein: number;
  totalFat: number;
  totalCarb: number;
  isArchived: boolean;
  linkedProductId?: string;
  visibility?: string;
  publishedAt?: string;
  forkCount?: number;
  likesCount?: number;
  authorSnapshot?: {
    userId: string;
    username?: string;
    displayName?: string;
    avatarEmoji?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export function RecipeDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const theme = useTheme();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddToDiary, setShowAddToDiary] = useState(false);
  const [diaryDate, setDiaryDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [diaryMealType, setDiaryMealType] = useState('other');
  const [diaryGrams, setDiaryGrams] = useState('');
  const [addingToDiary, setAddingToDiary] = useState(false);
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
      if (response.data.servingGrams) {
        setDiaryGrams(response.data.servingGrams.toString());
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError(t('recipes.accessDenied'));
      } else {
        setError(err.response?.data?.message || 'Error loading recipe');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddToDiary = async () => {
    if (!recipe || !diaryGrams || parseFloat(diaryGrams) <= 0) return;
    setAddingToDiary(true);
    try {
      await apiClient.post(`/recipes/${recipe._id}/create-entry`, {
        date: diaryDate,
        mealType: diaryMealType,
        grams: parseFloat(diaryGrams),
      });
      setShowAddToDiary(false);
      navigate('/today');
    } catch (err) {
      console.error(err);
    } finally {
      setAddingToDiary(false);
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
      alert(t('recipes.forkSuccess'));
      navigate(`/recipes/${response.data._id}`);
    } catch (err: any) {
      alert(err.response?.data?.message || t('recipes.forkFailed'));
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
      <div style={{ padding: theme.spacing.lg, maxWidth: '600px', margin: '0 auto', paddingBottom: '100px', backgroundColor: theme.palette.bg, minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/recipes')} style={{ minWidth: '40px' }}>
            ←
          </Button>
          <Text variant="h1" style={{ flex: 1 }}>{t('recipes.accessDenied')}</Text>
        </div>
        <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
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

  if (!recipe) return <Text>Блюдо не найдено</Text>;

  const isMine = myUserId && recipe.userId === myUserId;
  const isPublished = recipe.visibility === 'public';
  const author = recipe.authorSnapshot;

  const modeLabel: Record<string, string> = {
    manual: t('recipes.manual'),
    ingredients: t('recipes.fromIngredients'),
    mixed: t('recipes.mixed'),
  };

  const diaryGramsNum = parseFloat(diaryGrams) || 0;
  const diaryPreview = {
    kcal: Math.round(recipe.kcalPer100g * diaryGramsNum / 100),
    protein: Math.round(recipe.proteinPer100g * diaryGramsNum / 100 * 10) / 10,
    fat: Math.round(recipe.fatPer100g * diaryGramsNum / 100 * 10) / 10,
    carb: Math.round(recipe.carbPer100g * diaryGramsNum / 100 * 10) / 10,
  };

  return (
    <div style={{ padding: theme.spacing.lg, maxWidth: '600px', margin: '0 auto', paddingBottom: '100px', backgroundColor: theme.palette.bg, minHeight: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/recipes')} style={{ minWidth: '40px' }}>
          ←
        </Button>
        <Text variant="h1" style={{ flex: 1 }}>{recipe.name}</Text>
        {isMine && (
            <Button variant="ghost" size="sm" onClick={() => navigate(`/recipes/${recipe._id}/edit`)}>
              Edit
           </Button>
        )}
      </div>

      {/* Author info for public recipes */}
      {!isMine && author && (
        <Card
          style={{ marginBottom: theme.spacing.md, cursor: 'pointer' }}
          onClick={() => navigate(`/users/${author.userId}`)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            <div style={{ fontSize: '32px' }}>{author.avatarEmoji || '🦊'}</div>
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
        <Card style={{ marginBottom: theme.spacing.md }}>
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
            {isPublished ? (
              <Button size="sm" variant="ghost" onClick={handleUnpublish}>
                {t('recipes.unpublish')}
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={handlePublish}>
                {t('recipes.publish')}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Photo */}
      {recipe.photoUrl && (
        <div style={{ marginBottom: theme.spacing.md }}>
          <img
            src={recipe.photoUrl}
            alt={recipe.name}
            style={{
              width: '100%',
              maxHeight: '250px',
              objectFit: 'cover',
              borderRadius: theme.radius.md,
            }}
          />
        </div>
      )}

      {/* Description */}
      {recipe.description && (
        <Card style={{ marginBottom: theme.spacing.md }}>
          <Text>{recipe.description}</Text>
        </Card>
      )}

      {/* KBJU per 100g */}
      <Card style={{ marginBottom: theme.spacing.md }}>
        <Text variant="h2" style={{ marginBottom: theme.spacing.sm }}>{t('recipes.per100g')}</Text>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: theme.spacing.sm, textAlign: 'center' }}>
          <div>
            <Text bold style={{ fontSize: '22px', display: 'block', color: theme.palette.primary }}>{recipe.kcalPer100g.toFixed(0)}</Text>
            <Text variant="small" muted>ккал</Text>
          </div>
          <div>
            <Text bold style={{ fontSize: '22px', display: 'block' }}>{recipe.proteinPer100g.toFixed(1)}</Text>
            <Text variant="small" muted>белки</Text>
          </div>
          <div>
            <Text bold style={{ fontSize: '22px', display: 'block' }}>{recipe.fatPer100g.toFixed(1)}</Text>
            <Text variant="small" muted>жиры</Text>
          </div>
          <div>
            <Text bold style={{ fontSize: '22px', display: 'block' }}>{recipe.carbPer100g.toFixed(1)}</Text>
            <Text variant="small" muted>углеводы</Text>
          </div>
        </div>
      </Card>

      {/* Info */}
      <Card style={{ marginBottom: theme.spacing.md }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
          <Text variant="small" muted>{t('recipes.totalWeight')}</Text>
          <Text bold>{recipe.totalCookedWeightG}г</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
          <Text variant="small" muted>{t('recipeEditor.calculationMode')}</Text>
          <Text bold>{modeLabel[recipe.calculationMode] || recipe.calculationMode}</Text>
        </div>
        {recipe.servingName && recipe.servingGrams && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text variant="small" muted>{recipe.servingName}</Text>
            <Text bold>{recipe.servingGrams}г ({((recipe.kcalPer100g * recipe.servingGrams) / 100).toFixed(0)} ккал)</Text>
          </div>
        )}
      </Card>

      {/* Ingredients */}
      {recipe.ingredients.length > 0 && (
        <Card style={{ marginBottom: theme.spacing.md }}>
          <Text variant="h2" style={{ marginBottom: theme.spacing.sm }}>{t('recipes.ingredients')}</Text>
          {recipe.ingredients.map((ing, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: `${theme.spacing.xs} 0`,
                borderBottom: index < recipe.ingredients.length - 1 ? `1px solid ${theme.palette.border}` : 'none',
              }}
            >
              <Text>{ing.productName}</Text>
              <div style={{ textAlign: 'right' }}>
                <Text bold>{ing.grams}г</Text>
                <Text variant="small" muted style={{ display: 'block' }}>
                  {ing.kcal.toFixed(0)} ккал
                </Text>
              </div>
            </div>
          ))}
          <div style={{
            marginTop: theme.spacing.sm,
            padding: theme.spacing.sm,
            backgroundColor: theme.palette.surface,
            borderRadius: theme.radius.md,
          }}>
            <Text variant="small" bold>
              {t('recipes.totalWeight')}: {recipe.ingredients.reduce((s, i) => s + i.grams, 0)}г · {recipe.totalKcal.toFixed(0)} ккал
            </Text>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
        <Button onClick={() => setShowAddToDiary(true)}>
           {t('recipes.addToDiary')}
        </Button>
        {isMine ? (
          <div style={{ display: 'flex', gap: theme.spacing.sm }}>
            <Button variant="secondary" onClick={handleDuplicate} style={{ flex: 1 }}>
               {t('recipes.duplicate')}
            </Button>
            <Button variant="danger" onClick={handleArchive} style={{ flex: 1 }}>
              {t('recipes.archive')}
            </Button>
          </div>
        ) : (
          <Button variant="secondary" onClick={handleFork}>
             {t('recipes.fork')}
          </Button>
        )}
      </div>

      {/* Add to diary bottom sheet */}
      <BottomSheet
        isOpen={showAddToDiary}
        onClose={() => setShowAddToDiary(false)}
        header={
          <div style={{ padding: theme.spacing.md, textAlign: 'center' }}>
            <Text variant="h2">{t('recipes.addToDiary')}</Text>
          </div>
        }
        handle={<div style={{ width: '40px', height: '4px', backgroundColor: theme.palette.border, borderRadius: '2px', margin: `${theme.spacing.sm} auto` }} />}
      >
        <div style={{ padding: theme.spacing.md }}>
          <div style={{ marginBottom: theme.spacing.md }}>
            <Input
              label={t('entry.date')}
              type="date"
              value={diaryDate}
              onChange={(e) => setDiaryDate(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: theme.spacing.md }}>
            <label style={{ display: 'block', marginBottom: theme.spacing.xs, fontWeight: '600', color: theme.palette.text, fontSize: theme.typography.small.fontSize }}>
              {t('entry.mealType')}
            </label>
            <select
              value={diaryMealType}
              onChange={(e) => setDiaryMealType(e.target.value)}
              style={{
                width: '100%',
                padding: theme.spacing.sm,
                fontSize: theme.typography.body.fontSize,
                backgroundColor: theme.palette.bg,
                color: theme.palette.text,
                border: `1px solid ${theme.palette.border}`,
                borderRadius: theme.radius.sm,
                boxSizing: 'border-box',
              }}
            >
              <option value="other">{t('mealType.other')}</option>
              <option value="breakfast">{t('mealType.breakfast')}</option>
              <option value="lunch">{t('mealType.lunch')}</option>
              <option value="dinner">{t('mealType.dinner')}</option>
              <option value="snack">{t('mealType.snack')}</option>
            </select>
          </div>

          <div style={{ marginBottom: theme.spacing.md }}>
            <Input
              label={t('entry.grams')}
              type="number"
              inputMode="decimal"
              placeholder="150"
              value={diaryGrams}
              onChange={(e) => setDiaryGrams(e.target.value)}
            />
            {recipe.servingGrams && (
              <div style={{ display: 'flex', gap: theme.spacing.xs, marginTop: theme.spacing.xs }}>
                <Button size="sm" variant="ghost" onClick={() => setDiaryGrams(recipe.servingGrams!.toString())}>
                  {recipe.servingName || '1 порция'} ({recipe.servingGrams}г)
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDiaryGrams('100')}>
                  100г
                </Button>
              </div>
            )}
          </div>

          {diaryGramsNum > 0 && (
            <Card style={{ marginBottom: theme.spacing.md, backgroundColor: theme.palette.primary + '15' }}>
              <Text variant="small" bold style={{ display: 'block' }}>
                {recipe.name} · {diaryGramsNum}г
              </Text>
              <Text variant="small" muted>
                {diaryPreview.kcal} ккал · Б{diaryPreview.protein} Ж{diaryPreview.fat} У{diaryPreview.carb}
              </Text>
            </Card>
          )}

          <Button onClick={handleAddToDiary} disabled={addingToDiary || diaryGramsNum <= 0}>
            {addingToDiary ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
