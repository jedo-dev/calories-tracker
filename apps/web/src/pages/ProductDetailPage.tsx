import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import { PageHeader } from '../ui/PageHeader';
import { InlineLoader } from '../ui/Loader';
import { glassCardStyle, pageBackground } from '../theme/styles';
import { MACRO_COLORS } from './RecipesPage';

interface Product {
  _id: string;
  name: string;
  brand?: string;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbPer100g: number;
  createdBy?: string;
}

// Донат распределения калорий между Б/Ж/У (4/9/4 ккал на грамм)
function MacroDonut({ product }: { product: Product }) {
  const theme = useTheme();
  const size = 200;
  const r = 70;
  const stroke = 24;
  const c = 2 * Math.PI * r;
  const gap = 4; // визуальный зазор между сегментами, px по окружности

  const pKcal = product.proteinPer100g * 4;
  const fKcal = product.fatPer100g * 9;
  const cKcal = product.carbPer100g * 4;
  const total = pKcal + fKcal + cKcal;

  const segments = [
    { key: 'protein', kcal: pKcal, color: MACRO_COLORS.protein },
    { key: 'fat', kcal: fKcal, color: MACRO_COLORS.fat },
    { key: 'carb', kcal: cKcal, color: MACRO_COLORS.carb },
  ].filter((s) => s.kcal > 0);

  let offset = 0;
  const arcs = segments.map((s) => {
    const len = total > 0 ? (s.kcal / total) * c : 0;
    const arc = { ...s, len: Math.max(0, len - gap), offset };
    offset += len;
    return arc;
  });

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={theme.palette.border}
          strokeWidth={stroke}
          opacity={0.22}
        />
        {arcs.map((a) => (
          <circle
            key={a.key}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={a.color}
            strokeWidth={stroke}
            strokeLinecap={arcs.length > 1 ? 'butt' : 'round'}
            strokeDasharray={`${a.len} ${c - a.len}`}
            strokeDashoffset={-a.offset}
          />
        ))}
      </svg>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
        <Text bold style={{ display: 'block', fontSize: '28px', color: theme.palette.primary }}>
          {product.kcalPer100g.toFixed(0)}
        </Text>
        <Text variant="small" muted>ккал · 100 г</Text>
      </div>
    </div>
  );
}

export function ProductDetailPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiClient
      .get(`/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch((err) => setError(err.response?.data?.message || t('products.loadFailed')))
      .finally(() => setLoading(false));
  }, [id]);

  const shares = useMemo(() => {
    if (!product) return null;
    const pKcal = product.proteinPer100g * 4;
    const fKcal = product.fatPer100g * 9;
    const cKcal = product.carbPer100g * 4;
    const total = pKcal + fKcal + cKcal;
    if (total <= 0) return { protein: 0, fat: 0, carb: 0 };
    return {
      protein: Math.round((pKcal / total) * 100),
      fat: Math.round((fKcal / total) * 100),
      carb: Math.round((cKcal / total) * 100),
    };
  }, [product]);

  // Простые эвристики-советы по составу на 100 г
  const tips = useMemo(() => {
    if (!product || !shares) return [];
    const result: string[] = [];
    if (product.kcalPer100g >= 350) result.push(t('products.tipHighKcal'));
    if (product.kcalPer100g > 0 && product.kcalPer100g <= 60) result.push(t('products.tipLowKcal'));
    if (product.proteinPer100g >= 15 || shares.protein >= 40) result.push(t('products.tipHighProtein'));
    if (shares.fat >= 50) result.push(t('products.tipHighFat'));
    if (product.carbPer100g >= 50 || shares.carb >= 60) result.push(t('products.tipHighCarb'));
    if (result.length === 0) result.push(t('products.tipBalanced'));
    return result;
  }, [product, shares]);

  const legend = product && shares ? [
    { label: 'Белки', grams: product.proteinPer100g, pct: shares.protein, color: MACRO_COLORS.protein },
    { label: 'Жиры', grams: product.fatPer100g, pct: shares.fat, color: MACRO_COLORS.fat },
    { label: 'Углеводы', grams: product.carbPer100g, pct: shares.carb, color: MACRO_COLORS.carb },
  ] : [];

  return (
    <div style={{ padding: theme.spacing.lg, paddingTop: `calc(${theme.spacing.lg} + env(safe-area-inset-top, 0px))`, maxWidth: '600px', margin: '0 auto', minHeight: '100vh', background: pageBackground(theme.palette.bg), paddingBottom: '100px' }}>
      <PageHeader title={product?.name || t('products.title')} subtitle={product?.brand} onBack={() => navigate(-1)} />

      {loading && <InlineLoader variant="dumbbell" />}

      {!loading && error && (
        <Card style={glassCardStyle}>
          <Text style={{ color: theme.palette.danger }}>{t('common.error')}: {error}</Text>
        </Card>
      )}

      {!loading && !error && product && shares && (
        <>
          <Card style={{ ...glassCardStyle, marginBottom: theme.spacing.md }}>
            <Text bold style={{ display: 'block', marginBottom: theme.spacing.sm }}>{t('products.macroSplit')}</Text>
            <MacroDonut product={product} />
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: theme.spacing.md }}>
              {legend.map((m) => (
                <div key={m.label} style={{ textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: m.color, marginBottom: '2px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: m.color }} />
                    {m.label}
                  </div>
                  <Text variant="small" style={{ display: 'block' }}>{m.grams.toFixed(1)} г</Text>
                  <Text variant="small" muted>{t('products.kcalShare', { pct: m.pct })}</Text>
                </div>
              ))}
            </div>
          </Card>

          <Card style={glassCardStyle}>
            <Text bold style={{ display: 'block', marginBottom: theme.spacing.sm }}>{t('products.adviceTitle')}</Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
              {tips.map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ flexShrink: 0, marginTop: '2px' }}>💡</span>
                  <Text variant="small">{tip}</Text>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
