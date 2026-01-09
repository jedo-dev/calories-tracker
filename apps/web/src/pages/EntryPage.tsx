import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useDebounce } from '../hooks/useDebounce';

interface Product {
  _id: string;
  name: string;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbPer100g: number;
}

interface Entry {
  _id: string;
  date: string;
  time?: string;
  mealType: string;
  productId?: string;
  productName: string;
  grams: number;
  kcalPer100g?: number;
  proteinPer100g?: number;
  fatPer100g?: number;
  carbPer100g?: number;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function EntryPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [date, setDate] = useState(formatDate(new Date()));
  const [time, setTime] = useState('');
  const [mealType, setMealType] = useState('other');
  const [productSearch, setProductSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [grams, setGrams] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(productSearch, 300);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg && tg.BackButton) {
      tg.BackButton.show();
      tg.BackButton.onClick(() => {
        navigate(-1);
      });
      return () => {
        tg.BackButton.hide();
      };
    }
  }, [navigate]);

  useEffect(() => {
    if (isEdit) {
      loadEntry();
    }
  }, [id]);

  const loadEntry = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await apiClient.get(`/entries/${id}`);
      const entry: Entry = response.data;
      setDate(entry.date);
      setTime(entry.time || '');
      setMealType(entry.mealType);
      setGrams(entry.grams.toString());
      if (entry.productId) {
        setSelectedProduct({
          _id: typeof entry.productId === 'string' ? entry.productId : entry.productId.toString(),
          name: entry.productName,
          kcalPer100g: entry.kcalPer100g || 0,
          proteinPer100g: entry.proteinPer100g || 0,
          fatPer100g: entry.fatPer100g || 0,
          carbPer100g: entry.carbPer100g || 0,
        } as Product);
      }
      setProductSearch(entry.productName);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load entry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debouncedSearch.trim() && debouncedSearch.length >= 2) {
      searchProducts();
    } else {
      setProducts([]);
    }
  }, [debouncedSearch]);

  const searchProducts = async () => {
    try {
      const response = await apiClient.get('/products', {
        params: { search: debouncedSearch, limit: 20 },
      });
      setProducts(response.data);
    } catch (err: any) {
      console.error('Failed to search products', err);
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setProductSearch(product.name);
    setProducts([]);
  };

  const handleSave = async () => {
    if (!selectedProduct) {
      alert('Please select a product');
      return;
    }
    if (!grams || parseFloat(grams) <= 0) {
      alert('Please enter grams > 0');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const data = {
        date,
        ...(time && { time }),
        mealType,
        productId: selectedProduct._id,
        grams: parseFloat(grams),
      };

      if (isEdit) {
        await apiClient.patch(`/entries/${id}`, data);
      } else {
        await apiClient.post('/entries', data);
      }

      navigate('/today');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>{isEdit ? 'Edit Entry' : 'Add Entry'}</h1>

      {error && <div style={{ color: 'red', marginBottom: '15px' }}>Error: {error}</div>}

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Date (YYYY-MM-DD)
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ width: '100%', padding: '8px', fontSize: '14px', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Time (HH:mm) - Optional
        </label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          style={{ width: '100%', padding: '8px', fontSize: '14px', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Meal Type
        </label>
        <select
          value={mealType}
          onChange={(e) => setMealType(e.target.value)}
          style={{ width: '100%', padding: '8px', fontSize: '14px', boxSizing: 'border-box' }}
        >
          <option value="other">Other</option>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snack">Snack</option>
        </select>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Product
        </label>
        <input
          type="text"
          placeholder="Search products..."
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          style={{ width: '100%', padding: '8px', fontSize: '14px', boxSizing: 'border-box' }}
        />
        {products.length > 0 && (
          <div
            style={{
              border: '1px solid #ccc',
              borderRadius: '4px',
              marginTop: '5px',
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          >
            {products.map((product) => (
              <div
                key={product._id}
                onClick={() => handleProductSelect(product)}
                style={{
                  padding: '10px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #eee',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{product.name}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {product.kcalPer100g} kcal/100g · P: {product.proteinPer100g.toFixed(1)}g | F:{' '}
                  {product.fatPer100g.toFixed(1)}g | C: {product.carbPer100g.toFixed(1)}g
                </div>
              </div>
            ))}
          </div>
        )}
        {selectedProduct && (
          <div
            style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#e7f3ff',
              borderRadius: '4px',
            }}
          >
            Selected: {selectedProduct.name}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Grams
        </label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Enter grams"
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
          style={{ width: '100%', padding: '8px', fontSize: '14px', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            flex: 1,
            padding: '12px',
            fontSize: '16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            flex: 1,
            padding: '12px',
            fontSize: '16px',
            backgroundColor: saving ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

