import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import WindVisualization from './WindVisualization';
import { weatherService } from '../../services/weather.service';
import 'leaflet/dist/leaflet.css';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardHeader,
  CardContent,
  Button,
  ButtonGroup,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Chip,
  Stack
} from '@mui/material';
import { styled } from '@mui/material/styles';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import WaterIcon from '@mui/icons-material/Water';
import CloudIcon from '@mui/icons-material/Cloud';
import WarningIcon from '@mui/icons-material/Warning';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import UmbrellaIcon from '@mui/icons-material/Umbrella';
import AirIcon from '@mui/icons-material/Air';
import WindPowerIcon from '@mui/icons-material/WindPower';

// Component styling
const StyledPopup = styled(Popup)(({ theme, severity }) => {
  const bgColors = {
    good: theme.palette.success.light,
    moderate: theme.palette.info.light,
    warning: theme.palette.warning.light,
    critical: theme.palette.error.light,
  };
  
  return {
    '& .leaflet-popup-content-wrapper': {
      backgroundColor: bgColors[severity] || theme.palette.background.paper,
      borderRadius: theme.shape.borderRadius,
      boxShadow: theme.shadows[2],
    },
    '& .leaflet-popup-tip': {
      backgroundColor: bgColors[severity] || theme.palette.background.paper,
    }
  };
});

const EquipmentCategory = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  height: '100%',
}));

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
        <StyledPopup severity={severity}>
          <Box sx={{ minWidth: 180 }}>
            <Typography variant="h6" gutterBottom>{condition}</Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 'bold',
                color: temperatureClass === 'cold' ? 'info.main' : 
                       temperatureClass === 'hot' ? 'error.main' : 'text.primary',
                mb: 1
              }}
            >
              {Math.round(point.main.temp)}°C
            </Typography>
            
            <List dense disablePadding>
              <ListItem sx={{ p: 0 }}>
                <ListItemIcon sx={{ minWidth: 30 }}>
                  <AirIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={`${t('wind')}: ${point.wind.speed} km/h`}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              
              <ListItem sx={{ p: 0 }}>
                <ListItemIcon sx={{ minWidth: 30 }}>
                  <WaterIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={`${t('humidity')}: ${point.main.humidity}%`}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              
              {point.rain && (
                <ListItem sx={{ p: 0 }}>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <UmbrellaIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`${t('rain')}: ${point.rain['1h']} mm`}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              )}
            </List>
            
            <Chip 
              label={`${t('cyclingCondition')}: ${t(severity)}`}
              size="small"
              sx={{ 
                mt: 1, 
                fontWeight: 'bold',
                bgcolor: severity === 'good' ? 'success.light' :
                         severity === 'moderate' ? 'info.light' :
                         severity === 'warning' ? 'warning.light' : 'error.light',
              }}
            />
          </Box>
        </StyledPopup>
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
    clothing: <ThermostatIcon />,
    accessories: <WbSunnyIcon />,
    bike: <WindPowerIcon />,
    nutrition: <WaterIcon />,
    safety: <WarningIcon />
  };
  
  return (
    <Card>
      <CardHeader 
        title={<Typography variant="h6">{t('recommendedEquipment')}</Typography>}
      />
      <CardContent>
        <Grid container spacing={2}>
          {Object.entries(recommendations).map(([category, items]) => {
            if (!items.length) return null;
            
            return (
              <Grid item xs={12} md={6} key={category}>
                <EquipmentCategory variant="outlined">
                  <CardHeader
                    avatar={categoryIcons[category]}
                    title={t(category)}
                    titleTypographyProps={{ variant: 'subtitle1' }}
                    sx={{ pb: 0 }}
                  />
                  <CardContent sx={{ pt: 1 }}>
                    <List dense>
                      {items.map((item, index) => (
                        <ListItem key={index} sx={{ py: 0 }}>
                          <ListItemText primary={t(item)} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </EquipmentCategory>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
};

// Component to show weather alerts
const WeatherAlerts = ({ alerts, severity }) => {
  const { t } = useTranslation();
  
  if (!alerts?.length) return null;
  
  return (
    <Box sx={{ mb: 2 }}>
      {alerts.map((alert, index) => (
        <Alert
          key={index}
          severity={alert.severity === 'critical' ? 'error' : 'warning'}
          variant="filled"
          sx={{ mb: 1 }}
          action={
            <Button color="inherit" size="small">
              {t('details')}
            </Button>
          }
        >
          <Typography variant="subtitle1" fontWeight="bold">
            {alert.title}
          </Typography>
          <Typography variant="body2">
            {alert.description}
          </Typography>
        </Alert>
      ))}
    </Box>
  );
};

// Main Weather Dashboard component
const WeatherDashboard = ({ routeId, routeData }) => {
  const { t, i18n } = useTranslation();
  const [weatherData, setWeatherData] = useState(null);
  const [weatherPoints, setWeatherPoints] = useState([]);
  const [windData, setWindData] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('current');
  
  // Convert route coordinates to format needed for weather service
  const prepareRoutePoints = (route) => {
    if (!route?.coordinates?.length) return [];
    
    // Take points at regular intervals to get weather data
    const points = [];
    const step = Math.max(1, Math.floor(route.coordinates.length / 5)); // 5 points max
    
    for (let i = 0; i < route.coordinates.length; i += step) {
      if (points.length < 5) { // Limit to 5 points to avoid API overuse
        points.push({ lat: route.coordinates[i][0], lon: route.coordinates[i][1] });
      }
    }
    
    return points;
  };
  
  // Process weather data into wind visualization data
  const processWindData = (weatherPoints, elevationData) => {
    if (!weatherPoints?.length || !elevationData) return [];
    
    const windData = [];
    const width = elevationData.width || 10;
    const maxDistance = width;
    
    // For each weather point, create wind data
    for (let i = 0; i < weatherPoints.length; i++) {
      const point = weatherPoints[i];
      if (!point.wind) continue;
      
      // Position on the 3D grid (simplified for example)
      const x = (i % 3) * (maxDistance / 3) - maxDistance / 2;
      const z = Math.floor(i / 3) * (maxDistance / 3) - maxDistance / 2;
      
      // Find elevation at this point
      let elevation = 0;
      if (elevationData.heights && elevationData.heights[0]) {
        // Just get a random elevation from the data for demonstration
        const randomIndex = Math.floor(Math.random() * elevationData.heights.length);
        if (elevationData.heights[randomIndex].length > 0) {
          elevation = elevationData.heights[randomIndex][0] || 0;
        }
      }
      
      windData.push({
        x,
        z,
        elevation,
        speed: point.wind.speed,
        direction: point.wind.deg || 0,
        gusts: point.wind.gust || point.wind.speed * 1.3
      });
    }
    
    return windData;
  };
  
  // Generate alerts based on weather conditions
  const generateWeatherAlerts = (weatherPoints) => {
    if (!weatherPoints?.length) return [];
    
    const alerts = [];
    
    // Check for extreme temperatures
    const temps = weatherPoints.map(p => p.main.temp);
    const maxTemp = Math.max(...temps);
    const minTemp = Math.min(...temps);
    
    // Cold alert
    if (minTemp < 3) {
      alerts.push({
        severity: minTemp < 0 ? 'critical' : 'warning',
        title: t('coldTemperatureAlert'),
        description: t('coldTemperatureDescription', { temperature: Math.round(minTemp) }),
        type: 'temperature'
      });
    }
    
    // Heat alert
    if (maxTemp > 30) {
      alerts.push({
        severity: maxTemp > 35 ? 'critical' : 'warning',
        title: t('heatAlert'),
        description: t('heatAlertDescription', { temperature: Math.round(maxTemp) }),
        type: 'temperature'
      });
    }
    
    // Check for precipitation
    const hasHeavyRain = weatherPoints.some(point => 
      point.rain && point.rain['1h'] && point.rain['1h'] > 5);
    
    if (hasHeavyRain) {
      alerts.push({
        severity: 'warning',
        title: t('heavyRainAlert'),
        description: t('heavyRainDescription'),
        type: 'precipitation'
      });
    }
    
    // Check for strong winds
    const hasStrongWind = weatherPoints.some(point => 
      point.wind && point.wind.speed > 30);
    
    if (hasStrongWind) {
      alerts.push({
        severity: 'critical',
        title: t('strongWindAlert'),
        description: t('strongWindDescription'),
        type: 'wind'
      });
    }
    
    // Check for thunderstorms
    const hasThunderstorm = weatherPoints.some(point => 
      point.weather && point.weather.some(w => w.main === 'Thunderstorm'));
    
    if (hasThunderstorm) {
      alerts.push({
        severity: 'critical',
        title: t('thunderstormAlert'),
        description: t('thunderstormDescription'),
        type: 'storm'
      });
    }
    
    // Determine if a combination of factors creates a hazardous condition
    const hasModeratePrecipitation = weatherPoints.some(point => 
      point.rain && point.rain['1h'] && point.rain['1h'] > 2);
    
    const hasModerateWind = weatherPoints.some(point => 
      point.wind && point.wind.speed > 20);
    
    if (hasModeratePrecipitation && hasModerateWind) {
      alerts.push({
        severity: 'warning',
        title: t('hazardousConditionsAlert'),
        description: t('hazardousConditionsDescription'),
        type: 'combined'
      });
    }
    
    return alerts;
  };
  
  useEffect(() => {
    setLoading(true);
    
    // Fetch weather data for the route
    const fetchWeatherForRoute = async () => {
      try {
        if (!routeData?.mainRoute?.coordinates) {
          setLoading(false);
          return;
        }
        
        // Prepare points along the route
        const routePoints = prepareRoutePoints(routeData.mainRoute);
        
        if (!routePoints.length) {
          setLoading(false);
          return;
        }
        
        // Current location (first point of the route)
        setCurrentLocation(routePoints[0]);
        
        // Fetch weather data for each point
        const weatherResponses = await Promise.all(
          routePoints.map(point => 
            weatherService.getCurrentWeather(point.lat, point.lon)
          )
        );
        
        // Combine weather data with coordinates
        const weatherWithCoords = weatherResponses.map((weather, index) => ({
          ...weather,
          lat: routePoints[index].lat,
          lon: routePoints[index].lon
        }));
        
        // Store main weather data (first point or average)
        setWeatherData(weatherWithCoords[0]);
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
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: 200,
          width: '100%'
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          {t('loadingWeatherData')}
        </Typography>
      </Box>
    );
  }
  
  // Error state - no route data
  if (!routeData) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        <Typography variant="subtitle1">
          {t('noRouteDataAvailable')}
        </Typography>
      </Alert>
    );
  }
  
  const getWeatherIcon = (condition) => {
    switch(condition) {
      case 'Clear': return <WbSunnyIcon fontSize="large" />;
      case 'Clouds': return <CloudIcon fontSize="large" />;
      case 'Rain': case 'Drizzle': return <WaterIcon fontSize="large" />;
      case 'Thunderstorm': return <ThunderstormIcon fontSize="large" />;
      case 'Snow': return <AcUnitIcon fontSize="large" />;
      default: return <CloudIcon fontSize="large" />;
    }
  };
  
  return (
    <Paper 
      elevation={2} 
      sx={{ p: 3, mb: 4 }}
      component="section"
      aria-labelledby="weather-dashboard-title"
    >
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          mb: 2
        }}
      >
        <Typography variant="h5" component="h2" id="weather-dashboard-title">
          {t('weatherDashboard')}: {routeData.name}
        </Typography>
        
        <ButtonGroup variant="outlined" size="small" aria-label={t('timeframeSelector')}>
          <Button 
            onClick={() => setSelectedTimeframe('current')}
            variant={selectedTimeframe === 'current' ? 'contained' : 'outlined'}
            aria-pressed={selectedTimeframe === 'current'}
          >
            {t('currentConditions')}
          </Button>
          <Button
            onClick={() => setSelectedTimeframe('forecast')}
            variant={selectedTimeframe === 'forecast' ? 'contained' : 'outlined'}
            aria-pressed={selectedTimeframe === 'forecast'}
          >
            {t('forecast24h')}
          </Button>
          <Button
            onClick={() => setSelectedTimeframe('week')}
            variant={selectedTimeframe === 'week' ? 'contained' : 'outlined'}
            aria-pressed={selectedTimeframe === 'week'}
          >
            {t('weekForecast')}
          </Button>
        </ButtonGroup>
      </Box>
      
      <WeatherAlerts alerts={alerts} />
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={0} 
            variant="outlined" 
            sx={{ height: 400, overflow: 'hidden' }}
            aria-label={t('weatherMap')}
          >
            <MapContainer 
              style={{ height: '100%', width: '100%' }}
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
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <EquipmentRecommendations weatherData={weatherData} />
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 4 }}>
        <WindVisualization 
          passId={routeId}
          elevationData={routeData.elevationData}
          windData={windData}
          currentLocation={currentLocation}
        />
      </Box>
      
      {/*
        Note: Forecast views (24h, week) would be implemented here
        but are conditionally shown based on selectedTimeframe
      */}
      
    </Paper>
  );
};

WeatherDashboard.propTypes = {
  routeId: PropTypes.string.isRequired,
  routeData: PropTypes.object
};

export default WeatherDashboard;
