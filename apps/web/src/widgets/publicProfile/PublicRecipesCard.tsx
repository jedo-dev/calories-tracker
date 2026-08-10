import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';
import { Icon } from '../../ui/Icon';
import { publicCardStyle } from './types';

interface RecipeItem {
  _id: string;
  name: string;
  photoUrl?: string;
  kcalPer100g?: number;
  proteinPer100g?: number;
  fatPer100g?: number;
  carbPer100g?: number;
}

interface PublicRecipesCardProps {
  recipes: RecipeItem[];
  onOpen: (recipeId: string) => void;
}

export function PublicRecipesCard({ recipes, onOpen }: PublicRecipesCardProps) {
  const theme = useTheme();
  if (recipes.length === 0) return null;

  return (
    <div style={publicCardStyle}>
      <Text variant="h2" bold style={{ display: 'block', fontSize: '16px', marginBottom: '10px' }}>
        {t('recipes.userRecipes')}
      </Text>
      {recipes.map((recipe) => (
        <button
          key={recipe._id}
          type="button"
          onClick={() => onOpen(recipe._id)}
          style={{
            width: '100%',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            padding: '8px',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)',
            cursor: 'pointer',
            textAlign: 'left',
            color: theme.palette.text,
            marginBottom: '6px',
            fontFamily: 'inherit',
          }}
        >
          {recipe.photoUrl ? (
            <img
              src={recipe.photoUrl}
              alt={recipe.name}
              style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }}
            />
          ) : (
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0,
              }}
            >
              <Icon name="meal" size={24} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text bold style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {recipe.name}
            </Text>
            <Text variant="small" muted style={{ fontSize: '11px' }}>
              {recipe.kcalPer100g?.toFixed(0)} ккал · Б{recipe.proteinPer100g?.toFixed(1)} Ж{recipe.fatPer100g?.toFixed(1)} У{recipe.carbPer100g?.toFixed(1)}
            </Text>
          </div>
          <span style={{ color: theme.palette.textMuted, fontSize: '12px', flexShrink: 0 }}>▸</span>
        </button>
      ))}
    </div>
  );
}
