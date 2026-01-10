import { Link } from 'react-router-dom';
import { useTelegramAuth } from '../hooks/useTelegramAuth';

export function HomePage() {
  const { user, loading, error } = useTelegramAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error аа: {error}</div>;
  }

  if (user) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Logged in</h1>
        <p>User ID: {user.id}</p>
        <p>Telegram User ID: {user.tgUserId}</p>
        {user.username && <p>Username: @{user.username}</p>}
        <div style={{ marginTop: '20px' }}>
          <Link
            to="/today"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
            }}
          >
            Go to today
          </Link>
        </div>
      </div>
    );
  }

  return <div>Not logged in</div>;
}

