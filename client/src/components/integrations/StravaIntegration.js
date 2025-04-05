/**
 * StravaIntegration.js
 * Composant d'intégration avec Strava pour les sorties de groupe
 */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Link,
  Grid,
  TextField,
  Switch,
  FormControlLabel
} from '@mui/material';

import stravaService from '../../services/stravaService';
import authService from '../../services/authService';
import { brandConfig } from '../../config/branding';

/**
 * Composant d'intégration avec Strava pour les sorties de groupe
 */
const StravaIntegration = ({ rideId, onShareOnStrava, stravaEventId, isOrganizer }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({});
  const [stravaEvent, setStravaEvent] = useState(null);
  const [eventOptions, setEventOptions] = useState({
    title: '',
    description: '',
    privateEvent: false,
    inviteFollowers: true
  });
  const [error, setError] = useState(null);

  // Vérifier la connexion Strava au montage
  useEffect(() => {
    const checkStravaConnection = async () => {
      try {
        setLoading(true);
        
        // Vérifier si l'utilisateur est connecté
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
          setStravaConnected(false);
          setError(t('loginRequiredForStrava'));
          return;
        }
        
        // Dans une application réelle, vérifier la connexion Strava via le service
        const status = await stravaService.checkConnection();
        setStravaConnected(status.connected);
        setConnectionStatus(status);
        
        // Si un événement Strava existe, récupérer ses détails
        if (stravaEventId) {
          const eventDetails = await stravaService.getEventDetails(stravaEventId);
          setStravaEvent(eventDetails);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de la connexion Strava:', error);
        setStravaConnected(false);
        setError(error.message || t('errorCheckingStravaConnection'));
      } finally {
        setLoading(false);
      }
    };

    checkStravaConnection();
  }, [rideId, stravaEventId, t]);

  // Connecter à Strava
  const handleConnectStrava = async () => {
    try {
      setLoading(true);
      
      // Dans une application réelle, rediriger vers l'authentification Strava
      await stravaService.initiateConnection();
      
      // Actualiser le statut de connexion
      const status = await stravaService.checkConnection();
      setStravaConnected(status.connected);
      setConnectionStatus(status);
      
      setError(null);
    } catch (error) {
      console.error('Erreur lors de la connexion à Strava:', error);
      setError(error.message || t('errorConnectingStrava'));
    } finally {
      setLoading(false);
    }
  };

  // Partager la sortie sur Strava
  const handleShareOnStrava = async () => {
    try {
      setLoading(true);
      
      // Appeler la fonction de partage fournie par le parent
      await onShareOnStrava();
      
      // Simuler un délai pour l'actualisation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Dans une application réelle, vérifier la création de l'événement
      if (stravaEventId) {
        const eventDetails = await stravaService.getEventDetails(stravaEventId);
        setStravaEvent(eventDetails);
      }
      
      setError(null);
    } catch (error) {
      console.error('Erreur lors du partage sur Strava:', error);
      setError(error.message || t('errorSharingOnStrava'));
    } finally {
      setLoading(false);
    }
  };

  // Mise à jour des options d'événement
  const handleOptionChange = (e) => {
    const { name, value, checked, type } = e.target;
    setEventOptions({
      ...eventOptions,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        {t('stravaIntegration')}
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : !stravaConnected ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Box sx={{ mb: 3 }}>
            <img
              src="/images/strava-logo.png"
              alt="Strava"
              style={{ width: 120, marginBottom: 16 }}
            />
            <Typography variant="h6" gutterBottom>
              {t('connectToStrava')}
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              {t('connectToStravaDescription')}
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            color="warning"
            onClick={handleConnectStrava}
            sx={{
              bgcolor: '#FC4C02',
              '&:hover': {
                bgcolor: '#E34902'
              }
            }}
          >
            {t('connectWithStrava')}
          </Button>
        </Paper>
      ) : stravaEvent ? (
        <Box>
          <Paper sx={{ p: 3, mb: 3, bgcolor: '#F7F7F7' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <img
                src="/images/strava-logo.png"
                alt="Strava"
                style={{ width: 32, marginRight: 12 }}
              />
              <Typography variant="h6">
                {t('eventCreatedOnStrava')}
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="subtitle1" gutterBottom>
              {stravaEvent.title}
            </Typography>
            
            <Typography variant="body2" paragraph>
              {stravaEvent.description}
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>{t('date')}:</strong> {new Date(stravaEvent.startDate).toLocaleDateString()}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>{t('time')}:</strong> {new Date(stravaEvent.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>{t('participants')}:</strong> {stravaEvent.participantCount || 0}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>{t('status')}:</strong> {stravaEvent.status}
                </Typography>
              </Grid>
            </Grid>
            
            <Button
              variant="outlined"
              color="warning"
              component={Link}
              href={`https://www.strava.com/clubs/events/${stravaEventId}`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ 
                mt: 2,
                color: '#FC4C02',
                borderColor: '#FC4C02',
                '&:hover': {
                  borderColor: '#E34902'
                }
              }}
            >
              {t('viewOnStrava')}
            </Button>
          </Paper>
          
          <Typography variant="subtitle1" gutterBottom>
            {t('eventParticipants')}
          </Typography>
          
          {stravaEvent.participants && stravaEvent.participants.length > 0 ? (
            <List>
              {stravaEvent.participants.map((participant) => (
                <ListItem key={participant.id}>
                  <ListItemAvatar>
                    <Avatar src={participant.avatar} alt={participant.name} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={participant.name}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {participant.status === 'going' ? (
                          <Chip
                            label={t('going')}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        ) : (
                          <Chip
                            label={t('interested')}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
              {t('noParticipantsYet')}
            </Typography>
          )}
        </Box>
      ) : isOrganizer ? (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            {t('stravaConnectedAsOrganizer')}
          </Alert>
          
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              {t('eventOptions')}
            </Typography>
            
            <TextField
              name="title"
              label={t('eventTitle')}
              value={eventOptions.title}
              onChange={handleOptionChange}
              fullWidth
              margin="normal"
              size="small"
            />
            
            <TextField
              name="description"
              label={t('eventDescription')}
              value={eventOptions.description}
              onChange={handleOptionChange}
              fullWidth
              multiline
              rows={3}
              margin="normal"
              size="small"
            />
            
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    name="privateEvent"
                    checked={eventOptions.privateEvent}
                    onChange={handleOptionChange}
                    color="primary"
                  />
                }
                label={t('privateEvent')}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    name="inviteFollowers"
                    checked={eventOptions.inviteFollowers}
                    onChange={handleOptionChange}
                    color="primary"
                  />
                }
                label={t('inviteFollowers')}
              />
            </Box>
          </Paper>
          
          <Button
            variant="contained"
            onClick={handleShareOnStrava}
            sx={{
              bgcolor: '#FC4C02',
              '&:hover': {
                bgcolor: '#E34902'
              }
            }}
            fullWidth
          >
            {t('shareRideOnStrava')}
          </Button>
        </Box>
      ) : (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            {t('onlyOrganizerCanShareStrava')}
          </Alert>
          
          <Typography variant="body2" paragraph>
            {t('stravaIntegrationDescription')}
          </Typography>
          
          <Typography variant="body2">
            {t('stravaUserStatus')}:
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Avatar
              src={connectionStatus.profileImageUrl || '/images/default-avatar.png'}
              alt={connectionStatus.fullName || t('stravaUser')}
              sx={{ mr: 1 }}
            />
            <Box>
              <Typography variant="subtitle2">
                {connectionStatus.fullName || t('currentUser')}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {connectionStatus.connectedSince ? (
                  `${t('connectedSince')} ${new Date(connectionStatus.connectedSince).toLocaleDateString()}`
                ) : (
                  t('connected')
                )}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

StravaIntegration.propTypes = {
  rideId: PropTypes.string.isRequired,
  onShareOnStrava: PropTypes.func.isRequired,
  stravaEventId: PropTypes.string,
  isOrganizer: PropTypes.bool
};

export default StravaIntegration;
