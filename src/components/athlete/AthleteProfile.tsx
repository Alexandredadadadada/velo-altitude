import React from 'react';
import { useAthleteProfile } from '../../hooks/useApi';
import { Box, Typography, Avatar, Chip, CircularProgress, Paper, Grid, Divider } from '@mui/material';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface AthleteProfileProps {
  onSelectActivity?: (activityId: string) => void;
}

const AthleteProfile: React.FC<AthleteProfileProps> = ({ onSelectActivity }) => {
  const { data: athlete, loading, error } = useAthleteProfile();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
        <Typography variant="body1" ml={2}>
          Chargement du profil athlète...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4} color="error.main">
        <ErrorOutlineIcon />
        <Typography variant="body1" ml={2}>
          Erreur lors du chargement du profil: {error.message}
        </Typography>
      </Box>
    );
  }

  if (!athlete) {
    return (
      <Box p={4}>
        <Typography variant="body1">
          Aucune donnée de profil disponible. Connectez-vous avec Strava pour voir votre profil.
        </Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3} display="flex" flexDirection="column" alignItems="center">
          <Avatar 
            src={athlete.profile} 
            alt={athlete.firstname}
            sx={{ width: 120, height: 120, mb: 2 }}
          />
          <Typography variant="h5" gutterBottom>
            {athlete.firstname} {athlete.lastname}
          </Typography>
          <Chip 
            icon={<DirectionsBikeIcon />} 
            label={`Niveau ${athlete.ftp ? 'FTP: ' + athlete.ftp + 'W' : 'Cycliste'}`}
            color="primary" 
            sx={{ mt: 1 }}
          />
        </Grid>

        <Grid item xs={12} md={9}>
          <Typography variant="h4" gutterBottom>
            Profil Cycliste
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Ville
              </Typography>
              <Typography variant="body1">
                {athlete.city || 'Non spécifié'}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Pays
              </Typography>
              <Typography variant="body1">
                {athlete.country || 'Non spécifié'}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Sexe
              </Typography>
              <Typography variant="body1">
                {athlete.sex === 'M' ? 'Homme' : athlete.sex === 'F' ? 'Femme' : 'Non spécifié'}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Poids
              </Typography>
              <Typography variant="body1">
                {athlete.weight ? `${athlete.weight} kg` : 'Non spécifié'}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Activités suivies
              </Typography>
              <Typography variant="body1">
                {athlete.activities?.length || 0}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Date d'inscription
              </Typography>
              <Typography variant="body1">
                {athlete.created_at ? new Date(athlete.created_at).toLocaleDateString() : 'Non spécifié'}
              </Typography>
            </Grid>
          </Grid>

          {athlete.activities && athlete.activities.length > 0 && (
            <>
              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Activités récentes
              </Typography>
              <Box sx={{ maxHeight: '300px', overflowY: 'auto' }}>
                {athlete.activities.map((activity: any) => (
                  <Paper 
                    key={activity.id}
                    elevation={1}
                    sx={{ 
                      p: 2, 
                      mb: 1,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => onSelectActivity && onSelectActivity(activity.id)}
                  >
                    <Grid container alignItems="center">
                      <Grid item xs={8}>
                        <Typography variant="body1" fontWeight="bold">
                          {activity.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(activity.start_date).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={4} textAlign="right">
                        <Typography variant="body2">
                          {(activity.distance / 1000).toFixed(1)} km
                        </Typography>
                        <Typography variant="body2">
                          {Math.floor(activity.moving_time / 60)} min
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Box>
            </>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
};

export default AthleteProfile;
