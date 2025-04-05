import React, { useState } from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Chip, 
  Box, 
  Button,
  Rating,
  LinearProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  TrendingUp, 
  Straighten, 
  Landscape, 
  Speed,
  WbSunny,
  AcUnit,
  Cloud,
  Umbrella,
  Bolt,
  Info
} from '@mui/icons-material';
import './ColsList.css';

const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case 'easy':
      return '#4caf50';
    case 'medium':
      return '#ff9800';
    case 'hard':
      return '#f44336';
    case 'extreme':
      return '#9c27b0';
    default:
      return '#2196f3';
  }
};

const getDifficultyLabel = (difficulty) => {
  switch (difficulty) {
    case 'easy':
      return 'Facile';
    case 'medium':
      return 'Moyen';
    case 'hard':
      return 'Difficile';
    case 'extreme':
      return 'Extrême';
    default:
      return 'Inconnu';
  }
};

const getWeatherIcon = (weatherCode) => {
  if (weatherCode >= 200 && weatherCode < 300) return <Bolt />;
  if (weatherCode >= 300 && weatherCode < 500) return <Umbrella />;
  if (weatherCode >= 500 && weatherCode < 600) return <Umbrella />;
  if (weatherCode >= 600 && weatherCode < 700) return <AcUnit />;
  if (weatherCode >= 700 && weatherCode < 800) return <Cloud sx={{ opacity: 0.7 }} />;
  if (weatherCode === 800) return <WbSunny />;
  if (weatherCode > 800) return <Cloud />;
  return <Info />;
};

const ColDetailModal = ({ open, handleClose, col }) => {
  if (!col) return null;
  
  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {col.name} ({col.altitude}m)
        <Chip 
          label={getDifficultyLabel(col.difficulty)} 
          size="small" 
          sx={{ 
            ml: 2, 
            backgroundColor: getDifficultyColor(col.difficulty),
            color: 'white'
          }} 
        />
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <CardMedia
              component="img"
              height="300"
              image={col.imageUrl || '/images/cols/default.jpg'}
              alt={col.name}
              sx={{ borderRadius: 1 }}
            />
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Profil d'élévation
              </Typography>
              <CardMedia
                component="img"
                height="150"
                image={col.profileUrl || '/images/cols/default-profile.jpg'}
                alt={`Profil ${col.name}`}
                sx={{ borderRadius: 1 }}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="body1" paragraph>
              {col.description}
            </Typography>
            
            <Typography variant="h6" gutterBottom>
              Caractéristiques
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box display="flex" alignItems="center" mb={1}>
                  <Straighten sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body2">
                    <strong>Longueur:</strong> {col.length} km
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box display="flex" alignItems="center" mb={1}>
                  <TrendingUp sx={{ mr: 1, color: 'secondary.main' }} />
                  <Typography variant="body2">
                    <strong>Pente moy:</strong> {col.avgGradient}%
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box display="flex" alignItems="center" mb={1}>
                  <Speed sx={{ mr: 1, color: 'error.main' }} />
                  <Typography variant="body2">
                    <strong>Pente max:</strong> {col.maxGradient}%
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box display="flex" alignItems="center" mb={1}>
                  <Landscape sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="body2">
                    <strong>Dénivelé:</strong> {col.elevationGain}m
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            {col.weather && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Météo actuelle
                </Typography>
                <Box className="weather-box">
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center">
                      {getWeatherIcon(col.weather.weatherCode)}
                      <Typography variant="body1" sx={{ ml: 1 }}>
                        {col.weather.description}
                      </Typography>
                    </Box>
                    <Typography variant="h6">
                      {Math.round(col.weather.temp)}°C
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      <strong>Vent:</strong> {Math.round(col.weather.windSpeed * 3.6)} km/h
                    </Typography>
                    <Typography variant="body2">
                      <strong>Humidité:</strong> {col.weather.humidity}%
                    </Typography>
                  </Box>
                  
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'right' }}>
                    Mis à jour le: {col.weather.updatedAt}
                  </Typography>
                </Box>
              </>
            )}
            
            {col.routes && col.routes.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Versants
                </Typography>
                {col.routes.map((route, index) => (
                  <Box key={index} className="route-box" sx={{ mb: 1 }}>
                    <Typography variant="subtitle2">
                      {route.name} (depuis {route.startLocation})
                    </Typography>
                    <Grid container spacing={1} sx={{ mt: 0.5 }}>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Longueur:</strong> {route.length} km
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Dénivelé:</strong> {route.elevationGain}m
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2">
                          <strong>Pente moyenne:</strong> {route.avgGradient}%
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </>
            )}
            
            {col.strava && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Segment Strava
                </Typography>
                <Typography variant="body2">
                  <strong>KOM:</strong> {col.strava.komName} - {col.strava.komTime}
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  sx={{ mt: 1 }}
                  href={`https://www.strava.com/segments/${col.strava.segmentId}`}
                  target="_blank"
                >
                  Voir sur Strava
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Fermer</Button>
        <Button 
          variant="contained" 
          color="primary"
          href={`/cols/${col.id}`}
        >
          Voir la page détaillée
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ColsList = ({ cols }) => {
  const [selectedCol, setSelectedCol] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const handleOpenModal = (col) => {
    setSelectedCol(col);
    setModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setModalOpen(false);
  };
  
  if (!cols || cols.length === 0) {
    return (
      <Typography variant="body1" align="center" sx={{ mt: 4, mb: 4 }}>
        Aucun col trouvé avec les critères sélectionnés.
      </Typography>
    );
  }
  
  return (
    <>
      <Grid container spacing={3}>
        {cols.map((col) => (
          <Grid item xs={12} sm={6} md={4} key={col.id}>
            <Card className="col-card">
              <CardMedia
                component="img"
                height="160"
                image={col.imageUrl || '/images/cols/default.jpg'}
                alt={col.name}
              />
              <CardContent>
                <Typography gutterBottom variant="h6" component="div" className="col-title">
                  {col.name}
                  <Chip 
                    label={col.altitude + 'm'} 
                    size="small" 
                    color="primary" 
                    className="altitude-chip" 
                  />
                </Typography>
                
                <Box className="difficulty-box">
                  <Typography variant="body2" component="span">
                    Difficulté:
                  </Typography>
                  <Chip 
                    label={getDifficultyLabel(col.difficulty)} 
                    size="small" 
                    sx={{ 
                      ml: 1, 
                      backgroundColor: getDifficultyColor(col.difficulty),
                      color: 'white'
                    }} 
                  />
                </Box>
                
                <Grid container spacing={1} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Tooltip title="Longueur">
                      <Box display="flex" alignItems="center">
                        <Straighten fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {col.length} km
                        </Typography>
                      </Box>
                    </Tooltip>
                  </Grid>
                  <Grid item xs={6}>
                    <Tooltip title="Dénivelé">
                      <Box display="flex" alignItems="center">
                        <Landscape fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {col.elevationGain}m
                        </Typography>
                      </Box>
                    </Tooltip>
                  </Grid>
                </Grid>
                
                <Box sx={{ mb: 1.5, mt: 1.5 }}>
                  <Tooltip title={`Pente moyenne: ${col.avgGradient}%`}>
                    <Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          Pente moy.
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {col.avgGradient}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min((col.avgGradient / 15) * 100, 100)} 
                        sx={{ 
                          height: 6, 
                          borderRadius: 1,
                          backgroundColor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: getDifficultyColor(col.difficulty)
                          }
                        }} 
                      />
                    </Box>
                  </Tooltip>
                </Box>
                
                {col.weather && (
                  <Box className="weather-summary">
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center">
                        {getWeatherIcon(col.weather.weatherCode)}
                        <Typography variant="body2" sx={{ ml: 0.5 }}>
                          {col.weather.description}
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="bold">
                        {Math.round(col.weather.temp)}°C
                      </Typography>
                    </Box>
                  </Box>
                )}
                
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {col.country || 'France'} • {col.region === 'alpes' ? 'Alpes' : 
                        col.region === 'pyrenees' ? 'Pyrénées' : 
                        col.region === 'vosges' ? 'Vosges' : 
                        col.region === 'jura' ? 'Jura' : 
                        col.region === 'massif-central' ? 'Massif Central' : 
                        col.region === 'dolomites' ? 'Dolomites' : 
                        col.region === 'alps-switzerland' ? 'Alpes Suisses' : 
                        col.region}
                    </Typography>
                  </Box>
                  <Rating 
                    name={`col-rating-${col.id}`}
                    value={col.userRating || 4.5} 
                    precision={0.5} 
                    size="small" 
                    readOnly 
                  />
                </Box>
                
                <Box sx={{ mt: 2 }}>
                  <Button 
                    variant="outlined" 
                    fullWidth
                    onClick={() => handleOpenModal(col)}
                  >
                    Voir les détails
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <ColDetailModal 
        open={modalOpen} 
        handleClose={handleCloseModal} 
        col={selectedCol} 
      />
    </>
  );
};

export default ColsList;
