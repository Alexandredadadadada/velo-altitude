/**
 * Guide d'intégration des composants optimisés pour Velo-Altitude
 * Ce fichier montre comment utiliser ensemble les composants améliorés
 */

import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';

// Composants communs optimisés
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { LoadingSpinner } from '../components/common/LoadingStates';
import ResponsiveNavigation from '../components/layout/ResponsiveNavigation';
import { ResponsiveGridContainer } from '../components/layout/ResponsiveGrid';

// Utilitaires de performance
import { optimizePerformance } from '../utils/performance';
import performanceConfig from '../config/performance';

// Système de performance avancé
import enhancedPerformanceMonitoring from '../utils/enhancedPerformanceMonitoring';
import { enhancedRouteOptimizer, performanceBudgets } from '../utils/routeOptimizer.enhanced';
import baselineMetricsCollector from '../utils/baselineMetrics';
import { PerformanceProvider, usePerformance } from '../contexts/PerformanceContext';
import { performanceDashboard } from '../monitoring/dashboard';

// Chargement paresseux des pages principales
const Home = lazy(() => import('../pages/Home'));
const ColCatalog = lazy(() => import('../pages/ColCatalog'));
const ColDetails = lazy(() => import('../pages/ColDetails'));
const Training = lazy(() => import('../pages/Training'));
const Nutrition = lazy(() => import('../pages/Nutrition'));
const Recipes = lazy(() => import('../pages/Recipes'));
const SevenMajors = lazy(() => import('../pages/SevenMajors'));
const Profile = lazy(() => import('../pages/Profile'));

// Initialisation des optimisations de performance
const { prefetchComponent } = optimizePerformance();

/**
 * Composant de suivi de navigation pour l'optimisation des routes
 */
const NavigationTracker: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const performance = usePerformance();
  
  useEffect(() => {
    // Enregistrer la navigation pour l'optimisation des routes
    enhancedRouteOptimizer.trackNavigation(location.pathname);
    
    // Mesurer le temps de navigation
    performance.trackNavigation(location.pathname);
    
    // Précharger les routes connectées
    const routesToPrefetch = enhancedRouteOptimizer.prefetchConnectedRoutes(location.pathname);
    
    // Préfétcher les composants pour les routes connectées
    routesToPrefetch.forEach(route => {
      prefetchComponent(route);
    });
  }, [location.pathname, navigate, performance]);
  
  return null;
};

/**
 * Moniteur de performance pour les métriques spécifiques à Velo-Altitude
 */
const VeloPerformanceMonitor: React.FC = () => {
  const performance = usePerformance();

  useEffect(() => {
    // Initialiser le monitoring avancé
    enhancedPerformanceMonitoring.init({
      env: process.env.NODE_ENV,
      reportingEndpoint: process.env.REACT_APP_MONITORING_ENDPOINT || '/api/monitoring',
      samplingRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
      thresholds: performanceBudgets
    });
    
    // Initialiser l'optimisation des routes
    enhancedRouteOptimizer.init();
    
    // Initialiser le tableau de bord en mode développement ou staging
    if (process.env.NODE_ENV !== 'production' || 
        (process.env.REACT_APP_ENABLE_DASHBOARD === 'true')) {
      performanceDashboard.init({
        mountPoint: 'performance-dashboard-container',
        autoRefresh: true,
        refreshInterval: 3000,
        historySize: 200
      });
    }
    
    // Collecter les métriques de référence en développement
    if (process.env.NODE_ENV === 'development' && 
        localStorage.getItem('velo_altitude_baseline_metrics') === null) {
      // Collecter pendant une courte période en développement (5 minutes)
      baselineMetricsCollector.collectBaseline(5 * 60 * 1000)
        .then(metrics => {
          console.info('Métriques de référence collectées:', metrics);
          
          // Analyser les métriques pour des recommandations
          const recommendations = baselineMetricsCollector.analyzeBaseline();
          console.info('Recommandations d\'optimisation:', recommendations);
        });
    }
    
    return () => {
      // Nettoyage du monitoring lors du démontage
      enhancedPerformanceMonitoring.cleanup();
      
      // Arrêter la collecte de métriques de référence si en cours
      if (baselineMetricsCollector.isCollecting) {
        baselineMetricsCollector.stopCollection();
      }
    };
  }, [performance]);
  
  return null;
};

/**
 * Exemple d'intégration dans le composant principal de l'application
 */
const AppWithOptimizations: React.FC = () => {
  // Précharger les composants critiques
  React.useEffect(() => {
    performanceConfig.criticalRoutes.forEach(route => {
      prefetchComponent(route);
    });
  }, []);

  return (
    <ErrorBoundary>
      <PerformanceProvider>
        <BrowserRouter>
          <VeloPerformanceMonitor />
          <NavigationTracker />
          <ResponsiveNavigation />
          
          <ResponsiveGridContainer>
            <Suspense fallback={<LoadingSpinner fullPage message="Chargement de la page..." />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/cols/catalog" element={<ColCatalog />} />
                <Route path="/cols/:colId" element={<ColDetails />} />
                <Route path="/cols/seven-majors" element={<SevenMajors />} />
                <Route path="/training/*" element={<Training />} />
                <Route path="/nutrition" element={<Nutrition />} />
                <Route path="/nutrition/recipes" element={<Recipes />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin/performance" element={<PerformanceDashboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ResponsiveGridContainer>
          
          {/* Conteneur pour le tableau de bord de performance */}
          {(process.env.NODE_ENV !== 'production' || 
            process.env.REACT_APP_ENABLE_DASHBOARD === 'true') && (
            <div id="performance-dashboard-container" style={{ display: 'none' }} />
          )}
        </BrowserRouter>
      </PerformanceProvider>
    </ErrorBoundary>
  );
};

// Page 404 simple
const NotFound = () => (
  <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
    <h2>Page non trouvée</h2>
    <p>La page que vous recherchez n'existe pas.</p>
  </div>
);

export default AppWithOptimizations;

/**
 * Tableau de bord de performance pour les administrateurs
 */
const PerformanceDashboard: React.FC = () => {
  const performance = usePerformance();
  
  useEffect(() => {
    // Rendre visible le tableau de bord
    const dashboardContainer = document.getElementById('performance-dashboard-container');
    if (dashboardContainer) {
      dashboardContainer.style.display = 'block';
    }
    
    // Initialiser le tableau de bord s'il n'est pas déjà initialisé
    if (!performanceDashboard.isInitialized) {
      performanceDashboard.init({
        mountPoint: 'performance-dashboard-container',
        autoRefresh: true,
        refreshInterval: 3000,
        historySize: 500
      });
    }
    
    // Mesurer la performance de rendu du tableau de bord
    performance.trackInteraction('render', 'dashboard');
    
    return () => {
      // Cacher le tableau de bord lors du démontage
      const dashboardContainer = document.getElementById('performance-dashboard-container');
      if (dashboardContainer) {
        dashboardContainer.style.display = 'none';
      }
    };
  }, [performance]);
  
  return (
    <div>
      <h1>Tableau de bord de performance</h1>
      <p>Visualisation des métriques de performance de Velo-Altitude</p>
      
      {/* Le tableau de bord est monté dans le conteneur par l'API JavaScript */}
    </div>
  );
};

/**
 * EXEMPLES D'INTÉGRATION DE COMPOSANTS SPÉCIFIQUES
 * 
 * Ces exemples montrent comment intégrer les composants optimisés
 * dans les différentes pages de l'application
 */

/**
 * Exemple d'intégration du RecipeLoader dans la page Recipes
 */
export const RecipesPageIntegration: React.FC = () => {
  // Import utilisé dans une vraie implémentation
  // import { RecipeLoader, RecipeLoadingState, RecipeErrorState } from '../services/nutrition/RecipeLoader';
  // import { DataFetcher } from '../components/common/DataFetcher';
  const performance = usePerformance();
  
  useEffect(() => {
    // Début du chargement de la page
    performance.trackPageLoad('recipes');
    
    // Mesurer le temps de rendu initial
    performance.trackInteraction('render', 'recipes');
    
    return () => {
      performance.trackPageUnload('recipes');
    };
  }, [performance]);
  
  return (
    <ErrorBoundary>
      <h1>Recettes pour cyclistes</h1>
      
      {/* Exemple d'utilisation du DataFetcher avec RecipeLoader */}
      {/* 
      <DataFetcher
        fetchFn={() => {
          // Mesurer le temps de chargement des recettes
          performance.trackDataFetch('recipes', 'recovery');
          return new RecipeLoader().loadRecipes({ category: 'recovery' });
        }}
        cacheKey="recovery-recipes"
        loadingComponent={<RecipeLoadingState />}
        onSuccess={(data) => {
          // Marquer la fin du chargement des données
          performance.trackDataFetchEnd('recipes', 'recovery', data.recipes.length);
        }}
        onError={(error) => {
          // Enregistrer l'erreur
          performance.trackError('recipes', error.message);
        }}
      >
        {(data, { loading, error, refetch }) => {
          if (error) {
            return <RecipeErrorState error={error} onRetry={refetch} />;
          }
          
          if (!data?.recipes?.length) {
            return <EmptyState message="Aucune recette trouvée" />;
          }
          
          return <RecipesGrid recipes={data.recipes} />;
        }}
      </DataFetcher>
      */}
    </ErrorBoundary>
  );
};

/**
 * Exemple d'intégration du ProgramGenerator dans la page Training
 */
export const TrainingPageIntegration: React.FC = () => {
  // Import utilisé dans une vraie implémentation
  // import { ProgramGenerator } from '../services/training/ProgramGenerator';
  // import { withDataFetching } from '../components/common/DataFetcher';
  // import { WorkoutSkeleton } from '../components/common/LoadingStates';
  const performance = usePerformance();
  
  useEffect(() => {
    // Début du chargement de la page
    performance.trackPageLoad('training');
    
    // Mesurer le temps de génération du programme
    performance.trackInteraction('generation', 'training_program');
    
    // Précharger les ressources critiques pour cette page
    enhancedRouteOptimizer.prefetchCriticalResources([
      'training-programs.json', 
      'workout-templates.json'
    ]);
    
    return () => {
      performance.trackPageUnload('training');
    };
  }, [performance]);
  
  return (
    <ErrorBoundary>
      <h1>Programmes d'entraînement</h1>
      
      {/* Exemple d'utilisation du ProgramGenerator */}
      {/*
      const generator = new ProgramGenerator();
      
      // Mesurer le temps de génération du programme
      performance.startMeasurement('program_generation');
      const program = generator.generateProgram(
        { id: 'user123', ftp: 250, level: 'intermediate' },
        { primary: 'climbing', duration: 8 }
      );
      performance.endMeasurement('program_generation');
      
      return (
        <div>
          <h2>{program.name}</h2>
          <p>{program.description}</p>
          
          {program.weeks.map((week, index) => (
            <WeeklyPlan 
              key={index} 
              week={week} 
              onWorkoutComplete={(workoutIndex, data) => {
                // Mesurer l'interaction utilisateur
                performance.trackInteraction('workout_complete', `week_${index}_workout_${workoutIndex}`);
                
                generator.trackWorkoutCompletion(program.id, index, workoutIndex, data);
              }} 
            />
          ))}
        </div>
      );
      */}
    </ErrorBoundary>
  );
};

/**
 * Exemple d'intégration des composants responsives
 */
export const ResponsiveComponentsIntegration: React.FC = () => {
  // Import utilisé dans une vraie implémentation
  // import { ResponsiveGridContainer, ResponsiveGridItem, ChartContainer } from '../components/layout/ResponsiveGrid';
  const performance = usePerformance();
  
  useEffect(() => {
    // Mesurer la performance du rendu adaptatif
    performance.trackInteraction('render', 'responsive_grid');
    
    // Observer les métriques responsives (visibles, etc.)
    enhancedPerformanceMonitoring.observeResponsiveRendering('stats_container');
    
    return () => {
      // Arrêter l'observation lors du démontage
      enhancedPerformanceMonitoring.unobserveResponsiveRendering('stats_container');
    };
  }, [performance]);
  
  return (
    <ErrorBoundary>
      {/* Exemple d'utilisation de la grille responsive */}
      {/*
      <ResponsiveGridContainer spacing={2}>
        <ResponsiveGridItem xs={12} md={6} lg={4}>
          <Card id="stats_container">
            <CardContent>
              <h3>Statistiques d'entraînement</h3>
              <ChartContainer>
                {/* Mesurer le temps de rendu du graphique */}
                {/* performance.trackRender('training_chart', () => (
                  <TrainingChart data={trainingData} />
                ))}
              </ChartContainer>
            </CardContent>
          </Card>
        </ResponsiveGridItem>
        
        <ResponsiveGridItem xs={12} md={6} lg={8}>
          <Card>
            <CardContent>
              <h3>Progression</h3>
              <FormContainer>
                <TrainingForm onSubmit={(data) => {
                  // Mesurer le temps de soumission du formulaire
                  performance.trackInteraction('form_submit', 'training_form');
                }} />
              </FormContainer>
            </CardContent>
          </Card>
        </ResponsiveGridItem>
      </ResponsiveGridContainer>
      */}
    </ErrorBoundary>
  );
};

/**
 * Utilitaire pour les intégrations du système de performances dans d'autres composants
 */
export const withPerformanceTracking = (
  Component: React.ComponentType<any>,
  options: {
    name: string;
    trackInteractions?: boolean;
    trackRendering?: boolean;
    trackVisibility?: boolean;
  }
) => {
  const WithPerformanceTracking: React.FC<any> = (props) => {
    const performance = usePerformance();
    const componentRef = React.useRef<HTMLDivElement>(null);
    
    useEffect(() => {
      // Début du rendu
      performance.trackPageLoad(options.name);
      
      if (options.trackRendering) {
        performance.trackInteraction('render', options.name);
      }
      
      if (options.trackVisibility && componentRef.current) {
        enhancedPerformanceMonitoring.observeVisibility(
          componentRef.current,
          (isVisible) => {
            performance.trackVisibility(options.name, isVisible);
          }
        );
      }
      
      return () => {
        performance.trackPageUnload(options.name);
        
        if (options.trackVisibility && componentRef.current) {
          enhancedPerformanceMonitoring.unobserveVisibility(componentRef.current);
        }
      };
    }, [performance]);
    
    return (
      <div ref={componentRef}>
        <Component 
          {...props} 
          performance={performance}
          trackInteraction={
            options.trackInteractions 
              ? (type: string, name: string) => performance.trackInteraction(type, `${options.name}_${name}`)
              : undefined
          }
        />
      </div>
    );
  };
  
  return WithPerformanceTracking;
};
