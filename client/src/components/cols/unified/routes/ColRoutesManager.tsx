import React from 'react';
import { Route, Routes } from 'react-router-dom';

// Import unified components
import ColExplorer from '../ColExplorer';
import ColsList from '../ColsList';
import ColComparison from '../ColComparison';

// Import authentication HOC
import { ProtectedRoute } from '../../../../auth';

/**
 * Configuration pour ColRoutesManager
 */
interface ColRoutesManagerConfig {
  enableProtectedRoutes?: boolean;
  baseUrl?: string;
  featureFlags?: {
    enableComparison?: boolean;
    enableMap?: boolean;
    enable3D?: boolean;
    enableWeather?: boolean;
    enableFavorites?: boolean;
  };
}

/**
 * Gestionnaire unifié des routes pour les cols
 * Simplifie l'intégration des composants liés aux cols dans l'application
 */
const ColRoutesManager: React.FC<ColRoutesManagerConfig> = ({
  enableProtectedRoutes = false,
  baseUrl = '/cols',
  featureFlags = {
    enableComparison: true,
    enableMap: true,
    enable3D: true,
    enableWeather: true,
    enableFavorites: true
  }
}) => {
  // Wrapper conditionnel pour les routes protégées/non-protégées
  const RouteWrapper = enableProtectedRoutes ? ProtectedRoute : React.Fragment;
  
  return (
    <Routes>
      <Route 
        path={`${baseUrl}`} 
        element={
          <RouteWrapper>
            <ColsList 
              enableFavorites={featureFlags.enableFavorites}
              enableMap={featureFlags.enableMap}
            />
          </RouteWrapper>
        } 
      />
      
      <Route 
        path={`${baseUrl}/:colId`} 
        element={
          <RouteWrapper>
            <ColExplorer 
              initialTab={0}
              showBreadcrumbs={true}
              showActions={true}
              showTabs={true}
            />
          </RouteWrapper>
        } 
      />
      
      {featureFlags.enableComparison && (
        <Route 
          path={`${baseUrl}/compare`} 
          element={
            <RouteWrapper>
              <ColComparison />
            </RouteWrapper>
          } 
        />
      )}
    </Routes>
  );
};

export default ColRoutesManager;
