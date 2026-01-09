import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../api/client';

interface Product {
  _id: string;
  name: string;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbPer100g: number;
}

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function ProductsPage() {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!debouncedSearch.trim()) {
        setProducts([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get('/products', {
          params: {
            search: debouncedSearch,
            limit: 20,
          },
        });
        setProducts(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to load products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [debouncedSearch]);

  const handleProductClick = (productId: string) => {
    console.log('Selected product ID:', productId);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Products</h1>
      <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '10px',
          fontSize: '16px',
          marginBottom: '20px',
          boxSizing: 'border-box',
        }}
      />

      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}

      {!loading && !error && products.length === 0 && debouncedSearch && (
        <div>No products found</div>
      )}

      {!loading && !error && products.length > 0 && (
        <div>
          {products.map((product) => (
            <div
              key={product._id}
              onClick={() => handleProductClick(product._id)}
              style={{
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '15px',
                marginBottom: '10px',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                {product.name}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                <div>Calories: {product.kcalPer100g} kcal/100g</div>
                <div>
                  P: {product.proteinPer100g.toFixed(1)}g | F:{' '}
                  {product.fatPer100g.toFixed(1)}g | C:{' '}
                  {product.carbPer100g.toFixed(1)}g
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

