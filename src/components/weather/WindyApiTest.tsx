/**
 * Composant de test pour l'API Windy
 * 
 * Ce composant démontre l'utilisation des nouvelles fonctionnalités
 * d'intégration de l'API Windy pour les données de vent
 */

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  TextField, 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel,
  Divider,
  Card,
  CardContent,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import EnhancedWeatherService from '../../services/weather/enhanced-weather-service';
import WindAlert from './WindAlert';
import WindForecast from './WindForecast';
import { GeoLocation, WindData, WindForecast as WindForecastType } from '../../services/weather/types/wind-types';

// Emplacements prédéfinis pour les tests (cols célèbres)
const SAMPLE_LOCATIONS = [
  { name: 'Mont Ventoux', lat: 44.1741, lon: 5.2783 },
  { name: 'Col du Galibier', lat: 45.0608, lon: 6.4083 },
  { name: 'Col du Tourmalet', lat: 42.9069, lon: 0.1414 },
  { name: 'Alpe d\'Huez', lat: 45.0909, lon: 6.0694 },
  { name: 'Col de la Madeleine', lat: 45.4328, lon: 6.3064 },
  { name: 'Col d\'Izoard', lat: 44.8203, lon: 6.7347 }
];

// Types de terrain pour les recommandations
const TERRAIN_TYPES = [
  { value: 'flat', label: 'Plat' },
  { value: 'mountain_col', label: 'Col de montagne' },
  { value: 'mountain_descent', label: 'Descente de montagne' },
  { value: 'exposed_road', label: 'Route exposée' }
];

// Niveaux d'expérience pour les recommandations
const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Débutant' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'advanced', label: 'Expert' }
];

const WindyApiTest: React.FC = () => {
  const [weatherService] = useState(() => new EnhancedWeatherService());
  const [selectedLocation, setSelectedLocation] = useState<GeoLocation>(SAMPLE_LOCATIONS[0]);
  const [locationInput, setLocationInput] = useState<string>('');
  const [windData, setWindData] = useState<WindData | null>(null);
  const [forecast, setForecast] = useState<WindForecastType | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [terrainType, setTerrainType] = useState<'flat' | 'mountain_col' | 'mountain_descent' | 'exposed_road'>('mountain_col');
  const [safetyRecommendation, setSafetyRecommendation] = useState<any | null>(null);

  useEffect(() => {
    // Charger les données initiales
    fetchWindData();
    
    // Enregistrer un callback pour les alertes de vent
    const unregister = weatherService.registerWindWarningCallback((warning) => {
      setSnackbarMessage(`Alerte vent: ${warning.message}`);
      setSnackbarSeverity(warning.level === 'danger' ? 'error' : warning.level === 'warning' ? 'warning' : 'info');
      setShowSnackbar(true);
    });
    
    // Nettoyage
    return () => {
      unregister();
    };
  }, []);

  const fetchWindData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Récupérer les données détaillées du vent
      const data = await weatherService.getDetailedWindData(selectedLocation);
      setWindData(data);
      
      // Récupérer les prévisions
      const forecastData = await weatherService.getWindForecast(selectedLocation, 3);
      setForecast(forecastData);
      
      // Récupérer les recommandations de sécurité
      const safety = await weatherService.getWindSafetyRecommendation(
        selectedLocation,
        experienceLevel,
        terrainType
      );
      setSafetyRecommendation(safety);
      
    } catch (error) {
      console.error('Erreur lors de la récupération des données de vent:', error);
      setError(`Erreur: ${(error as Error).message}`);
      setSnackbarMessage(`Erreur: ${(error as Error).message}`);
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const locationIndex = Number(event.target.value);
    setSelectedLocation(SAMPLE_LOCATIONS[locationIndex]);
  };

  const handleExperienceChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setExperienceLevel(event.target.value as 'beginner' | 'intermediate' | 'advanced');
  };

  const handleTerrainChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setTerrainType(event.target.value as 'flat' | 'mountain_col' | 'mountain_descent' | 'exposed_road');
  };

  const handleSearch = async () => {
    if (!locationInput.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Géocoder l'emplacement saisi
      const geocoded = await weatherService['geocodeLocation'](locationInput);
      
      setSelectedLocation({
        lat: geocoded.lat,
        lon: geocoded.lon,
        name: geocoded.name || locationInput
      });
      
      // Réinitialiser l'entrée
      setLocationInput('');
      
      // Afficher un message de confirmation
      setSnackbarMessage(`Location trouvée: ${geocoded.name || locationInput}`);
      setSnackbarSeverity('success');
      setShowSnackbar(true);
      
      // Charger les données pour ce nouvel emplacement
      fetchWindData();
      
    } catch (error) {
      console.error('Erreur de géocodage:', error);
      setError(`Erreur: ${(error as Error).message}`);
      setSnackbarMessage(`Erreur de géocodage: ${(error as Error).message}`);
      setSnackbarSeverity('error');
      setShowSnackbar(true);
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setShowSnackbar(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Test de l'API Windy pour Velo-Altitude
      </Typography>
      
      <Typography variant="body1" paragraph>
        Cette page démontre l'intégration de l'API Windy pour les données de vent détaillées
        et les alertes pour les cyclistes.
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="location-select-label">Emplacement</InputLabel>
              <Select
                labelId="location-select-label"
                value={SAMPLE_LOCATIONS.findIndex(loc => 
                  loc.lat === selectedLocation.lat && loc.lon === selectedLocation.lon)}
                onChange={handleLocationChange}
                label="Emplacement"
              >
                {SAMPLE_LOCATIONS.map((location, index) => (
                  <MenuItem key={index} value={index}>
                    {location.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                label="Rechercher un lieu"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button 
                variant="contained" 
                onClick={handleSearch}
                disabled={loading || !locationInput.trim()}
              >
                Rechercher
              </Button>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="experience-select-label">Niveau d'expérience</InputLabel>
              <Select
                labelId="experience-select-label"
                value={experienceLevel}
                onChange={handleExperienceChange}
                label="Niveau d'expérience"
              >
                {EXPERIENCE_LEVELS.map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    {level.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="terrain-select-label">Type de terrain</InputLabel>
              <Select
                labelId="terrain-select-label"
                value={terrainType}
                onChange={handleTerrainChange}
                label="Type de terrain"
              >
                {TERRAIN_TYPES.map((terrain) => (
                  <MenuItem key={terrain.value} value={terrain.value}>
                    {terrain.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Button 
              fullWidth 
              variant="contained" 
              color="primary"
              onClick={fetchWindData}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Rafraîchir les données'
              )}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Alerte de vent */}
      <WindAlert 
        location={selectedLocation}
        onWarning={(warning) => {
          setSnackbarMessage(`Alerte: ${warning.message}`);
          setSnackbarSeverity(warning.level === 'danger' ? 'error' : 'warning');
          setShowSnackbar(true);
        }}
      />
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {/* Prévisions de vent */}
          <Grid item xs={12} md={8}>
            {forecast && (
              <WindForecast 
                location={selectedLocation}
                days={3}
                showAlert={false}
              />
            )}
          </Grid>
          
          {/* Recommandations de sécurité */}
          <Grid item xs={12} md={4}>
            {safetyRecommendation && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recommandation de sécurité
                  </Typography>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 
                      safetyRecommendation.safetyLevel === 'danger' ? 'error.light' :
                      safetyRecommendation.safetyLevel === 'warning' ? 'warning.light' :
                      safetyRecommendation.safetyLevel === 'caution' ? 'info.light' :
                      'success.light',
                    borderRadius: 1,
                    mb: 2
                  }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {safetyRecommendation.safetyLevel === 'danger' ? 'DANGER' :
                       safetyRecommendation.safetyLevel === 'warning' ? 'ATTENTION' :
                       safetyRecommendation.safetyLevel === 'caution' ? 'PRUDENCE' :
                       'FAVORABLE'}
                    </Typography>
                    <Typography variant="body2">
                      {safetyRecommendation.recommendation}
                    </Typography>
                  </Box>
                  
                  <Typography variant="subtitle2">Échelle de Beaufort:</Typography>
                  <Typography variant="body2">
                    Force {safetyRecommendation.beaufort.force} - {safetyRecommendation.beaufort.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {safetyRecommendation.beaufort.description}
                  </Typography>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Vitesse du vent:</Typography>
                      <Typography variant="body1">{safetyRecommendation.speed} km/h</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Rafales:</Typography>
                      <Typography variant="body1">{windData?.gust || 'N/A'} km/h</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Direction:</Typography>
                      <Typography variant="body1">{safetyRecommendation.directionName}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Timestamp:</Typography>
                      <Typography variant="body1">
                        {windData ? new Date(windData.timestamp).toLocaleTimeString() : 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Grid>
          
          {/* Données météo brutes */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Données brutes de l'API Windy
                </Typography>
                <Divider sx={{ my: 1 }} />
                
                <Typography component="pre" sx={{ 
                  bgcolor: 'grey.100', 
                  p: 2, 
                  borderRadius: 1,
                  overflow: 'auto',
                  maxHeight: 300,
                  fontSize: '0.85rem'
                }}>
                  {JSON.stringify({
                    windData,
                    forecastSample: forecast ? {
                      current: forecast.current,
                      hourly: forecast.hourly.slice(0, 3), // Juste un échantillon
                      daily: forecast.daily
                    } : null,
                    safetyRecommendation
                  }, null, 2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* Snackbar pour les notifications */}
      <Snackbar 
        open={showSnackbar} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default WindyApiTest;
