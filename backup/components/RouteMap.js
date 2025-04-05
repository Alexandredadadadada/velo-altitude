import React, { useState, useEffect, useCallback } from 'react';
import { 
  MapContainer, TileLayer, Polyline, Marker, Popup, 
  useMap, ZoomControl, useMapEvents
} from 'react-leaflet';
import { Icon, divIcon } from 'leaflet';
import { Box, Typography, Paper, CircularProgress, Button, Alert } from '@mui/material';
import { MyLocation, Refresh, Warning } from '@mui/icons-material';
import 'leaflet/dist/leaflet.css';

// Icônes personnalisées
const startIcon = new Icon({
  iconUrl: '/icons/start-marker.svg',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const endIcon = new Icon({
  iconUrl: '/icons/end-marker.svg',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const poiIcon = new Icon({
  iconUrl: '/icons/poi-marker.svg',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24]
});

// Icône pour les alertes météo
const createWeatherAlertIcon = (severity) => {
  const color = severity === 'high' ? '#ff0000' : 
                severity === 'medium' ? '#ff9900' : '#ffcc00';
  
  return divIcon({
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-weight: bold;">!</span>
           </div>`,
    className: 'weather-alert-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

/**
 * Composant de contrôle de recadrage automatique
 */
const FitBoundsControl = ({ points, resetTrigger }) => {
  const map = useMap();
  
  useEffect(() => {
    if (points && points.length > 0) {
      try {
        const bounds = points.map(point => [
          point.lat || point.latitude, 
          point.lng || point.longitude
        ]);
        map.fitBounds(bounds);
      } catch (error) {
        console.error('Erreur lors du recadrage de la carte:', error);
      }
    }
  }, [map, points, resetTrigger]);
  
  return null;
};

/**
 * Composant de localisation de l'utilisateur
 */
const UserLocationButton = () => {
  const map = useMap();
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState(null);
  
  const handleLocate = useCallback(() => {
    setLocating(true);
    setError(null);
    
    map.locate({ 
      setView: true, 
      maxZoom: 14,
      timeout: 10000,
      enableHighAccuracy: true
    });
  }, [map]);
  
  useMapEvents({
    locationfound: (e) => {
      setLocating(false);
    },
    locationerror: (e) => {
      setLocating(false);
      setError('Impossible de déterminer votre position');
      console.error('Erreur de géolocalisation:', e);
    }
  });
  
  return (
    <Button 
      variant="contained"
      color="primary"
      size="small"
      disabled={locating}
      onClick={handleLocate}
      startIcon={locating ? <CircularProgress size={16} color="inherit" /> : <MyLocation />}
      sx={{ 
        position: 'absolute', 
        top: 10, 
        right: 10, 
        zIndex: 1000,
        backgroundColor: 'white',
        color: 'rgba(0, 0, 0, 0.7)',
        '&:hover': {
          backgroundColor: '#f5f5f5'
        }
      }}
    >
      {locating ? 'Localisation...' : 'Ma position'}
    </Button>
  );
};

/**
 * Composant principal de carte pour les itinéraires
 * Gère les erreurs de chargement, de rendu et les cas limites
 */
const RouteMap = ({ 
  route, 
  height = 400, 
  showControls = true, 
  showWeatherAlerts = false,
  weatherAlerts = [],
  interactive = true,
  className = ''
}) => {
  const [mapError, setMapError] = useState(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [validPoints, setValidPoints] = useState([]);
  
  // Valider et formater les points
  useEffect(() => {
    if (!route || !route.points || !Array.isArray(route.points)) {
      setMapError('Données d\'itinéraire invalides ou manquantes');
      setValidPoints([]);
      return;
    }
    
    try {
      // Filtre et validation des points
      const filteredPoints = route.points
        .filter(point => {
          // Vérifier que les coordonnées sont valides
          const lat = point.lat || point.latitude;
          const lng = point.lng || point.longitude;
          
          if (lat === undefined || lng === undefined) {
            return false;
          }
          
          // Vérifier que les coordonnées sont dans des plages valides
          if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return false;
          }
          
          return true;
        })
        .map(point => ({
          lat: point.lat || point.latitude,
          lng: point.lng || point.longitude,
          elevation: point.elevation || 0
        }));
      
      if (filteredPoints.length === 0) {
        setMapError('Aucun point de coordonnées valide dans cet itinéraire');
      } else if (filteredPoints.length < route.points.length) {
        console.warn(`${route.points.length - filteredPoints.length} points invalides ont été filtrés`);
        setMapError(null);
      } else {
        setMapError(null);
      }
      
      setValidPoints(filteredPoints);
    } catch (error) {
      console.error('Erreur lors de la validation des points:', error);
      setMapError('Erreur lors du traitement des coordonnées');
      setValidPoints([]);
    }
  }, [route]);
  
  // Fonction pour réinitialiser la carte
  const handleResetView = () => {
    setResetTrigger(prev => prev + 1);
  };
  
  if (mapError) {
    return (
      <Box 
        className={`route-map-error ${className}`}
        sx={{
          height,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f5f5f5',
          borderRadius: 1,
          p: 2
        }}
      >
        <Warning color="error" sx={{ fontSize: 48, mb: 2 }} />
        <Typography variant="h6" gutterBottom color="error">
          Erreur d'affichage de la carte
        </Typography>
        <Typography variant="body2" color="textSecondary" textAlign="center">
          {mapError}
        </Typography>
        {route && route.points && (
          <Button 
            variant="outlined" 
            color="primary" 
            sx={{ mt: 2 }}
            onClick={handleResetView}
          >
            Réessayer
          </Button>
        )}
      </Box>
    );
  }
  
  if (!route || validPoints.length === 0) {
    return (
      <Box 
        className={`route-map-empty ${className}`}
        sx={{
          height,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f5f5f5',
          borderRadius: 1
        }}
      >
        <CircularProgress size={40} thickness={4} />
      </Box>
    );
  }
  
  // Préparer les marqueurs pour le début et la fin
  const startPoint = validPoints[0];
  const endPoint = validPoints[validPoints.length - 1];
  
  // Préparer les points d'intérêt
  const pointsOfInterest = route.points_of_interest || [];
  
  return (
    <Box 
      className={`route-map-container ${className}`}
      sx={{ 
        height, 
        position: 'relative',
        borderRadius: 1,
        overflow: 'hidden'
      }}
    >
      {!isMapReady && (
        <Box 
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f5f5f5',
            zIndex: 1000
          }}
        >
          <CircularProgress size={40} thickness={4} />
        </Box>
      )}
      
      <MapContainer
        center={[validPoints[0].lat, validPoints[0].lng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={true}
        scrollWheelZoom={interactive}
        dragging={interactive}
        touchZoom={interactive}
        doubleClickZoom={interactive}
        onLoad={() => setIsMapReady(true)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{
            tileerror: (error) => {
              console.error('Erreur de chargement des tuiles:', error);
              setMapError('Erreur de chargement de la carte. Vérifiez votre connexion internet.');
            }
          }}
        />
        
        {/* Option pour afficher une couche de carte de relief */}
        {route.type === 'montagne' && (
          <TileLayer
            url="https://tiles.wmflabs.org/hillshading/{z}/{x}/{y}.png"
            attribution='Hillshading: <a href="https://wiki.openstreetmap.org/wiki/Hillshading">OpenStreetMap</a>'
            opacity={0.3}
          />
        )}
        
        {/* Ligne de l'itinéraire avec dégradé de couleur basé sur l'élévation */}
        <Polyline 
          positions={validPoints.map(point => [point.lat, point.lng])}
          pathOptions={{ 
            color: route.type === 'montagne' ? '#ff4500' : '#3388ff',
            weight: 5,
            opacity: 0.8,
            smoothFactor: 1
          }}
        />
        
        {/* Marqueur de départ */}
        <Marker 
          position={[startPoint.lat, startPoint.lng]} 
          icon={startIcon}
        >
          <Popup>
            <Typography variant="body2" fontWeight="bold">
              Point de départ
            </Typography>
            <Typography variant="body2">
              {route.name}
            </Typography>
          </Popup>
        </Marker>
        
        {/* Marqueur d'arrivée */}
        <Marker 
          position={[endPoint.lat, endPoint.lng]} 
          icon={endIcon}
        >
          <Popup>
            <Typography variant="body2" fontWeight="bold">
              Point d'arrivée
            </Typography>
            <Typography variant="body2">
              Distance totale: {(route.distance || 0).toFixed(1)} km
            </Typography>
          </Popup>
        </Marker>
        
        {/* Points d'intérêt */}
        {pointsOfInterest.map((poi, index) => {
          // Calcul approximatif de la position du POI le long de l'itinéraire
          const poiIndex = Math.floor(validPoints.length * (index + 1) / (pointsOfInterest.length + 1));
          const poiPoint = validPoints[poiIndex] || validPoints[0];
          
          return (
            <Marker 
              key={`poi-${index}`}
              position={[poiPoint.lat, poiPoint.lng]} 
              icon={poiIcon}
            >
              <Popup>
                <Typography variant="body2" fontWeight="bold">
                  Point d'intérêt
                </Typography>
                <Typography variant="body2">
                  {poi}
                </Typography>
              </Popup>
            </Marker>
          );
        })}
        
        {/* Alertes météo */}
        {showWeatherAlerts && weatherAlerts && weatherAlerts.map((alert, index) => {
          // Positionner les alertes le long de l'itinéraire
          const alertIndex = Math.floor(validPoints.length * alert.position);
          const alertPoint = validPoints[alertIndex] || validPoints[0];
          
          return (
            <Marker 
              key={`weather-alert-${index}`}
              position={[alertPoint.lat, alertPoint.lng]} 
              icon={createWeatherAlertIcon(alert.severity)}
            >
              <Popup>
                <Typography variant="body2" fontWeight="bold" color="error">
                  Alerte météo: {alert.type}
                </Typography>
                <Typography variant="body2">
                  {alert.message}
                </Typography>
              </Popup>
            </Marker>
          );
        })}
        
        {/* Contrôles de la carte */}
        {showControls && (
          <>
            <ZoomControl position="bottomright" />
            <UserLocationButton />
            <Button 
              variant="contained"
              size="small"
              onClick={handleResetView}
              startIcon={<Refresh />}
              sx={{ 
                position: 'absolute', 
                top: 10, 
                right: 150, 
                zIndex: 1000,
                backgroundColor: 'white',
                color: 'rgba(0, 0, 0, 0.7)',
                '&:hover': {
                  backgroundColor: '#f5f5f5'
                }
              }}
            >
              Recentrer
            </Button>
          </>
        )}
        
        <FitBoundsControl points={validPoints} resetTrigger={resetTrigger} />
      </MapContainer>
      
      {/* Afficher les alertes météo actives sous la carte */}
      {showWeatherAlerts && weatherAlerts && weatherAlerts.length > 0 && (
        <Paper 
          elevation={2}
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            maxHeight: '30%',
            overflowY: 'auto',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            zIndex: 1000
          }}
        >
          {weatherAlerts.map((alert, index) => (
            <Alert 
              key={`alert-info-${index}`} 
              severity={
                alert.severity === 'high' ? 'error' : 
                alert.severity === 'medium' ? 'warning' : 'info'
              }
              sx={{ borderRadius: 0 }}
            >
              <Typography variant="body2" fontWeight="bold">
                {alert.type}
              </Typography>
              <Typography variant="body2">
                {alert.message}
              </Typography>
            </Alert>
          ))}
        </Paper>
      )}
    </Box>
  );
};

export default RouteMap;
