import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import WindVisualization from './WindVisualization';
import { weatherService } from '../../services/weather.service';
import 'leaflet/dist/leaflet.css';

// Helper component to set map view based on route
const MapViewSetter = ({ route }) => {
  const map = useMap();
  
  useEffect(() => {
    if (route?.coordinates?.length) {
      const bounds = L.latLngBounds(
        route.coordinates.map(coord => [coord[0], coord[1]])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, route]);
  
  return null;
};

// Component to display weather markers along a route
const WeatherMarkers = ({ weatherPoints }) => {
  const { t } = useTranslation();
  
  if (!weatherPoints?.length) return null;
  
  // Custom weather icon based on condition
  const getWeatherIcon = (condition) => {
    // Define icon URLs for different conditions
    const iconMap = {
      'Clear': 'sun.png',
      'Clouds': 'cloud.png',
      'Rain': 'rain.png',
      'Drizzle': 'drizzle.png',
      'Thunderstorm': 'storm.png',
      'Snow': 'snow.png',
      'Mist': 'mist.png',
      'Fog': 'fog.png'
    };
    
    const iconUrl = `/images/icons/weather/${iconMap[condition] || 'default.png'}`;
    
    return L.icon({
      iconUrl,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });
  };
  
  return weatherPoints.map((point, index) => {
    const condition = point.weather?.[0]?.main || 'Clouds';
    const icon = getWeatherIcon(condition);
    const severity = weatherService.getCyclingConditionSeverity(point);
    const temperatureClass = 
      point.main.temp < 5 ? 'cold' :
      point.main.temp > 28 ? 'hot' : 'neutral';
    
    return (
      <Marker 
        key={`weather-${index}`}
        position={[point.lat, point.lon]} 
        icon={icon}
      >
        <Popup className={`weather-popup ${severity}`}>
          <div className="weather-popup-content">
            <h4>{condition}</h4>
            <div className={`temperature ${temperatureClass}`}>
              {Math.round(point.main.temp)}°C
            </div>
            <div className="weather-details">
              <div>{t('wind')}: {point.wind.speed} km/h</div>
              <div>{t('humidity')}: {point.main.humidity}%</div>
              {point.rain && <div>{t('rain')}: {point.rain['1h']} mm</div>}
            </div>
            <div className={`condition-severity ${severity}`}>
              {t('cyclingCondition')}: {t(severity)}
            </div>
          </div>
        </Popup>
      </Marker>
    );
  });
};

// Component to show equipment recommendations
const EquipmentRecommendations = ({ weatherData }) => {
  const { t } = useTranslation();
  
  if (!weatherData) return null;
  
  const recommendations = weatherService.getEquipmentRecommendations(weatherData);
  
  const categoryIcons = {
    clothing: 'shirt',
    accessories: 'glasses',
    bike: 'bicycle',
    nutrition: 'apple',
    safety: 'shield'
  };
  
  return (
    <div className="equipment-recommendations">
      <h3>{t('recommendedEquipment')}</h3>
      
      {Object.entries(recommendations).map(([category, items]) => {
        if (!items.length) return null;
        
        return (
          <div key={category} className="recommendation-category">
            <h4>
              <i className={`fas fa-${categoryIcons[category]}`}></i>
              {t(category)}
            </h4>
            <ul>
              {items.map((item, index) => (
                <li key={index}>{t(item)}</li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
};

// Component to show weather alerts
const WeatherAlerts = ({ alerts, severity }) => {
  const { t } = useTranslation();
  
  if (!alerts?.length) return null;
  
  return (
    <div className={`weather-alerts ${severity || 'moderate'}`}>
      <h3>{t('weatherAlerts')}</h3>
      <ul>
        {alerts.map((alert, index) => (
          <li key={index} className={alert.severity}>
            <span className="alert-icon">
              <i className={`fas fa-exclamation-${alert.severity === 'critical' ? 'triangle' : 'circle'}`}></i>
            </span>
            <span className="alert-message">{t(alert.key, alert.params)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Main Weather Dashboard component
const WeatherDashboard = ({ routeId, routeData }) => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherPoints, setWeatherPoints] = useState([]);
  const [windData, setWindData] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('current');
  
  // Convert route coordinates to format needed for weather service
  const prepareRoutePoints = (route) => {
    if (!route?.coordinates?.length) return [];
    
    return route.coordinates.map(coord => ({
      lat: coord[0],
      lng: coord[1]
    }));
  };
  
  // Process weather data into wind visualization data
  const processWindData = (weatherPoints, elevationData) => {
    if (!weatherPoints?.length || !elevationData) return [];
    
    return weatherPoints.map((point, index) => {
      // Calculate position on the visualization terrain
      const terrainX = (index / (weatherPoints.length - 1)) * 10 - 5;
      const terrainZ = 0;
      
      // Get elevation at this point (simplified for demo)
      let elevation;
      if (elevationData.heights) {
        // Center of elevation data
        const midX = Math.floor(elevationData.width / 2);
        const midZ = elevationData.heights.length > 0 
          ? Math.floor(elevationData.heights.length / 2) 
          : 0;
        
        elevation = elevationData.heights[midZ] ? elevationData.heights[midZ][midX] || 100 : 100;
      } else {
        elevation = 100;
      }
      
      return {
        x: terrainX,
        z: terrainZ,
        elevation,
        speed: point.wind?.speed || 0,
        direction: point.wind?.deg || 0,
        gusts: point.wind?.gust || 0
      };
    });
  };
  
  // Generate alerts based on weather conditions
  const generateWeatherAlerts = (weatherPoints) => {
    if (!weatherPoints?.length) return [];
    
    const alerts = [];
    
    // Check for severe conditions across points
    weatherPoints.forEach((point, index) => {
      const severity = weatherService.getCyclingConditionSeverity(point);
      const condition = point.weather?.[0]?.main;
      
      if (severity === 'dangerous') {
        alerts.push({
          key: 'dangerousConditionsAt',
          params: { location: `km ${Math.round(index * 5)}` },
          severity: 'critical'
        });
      } else if (severity === 'difficult') {
        alerts.push({
          key: 'difficultConditionsAt',
          params: { location: `km ${Math.round(index * 5)}` },
          severity: 'warning'
        });
      }
      
      // Specific condition alerts
      if (point.wind?.speed > 30) {
        alerts.push({
          key: 'extremeWindAlert',
          params: { speed: Math.round(point.wind.speed) },
          severity: 'critical'
        });
      } else if (point.wind?.speed > 20) {
        alerts.push({
          key: 'strongWindAlert',
          params: { speed: Math.round(point.wind.speed) },
          severity: 'warning'
        });
      }
      
      if (point.rain && point.rain['1h'] > 10) {
        alerts.push({
          key: 'heavyRainAlert',
          params: { amount: point.rain['1h'] },
          severity: 'critical'
        });
      } else if (point.rain && point.rain['1h'] > 5) {
        alerts.push({
          key: 'moderateRainAlert',
          params: { amount: point.rain['1h'] },
          severity: 'warning'
        });
      }
      
      if (condition === 'Thunderstorm') {
        alerts.push({
          key: 'thunderstormAlert',
          severity: 'critical'
        });
      }
      
      if (point.main.temp > 35) {
        alerts.push({
          key: 'extremeHeatAlert',
          params: { temp: Math.round(point.main.temp) },
          severity: 'critical'
        });
      } else if (point.main.temp < 0) {
        alerts.push({
          key: 'freezingAlert',
          params: { temp: Math.round(point.main.temp) },
          severity: 'critical'
        });
      }
    });
    
    // Remove duplicate alerts
    const uniqueAlerts = [];
    const seenAlertKeys = new Set();
    
    alerts.forEach(alert => {
      const key = `${alert.key}-${alert.severity}`;
      if (!seenAlertKeys.has(key)) {
        seenAlertKeys.add(key);
        uniqueAlerts.push(alert);
      }
    });
    
    return uniqueAlerts;
  };
  
  // Load weather data
  useEffect(() => {
    const fetchWeatherForRoute = async () => {
      if (!routeData) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      try {
        // Prepare points for the weather service
        const routePoints = prepareRoutePoints(routeData.mainRoute);
        
        if (routePoints.length === 0) {
          setLoading(false);
          return;
        }
        
        // Get weather data for the route
        const routeWeather = await weatherService.getRouteWeather(
          routePoints, 
          i18n.language
        );
        
        // Add coordinates to weather data points
        const weatherWithCoords = routeWeather.map((weather, index) => ({
          ...weather,
          lat: routePoints[index].lat,
          lon: routePoints[index].lng
        }));
        
        // Set current location to the first point
        setCurrentLocation(routePoints[0]);
        
        // Process weather data
        setWeatherData(routeWeather[0]); // Use first point for general data
        setWeatherPoints(weatherWithCoords);
        
        // Generate wind data for visualization
        const windData = processWindData(
          weatherWithCoords,
          routeData.elevationData
        );
        setWindData(windData);
        
        // Generate alerts
        const weatherAlerts = generateWeatherAlerts(weatherWithCoords);
        setAlerts(weatherAlerts);
      } catch (error) {
        console.error('Error fetching weather data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWeatherForRoute();
  }, [routeData, i18n.language]);
  
  // Get route color based on surface type
  const getRouteColor = (surfaceType) => {
    switch(surfaceType) {
      case 'asphalt': return '#3388ff';
      case 'gravel': return '#ff7800';
      case 'dirt': return '#6B4226';
      default: return '#3388ff';
    }
  };
  
  // Loading state
  if (loading) {
    return <div className="weather-dashboard-loading">{t('loadingWeatherData')}</div>;
  }
  
  // Error state - no route data
  if (!routeData) {
    return <div className="weather-dashboard-error">{t('noRouteDataAvailable')}</div>;
  }
  
  return (
    <div className="weather-dashboard">
      <div className="dashboard-header">
        <h2>{t('weatherDashboard')}: {routeData.name}</h2>
        <div className="timeframe-selector">
          <button 
            className={selectedTimeframe === 'current' ? 'active' : ''}
            onClick={() => setSelectedTimeframe('current')}
          >
            {t('currentConditions')}
          </button>
          <button
            className={selectedTimeframe === 'forecast' ? 'active' : ''}
            onClick={() => setSelectedTimeframe('forecast')}
          >
            {t('forecast24h')}
          </button>
          <button
            className={selectedTimeframe === 'week' ? 'active' : ''}
            onClick={() => setSelectedTimeframe('week')}
          >
            {t('weekForecast')}
          </button>
        </div>
      </div>
      
      {alerts.length > 0 && (
        <WeatherAlerts 
          alerts={alerts} 
          severity={alerts.some(a => a.severity === 'critical') ? 'critical' : 'warning'} 
        />
      )}
      
      <div className="dashboard-content">
        <div className="weather-map-container">
          <MapContainer 
            style={{ height: '400px', width: '100%' }}
            center={[48.8566, 2.3522]}
            zoom={10}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {/* Main route polyline */}
            <Polyline 
              positions={routeData.mainRoute.coordinates}
              pathOptions={{ 
                color: getRouteColor(routeData.mainRoute.surfaceType),
                weight: 5
              }}
            />
            
            {/* Weather markers */}
            <WeatherMarkers weatherPoints={weatherPoints} />
            
            {/* Center map on route */}
            <MapViewSetter route={routeData.mainRoute} />
          </MapContainer>
        </div>
        
        <div className="dashboard-side-panel">
          {weatherData && (
            <EquipmentRecommendations weatherData={weatherData} />
          )}
        </div>
      </div>
      
      <div className="wind-visualization-panel">
        <WindVisualization 
          passId={routeId}
          elevationData={routeData.elevationData}
          windData={windData}
          currentLocation={currentLocation}
        />
      </div>
      
      {/*
        Note: Forecast views (24h, week) would be implemented here
        but are conditionally shown based on selectedTimeframe
      */}
      
    </div>
  );
};

WeatherDashboard.propTypes = {
  routeId: PropTypes.string.isRequired,
  routeData: PropTypes.object
};

export default WeatherDashboard;
