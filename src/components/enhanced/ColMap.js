import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress, 
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Map as MapIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Chart, registerables } from 'chart.js';
import config from '../../config';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

// Configuration de l'API mapbox
mapboxgl.accessToken = config.mapboxToken;

// Enregistrer les composants Chart.js nécessaires
Chart.register(...registerables);

/**
 * Composant pour afficher la carte et le profil d'élévation d'un col
 */
const ColMap = ({ col }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const elevationChartRef = useRef(null);
  const elevationChart = useRef(null);
  
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Changer d'onglet
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Initialiser la carte
  useEffect(() => {
    if (!map.current && mapContainer.current && col?.location?.coordinates) {
      try {
        const { latitude, longitude } = col.location.coordinates;
        
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/outdoors-v12', // Style optimisé pour le cyclisme
          center: [longitude, latitude],
          zoom: 12,
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
        
        // Ajouter un marqueur pour le sommet du col
        new mapboxgl.Marker({ color: '#FF4436' })
          .setLngLat([longitude, latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <h3 style="margin: 0 0 8px 0; font-size: 16px;">${col.name}</h3>
                <p style="margin: 0 0 4px 0;"><strong>Altitude:</strong> ${col.statistics.summit_elevation} m</p>
              `)
          )
          .addTo(map.current);
        
        // Si le col a un parcours GPX, l'afficher
        if (col.route && col.route.coordinates && col.route.coordinates.length > 0) {
          map.current.on('load', () => {
            // Ajouter la source de données pour le parcours
            map.current.addSource('route', {
              'type': 'geojson',
              'data': {
                'type': 'Feature',
                'properties': {},
                'geometry': {
                  'type': 'LineString',
                  'coordinates': col.route.coordinates.map(point => [point.longitude, point.latitude])
                }
              }
            });
            
            // Ajouter la couche pour afficher le parcours
            map.current.addLayer({
              'id': 'route',
              'type': 'line',
              'source': 'route',
              'layout': {
                'line-join': 'round',
                'line-cap': 'round'
              },
              'paint': {
                'line-color': '#FF4436',
                'line-width': 4
              }
            });
            
            // Ajuster la vue pour voir tout le parcours
            const coordinates = col.route.coordinates.map(point => [point.longitude, point.latitude]);
            const bounds = coordinates.reduce((bounds, coord) => {
              return bounds.extend(coord);
            }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
            
            map.current.fitBounds(bounds, {
              padding: 50,
              maxZoom: 14
            });
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors de l\'initialisation de la carte:', err);
        setError('Impossible d\'initialiser la carte');
        setLoading(false);
      }
    }
  }, [col]);
  
  // Générer le graphique d'élévation
  useEffect(() => {
    if (activeTab === 1 && elevationChartRef.current && col?.elevation_profile) {
      try {
        // Détruire le graphique précédent s'il existe
        if (elevationChart.current) {
          elevationChart.current.destroy();
        }
        
        const ctx = elevationChartRef.current.getContext('2d');
        
        // Préparer les données pour le graphique
        const labels = col.elevation_profile.map((point, index) => 
          ((point.distance / col.statistics.length) * 100).toFixed(0) + '%'
        );
        
        const data = col.elevation_profile.map(point => point.elevation);
        
        // Créer le graphique
        elevationChart.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Altitude (m)',
              data: data,
              fill: true,
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 2,
              tension: 0.3,
              pointRadius: 0,
              pointHoverRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                  label: function(context) {
                    return `Altitude: ${context.raw} m`;
                  },
                  title: function(context) {
                    const point = col.elevation_profile[context[0].dataIndex];
                    return `Distance: ${point.distance.toFixed(1)} km`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: false,
                title: {
                  display: true,
                  text: 'Altitude (m)'
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'Progression'
                }
              }
            }
          }
        });
      } catch (err) {
        console.error('Erreur lors de la création du profil d\'élévation:', err);
      }
    }
  }, [activeTab, col]);
  
  // Si pas de coordonnées
  if (!col?.location?.coordinates) {
    return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "SportsActivity",
          "name": "{col.name}",
          "description": "{col.description}",
          "url": "https://velo-altitude.com/colmap"
        }
      </script>
      <EnhancedMetaTags
        title="Détail du Col | Velo-Altitude"
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="article"
        imageUrl="/images/og-image.jpg"
      />
      <Alert severity="info">
        Informations de localisation non disponibles pour ce col.
      </Alert>
    );
  }
  
  return (
    <Box sx={{ mt: 2 }}>
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange}
        sx={{ mb: 2 }}
      >
        <Tab icon={<MapIcon />} label="Carte" />
        <Tab 
          icon={<TimelineIcon />} 
          label="Profil d'élévation" 
          disabled={!col.elevation_profile} 
        />
      </Tabs>
      
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
        </Box>
      )}
      
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
            <canvas ref={elevationChartRef} />
          )}
        </Box>
      )}
      
      {activeTab === 0 && col?.practical_info?.parking && (
        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>
            Stationnement:
          </Typography>
          <Typography variant="body2">
            {col.practical_info.parking}
          </Typography>
        </Box>
      )}
      
      {activeTab === 0 && col?.warnings && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="subtitle2">
            Points d'attention:
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
