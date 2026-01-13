import { useEffect } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AddEntryPage } from './pages/AddEntryPage';
import { EntryPage } from './pages/EntryPage';
import { FeedPage } from './pages/FeedPage';
import { FriendsPage } from './pages/FriendsPage';
import { HomePage } from './pages/HomePage';
import { LeaguePage } from './pages/LeaguePage';
import { ProductsPage } from './pages/ProductsPage';
import { TodayPage } from './pages/TodayPage';
import { useTheme } from './theme/useTheme';
import { Footer } from './widget/Footer/Footer';
import { Header } from './widget/Header/Header';

function App() {
  const theme = useTheme();

  useEffect(() => {
    document.body.style.backgroundColor = theme.palette.bg;
    document.body.style.color = theme.palette.text;
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EntryPage />} />
        <Route
          element={
            <div>
              <Header />
              <Outlet />
              <Footer />
            </div>
          }
        >

        
          <Route path="/home" element={<HomePage />} />
          <Route path="/today" element={<TodayPage />} />
          <Route path="/entry/new" element={<AddEntryPage />} />
          <Route path="/entry/:id" element={<AddEntryPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/league" element={<LeaguePage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

