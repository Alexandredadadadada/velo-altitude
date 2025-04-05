import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import EnhancedNavigation from './components/common/EnhancedNavigation';
import ParallaxHeader from './components/common/ParallaxHeader';
import AnimatedTransition from './components/common/AnimatedTransition';
import VisualEffectsProvider from './components/common/VisualEffectsProvider';
import { PerformanceOptimizer } from './utils/PerformanceOptimizer';
import './App.css';

// Lazy loading des composants pour optimiser les performances
const Home = lazy(() => import('./pages/Home'));
const ColsExplorer = lazy(() => import('./pages/ColsExplorer'));
const EnhancedColDetail = lazy(() => import('./components/cols/EnhancedColDetail'));
const TrainingModule = lazy(() => import('./pages/TrainingModule'));
const NutritionPlanner = lazy(() => import('./components/nutrition/NutritionPlanner'));
const EnhancedCyclingCoach = lazy(() => import('./components/coach/EnhancedCyclingCoach'));
const EnhancedRouteAlternatives = lazy(() => import('./components/visualization/EnhancedRouteAlternatives'));
const EnhancedSocialHub = lazy(() => import('./components/social/EnhancedSocialHub'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const SevenMajorsChallenge = lazy(() => import('./components/challenges/SevenMajorsChallenge'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  useEffect(() => {
    // Initialisation de l'optimiseur de performance
    PerformanceOptimizer.init();
    
    // Nettoyage lors du démontage du composant
    return () => {
      PerformanceOptimizer.cleanup();
    };
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <VisualEffectsProvider>
        <Router>
          <div className="app-container">
            <ParallaxHeader />
            <EnhancedNavigation />
            
            <AnimatedTransition>
              <Suspense fallback={<div className="loading-container">Chargement...</div>}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/seven-majors" element={<SevenMajorsChallenge />} />
                  <Route path="/cols" element={<ColsExplorer />} />
                  <Route path="/cols/:id" element={<EnhancedColDetail />} />
                  <Route path="/training" element={<TrainingModule />} />
                  <Route path="/nutrition" element={<NutritionPlanner />} />
                  <Route path="/coach" element={<EnhancedCyclingCoach />} />
                  <Route path="/routes" element={<EnhancedRouteAlternatives />} />
                  <Route path="/social" element={<EnhancedSocialHub />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AnimatedTransition>
            
            <footer className="app-footer">
              <div className="footer-content">
                <p>&copy; {new Date().getFullYear()} Velo-Altitude - Tous droits réservés</p>
              </div>
            </footer>
          </div>
        </Router>
      </VisualEffectsProvider>
    </I18nextProvider>
  );
}

export default App;
