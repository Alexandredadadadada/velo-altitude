import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { AnimatePresence } from 'framer-motion';

// Composants communs avec chargement immédiat
import Footer from './components/common/Footer';
import LoadingFallback from './components/common/LoadingFallback';
import ErrorBoundary from './components/common/ErrorBoundary';

// Nouveau composant de navigation animée
import AnimatedNavbar from './components/navigation/AnimatedNavbar';

// Lazy loading des pages
const Home = lazy(() => import('./pages/Home'));
const ColsRoutes = lazy(() => import('./pages/cols/ColsRoutes'));
const TrainingDashboard = lazy(() => import('./pages/TrainingDashboard'));
const NutritionPage = lazy(() => import('./pages/NutritionPage'));
const RoutePlanner = lazy(() => import('./pages/RoutePlanner'));
const SocialHub = lazy(() => import('./pages/SocialHub'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const StravaSync = lazy(() => import('./pages/StravaSync'));
const NotFound = lazy(() => import('./pages/NotFound'));
const CommunityRoutes = lazy(() => import('./pages/community/CommunityRoutes'));
const MountainHub = lazy(() => import('./pages/MountainHub'));
const ErrorDemo = lazy(() => import('./pages/ErrorDemo'));
const VisualizationDashboard = lazy(() => import('./pages/VisualizationDashboard'));

// Utilitaires
import { usePerformanceOptimizer } from './utils/PerformanceOptimizer';
import { useImageOptimizer } from './utils/ImageOptimizer';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Nouveau thème moderne
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import modernTheme from './theme/modernTheme';

// Styles
import './App.css';

function App() {
  // Initialiser les optimiseurs de performance
  const { deviceInfo } = usePerformanceOptimizer({
    lazyLoading: true,
    codeChunking: true,
    imageOptimization: true,
    caching: true,
    prefetching: true,
    resourceHints: true,
  });
  
  // Initialiser l'optimiseur d'images
  useImageOptimizer();
  
  // Effet pour appliquer les classes d'optimisation au document
  useEffect(() => {
    // Appliquer les classes d'optimisation basées sur l'appareil
    if (deviceInfo.isLowEndDevice) {
      document.documentElement.classList.add('optimize-for-low-end');
    }
    
    if (deviceInfo.hasSlowConnection) {
      document.documentElement.classList.add('optimize-for-slow-connection');
    }
    
    if (deviceInfo.isMobile) {
      document.documentElement.classList.add('mobile-device');
    }

    // Ajouter les attributs ARIA pour l'accessibilité
    document.documentElement.lang = i18n.language || 'fr';
    document.documentElement.setAttribute('dir', 'ltr');
    
    // Ajouter la police Inter depuis Google Fonts pour notre thème moderne
    const linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(linkElement);
    
    return () => {
      document.head.removeChild(linkElement);
    };
  }, [deviceInfo]);

  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <ThemeProvider theme={modernTheme}>
          <CssBaseline />
          <NotificationProvider>
            <Router>
              <div className="app" role="application">
                {/* Nouvelle barre de navigation animée */}
                <AnimatedNavbar />

                {/* Contenu principal avec animations de transition de page */}
                <main className="main-content" id="main-content" role="main">
                  <ErrorBoundary>
                    <Suspense fallback={<LoadingFallback type="content" />}>
                      <AnimatePresence mode="wait">
                        <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="/cols/*" element={<ColsRoutes />} />
                          <Route path="/training/*" element={<TrainingDashboard />} />
                          <Route path="/nutrition/*" element={<NutritionPage />} />
                          <Route path="/routes/*" element={<RoutePlanner />} />
                          <Route path="/social/*" element={<SocialHub />} />
                          <Route path="/community/*" element={<CommunityRoutes />} />
                          <Route path="/mountain/*" element={<MountainHub />} />
                          <Route path="/profile/*" element={<Profile />} />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="/strava/sync" element={<StravaSync />} />
                          <Route path="/error-demo" element={<ErrorDemo />} />
                          <Route path="/visualization" element={<VisualizationDashboard />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </AnimatePresence>
                    </Suspense>
                  </ErrorBoundary>
                </main>

                {/* Pied de page */}
                <Footer />
              </div>
            </Router>
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </I18nextProvider>
  );
}

export default App;
