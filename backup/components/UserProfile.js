import React, { useState } from 'react';
import { 
  Card, CardContent, Typography, Grid, Box, 
  Avatar, Button, Tabs, Tab, Divider,
  List, ListItem, ListItemAvatar, ListItemText,
  ListItemSecondaryAction, IconButton, Chip, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import { 
  Edit, PhotoCamera, EmojiEvents, DirectionsBike, 
  Assessment, People, Close
} from '@mui/icons-material';

/**
 * UserProfile component for displaying and editing user profile information
 * @param {Object} props - Component properties
 * @param {Object} props.userData - User profile data
 */
const UserProfile = ({ userData }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editableUserData, setEditableUserData] = useState({ ...userData });
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle opening edit dialog
  const handleOpenEditDialog = () => {
    setEditableUserData({ ...userData });
    setShowEditDialog(true);
  };
  
  // Handle saving edited profile
  const handleSaveProfile = () => {
    // In a real app, this would be an API call
    // Update profile logic
    console.log('Profile updated:', editableUserData);
    setShowEditDialog(false);
  };
  
  return (
    <div className="user-profile">
      <Card className="profile-header-card">
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box display="flex" flexDirection="column" alignItems="center">
                <Box position="relative">
                  <Avatar
                    src={userData.profileImage}
                    alt={userData.name}
                    sx={{ width: 150, height: 150 }}
                  />
                  <IconButton 
                    sx={{ 
                      position: 'absolute', 
                      bottom: 0, 
                      right: 0, 
                      bgcolor: 'white'
                    }}
                  >
                    <PhotoCamera />
                  </IconButton>
                </Box>
                <Typography variant="h5" mt={2}>
                  {userData.name}
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  {userData.location}
                </Typography>
                <Chip 
                  label={`Niveau ${userData.level}`} 
                  color="primary" 
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Box display="flex" justifyContent="flex-end" mb={2}>
                <Button 
                  variant="outlined" 
                  startIcon={<Edit />}
                  onClick={handleOpenEditDialog}
                >
                  Modifier mon profil
                </Button>
              </Box>
              
              <Box display="flex" flexWrap="wrap" gap={3}>
                <Box className="profile-stat">
                  <Typography variant="h4" color="primary">
                    {userData.totalRides}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Sorties
                  </Typography>
                </Box>
                
                <Box className="profile-stat">
                  <Typography variant="h4" color="primary">
                    {userData.totalDistance} km
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Distance
                  </Typography>
                </Box>
                
                <Box className="profile-stat">
                  <Typography variant="h4" color="primary">
                    {userData.following}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Abonnements
                  </Typography>
                </Box>
                
                <Box className="profile-stat">
                  <Typography variant="h4" color="primary">
                    {userData.followers}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Abonnés
                  </Typography>
                </Box>
              </Box>
              
              <Box mt={4}>
                <Typography variant="h6" gutterBottom>
                  À propos de moi
                </Typography>
                <Typography variant="body1" paragraph>
                  {userData.bio || "Passionné de cyclisme et amoureux de la nature. J'explore régulièrement les routes et cols du Grand Est à la recherche de nouveaux défis."}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab icon={<DirectionsBike />} label="Activités" />
          <Tab icon={<EmojiEvents />} label="Réalisations" />
          <Tab icon={<Assessment />} label="Statistiques" />
          <Tab icon={<People />} label="Clubs" />
        </Tabs>
      </Box>
      
      <TabPanel value={activeTab} index={0}>
        <ActivitiesPanel userData={userData} />
      </TabPanel>
      
      <TabPanel value={activeTab} index={1}>
        <AchievementsPanel userData={userData} />
      </TabPanel>
      
      <TabPanel value={activeTab} index={2}>
        <StatsPanel userData={userData} />
      </TabPanel>
      
      <TabPanel value={activeTab} index={3}>
        <ClubsPanel userData={userData} />
      </TabPanel>
      
      {/* Edit Profile Dialog */}
      <Dialog 
        open={showEditDialog} 
        onClose={() => setShowEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Modifier mon profil
          <IconButton
            onClick={() => setShowEditDialog(false)}
            sx={{ position: 'absolute', top: 8, right: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Nom complet"
                fullWidth
                variant="outlined"
                value={editableUserData.name}
                onChange={(e) => setEditableUserData({...editableUserData, name: e.target.value})}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Localisation"
                fullWidth
                variant="outlined"
                value={editableUserData.location}
                onChange={(e) => setEditableUserData({...editableUserData, location: e.target.value})}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Niveau"
                select
                fullWidth
                variant="outlined"
                value={editableUserData.level}
                onChange={(e) => setEditableUserData({...editableUserData, level: e.target.value})}
                SelectProps={{
                  native: true
                }}
              >
                <option value="beginner">Débutant</option>
                <option value="intermediate">Intermédiaire</option>
                <option value="advanced">Avancé</option>
                <option value="expert">Expert</option>
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="À propos de moi"
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                value={editableUserData.bio || ""}
                onChange={(e) => setEditableUserData({...editableUserData, bio: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>Annuler</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleSaveProfile}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

// Tab panel component
const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// Activities Tab Panel
const ActivitiesPanel = ({ userData }) => {
  const recentActivities = [
    {
      id: 'activity1',
      title: 'Ascension du Col de la Schlucht',
      date: '2025-04-01',
      distance: 68.5,
      duration: '3h 45min',
      elevationGain: 1250,
      image: 'https://i.imgur.com/LmSY37z.jpg'
    },
    {
      id: 'activity2',
      title: 'Route des Vins',
      date: '2025-03-28',
      distance: 42.3,
      duration: '2h 15min',
      elevationGain: 520,
      image: 'https://i.imgur.com/8ZTHScF.jpg'
    },
    {
      id: 'activity3',
      title: 'Tour du Lac du Der',
      date: '2025-03-20',
      distance: 38.7,
      duration: '1h 55min',
      elevationGain: 180,
      image: 'https://i.imgur.com/7zTyLte.jpg'
    }
  ];
  
  return (
    <div className="activities-panel">
      <Typography variant="h6" gutterBottom>
        Activités récentes
      </Typography>
      
      <Grid container spacing={3}>
        {recentActivities.map((activity) => (
          <Grid item xs={12} sm={6} md={4} key={activity.id}>
            <Card>
              <Box 
                sx={{ 
                  height: 140, 
                  backgroundImage: `url(${activity.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              <CardContent>
                <Typography variant="h6" gutterBottom noWrap>
                  {activity.title}
                </Typography>
                
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {new Date(activity.date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </Typography>
                
                <Box display="flex" justifyContent="space-between" mt={1}>
                  <Typography variant="body2">
                    {activity.distance} km
                  </Typography>
                  <Typography variant="body2">
                    {activity.duration}
                  </Typography>
                  <Typography variant="body2">
                    {activity.elevationGain} m D+
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Box display="flex" justifyContent="center" mt={3}>
        <Button variant="outlined" color="primary">
          Voir toutes les activités
        </Button>
      </Box>
    </div>
  );
};

// Achievements Tab Panel
const AchievementsPanel = ({ userData }) => {
  // Sample achievements for demo
  const achievements = userData.achievements || [];
  
  const upcomingAchievements = [
    {
      id: 'upcoming1',
      name: 'Conquérant des Vosges',
      description: 'Franchir tous les cols majeurs des Vosges',
      progress: 70,
      icon: '🏔️'
    },
    {
      id: 'upcoming2',
      name: '5000 km parcourus',
      description: 'Atteindre un total de 5000 km',
      progress: 85,
      icon: '🚴'
    },
    {
      id: 'upcoming3',
      name: 'Roi de la montagne',
      description: 'Réaliser 10 ascensions de plus de 1000m',
      progress: 40,
      icon: '👑'
    }
  ];
  
  return (
    <div className="achievements-panel">
      <Typography variant="h6" gutterBottom>
        Réalisations obtenues
      </Typography>
      
      {achievements.length > 0 ? (
        <Grid container spacing={2} mb={4}>
          {achievements.map((achievement) => (
            <Grid item xs={12} sm={6} md={4} key={achievement.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <EmojiEvents color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      {achievement.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Obtenu le {new Date(achievement.date).toLocaleDateString('fr-FR')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="body1" paragraph color="textSecondary">
          Vous n'avez pas encore de réalisations. Pédalez pour en gagner !
        </Typography>
      )}
      
      <Typography variant="h6" gutterBottom>
        Réalisations en cours
      </Typography>
      
      <Grid container spacing={2}>
        {upcomingAchievements.map((achievement) => (
          <Grid item xs={12} sm={6} md={4} key={achievement.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography variant="h5" sx={{ mr: 1 }}>
                    {achievement.icon}
                  </Typography>
                  <Typography variant="h6">
                    {achievement.name}
                  </Typography>
                </Box>
                <Typography variant="body2" paragraph>
                  {achievement.description}
                </Typography>
                <Box display="flex" alignItems="center">
                  <Box
                    sx={{
                      flexGrow: 1,
                      bgcolor: 'rgba(0,0,0,0.1)',
                      height: 8,
                      borderRadius: 4,
                      mr: 1
                    }}
                  >
                    <Box
                      sx={{
                        width: `${achievement.progress}%`,
                        bgcolor: 'primary.main',
                        height: 8,
                        borderRadius: 4
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="primary" fontWeight="bold">
                    {achievement.progress}%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

// Stats Tab Panel
const StatsPanel = ({ userData }) => {
  const monthlyStats = [
    { month: 'Jan', distance: 210, elevation: 3200 },
    { month: 'Fév', distance: 180, elevation: 2800 },
    { month: 'Mar', distance: 320, elevation: 4500 },
    { month: 'Avr', distance: 450, elevation: 6200 }
  ];
  
  const yearlyStats = {
    totalRides: userData.totalRides || 156,
    totalDistance: userData.totalDistance || 3840,
    totalElevation: 52000,
    totalTime: '182h 45min',
    averageSpeed: 21.2,
    longestRide: 142.8
  };
  
  return (
    <div className="stats-panel">
      <Typography variant="h6" gutterBottom>
        Résumé de l'année
      </Typography>
      
      <Grid container spacing={3} mb={4}>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" color="primary">
                {yearlyStats.totalRides}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Sorties
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" color="primary">
                {yearlyStats.totalDistance} km
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Distance
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" color="primary">
                {yearlyStats.totalElevation} m
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Dénivelé
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" color="primary">
                {yearlyStats.totalTime}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Temps
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" color="primary">
                {yearlyStats.averageSpeed} km/h
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Vitesse moy.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" color="primary">
                {yearlyStats.longestRide} km
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Plus longue sortie
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Typography variant="h6" gutterBottom>
        Progression mensuelle
      </Typography>
      
      <Card>
        <CardContent>
          {/* Dans une application réelle, nous utiliserions recharts ou un autre composant graphique */}
          <Box height={300} display="flex" alignItems="flex-end">
            {monthlyStats.map((stat, index) => (
              <Box 
                key={index} 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1
                }}
              >
                <Box 
                  sx={{ 
                    height: stat.distance / 2, 
                    width: 40,
                    bgcolor: 'primary.main',
                    mb: 1
                  }}
                />
                <Typography variant="body2">{stat.month}</Typography>
                <Typography variant="caption">{stat.distance} km</Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </div>
  );
};

// Clubs Tab Panel
const ClubsPanel = ({ userData }) => {
  const userClubs = userData.clubs || [];
  
  const recommendedClubs = [
    {
      id: 'rec-club1',
      name: 'Vélo Club Mulhouse',
      location: 'Mulhouse, Alsace',
      members: 124,
      image: 'https://randomuser.me/api/portraits/men/82.jpg'
    },
    {
      id: 'rec-club2',
      name: 'Cyclistes des Vosges',
      location: 'Épinal, Vosges',
      members: 87,
      image: 'https://randomuser.me/api/portraits/women/63.jpg'
    }
  ];
  
  return (
    <div className="clubs-panel">
      <Typography variant="h6" gutterBottom>
        Mes clubs
      </Typography>
      
      {userClubs.length > 0 ? (
        <List>
          {userClubs.map((club) => (
            <ListItem key={club.id}>
              <ListItemAvatar>
                <Avatar 
                  src={club.image || 'https://randomuser.me/api/portraits/lego/1.jpg'} 
                  alt={club.name}
                />
              </ListItemAvatar>
              <ListItemText 
                primary={club.name}
                secondary={club.location || 'Grand Est, France'}
              />
              <ListItemSecondaryAction>
                <Button variant="outlined" size="small">
                  Voir
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body1" paragraph color="textSecondary">
          Vous n'avez rejoint aucun club pour le moment.
        </Typography>
      )}
      
      <Divider sx={{ my: 3 }} />
      
      <Typography variant="h6" gutterBottom>
        Clubs recommandés
      </Typography>
      
      <List>
        {recommendedClubs.map((club) => (
          <ListItem key={club.id}>
            <ListItemAvatar>
              <Avatar 
                src={club.image} 
                alt={club.name}
              />
            </ListItemAvatar>
            <ListItemText 
              primary={club.name}
              secondary={`${club.location} • ${club.members} membres`}
            />
            <ListItemSecondaryAction>
              <Button variant="contained" color="primary" size="small">
                Rejoindre
              </Button>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      
      <Box display="flex" justifyContent="center" mt={3}>
        <Button variant="outlined" color="primary">
          Découvrir plus de clubs
        </Button>
      </Box>
    </div>
  );
};

export default UserProfile;
