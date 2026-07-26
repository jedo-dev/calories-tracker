import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useDebounce } from '../hooks/useDebounce';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Text } from '../ui/Text';
import { RecipeCardSkeleton } from '../ui/RecipeCardSkeleton';
import { IconButton } from '../ui/IconButton';
import {
  ArchiveIcon,
  DiaryPlusIcon,
  DuplicateIcon,
  ForkIcon,
  PublishIcon,
  UnarchiveIcon,
  UnpublishIcon,
} from '../ui/icons';

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
  visibility?: string;
  publishedAt?: string;
  forkCount?: number;
  likesCount?: number;
  isMine?: boolean;
  authorSnapshot?: {
    userId: string;
    username?: string;
    displayName?: string;
    avatarEmoji?: string;
  };
}

const PAGE_SIZE = 20;

const modeBadge: Record<string, { label: string; color: string }> = {
  manual: { label: t('recipes.manual'), color: '#6366f1' },
  ingredients: { label: t('recipes.fromIngredients'), color: '#10b981' },
  mixed: { label: t('recipes.mixed'), color: '#f59e0b' },
};

const cardStyle: React.CSSProperties = {
  borderRadius: '22px',
  background: 'linear-gradient(180deg, rgba(17, 49, 69, 0.96), rgba(10, 32, 46, 0.96))',
  border: '1px solid rgba(160, 200, 220, 0.18)',
  boxShadow: '0 22px 44px rgba(0, 0, 0, 0.28)',
  padding: '14px',
};

function Chip({
  active,
  onClick,
  children,
  activeColor,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  activeColor?: string;
}) {
  const theme = useTheme();
  const color = activeColor || theme.palette.primary;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 12px',
        borderRadius: '12px',
        border: `1px solid ${active ? color : 'rgba(255,255,255,0.12)'}`,
        background: active
          ? `linear-gradient(180deg, ${color}33, ${color}1f)`
          : 'rgba(255,255,255,0.06)',
        color: active ? color : theme.palette.textMuted,
        fontSize: '12px',
        fontWeight: 700,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

export const MACRO_COLORS = { protein: '#5AC8FA', fat: '#FFCC66', carb: '#C792EA' };

function MacroStat({ letter, value, color, textColor }: { letter: string; value: number; color: string; textColor: string }) {
  return (
    <span style={{ whiteSpace: 'nowrap' }}>
      <span style={{ fontSize: '11px', fontWeight: 800, color }}>{letter}</span>
      <span style={{ fontSize: '14px', fontWeight: 700, color: textColor }}> {value.toFixed(1)}</span>
    </span>
  );
}

function SearchIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

export function RecipesPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [tab, setTab] = useState<'my' | 'board'>('my');
  const [search, setSearch] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [boardSort, setBoardSort] = useState<'newest' | 'popular' | 'forks'>('newest');
  const debouncedSearch = useDebounce(search, 300);

  const fetchPage = useCallback(
    async (offset: number, limit: number): Promise<Recipe[]> => {
      const params: any = { limit, offset };
      if (debouncedSearch.trim()) params.search = debouncedSearch;
      if (tab === 'my') {
        if (includeArchived) params.includeArchived = true;
        const response = await apiClient.get('/recipes', { params });
        return response.data;
      }
      params.sort = boardSort;
      const response = await apiClient.get('/recipes/board', { params });
      return response.data;
    },
    [tab, debouncedSearch, includeArchived, boardSort],
  );

  const { items: recipes, loading, loadingMore, hasMore, sentinelRef, reload } = usePaginatedList(
    fetchPage,
    [tab, debouncedSearch, includeArchived, boardSort],
    PAGE_SIZE,
  );

  const mutate = async (action: () => Promise<unknown>) => {
    try {
      await action();
      reload();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublish = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    mutate(() => apiClient.post(`/recipes/${id}/publish`));
  };

  const handleUnpublish = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    mutate(() => apiClient.post(`/recipes/${id}/unpublish`));
  };

  const handleFork = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.post(`/recipes/${id}/fork`);
      alert(t('recipes.forkSuccess'));
    } catch (err: any) {
      alert(err.response?.data?.message || t('recipes.forkFailed'));
    }
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    mutate(() => apiClient.post(`/recipes/${id}/duplicate`));
  };

  const handleArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    mutate(() => apiClient.delete(`/recipes/${id}`));
  };

  const handleUnarchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    mutate(() => apiClient.post(`/recipes/${id}/unarchive`));
  };

  const handleAddToDiary = (recipe: Recipe, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/entry/new?recipeId=${recipe._id}&recipeName=${encodeURIComponent(recipe.name)}&kcal=${recipe.kcalPer100g}&protein=${recipe.proteinPer100g}&fat=${recipe.fatPer100g}&carb=${recipe.carbPer100g}`);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        maxWidth: '520px',
        margin: '0 auto',
        padding: '12px',
        paddingBottom: '100px',
        background: `
          radial-gradient(circle at top, rgba(83, 212, 107, 0.18), transparent 34%),
          radial-gradient(circle at 20% 25%, rgba(60, 140, 255, 0.12), transparent 24%),
          linear-gradient(180deg, #07111d 0%, ${theme.palette.bg} 28%, #081523 100%)
        `,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <Text variant="h2" bold style={{ fontSize: '20px' }}>
          {tab === 'my' ? t('recipes.myRecipes') : t('recipes.boardTitle')}
        </Text>
        {tab === 'my' && (
          <button
            type="button"
            onClick={() => navigate('/recipes/new')}
            title={t('recipes.create')}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))',
              color: '#07210f',
              fontSize: '22px',
              fontWeight: 700,
              lineHeight: 1,
              cursor: 'pointer',
              boxShadow: '0 10px 20px rgba(83, 212, 107, 0.24)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            +
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <Chip active={tab === 'my'} onClick={() => { setTab('my'); setSearch(''); }}>
          {t('recipes.myRecipes')}
        </Chip>
        <Chip active={tab === 'board'} onClick={() => { setTab('board'); setSearch(''); }}>
          {t('recipes.board')}
        </Chip>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
          <SearchIcon color={theme.palette.textMuted} />
        </div>
        <input
          type="text"
          placeholder={t('recipes.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            height: '46px',
            padding: '0 14px 0 40px',
            borderRadius: '16px',
            border: '1px solid rgba(160, 200, 220, 0.18)',
            background: 'rgba(255, 255, 255, 0.06)',
            color: theme.palette.text,
            fontSize: '15px',
            outline: 'none',
          }}
        />
      </div>

      {/* Filters */}
      {tab === 'board' ? (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {(['newest', 'popular', 'forks'] as const).map((s) => (
            <Chip key={s} active={boardSort === s} onClick={() => setBoardSort(s)}>
              {s === 'newest' ? t('recipes.sortNewest') : s === 'popular' ? t('recipes.sortPopular') : t('recipes.sortForks')}
            </Chip>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <Chip active={includeArchived} onClick={() => setIncludeArchived(!includeArchived)} activeColor="#f59e0b">
            {t('recipes.archived')}
          </Chip>
        </div>
      )}

      {/* Recipe list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Array.from({ length: 4 }, (_, i) => (
            <RecipeCardSkeleton key={i} />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        tab === 'my' ? (
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
          <EmptyState
            title={t('recipes.noBoardRecipes')}
            description={t('recipes.noBoardRecipesDesc')}
          />
        )
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {recipes.map((recipe) => {
            const badge = modeBadge[recipe.calculationMode] || modeBadge.manual;
            const isPublished = recipe.visibility === 'public';
            const isBoard = tab === 'board';
            const author = recipe.authorSnapshot;

            return (
              <div
                key={recipe._id}
                onClick={() => navigate(`/recipes/${recipe._id}`)}
                style={{
                  ...cardStyle,
                  opacity: recipe.isArchived ? 0.55 : 1,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  {recipe.photoUrl ? (
                    <img
                      src={recipe.photoUrl}
                      alt={recipe.name}
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '14px',
                        objectFit: 'cover',
                        flexShrink: 0,
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '14px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={theme.palette.textMuted} strokeWidth="1.6" strokeLinecap="round">
                        <path d="M4 19h16M6 19v-2a6 6 0 0 1 12 0v2M12 11V8" />
                        <circle cx="12" cy="6" r="1.6" />
                      </svg>
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <Text bold style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {recipe.name}
                      </Text>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '10px',
                          backgroundColor: badge.color + '26',
                          color: badge.color,
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {badge.label}
                      </span>
                      {isBoard && recipe.isMine && (
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '3px 8px',
                            borderRadius: '10px',
                            backgroundColor: theme.palette.primary + '26',
                            color: theme.palette.primary,
                            fontWeight: 700,
                          }}
                        >
                          {t('recipes.myRecipe')}
                        </span>
                      )}
                    </div>

                    {isBoard && author && !recipe.isMine && (
                      <Text variant="small" muted style={{ display: 'block', marginBottom: '2px' }}>
                        {author.avatarEmoji} {author.displayName || author.username}
                      </Text>
                    )}

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '17px', fontWeight: 800, color: theme.palette.primary }}>
                          {recipe.kcalPer100g.toFixed(0)}
                        </span>
                        <span style={{ fontSize: '11px', color: theme.palette.textMuted }}> ккал</span>
                      </span>
                      <MacroStat letter="Б" value={recipe.proteinPer100g} color={MACRO_COLORS.protein} textColor={theme.palette.text} />
                      <MacroStat letter="Ж" value={recipe.fatPer100g} color={MACRO_COLORS.fat} textColor={theme.palette.text} />
                      <MacroStat letter="У" value={recipe.carbPer100g} color={MACRO_COLORS.carb} textColor={theme.palette.text} />
                      <span style={{ fontSize: '11px', color: theme.palette.textMuted }}>{t('recipes.per100g')}</span>
                    </div>
                    <Text variant="small" muted style={{ display: 'block', marginTop: '2px' }}>
                      {t('recipes.totalWeight')}: {recipe.totalCookedWeightG}г
                    </Text>

                    {tab === 'my' && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px', alignItems: 'center' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '3px 8px',
                            borderRadius: '10px',
                            backgroundColor: isPublished ? theme.palette.success + '26' : 'rgba(255,255,255,0.06)',
                            color: isPublished ? theme.palette.success : theme.palette.textMuted,
                            fontWeight: 700,
                          }}
                        >
                          {isPublished ? t('recipes.published') : t('recipes.private')}
                        </span>
                        {isPublished && !!recipe.likesCount && (
                          <Text variant="small" muted>♥ {recipe.likesCount}</Text>
                        )}
                        {isPublished && !!recipe.forkCount && (
                          <Text variant="small" muted>⑂ {recipe.forkCount}</Text>
                        )}
                      </div>
                    )}

                    {isBoard && (
                      <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                        {!!recipe.likesCount && <Text variant="small" muted>♥ {recipe.likesCount}</Text>}
                        {!!recipe.forkCount && <Text variant="small" muted>⑂ {recipe.forkCount}</Text>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  {tab === 'my' ? (
                    <>
                      <IconButton label={t('recipes.addToDiary')} onClick={(e) => handleAddToDiary(recipe, e)} active>
                        <DiaryPlusIcon />
                      </IconButton>
                      {isPublished ? (
                        <IconButton label={t('recipes.unpublish')} onClick={(e) => handleUnpublish(recipe._id, e)}>
                          <UnpublishIcon />
                        </IconButton>
                      ) : (
                        <IconButton label={t('recipes.publish')} onClick={(e) => handlePublish(recipe._id, e)}>
                          <PublishIcon />
                        </IconButton>
                      )}
                      <IconButton label={t('recipes.duplicate')} onClick={(e) => handleDuplicate(recipe._id, e)}>
                        <DuplicateIcon />
                      </IconButton>
                      {recipe.isArchived ? (
                        <IconButton label={t('recipes.unarchive')} onClick={(e) => handleUnarchive(recipe._id, e)}>
                          <UnarchiveIcon />
                        </IconButton>
                      ) : (
                        <IconButton label={t('recipes.archive')} onClick={(e) => handleArchive(recipe._id, e)} danger>
                          <ArchiveIcon />
                        </IconButton>
                      )}
                    </>
                  ) : (
                    <>
                      <IconButton label={t('recipes.addToDiary')} onClick={(e) => handleAddToDiary(recipe, e)} active>
                        <DiaryPlusIcon />
                      </IconButton>
                      {!recipe.isMine && (
                        <IconButton label={t('recipes.fork')} onClick={(e) => handleFork(recipe._id, e)}>
                          <ForkIcon />
                        </IconButton>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {loadingMore && (
            <>
              <RecipeCardSkeleton />
              <RecipeCardSkeleton />
            </>
          )}
          {hasMore && !loadingMore && <div ref={sentinelRef} style={{ height: '1px' }} />}
        </div>
      )}
    </div>
  );
}
