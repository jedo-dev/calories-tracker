import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useDebounce } from '../hooks/useDebounce';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { Input } from '../ui/Input';
import { Text } from '../ui/Text';
import Loader from '../ui/Loader';

interface Recipe {
  _id: string;
  name: string;
  photoUrl?: string;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbPer100g: number;
  calculationMode: string;
  isArchived: boolean;
  totalCookedWeightG: number;
  servingGrams?: number;
}

const modeBadge: Record<string, { label: string; color: string }> = {
  manual: { label: t('recipes.manual'), color: '#6366f1' },
  ingredients: { label: t('recipes.fromIngredients'), color: '#10b981' },
  mixed: { label: t('recipes.mixed'), color: '#f59e0b' },
};

export function RecipesPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    loadRecipes();
  }, [debouncedSearch, includeArchived]);

  const loadRecipes = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (debouncedSearch.trim()) params.search = debouncedSearch;
      if (includeArchived) params.includeArchived = true;
      const response = await apiClient.get('/recipes', { params });
      setRecipes(response.data);
    } catch (err) {
      console.error('Failed to load recipes', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.post(`/recipes/${id}/duplicate`);
      loadRecipes();
    } catch (err) {
      console.error(t('recipes.duplicateFailed'), err);
    }
  };

  const handleArchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.delete(`/recipes/${id}`);
      loadRecipes();
    } catch (err) {
      console.error(t('recipes.archiveFailed'), err);
    }
  };

  const handleUnarchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.post(`/recipes/${id}/unarchive`);
      loadRecipes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToDiary = (recipe: Recipe, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/entry/new?recipeId=${recipe._id}&recipeName=${encodeURIComponent(recipe.name)}&kcal=${recipe.kcalPer100g}&protein=${recipe.proteinPer100g}&fat=${recipe.fatPer100g}&carb=${recipe.carbPer100g}`);
  };

  if (loading && recipes.length === 0) {
    return <Loader />;
  }

  return (
    <div style={{ padding: theme.spacing.lg, maxWidth: '600px', margin: '0 auto', minHeight: 'calc(100vh - 64px)', paddingBottom: '100px', backgroundColor: theme.palette.bg }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
        <Text variant="h1">{t('recipes.title')}</Text>
        <Button size="sm" onClick={() => navigate('/recipes/new')}>
          + {t('recipes.create')}
        </Button>
      </div>

      <div style={{ marginBottom: theme.spacing.md }}>
        <Input
          type="text"
          placeholder={t('recipes.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: theme.spacing.md, display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs, cursor: 'pointer', fontSize: theme.typography.small.fontSize, color: theme.palette.textMuted }}>
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => setIncludeArchived(e.target.checked)}
          />
          {t('recipes.archived')}
        </label>
      </div>

      {recipes.length === 0 ? (
        <EmptyState
          title={t('recipes.noRecipes')}
          description={t('recipes.noRecipesDesc')}
          action={
            <Button onClick={() => navigate('/recipes/new')}>
              {t('recipes.create')}
            </Button>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {recipes.map((recipe) => {
            const badge = modeBadge[recipe.calculationMode] || modeBadge.manual;
            return (
              <Card
                key={recipe._id}
                onClick={() => navigate(`/recipes/${recipe._id}`)}
                style={{
                  opacity: recipe.isArchived ? 0.5 : 1,
                  padding: theme.spacing.md,
                }}
              >
                <div style={{ display: 'flex', gap: theme.spacing.md, alignItems: 'flex-start' }}>
                  {recipe.photoUrl ? (
                    <img
                      src={recipe.photoUrl}
                      alt={recipe.name}
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: theme.radius.md,
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: theme.radius.md,
                      backgroundColor: theme.palette.surface,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '28px',
                      flexShrink: 0,
                    }}>
                      🍽️
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs, marginBottom: theme.spacing.xs }}>
                      <Text bold style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {recipe.name}
                      </Text>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: badge.color + '20',
                        color: badge.color,
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                      }}>
                        {badge.label}
                      </span>
                    </div>
                    <Text variant="small" muted>
                      {recipe.kcalPer100g.toFixed(0)} ккал · Б{recipe.proteinPer100g.toFixed(1)} Ж{recipe.fatPer100g.toFixed(1)} У{recipe.carbPer100g.toFixed(1)} {t('recipes.per100g')}
                    </Text>
                    <Text variant="small" muted style={{ display: 'block', marginTop: '2px' }}>
                      {t('recipes.totalWeight')}: {recipe.totalCookedWeightG}г
                    </Text>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: theme.spacing.xs, marginTop: theme.spacing.sm, flexWrap: 'wrap' }}>
                  <Button size="sm" variant="ghost" onClick={(e) => handleAddToDiary(recipe, e)}>
                    📥 {t('recipes.addToDiary')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={(e) => handleDuplicate(recipe._id, e)}>
                    📋 {t('recipes.duplicate')}
                  </Button>
                  {recipe.isArchived ? (
                    <Button size="sm" variant="ghost" onClick={(e) => handleUnarchive(recipe._id, e)}>
                      ♻️ {t('recipes.unarchive')}
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={(e) => handleArchive(recipe._id, e)}>
                      🗄️ {t('recipes.archive')}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
