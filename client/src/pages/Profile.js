import React, { useState } from 'react';
import { 
  Container, Box, Paper, Avatar, Typography, Grid, 
  Tabs, Tab, Button, Divider, Chip, Card, CardContent,
  List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import { 
  Edit as EditIcon, 
  DirectionsBike as CyclingIcon, 
  Straighten as HeightIcon, 
  FitnessCenter as WeightIcon, 
  Speed as PowerIcon,
  Equalizer as StatsIcon,
  EmojiEvents as AchievementsIcon,
  Terrain as MountainIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { userProfile, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Si le userProfile n'existe pas (non connecté ou en chargement)
  if (!userProfile) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6">
            Veuillez vous connecter pour voir votre profil
          </Typography>
        </Paper>
      </Container>
    );
  }

  // Statistiques utilisateur formatées
  const formattedStats = {
    distance: `${userProfile.trainingStats?.totalDistance.toLocaleString()} km`,
    elevation: `${userProfile.trainingStats?.totalElevation.toLocaleString()} m`,
    rides: userProfile.trainingStats?.totalRides,
    timeHours: Math.floor(userProfile.trainingStats?.totalTime || 0),
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* En-tête du profil */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          backgroundImage: 'linear-gradient(135deg, #1976d2 0%, #64b5f6 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Avatar 
                sx={{ 
                  width: 120, 
                  height: 120, 
                  border: '4px solid white'
                }}
                alt={`${userProfile.firstName} ${userProfile.lastName}`}
                src="/assets/images/default-avatar.jpg"
              />
            </Grid>
            <Grid item xs>
              <Typography variant="h4" fontWeight="bold">
                {userProfile.firstName} {userProfile.lastName}
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9, mb: 1 }}>
                Niveau: {userProfile.level.charAt(0).toUpperCase() + userProfile.level.slice(1)}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {userProfile.goals.map((goal, index) => (
                  <Chip 
                    key={index} 
                    label={goal} 
                    size="small" 
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                ))}
              </Box>
            </Grid>
            <Grid item>
              <Button 
                variant="contained" 
                color="secondary"
                startIcon={<EditIcon />}
                sx={{ bgcolor: 'white', color: 'primary.main' }}
              >
                Modifier le profil
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Statistiques résumées */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CyclingIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {formattedStats.rides}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sorties
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <StatsIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {formattedStats.distance}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Distance totale
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <MountainIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {formattedStats.elevation}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Dénivelé positif
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <AchievementsIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                12
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Badges gagnés
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Section principale avec onglets */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Informations" />
            <Tab label="Performances" />
            <Tab label="Accomplissements" />
            <Tab label="Parcours favoris" />
          </Tabs>
        </Box>
        
        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
                  Données personnelles
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <HeightIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Taille" 
                      secondary={`${userProfile.height} cm`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <WeightIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Poids" 
                      secondary={`${userProfile.weight} kg`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <PowerIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="FTP" 
                      secondary={`${userProfile.ftp} watts`} 
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
                  Objectifs et préférences
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Objectifs
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {userProfile.goals.map((goal, index) => (
                      <Chip 
                        key={index} 
                        label={goal} 
                        color="primary" 
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Préférences
                  </Typography>
                  <Typography variant="body2">
                    Thème: {userProfile.preferences?.theme}
                  </Typography>
                  <Typography variant="body2">
                    Unités: {userProfile.preferences?.units === 'metric' ? 'Métriques' : 'Impériales'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', my: 4 }}>
                Les données de performance détaillées seront disponibles ici.
              </Typography>
            </Box>
          )}

          {activeTab === 2 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', my: 4 }}>
                Vos badges et accomplissements seront affichés ici.
              </Typography>
            </Box>
          )}

          {activeTab === 3 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', my: 4 }}>
                Vos parcours favoris seront listés ici.
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default Profile;
