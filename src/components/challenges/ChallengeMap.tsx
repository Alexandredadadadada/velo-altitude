import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Box } from '@mui/material';
import { Col, Route } from '../../types';

// La clé API Mapbox doit être configurée dans les variables d'environnement
// ou en utilisant un provider de contexte pour ce composant
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface ChallengeMapProps {
  cols: Col[];
  selectedRoute?: Route;
  interactive?: boolean;
}

const ChallengeMap: React.FC<ChallengeMapProps> = ({ 
  cols, 
  selectedRoute, 
  interactive = true 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Initialisation de la carte
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    const initialBounds = getBoundsFromCols(cols);
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v11', // Style adapté au cyclisme
      bounds: initialBounds,
      fitBoundsOptions: { padding: 50 },
      interactive: interactive
    });
    
    map.current.on('load', () => {
      setMapLoaded(true);
    });
    
    // Nettoyage à la destruction du composant
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [cols, interactive]);
  
  // Affichage des cols sur la carte
  useEffect(() => {
    if (!mapLoaded || !map.current) return;
    
    // Suppression des marqueurs et sources existants
    clearMapLayers();
    
    // Ajout des marqueurs pour chaque col
    cols.forEach(col => {
      addColMarker(col);
    });
    
    // Ajouter la source et les calques de données pour les cols
    addColsDataLayer();
    
    // Ajuster la vue de la carte pour inclure tous les cols
    const bounds = getBoundsFromCols(cols);
    map.current.fitBounds(bounds, { padding: 50 });
  }, [cols, mapLoaded]);
  
  // Affichage de l'itinéraire sélectionné
  useEffect(() => {
    if (!mapLoaded || !map.current) return;
    
    // Supprimer l'itinéraire précédent s'il existe
    if (map.current.getLayer('route-line')) {
      map.current.removeLayer('route-line');
    }
    if (map.current.getSource('route')) {
      map.current.removeSource('route');
    }
    
    // Si un itinéraire est sélectionné, l'afficher
    if (selectedRoute && selectedRoute.coordinates && selectedRoute.coordinates.length > 0) {
      // Créer une ligne GeoJSON pour l'itinéraire
      const routeGeoJSON = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: selectedRoute.coordinates
        }
      };
      
      // Ajouter la source de données
      map.current.addSource('route', {
        type: 'geojson',
        data: routeGeoJSON as any
      });
      
      // Ajouter le calque de ligne
      map.current.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#0066ff',
          'line-width': 4,
          'line-opacity': 0.8
        }
      });
      
      // Ajuster la vue de la carte pour inclure l'itinéraire complet
      const routeBounds = new mapboxgl.LngLatBounds();
      selectedRoute.coordinates.forEach(coord => {
        routeBounds.extend(coord as [number, number]);
      });
      map.current.fitBounds(routeBounds, { padding: 50 });
    } else {
      // Si aucun itinéraire n'est sélectionné, revenir à la vue d'ensemble des cols
      const bounds = getBoundsFromCols(cols);
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [selectedRoute, mapLoaded, cols]);
  
  // Fonction utilitaire pour déterminer les limites géographiques à partir des cols
  const getBoundsFromCols = (cols: Col[]): mapboxgl.LngLatBounds => {
    const bounds = new mapboxgl.LngLatBounds();
    
    cols.forEach(col => {
      if (col.coordinates) {
        bounds.extend(col.coordinates as [number, number]);
      }
      if (col.startCoordinates) {
        bounds.extend(col.startCoordinates as [number, number]);
      }
      if (col.endCoordinates) {
        bounds.extend(col.endCoordinates as [number, number]);
      }
    });
    
    return bounds;
  };
  
  // Fonction pour ajouter un marqueur pour un col
  const addColMarker = (col: Col) => {
    if (!map.current || !col.coordinates) return;
    
    // Créer un élément HTML personnalisé pour le marqueur
    const markerElement = document.createElement('div');
    markerElement.className = 'col-marker';
    markerElement.style.width = '20px';
    markerElement.style.height = '20px';
    markerElement.style.borderRadius = '50%';
    markerElement.style.backgroundColor = getColDifficultyColor(col.difficulty);
    markerElement.style.border = '2px solid white';
    markerElement.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.3)';
    
    // Ajouter une infobulle avec le nom du col
    markerElement.title = `${col.name} (${col.elevation}m, ${col.avgGradient}%)`;
    
    // Créer et ajouter le marqueur à la carte
    new mapboxgl.Marker(markerElement)
      .setLngLat(col.coordinates as [number, number])
      .addTo(map.current);
  };
  
  // Fonction pour ajouter une couche de données pour tous les cols
  const addColsDataLayer = () => {
    if (!map.current) return;
    
    // Supprimer la source si elle existe déjà
    if (map.current.getSource('cols-data')) {
      map.current.removeSource('cols-data');
    }
    
    // Créer les features GeoJSON pour les cols
    const features = cols.map(col => ({
      type: 'Feature',
      properties: {
        name: col.name,
        elevation: col.elevation,
        length: col.length,
        avgGradient: col.avgGradient,
        difficulty: col.difficulty
      },
      geometry: {
        type: 'Point',
        coordinates: col.coordinates
      }
    }));
    
    // Ajouter la source de données
    map.current.addSource('cols-data', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features
      } as any
    });
  };
  
  // Fonction pour nettoyer les couches et sources existantes
  const clearMapLayers = () => {
    if (!map.current) return;
    
    // Supprimer les couches et sources d'itinéraire
    if (map.current.getLayer('route-line')) {
      map.current.removeLayer('route-line');
    }
    if (map.current.getSource('route')) {
      map.current.removeSource('route');
    }
    
    // Supprimer la source de données des cols
    if (map.current.getSource('cols-data')) {
      map.current.removeSource('cols-data');
    }
    
    // Supprimer tous les marqueurs
    const markers = document.querySelectorAll('.mapboxgl-marker');
    markers.forEach(marker => {
      marker.remove();
    });
  };
  
  // Fonction pour obtenir la couleur correspondant à la difficulté du col
  const getColDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy':
        return '#4CAF50'; // Vert
      case 'medium':
        return '#FFC107'; // Jaune
      case 'hard':
        return '#FF5722'; // Orange
      case 'extreme':
        return '#F44336'; // Rouge
      default:
        return '#2196F3'; // Bleu par défaut
    }
  };
  
  return (
    <Box 
      ref={mapContainer} 
      sx={{ 
        width: '100%', 
        height: '100%',
        borderRadius: 1,
        overflow: 'hidden'
      }}
    />
  );
};

export default ChallengeMap;
