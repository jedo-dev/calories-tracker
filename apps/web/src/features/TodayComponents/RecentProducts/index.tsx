import { useEffect, useMemo, useState } from 'react';
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
  compact?: boolean;
}

export function RecentProducts({ date, onAdded, compact = false }: Props) {
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

  const filtered = useMemo(
    () =>
      recent
        .filter((product) => product.grams >= 10)
        .reduce((acc, product) => {
          const existing = acc.find((item) => item.productId === product.productId);
          if (!existing) acc.push(product);
          return acc;
        }, [] as RecentProduct[])
        .slice(0, 5),
    [recent]
  );

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

  if (filtered.length === 0) return null;

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
      {filtered.map((product) => (
        <div
          key={product.productId}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: theme.spacing.sm,
            padding: compact ? `${theme.spacing.sm} 0` : theme.spacing.xs,
            borderRadius: theme.radius.sm,
            backgroundColor: compact ? 'transparent' : theme.palette.bg,
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
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            {product.grams !== 100 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickAdd(product, product.grams)}
                disabled={loading}
                style={{
                  minWidth: '54px',
                  minHeight: '34px',
                  fontSize: '11px',
                  width: 'auto',
                  borderColor: 'rgba(88, 212, 93, 0.45)',
                  color: theme.palette.primary,
                  backgroundColor: 'rgba(88, 212, 93, 0.05)',
                }}
              >
                {product.grams}г
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuickAdd(product, 100)}
              disabled={loading}
              style={{
                minWidth: '54px',
                minHeight: '34px',
                fontSize: '11px',
                width: 'auto',
                borderColor: 'rgba(88, 212, 93, 0.45)',
                color: theme.palette.primary,
                backgroundColor: 'rgba(88, 212, 93, 0.05)',
              }}
            >
              100г
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  if (compact) {
    return content;
  }

  return (
    <Card style={{ marginBottom: theme.spacing.md }}>
      <Text variant="h2" style={{ marginBottom: theme.spacing.sm }}>
        Быстрые добавления
      </Text>
      {content}
    </Card>
  );
}
