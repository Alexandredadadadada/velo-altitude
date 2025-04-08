import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Import unified components
import ColsList from '../ColsList';
import ColExplorer from '../ColExplorer';
import ColComparison from '../ColComparison';
import ColRoutesManager from '../routes/ColRoutesManager';

// Import authentication components
import { useAuth, ProtectedRoute } from '../../../../auth';

// Import hooks and context
import { useSnackbar as useNotification } from 'notistack';

/**
 * Configuration du module
 */
interface ColsModuleConfig {
  // Auth
  requireAuth?: boolean;
  
  // Routes
  baseRoute?: string;
  
  // Features
  enableFavorites?: boolean;
  enable3D?: boolean;
  enableComparison?: boolean;
  enableWeather?: boolean;
  enableMap?: boolean;
  
  // Performance
  defaultQuality?: 'low' | 'medium' | 'high' | 'ultra';
  enableAdaptiveQuality?: boolean;
}

/**
 * Module unifié des cols
 * Point d'entrée principal pour intégrer les fonctionnalités liées aux cols dans l'application
 */
const ColsModule: React.FC<ColsModuleConfig> = ({
  // Auth
  requireAuth = false,
  
  // Routes
  baseRoute = '/cols',
  
  // Features
  enableFavorites = true,
  enable3D = true,
  enableComparison = true,
  enableWeather = true,
  enableMap = true,
  
  // Performance
  defaultQuality = 'medium',
  enableAdaptiveQuality = true
}) => {
  const { isAuthenticated } = useAuth();
  const { enqueueSnackbar: showNotification } = useNotification();
  const location = useLocation();
  
  // Version légère du module pour les appareils mobiles ou faible puissance
  const isLightVersion = React.useMemo(() => {
    // Vérifier si un paramètre d'URL spécifie explicitement la version légère
    const params = new URLSearchParams(location.search);
    const lightParam = params.get('light');
    
    if (lightParam !== null) {
      return lightParam === 'true';
    }
    
    // Utiliser la détection basée sur le navigateur comme fallback
    const isLowEndDevice = false; // À remplacer par une vraie détection si nécessaire
    return isLowEndDevice;
  }, [location.search]);
  
  // Ajuster les fonctionnalités en fonction de la version légère
  const adjustedConfig = {
    enable3D: isLightVersion ? false : enable3D,
    defaultQuality: isLightVersion ? 'low' : defaultQuality,
    enableAdaptiveQuality: isLightVersion ? true : enableAdaptiveQuality
  };
  
  // Wrapper conditionnel pour les routes protégées/non-protégées
  const RouteWrapper = requireAuth ? ProtectedRoute : React.Fragment;
  
  // Check if the user tries to access a protected route without authentication
  const handleProtectedAccess = () => {
    if (requireAuth && !isAuthenticated) {
      showNotification('Veuillez vous connecter pour accéder à cette page', 'warning');
      return false;
    }
    return true;
  };
  
  return (
    <Routes>
      {/* Route principale - liste des cols */}
      <Route 
        path={`${baseRoute}`} 
        element={
          <RouteWrapper>
            <ColsList 
              enableFavorites={enableFavorites && isAuthenticated}
              enableMap={enableMap}
            />
          </RouteWrapper>
        } 
      />
      
      {/* Route détaillée d'un col */}
      <Route 
        path={`${baseRoute}/:colId`} 
        element={
          <RouteWrapper>
            <ColExplorer 
              initialTab={0}
              showBreadcrumbs={true}
              showActions={true}
              showTabs={adjustedConfig.enable3D}
            />
          </RouteWrapper>
        } 
      />
      
      {/* Route de comparaison */}
      {enableComparison && (
        <Route 
          path={`${baseRoute}/compare`} 
          element={
            <RouteWrapper>
              <ColComparison maxCompareItems={4} />
            </RouteWrapper>
          } 
        />
      )}
      
      {/* Route carte (à implémenter) */}
      {enableMap && (
        <Route 
          path={`${baseRoute}/map`} 
          element={
            <RouteWrapper>
              <div>Map Component (à implémenter)</div>
            </RouteWrapper>
          } 
        />
      )}
      
      {/* Route fallback */}
      <Route 
        path={`${baseRoute}/*`} 
        element={<Navigate to={baseRoute} replace />} 
      />
    </Routes>
  );
};

export default ColsModule;

/**
 * Composant autonome, prêt à l'emploi avec la configuration par défaut
 */
export const StandaloneColsModule = () => {
  return <ColsModule />;
};
