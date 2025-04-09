import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import EnhancedNavigation from './components/common/EnhancedNavigation';
import ParallaxHeader from './components/common/ParallaxHeader';
import AnimatedTransition from './components/common/AnimatedTransition';
import VisualEffectsProvider from './components/common/VisualEffectsProvider';
import { PerformanceOptimizer } from './utils/PerformanceOptimizer';
import { Auth0Provider } from '@auth0/auth0-react';
import { Auth0ProviderWithHistory } from './features/auth/Auth0Provider';
import { AuthProvider } from './features/auth/authContext';
import ProtectedRoute from './features/auth/ProtectedRoute';
import UnauthorizedPage from './features/auth/UnauthorizedPage';
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

// Nouveaux composants optimisés pour le SEO
const SiteMap = lazy(() => import('./components/common/SiteMap'));
const EnhancedTrainingDetail = lazy(() => import('./components/training/EnhancedTrainingDetail'));
const EnhancedRecipeDetail = lazy(() => import('./components/nutrition/EnhancedRecipeDetail'));
const RecipeGalleryEnhanced = lazy(() => import('./components/nutrition/recipes/RecipeGalleryEnhanced'));
const EnhancedRecipePage = lazy(() => import('./pages/nutrition/EnhancedRecipePage'));
const NutritionDashboard = lazy(() => import('./pages/nutrition/NutritionDashboard'));
const MacroCalculator = lazy(() => import('./pages/nutrition/MacroCalculator'));
const NutritionTracker = lazy(() => import('./pages/nutrition/NutritionTracker'));

// Nouveaux composants de catégorie optimisés pour le SEO
const CategoryPage = lazy(() => import('./components/category/CategoryPage'));
const ChallengeDetail = lazy(() => import('./components/challenges/ChallengeDetail'));
const Breadcrumbs = lazy(() => import('./components/common/Breadcrumbs'));
const RelatedContent = lazy(() => import('./components/common/RelatedContent'));

// Composant de démonstration de visualisation
const ColVisualizationDemo = lazy(() => import('./pages/ColVisualizationDemo'));

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
    <Auth0ProviderWithHistory>
      <AuthProvider>
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
                      
                      {/* Routes optimisées pour les cols */}
                      <Route path="/cols" element={<CategoryPage />} />
                      <Route path="/cols/:subcategory" element={<CategoryPage />} />
                      <Route path="/cols/:id" element={<EnhancedColDetail />} />
                      
                      {/* Routes optimisées pour les programmes d'entraînement */}
                      <Route path="/programs" element={<CategoryPage />} />
                      <Route path="/programs/:subcategory" element={<CategoryPage />} />
                      <Route path="/programs/:id" element={<EnhancedTrainingDetail />} />
                      
                      {/* Compatibilité avec les anciennes routes */}
                      <Route path="/training" element={<TrainingModule />} />
                      <Route path="/training/programs/:programId" element={<EnhancedTrainingDetail />} />
                      <Route path="/training/:planId" element={<EnhancedTrainingDetail />} />
                      
                      {/* Routes optimisées pour la nutrition */}
                      <Route path="/nutrition" element={<NutritionDashboard />} />
                      <Route path="/nutrition/dashboard" element={<NutritionDashboard />} />
                      <Route path="/nutrition/:subcategory" element={<CategoryPage />} />
                      <Route path="/nutrition/recipes" element={<RecipeGalleryEnhanced />} />
                      <Route path="/nutrition/recipes/:id" element={<EnhancedRecipePage />} />
                      <Route path="/nutrition/recipes/:recipeId" element={<EnhancedRecipeDetail />} />
                      <Route path="/nutrition/macro-calculator" element={<MacroCalculator />} />
                      <Route path="/nutrition/meal-planner" element={<NutritionPlanner />} />
                      <Route path="/nutrition/tracker" element={<NutritionTracker />} />
                      <Route path="/nutrition/:id" element={<EnhancedRecipeDetail />} />
                      <Route path="/nutrition/:planId" element={<NutritionPlanner />} />
                      
                      {/* Routes optimisées pour les défis */}
                      <Route path="/challenges" element={<CategoryPage />} />
                      <Route path="/challenges/:subcategory" element={<CategoryPage />} />
                      <Route path="/challenges/:id" element={<ChallengeDetail />} />
                      
                      {/* Page de démonstration de visualisation des cols */}
                      <Route path="/demo/visualization" element={<ColVisualizationDemo />} />
                      
                      {/* Autres routes existantes */}
                      <Route path="/coach" element={<EnhancedCyclingCoach />} />
                      <Route path="/routes" element={<EnhancedRouteAlternatives />} />
                      <Route path="/social" element={<EnhancedSocialHub />} />
                      
                      {/* Routes protégées avec Auth0 */}
                      <Route 
                        path="/dashboard" 
                        element={
                          <ProtectedRoute component={Dashboard} />
                        } 
                      />
                      <Route 
                        path="/profile" 
                        element={
                          <ProtectedRoute component={Profile} />
                        } 
                      />
                      
                      {/* Page non autorisée */}
                      <Route path="/unauthorized" element={<UnauthorizedPage />} />
                      
                      <Route path="/sitemap" element={<SiteMap />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </AnimatedTransition>
                
                <footer className="app-footer">
                  <div className="footer-content">
                    <p>&copy; {new Date().getFullYear()} Velo-Altitude - Tous droits réservés</p>
                    <div className="footer-links">
                      <a href="/sitemap">Plan du site</a>
                      <a href="/about/privacy">Confidentialité</a>
                      <a href="/about/terms">Conditions d'utilisation</a>
                    </div>
                  </div>
                </footer>
              </div>
            </Router>
          </VisualEffectsProvider>
        </I18nextProvider>
      </AuthProvider>
    </Auth0ProviderWithHistory>
  );
}

export default App;
