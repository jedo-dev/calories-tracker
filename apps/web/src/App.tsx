import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AddEntryPage } from './pages/AddEntryPage';
import { EntryPage } from './pages/EntryPage';
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { TodayPage } from './pages/TodayPage';
import { useTheme } from './theme/useTheme';

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
        <Route path="/entry" element={<EntryPage />} />
        <Route path="/today" element={<TodayPage />} />
        <Route path="/entry/new" element={<AddEntryPage />} />
        <Route path="/entry/:id" element={<AddEntryPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="*" element={<Navigate to="/today" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

