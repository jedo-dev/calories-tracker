import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useDebounce } from '../hooks/useDebounce';
import { useSmoothLoader } from '../hooks/useSmoothLoader';
import emptyProducts from '../assets/03_empty_states/empty_products.jpg';
import DeleteIcon from '../assets/DeleteIcon';
import EditIcon from '../assets/EditIcon';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { ConfirmSheet } from '../ui/ConfirmSheet';
import { Text } from '../ui/Text';
import { PageHeader } from '../ui/PageHeader';
import { showToast } from '../ui/Toast';
import { InlineLoader } from '../ui/Loader';
import { glassCardStyle, pageBackground } from '../theme/styles';
import { MACRO_COLORS, SearchIcon } from './RecipesPage';

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

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

// Компактная стеклянная кнопка-действие на карточке (как chip'ы на /recipes)
const iconBtnStyle: React.CSSProperties = {
  width: '34px',
  height: '34px',
  borderRadius: '12px',
  border: '1px solid rgba(160, 200, 220, 0.24)',
  background: 'rgba(255, 255, 255, 0.06)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  padding: 0,
};

// Единый вид КБЖУ, как в AddEntryPage/RecipesPage: ккал в primary, буквы Б/Ж/У цветные
function MacroLine({ product, primary, muted }: { product: Product; primary: string; muted: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '13px', fontWeight: 700, color: primary }}>{product.kcalPer100g.toFixed(0)}</span>
      <span style={{ fontSize: '11px', color: muted }}>ккал ·</span>
      <span style={{ fontSize: '12px' }}><span style={{ color: MACRO_COLORS.protein, fontWeight: 700 }}>Б</span> {product.proteinPer100g.toFixed(1)}</span>
      <span style={{ fontSize: '12px' }}><span style={{ color: MACRO_COLORS.fat, fontWeight: 700 }}>Ж</span> {product.fatPer100g.toFixed(1)}</span>
      <span style={{ fontSize: '12px' }}><span style={{ color: MACRO_COLORS.carb, fontWeight: 700 }}>У</span> {product.carbPer100g.toFixed(1)}</span>
      <span style={{ fontSize: '11px', color: muted }}>{t('products.per100g')}</span>
    </div>
  );
}

export function ProductsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const loader = useSmoothLoader(loading);

  useEffect(() => {
    apiClient.get('/social/me').then((res) => setMyUserId(res.data.user.id)).catch(() => {});
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      // Без поиска API отдаёт последние 20 добавленных (свои — первыми)
      const params: Record<string, string | number> = { limit: 20 };
      if (debouncedSearch.trim()) params.search = debouncedSearch;
      const response = await apiClient.get('/products', { params });
      setProducts(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('products.loadFailed'));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch]);

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/products/${id}`);
      await fetchProducts();
    } catch (err: any) {
      showToast(err.response?.data?.message || t('products.deleteFailed'));
    } finally {
      setDeleteId(null);
    }
  };

  const canEdit = (product: Product) => {
    return myUserId && product.createdBy && product.createdBy === myUserId;
  };

  return (
    <div style={{ padding: theme.spacing.lg, paddingTop: `calc(${theme.spacing.lg} + env(safe-area-inset-top, 0px))`, maxWidth: '600px', margin: '0 auto', minHeight: '100vh', background: pageBackground(theme.palette.bg), paddingBottom: '100px' }}>
      <PageHeader
        title={t('products.title')}
        right={
          <button
            type="button"
            onClick={() => navigate('/products/new')}
            title={t('products.addProduct')}
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
        }
      />

      {/* Поиск — в едином стиле с /recipes */}
      <div style={{ position: 'relative', marginBottom: theme.spacing.lg }}>
        <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
          <SearchIcon color={theme.palette.textMuted} />
        </div>
        <input
          type="text"
          placeholder={t('products.searchPlaceholder')}
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

      {error && (
        <Card style={{ ...glassCardStyle, marginBottom: theme.spacing.md }}>
          <Text style={{ color: theme.palette.danger }}>{t('common.error')}: {error}</Text>
        </Card>
      )}

      {/* Лоадер-гантеля лежит поверх списка, чтобы контент не прыгал при поиске */}
      <div style={{ position: 'relative', minHeight: loader.visible ? '160px' : undefined }}>
        {loader.visible && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 5,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              paddingTop: '24px',
              borderRadius: theme.radius.md,
              background: `${theme.palette.bg}99`,
              backdropFilter: 'blur(2px)',
              opacity: loader.fading ? 0 : 1,
              transition: `opacity ${loader.fadeMs}ms ease`,
              pointerEvents: loader.fading ? 'none' : 'auto',
            }}
          >
            <InlineLoader variant="dumbbell" />
          </div>
        )}

        {!loading && !loader.visible && !error && products.length === 0 && (
          <EmptyState
            image={emptyProducts}
            title={t('products.noProductsFound')}
          />
        )}

        <div style={{ opacity: loader.visible && !loader.fading ? 0.6 : 1, transition: 'opacity 0.25s ease' }}>
          {products.map((product) => (
            <Card
              key={product._id}
              style={{ ...glassCardStyle, marginBottom: theme.spacing.sm, cursor: 'pointer' }}
              onClick={() => navigate(`/products/${product._id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <Text bold>{product.name}</Text>
                      {canEdit(product) && (
                        <span style={{ fontSize: '10px', fontWeight: 700, color: theme.palette.primary, border: `1px solid ${theme.palette.primary}`, borderRadius: '6px', padding: '1px 6px' }}>
                          {t('products.myBadge')}
                        </span>
                      )}
                    </div>
                    {product.brand && <Text variant="small" muted style={{ display: 'block', fontSize: '11px' }}>{product.brand}</Text>}
                    <MacroLine product={product} primary={theme.palette.primary} muted={theme.palette.textMuted} />
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); navigate(`/products/${product._id}`); }}
                      style={{ ...iconBtnStyle, color: theme.palette.textMuted }}
                      aria-label="Открыть"
                      title="Открыть"
                    >
                      <EyeIcon />
                    </button>
                    {canEdit(product) && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); navigate(`/products/${product._id}/edit`); }}
                          style={{ ...iconBtnStyle, color: theme.palette.textMuted }}
                          aria-label="Редактировать"
                          title="Редактировать"
                        >
                          <EditIcon />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setDeleteId(product._id); }}
                          style={{ ...iconBtnStyle, color: theme.palette.textMuted }}
                          aria-label="Удалить"
                          title="Удалить"
                        >
                          <DeleteIcon />
                        </button>
                      </>
                    )}
                  </div>
                </div>
            </Card>
          ))}
        </div>
      </div>

      <ConfirmSheet
        isOpen={deleteId !== null}
        title={t('products.deleteConfirm')}
        confirmLabel={t('common.delete')}
        danger
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
