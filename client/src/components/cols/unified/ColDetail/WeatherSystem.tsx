import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid,
  CircularProgress,
  Chip,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  WbSunny as SunIcon,
  Opacity as HumidityIcon,
  Air as WindIcon,
  CalendarMonth as CalendarIcon,
  Schedule as TimeIcon,
  WaterDrop as PrecipitationIcon
} from '@mui/icons-material';
import { WeatherData } from './types';

interface WeatherSystemProps {
  data: WeatherData | null;
  loading?: boolean;
  error?: string | null;
  colName?: string;
  elevation?: number;
}

/**
 * Système météo optimisé pour les cols
 * Affiche les prévisions actuelles et à venir
 */
export const WeatherSystem: React.FC<WeatherSystemProps> = ({
  data,
  loading = false,
  error = null,
  colName,
  elevation
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [displayMode, setDisplayMode] = useState<'current' | 'forecast'>('current');
  
  // Récupération de l'icône météo adaptée
  const getWeatherIcon = (condition: string) => {
    let iconUrl = "";
    
    switch (condition.toLowerCase()) {
      case 'clear':
      case 'sunny':
        iconUrl = '/images/weather/sunny.svg';
        break;
      case 'partly cloudy':
      case 'partly_cloudy':
        iconUrl = '/images/weather/partly-cloudy.svg';
        break;
      case 'cloudy':
        iconUrl = '/images/weather/cloudy.svg';
        break;
      case 'rain':
      case 'light rain':
      case 'light_rain':
        iconUrl = '/images/weather/rain.svg';
        break;
      case 'heavy rain':
      case 'heavy_rain':
        iconUrl = '/images/weather/heavy-rain.svg';
        break;
      case 'storm':
      case 'thunderstorm':
        iconUrl = '/images/weather/storm.svg';
        break;
      case 'snow':
      case 'light snow':
      case 'light_snow':
        iconUrl = '/images/weather/snow.svg';
        break;
      case 'mist':
      case 'fog':
        iconUrl = '/images/weather/fog.svg';
        break;
      default:
        iconUrl = '/images/weather/cloudy.svg';
    }
    
    return iconUrl;
  };
  
  // Conversion de la direction du vent en texte
  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };
  
  // Calcul de la température ajustée en fonction de l'altitude
  const getAdjustedTemperature = (temp: number, baseElevation = 200, targetElevation = elevation || 1000) => {
    // Diminution moyenne de 0.65°C par 100m d'élévation
    const elevationDiff = targetElevation - baseElevation;
    const tempAdjustment = (elevationDiff / 100) * 0.65;
    return Math.round((temp - tempAdjustment) * 10) / 10;
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3} minHeight={200}>
        <CircularProgress size={40} />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box p={3} border={1} borderColor="error.main" borderRadius={1}>
        <Typography color="error" variant="body2">
          Impossible de charger les données météo: {error}
        </Typography>
      </Box>
    );
  }
  
  if (!data) {
    return (
      <Box p={3} bgcolor="grey.100" borderRadius={1}>
        <Typography variant="body2" color="textSecondary">
          Données météo non disponibles pour ce col
        </Typography>
      </Box>
    );
  }

  return (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="h3">
            Météo {colName && `du Col ${colName}`}
          </Typography>
          
          <Box>
            <Chip 
              label="Actuelle" 
              color={displayMode === 'current' ? "primary" : "default"}
              onClick={() => setDisplayMode('current')}
              size="small"
              sx={{ mr: 1 }}
            />
            <Chip 
              label="Prévisions" 
              color={displayMode === 'forecast' ? "primary" : "default"}
              onClick={() => setDisplayMode('forecast')}
              size="small"
            />
          </Box>
        </Box>
        
        {/* Affichage de la météo actuelle */}
        {displayMode === 'current' && (
          <Box>
            <Grid container spacing={2}>
              {/* Informations principales */}
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center">
                  <Box 
                    component="img" 
                    src={getWeatherIcon(data.current.condition)} 
                    alt={data.current.condition}
                    sx={{ width: 64, height: 64, mr: 2 }}
                  />
                  <Box>
                    <Typography variant="h4" component="p">
                      {getAdjustedTemperature(data.current.temp)}°C
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {data.current.condition}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              {/* Détails */}
              <Grid item xs={12} sm={6}>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Box display="flex" alignItems="center">
                    <HumidityIcon color="primary" sx={{ mr: 1, fontSize: '1.2rem' }} />
                    <Typography variant="body2">
                      Humidité: {data.current.humidity}%
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <WindIcon color="primary" sx={{ mr: 1, fontSize: '1.2rem' }} />
                    <Typography variant="body2">
                      Vent: {data.current.windSpeed} km/h {getWindDirection(data.current.windDirection)}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <PrecipitationIcon color="primary" sx={{ mr: 1, fontSize: '1.2rem' }} />
                    <Typography variant="body2">
                      Précipitations: {data.current.precipitation} mm
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
            
            {/* Message d'alerte pour conditions dangereuses */}
            {(data.current.windSpeed > 50 || data.current.precipitation > 10) && (
              <Box mt={2} p={1} bgcolor="warning.light" borderRadius={1}>
                <Typography variant="body2" color="warning.dark" fontWeight="medium">
                  Conditions potentiellement dangereuses pour la pratique du vélo.
                </Typography>
              </Box>
            )}
          </Box>
        )}
        
        {/* Affichage des prévisions */}
        {displayMode === 'forecast' && (
          <Box>
            <Grid container spacing={1}>
              {data.forecast.slice(0, isMobile ? 3 : 5).map((item, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Box 
                    p={1.5} 
                    border={1} 
                    borderColor="divider" 
                    borderRadius={1}
                    sx={{
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: 2
                      }
                    }}
                  >
                    <Box display="flex" alignItems="center" mb={1} justifyContent="space-between">
                      <Box display="flex" alignItems="center">
                        <CalendarIcon color="action" sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                        <Typography variant="caption" fontWeight="medium">
                          {item.date}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center">
                        <TimeIcon color="action" sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                        <Typography variant="caption">
                          {item.time}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box 
                        component="img" 
                        src={getWeatherIcon(item.condition)} 
                        alt={item.condition}
                        sx={{ width: 40, height: 40 }}
                      />
                      <Typography variant="h6">
                        {getAdjustedTemperature(item.temp)}°C
                      </Typography>
                    </Box>
                    
                    <Typography variant="caption" display="block" textAlign="center" mt={0.5}>
                      {item.condition}
                    </Typography>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center">
                        <WindIcon color="action" sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                        <Typography variant="caption">
                          {item.windSpeed} km/h
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center">
                        <PrecipitationIcon color="action" sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                        <Typography variant="caption">
                          {item.precipitation} mm
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
            
            <Typography variant="caption" color="textSecondary" display="block" mt={2} textAlign="right">
              Températures ajustées pour l'altitude de {elevation || 1000}m
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default WeatherSystem;
