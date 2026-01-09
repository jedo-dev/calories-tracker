import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

interface Entry {
  _id: string;
  productName: string;
  grams: number;
  kcal: number;
  protein: number;
  fat: number;
  carb: number;
  time?: string;
  mealType: string;
}

interface DayStats {
  date: string;
  totals: {
    kcal: number;
    protein: number;
    fat: number;
    carb: number;
  };
  entriesCount: number;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function TodayPage() {
  const navigate = useNavigate();
  const [date] = useState(formatDate(new Date()));
  const [entries, setEntries] = useState<Entry[]>([]);
  const [stats, setStats] = useState<DayStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [entriesRes, statsRes] = await Promise.all([
        apiClient.get(`/entries?date=${date}`),
        apiClient.get(`/stats/day?date=${date}`),
      ]);
      setEntries(entriesRes.data);
      setStats(statsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [date]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    try {
      await apiClient.delete(`/entries/${id}`);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete entry');
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Today - {date}</h1>

      {stats && (
        <div
          style={{
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px',
            backgroundColor: '#f5f5f5',
          }}
        >
          <h2>Totals</h2>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
            {stats.totals.kcal.toFixed(1)} kcal
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            P: {stats.totals.protein.toFixed(1)}g | F: {stats.totals.fat.toFixed(1)}g | C:{' '}
            {stats.totals.carb.toFixed(1)}g
          </div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
            {stats.entriesCount} entries
          </div>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => navigate('/entry/new')}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          + Add Entry
        </button>
      </div>

      <div>
        <h2>Entries</h2>
        {entries.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
            No entries for today
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry._id}
              style={{
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '15px',
                marginBottom: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{entry.productName}</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {entry.grams}g · {entry.kcal.toFixed(1)} kcal
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    P: {entry.protein.toFixed(1)}g | F: {entry.fat.toFixed(1)}g | C:{' '}
                    {entry.carb.toFixed(1)}g
                  </div>
                  {(entry.time || entry.mealType !== 'other') && (
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                      {entry.time && `${entry.time} `}
                      {entry.mealType !== 'other' && entry.mealType}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => navigate(`/entry/${entry._id}`)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(entry._id)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

