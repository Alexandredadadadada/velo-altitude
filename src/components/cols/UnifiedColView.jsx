import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import colService from '../../services/cols';
import { DeviceCapabilitiesDetector } from '../../utils/deviceCapabilitiesDetector';
import { Tabs, Tab, Box, CircularProgress, Typography, Alert, Button } from '@mui/material';
import UnifiedColVisualization from '../visualization/UnifiedColVisualization';
import WeatherWidget from '../weather/WeatherWidget';
import PointsOfInterest from './PointsOfInterest';
import './UnifiedColView.css';

// Import lazy pour les composants lourds
const PanoramicView = lazy(() => import('../visualization/PanoramicView'));
const ColStatistics = lazy(() => import('./ColStatistics'));

/**
 * Composant pour gérer les erreurs dans l'application
 */
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  
  // Dans un vrai ErrorBoundary, on utiliserait getDerivedStateFromError et componentDidCatch
  // Ici, c'est une version simplifiée pour la démonstration
  
  if (hasError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Une erreur est survenue lors de l'affichage du col.
        <Button onClick={() => window.location.reload()} sx={{ ml: 2 }}>
          Recharger la page
        </Button>
      </Alert>
    );
  }
  
  return children;
};

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

/**
 * Vue unifiée d'un col intégrant visualisation, météo, points d'intérêt et statistiques
 * Ce composant sert de conteneur principal pour toutes les fonctionnalités liées aux cols
 */
const UnifiedColView = ({ colId: propColId }) => {
  // États
  const [col, setCol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [visualizationType, setVisualizationType] = useState(null);
  const [cachedData, setCachedData] = useState(null);
  
  // Paramètres d'URL
  const { colId: paramColId } = useParams();
  const activeColId = propColId || paramColId;
  
  // Détecteur de capacités du périphérique
  const deviceDetector = new DeviceCapabilitiesDetector();

  // Récupération des données du col avec gestion de cache
  useEffect(() => {
    const fetchColData = async () => {
      if (!activeColId) {
        setError("Identifiant du col manquant");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Vérifier le cache d'abord
        const cacheKey = `col_${activeColId}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          // Utiliser les données en cache si elles datent de moins de 30 minutes
          if (Date.now() - timestamp < 30 * 60 * 1000) {
            console.log('Utilisation des données en cache pour le col', activeColId);
            setCol(data);
            setCachedData(data);
            
            // Déterminer le type de visualisation
            const deviceCapabilities = deviceDetector.getDeviceCapabilities();
            const recommended = deviceDetector.getRecommendedVisualizationType(deviceCapabilities);
            setVisualizationType(recommended);
            
            setLoading(false);
            return;
          }
        }
        
        // Si pas de cache valide, charger depuis l'API
        const colData = await colService.getColById(activeColId);
        setCol(colData);
        
        // Mettre en cache les nouvelles données
        localStorage.setItem(cacheKey, JSON.stringify({
          data: colData,
          timestamp: Date.now()
        }));
        
        // Déterminer le type de visualisation en fonction des capacités du dispositif
        const deviceCapabilities = deviceDetector.getDeviceCapabilities();
        const recommended = deviceDetector.getRecommendedVisualizationType(deviceCapabilities);
        setVisualizationType(recommended);
        
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors du chargement des données du col:", err);
        setError("Impossible de charger les données du col");
        setLoading(false);
      }
    };
    
    fetchColData();
  }, [activeColId]);
  
  // Gestionnaire de changement d'onglet
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Rendu du chargement
  if (loading) {
    return (
      <div className="col-loading">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Chargement des données du col...
        </Typography>
      </div>
    );
  }
  
  // Rendu de l'erreur
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }
  
  // Rendu si pas de données
  if (!col) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Aucune donnée trouvée pour ce col.
      </Alert>
    );
  }
  
  return (
    <ErrorBoundary>
      <div className="unified-col-view">
        {/* En-tête du col */}
        <div className="col-header">
          <Typography variant="h4" component="h1" className="col-title">
            {col.name}
          </Typography>
          <div className="col-badges">
            <span className="badge elevation">{col.elevation}m</span>
            <span className="badge difficulty">{col.difficulty}</span>
            <span className="badge length">{col.length}km</span>
            <span className="badge gradient">{col.avgGradient}%</span>
          </div>
          <Typography variant="subtitle1" className="col-location">
            {col.region}, {col.country}
          </Typography>
        </div>
        
        {/* Navigation par onglets */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
            aria-label="onglets du col"
          >
            <Tab label="Visualisation" id="tab-0" aria-controls="tabpanel-0" />
            <Tab label="Météo" id="tab-1" aria-controls="tabpanel-1" />
            <Tab label="Points d'intérêt" id="tab-2" aria-controls="tabpanel-2" />
            <Tab label="Panoramas" id="tab-3" aria-controls="tabpanel-3" />
            <Tab label="Statistiques" id="tab-4" aria-controls="tabpanel-4" />
          </Tabs>
        </Box>
        
        {/* Contenu des onglets */}
        <div className="tab-content-wrapper">
          {/* Onglet Visualisation */}
          <div
            role="tabpanel"
            hidden={tabValue !== 0}
            id="tabpanel-0"
            aria-labelledby="tab-0"
            className="tab-content"
          >
            {tabValue === 0 && (
              <UnifiedColVisualization 
                col={col} 
                visualizationType={visualizationType} 
                onVisualizationTypeChange={(type) => setVisualizationType(type)}
              />
            )}
          </div>
          
          {/* Onglet Météo */}
          <div
            role="tabpanel"
            hidden={tabValue !== 1}
            id="tabpanel-1"
            aria-labelledby="tab-1"
            className="tab-content"
          >
            {tabValue === 1 && (
              <WeatherWidget 
                coordinates={{ 
                  latitude: col.coordinates.latitude, 
                  longitude: col.coordinates.longitude 
                }}
                elevation={col.elevation}
                showForecast={true}
                showAlerts={true}
                showHistory={false}
              />
            )}
          </div>
          
          {/* Onglet Points d'intérêt */}
          <div
            role="tabpanel"
            hidden={tabValue !== 2}
            id="tabpanel-2"
            aria-labelledby="tab-2"
            className="tab-content"
          >
            {tabValue === 2 && (
              <PointsOfInterest 
                colId={activeColId}
                coordinates={{ 
                  latitude: col.coordinates.latitude, 
                  longitude: col.coordinates.longitude 
                }}
                points={col.pointsOfInterest}
              />
            )}
          </div>
          
          {/* Onglet Panoramas */}
          <div
            role="tabpanel"
            hidden={tabValue !== 3}
            id="tabpanel-3"
            aria-labelledby="tab-3"
            className="tab-content"
          >
            {tabValue === 3 && (
              <Suspense fallback={<div className="loading-fallback"><CircularProgress /></div>}>
                <PanoramicView colId={activeColId} panoramas={col.panoramas} />
              </Suspense>
            )}
          </div>
          
          {/* Onglet Statistiques */}
          <div
            role="tabpanel"
            hidden={tabValue !== 4}
            id="tabpanel-4"
            aria-labelledby="tab-4"
            className="tab-content"
          >
            {tabValue === 4 && (
              <Suspense fallback={<div className="loading-fallback"><CircularProgress /></div>}>
                <ColStatistics colId={activeColId} />
              </Suspense>
            )}
          </div>
        </div>
        
        {/* Pied de page avec données complémentaires */}
        <div className="col-footer">
          <div className="col-description">
            <Typography variant="h6">À propos de {col.name}</Typography>
            <Typography variant="body1">{col.description}</Typography>
          </div>
          
          <div className="col-meta">
            {col.lastUpdated && (
              <Typography variant="caption" className="last-updated">
                Dernière mise à jour: {new Date(col.lastUpdated).toLocaleDateString()}
              </Typography>
            )}
            
            {col.source && (
              <Typography variant="caption" className="data-source">
                Source: {col.source}
              </Typography>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

UnifiedColView.propTypes = {
  colId: PropTypes.string
};

export default UnifiedColView;
