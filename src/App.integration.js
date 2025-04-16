/**
 * Intégration complète des améliorations pour Velo-Altitude
 * Ce fichier montre comment intégrer toutes les optimisations dans l'application
 */

import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Composants optimisés
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingSpinner } from './components/common/LoadingStates';
import ResponsiveNavigation from './components/layout/ResponsiveNavigation';
import { ResponsiveGridContainer } from './components/layout/ResponsiveGrid';

// Utilitaires d'optimisation
import { initPerformanceMonitoring, monitorPerformance } from './utils/performanceMonitor';
import { optimizePerformance } from './utils/performance';
import performanceConfig from './config/performance';

// Thème et configuration
import veloTheme from './theme';
import { ENV } from './config/environment';

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

/**
 * Application principale avec toutes les optimisations intégrées
 */
const App = () => {
  const { prefetchComponent, prefetchConnectedRoutes } = optimizePerformance();
  
  // Initialiser le monitoring de performance au démarrage
  useEffect(() => {
    // Initialiser le monitoring
    initPerformanceMonitoring();
    
    // Précharger les routes critiques
    performanceConfig.criticalRoutes.forEach(route => {
      prefetchComponent(route);
    });
    
    // Mesurer les performances après le chargement initial
    window.addEventListener('load', () => {
      setTimeout(() => {
        monitorPerformance();
      }, 2000); // Attendre 2s après le chargement complet
    });
    
    // Nettoyer lors du démontage
    return () => {
      window.removeEventListener('load', monitorPerformance);
    };
  }, []);
  
  // Précharger les routes connectées à la route actuelle
  const handleRouteChange = (currentRoute) => {
    prefetchConnectedRoutes(currentRoute);
  };
  
  return (
    <ErrorBoundary>
      <ThemeProvider theme={veloTheme}>
        <CssBaseline />
        <BrowserRouter>
          <ResponsiveNavigation />
          
          <main>
            <ResponsiveGridContainer>
              <Suspense fallback={<LoadingSpinner fullPage message="Chargement de l'application..." />}>
                <Routes onChange={handleRouteChange}>
                  {/* Accueil */}
                  <Route path="/" element={<Home />} />
                  
                  {/* Module Cols */}
                  <Route path="/cols">
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
          
          {/* Pied de page */}
          <footer className="app-footer">
            <ResponsiveGridContainer>
              <div className="footer-content">
                <div className="footer-section">
                  <h3>Velo-Altitude</h3>
                  <p>La plateforme dédiée au cyclisme de montagne</p>
                </div>
                <div className="footer-section">
                  <h3>Liens rapides</h3>
                  <ul>
                    <li><a href="/cols/catalog">Catalogue de cols</a></li>
                    <li><a href="/cols/seven-majors">Les 7 Majeurs</a></li>
                    <li><a href="/training">Entraînement</a></li>
                    <li><a href="/nutrition">Nutrition</a></li>
                  </ul>
                </div>
                <div className="footer-section">
                  <h3>Communauté</h3>
                  <ul>
                    <li><a href="/community">Forums</a></li>
                    <li><a href="/community/events">Événements</a></li>
                  </ul>
                </div>
                <div className="footer-section">
                  <h3>À propos</h3>
                  <ul>
                    <li><a href="/about">Notre équipe</a></li>
                    <li><a href="/privacy">Confidentialité</a></li>
                    <li><a href="/terms">Conditions</a></li>
                    <li><a href="/contact">Contact</a></li>
                  </ul>
                </div>
              </div>
              <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Velo-Altitude. Tous droits réservés.</p>
                <p>Version: {ENV.app.version}</p>
              </div>
            </ResponsiveGridContainer>
          </footer>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
