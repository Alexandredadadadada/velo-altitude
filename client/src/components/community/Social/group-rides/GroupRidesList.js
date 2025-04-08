/**
 * GroupRidesList.js
 * Composant d'affichage des sorties de groupe sous forme de cartes
 */
import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Box,
  Button,
  Chip,
  Divider,
  Avatar,
  AvatarGroup,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  DirectionsBike,
  Schedule,
  TrendingUp,
  Speed,
  LocationOn,
  People,
  Favorite,
  Share,
  WbSunny,
  Cloud,
  Opacity,
  AcUnit,
  Thunderstorm
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { brandConfig } from '../../../config/branding';

const levelColors = {
  beginner: '#4CAF50', // Vert
  intermediate: '#2196F3', // Bleu
  advanced: '#FF9800', // Orange
  expert: '#F44336' // Rouge
};

const terrainIcons = {
  flat: '⊡',
  hilly: '⏴',
  mountain: '▲',
  mixed: '⏶'
};

// Composant d'affichage des sorties
const GroupRidesList = ({
  rides,
  onViewRide,
  onJoinRide,
  onLeaveRide,
  onShareOnStrava,
  userProfile,
  emptyMessage,
  type = 'public'
}) => {
  const { t } = useTranslation();

  // Si aucune sortie disponible
  if (!rides || rides.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="textSecondary">
          {emptyMessage || t('noRidesAvailable')}
        </Typography>
      </Box>
    );
  }

  // Récupérer l'icône météo en fonction de la condition
  const getWeatherIcon = (condition) => {
    if (!condition) return <WbSunny />;
    
    switch (condition.toLowerCase()) {
      case 'clear':
      case 'sunny':
        return <WbSunny color="warning" />;
      case 'cloudy':
      case 'partly-cloudy':
      case 'overcast':
        return <Cloud color="action" />;
      case 'rain':
      case 'drizzle':
        return <Opacity color="info" />;
      case 'snow':
        return <AcUnit color="info" />;
      case 'thunderstorm':
        return <Thunderstorm color="error" />;
      default:
        return <WbSunny color="action" />;
    }
  };

  // Vérifier si l'utilisateur participe déjà à une sortie
  const isUserParticipating = (ride) => {
    if (!userProfile) return false;
    return ride.participants.some(p => p.id === userProfile.id);
  };

  // Vérifier si l'utilisateur est l'organisateur
  const isUserOrganizer = (ride) => {
    if (!userProfile) return false;
    return ride.organizer.id === userProfile.id;
  };

  return (
    <Grid container spacing={3}>
      {rides.map((ride) => (
        <Grid item xs={12} sm={6} md={4} key={ride.id}>
          <Card 
            elevation={2}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4
              }
            }}
          >
            <Box sx={{ position: 'relative' }}>
              <CardMedia
                component="div"
                sx={{
                  height: 140,
                  bgcolor: 'grey.200',
                  backgroundSize: 'cover',
                  backgroundImage: `url(${ride.routeDetails?.image || 'https://source.unsplash.com/random/400x200/?cycling,mountains'})`
                }}
              />
              
              <Box 
                sx={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0, 
                  right: 0, 
                  bgcolor: 'rgba(0,0,0,0.6)', 
                  color: 'white',
                  p: 1.5
                }}
              >
                <Typography variant="h6" component="div" noWrap>
                  {ride.title}
                </Typography>
                <Typography variant="body2" noWrap>
                  {format(new Date(ride.dateTime), 'EEEE d MMMM y, HH:mm', { locale: fr })}
                </Typography>
              </Box>
              
              {ride.weatherForecast && (
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    top: 10, 
                    right: 10, 
                    bgcolor: 'rgba(255,255,255,0.8)', 
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Tooltip 
                    title={
                      <>
                        <Typography variant="body2">{ride.weatherForecast.temperature}°C</Typography>
                        <Typography variant="body2">Vent: {ride.weatherForecast.windSpeed} km/h</Typography>
                        <Typography variant="body2">Précip.: {ride.weatherForecast.precipitation}%</Typography>
                      </>
                    }
                  >
                    {getWeatherIcon(ride.weatherForecast.condition)}
                  </Tooltip>
                </Box>
              )}
            </Box>
            
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {ride.description}
                </Typography>
              </Box>
              
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <DirectionsBike color="primary" fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {ride.routeDetails?.distance || 0} km
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TrendingUp color="secondary" fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {ride.routeDetails?.elevationGain || 0} m
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Speed color="action" fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {ride.averageSpeed} km/h
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationOn color="error" fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2" noWrap>
                      {ride.meetingPoint}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip 
                  label={ride.levelRequired.charAt(0).toUpperCase() + ride.levelRequired.slice(1)}
                  size="small"
                  sx={{ 
                    bgcolor: levelColors[ride.levelRequired] || 'grey.500',
                    color: 'white'
                  }}
                />
                
                <Tooltip title={ride.terrainType}>
                  <Chip 
                    label={terrainIcons[ride.terrainType] || '?'}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Tooltip>
                
                <Chip 
                  label={ride.routeDetails?.region || 'Région'}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <People fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {ride.currentParticipants}/{ride.maxParticipants}
                  </Typography>
                </Box>
                
                <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24 } }}>
                  {ride.participants.map(p => (
                    <Tooltip key={p.id} title={p.name}>
                      <Avatar 
                        src={p.avatar} 
                        alt={p.name}
                        sx={{ 
                          width: 24, 
                          height: 24,
                          border: p.id === ride.organizer.id ? `2px solid ${brandConfig.colors.primary}` : undefined
                        }}
                      />
                    </Tooltip>
                  ))}
                </AvatarGroup>
              </Box>
            </CardContent>
            
            <CardActions sx={{ p: 2, pt: 0 }}>
              <Button 
                size="small" 
                variant="outlined" 
                fullWidth
                onClick={() => onViewRide(ride)}
              >
                {t('details')}
              </Button>
              
              {type === 'public' && userProfile && !isUserParticipating(ride) && !isUserOrganizer(ride) && (
                <Button 
                  size="small" 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  onClick={() => onJoinRide(ride.id)}
                  disabled={ride.currentParticipants >= ride.maxParticipants}
                >
                  {t('join')}
                </Button>
              )}
              
              {type === 'user' && userProfile && isUserParticipating(ride) && !isUserOrganizer(ride) && (
                <Button 
                  size="small" 
                  variant="outlined" 
                  color="error" 
                  fullWidth
                  onClick={() => onLeaveRide(ride.id)}
                >
                  {t('leave')}
                </Button>
              )}
              
              {type === 'organizer' && userProfile && isUserOrganizer(ride) && (
                <Button 
                  size="small" 
                  variant="outlined" 
                  color="primary" 
                  fullWidth
                  onClick={() => onShareOnStrava(ride.id)}
                  disabled={!!ride.stravaEventId}
                  startIcon={<Share />}
                >
                  {ride.stravaEventId ? t('sharedOnStrava') : t('shareOnStrava')}
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

GroupRidesList.propTypes = {
  rides: PropTypes.array.isRequired,
  onViewRide: PropTypes.func.isRequired,
  onJoinRide: PropTypes.func,
  onLeaveRide: PropTypes.func,
  onShareOnStrava: PropTypes.func,
  userProfile: PropTypes.object,
  emptyMessage: PropTypes.string,
  type: PropTypes.oneOf(['public', 'user', 'organizer'])
};

export default GroupRidesList;
