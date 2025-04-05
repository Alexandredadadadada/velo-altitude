import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Card, CardContent, Typography, Grid, Divider, 
  Button, Chip, CircularProgress, Paper, Tabs, Tab,
  Alert, Snackbar
} from '@mui/material';
import { 
  Terrain as TerrainIcon, 
  Visibility as VisibilityIcon,
  NavigationRounded as NavigationIcon,
  LocationOn as LocationIcon,
  Hotel as HotelIcon,
  LineChart as LineChartIcon,
  ThreeDRotation as ThreeDIcon,
  WbSunny as SunnyIcon,
  AcUnit as SnowIcon,
  Cloud as CloudIcon,
  Cached as CachedIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ColVisualization3D from './ColVisualization3D';
import ColService from '../../services/colService';
import WeatherCache from '../../utils/WeatherCache';
import OfflineHandler from '../common/OfflineHandler';

// Initialiser le cache météo
const weatherCache = new WeatherCache('col-weather-cache', 3600000 * 3); // 3 heures

// Composant d'information et visualisation de cols cyclistes
const ColDetail = ({ colId }) => {
  const [col, setCol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [elevationData, setElevationData] = useState([]);
  const [terrain3DData, setTerrain3DData] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [hasWeatherCache, setHasWeatherCache] = useState(false);
  const [lastWeatherUpdate, setLastWeatherUpdate] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  // Charger les données du col
  useEffect(() => {
    const fetchColData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les détails du col
        const colData = await ColService.getColById(colId);
        setCol(colData);
        
        // Récupérer les données d'élévation pour le graphique
        const elevData = await ColService.getColElevationData(colId);
        setElevationData(elevData);
        
        // Récupérer les données de terrain pour la visualisation 3D
        const terrainData = await ColService.getCol3DTerrainData(colId);
        setTerrain3DData(terrainData);
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des données du col:', err);
        setError('Impossible de charger les données du col. Veuillez réessayer plus tard.');
        setLoading(false);
      }
    };
    
    if (colId) {
      fetchColData();
    }
  }, [colId]);

  // Fonction pour récupérer les données météo
  const fetchWeatherData = useCallback(async (useCache = false) => {
    if (!col || !col.coordinates) return;
    
    const { latitude, longitude } = col.coordinates;
    
    try {
      setWeatherLoading(true);
      setWeatherError(null);
      setIsOffline(false);
      
      // Vérifier si des données en cache sont disponibles
      const cachedData = await weatherCache.getWeatherData(latitude, longitude);
      setHasWeatherCache(!!cachedData);
      
      if (cachedData) {
        setLastWeatherUpdate(cachedData.timestamp);
      }
      
      // Si on force l'utilisation du cache ou si on est hors ligne
      if (useCache && cachedData) {
        setWeatherData(cachedData);
        setWeatherLoading(false);
        setNotification({
          open: true,
          message: 'Affichage des données météo en cache',
          severity: 'info'
        });
        return;
      }
      
      // Tenter de récupérer les données fraîches
      try {
        const freshWeatherData = await ColService.getColWeatherData(latitude, longitude);
        
        // Mettre en cache les nouvelles données
        await weatherCache.setWeatherData(latitude, longitude, {
          ...freshWeatherData,
          timestamp: Date.now()
        });
        
        setWeatherData(freshWeatherData);
        setLastWeatherUpdate(Date.now());
        setHasWeatherCache(true);
      } catch (err) {
        console.error('Erreur lors du chargement des données météo:', err);
        
        // Si des données en cache sont disponibles, les utiliser
        if (cachedData) {
          setWeatherData(cachedData);
          setIsOffline(true);
        } else {
          setWeatherError('Impossible de charger les données météo');
          setIsOffline(true);
        }
      } finally {
        setWeatherLoading(false);
      }
    } catch (err) {
      console.error('Erreur lors de la gestion des données météo:', err);
      setWeatherError('Erreur lors du chargement des données météo');
      setWeatherLoading(false);
      setIsOffline(true);
    }
  }, [col]);

  // Charger les données météo quand le col est chargé
  useEffect(() => {
    if (col && col.coordinates) {
      fetchWeatherData();
      
      // Nettoyer le cache expiré
      weatherCache.cleanExpiredCache().catch(err => {
        console.error('Erreur lors du nettoyage du cache météo:', err);
      });
    }
  }, [col, fetchWeatherData]);

  // Gérer le changement d'onglet
  const handleChangeTab = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Fermer la notification
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Afficher un indicateur de chargement
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Afficher un message d'erreur
  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  // Si aucun col n'est sélectionné ou trouvé
  if (!col) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="subtitle1">
          Sélectionnez un col pour voir ses détails
        </Typography>
      </Box>
    );
  }

  // Rendu du composant
  return (
    <Card elevation={3}>
      <CardContent>
        <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1">
            {col.name}
          </Typography>
          <Chip 
            icon={<TerrainIcon />} 
            label={col.difficulty} 
            color={
              col.difficulty === 'Difficile' ? 'error' : 
              col.difficulty === 'Modéré' ? 'warning' : 'success'
            }
          />
        </Box>
        
        <Box mb={2}>
          <img 
            src={col.imageUrl} 
            alt={col.name} 
            style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: '8px' }}
            loading="lazy"
          />
        </Box>
        
        <Typography variant="body1" paragraph sx={{ mb: 3 }}>
          {col.description}
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box display="flex" alignItems="center" mb={1}>
                <NavigationIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Altitude</Typography>
              </Box>
              <Typography variant="h4" component="p" align="center">
                {col.elevation} m
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box display="flex" alignItems="center" mb={1}>
                <NavigationIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Distance</Typography>
              </Box>
              <Typography variant="h4" component="p" align="center">
                {col.length} km
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box display="flex" alignItems="center" mb={1}>
                <NavigationIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Pente moyenne</Typography>
              </Box>
              <Typography variant="h4" component="p" align="center">
                {col.avgGradient}%
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box display="flex" alignItems="center" mb={1}>
                {weatherLoading ? (
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                ) : (
                  <>
                    {weatherData && weatherData.current && (
                      <>
                        {weatherData.current.condition.toLowerCase().includes('sun') && <SunnyIcon color="warning" sx={{ mr: 1 }} />}
                        {weatherData.current.condition.toLowerCase().includes('cloud') && <CloudIcon color="action" sx={{ mr: 1 }} />}
                        {weatherData.current.condition.toLowerCase().includes('snow') && <SnowIcon color="info" sx={{ mr: 1 }} />}
                        {!weatherData.current.condition.toLowerCase().includes('sun') && 
                         !weatherData.current.condition.toLowerCase().includes('cloud') && 
                         !weatherData.current.condition.toLowerCase().includes('snow') && <WbSunny color="warning" sx={{ mr: 1 }} />}
                      </>
                    )}
                  </>
                )}
                <Typography variant="h6">Météo</Typography>
                {hasWeatherCache && !weatherLoading && (
                  <Tooltip title="Données en cache">
                    <CachedIcon fontSize="small" color="action" sx={{ ml: 1 }} />
                  </Tooltip>
                )}
              </Box>
              {weatherLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="60px">
                  <CircularProgress size={30} />
                </Box>
              ) : weatherError ? (
                <Typography variant="body2" color="error" align="center">
                  Données météo indisponibles
                </Typography>
              ) : weatherData ? (
                <Box textAlign="center">
                  <Typography variant="h4" component="p">
                    {weatherData.current.temperature}°C
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {weatherData.current.condition}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="textSecondary" align="center">
                  Aucune donnée météo
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
        
        {isOffline && (
          <Box mb={3}>
            <OfflineHandler 
              isOffline={isOffline}
              hasCache={hasWeatherCache}
              lastUpdated={lastWeatherUpdate}
              onRetry={() => fetchWeatherData(false)}
              onUseCache={() => fetchWeatherData(true)}
            >
              <Alert severity="info">
                Les données météo sont à jour
              </Alert>
            </OfflineHandler>
          </Box>
        )}
        
        <Divider sx={{ mb: 3 }} />
        
        <Box sx={{ mb: 2 }}>
          <Tabs 
            value={currentTab} 
            onChange={handleChangeTab} 
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab icon={<LineChartIcon />} label="Profil d'élévation" />
            <Tab icon={<ThreeDIcon />} label="Visualisation 3D" />
          </Tabs>
          
          {/* Onglet Profil d'élévation */}
          <Box role="tabpanel" hidden={currentTab !== 0} sx={{ height: '400px', mb: 2 }}>
            {currentTab === 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={elevationData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="distance" 
                    label={{ value: 'Distance (km)', position: 'insideBottomRight', offset: -10 }} 
                  />
                  <YAxis 
                    label={{ value: 'Élévation (m)', angle: -90, position: 'insideLeft' }} 
                    domain={['dataMin - 50', 'dataMax + 50']}
                  />
                  <Tooltip formatter={(value) => [`${value} m`, 'Élévation']} labelFormatter={(value) => `Distance: ${value} km`} />
                  <Line type="monotone" dataKey="elevation" stroke="#2196F3" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Box>
          
          {/* Onglet Visualisation 3D */}
          <Box role="tabpanel" hidden={currentTab !== 1} sx={{ height: '450px', mb: 2 }}>
            {currentTab === 1 && terrain3DData && (
              <ColVisualization3D 
                colId={colId}
                colData={terrain3DData.coordinates}
                pointsOfInterest={terrain3DData.pointsOfInterest}
              />
            )}
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
          Points d'intérêt
        </Typography>
        
        <Grid container spacing={2}>
          {col.terrainData.pointsOfInterest.map((poi, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Paper sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  {poi.type === 'viewpoint' && <VisibilityIcon color="primary" sx={{ mr: 1 }} />}
                  {poi.type === 'rest' && <HotelIcon color="primary" sx={{ mr: 1 }} />}
                  {poi.type === 'summit' && <TerrainIcon color="primary" sx={{ mr: 1 }} />}
                  <Typography variant="h6">{poi.name}</Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  À {poi.distance} km du départ
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
        
        <Box mt={3} display="flex" justifyContent="space-between">
          <Button variant="outlined" color="primary">
            Voir sur la carte
          </Button>
          <Button variant="contained" color="primary">
            Ajouter à mon itinéraire
          </Button>
        </Box>
      </CardContent>
      
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default ColDetail;
