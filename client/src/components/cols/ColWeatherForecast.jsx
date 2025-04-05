import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
  useTheme,
  alpha,
  Collapse,
  IconButton,
  Button,
  Tooltip,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

// Icons
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import WaterIcon from '@mui/icons-material/Water';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import AirIcon from '@mui/icons-material/Air';
import UpdateIcon from '@mui/icons-material/Update';
import SailingIcon from '@mui/icons-material/Sailing';
import OpacityIcon from '@mui/icons-material/Opacity';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

// Utilisez directement le service météo existant
import { weatherService } from '../../services/weather.service';

/**
 * Composant de prévisions météo pour les cols, avec données sur 7 jours
 */
const ColWeatherForecast = ({ col, embedded = false }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  
  useEffect(() => {
    // Réinitialiser l'état au changement de col
    setCurrentWeather(null);
    setForecast(null);
    setLoading(true);
    setError(null);
    setActiveTab(0);
    
    if (col && col.location?.lat && col.location?.lng) {
      fetchWeatherData();
    }
  }, [col]);
  
  // Récupérer les données météo actuelles et prévisions
  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      
      // Récupérer la météo actuelle
      const currentData = await weatherService.getCurrentWeather(
        col.location.lat,
        col.location.lng,
        'fr' // langue française
      );
      setCurrentWeather(currentData);
      
      // Récupérer les prévisions sur 5 jours
      const forecastData = await weatherService.getForecast(
        col.location.lat,
        col.location.lng,
        'fr'
      );
      
      // Traiter les données de prévision pour les regrouper par jour
      const processedForecast = processForecastData(forecastData);
      setForecast(processedForecast);
      
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de la récupération des données météo:', err);
      setError('Impossible de récupérer les données météo');
      setLoading(false);
    }
  };
  
  // Fonction pour traiter les données de prévision
  const processForecastData = (data) => {
    if (!data || !data.list) return [];
    
    // Regrouper les prévisions par jour
    const dailyForecasts = {};
    
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const day = date.toISOString().split('T')[0];
      
      if (!dailyForecasts[day]) {
        dailyForecasts[day] = {
          date,
          day: date.getDate(),
          month: date.getMonth() + 1,
          weekday: new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(date),
          items: [],
          minTemp: item.main.temp_min,
          maxTemp: item.main.temp_max,
          weatherConditions: {},
          windSpeeds: [],
          precipitation: 0,
        };
      }
      
      // Mettre à jour les statistiques par jour
      dailyForecasts[day].items.push(item);
      dailyForecasts[day].minTemp = Math.min(dailyForecasts[day].minTemp, item.main.temp_min);
      dailyForecasts[day].maxTemp = Math.max(dailyForecasts[day].maxTemp, item.main.temp_max);
      
      // Compter les occurrences des conditions météo
      const condition = item.weather[0].main;
      dailyForecasts[day].weatherConditions[condition] = 
        (dailyForecasts[day].weatherConditions[condition] || 0) + 1;
      
      // Ajouter la vitesse du vent
      dailyForecasts[day].windSpeeds.push(item.wind.speed);
      
      // Ajouter les précipitations
      const rain = item.rain?.['3h'] || 0;
      const snow = item.snow?.['3h'] || 0;
      dailyForecasts[day].precipitation += rain + snow;
    });
    
    // Déterminer la condition météo dominante pour chaque jour
    Object.keys(dailyForecasts).forEach(day => {
      const conditions = dailyForecasts[day].weatherConditions;
      let dominantCondition = null;
      let maxCount = 0;
      
      // Priorité aux conditions extrêmes
      const priority = ['Thunderstorm', 'Snow', 'Rain', 'Drizzle', 'Clouds', 'Clear'];
      
      for (const condition of priority) {
        if (conditions[condition] && conditions[condition] > maxCount) {
          dominantCondition = condition;
          maxCount = conditions[condition];
        }
      }
      
      dailyForecasts[day].dominantCondition = dominantCondition;
      
      // Calculer la vitesse moyenne du vent
      const windSpeeds = dailyForecasts[day].windSpeeds;
      dailyForecasts[day].avgWindSpeed = 
        windSpeeds.reduce((sum, speed) => sum + speed, 0) / windSpeeds.length;
    });
    
    // Convertir en tableau et limiter à 7 jours
    return Object.values(dailyForecasts).slice(0, 7);
  };
  
  // Changer d'onglet
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Obtenir l'icône météo
  const getWeatherIcon = (condition, size = 'medium') => {
    switch (condition) {
      case 'Clear':
        return <WbSunnyIcon fontSize={size} sx={{ color: '#f59e0b' }} />;
      case 'Clouds':
        return <CloudIcon fontSize={size} sx={{ color: '#64748b' }} />;
      case 'Rain':
      case 'Drizzle':
        return <WaterIcon fontSize={size} sx={{ color: '#0ea5e9' }} />;
      case 'Snow':
        return <AcUnitIcon fontSize={size} sx={{ color: '#e2e8f0' }} />;
      case 'Thunderstorm':
        return <ThunderstormIcon fontSize={size} sx={{ color: '#8b5cf6' }} />;
      default:
        return <CloudIcon fontSize={size} sx={{ color: '#64748b' }} />;
    }
  };
  
  // Obtenir la couleur de la condition
  const getConditionColor = (condition) => {
    switch (condition) {
      case 'Clear': return '#f59e0b';
      case 'Clouds': return '#64748b';
      case 'Rain': case 'Drizzle': return '#0ea5e9';
      case 'Snow': return '#e2e8f0';
      case 'Thunderstorm': return '#8b5cf6';
      default: return theme.palette.text.secondary;
    }
  };
  
  // Déterminer si les conditions sont favorables pour le cyclisme
  const getCyclingConditionSeverity = (weatherData) => {
    if (!weatherData) return 'moderate';
    return weatherService.getCyclingConditionSeverity(weatherData);
  };
  
  // Obtenir la couleur de sévérité
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'good': return theme.palette.success.main;
      case 'moderate': return theme.palette.info.main;
      case 'difficult': return theme.palette.warning.main;
      case 'dangerous': return theme.palette.error.main;
      default: return theme.palette.info.main;
    }
  };
  
  // Formater la date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Générer le composant de condition actuelle
  const renderCurrentCondition = () => {
    if (!currentWeather) return null;
    
    const condition = currentWeather.weather[0].main;
    const description = currentWeather.weather[0].description;
    const temp = Math.round(currentWeather.main.temp);
    const feelsLike = Math.round(currentWeather.main.feels_like);
    const windSpeed = currentWeather.wind.speed;
    const humidity = currentWeather.main.humidity;
    const pressure = currentWeather.main.pressure;
    const severity = getCyclingConditionSeverity(currentWeather);
    const severityColor = getSeverityColor(severity);
    
    const recommendations = weatherService.getEquipmentRecommendations(currentWeather);
    
    return (
      <Box sx={{ mt: 2 }}>
        <Grid container spacing={3}>
          {/* Conditions actuelles */}
          <Grid item xs={12} md={embedded ? 12 : 6}>
            <Card elevation={0} sx={{ height: '100%', bgcolor: alpha(theme.palette.background.paper, 0.6) }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ mr: 2 }}>
                    {getWeatherIcon(condition, 'large')}
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight={600}>
                      {description.charAt(0).toUpperCase() + description.slice(1)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(currentWeather.dt)}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
                    <ThermostatIcon sx={{ color: temp > 25 ? '#ef4444' : temp < 5 ? '#3b82f6' : '#64748b', mr: 1 }} />
                    <Typography variant="h4" fontWeight={700} sx={{ mr: 1 }}>
                      {temp}°C
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      (ressenti {feelsLike}°C)
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
                    <AirIcon sx={{ mr: 1, color: windSpeed > 20 ? '#ef4444' : '#64748b' }} />
                    <Typography variant="body1" fontWeight={500}>
                      {windSpeed} m/s
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <OpacityIcon sx={{ mr: 1, color: humidity > 80 ? '#3b82f6' : '#64748b' }} />
                    <Typography variant="body1" fontWeight={500}>
                      {humidity}%
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ mt: 3 }}>
                  <Chip 
                    icon={<DirectionsBikeIcon />} 
                    label={t(`cycling.conditions.${severity}`)}
                    sx={{ 
                      bgcolor: alpha(severityColor, 0.1), 
                      color: severityColor,
                      fontWeight: 600,
                      borderRadius: '20px'
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Recommandations d'équipement */}
          {!embedded && (
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ height: '100%', bgcolor: alpha(theme.palette.background.paper, 0.6) }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Équipement recommandé
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {Object.entries(recommendations).map(([category, items]) => {
                      if (items.length === 0) return null;
                      
                      return (
                        <Grid item xs={12} sm={6} key={category}>
                          <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom>
                            {t(`equipment.categories.${category}`)}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {items.slice(0, 3).map((item, idx) => (
                              <Chip
                                key={idx}
                                label={t(`equipment.items.${item}`)}
                                size="small"
                                sx={{ borderRadius: '20px' }}
                              />
                            ))}
                            {items.length > 3 && (
                              <Chip 
                                label={`+${items.length - 3}`} 
                                size="small" 
                                variant="outlined"
                                sx={{ borderRadius: '20px' }}
                              />
                            )}
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                  
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                      size="small" 
                      variant="text" 
                      onClick={() => setShowDetails(!showDetails)}
                      endIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    >
                      {showDetails ? 'Moins de détails' : 'Plus de détails'}
                    </Button>
                  </Box>
                  
                  <Collapse in={showDetails}>
                    <Box sx={{ mt: 2 }}>
                      <Divider sx={{ mb: 2 }} />
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Pression
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {pressure} hPa
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Visibilité
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {currentWeather.visibility ? `${(currentWeather.visibility / 1000).toFixed(1)} km` : 'N/A'}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Lever du soleil
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {new Date(currentWeather.sys.sunrise * 1000).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Coucher du soleil
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {new Date(currentWeather.sys.sunset * 1000).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>
    );
  };
  
  // Générer le composant de prévision sur 7 jours
  const renderForecast = () => {
    if (!forecast) return null;
    
    return (
      <Box sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          {forecast.map((day, index) => {
            const severity = weatherService.getCyclingConditionSeverity({
              weather: [{ main: day.dominantCondition }],
              main: { temp: (day.minTemp + day.maxTemp) / 2 },
              wind: { speed: day.avgWindSpeed }
            });
            
            return (
              <Grid item xs={6} sm={embedded ? 4 : 3} md={embedded ? 3 : 'auto'} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card 
                    elevation={0} 
                    sx={{ 
                      p: 1.5,
                      bgcolor: alpha(theme.palette.background.paper, 0.6),
                      border: '1px solid',
                      borderColor: alpha(theme.palette.divider, 0.1),
                      borderRadius: 2,
                      '&:hover': {
                        boxShadow: `0 0 0 1px ${alpha(getSeverityColor(severity), 0.5)}`,
                        bgcolor: alpha(theme.palette.background.paper, 0.8),
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
                        {day.weekday}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {day.day}/{day.month}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 1.5 }}>
                      {getWeatherIcon(day.dominantCondition, 'large')}
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="body1" fontWeight={700}>
                        {Math.round(day.maxTemp)}°
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {Math.round(day.minTemp)}°
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Tooltip title={`${day.avgWindSpeed.toFixed(1)} m/s`}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AirIcon fontSize="small" sx={{ 
                            color: day.avgWindSpeed > 20 
                              ? theme.palette.error.main
                              : day.avgWindSpeed > 10
                                ? theme.palette.warning.main
                                : theme.palette.text.secondary,
                            fontSize: '1rem',
                            mr: 0.5
                          }} />
                          <Typography variant="caption">
                            {Math.round(day.avgWindSpeed)}
                          </Typography>
                        </Box>
                      </Tooltip>
                      
                      <Tooltip title={`${day.precipitation.toFixed(1)} mm`}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <OpacityIcon fontSize="small" sx={{ 
                            color: day.precipitation > 5
                              ? theme.palette.info.main
                              : theme.palette.text.secondary,
                            fontSize: '1rem',
                            mr: 0.5
                          }} />
                          <Typography variant="caption">
                            {day.precipitation.toFixed(1)}
                          </Typography>
                        </Box>
                      </Tooltip>
                      
                      <Tooltip title={t(`cycling.conditions.${severity}`)}>
                        <Box sx={{ 
                          width: 10, 
                          height: 10, 
                          borderRadius: '50%', 
                          bgcolor: getSeverityColor(severity) 
                        }} />
                      </Tooltip>
                    </Box>
                  </Card>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };
  
  // Gérer les états de chargement et d'erreur
  if (loading) {
    return (
      <Box sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={embedded ? 30 : 40} />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ py: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography color="error" variant={embedded ? 'body2' : 'body1'}>
          {error}
        </Typography>
      </Box>
    );
  }
  
  // Si pas de données météo disponibles
  if (!currentWeather && !forecast) {
    return (
      <Box sx={{ py: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography color="text.secondary" variant={embedded ? 'body2' : 'body1'}>
          Données météo non disponibles pour ce col
        </Typography>
      </Box>
    );
  }
  
  // Mode intégré (compact)
  if (embedded) {
    return (
      <Box>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 1 
        }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Météo {col.name}
          </Typography>
          <Tooltip title="Dernière mise à jour">
            <Typography variant="caption" color="text.secondary">
              {currentWeather ? formatDate(currentWeather.dt).split('à')[0] : ''}
            </Typography>
          </Tooltip>
        </Box>
        {activeTab === 0 ? renderCurrentCondition() : renderForecast()}
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ 
              minHeight: 'auto',
              '& .MuiTab-root': {
                minHeight: '36px',
                py: 0.5
              }
            }}
          >
            <Tab label="Actuel" />
            <Tab label="7 jours" />
          </Tabs>
        </Box>
      </Box>
    );
  }
  
  // Mode standard (complet)
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        background: theme => alpha(theme.palette.background.paper, 0.7),
        backdropFilter: 'blur(10px)',
        border: '1px solid',
        borderColor: theme => alpha(theme.palette.divider, 0.1),
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3
      }}>
        <Typography variant="h5" fontWeight={600}>
          Météo {col.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Dernière mise à jour">
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <UpdateIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
              <Typography variant="body2" color="text.secondary">
                {currentWeather ? formatDate(currentWeather.dt) : 'En chargement...'}
              </Typography>
            </Box>
          </Tooltip>
          <Button
            size="small"
            variant="outlined"
            startIcon={<UpdateIcon />}
            onClick={() => fetchWeatherData()}
          >
            Actualiser
          </Button>
        </Box>
      </Box>
      
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        <Tab label="Conditions actuelles" />
        <Tab label="Prévisions 7 jours" />
      </Tabs>
      
      {activeTab === 0 ? renderCurrentCondition() : renderForecast()}
      
      {/* Note en bas de page */}
      <Box sx={{ mt: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <InfoOutlinedIcon fontSize="small" sx={{ mr: 1, opacity: 0.6 }} />
        <Typography variant="caption" color="text.secondary">
          Données fournies par OpenWeather. Les prévisions peuvent être sujettes à changement.
        </Typography>
      </Box>
    </Paper>
  );
};

ColWeatherForecast.propTypes = {
  col: PropTypes.object.isRequired,
  embedded: PropTypes.bool,
};

export default ColWeatherForecast;
