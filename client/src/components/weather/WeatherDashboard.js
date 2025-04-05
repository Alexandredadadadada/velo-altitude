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

// Liste des régions cyclables principales
const CYCLING_REGIONS = [
  { id: 'alpes', name: 'Alpes', coordinates: [45.9, 6.9] },
  { id: 'pyrenees', name: 'Pyrénées', coordinates: [42.9, 0.7] },
  { id: 'jura', name: 'Jura', coordinates: [46.6, 6.0] },
  { id: 'vosges', name: 'Vosges', coordinates: [48.1, 7.1] },
  { id: 'massif-central', name: 'Massif Central', coordinates: [45.4, 2.7] },
  { id: 'corse', name: 'Corse', coordinates: [42.2, 9.1] },
  { id: 'provence', name: 'Provence', coordinates: [43.9, 6.0] },
  { id: 'normandie', name: 'Normandie', coordinates: [49.2, 0.3] },
  { id: 'bretagne', name: 'Bretagne', coordinates: [48.2, -3.0] },
  { id: 'belgique', name: 'Ardennes Belges', coordinates: [50.3, 5.7] },
  { id: 'dolomites', name: 'Dolomites', coordinates: [46.4, 11.9] },
  { id: 'alpes-suisses', name: 'Alpes Suisses', coordinates: [46.8, 8.2] }
];

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('current');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('alpes'); // Région par défaut
  
  // Effet pour charger les données météo basées sur la région sélectionnée si aucun itinéraire n'est fourni
  useEffect(() => {
    if (!routeData && selectedRegion) {
      const region = CYCLING_REGIONS.find(r => r.id === selectedRegion);
      if (region) {
        setLoading(true);
        
        // Simuler un itinéraire dans cette région
        const simulatedRoute = {
          coordinates: [
            [region.coordinates[0] - 0.2, region.coordinates[1] - 0.2],
            [region.coordinates[0], region.coordinates[1]],
            [region.coordinates[0] + 0.2, region.coordinates[1] + 0.2],
          ]
        };
        
        // Appeler l'API météo avec les coordonnées de la région
        weatherService.getWeatherForCoordinates(region.coordinates[0], region.coordinates[1])
          .then(data => {
            setWeatherData(data);
            // Générer des points météo fictifs autour des coordonnées de la région
            const points = [
              { ...data, lat: region.coordinates[0] - 0.2, lon: region.coordinates[1] - 0.2 },
              { ...data, lat: region.coordinates[0], lon: region.coordinates[1] },
              { ...data, lat: region.coordinates[0] + 0.2, lon: region.coordinates[1] + 0.2 }
            ];
            setWeatherPoints(points);
            setAlerts(generateWeatherAlerts(points));
            setWindData(processWindData(points, simulatedRoute.coordinates.map((c, i) => ({ elevation: 800 + i * 100, distance: i * 5 }))));
            setLoading(false);
          })
          .catch(err => {
            console.error('Erreur lors du chargement des données météo:', err);
            setError(t('weatherDataError'));
            setLoading(false);
          });
      }
    }
  }, [selectedRegion, routeData, t]);

  // Rendu lorsqu'aucune donnée d'itinéraire n'est disponible
  if (!routeData && !loading) {
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
            {t('weatherDashboard')}: {CYCLING_REGIONS.find(r => r.id === selectedRegion)?.name || t('regionSelector')}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="region-select-label">{t('region')}</InputLabel>
              <Select
                labelId="region-select-label"
                id="region-select"
                value={selectedRegion}
                label={t('region')}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                {CYCLING_REGIONS.map((region) => (
                  <MenuItem key={region.id} value={region.id}>
                    {region.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
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
        </Box>
        
        {weatherData && <WeatherAlerts alerts={alerts} />}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : weatherData ? (
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
                  center={CYCLING_REGIONS.find(r => r.id === selectedRegion)?.coordinates || [46.2, 2.2]}
                  zoom={9}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* Weather markers */}
                  <WeatherMarkers weatherPoints={weatherPoints} />
                  
                </MapContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <EquipmentRecommendations weatherData={weatherData} />
            </Grid>
          </Grid>
        ) : (
          <Alert severity="info" sx={{ mt: 2 }}>
            {t('selectRegionPrompt')}
          </Alert>
        )}
        
        {weatherData && selectedTimeframe === 'current' && (
          <Box sx={{ mt: 4 }}>
            <RegionalWeatherHighlights 
              region={CYCLING_REGIONS.find(r => r.id === selectedRegion)}
              weatherData={weatherData}
            />
          </Box>
        )}
        
        {weatherData && selectedTimeframe === 'forecast' && (
          <Box sx={{ mt: 4 }}>
            <DailyForecast
              region={CYCLING_REGIONS.find(r => r.id === selectedRegion)}
              currentWeather={weatherData}
            />
          </Box>
        )}
        
        {weatherData && selectedTimeframe === 'week' && (
          <Box sx={{ mt: 4 }}>
            <WeeklyForecast
              region={CYCLING_REGIONS.find(r => r.id === selectedRegion)}
            />
          </Box>
        )}
      </Paper>
    );
  }
  
  // ... Reste du code ...
};

// Affichage des points forts de la météo régionale
const RegionalWeatherHighlights = ({ region, weatherData }) => {
  const { t } = useTranslation();
  
  if (!weatherData) return null;
  
  const condition = weatherData.weather?.[0]?.main || 'Clouds';
  const icon = getWeatherIcon(condition);
  
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {t('weatherHighlightsFor')} {region?.name}
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card sx={{ display: 'flex', height: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, p: 2 }}>
              <Typography variant="h5" component="div">
                {weatherData.main.temp.toFixed(1)}°C
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('feelsLike')} {weatherData.main.feels_like.toFixed(1)}°C
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {weatherData.weather[0].description}
              </Typography>
              <Box sx={{ mt: 'auto' }}>
                <Chip 
                  icon={<UmbrellaIcon />} 
                  label={`${(weatherData.rain?.['1h'] || 0).toFixed(1)} mm`} 
                  size="small" 
                  sx={{ mr: 1 }} 
                />
                <Chip 
                  icon={<AirIcon />} 
                  label={`${weatherData.wind.speed.toFixed(1)} km/h`} 
                  size="small" 
                />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
              {icon}
            </Box>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('cyclingConditions')}
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">{t('temperature')}</Typography>
                <Chip 
                  label={weatherService.getTemperatureRating(weatherData.main.temp)} 
                  size="small" 
                  color={
                    weatherData.main.temp < 5 ? 'error' : 
                    weatherData.main.temp < 10 ? 'warning' : 
                    weatherData.main.temp > 28 ? 'warning' : 'success'
                  } 
                />
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">{t('wind')}</Typography>
                <Chip 
                  label={weatherService.getWindRating(weatherData.wind.speed)} 
                  size="small" 
                  color={
                    weatherData.wind.speed > 30 ? 'error' : 
                    weatherData.wind.speed > 20 ? 'warning' : 'success'
                  } 
                />
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">{t('precipitation')}</Typography>
                <Chip 
                  label={weatherService.getPrecipitationRating(weatherData.rain?.['1h'] || 0)} 
                  size="small" 
                  color={
                    (weatherData.rain?.['1h'] || 0) > 5 ? 'error' : 
                    (weatherData.rain?.['1h'] || 0) > 2 ? 'warning' : 'success'
                  } 
                />
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">{t('overall')}</Typography>
                <Chip 
                  label={weatherService.getOverallRating(weatherData)} 
                  size="small" 
                  color={weatherService.getOverallRatingColor(weatherData)} 
                />
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};

// Composant de prévision quotidienne
const DailyForecast = ({ region, currentWeather }) => {
  const { t } = useTranslation();
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulation des données de prévision pour les 24 prochaines heures
    const simulatedForecast = Array.from({ length: 8 }).map((_, index) => {
      const hour = new Date();
      hour.setHours(hour.getHours() + index * 3);
      
      // Variation aléatoire basée sur les conditions actuelles
      const tempVariation = Math.random() * 5 - 2.5;
      const windVariation = Math.random() * 5 - 2.5;
      const precipProbability = Math.random();
      
      return {
        dt: hour.getTime() / 1000,
        main: {
          temp: currentWeather.main.temp + tempVariation,
          feels_like: currentWeather.main.feels_like + tempVariation,
          humidity: currentWeather.main.humidity + (Math.random() * 10 - 5)
        },
        weather: [{ ...currentWeather.weather[0] }],
        wind: {
          speed: currentWeather.wind.speed + windVariation,
          deg: (currentWeather.wind.deg + (Math.random() * 40 - 20)) % 360
        },
        pop: precipProbability,
        rain: precipProbability > 0.7 ? { '3h': Math.random() * 3 } : null
      };
    });
    
    setForecast(simulatedForecast);
    setLoading(false);
  }, [currentWeather]);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {t('forecast24hFor')} {region?.name}
      </Typography>
      
      <Grid container spacing={1}>
        {forecast.map((item, index) => {
          const date = new Date(item.dt * 1000);
          const hour = date.getHours();
          const condition = item.weather[0].main;
          const icon = getWeatherIcon(condition);
          
          return (
            <Grid item key={index} xs={6} sm={3} md={1.5}>
              <Card sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="body2">
                  {hour < 10 ? `0${hour}` : hour}:00
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                  {React.cloneElement(icon, { fontSize: 'small' })}
                </Box>
                <Typography variant="h6">
                  {item.main.temp.toFixed(0)}°
                </Typography>
                <Typography variant="caption" display="block">
                  {item.wind.speed.toFixed(0)} km/h
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                  {(item.pop * 100).toFixed(0)}%
                </Typography>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
};

// Composant de prévision hebdomadaire
const WeeklyForecast = ({ region }) => {
  const { t } = useTranslation();
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulation des données de prévision pour les 7 prochains jours
    const simulatedForecast = Array.from({ length: 7 }).map((_, index) => {
      const day = new Date();
      day.setDate(day.getDate() + index);
      
      // Générer des conditions météo aléatoires mais réalistes
      const temp = 15 + Math.random() * 10 - 5;
      const windSpeed = 5 + Math.random() * 15;
      const conditions = ['Clear', 'Clouds', 'Rain', 'Thunderstorm'];
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      
      return {
        dt: day.getTime() / 1000,
        temp: {
          min: temp - 5,
          max: temp + 5
        },
        weather: [{
          main: condition,
          description: condition + ' description'
        }],
        wind_speed: windSpeed,
        pop: Math.random()
      };
    });
    
    setForecast(simulatedForecast);
    setLoading(false);
  }, [region]);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  const weekdays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {t('weekForecastFor')} {region?.name}
      </Typography>
      
      <Grid container spacing={2}>
        {forecast.map((item, index) => {
          const date = new Date(item.dt * 1000);
          const dayOfWeek = weekdays[date.getDay()];
          const dayOfMonth = date.getDate();
          const condition = item.weather[0].main;
          const icon = getWeatherIcon(condition);
          
          return (
            <Grid item key={index} xs={12} sm={6} md={3} lg={true}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {dayOfWeek} {dayOfMonth}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {React.cloneElement(icon, { sx: { mr: 1.5 } })}
                    <Typography variant="body1">
                      {item.weather[0].description}
                    </Typography>
                  </Box>
                  
                  <Typography variant="h5" sx={{ mb: 1 }}>
                    {item.temp.max.toFixed(0)}° / {item.temp.min.toFixed(0)}°
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Chip 
                      icon={<AirIcon />} 
                      label={`${item.wind_speed.toFixed(0)} km/h`} 
                      size="small" 
                    />
                    <Chip 
                      icon={<UmbrellaIcon />} 
                      label={`${(item.pop * 100).toFixed(0)}%`} 
                      size="small" 
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
};

WeatherDashboard.propTypes = {
  routeId: PropTypes.string.isRequired,
  routeData: PropTypes.object
};

export default WeatherDashboard;
