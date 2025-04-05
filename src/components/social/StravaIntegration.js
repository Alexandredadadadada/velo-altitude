import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Grid, Card, CardHeader, CardContent, 
  CardActions, CircularProgress, Snackbar, Alert, Dialog, 
  DialogTitle, DialogContent, DialogActions 
} from '@mui/material';
import { DirectionsBike, Hiking, DirectionsRun } from '@mui/icons-material';
import StravaService from '../../services/stravaService';
import AuthService from '../../services/authService';

/**
 * StravaIntegration component for importing and sharing Strava activities
 * @param {Object} props - Component properties
 * @param {string} props.userId - Current user ID
 * @param {Function} props.onActivityShared - Callback when an activity is shared
 */
const StravaIntegration = ({ userId, onActivityShared }) => {
  const [stravaActivities, setStravaActivities] = useState([]);
  const [loadingStrava, setLoadingStrava] = useState(false);
  const [connected, setConnected] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [shareError, setShareError] = useState(null);
  
  // Check if user is connected to Strava on mount
  useEffect(() => {
    const checkStravaConnection = async () => {
      try {
        const isConnected = await StravaService.checkAuthStatus();
        setConnected(isConnected);
        
        if (isConnected) {
          fetchStravaActivities();
        }
      } catch (error) {
        console.error('Error checking Strava connection:', error);
        setConnected(false);
      }
    };
    
    checkStravaConnection();
  }, [userId]);
  
  // Handle connecting to Strava
  const handleConnectStrava = async () => {
    try {
      setLoadingStrava(true);
      
      // Récupérer l'URL d'authentification et rediriger l'utilisateur
      const authUrl = await StravaService.getAuthUrl();
      window.location.href = authUrl;
      
      setLoadingStrava(false);
    } catch (error) {
      console.error('Error connecting to Strava:', error);
      setShareError('Erreur lors de la connexion à Strava. Veuillez réessayer.');
      setLoadingStrava(false);
    }
  };
  
  // Fetch Strava activities
  const fetchStravaActivities = async () => {
    if (!connected) {
      return;
    }
    
    try {
      setLoadingStrava(true);
      
      // Récupérer les activités Strava via l'API réelle
      const activities = await StravaService.getUserActivities();
      setStravaActivities(activities);
      
      setLoadingStrava(false);
    } catch (error) {
      console.error('Error fetching Strava activities:', error);
      setShareError('Erreur lors de la récupération des activités Strava. Veuillez réessayer.');
      setLoadingStrava(false);
    }
  };
  
  // Open share dialog for an activity
  const handleOpenShareDialog = (activity) => {
    setSelectedActivity(activity);
    setShowShareDialog(true);
  };
  
  // Share a Strava activity
  const shareStravaActivity = async () => {
    if (!selectedActivity) return;
    
    try {
      setLoadingStrava(true);
      
      // Préparer les données de l'activité
      const activityData = {
        id: selectedActivity.id,
        name: selectedActivity.name,
        type: selectedActivity.type,
        distance: selectedActivity.distance,
        moving_time: selectedActivity.moving_time,
        total_elevation_gain: selectedActivity.total_elevation_gain,
        start_date: selectedActivity.start_date,
        map: selectedActivity.map
      };
      
      // Utiliser le callback pour informer le composant parent
      await onActivityShared(activityData);
      
      // Fermer le dialogue et afficher un message de succès
      setShowShareDialog(false);
      setShareSuccess(true);
      setLoadingStrava(false);
    } catch (error) {
      console.error('Error sharing Strava activity:', error);
      setShareError('Erreur lors du partage de l\'activité. Veuillez réessayer.');
      setLoadingStrava(false);
    }
  };
  
  // Format moving time duration
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    } else {
      return `${minutes}min`;
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Get activity type icon
  const getActivityTypeIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'ride':
      case 'ebikeride':
      case 'virtualride':
        return <DirectionsBike />;
      case 'run':
        return <DirectionsRun />;
      case 'hike':
      case 'walk':
        return <Hiking />;
      default:
        return <DirectionsBike />;
    }
  };

  return (
    <Box>
      {!connected ? (
        <Button
          variant="contained"
          color="warning"
          onClick={handleConnectStrava}
          disabled={loadingStrava}
          startIcon={loadingStrava ? <CircularProgress size={20} /> : null}
          sx={{ 
            bgcolor: '#FC4C02', 
            '&:hover': { bgcolor: '#E34000' } 
          }}
        >
          {loadingStrava ? 'Connexion...' : 'Connecter avec Strava'}
        </Button>
      ) : (
        <Button
          variant="outlined"
          color="primary"
          onClick={() => setShowShareDialog(true)}
          disabled={stravaActivities.length === 0}
        >
          Importer depuis Strava
        </Button>
      )}
      
      {/* Strava Activities Dialog */}
      <Dialog 
        open={showShareDialog && !selectedActivity && connected}
        onClose={() => setShowShareDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Vos activités Strava
        </DialogTitle>
        
        <DialogContent dividers>
          {loadingStrava ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : stravaActivities.length === 0 ? (
            <Typography variant="body1" align="center" p={4}>
              Aucune activité Strava trouvée.
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {stravaActivities.map(activity => (
                <Grid item xs={12} sm={6} md={4} key={activity.id}>
                  <Card variant="outlined">
                    <CardHeader
                      avatar={getActivityTypeIcon(activity.type)}
                      title={activity.name}
                      subheader={formatDate(activity.start_date)}
                    />
                    
                    <CardContent>
                      <Box display="flex" justifyContent="space-between">
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Distance
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {(activity.distance / 1000).toFixed(1)} km
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" color="textSecondary" align="center">
                            Durée
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" align="center">
                            {formatDuration(activity.moving_time)}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" color="textSecondary" align="right">
                            Dénivelé
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" align="right">
                            {activity.total_elevation_gain} m
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                    
                    <CardActions>
                      <Button 
                        fullWidth 
                        variant="contained" 
                        color="primary"
                        onClick={() => handleOpenShareDialog(activity)}
                      >
                        Partager
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowShareDialog(false)}>
            Fermer
          </Button>
          <Button 
            variant="outlined" 
            color="primary"
            onClick={fetchStravaActivities}
            disabled={loadingStrava}
          >
            Actualiser
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Share Activity Dialog */}
      <Dialog open={showShareDialog && selectedActivity} onClose={() => setShowShareDialog(false)}>
        <DialogTitle>
          Partager cette activité
        </DialogTitle>
        
        <DialogContent dividers>
          {selectedActivity && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedActivity.name}
              </Typography>
              
              <Typography variant="body2" paragraph>
                {formatDate(selectedActivity.start_date)}
              </Typography>
              
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="body2">
                  {(selectedActivity.distance / 1000).toFixed(1)} km
                </Typography>
                <Typography variant="body2">
                  {formatDuration(selectedActivity.moving_time)}
                </Typography>
                <Typography variant="body2">
                  {selectedActivity.total_elevation_gain} m D+
                </Typography>
              </Box>
              
              <Typography variant="body2" paragraph>
                Cette activité sera convertie en itinéraire partageable.
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowShareDialog(false)}>
            Annuler
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={shareStravaActivity}
            disabled={loadingStrava}
          >
            {loadingStrava ? <CircularProgress size={24} /> : 'Partager'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success Snackbar */}
      <Snackbar
        open={shareSuccess}
        autoHideDuration={6000}
        onClose={() => setShareSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setShareSuccess(false)} severity="success">
          Activité partagée avec succès !
        </Alert>
      </Snackbar>
      
      {/* Error Snackbar */}
      <Snackbar
        open={!!shareError}
        autoHideDuration={6000}
        onClose={() => setShareError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setShareError(null)} severity="error">
          {shareError}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StravaIntegration;
