/**
 * Configuration des services cartographiques
 * Centralise les paramètres Mapbox/Leaflet utilisés dans l'application
 */

export const MAPS_CONFIG = {
  // Configuration Mapbox
  mapbox: {
    accessToken: process.env.REACT_APP_MAPBOX_TOKEN,
    styles: {
      default: 'mapbox://styles/mapbox/outdoors-v11',
      satellite: 'mapbox://styles/mapbox/satellite-v9',
      terrain: 'mapbox://styles/mapbox/satellite-streets-v11',
      dark: 'mapbox://styles/mapbox/dark-v10',
      light: 'mapbox://styles/mapbox/light-v10'
    },
    options: {
      minZoom: 8,
      maxZoom: 16,
      pitch: 45, // Angle d'inclinaison pour les vues 3D
      bearing: 0,
      attributionControl: true
    }
  },
  
  // Configuration Leaflet (alternative)
  leaflet: {
    tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    options: {
      maxZoom: 18,
      minZoom: 5,
      zoomControl: true,
      scrollWheelZoom: true
    }
  },
  
  // Points d'intérêt par défaut (Grand Est)
  defaultCenter: {
    lat: 48.6, 
    lng: 7.7,
    zoom: 9
  },
  
  // Paramètres pour les traces GPX
  gpx: {
    lineColor: '#ff4500',
    lineWeight: 4,
    lineOpacity: 0.7
  },
  
  // Paramètres d'élévation
  elevation: {
    theme: 'velo-altitude',
    width: 600,
    height: 280,
    margins: {
      top: 10,
      right: 30,
      bottom: 30,
      left: 40
    },
    colors: {
      area: '#4682B4',
      line: '#0074d9'
    }
  },
  
  // Marqueurs personnalisés
  markers: {
    start: {
      iconUrl: '/assets/icons/marker-start.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34]
    },
    end: {
      iconUrl: '/assets/icons/marker-end.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34]
    },
    summit: {
      iconUrl: '/assets/icons/marker-summit.png',
      iconSize: [24, 40],
      iconAnchor: [12, 40],
      popupAnchor: [1, -34]
    }
  }
};
