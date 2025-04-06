import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Box, Typography, Paper, Skeleton, CircularProgress } from '@mui/material';
import { useRouteDetails } from '../../hooks/useApi';

// Définir l'interface pour les props du composant
interface RouteMapProps {
  routeId: string;
  height?: number;
}

const RouteMap: React.FC<RouteMapProps> = ({ routeId, height = 500 }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Utiliser notre hook personnalisé pour obtenir les détails de l'itinéraire
  const { data: routeData, loading, error } = useRouteDetails(routeId);
  
  // Initialiser la carte lorsque le conteneur est monté
  useEffect(() => {
    if (!mapContainer.current) return;
    
    // Récupérer le token Mapbox depuis les variables d'environnement
    // Note: Dans une application réelle, cette valeur serait injectée via Next.js
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
    
    if (!mapboxToken) {
      console.error('Token Mapbox non disponible');
      return;
    }
    
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v11', // Style adapté au cyclisme
      center: [2.2137, 46.2276], // Centre de la France par défaut
      zoom: 5
    });
    
    map.current.on('load', () => {
      setMapLoaded(true);
    });
    
    // Nettoyage lors du démontage du composant
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);
  
  // Mettre à jour la carte lorsque les données d'itinéraire sont chargées
  useEffect(() => {
    if (!mapLoaded || !map.current || !routeData || !routeData.coordinates) return;
    
    const coordinates = routeData.coordinates;
    
    if (coordinates.length === 0) return;
    
    // Centrer la carte sur le premier point de l'itinéraire
    map.current.flyTo({
      center: coordinates[0],
      zoom: 11,
      essential: true
    });
    
    // Ajouter la source de données pour l'itinéraire
    if (!map.current.getSource('route')) {
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coordinates
          }
        }
      });
      
      // Ajouter la couche de trace de l'itinéraire
      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#f44336',
          'line-width': 5,
          'line-opacity': 0.8
        }
      });
      
      // Ajouter les marqueurs pour le début et la fin
      const start = coordinates[0];
      const end = coordinates[coordinates.length - 1];
      
      // Marqueur de départ (vert)
      new mapboxgl.Marker({ color: '#4CAF50' })
        .setLngLat(start)
        .setPopup(new mapboxgl.Popup().setHTML('<h3>Départ</h3>'))
        .addTo(map.current);
      
      // Marqueur d'arrivée (rouge)
      new mapboxgl.Marker({ color: '#f44336' })
        .setLngLat(end)
        .setPopup(new mapboxgl.Popup().setHTML('<h3>Arrivée</h3>'))
        .addTo(map.current);
      
      // Ajouter des marqueurs pour les points d'intérêt si disponibles
      if (routeData.pointsOfInterest) {
        routeData.pointsOfInterest.forEach((poi: any) => {
          new mapboxgl.Marker({ color: '#2196F3' })
            .setLngLat(poi.coordinates)
            .setPopup(new mapboxgl.Popup().setHTML(`<h3>${poi.name}</h3><p>${poi.description || ''}</p>`))
            .addTo(map.current);
        });
      }
    } else {
      // Mettre à jour la source existante si nécessaire
      const source = map.current.getSource('route') as mapboxgl.GeoJSONSource;
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: coordinates
        }
      });
    }
    
    // Ajuster la taille de la carte pour qu'elle contienne tout l'itinéraire
    const bounds = coordinates.reduce((bounds, coord) => {
      return bounds.extend(coord as mapboxgl.LngLatLike);
    }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
    
    map.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 14
    });
    
  }, [mapLoaded, routeData]);
  
  if (loading) {
    return (
      <Paper 
        elevation={2} 
        sx={{ 
          height: height, 
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" mt={2}>
          Chargement de la carte...
        </Typography>
      </Paper>
    );
  }
  
  if (error) {
    return (
      <Paper 
        elevation={2} 
        sx={{ 
          height: height, 
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 3
        }}
      >
        <Typography variant="h6" color="error" gutterBottom>
          Erreur de chargement de la carte
        </Typography>
        <Typography variant="body2">
          {error.message}
        </Typography>
      </Paper>
    );
  }
  
  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box 
        ref={mapContainer} 
        sx={{ 
          height: height, 
          width: '100%',
          '& .mapboxgl-map': {
            borderRadius: 8
          }
        }} 
      />
    </Paper>
  );
};

export default RouteMap;
