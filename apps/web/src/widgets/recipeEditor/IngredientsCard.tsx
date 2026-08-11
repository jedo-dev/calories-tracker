import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useDebounce } from '../../hooks/useDebounce';
import { t } from '../../i18n';
import { glassCardStyle } from '../../theme/styles';
import { useTheme } from '../../theme/useTheme';
import { Card } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Text } from '../../ui/Text';

export interface IngredientProduct {
  _id: string;
  name: string;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbPer100g: number;
  source?: string;
}

export interface Ingredient {
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

interface IngredientsCardProps {
  ingredients: Ingredient[];
  onAdd: (product: IngredientProduct) => void;
  onUpdateGrams: (index: number, grams: number) => void;
  onRemove: (index: number) => void;
}

// Секция ингредиентов рецепта: поиск по продуктам + список с граммовками.
// Поиск (стейт + дебаунс + запрос) живёт внутри виджета.
export function IngredientsCard({ ingredients, onAdd, onUpdateGrams, onRemove }: IngredientsCardProps) {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<IngredientProduct[]>([]);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (debouncedSearch.trim().length >= 2) {
      apiClient
        .get('/products', { params: { search: debouncedSearch, limit: 15 } })
        .then((res) => setResults(res.data))
        .catch((err) => console.error(err));
    } else {
      setResults([]);
    }
  }, [debouncedSearch]);

  const totals = ingredients.reduce(
    (acc, ing) => ({
      kcal: acc.kcal + ing.kcal,
      protein: acc.protein + ing.protein,
      fat: acc.fat + ing.fat,
      carb: acc.carb + ing.carb,
      grams: acc.grams + ing.grams,
    }),
    { kcal: 0, protein: 0, fat: 0, carb: 0, grams: 0 },
  );

  const handleAdd = (product: IngredientProduct) => {
    onAdd(product);
    setSearch('');
    setResults([]);
  };

  return (
    <Card style={{ ...glassCardStyle, marginBottom: '12px' }}>
      <Text variant="h2" style={{ marginBottom: theme.spacing.sm }}>{t('recipeEditor.ingredientsTitle')}</Text>

      <Input
        type="text"
        placeholder={t('recipeEditor.searchProducts')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {results.length > 0 && (
        <Card style={{ marginTop: theme.spacing.xs, maxHeight: '200px', overflowY: 'auto', padding: 0 }}>
          {results.map((product) => (
            <div
              key={product._id}
              onClick={() => handleAdd(product)}
              style={{
                padding: theme.spacing.sm,
                cursor: 'pointer',
                borderBottom: `1px solid ${theme.palette.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.palette.surface; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <div>
                <Text bold>{product.name}</Text>
                {product.source === 'RECIPE' && (
                  <span style={{ fontSize: '11px', padding: '1px 4px', borderRadius: '3px', backgroundColor: theme.palette.primary + '20', color: theme.palette.primary, marginLeft: '4px' }}>
                    {t('recipes.dish')}
                  </span>
                )}
              </div>
              <Text variant="small" muted>{product.kcalPer100g} ккал</Text>
            </div>
          ))}
        </Card>
      )}

      {ingredients.length > 0 ? (
        <div style={{ marginTop: theme.spacing.sm }}>
          {ingredients.map((ing, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                padding: `${theme.spacing.sm} 0`,
                borderBottom: `1px solid ${theme.palette.border}`,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text bold style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                  {ing.productName}
                </Text>
                <Text variant="small" muted>
                  {ing.kcal.toFixed(0)} ккал · Б{ing.protein.toFixed(1)} Ж{ing.fat.toFixed(1)} У{ing.carb.toFixed(1)}
                </Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="number"
                  inputMode="decimal"
                  value={ing.grams}
                  onChange={(e) => onUpdateGrams(index, parseFloat(e.target.value) || 0)}
                  style={{
                    width: '70px',
                    padding: '4px 6px',
                    fontSize: theme.typography.small.fontSize,
                    backgroundColor: theme.palette.bg,
                    color: theme.palette.text,
                    border: `1px solid ${theme.palette.border}`,
                    borderRadius: theme.radius.sm,
                    textAlign: 'right',
                    outline: 'none',
                  }}
                />
                <Text variant="small" muted>г</Text>
                <button
                  onClick={() => onRemove(index)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: theme.palette.danger,
                    cursor: 'pointer',
                    fontSize: '18px',
                    padding: '4px',
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          <div style={{
            marginTop: theme.spacing.sm,
            padding: theme.spacing.sm,
            backgroundColor: theme.palette.surface,
            borderRadius: theme.radius.md,
          }}>
            <Text variant="small" bold>{t('recipeEditor.ingredientTotal')}</Text>
            <Text variant="small" muted style={{ display: 'block' }}>
              {totals.kcal.toFixed(0)} ккал · Б{totals.protein.toFixed(1)} Ж{totals.fat.toFixed(1)} У{totals.carb.toFixed(1)}
            </Text>
            <Text variant="small" muted style={{ display: 'block' }}>
              {t('recipes.totalWeight')}: {totals.grams}г
            </Text>
          </div>
        </div>
      ) : (
        <Text variant="small" muted style={{ display: 'block', marginTop: theme.spacing.sm }}>
          {t('recipes.noIngredients')}
        </Text>
      )}
    </Card>
  );
}
