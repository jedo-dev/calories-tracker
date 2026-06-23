import { useEffect, useState } from 'react';
import { apiClient } from '../../../api/client';
import { t } from '../../../i18n';
import { useTheme } from '../../../theme/useTheme';
import { Button } from '../../../ui/Button';
import { Card } from '../../../ui/Card';
import { Text } from '../../../ui/Text';

interface RecentProduct {
  productId: string;
  productName: string;
  grams: number;
  kcal: number;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbPer100g: number;
  lastUsed: string;
}

interface Props {
  date: string;
  onAdded: () => void;
}

export function RecentProducts({ date, onAdded }: Props) {
  const theme = useTheme();
  const [recent, setRecent] = useState<RecentProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecent();
  }, []);

  const loadRecent = async () => {
    try {
      const res = await apiClient.get('/entries/recent');
      setRecent(res.data);
    } catch (err) {
      console.error('Failed to load recent entries:', err);
    }
  };

  const handleQuickAdd = async (product: RecentProduct, grams: number) => {
    setLoading(true);
    try {
      await apiClient.post('/entries', {
        date,
        productId: product.productId,
        grams,
        mealType: 'other',
      });
      onAdded();
      await loadRecent();
    } catch (err) {
      console.error('Failed to add entry:', err);
    } finally {
      setLoading(false);
    }
  };

  if (recent.length === 0) return null;

  // Filter out very small portions and deduplicate
  const filtered = recent
    .filter(p => p.grams >= 10)
    .reduce((acc, p) => {
      const existing = acc.find(x => x.productId === p.productId);
      if (!existing) acc.push(p);
      return acc;
    }, [] as RecentProduct[]);

  if (filtered.length === 0) return null;

  return (
    <Card style={{ marginBottom: theme.spacing.md }}>
      <Text variant="h2" style={{ marginBottom: theme.spacing.sm }}>
        ⚡ {t('recentProducts.title')}
      </Text>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
        {filtered.map((product) => (
          <div
            key={product.productId}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: theme.spacing.xs,
              borderRadius: theme.radius.sm,
              backgroundColor: theme.palette.bg,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text
                variant="small"
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                }}
              >
                {product.productName}
              </Text>
              <Text variant="small" muted style={{ fontSize: '10px' }}>
                {product.kcalPer100g} {t('dashboard.kcal')}/100г
              </Text>
            </div>
            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
              {product.grams !== 100 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickAdd(product, product.grams)}
                  disabled={loading}
                  style={{ minWidth: '44px', minHeight: '36px', fontSize: '11px' }}
                >
                  {product.grams}г
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickAdd(product, 100)}
                disabled={loading}
                style={{ minWidth: '44px', minHeight: '36px', fontSize: '11px' }}
              >
                100г
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
