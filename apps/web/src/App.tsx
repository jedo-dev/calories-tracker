import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
// Ядро первого экрана грузим сразу; остальное — лениво (code-splitting),
// чтобы 27 страниц (включая админку) не ехали одним бандлом.
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { LandingPage } from './pages/LandingPage';
import { EntryPage } from './pages/EntryPage';
import { TodayPage } from './pages/TodayPage';
import { useTheme } from './theme/useTheme';
import { Footer } from './widget/Footer/Footer';
import Loader, { LoaderOverlayHost } from './ui/Loader';
import { ToastHost } from './ui/Toast';
import { normalizePath, track } from './utils/analytics';
import { FeedbackButton } from './widgets/feedback/FeedbackButton';
import { InstallGuide } from './widgets/pwa/InstallGuide';
import { TourOverlay } from './tour/TourOverlay';

const AddEntryPage = lazy(() => import('./pages/AddEntryPage').then((m) => ({ default: m.AddEntryPage })));
const FeedPage = lazy(() => import('./pages/FeedPage').then((m) => ({ default: m.FeedPage })));
const FriendsPage = lazy(() => import('./pages/FriendsPage').then((m) => ({ default: m.FriendsPage })));
const LeaguePage = lazy(() => import('./pages/LeaguePage').then((m) => ({ default: m.LeaguePage })));
const AchievementsPage = lazy(() => import('./pages/AchievementsPage').then((m) => ({ default: m.AchievementsPage })));
const ProductsPage = lazy(() => import('./pages/ProductsPage').then((m) => ({ default: m.ProductsPage })));
const ProductEditorPage = lazy(() => import('./pages/ProductEditorPage').then((m) => ({ default: m.ProductEditorPage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage').then((m) => ({ default: m.PublicProfilePage })));
const WorkoutsPage = lazy(() => import('./pages/WorkoutsPage').then((m) => ({ default: m.WorkoutsPage })));
const ExercisesPage = lazy(() => import('./pages/ExercisesPage').then((m) => ({ default: m.ExercisesPage })));
const ActiveWorkoutPage = lazy(() => import('./pages/ActiveWorkoutPage').then((m) => ({ default: m.ActiveWorkoutPage })));
const WorkoutProgramPage = lazy(() => import('./pages/WorkoutProgramPage').then((m) => ({ default: m.WorkoutProgramPage })));
const AdminWorkoutsPage = lazy(() => import('./pages/AdminWorkoutsPage').then((m) => ({ default: m.AdminWorkoutsPage })));
const WorkoutSummaryPage = lazy(() => import('./pages/WorkoutSummaryPage').then((m) => ({ default: m.WorkoutSummaryPage })));
const WorkoutHistoryDetailPage = lazy(() => import('./pages/WorkoutHistoryDetailPage').then((m) => ({ default: m.WorkoutHistoryDetailPage })));
const WeightHistoryPage = lazy(() => import('./pages/WeightHistoryPage').then((m) => ({ default: m.WeightHistoryPage })));
const TemplatesPage = lazy(() => import('./pages/TemplatesPage').then((m) => ({ default: m.TemplatesPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const MeasurementsPage = lazy(() => import('./pages/MeasurementsPage').then((m) => ({ default: m.MeasurementsPage })));
const RecipesPage = lazy(() => import('./pages/RecipesPage').then((m) => ({ default: m.RecipesPage })));
const RecipeEditorPage = lazy(() => import('./pages/RecipeEditorPage').then((m) => ({ default: m.RecipeEditorPage })));
const RecipeDetailPage = lazy(() => import('./pages/RecipeDetailPage').then((m) => ({ default: m.RecipeDetailPage })));
const MealPlanPage = lazy(() => import('./pages/MealPlanPage').then((m) => ({ default: m.MealPlanPage })));
const AiLimitsPage = lazy(() => import('./pages/AiLimitsPage').then((m) => ({ default: m.AiLimitsPage })));
const MenuPage = lazy(() => import('./pages/MenuPage').then((m) => ({ default: m.MenuPage })));
const AdminAnalyticsPage = lazy(() => import('./pages/AdminAnalyticsPage').then((m) => ({ default: m.AdminAnalyticsPage })));
const MusclesPage = lazy(() => import('./pages/MusclesPage').then((m) => ({ default: m.MusclesPage })));
const ExerciseDetailPage = lazy(() => import('./pages/ExerciseDetailPage').then((m) => ({ default: m.ExerciseDetailPage })));
const ProgramBuilderPage = lazy(() => import('./pages/ProgramBuilderPage').then((m) => ({ default: m.ProgramBuilderPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const FastingPage = lazy(() => import('./pages/FastingPage').then((m) => ({ default: m.FastingPage })));

// Автотрекинг просмотров страниц: одно событие на смену маршрута,
// динамические id в пути схлопываются в :id
function PageViewTracker() {
  const location = useLocation();
  useEffect(() => {
    track('page_view', { path: normalizePath(location.pathname) });
  }, [location.pathname]);
  useEffect(() => {
    track('app_open');
  }, []);
  return null;
}

function AppLayout() {
  return (
    <ProtectedRoute>
      <div style={{
        maxWidth: '480px',
        margin: '0 auto',
        minHeight: '100vh',
        position: 'relative',
      }}>
        <Suspense fallback={<Loader />}>
          <Outlet />
        </Suspense>
        <Footer />
        <InstallGuide />
        <FeedbackButton />
        <TourOverlay />
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
        <PageViewTracker />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/privacy"
            element={
              <Suspense fallback={<Loader />}>
                <PrivacyPage />
              </Suspense>
            }
          />
          <Route
            path="/verify-email"
            element={
              <Suspense fallback={<Loader />}>
                <VerifyEmailPage />
              </Suspense>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <Suspense fallback={<Loader />}>
                <ForgotPasswordPage />
              </Suspense>
            }
          />
          <Route
            path="/reset-password"
            element={
              <Suspense fallback={<Loader />}>
                <ResetPasswordPage />
              </Suspense>
            }
          />
          <Route path="/" element={<LandingPage />} />
          {/* Прежний онбординг-слайдер оставлен на /welcome */}
          <Route path="/welcome" element={<EntryPage />} />
          <Route element={<AppLayout />}>
            <Route path="/today" element={<TodayPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/ai-limits" element={<AiLimitsPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/entry/new" element={<AddEntryPage />} />
            <Route path="/entry/:id" element={<AddEntryPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/new" element={<ProductEditorPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/products/:id/edit" element={<ProductEditorPage />} />
            <Route path="/league" element={<LeaguePage />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/workouts" element={<WorkoutsPage />} />
            <Route path="/muscles" element={<MusclesPage />} />
            <Route path="/exercise/:exerciseId" element={<ExerciseDetailPage />} />
            <Route path="/admin/workouts" element={<AdminWorkoutsPage />} />
            <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
            <Route path="/workout/program-builder" element={<ProgramBuilderPage />} />
            <Route path="/workout/program/:programId" element={<WorkoutProgramPage />} />
            <Route path="/workout/category/:categoryId" element={<ExercisesPage />} />
            <Route path="/workout/history/:sessionId" element={<WorkoutHistoryDetailPage />} />
            <Route path="/workout/:sessionId/summary" element={<WorkoutSummaryPage />} />
            <Route path="/workout/:sessionId" element={<ActiveWorkoutPage />} />
            <Route path="/weight" element={<WeightHistoryPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/measurements" element={<MeasurementsPage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/recipes/new" element={<RecipeEditorPage />} />
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
            <Route path="/recipes/:id/edit" element={<RecipeEditorPage />} />
            <Route path="/meal-plan" element={<MealPlanPage />} />
            <Route path="/fasting" element={<FastingPage />} />
            <Route path="/users/:userId" element={<PublicProfilePage />} />
            <Route path="*" element={<Navigate to="/today" replace />} />
          </Route>
        </Routes>
        <LoaderOverlayHost />
        <ToastHost />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
