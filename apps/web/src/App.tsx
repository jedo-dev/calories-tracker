import { useTelegramAuth } from './hooks/useTelegramAuth';

function App() {
  const { user, loading, error } = useTelegramAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (user) {
    return (
      <div>
        <h1>Logged in</h1>
        <p>User ID: {user.id}</p>
        <p>Telegram User ID: {user.tgUserId}</p>
        {user.username && <p>Username: @{user.username}</p>}
      </div>
    );
  }

  return <div>Not logged in</div>;
}

export default App;

