import React from 'react';
import { useRouteDetails } from '../../hooks/useApi';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Paper, 
  Grid, 
  Divider,
  Chip,
  Stack,
  Button
} from '@mui/material';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import SpeedIcon from '@mui/icons-material/Speed';
import TerrainIcon from '@mui/icons-material/Terrain';
import TimerIcon from '@mui/icons-material/Timer';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RouteMap from '../map/RouteMap';
import ElevationProfile from '../map/ElevationProfile';

interface RouteDetailsProps {
  routeId: string;
  onGetNutritionRecommendations?: (routeId: string) => void;
  onGetEquipmentRecommendations?: (routeId: string) => void;
}

const RouteDetails: React.FC<RouteDetailsProps> = ({ 
  routeId,
  onGetNutritionRecommendations,
  onGetEquipmentRecommendations
}) => {
  const { data: route, loading, error } = useRouteDetails(routeId);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
        <Typography variant="body1" ml={2}>
          Chargement des détails de l'itinéraire...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4} color="error.main">
        <ErrorOutlineIcon />
        <Typography variant="body1" ml={2}>
          Erreur lors du chargement de l'itinéraire: {error.message}
        </Typography>
      </Box>
    );
  }

  if (!route) {
    return (
      <Box p={4}>
        <Typography variant="body1">
          Aucune donnée d'itinéraire disponible.
        </Typography>
      </Box>
    );
  }

  const startWeather = route.weather?.start;
  const statistics = route.statistics;

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        {route.name || 'Itinéraire sans nom'}
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {/* Ajout de la carte interactive */}
      <Box mb={4}>
        <RouteMap routeId={routeId} height={400} />
      </Box>
      
      {/* Ajout du profil d'élévation */}
      <Box mb={4}>
        <ElevationProfile routeId={routeId} height={250} />
      </Box>

      <Grid container spacing={4}>
        {/* Informations principales de l'itinéraire */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Détails du parcours
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box display="flex" alignItems="center">
                  <TerrainIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Distance
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {statistics?.distance ? `${statistics.distance.toFixed(1)} km` : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={6}>
                <Box display="flex" alignItems="center">
                  <SpeedIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Dénivelé positif
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {statistics?.elevationGain ? `${Math.round(statistics.elevationGain)} m` : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={6}>
                <Box display="flex" alignItems="center">
                  <TimerIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Temps estimé
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {statistics?.distance 
                        ? `${Math.round(statistics.distance * 4)} min` // Estimation basique: 15 km/h
                        : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={6}>
                <Box display="flex" alignItems="center">
                  <TerrainIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Pente moyenne
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {statistics?.grade ? `${statistics.grade.toFixed(1)}%` : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Points d'élévation clés
          </Typography>
          
          <Stack spacing={1}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">Point de départ</Typography>
              <Chip 
                label={`${statistics?.lowestPoint ? Math.round(statistics.lowestPoint) : '?'} m`} 
                size="small" 
                color="primary" 
                variant="outlined" 
              />
            </Box>
            
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">Altitude maximale</Typography>
              <Chip 
                label={`${statistics?.highestPoint ? Math.round(statistics.highestPoint) : '?'} m`} 
                size="small" 
                color="secondary" 
              />
            </Box>
            
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">Gain d'élévation</Typography>
              <Chip 
                label={`${statistics?.elevationGain ? Math.round(statistics.elevationGain) : '?'} m`} 
                size="small" 
                color="success" 
              />
            </Box>
          </Stack>
        </Grid>
        
        {/* Informations météo et recommendations */}
        <Grid item xs={12} md={6}>
          {startWeather && (
            <Box mb={4}>
              <Typography variant="h6" gutterBottom>
                Conditions météo au départ
              </Typography>
              
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  bgcolor: 'background.paper', 
                  borderRadius: 2,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Box display="flex" alignItems="center" mb={2}>
                  <img 
                    src={`https://openweathermap.org/img/wn/${startWeather.weather[0].icon}@2x.png`}
                    alt={startWeather.weather[0].description}
                    width={64}
                    height={64}
                  />
                  <Box ml={1}>
                    <Typography variant="h6">
                      {Math.round(startWeather.main.temp)}°C
                    </Typography>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {startWeather.weather[0].description}
                    </Typography>
                  </Box>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center">
                      <ThermostatIcon sx={{ mr: 1, color: 'info.main', fontSize: '1rem' }} />
                      <Typography variant="body2">
                        Ressenti: {Math.round(startWeather.main.feels_like)}°C
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center">
                      <WaterDropIcon sx={{ mr: 1, color: 'info.main', fontSize: '1rem' }} />
                      <Typography variant="body2">
                        Humidité: {startWeather.main.humidity}%
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}
          
          <Box display="flex" flexDirection="column" gap={2} mt={4}>
            <Typography variant="h6" gutterBottom>
              Recommandations personnalisées
            </Typography>
            
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => onGetNutritionRecommendations && onGetNutritionRecommendations(routeId)}
              fullWidth
            >
              Recommandations nutritionnelles
            </Button>
            
            <Button 
              variant="contained" 
              color="secondary"
              onClick={() => onGetEquipmentRecommendations && onGetEquipmentRecommendations(routeId)}
              fullWidth
            >
              Recommandations d'équipement
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default RouteDetails;
