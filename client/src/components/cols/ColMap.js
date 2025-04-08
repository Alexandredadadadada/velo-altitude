import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress, 
  Alert,
  Tabs,
  Tab,
  Skeleton,
  useTheme
} from '@mui/material';
import { 
  Map as MapIcon,
  Timeline as TimelineIcon,
  Info as InfoIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Chart, registerables } from 'chart.js';
import config from '../../config';
import { markPerformanceEvent } from '../../performance/setupMonitoring';

// Configuration de l'API mapbox
mapboxgl.accessToken = config.mapboxToken;

// Enregistrer les composants Chart.js nécessaires
Chart.register(...registerables);

/**
 * Composant pour afficher la carte et le profil d'élévation d'un col
 */
const ColMap = ({ col }) => {
  const theme = useTheme();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const elevationChartRef = useRef(null);
  const elevationChart = useRef(null);
  const mapInitTimeRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  
  // Changer d'onglet
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // Mesurer le temps d'accès à chaque onglet
    markPerformanceEvent('map_tab_change', { 
      tabIndex: newValue,
      tabName: newValue === 0 ? 'map' : 'elevation'
    });
  };
  
  // Initialiser la carte
  useEffect(() => {
    if (!map.current && mapContainer.current && col?.location?.coordinates) {
      try {
        // Marquer le début de l'initialisation de la carte
        markPerformanceEvent('map_init_start', { colId: col.id });
        mapInitTimeRef.current = performance.now();
        
        const { latitude, longitude } = col.location.coordinates;
        
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/outdoors-v12', // Style optimisé pour le cyclisme
          center: [longitude, latitude],
          zoom: 12,
          attributionControl: true
        });
        
        // Ajouter les contrôles de navigation
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
        map.current.addControl(new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true
        }), 'top-right');
        
        // Déterminer la couleur du marqueur en fonction de la difficulté du col
        let markerColor = theme.palette.difficulty.cat4; // Par défaut, vert pour cat4
        if (col.statistics && col.statistics.difficulty) {
          const difficulty = col.statistics.difficulty.toLowerCase();
          if (difficulty.includes('hc') || difficulty.includes('hors catégorie')) {
            markerColor = theme.palette.difficulty.hc;
          } else if (difficulty.includes('cat.1') || difficulty.includes('catégorie 1')) {
            markerColor = theme.palette.difficulty.cat1;
          } else if (difficulty.includes('cat.2') || difficulty.includes('catégorie 2')) {
            markerColor = theme.palette.difficulty.cat2;
          } else if (difficulty.includes('cat.3') || difficulty.includes('catégorie 3')) {
            markerColor = theme.palette.difficulty.cat3;
          }
        }
        
        // Ajouter un marqueur pour le sommet du col
        new mapboxgl.Marker({ color: markerColor })
          .setLngLat([longitude, latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <h3 style="margin: 0 0 8px 0; font-size: 16px;">${col.name}</h3>
                <p style="margin: 0 0 4px 0;"><strong>Altitude:</strong> ${col.statistics.summit_elevation} m</p>
                ${col.statistics.difficulty ? `<p style="margin: 0;"><strong>Difficulté:</strong> ${col.statistics.difficulty}</p>` : ''}
              `)
          )
          .addTo(map.current);
        
        // Si le col a un parcours GPX, l'afficher
        if (col.route && col.route.coordinates && col.route.coordinates.length > 0) {
          map.current.on('load', () => {
            // Marquer le chargement du style de la carte
            markPerformanceEvent('map_style_loaded');
            
            // Ajouter la source de données pour le parcours
            map.current.addSource('route', {
              'type': 'geojson',
              'data': {
                'type': 'Feature',
                'properties': {},
                'geometry': {
                  'type': 'LineString',
                  'coordinates': col.route.coordinates.map(coord => [coord.longitude, coord.latitude])
                }
              }
            });
            
            // Ajouter la couche de ligne pour le parcours
            map.current.addLayer({
              'id': 'route',
              'type': 'line',
              'source': 'route',
              'layout': {
                'line-join': 'round',
                'line-cap': 'round'
              },
              'paint': {
                'line-color': theme.palette.primary.main,
                'line-width': 4
              }
            });
            
            // Définir les limites de la carte pour inclure tout le parcours
            const coordinates = col.route.coordinates.map(coord => [coord.longitude, coord.latitude]);
            
            // Créer une enveloppe autour des coordonnées du parcours
            const bounds = coordinates.reduce((bounds, coord) => {
              return bounds.extend(coord);
            }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
            
            // Ajuster la carte pour montrer le parcours complet
            map.current.fitBounds(bounds, {
              padding: 50
            });
            
            // Marquer l'affichage du parcours GPX
            markPerformanceEvent('map_route_displayed', { 
              routePointsCount: coordinates.length 
            });
          });
        }
        
        // Événements de performance de la carte
        map.current.on('load', () => {
          const loadTime = performance.now() - mapInitTimeRef.current;
          setMapInitialized(true);
          setLoading(false);
          
          // Marquer la fin de l'initialisation de la carte
          markPerformanceEvent('map_init_complete', { 
            colId: col.id, 
            loadTimeMs: loadTime,
            hasRoute: Boolean(col.route?.coordinates?.length)
          });
          
          console.log(`[Performance] Map initialized in ${loadTime.toFixed(2)}ms`);
        });
        
        map.current.on('error', (e) => {
          setError(`Erreur de chargement de la carte: ${e.error?.message || 'Erreur inconnue'}`);
          setLoading(false);
          
          // Marquer l'erreur de chargement de la carte
          markPerformanceEvent('map_load_error', { 
            colId: col.id,
            error: e.error?.message || 'Erreur inconnue'
          });
        });
        
        // Suivre les interactions utilisateur
        map.current.on('movestart', () => markPerformanceEvent('map_interaction_move_start'));
        map.current.on('moveend', () => markPerformanceEvent('map_interaction_move_end'));
        map.current.on('zoomstart', () => markPerformanceEvent('map_interaction_zoom_start'));
        map.current.on('zoomend', () => markPerformanceEvent('map_interaction_zoom_end'));
        
      } catch (err) {
        console.error('Erreur lors de l\'initialisation de la carte:', err);
        setError(`Impossible d'initialiser la carte: ${err.message}`);
        setLoading(false);
        
        // Marquer l'erreur d'initialisation
        markPerformanceEvent('map_init_error', { error: err.message });
      }
    }
    
    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        markPerformanceEvent('map_component_unmount');
      }
    };
  }, [col, theme.palette.difficulty, theme.palette.primary.main]);
  
  // Initialiser le graphique d'élévation
  useEffect(() => {
    if (elevationChartRef.current && col?.elevation_profile && activeTab === 1) {
      try {
        // Marquer le début de l'initialisation du graphique
        markPerformanceEvent('elevation_chart_init_start', { colId: col.id });
        const startTime = performance.now();
        
        const ctx = elevationChartRef.current.getContext('2d');
        
        // Détruire le graphique existant s'il y en a un
        if (elevationChart.current) {
          elevationChart.current.destroy();
        }
        
        // Extraire les données d'élévation
        const labels = col.elevation_profile.map((point, index) => 
          `${(point.distance || index * 0.1).toFixed(1)} km`);
        const data = col.elevation_profile.map(point => point.elevation);
        
        // Créer le graphique
        elevationChart.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Altitude (m)',
              data: data,
              borderColor: theme.palette.primary.main,
              backgroundColor: `${theme.palette.primary.main}33`,
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 4,
              pointBackgroundColor: theme.palette.primary.dark,
              fill: true,
              tension: 0.2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: false,
                title: {
                  display: true,
                  text: 'Altitude (m)'
                },
                ticks: {
                  callback: function(value) {
                    return value + ' m';
                  }
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'Distance (km)'
                },
                ticks: {
                  // Réduire le nombre de ticks pour éviter l'encombrement
                  maxTicksLimit: 10,
                  callback: function(value, index, values) {
                    // Afficher uniquement tous les x km pour une meilleure lisibilité
                    const distance = parseFloat(this.getLabelForValue(index).split(' ')[0]);
                    return distance % 2 === 0 ? this.getLabelForValue(index) : '';
                  }
                }
              }
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: ColMap.label,
                  title: ColMap.title
                },
                intersect: false,
                mode: 'index'
              },
              legend: {
                display: false
              }
            },
            interaction: {
              mode: 'nearest',
              axis: 'x',
              intersect: false
            },
            animation: {
              duration: theme.transitions.duration.complex
            }
          }
        });
        
        // Mesurer le temps d'initialisation
        const initTime = performance.now() - startTime;
        
        // Marquer la fin de l'initialisation du graphique
        markPerformanceEvent('elevation_chart_init_complete', { 
          colId: col.id, 
          dataPointsCount: data.length,
          initTimeMs: initTime
        });
        
        console.log(`[Performance] Elevation chart initialized in ${initTime.toFixed(2)}ms`);
      } catch (err) {
        console.error('Erreur lors de l\'initialisation du graphique d\'élévation:', err);
        
        // Marquer l'erreur d'initialisation du graphique
        markPerformanceEvent('elevation_chart_init_error', { 
          colId: col.id, 
          error: err.message 
        });
      }
    }
    
    // Nettoyage du graphique
    return () => {
      if (elevationChart.current) {
        elevationChart.current.destroy();
        elevationChart.current = null;
      }
    };
  }, [col?.elevation_profile, activeTab, theme.palette.primary.main, theme.palette.primary.dark, theme.transitions.duration.complex, col?.id]);
  
  // Si pas de coordonnées
  if (!col?.location?.coordinates) {
    return (
      <Alert 
        severity="info" 
        sx={{ 
          display: 'flex', 
          alignItems: 'center' 
        }}
        icon={<InfoIcon aria-hidden="true" />}
      >
        <Typography>
          Informations de localisation non disponibles pour ce col.
        </Typography>
      </Alert>
    );
  }
  
  return (
    <Box sx={{ mt: 2 }} component="section" aria-label="Carte et profil d'élévation">
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange}
        sx={{ mb: 2 }}
        aria-label="Options d'affichage du col"
        variant="fullWidth"
      >
        <Tab 
          icon={<MapIcon />} 
          label="Carte" 
          id="col-tab-0"
          aria-controls="col-tabpanel-0"
          sx={{ 
            fontWeight: 500,
            textTransform: 'none'
          }}
        />
        <Tab 
          icon={<TimelineIcon />} 
          label="Profil d'élévation" 
          disabled={!col.elevation_profile} 
          id="col-tab-1"
          aria-controls="col-tabpanel-1"
          sx={{ 
            fontWeight: 500,
            textTransform: 'none'
          }}
        />
      </Tabs>
      
      <Box
        id="col-tabpanel-0"
        role="tabpanel"
        aria-labelledby="col-tab-0"
        hidden={activeTab !== 0}
      >
        {activeTab === 0 && (
          <Box 
            sx={{ 
              position: 'relative', 
              height: 400, 
              borderRadius: 1, 
              overflow: 'hidden', 
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
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
                  bgcolor: 'background.paper',
                  opacity: 0.9,
                  zIndex: 10
                }}
              >
                {!error && (
                  <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress size={40} thickness={4} />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      Chargement de la carte...
                    </Typography>
                  </Box>
                )}
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
                  bgcolor: 'background.paper',
                  opacity: 0.9,
                  zIndex: 10,
                  p: 2
                }}
              >
                <Alert 
                  severity="error" 
                  sx={{ width: '100%', maxWidth: 400 }}
                  variant="filled"
                >
                  <Typography variant="subtitle2" component="h3">
                    Erreur de chargement
                  </Typography>
                  <Typography variant="body2">
                    {error}
                  </Typography>
                </Alert>
              </Box>
            )}
            
            {!mapInitialized && !error && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  p: 2,
                  zIndex: 5
                }}
              >
                <Skeleton variant="rectangular" height="100%" width="100%" animation="wave" />
              </Box>
            )}
            
            <Box 
              ref={mapContainer} 
              sx={{ height: '100%', width: '100%' }}
              aria-label={`Carte de ${col.name}`}
              aria-busy={loading}
            />
          </Box>
        )}
      </Box>
      
      <Box
        id="col-tabpanel-1"
        role="tabpanel"
        aria-labelledby="col-tab-1"
        hidden={activeTab !== 1}
      >
        {activeTab === 1 && (
          <Box 
            sx={{ 
              height: 400, 
              position: 'relative',
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1
            }}
          >
            {!col.elevation_profile ? (
              <Box 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}
              >
                <Typography color="text.secondary">
                  Profil d'élévation non disponible pour ce col.
                </Typography>
              </Box>
            ) : (
              <canvas 
                ref={elevationChartRef} 
                aria-label={`Profil d'élévation de ${col.name}`}
              />
            )}
          </Box>
        )}
      </Box>
      
      {activeTab === 0 && col?.practical_info?.parking && (
        <Paper
          elevation={0}
          sx={{ 
            mt: 2, 
            p: 2, 
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1
          }}
        >
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
            <InfoIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
            Stationnement
          </Typography>
          <Typography variant="body2">
            {col.practical_info.parking}
          </Typography>
        </Paper>
      )}
      
      {activeTab === 0 && col?.warnings && (
        <Alert 
          severity="warning" 
          sx={{ 
            mt: 2,
            '& .MuiAlert-icon': {
              alignItems: 'flex-start',
              pt: 1
            }
          }}
          icon={<WarningIcon />}
          variant="outlined"
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Points d'attention
          </Typography>
          <Typography variant="body2">
            {col.warnings}
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default ColMap;
