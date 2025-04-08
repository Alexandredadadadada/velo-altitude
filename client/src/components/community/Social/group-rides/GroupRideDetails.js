/**
 * GroupRideDetails.js
 * Composant de visualisation détaillée d'une sortie de groupe
 */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Box,
  Divider,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  Paper,
  TextField,
  Link,
  CircularProgress
} from '@mui/material';
import {
  Close,
  DirectionsBike,
  Schedule,
  TrendingUp,
  Speed,
  LocationOn,
  Person,
  Group,
  Mail,
  Share,
  ChatBubble,
  Route,
  Favorite,
  FavoriteBorder,
  WbSunny,
  Cloud,
  Opacity,
  AcUnit,
  Thunderstorm,
  Event,
  Assessment,
  WhatsApp,
  Facebook,
  Twitter,
  ContentCopy
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import RouteService from '../../../services/routeService';
import RouteMap from '../../maps/RouteMap';
import GroupRideChat from './GroupRideChat';
import StravaIntegration from '../../integrations/StravaIntegration';
import { brandConfig } from '../../../config/branding';

const levelColors = {
  beginner: '#4CAF50', // Vert
  intermediate: '#2196F3', // Bleu
  advanced: '#FF9800', // Orange
  expert: '#F44336' // Rouge
};

const levelLabels = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
  expert: 'Expert'
};

const terrainLabels = {
  flat: 'Plat',
  hilly: 'Vallonné',
  mountain: 'Montagneux',
  mixed: 'Mixte'
};

/**
 * Composant dialog pour afficher les détails d'une sortie de groupe
 */
const GroupRideDetails = ({
  open,
  onClose,
  ride,
  onJoinRide,
  onLeaveRide,
  onShareOnStrava,
  userProfile
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const [route, setRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Récupérer les détails de l'itinéraire si disponible
  useEffect(() => {
    const fetchRouteDetails = async () => {
      if (ride && ride.routeId) {
        try {
          setRouteLoading(true);
          const routeData = await RouteService.getRouteById(ride.routeId);
          setRoute(routeData);
        } catch (error) {
          console.error('Erreur lors de la récupération des détails de l\'itinéraire:', error);
        } finally {
          setRouteLoading(false);
        }
      }
    };

    if (open) {
      fetchRouteDetails();
      
      // Générer un lien d'invitation
      const baseUrl = window.location.origin;
      setInviteLink(`${baseUrl}/group-rides/join/${ride.id}`);
    }
  }, [ride, open]);

  if (!ride) return null;

  // Gérer le changement d'onglet
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Vérifier si l'utilisateur participe déjà à la sortie
  const isUserParticipating = () => {
    if (!userProfile) return false;
    return ride.participants.some(p => p.id === userProfile.id);
  };

  // Vérifier si l'utilisateur est l'organisateur
  const isUserOrganizer = () => {
    if (!userProfile) return false;
    return ride.organizer.id === userProfile.id;
  };

  // Gérer l'envoi d'invitation par email
  const handleSendInvite = (e) => {
    e.preventDefault();
    // Simulation d'envoi d'email
    if (inviteEmail) {
      // Dans une application réelle, appeler une API pour envoyer l'invitation
      console.log(`Invitation envoyée à ${inviteEmail} pour la sortie ${ride.id}`);
      setInviteEmail('');
      setShowInviteForm(false);
    }
  };

  // Copier le lien d'invitation dans le presse-papier
  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

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

  // Formater la date en français
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'EEEE d MMMM y, HH:mm', { locale: fr });
  };

  // Afficher les onglets de contenu
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Détails
        return (
          <div>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  {t('rideInformation')}
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" paragraph>
                    {ride.description}
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Schedule color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        <strong>{t('dateTime')}:</strong> {formatDate(ride.dateTime)}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationOn color="error" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        <strong>{t('meetingPoint')}:</strong> {ride.meetingPoint}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <DirectionsBike color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        <strong>{t('distance')}:</strong> {ride.routeDetails?.distance || 0} km
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TrendingUp color="secondary" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        <strong>{t('elevationGain')}:</strong> {ride.routeDetails?.elevationGain || 0} m
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Speed color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        <strong>{t('averageSpeed')}:</strong> {ride.averageSpeed} km/h
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Person color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        <strong>{t('levelRequired')}:</strong> {levelLabels[ride.levelRequired] || ride.levelRequired}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                <Box sx={{ my: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('terrainType')}:
                  </Typography>
                  <Chip 
                    label={terrainLabels[ride.terrainType] || ride.terrainType}
                    color="primary"
                    sx={{ mr: 1 }}
                  />
                </Box>
                
                {ride.tags && ride.tags.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {t('tags')}:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {ride.tags.map((tag, index) => (
                        <Chip 
                          key={index}
                          label={tag}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
                
                {ride.weatherForecast && (
                  <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      {getWeatherIcon(ride.weatherForecast.condition)}
                      <Box component="span" sx={{ ml: 1 }}>{t('weatherForecast')}</Box>
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>{t('temperature')}:</strong> {ride.weatherForecast.temperature}°C
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>{t('windSpeed')}:</strong> {ride.weatherForecast.windSpeed} km/h
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Typography variant="body2">
                          <strong>{t('precipitation')}:</strong> {ride.weatherForecast.precipitation}%
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                )}
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  {t('organizer')}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar
                    src={ride.organizer.avatar}
                    alt={ride.organizer.name}
                    sx={{ width: 50, height: 50, mr: 2 }}
                  />
                  <div>
                    <Typography variant="subtitle1">
                      {ride.organizer.name}
                    </Typography>
                    <Chip 
                      label={levelLabels[ride.organizer.level] || ride.organizer.level}
                      size="small"
                      sx={{ 
                        bgcolor: levelColors[ride.organizer.level] || 'grey.500',
                        color: 'white'
                      }}
                    />
                  </div>
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                <Typography variant="h6" gutterBottom>
                  {t('participants')} ({ride.currentParticipants}/{ride.maxParticipants})
                </Typography>
                
                <List>
                  {ride.participants.map((participant) => (
                    <ListItem 
                      key={participant.id}
                      secondaryAction={
                        participant.id === ride.organizer.id && (
                          <Chip 
                            label={t('organizer')}
                            size="small"
                            color="primary"
                          />
                        )
                      }
                    >
                      <ListItemAvatar>
                        <Avatar src={participant.avatar} alt={participant.name} />
                      </ListItemAvatar>
                      <ListItemText 
                        primary={participant.name}
                        secondary={levelLabels[participant.level] || participant.level}
                      />
                    </ListItem>
                  ))}
                </List>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('inviteParticipants')}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <TextField
                      value={inviteLink}
                      fullWidth
                      variant="outlined"
                      size="small"
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <IconButton onClick={handleCopyInviteLink} color={copySuccess ? "success" : "default"}>
                            <ContentCopy />
                          </IconButton>
                        )
                      }}
                    />
                    {copySuccess && (
                      <Typography variant="caption" color="success.main">
                        {t('linkCopied')}
                      </Typography>
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                      variant="outlined"
                      startIcon={<Mail />}
                      onClick={() => setShowInviteForm(!showInviteForm)}
                    >
                      {t('inviteByEmail')}
                    </Button>
                    
                    <Box>
                      <Tooltip title="Partager sur WhatsApp">
                        <IconButton color="success" href={`https://wa.me/?text=${encodeURIComponent(`Rejoins-moi pour cette sortie vélo: ${ride.title} - ${inviteLink}`)}`} target="_blank">
                          <WhatsApp />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Partager sur Facebook">
                        <IconButton color="primary" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}&quote=${encodeURIComponent(`Rejoins-moi pour cette sortie vélo: ${ride.title}`)}`} target="_blank">
                          <Facebook />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Partager sur Twitter">
                        <IconButton color="info" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Rejoins-moi pour cette sortie vélo: ${ride.title}`)}&url=${encodeURIComponent(inviteLink)}`} target="_blank">
                          <Twitter />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  
                  {showInviteForm && (
                    <Box component="form" onSubmit={handleSendInvite} sx={{ mt: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={8}>
                          <TextField
                            type="email"
                            label={t('emailAddress')}
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            fullWidth
                            required
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={4}>
                          <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            sx={{ height: '100%' }}
                          >
                            {t('send')}
                          </Button>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </Box>
                
                {ride.stravaEventId && (
                  <Paper sx={{ p: 2, mt: 2, bgcolor: '#FAFAFA' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <img 
                        src="/images/strava-logo.png" 
                        alt="Strava" 
                        style={{ width: 24, height: 24, marginRight: 8 }} 
                      />
                      <Typography variant="subtitle1">
                        {t('stravaEvent')}
                      </Typography>
                    </Box>
                    <Link 
                      href={`https://www.strava.com/clubs/events/${ride.stravaEventId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ display: 'block', mt: 1 }}
                    >
                      {t('viewOnStrava')}
                    </Link>
                  </Paper>
                )}
              </Grid>
            </Grid>
          </div>
        );
      
      case 1: // Itinéraire
        return (
          <div>
            {routeLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : !route ? (
              <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', my: 4 }}>
                {t('noRouteAvailable')}
              </Typography>
            ) : (
              <>
                <Typography variant="h6" gutterBottom>
                  {route.name}
                </Typography>
                
                <Box sx={{ height: 400, mb: 2 }}>
                  <RouteMap route={route} />
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        {t('routeDetails')}
                      </Typography>
                      
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            <strong>{t('distance')}:</strong> {route.distance} km
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            <strong>{t('elevationGain')}:</strong> {route.elevationGain} m
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            <strong>{t('difficulty')}:</strong> {route.difficulty}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            <strong>{t('region')}:</strong> {route.region}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        {t('routeOptions')}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Download />}
                          href={route.gpxUrl}
                          download
                        >
                          {t('downloadGPX')}
                        </Button>
                        
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Route />}
                          component={Link}
                          to={`/routes/${route.id}`}
                        >
                          {t('viewRouteDetails')}
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </>
            )}
          </div>
        );
      
      case 2: // Chat
        return (
          <GroupRideChat 
            rideId={ride.id} 
            participants={ride.participants}
            userProfile={userProfile}
          />
        );
      
      case 3: // Strava
        return (
          <div>
            <StravaIntegration
              rideId={ride.id}
              onShareOnStrava={() => onShareOnStrava(ride.id)}
              stravaEventId={ride.stravaEventId}
              isOrganizer={isUserOrganizer()}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      scroll="paper"
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">
            {ride.title}
          </Typography>
          <IconButton onClick={onClose} edge="end">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab icon={<Assessment />} label={t('details')} />
        <Tab icon={<Route />} label={t('route')} />
        <Tab icon={<ChatBubble />} label={t('chat')} />
        <Tab icon={<Event />} label="Strava" />
      </Tabs>
      
      <DialogContent dividers>
        {renderTabContent()}
      </DialogContent>
      
      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        {isUserParticipating() && !isUserOrganizer() ? (
          <Button
            variant="outlined"
            color="error"
            onClick={() => onLeaveRide(ride.id)}
          >
            {t('leaveRide')}
          </Button>
        ) : !isUserParticipating() && userProfile ? (
          <Button
            variant="contained"
            color="primary"
            onClick={() => onJoinRide(ride.id)}
            disabled={ride.currentParticipants >= ride.maxParticipants}
          >
            {t('joinRide')}
          </Button>
        ) : (
          <div />
        )}
        
        <Button onClick={onClose} color="primary">
          {t('close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

GroupRideDetails.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  ride: PropTypes.object,
  onJoinRide: PropTypes.func,
  onLeaveRide: PropTypes.func,
  onShareOnStrava: PropTypes.func,
  userProfile: PropTypes.object
};

export default GroupRideDetails;
