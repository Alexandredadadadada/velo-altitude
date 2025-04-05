import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, Chip, CircularProgress, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getColDetailById } from '../../services/colsService';
import config from '../../config';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

// Configuration de l'API mapbox
mapboxgl.accessToken = config.mapboxToken;

/**
 * Composant pour afficher une carte avec les cols d'un défi
 */
const ChallengeMap = ({ challenge, colsData, userProgress }) => {
  const theme = useTheme();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const colMarkers = useRef([]);
  const popups = useRef({});
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewState, setViewState] = useState({
    latitude: 46.603354, // Centre de la France par défaut
    longitude: 1.888334,
    zoom: 5
  });

  // Récupérer les détails des cols et initialiser la carte
  useEffect(() => {
    if (!map.current && mapContainer.current) {
      initializeMap();
    }
  }, [mapContainer.current]);

  // Mise à jour des marqueurs quand les données des cols changent
  useEffect(() => {
    if (map.current && colsData && Object.keys(colsData).length > 0) {
      addColMarkers();
    }
  }, [colsData, map.current]);

  // Initialisation de la carte
  const initializeMap = () => {
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/outdoors-v12', // Style optimisé pour le cyclisme
        center: [viewState.longitude, viewState.latitude],
        zoom: viewState.zoom,
        attributionControl: true
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
      map.current.addControl(new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      }), 'top-right');
      
      // Attendre que la carte soit chargée
      map.current.on('load', () => {
        setLoading(false);
        
        // Si nous avons déjà des données sur les cols, ajouter les marqueurs
        if (colsData && Object.keys(colsData).length > 0) {
          addColMarkers();
        }
      });
      
      // Gérer les erreurs
      map.current.on('error', (e) => {
        setError('Erreur lors du chargement de la carte');
        console.error('Erreur mapbox:', e);
        setLoading(false);
      });
    } catch (err) {
      setError('Impossible d\'initialiser la carte');
      console.error('Erreur lors de l\'initialisation de la carte:', err);
      setLoading(false);
    }
  };

  // Ajouter des marqueurs pour les cols
  const addColMarkers = () => {
    // Supprimer les marqueurs existants
    colMarkers.current.forEach(marker => marker.remove());
    colMarkers.current = [];
    
    // Supprimer les popups existantes
    Object.values(popups.current).forEach(popup => popup.remove());
    popups.current = {};
    
    // Si aucun col, retourner
    if (!challenge || !challenge.cols || !colsData) return;
    
    // Coordonnées pour le calcul des limites de la carte
    const bounds = new mapboxgl.LngLatBounds();
    
    // Ajouter un marqueur pour chaque col
    challenge.cols.forEach(colId => {
      const col = colsData[colId];
      if (!col || !col.location || !col.location.coordinates) return;
      
      const { longitude, latitude } = col.location.coordinates;
      
      // Vérifier si les coordonnées sont valides
      if (!longitude || !latitude) return;
      
      // Étendre les limites
      bounds.extend([longitude, latitude]);
      
      // Créer l'élément HTML pour le marqueur
      const markerElement = document.createElement('div');
      
      // Vérifier si le col est complété
      const isCompleted = userProgress && 
                         userProgress.completedCols && 
                         userProgress.completedCols.includes(colId);
      
      // Styliser le marqueur en fonction du statut de complétion
      markerElement.className = 'col-marker';
      markerElement.style.width = '25px';
      markerElement.style.height = '25px';
      markerElement.style.borderRadius = '50%';
      markerElement.style.backgroundColor = isCompleted 
        ? theme.palette.success.main
        : theme.palette.primary.main;
      markerElement.style.border = '2px solid white';
      markerElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      markerElement.style.cursor = 'pointer';
      markerElement.style.display = 'flex';
      markerElement.style.alignItems = 'center';
      markerElement.style.justifyContent = 'center';
      
      // Numéro du col dans le défi
      const colIndex = challenge.cols.indexOf(colId) + 1;
      markerElement.innerHTML = `<span style="color: white; font-weight: bold; font-size: 12px;">${colIndex}</span>`;
      
      // Créer le popup
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: true,
        offset: 25
      }).setHTML(`
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; color: ${theme.palette.primary.main};">${col.name}</h3>
          <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Altitude:</strong> ${col.statistics.summit_elevation} m</p>
          <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Dénivelé:</strong> ${col.statistics.elevation_gain} m</p>
          <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Distance:</strong> ${col.statistics.length} km</p>
          <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Pente moy:</strong> ${col.statistics.avg_gradient}%</p>
          ${isCompleted 
            ? `<div style="margin-top: 8px; padding: 4px 8px; background-color: ${theme.palette.success.light}; color: ${theme.palette.success.contrastText}; border-radius: 4px; font-size: 12px; text-align: center;">Col conquis !</div>` 
            : ''}
        </div>
      `);
      
      // Créer le marqueur
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([longitude, latitude])
        .setPopup(popup)
        .addTo(map.current);
      
      // Stocker le marqueur et le popup pour pouvoir les supprimer plus tard
      colMarkers.current.push(marker);
      popups.current[colId] = popup;
    });
    
    // Ajuster la vue pour voir tous les cols
    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 12
      });
    }
  };

  return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/challengemap"
        }
      </script>
      <EnhancedMetaTags
        title="Défis Cyclistes | Velo-Altitude"
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="article"
        imageUrl="/images/og-image.jpg"
      />
    <Box sx={{ position: 'relative', height: '500px', width: '100%', borderRadius: 2, overflow: 'hidden' }}>
      {loading && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            bgcolor: 'rgba(255,255,255,0.7)',
            zIndex: 10
          }}
        >
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            bgcolor: 'rgba(255,255,255,0.7)',
            zIndex: 10,
            p: 2
          }}
        >
          <Alert severity="error" sx={{ width: '100%', maxWidth: 400 }}>
            {error}
          </Alert>
        </Box>
      )}
      
      <Box 
        ref={mapContainer} 
        sx={{ height: '100%', width: '100%' }}
      />
      
      {challenge && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 16, 
            left: 16, 
            zIndex: 5,
            maxWidth: '60%'
          }}
        >
          <Paper 
            elevation={3} 
            sx={{ 
              p: 1.5, 
              bgcolor: 'rgba(255,255,255,0.9)', 
              backdropFilter: 'blur(4px)' 
            }}
          >
            <Typography variant="subtitle1" fontWeight="medium" noWrap>
              {challenge.name}
            </Typography>
            
            <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
              {challenge.cols && challenge.cols.length > 0 && (
                <Chip 
                  size="small" 
                  label={`${challenge.cols.length} cols`} 
                  color="primary" 
                  variant="outlined" 
                />
              )}
              
              <Chip 
                size="small" 
                label={challenge.difficulty} 
                color="error" 
                variant="outlined" 
              />
              
              {userProgress && (
                <Chip 
                  size="small" 
                  label={`${userProgress.completedCols ? userProgress.completedCols.length : 0}/${challenge.cols ? challenge.cols.length : 0} complétés`} 
                  color="success" 
                  variant="outlined" 
                />
              )}
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default ChallengeMap;
