import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Grid, 
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TerrainIcon from '@mui/icons-material/Terrain';
import TimerIcon from '@mui/icons-material/Timer';
import SpeedIcon from '@mui/icons-material/Speed';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import ExploreIcon from '@mui/icons-material/Explore';
import NavigationIcon from '@mui/icons-material/Navigation';
import CloudIcon from '@mui/icons-material/Cloud';
import CachedIcon from '@mui/icons-material/Cached';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { Challenge, Col, Route } from '../../types';
import { APIOrchestrator } from '../../api/orchestration/APIOrchestrator';
import ChallengeMap from './ChallengeMap';
import { useAuth } from '../../hooks/useAuth';

const apiOrchestrator = new APIOrchestrator();

interface ChallengePlannerProps {
  challengeId: string;
}

const ChallengePlanner: React.FC<ChallengePlannerProps> = ({ challengeId }) => {
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [cols, setCols] = useState<Col[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [optimizeMethod, setOptimizeMethod] = useState<'distance' | 'elevation' | 'difficulty'>('distance');
  const [gpxUrl, setGpxUrl] = useState<string | null>(null);
  const [showWeatherDialog, setShowWeatherDialog] = useState(false);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchChallengeData = async () => {
      if (!challengeId) return;
      
      setLoading(true);
      try {
        // Récupération du défi
        const challengeData = await apiOrchestrator.getChallengeById(challengeId);
        setChallenge(challengeData);
        
        // Récupération des cols
        const colsData = await Promise.all(
          challengeData.cols.map((colId: string) => apiOrchestrator.getColById(colId))
        );
        setCols(colsData);
        
        // Vérifier si des itinéraires suggérés existent déjà
        try {
          const existingRoutes = await apiOrchestrator.getChallengeRoutes(challengeId);
          if (existingRoutes && existingRoutes.length > 0) {
            setRoutes(existingRoutes);
          }
        } catch (error) {
          console.error('Pas d\'itinéraires existants:', error);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données du défi:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChallengeData();
  }, [challengeId]);

  const handleGenerateRoutes = async () => {
    if (!challenge || !challengeId) return;
    
    setGenerating(true);
    try {
      // Générer des itinéraires optimisés
      const generatedRoutes = await apiOrchestrator.generateOptimizedRoutes(
        challengeId,
        { optimizeFor: optimizeMethod }
      );
      
      setRoutes(generatedRoutes);
    } catch (error) {
      console.error('Erreur lors de la génération des itinéraires:', error);
    } finally {
      setGenerating(false);
    }
  };
  
  const handleDownloadGpx = async (routeIndex?: number) => {
    if (!challengeId) return;
    
    try {
      let gpxData;
      
      if (routeIndex !== undefined && routes[routeIndex]) {
        // Télécharger le GPX d'un itinéraire spécifique
        gpxData = await apiOrchestrator.generateRouteGpx(routes[routeIndex].id);
      } else {
        // Télécharger le GPX complet du défi
        gpxData = await apiOrchestrator.generateGpxForChallenge(challengeId);
      }
      
      setGpxUrl(gpxData);
      
      // Déclencher le téléchargement
      const a = document.createElement('a');
      a.href = gpxData;
      a.download = `seven-majors-${challenge?.name.toLowerCase().replace(/\s+/g, '-')}.gpx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur lors de la génération du fichier GPX:', error);
    }
  };
  
  const handleOptimizeMethodChange = (method: 'distance' | 'elevation' | 'difficulty') => {
    setOptimizeMethod(method);
  };
  
  const handleViewWeather = (routeIndex: number) => {
    setSelectedRouteIndex(routeIndex);
    setShowWeatherDialog(true);
  };
  
  const handleCloseWeatherDialog = () => {
    setShowWeatherDialog(false);
    setSelectedRouteIndex(null);
  };
  
  // Formater la durée estimée en heures et minutes
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!challenge) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="h6" color="error">
          Défi introuvable. Veuillez vérifier l'identifiant du défi.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ py: 4, px: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Planification d'itinéraire - {challenge.name}
      </Typography>
      
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={4}>
          {/* Carte du défi */}
          <Grid item xs={12} md={7}>
            <Box sx={{ height: 400, width: '100%', position: 'relative' }}>
              <ChallengeMap 
                cols={cols} 
                selectedRoute={selectedRouteIndex !== null ? routes[selectedRouteIndex] : undefined}
              />
              
              {/* Actions de planification */}
              <Box 
                sx={{ 
                  position: 'absolute', 
                  bottom: 16, 
                  right: 16, 
                  zIndex: 1000,
                  display: 'flex',
                  gap: 1
                }}
              >
                <Button
                  variant="contained"
                  onClick={handleDownloadGpx}
                  startIcon={<FileDownloadIcon />}
                  color="primary"
                >
                  Télécharger GPX
                </Button>
              </Box>
            </Box>
          </Grid>
          
          {/* Informations sur le défi */}
          <Grid item xs={12} md={5}>
            <Typography variant="h6" gutterBottom>Détails du défi</Typography>
            
            <List dense>
              <ListItem>
                <ListItemIcon><TerrainIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Dénivelé total"
                  secondary={`${challenge.totalElevation.toFixed(0)} m`}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon><DirectionsRunIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Distance totale"
                  secondary={`${challenge.totalDistance.toFixed(1)} km`}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon><LocalFireDepartmentIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Difficulté"
                  secondary={`${challenge.difficulty.toFixed(1)}/10`}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon><TerrainIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Nombre de cols"
                  secondary={`${cols.length} cols`}
                />
              </ListItem>
            </List>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1" gutterBottom>Optimiser l'itinéraire par:</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip 
                label="Distance" 
                color={optimizeMethod === 'distance' ? 'primary' : 'default'} 
                onClick={() => handleOptimizeMethodChange('distance')}
                icon={<DirectionsBikeIcon />}
              />
              <Chip 
                label="Dénivelé" 
                color={optimizeMethod === 'elevation' ? 'primary' : 'default'} 
                onClick={() => handleOptimizeMethodChange('elevation')}
                icon={<TerrainIcon />}
              />
              <Chip 
                label="Difficulté" 
                color={optimizeMethod === 'difficulty' ? 'primary' : 'default'} 
                onClick={() => handleOptimizeMethodChange('difficulty')}
                icon={<LocalFireDepartmentIcon />}
              />
            </Box>
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleGenerateRoutes}
              disabled={generating}
              startIcon={generating ? <CircularProgress size={20} /> : <CachedIcon />}
              fullWidth
            >
              {generating 
                ? 'Génération en cours...' 
                : routes.length > 0 
                  ? 'Regénérer des itinéraires' 
                  : 'Générer des itinéraires'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Itinéraires suggérés */}
      {routes.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Itinéraires suggérés
          </Typography>
          
          <Grid container spacing={3}>
            {routes.map((route, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Option {index + 1}: {route.name}
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <DirectionsRunIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="body2">
                            {route.statistics?.distance.toFixed(1)} km
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TerrainIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="body2">
                            {route.statistics?.elevationGain.toFixed(0)} m D+
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TimerIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="body2">
                            {formatDuration(route.statistics?.distance * 4 || 0)} (estimé)
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <SpeedIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="body2">
                            {route.statistics?.grade.toFixed(1)}% pente moy.
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Typography variant="subtitle2" gutterBottom>
                      Cols (dans l'ordre de passage):
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {route.cols?.map((col, colIndex) => (
                        <Chip 
                          key={colIndex} 
                          label={col.name} 
                          size="small"
                          icon={<TerrainIcon />}
                        />
                      ))}
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      startIcon={<ExploreIcon />}
                      onClick={() => setSelectedRouteIndex(index)}
                    >
                      Voir sur la carte
                    </Button>
                    <Button 
                      size="small" 
                      startIcon={<CloudIcon />}
                      onClick={() => handleViewWeather(index)}
                    >
                      Météo
                    </Button>
                    <Button 
                      size="small" 
                      startIcon={<FileDownloadIcon />}
                      onClick={() => handleDownloadGpx(index)}
                    >
                      GPX
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
      
      {/* Détails des cols */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Cols du défi
        </Typography>
        
        {cols.map((col, index) => (
          <Accordion key={col.id} defaultExpanded={index === 0}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">{col.name}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><TerrainIcon color="primary" /></ListItemIcon>
                      <ListItemText 
                        primary="Altitude"
                        secondary={`${col.elevation} m`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><DirectionsRunIcon color="primary" /></ListItemIcon>
                      <ListItemText 
                        primary="Longueur"
                        secondary={`${col.length.toFixed(1)} km`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><SpeedIcon color="primary" /></ListItemIcon>
                      <ListItemText 
                        primary="Pente moyenne"
                        secondary={`${col.avgGradient.toFixed(1)}%`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><NavigationIcon color="primary" /></ListItemIcon>
                      <ListItemText 
                        primary="Pente maximale"
                        secondary={`${col.maxGradient.toFixed(1)}%`}
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} sm={6}>
                  {col.description && (
                    <Typography variant="body2" paragraph>
                      {col.description}
                    </Typography>
                  )}
                  {col.imageUrl && (
                    <Box 
                      component="img"
                      src={col.imageUrl}
                      alt={col.name}
                      sx={{ 
                        width: '100%', 
                        height: 150, 
                        objectFit: 'cover',
                        borderRadius: 1
                      }}
                    />
                  )}
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
      
      {/* Dialogue de météo */}
      <Dialog
        open={showWeatherDialog}
        onClose={handleCloseWeatherDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Prévisions météo
          {selectedRouteIndex !== null && routes[selectedRouteIndex] && (
            ` - ${routes[selectedRouteIndex].name}`
          )}
        </DialogTitle>
        <DialogContent>
          {selectedRouteIndex !== null && routes[selectedRouteIndex] && routes[selectedRouteIndex].weather ? (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6" gutterBottom>Point de départ</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      component="img"
                      src={`https://openweathermap.org/img/wn/${routes[selectedRouteIndex].weather.start.weather[0].icon}@2x.png`}
                      alt={routes[selectedRouteIndex].weather.start.weather[0].description}
                      sx={{ width: 50, height: 50 }}
                    />
                    <Typography variant="h5">
                      {Math.round(routes[selectedRouteIndex].weather.start.main.temp)}°C
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {routes[selectedRouteIndex].weather.start.weather[0].description}
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Humidité"
                        secondary={`${routes[selectedRouteIndex].weather.start.main.humidity}%`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Vent"
                        secondary={`${routes[selectedRouteIndex].weather.start.wind.speed} m/s`}
                      />
                    </ListItem>
                  </List>
                </Grid>
                
                {routes[selectedRouteIndex].weather.end && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="h6" gutterBottom>Point d'arrivée</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box
                        component="img"
                        src={`https://openweathermap.org/img/wn/${routes[selectedRouteIndex].weather.end.weather[0].icon}@2x.png`}
                        alt={routes[selectedRouteIndex].weather.end.weather[0].description}
                        sx={{ width: 50, height: 50 }}
                      />
                      <Typography variant="h5">
                        {Math.round(routes[selectedRouteIndex].weather.end.main.temp)}°C
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {routes[selectedRouteIndex].weather.end.weather[0].description}
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText 
                          primary="Humidité"
                          secondary={`${routes[selectedRouteIndex].weather.end.main.humidity}%`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Vent"
                          secondary={`${routes[selectedRouteIndex].weather.end.wind.speed} m/s`}
                        />
                      </ListItem>
                    </List>
                  </Grid>
                )}
              </Grid>
              
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                Dernière mise à jour: {new Date(routes[selectedRouteIndex].weather.start.dt * 1000).toLocaleString()}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body1">
              Données météo non disponibles pour cet itinéraire.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseWeatherDialog}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChallengePlanner;
