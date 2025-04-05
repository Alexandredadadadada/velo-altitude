import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  Box, 
  Typography, 
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import OpacityIcon from '@mui/icons-material/Opacity';
import AirIcon from '@mui/icons-material/Air';
import CompressIcon from '@mui/icons-material/Compress';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';

/**
 * Composant qui affiche les informations météo pour un col
 * 
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.weatherData - Données météo à afficher
 */
const WeatherInfo = memo(({ weatherData }) => {
  const { t } = useTranslation();

  if (!weatherData) return null;

  return (
    <Card elevation={2}>
      <CardHeader 
        title={t('cols.weather')}
        avatar={<WbSunnyIcon />}
        titleTypographyProps={{ variant: 'h6' }}
      />
      <CardContent>
        {/* Météo actuelle */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box sx={{ mr: 2 }}>
            <img 
              src={weatherData.current.condition.icon} 
              alt={weatherData.current.condition.text}
              style={{ width: 64, height: 64 }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/weather/unknown.svg';
              }}
            />
          </Box>
          <Box>
            <Typography variant="h4" component="div">
              {weatherData.current.temp}°C
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {weatherData.current.condition.text}
            </Typography>
          </Box>
        </Box>
        
        {/* Conditions détaillées */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <List dense disablePadding>
              {/* Humidité */}
              <ListItem>
                <ListItemIcon>
                  <OpacityIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary={t('cols.humidity')}
                  secondary={`${weatherData.current.humidity}%`}
                  primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'body1' }}
                />
              </ListItem>
              <Divider component="li" variant="inset" />
              
              {/* Vent */}
              <ListItem>
                <ListItemIcon>
                  <AirIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary={t('cols.wind')}
                  secondary={`${weatherData.current.windSpeed} km/h`}
                  primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'body1' }}
                />
              </ListItem>
            </List>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <List dense disablePadding>
              {/* Pression */}
              <ListItem>
                <ListItemIcon>
                  <CompressIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary={t('cols.pressure')}
                  secondary={`${weatherData.current.pressure} hPa`}
                  primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'body1' }}
                />
              </ListItem>
              <Divider component="li" variant="inset" />
              
              {/* Visibilité */}
              <ListItem>
                <ListItemIcon>
                  <VisibilityIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary={t('cols.visibility')}
                  secondary={`${(weatherData.current.visibility / 1000).toFixed(1)} km`}
                  primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'body1' }}
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>
        
        {/* Indice UV */}
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
          <WbSunnyOutlinedIcon color="warning" sx={{ mr: 1 }} />
          <Typography variant="subtitle2" color="text.secondary" sx={{ mr: 1 }}>
            {t('cols.uv_index')}:
          </Typography>
          <Typography variant="body1">
            {weatherData.current.uv} ({getUVDescription(weatherData.current.uv)})
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
});

/**
 * Obtient la description de l'indice UV
 * @param {number} uvIndex - Indice UV
 * @returns {string} Description de l'indice UV
 */
function getUVDescription(uvIndex) {
  if (uvIndex <= 2) return 'Faible';
  if (uvIndex <= 5) return 'Modéré';
  if (uvIndex <= 7) return 'Élevé';
  if (uvIndex <= 10) return 'Très élevé';
  return 'Extrême';
}

export default WeatherInfo;
