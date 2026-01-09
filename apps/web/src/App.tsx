import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { EntryPage } from './pages/EntryPage';
import { ProductsPage } from './pages/ProductsPage';
import { TodayPage } from './pages/TodayPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/today" replace />} />
        <Route path="/today" element={<TodayPage />} />
        <Route path="/entry/new" element={<EntryPage />} />
        <Route path="/entry/:id" element={<EntryPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="*" element={<Navigate to="/today" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

