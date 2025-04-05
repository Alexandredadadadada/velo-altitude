import React, { memo } from 'react';
import { 
  Grid, Card, CardContent, Typography, Box, Button, Divider,
  Alert, Paper, List, ListItem, ListItemText, ListItemIcon,
  ListItemButton, Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMapMarkedAlt, faUsers, faBicycle, faCalendarAlt,
  faRoute, faBuilding, faMapPin, faCloud, faSun, faCloudRain
} from '@fortawesome/free-solid-svg-icons';
import { useCommunity } from '../../contexts/CommunityContext';
import { useNotification } from '../../components/common/NotificationSystem';
import { useFeatureFlags } from '../../services/featureFlags';

// Données de démonstration
const mockRegionData = {
  clubs: [
    { id: 'club1', name: 'Club Cycliste du Haut-Rhin', members: 87, location: 'Colmar', events: 4 },
    { id: 'club2', name: 'Cyclomontagnards d\'Alsace', members: 63, location: 'Strasbourg', events: 3 },
    { id: 'club3', name: 'Vélo Club Transfrontalier', members: 52, location: 'Saint-Louis', events: 2 }
  ],
  popularRoutes: [
    { id: 'route1', name: 'Tour du Grand Ballon', distance: 76, elevation: 1424, popularity: 4.8 },
    { id: 'route2', name: 'Circuit des 3 châteaux', distance: 45, elevation: 780, popularity: 4.6 },
    { id: 'route3', name: 'Traversée des Vosges du Nord', distance: 120, elevation: 2100, popularity: 4.9 }
  ],
  weatherForecast: [
    { day: 'Aujourd\'hui', temp: 18, condition: 'sunny', wind: 12 },
    { day: 'Demain', temp: 16, condition: 'partly_cloudy', wind: 15 },
    { day: 'Après-demain', temp: 14, condition: 'rain', wind: 20 }
  ]
};

// Styles personnalisés
const StyledCardHeader = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.default
}));

const StatValue = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(1, 0),
  '&:not(:last-child)': {
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}));

const WeatherIcon = ({ condition }) => {
  const getIcon = () => {
    switch (condition) {
      case 'sunny':
        return faSun;
      case 'partly_cloudy':
        return faCloud;
      case 'rain':
        return faCloudRain;
      default:
        return faCloud;
    }
  };
  
  return <FontAwesomeIcon icon={getIcon()} />;
};

// Section Région complète
const RegionSection = () => {
  const { userProfile, communityStats } = useCommunity();
  const { isFeatureEnabled } = useCommunity();
  const { isEnabled } = useFeatureFlags();
  const { notify } = useNotification();
  
  const regionData = mockRegionData;
  
  const handleJoinClub = (clubId) => {
    const club = regionData.clubs.find(c => c.id === clubId);
    if (club) {
      notify.success(`Demande d'adhésion envoyée au club ${club.name}`);
    }
  };
  
  return (
    <Grid container spacing={4}>
      <Grid item xs={12} md={8}>
        <Card>
          <StyledCardHeader 
            title={
              <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
                <FontAwesomeIcon icon={faMapMarkedAlt} style={{ marginRight: '8px' }} />
                Votre région - {userProfile?.region || 'Non définie'}
              </Typography>
            }
          />
          <CardContent>
            {userProfile?.region ? (
              <div className="region-info">
                <Typography variant="body1" paragraph>
                  Connectez-vous avec des cyclistes et clubs locaux pour découvrir 
                  de nouveaux parcours et participer à des événements régionaux.
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <StatValue>
                    <span>Cyclistes dans votre région:</span>
                    <strong>{communityStats?.regionRiders || 0}</strong>
                  </StatValue>
                  <StatValue>
                    <span>Clubs actifs:</span>
                    <strong>{regionData.clubs.length}</strong>
                  </StatValue>
                  <StatValue>
                    <span>Parcours populaires:</span>
                    <strong>{regionData.popularRoutes.length}</strong>
                  </StatValue>
                </Box>
                
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Clubs cyclistes dans votre région
                  </Typography>
                  
                  <List>
                    {regionData.clubs.map((club) => (
                      <Paper key={club.id} sx={{ mb: 2 }}>
                        <ListItem 
                          secondaryAction={
                            <Button 
                              variant="outlined" 
                              size="small"
                              onClick={() => handleJoinClub(club.id)}
                            >
                              Contacter
                            </Button>
                          }
                          disablePadding
                        >
                          <ListItemButton>
                            <ListItemIcon>
                              <FontAwesomeIcon icon={faBuilding} size="lg" />
                            </ListItemIcon>
                            <ListItemText 
                              primary={club.name} 
                              secondary={
                                <Box component="span">
                                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', mr: 2 }}>
                                    <FontAwesomeIcon icon={faMapPin} style={{ marginRight: '4px', fontSize: '0.8rem' }} />
                                    {club.location}
                                  </Box>
                                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', mr: 2 }}>
                                    <FontAwesomeIcon icon={faUsers} style={{ marginRight: '4px', fontSize: '0.8rem' }} />
                                    {club.members} membres
                                  </Box>
                                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                    <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: '4px', fontSize: '0.8rem' }} />
                                    {club.events} événements
                                  </Box>
                                </Box>
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                      </Paper>
                    ))}
                  </List>
                </Box>
                
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Parcours populaires
                  </Typography>
                  
                  <List>
                    {regionData.popularRoutes.map((route) => (
                      <Paper key={route.id} sx={{ mb: 2 }}>
                        <ListItem 
                          secondaryAction={
                            <Chip 
                              icon={<FontAwesomeIcon icon={faBicycle} />} 
                              label={`${route.popularity}/5`} 
                              color="primary"
                            />
                          }
                          disablePadding
                        >
                          <ListItemButton>
                            <ListItemIcon>
                              <FontAwesomeIcon icon={faRoute} size="lg" />
                            </ListItemIcon>
                            <ListItemText 
                              primary={route.name} 
                              secondary={
                                <Box component="span">
                                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', mr: 2 }}>
                                    <FontAwesomeIcon icon={faBicycle} style={{ marginRight: '4px', fontSize: '0.8rem' }} />
                                    {route.distance} km
                                  </Box>
                                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                    <FontAwesomeIcon icon={faMapMarkedAlt} style={{ marginRight: '4px', fontSize: '0.8rem' }} />
                                    {route.elevation} m D+
                                  </Box>
                                </Box>
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                      </Paper>
                    ))}
                  </List>
                </Box>
              </div>
            ) : (
              <Alert severity="warning">
                Région non définie. Veuillez mettre à jour votre profil pour voir les informations régionales.
              </Alert>
            )}
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={4}>
        {isEnabled('enableRealTimeWeather') && (
          <Card>
            <StyledCardHeader 
              title={
                <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
                  <FontAwesomeIcon icon={faCloud} style={{ marginRight: '8px' }} />
                  Météo pour cyclistes
                </Typography>
              }
            />
            <CardContent>
              <List>
                {regionData.weatherForecast.map((day, index) => (
                  <React.Fragment key={day.day}>
                    <ListItem>
                      <ListItemIcon>
                        <WeatherIcon condition={day.condition} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={day.day} 
                        secondary={
                          <Box component="span">
                            <Typography variant="body2" component="span">
                              {day.temp}°C, vent {day.wind} km/h
                            </Typography>
                            {day.condition === 'rain' && (
                              <Typography variant="body2" color="error">
                                Conditions défavorables pour le vélo
                              </Typography>
                            )}
                            {day.condition === 'sunny' && day.temp > 15 && (
                              <Typography variant="body2" color="success.main">
                                Conditions idéales pour le vélo
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <Chip 
                        label={
                          day.condition === 'sunny' ? 'Idéal' : 
                          day.condition === 'partly_cloudy' ? 'Correct' : 'Délicat'
                        }
                        color={
                          day.condition === 'sunny' ? 'success' : 
                          day.condition === 'partly_cloudy' ? 'primary' : 'error'
                        }
                        size="small"
                      />
                    </ListItem>
                    {index < regionData.weatherForecast.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
              
              <Box sx={{ mt: 2 }}>
                <Alert severity="info" sx={{ mb: 0 }}>
                  <Typography variant="body2">
                    Les prévisions sont mises à jour toutes les 3 heures.
                  </Typography>
                </Alert>
              </Box>
            </CardContent>
          </Card>
        )}
        
        {/* Section d'actualités régionales */}
        <Card sx={{ mt: 3 }}>
          <StyledCardHeader 
            title={
              <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
                <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: '8px' }} />
                Actualités cyclistes
              </Typography>
            }
          />
          <CardContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              Nouvelle piste cyclable inaugurée entre Strasbourg et Colmar.
            </Alert>
            <Alert severity="success" sx={{ mb: 2 }}>
              Le Tour Alsace 2025 passera par votre région le 15 juillet.
            </Alert>
            <Alert severity="warning" sx={{ mb: 0 }}>
              Travaux sur la route des crêtes jusqu'au 30 mai.
            </Alert>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default RegionSection;
