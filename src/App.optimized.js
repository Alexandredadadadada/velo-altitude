/**
 * Application Velo-Altitude complètement optimisée
 * Intègre toutes les améliorations de performance, responsive, et usabilité
 */

import React, { useEffect, Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Composants optimisés
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingSpinner } from './components/common/LoadingStates';
import ResponsiveNavigation from './components/layout/ResponsiveNavigation';
import { ResponsiveGridContainer } from './components/layout/ResponsiveGrid';

// Contexte de performance pour l'application
import PerformanceContext from './contexts/PerformanceContext';

// Utilitaires d'optimisation
import enhancedPerformanceMonitoring from './utils/enhancedPerformanceMonitoring';
import routeOptimizer from './utils/routeOptimizer';
import performanceConfig from './config/performance';
import performanceDashboard from './monitoring/dashboard';

// Thème et configuration
import { ENV } from './config/environment';

// Création du thème Velo-Altitude
const veloTheme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
      light: '#757de8',
      dark: '#002984',
      contrastText: '#fff',
    },
    secondary: {
      main: '#f50057',
      light: '#ff4081',
      dark: '#c51162',
      contrastText: '#fff',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 500,
    },
    h2: {
      fontWeight: 500,
    },
    h3: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
});

// Code splitting pour les principales routes
const Home = lazy(() => import('./pages/Home'));
const ColCatalog = lazy(() => import('./pages/ColCatalog'));
const ColDetails = lazy(() => import('./pages/ColDetails'));
const SevenMajors = lazy(() => import('./pages/SevenMajors'));
const Visualization3D = lazy(() => import('./pages/Visualization3D'));
const Training = lazy(() => import('./pages/Training'));
const Nutrition = lazy(() => import('./pages/Nutrition'));
const Recipes = lazy(() => import('./pages/Recipes'));
const Profile = lazy(() => import('./pages/Profile'));
const Community = lazy(() => import('./pages/Community'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Composant pour le monitoring de la navigation
const NavigationMonitor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Enregistrer les changements de route pour l'optimisation
  useEffect(() => {
    const previousPath = sessionStorage.getItem('previousPath') || '/';
    const currentPath = location.pathname;
    
    if (previousPath !== currentPath) {
      routeOptimizer.recordNavigation(previousPath, currentPath);
      sessionStorage.setItem('previousPath', currentPath);
      
      // Précharger les routes probables
      const routesToPrefetch = routeOptimizer.prefetchConnectedRoutes(currentPath);
      
      // Simulation du préchargement (dans une implémentation réelle, utilisez React.lazy)
      routesToPrefetch.forEach(route => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        link.as = 'document';
        document.head.appendChild(link);
        
        setTimeout(() => {
          document.head.removeChild(link);
        }, 10000); // Nettoyer après 10 secondes
      });
    }
  }, [location.pathname]);
  
  return null;
};

/**
 * Application principale avec toutes les optimisations intégrées
 */
const App = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Initialiser les systèmes d'optimisation
  useEffect(() => {
    // Initialiser le monitoring de performance amélioré
    enhancedPerformanceMonitoring.init();
    
    // Initialiser l'optimiseur de routes
    routeOptimizer.init();
    
    // Vérifier si l'utilisateur est administrateur pour afficher le dashboard
    const checkAdminStatus = () => {
      const isAdmin = localStorage.getItem('velo_admin') === 'true';
      setIsAdmin(isAdmin);
    };
    
    checkAdminStatus();
    
    // Initialiser le tableau de bord si l'utilisateur est administrateur
    if (isAdmin) {
      const dashboardContainer = document.getElementById('performance-dashboard-container');
      
      if (dashboardContainer) {
        performanceDashboard.init({
          element: dashboardContainer,
          autoRefresh: true,
          refreshInterval: 5000
        });
      }
    }
    
    // Nettoyer lors du démontage
    return () => {
      if (isAdmin) {
        performanceDashboard.stopAutoRefresh();
      }
    };
  }, [isAdmin]);
  
  return (
    <ErrorBoundary>
      <PerformanceContext.Provider value={enhancedPerformanceMonitoring}>
        <ThemeProvider theme={veloTheme}>
          <CssBaseline />
          <BrowserRouter>
            <NavigationMonitor />
            <ResponsiveNavigation />
            
            <main>
              <ResponsiveGridContainer>
                <Suspense fallback={<LoadingSpinner fullPage message="Chargement de l'application..." />}>
                  <Routes>
                    {/* Accueil */}
                    <Route path="/" element={<Home />} />
                    
                    {/* Module Cols */}
                    <Route path="/cols">
                      <Route index element={<ColCatalog />} />
                      <Route path="catalog" element={<ColCatalog />} />
                      <Route path=":colId" element={<ColDetails />} />
                      <Route path="seven-majors" element={<SevenMajors />} />
                      <Route path="3d-view" element={<Visualization3D />} />
                    </Route>
                    
                    {/* Module Training */}
                    <Route path="/training/*" element={<Training />} />
                    
                    {/* Module Nutrition */}
                    <Route path="/nutrition">
                      <Route index element={<Nutrition />} />
                      <Route path="recipes" element={<Recipes />} />
                    </Route>
                    
                    {/* Communauté et profil */}
                    <Route path="/community" element={<Community />} />
                    <Route path="/profile" element={<Profile />} />
                    
                    {/* Page 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ResponsiveGridContainer>
            </main>
            
            {/* Conteneur pour le tableau de bord de performance (visible uniquement pour les admins) */}
            {isAdmin && (
              <div id="performance-dashboard-container" className="performance-dashboard-container" />
            )}
            
            {/* Pied de page */}
            <footer className="app-footer">
              <ResponsiveGridContainer>
                <div className="footer-content">
                  <div className="footer-section">
                    <h3>Velo-Altitude</h3>
                    <p>La plateforme dédiée au cyclisme de montagne</p>
                    <p>Version: {ENV.app.version}</p>
                  </div>
                  <div className="footer-section">
                    <h3>Les 7 Majeurs</h3>
                    <ul>
                      <li><a href="/cols/catalog">Catalogue de cols</a></li>
                      <li><a href="/cols/seven-majors">Créer mon défi</a></li>
                      <li><a href="/cols/3d-view">Visualisation 3D</a></li>
                    </ul>
                  </div>
                  <div className="footer-section">
                    <h3>Préparation</h3>
                    <ul>
                      <li><a href="/training">Programmes d'entraînement</a></li>
                      <li><a href="/nutrition">Plans nutritionnels</a></li>
                      <li><a href="/nutrition/recipes">Recettes adaptées</a></li>
                    </ul>
                  </div>
                  <div className="footer-section">
                    <h3>Communauté</h3>
                    <ul>
                      <li><a href="/community">Forum des cyclistes</a></li>
                      <li><a href="/community/events">Événements</a></li>
                      <li><a href="/profile">Mon profil</a></li>
                    </ul>
                  </div>
                </div>
                <div className="footer-bottom">
                  <p>&copy; {new Date().getFullYear()} Velo-Altitude. Tous droits réservés.</p>
                </div>
              </ResponsiveGridContainer>
            </footer>
          </BrowserRouter>
        </ThemeProvider>
      </PerformanceContext.Provider>
    </ErrorBoundary>
  );
};

// Contexte de performance pour l'application (à créer avant utilisation)
const createPerformanceContext = () => {
  return React.createContext(enhancedPerformanceMonitoring);
};

// Exporter le contexte pour une utilisation dans les composants
export const PerformanceContext = createPerformanceContext();

export default App;
