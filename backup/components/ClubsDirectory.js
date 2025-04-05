import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, Typography, Grid, Box, Avatar,
  Button, TextField, InputAdornment, Chip, 
  Dialog, DialogTitle, DialogContent, DialogActions,
  List, ListItem, ListItemAvatar, ListItemText,
  Tabs, Tab
} from '@mui/material';
import { Search, FilterList, Close, LocationOn, People, DirectionsBike } from '@mui/icons-material';

/**
 * ClubsDirectory component for displaying and searching cycling clubs
 * @param {Object} props - Component properties
 * @param {string} props.userId - Current user ID
 * @param {Array} props.userClubs - User's joined clubs
 */
const ClubsDirectory = ({ userId, userClubs = [] }) => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedClub, setSelectedClub] = useState(null);
  const [showClubDialog, setShowClubDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  // Fetch clubs data on component mount
  useEffect(() => {
    const fetchClubsData = async () => {
      try {
        setLoading(true);
        // In a real implementation, this would be an API call
        // const response = await axios.get('/api/clubs');
        
        // Mock clubs data for development
        setClubs(generateMockClubs());
        setLoading(false);
      } catch (error) {
        console.error('Error fetching clubs data:', error);
        setLoading(false);
      }
    };
    
    fetchClubsData();
  }, []);
  
  // Filter clubs based on search term and region
  const filteredClubs = clubs.filter(club => {
    if (searchTerm && !club.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    if (selectedRegion !== 'all' && club.region !== selectedRegion) {
      return false;
    }
    
    return true;
  });
  
  // Get user joined clubs
  const joinedClubs = clubs.filter(club => 
    userClubs.some(userClub => userClub.id === club.id)
  );
  
  // Handle viewing club details
  const handleViewClub = (club) => {
    setSelectedClub(club);
    setShowClubDialog(true);
  };
  
  // Handle joining/leaving a club
  const handleToggleJoinClub = (clubId) => {
    setClubs(clubs.map(club => {
      if (club.id === clubId) {
        const isJoined = userClubs.some(userClub => userClub.id === club.id);
        
        if (isJoined) {
          // Leave club logic (in a real app, would call an API)
          return {
            ...club,
            members: club.members - 1
          };
        } else {
          // Join club logic (in a real app, would call an API)
          return {
            ...club,
            members: club.members + 1
          };
        }
      }
      return club;
    }));
  };
  
  if (loading) {
    return <div className="clubs-loading">Chargement des clubs...</div>;
  }
  
  const regions = ['Alsace', 'Lorraine', 'Champagne-Ardenne', 'Vosges', 'Franche-Comté'];
  
  return (
    <div className="clubs-directory">
      <div className="clubs-header">
        <Typography variant="h5" gutterBottom>
          Clubs de Cyclisme
        </Typography>
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <TextField
            placeholder="Rechercher un club..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
            sx={{ width: 300 }}
          />
          
          <Box>
            <TextField
              select
              label="Région"
              size="small"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              SelectProps={{
                native: true
              }}
              sx={{ minWidth: 150 }}
            >
              <option value="all">Toutes les régions</option>
              {regions.map((region) => (
                <option key={region} value={region}>{region}</option>
              ))}
            </TextField>
          </Box>
        </Box>
      </div>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Tous les clubs" />
          <Tab label="Mes clubs" />
          <Tab label="Recommandés" />
        </Tabs>
      </Box>
      
      <TabPanel value={activeTab} index={0}>
        <AllClubsPanel 
          clubs={filteredClubs} 
          userClubs={userClubs}
          onViewClub={handleViewClub}
          onToggleJoin={handleToggleJoinClub}
        />
      </TabPanel>
      
      <TabPanel value={activeTab} index={1}>
        <MyClubsPanel 
          clubs={joinedClubs}
          onViewClub={handleViewClub}
          onToggleJoin={handleToggleJoinClub}
        />
      </TabPanel>
      
      <TabPanel value={activeTab} index={2}>
        <RecommendedClubsPanel 
          clubs={clubs.filter(club => club.recommended)}
          userClubs={userClubs}
          onViewClub={handleViewClub}
          onToggleJoin={handleToggleJoinClub}
        />
      </TabPanel>
      
      {/* Club Detail Dialog */}
      <Dialog 
        open={showClubDialog} 
        onClose={() => setShowClubDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedClub && (
          <>
            <DialogTitle>
              {selectedClub.name}
              <IconButton
                onClick={() => setShowClubDialog(false)}
                sx={{ position: 'absolute', top: 8, right: 8 }}
              >
                <Close />
              </IconButton>
            </DialogTitle>
            
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box display="flex" flexDirection="column" alignItems="center">
                    <Avatar
                      src={selectedClub.logo}
                      alt={selectedClub.name}
                      sx={{ width: 150, height: 150 }}
                    />
                    <Typography variant="h5" mt={2}>
                      {selectedClub.name}
                    </Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="body1" ml={0.5}>
                        {selectedClub.location}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" mt={1}>
                      <People fontSize="small" color="action" />
                      <Typography variant="body1" ml={0.5}>
                        {selectedClub.members} membres
                      </Typography>
                    </Box>
                    
                    <Box mt={3}>
                      <Button 
                        variant="contained" 
                        color={userClubs.some(c => c.id === selectedClub.id) ? 'error' : 'primary'}
                        onClick={() => handleToggleJoinClub(selectedClub.id)}
                        fullWidth
                      >
                        {userClubs.some(c => c.id === selectedClub.id) ? 'Quitter le club' : 'Rejoindre le club'}
                      </Button>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" gutterBottom>
                    À propos du club
                  </Typography>
                  
                  <Typography variant="body1" paragraph>
                    {selectedClub.description}
                  </Typography>
                  
                  <Typography variant="h6" gutterBottom mt={3}>
                    Activités principales
                  </Typography>
                  
                  <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
                    {selectedClub.activities.map((activity, index) => (
                      <Chip key={index} label={activity} />
                    ))}
                  </Box>
                  
                  <Typography variant="h6" gutterBottom>
                    Sorties régulières
                  </Typography>
                  
                  <List>
                    {selectedClub.regularRides.map((ride, index) => (
                      <ListItem key={index}>
                        <ListItemAvatar>
                          <Avatar>
                            <DirectionsBike />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={ride.name}
                          secondary={`${ride.day} à ${ride.time} • ${ride.distance} km • ${ride.difficulty}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </DialogContent>
            
            <DialogActions>
              <Button 
                onClick={() => window.open(selectedClub.website, '_blank')}
                disabled={!selectedClub.website}
              >
                Site web
              </Button>
              <Button 
                variant="outlined"
                onClick={() => setShowClubDialog(false)}
              >
                Fermer
              </Button>
            </DialogActions>
          </>
        )}
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
      id={`clubs-tabpanel-${index}`}
      aria-labelledby={`clubs-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
};

// All Clubs Panel
const AllClubsPanel = ({ clubs, userClubs, onViewClub, onToggleJoin }) => {
  return (
    <div className="all-clubs-panel">
      {clubs.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="textSecondary">
            Aucun club ne correspond à votre recherche.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {clubs.map((club) => (
            <Grid item xs={12} sm={6} md={4} key={club.id}>
              <ClubCard 
                club={club}
                isJoined={userClubs.some(c => c.id === club.id)}
                onViewClub={onViewClub}
                onToggleJoin={onToggleJoin}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </div>
  );
};

// My Clubs Panel
const MyClubsPanel = ({ clubs, onViewClub, onToggleJoin }) => {
  return (
    <div className="my-clubs-panel">
      {clubs.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="textSecondary">
            Vous n'avez rejoint aucun club pour le moment.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => document.getElementById('clubs-tab-0').click()}
          >
            Découvrir des clubs
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {clubs.map((club) => (
            <Grid item xs={12} sm={6} md={4} key={club.id}>
              <ClubCard 
                club={club}
                isJoined={true}
                onViewClub={onViewClub}
                onToggleJoin={onToggleJoin}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </div>
  );
};

// Recommended Clubs Panel
const RecommendedClubsPanel = ({ clubs, userClubs, onViewClub, onToggleJoin }) => {
  return (
    <div className="recommended-clubs-panel">
      {clubs.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="textSecondary">
            Aucun club recommandé pour le moment.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {clubs.map((club) => (
            <Grid item xs={12} sm={6} md={4} key={club.id}>
              <ClubCard 
                club={club}
                isJoined={userClubs.some(c => c.id === club.id)}
                onViewClub={onViewClub}
                onToggleJoin={onToggleJoin}
                isRecommended={true}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </div>
  );
};

// Club card component
const ClubCard = ({ club, isJoined, onViewClub, onToggleJoin, isRecommended }) => {
  return (
    <Card className="club-card">
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar 
            src={club.logo} 
            alt={club.name}
            sx={{ width: 60, height: 60, mr: 2 }}
          />
          <Box>
            <Typography variant="h6" component="div">
              {club.name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {club.location}
            </Typography>
          </Box>
        </Box>
        
        {isRecommended && (
          <Chip 
            label="Recommandé" 
            color="secondary" 
            size="small"
            sx={{ mb: 2 }}
          />
        )}
        
        <Typography variant="body2" color="textSecondary" paragraph>
          {club.description.substring(0, 100)}...
        </Typography>
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2">
            {club.members} membres
          </Typography>
          
          <Box>
            <Button 
              size="small"
              onClick={() => onViewClub(club)}
              sx={{ mr: 1 }}
            >
              Détails
            </Button>
            
            <Button 
              variant={isJoined ? 'outlined' : 'contained'}
              color={isJoined ? 'error' : 'primary'}
              size="small"
              onClick={() => onToggleJoin(club.id)}
            >
              {isJoined ? 'Quitter' : 'Rejoindre'}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// Generate mock clubs for development
const generateMockClubs = () => {
  return [
    {
      id: 'club1',
      name: 'Grand Est Cyclisme',
      logo: 'https://randomuser.me/api/portraits/men/32.jpg',
      location: 'Strasbourg, Alsace',
      region: 'Alsace',
      members: 247,
      description: 'Le plus grand club de cyclisme du Grand Est, nous organisons des sorties pour tous les niveaux et tous les types de pratique. Notre objectif est de promouvoir le cyclisme dans toute la région.',
      activities: ['Route', 'Gravel', 'Cyclosportives', 'Randonnées'],
      website: 'https://www.grandestcyclisme.fr',
      regularRides: [
        { name: 'Sortie du dimanche', day: 'Dimanche', time: '9h00', distance: 80, difficulty: 'Intermédiaire' },
        { name: 'Sortie débutants', day: 'Samedi', time: '14h00', distance: 40, difficulty: 'Facile' },
        { name: 'Sortie rapide', day: 'Mercredi', time: '18h00', distance: 60, difficulty: 'Difficile' }
      ],
      recommended: true
    },
    {
      id: 'club2',
      name: 'Strasbourg Vélo Club',
      logo: 'https://randomuser.me/api/portraits/women/44.jpg',
      location: 'Strasbourg, Alsace',
      region: 'Alsace',
      members: 156,
      description: 'Club historique de Strasbourg, nous organisons des sorties urbaines et péri-urbaines. Notre spécialité : les sorties à la découverte des pistes cyclables de l\'Eurométropole et de l\'Allemagne voisine.',
      activities: ['Route', 'Urbain', 'Cyclotourisme'],
      website: 'https://www.strasbourgveloclub.fr',
      regularRides: [
        { name: 'Tour de l\'Eurométropole', day: 'Dimanche', time: '10h00', distance: 45, difficulty: 'Facile' },
        { name: 'Strasbourg-Kehl', day: 'Samedi', time: '14h30', distance: 30, difficulty: 'Très facile' }
      ],
      recommended: false
    },
    {
      id: 'club3',
      name: 'Vosges Cycling Team',
      logo: 'https://randomuser.me/api/portraits/men/22.jpg',
      location: 'Gérardmer, Vosges',
      region: 'Vosges',
      members: 124,
      description: 'Notre club est spécialisé dans le cyclisme de montagne. Nous organisons des sorties dans les Vosges et proposons des entraînements spécifiques pour les cols et les longues montées.',
      activities: ['Route', 'Montagne', 'Cyclosportives'],
      website: 'https://www.vosgescycling.fr',
      regularRides: [
        { name: 'Tour des Crêtes', day: 'Dimanche', time: '8h30', distance: 100, difficulty: 'Difficile' },
        { name: 'Entraînement cols', day: 'Samedi', time: '9h00', distance: 70, difficulty: 'Difficile' }
      ],
      recommended: true
    },
    {
      id: 'club4',
      name: 'Vélo Détente Champagne',
      logo: 'https://randomuser.me/api/portraits/women/62.jpg',
      location: 'Reims, Champagne-Ardenne',
      region: 'Champagne-Ardenne',
      members: 93,
      description: 'Club orienté loisirs et découverte. Nous proposons des sorties à un rythme modéré pour découvrir les vignobles et les paysages de Champagne.',
      activities: ['Cyclotourisme', 'Oenotourisme', 'Randonnées'],
      website: 'https://www.velodétentechampagne.fr',
      regularRides: [
        { name: 'Route des vins', day: 'Dimanche', time: '9h30', distance: 50, difficulty: 'Modéré' },
        { name: 'Balade familiale', day: 'Samedi', time: '14h00', distance: 25, difficulty: 'Très facile' }
      ],
      recommended: false
    },
    {
      id: 'club5',
      name: 'Nancy Cyclo Club',
      logo: 'https://randomuser.me/api/portraits/men/62.jpg',
      location: 'Nancy, Lorraine',
      region: 'Lorraine',
      members: 115,
      description: 'Club dynamique proposant des sorties variées autour de Nancy. Notre spécialité : les sorties rapides de milieu de semaine pour les cyclistes occupés.',
      activities: ['Route', 'Gravel', 'Courses'],
      website: 'https://www.nancycycloclub.fr',
      regularRides: [
        { name: 'Sortie dominicale', day: 'Dimanche', time: '8h00', distance: 85, difficulty: 'Intermédiaire' },
        { name: 'Sortie express', day: 'Mardi', time: '18h30', distance: 40, difficulty: 'Soutenu' }
      ],
      recommended: false
    },
    {
      id: 'club6',
      name: 'Gravel Aventure Alsace',
      logo: 'https://randomuser.me/api/portraits/women/28.jpg',
      location: 'Colmar, Alsace',
      region: 'Alsace',
      members: 78,
      description: 'Premier club de la région dédié au gravel ! Nous explorons les chemins, forêts et sentiers d\'Alsace sur nos vélos polyvalents.',
      activities: ['Gravel', 'Bikepacking', 'Aventure'],
      website: 'https://www.gravelalasace.fr',
      regularRides: [
        { name: 'Aventure forestière', day: 'Dimanche', time: '8h30', distance: 70, difficulty: 'Intermédiaire' },
        { name: 'Initiation gravel', day: 'Samedi', time: '10h00', distance: 40, difficulty: 'Facile' }
      ],
      recommended: true
    }
  ];
};

export default ClubsDirectory;
