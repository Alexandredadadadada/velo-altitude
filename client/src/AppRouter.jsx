import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Pages essentielles uniquement pour tester l'authentification
import EnhancedHomePage from './pages/EnhancedHomePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';

// Environnement de test d'authentification
import AuthTestApp from './tests/auth-test/AuthTestApp';

// Note: Plusieurs imports ont été temporairement commentés pour permettre
// le démarrage de l'application et tester le système d'authentification

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

/**
 * Version simplifiée d'AppRouter pour tester l'authentification
 * 
 * Cette version ne contient que les routes essentielles pour valider
 * le système d'authentification : page d'accueil, login et profil.
 * Les autres routes ont été temporairement supprimées pour éviter
 * les erreurs de compilation dues aux fichiers manquants.
 */
const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Pages publiques essentielles */}
        <Route path="/" element={<EnhancedHomePage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Page de profil protégée pour tester l'authentification */}
        <Route 
          path="/profile" 
          element={<PrivateRoute element={<ProfilePage />} />} 
        />
        
        {/* Environnement de test de l'authentification */}
        <Route
          path="/auth-test/*"
          element={<AuthTestApp />}
        />
        
        {/* Redirection en cas de route non trouvée */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
