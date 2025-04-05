import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import { CircularProgress, Typography, Box, Alert } from '@mui/material';
import './ColWeatherMap.css';

// Fix for default marker icons in Leaflet with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Icônes personnalisées pour les conditions météo
const weatherIcons = {
  clear: L.icon({
    iconUrl: '/images/weather/sunny.png',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  }),
  clouds: L.icon({
    iconUrl: '/images/weather/cloudy.png',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  }),
  rain: L.icon({
    iconUrl: '/images/weather/rainy.png',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  }),
  snow: L.icon({
    iconUrl: '/images/weather/snowy.png',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  }),
  thunderstorm: L.icon({
    iconUrl: '/images/weather/stormy.png',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  }),
  mist: L.icon({
    iconUrl: '/images/weather/foggy.png',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  }),
  default: L.icon({
    iconUrl: '/images/weather/default.png',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  }),
};

const getWeatherIcon = (weatherCode) => {
  if (weatherCode >= 200 && weatherCode < 300) return weatherIcons.thunderstorm;
  if (weatherCode >= 300 && weatherCode < 400) return weatherIcons.rain;
  if (weatherCode >= 500 && weatherCode < 600) return weatherIcons.rain;
  if (weatherCode >= 600 && weatherCode < 700) return weatherIcons.snow;
  if (weatherCode >= 700 && weatherCode < 800) return weatherIcons.mist;
  if (weatherCode === 800) return weatherIcons.clear;
  if (weatherCode > 800) return weatherIcons.clouds;
  return weatherIcons.default;
};

const ColWeatherMap = ({ cols, selectedRegion }) => {
  const [colsWithWeather, setColsWithWeather] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchWeatherData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Filtrer les cols par région si une région est sélectionnée
        const filteredCols = selectedRegion === 'all' 
          ? cols 
          : cols.filter(col => col.region === selectedRegion);
        
        // Pour chaque col, récupérer les données météo
        const colsWithWeatherPromises = filteredCols.map(async (col) => {
          try {
            const response = await axios.get(
              `https://api.openweathermap.org/data/2.5/weather?lat=${col.coordinates.lat}&lon=${col.coordinates.lng}&units=metric&appid=${process.env.REACT_APP_OPENWEATHER_API_KEY}`
            );
            
            return {
              ...col,
              weather: {
                temp: response.data.main.temp,
                description: response.data.weather[0].description,
                windSpeed: response.data.wind.speed,
                weatherCode: response.data.weather[0].id,
                icon: response.data.weather[0].icon,
                humidity: response.data.main.humidity,
                pressure: response.data.main.pressure,
                updatedAt: new Date().toLocaleString(),
              }
            };
          } catch (error) {
            console.error(`Erreur lors de la récupération des données météo pour ${col.name}:`, error);
            return {
              ...col,
              weather: null
            };
          }
        });
        
        const resolvedColsWithWeather = await Promise.all(colsWithWeatherPromises);
        setColsWithWeather(resolvedColsWithWeather);
      } catch (error) {
        console.error('Erreur lors de la récupération des données météo:', error);
        setError('Impossible de récupérer les données météo. Veuillez réessayer plus tard.');
        setColsWithWeather(cols.map(col => ({ ...col, weather: null })));
      } finally {
        setLoading(false);
      }
    };
    
    if (cols && cols.length > 0) {
      fetchWeatherData();
    } else {
      setLoading(false);
      setColsWithWeather([]);
    }
  }, [cols, selectedRegion]);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ marginBottom: 2 }}>
        {error}
      </Alert>
    );
  }
  
  if (colsWithWeather.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Typography variant="body1">Aucun col trouvé pour la région sélectionnée.</Typography>
      </Box>
    );
  }
  
  // Trouver le centre de la carte en fonction des cols filtrés
  const getCenterCoordinates = () => {
    if (colsWithWeather.length === 0) return [46.2276, 2.2137]; // Centre de la France par défaut
    
    if (colsWithWeather.length === 1) {
      return [colsWithWeather[0].coordinates.lat, colsWithWeather[0].coordinates.lng];
    }
    
    // Calculer le centre des cols filtrés
    const sumLat = colsWithWeather.reduce((sum, col) => sum + col.coordinates.lat, 0);
    const sumLng = colsWithWeather.reduce((sum, col) => sum + col.coordinates.lng, 0);
    
    return [sumLat / colsWithWeather.length, sumLng / colsWithWeather.length];
  };
  
  return (
    <div className="col-weather-map-container">
      <Typography variant="h6" gutterBottom>
        Carte météo des cols
      </Typography>
      
      <MapContainer 
        center={getCenterCoordinates()} 
        zoom={7} 
        style={{ height: '400px', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {colsWithWeather.map((col) => (
          <Marker 
            key={col.id} 
            position={[col.coordinates.lat, col.coordinates.lng]}
            icon={col.weather ? getWeatherIcon(col.weather.weatherCode) : weatherIcons.default}
          >
            <Popup>
              <div className="col-weather-popup">
                <h3>{col.name}</h3>
                <p><strong>Altitude:</strong> {col.altitude}m</p>
                
                {col.weather ? (
                  <div className="weather-info">
                    <p><strong>Température:</strong> {Math.round(col.weather.temp)}°C</p>
                    <p><strong>Conditions:</strong> {col.weather.description}</p>
                    <p><strong>Vent:</strong> {Math.round(col.weather.windSpeed * 3.6)} km/h</p>
                    <p><strong>Humidité:</strong> {col.weather.humidity}%</p>
                    <p className="update-time">Mis à jour le: {col.weather.updatedAt}</p>
                  </div>
                ) : (
                  <p>Données météo non disponibles</p>
                )}
                
                <div className="col-actions">
                  <a href={`/cols/${col.id}`} className="view-col-link">
                    Voir les détails
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default ColWeatherMap;
