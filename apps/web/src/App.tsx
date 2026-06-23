import { useEffect } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AddEntryPage } from './pages/AddEntryPage';
import { EntryPage } from './pages/EntryPage';
import { FeedPage } from './pages/FeedPage';
import { FriendsPage } from './pages/FriendsPage';
import { LeaguePage } from './pages/LeaguePage';
import { ProductsPage } from './pages/ProductsPage';
import { ProfilePage } from './pages/ProfilePage';
import { PublicProfilePage } from './pages/PublicProfilePage';
import { TodayPage } from './pages/TodayPage';
import { WorkoutsPage } from './pages/WorkoutsPage';
import { ExercisesPage } from './pages/ExercisesPage';
import { ActiveWorkoutPage } from './pages/ActiveWorkoutPage';
import { WeightHistoryPage } from './pages/WeightHistoryPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { ReportsPage } from './pages/ReportsPage';
import { MeasurementsPage } from './pages/MeasurementsPage';
import { useTheme } from './theme/useTheme';
import { Footer } from './widget/Footer/Footer';

function AppLayout() {
  return (
    <ProtectedRoute>
      <div>
        <Outlet />
        <Footer />
      </div>
    </ProtectedRoute>
  );
}

function App() {
  const theme = useTheme();

  useEffect(() => {
    document.body.style.backgroundColor = theme.palette.bg;
    document.body.style.color = theme.palette.text;
  }, [theme]);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<EntryPage />} />
          <Route element={<AppLayout />}>
            <Route path="/today" element={<TodayPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/entry/new" element={<AddEntryPage />} />
            <Route path="/entry/:id" element={<AddEntryPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/league" element={<LeaguePage />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/workouts" element={<WorkoutsPage />} />
            <Route path="/workout/category/:categoryId" element={<ExercisesPage />} />
            <Route path="/workout/:sessionId" element={<ActiveWorkoutPage />} />
            <Route path="/weight" element={<WeightHistoryPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/measurements" element={<MeasurementsPage />} />
            <Route path="/users/:userId" element={<PublicProfilePage />} />
            <Route path="*" element={<Navigate to="/today" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
