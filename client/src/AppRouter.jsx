import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Pages publiques
import HomePage from './pages/HomePage';
import ColsPage from './pages/ColsPage';
import RoutesPage from './pages/RoutesPage';
import TrainingPage from './pages/TrainingPage';
import NutritionPage from './pages/NutritionPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';

// Pages admin
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminColsConditionsPage from './pages/AdminColsConditionsPage';
import AdminApiAnalyticsPage from './pages/AdminApiAnalyticsPage';
import AdminApiSettingsPage from './pages/AdminApiSettingsPage';
import ApiMonitoring from './pages/ApiMonitoring';
import AdminFeatureFlagsPage from './pages/AdminFeatureFlagsPage';

// Composant privé nécessitant une authentification
const PrivateRoute = ({ element }) => {
  const { user, loading } = useAuth();
  
  // Pendant le chargement, montrer un écran de chargement ou rien
  if (loading) {
    return <div>Chargement...</div>;
  }
  
  // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Si l'utilisateur est connecté, afficher le composant demandé
  return element;
};

// Composant privé nécessitant une authentification avec des droits d'administrateur
const AdminRoute = ({ element }) => {
  const { user, loading, isAdmin } = useAuth();
  
  // Pendant le chargement, montrer un écran de chargement ou rien
  if (loading) {
    return <div>Chargement...</div>;
  }
  
  // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Si l'utilisateur est connecté mais n'est pas administrateur, rediriger vers la page d'accueil
  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }
  
  // Si l'utilisateur est administrateur, afficher le composant demandé
  return element;
};

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Pages publiques */}
        <Route path="/" element={<HomePage />} />
        <Route path="/cols" element={<ColsPage />} />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/training" element={<TrainingPage />} />
        <Route path="/nutrition" element={<NutritionPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Pages nécessitant une authentification */}
        <Route 
          path="/profile" 
          element={<PrivateRoute element={<ProfilePage />} />} 
        />
        
        {/* Pages d'administration (nécessitant des droits d'admin) */}
        <Route 
          path="/admin" 
          element={<AdminRoute element={<AdminDashboardPage />} />} 
        />
        <Route 
          path="/admin/api-monitoring" 
          element={<AdminRoute element={<ApiMonitoring />} />} 
        />
        <Route 
          path="/admin/api-analytics" 
          element={<AdminRoute element={<AdminApiAnalyticsPage />} />} 
        />
        <Route 
          path="/admin/api-settings" 
          element={<AdminRoute element={<AdminApiSettingsPage />} />} 
        />
        <Route 
          path="/admin/cols-conditions" 
          element={<AdminRoute element={<AdminColsConditionsPage />} />} 
        />
        <Route 
          path="/admin/feature-flags" 
          element={<AdminRoute element={<AdminFeatureFlagsPage />} />} 
        />
        
        {/* Redirection en cas de route non trouvée */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
