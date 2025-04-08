import React, { Suspense, lazy } from 'react';
import OptimizedSkeleton from '../components/shared/Skeletons/OptimizedSkeletons';

// Squelettes de chargement pour chaque type de page
const DashboardSkeleton = () => <OptimizedSkeleton type="dashboard" />;
const PassCatalogSkeleton = () => <OptimizedSkeleton type="grid" columns={3} count={9} />;
const TrainingSkeleton = () => <OptimizedSkeleton type="dashboard" />;
const WeatherSkeleton = () => <OptimizedSkeleton type="weather" />;
const ProfileSkeleton = () => <OptimizedSkeleton type="profile" />;
const CommunityPageSkeleton = () => <OptimizedSkeleton type="grid" columns={2} count={6} />;
const MajeursSkeleton = () => <OptimizedSkeleton type="grid" columns={1} count={7} />;
const NutritionSkeleton = () => <OptimizedSkeleton type="dashboard" />;
const Visualization3DSkeleton = () => <OptimizedSkeleton type="3d" height="500px" />;

/**
 * Fonction pour créer un composant chargé de manière paresseuse
 * @param {Function} importFunc - Fonction d'importation dynamique
 * @param {React.Component} LoadingComponent - Composant à afficher pendant le chargement
 * @returns {React.Component} Composant paresseux avec Suspense
 */
const createLazyComponent = (importFunc, LoadingComponent) => {
  const LazyComponent = lazy(importFunc);
  
  return (props) => (
    <Suspense fallback={<LoadingComponent />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Importation paresseuse des composants de page avec squelettes appropriés
export const LazyDashboard = createLazyComponent(
  () => import('../pages/Dashboard').then(module => {
    // Après chargement du module, précharger les dépendances importantes
    import('../components/dashboard/StatsOverview');
    return module;
  }),
  DashboardSkeleton
);

export const LazyPassCatalog = createLazyComponent(
  () => import('../pages/MountainPasses'),
  PassCatalogSkeleton
);

export const LazyPassDetail = createLazyComponent(
  () => import('../pages/MountainPassDetail'),
  Visualization3DSkeleton
);

export const LazyTraining = createLazyComponent(
  () => import('../pages/Training'),
  TrainingSkeleton
);

export const LazyWeather = createLazyComponent(
  () => import('../pages/Weather'),
  WeatherSkeleton
);

export const LazyProfile = createLazyComponent(
  () => import('../pages/Profile'),
  ProfileSkeleton
);

export const LazyCommunity = createLazyComponent(
  () => import('../pages/Community'),
  CommunityPageSkeleton
);

export const LazyMajeurs = createLazyComponent(
  () => import('../pages/LesMajeurs'),
  MajeursSkeleton
);

export const LazyNutrition = createLazyComponent(
  () => import('../pages/Nutrition'),
  NutritionSkeleton
);

export const LazyVisualization3D = createLazyComponent(
  () => import('../pages/Visualization3D'),
  Visualization3DSkeleton
);

// Précharger des composants selon les besoins
export const preloadComponent = (componentKey) => {
  switch (componentKey) {
    case 'dashboard':
      import('../pages/Dashboard');
      break;
    case 'passes':
      import('../pages/MountainPasses');
      break;
    case 'training':
      import('../pages/Training');
      break;
    case 'weather':
      import('../pages/Weather');
      break;
    case 'profile':
      import('../pages/Profile');
      break;
    case 'community':
      import('../pages/Community');
      break;
    case 'majeurs':
      import('../pages/LesMajeurs');
      break;
    case 'nutrition':
      import('../pages/Nutrition');
      break;
    case '3d':
      import('../pages/Visualization3D');
      break;
    default:
      // Ne rien précharger si la clé n'est pas reconnue
      break;
  }
};

// Carte des routes pour la navigation
export const routeMap = {
  '/dashboard': 'dashboard',
  '/mountain-passes': 'passes',
  '/mountain-passes/': 'passes',
  '/training': 'training',
  '/weather': 'weather',
  '/profile': 'profile',
  '/community': 'community',
  '/les-majeurs': 'majeurs',
  '/nutrition': 'nutrition',
  '/visualization': '3d'
};

// Précharger un composant basé sur la route actuelle et les routes probables suivantes
export const preloadComponentsForRoute = (currentRoute) => {
  // Précharger le composant actuel (si ce n'est pas déjà fait)
  const currentComponent = routeMap[currentRoute];
  if (currentComponent) {
    preloadComponent(currentComponent);
  }
  
  // Basé sur les données d'utilisation, préchargement intelligent des routes probables
  switch (currentRoute) {
    case '/dashboard':
      // Depuis le tableau de bord, les utilisateurs vont souvent aux passes ou à l'entraînement
      setTimeout(() => preloadComponent('passes'), 2000);
      setTimeout(() => preloadComponent('majeurs'), 4000);
      break;
    case '/mountain-passes':
      // Précharger le détail des passes et éventuellement la visualisation 3D
      setTimeout(() => preloadComponent('3d'), 2000);
      break;
    case '/les-majeurs':
      // Les utilisateurs qui consultent les majeurs vont souvent aux passes
      setTimeout(() => preloadComponent('passes'), 2000);
      break;
    case '/profile':
      // Depuis le profil, les utilisateurs consultent souvent les statistiques ou la communauté
      setTimeout(() => preloadComponent('community'), 2000);
      break;
    default:
      // Ne pas précharger de routes supplémentaires par défaut
      break;
  }
};
