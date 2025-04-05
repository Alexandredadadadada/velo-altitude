import React, { memo, lazy, Suspense } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, faCalendarAlt, faTrophy, faMapMarkedAlt, 
  faUsers, faUserFriends, faAward, faBicycle, faChartLine 
} from '@fortawesome/free-solid-svg-icons';
import { 
  Container, Grid, Card, CardContent, Typography, Box, Paper, 
  Tabs, Tab, Button, Avatar, Divider, CircularProgress,
  LinearProgress, Alert, Chip, Skeleton
} from '@mui/material';
import { useCommunity } from '../contexts/CommunityContext';
import { useNotification } from '../components/common/NotificationSystem';
import { useFeatureFlags } from '../services/featureFlags';
import CommunityActivityFeed from '../components/community/CommunityActivityFeed';

// Lazy loading des sections pour améliorer les performances
const EventsSection = lazy(() => import('./community/EventsSection'));
const ChallengesSection = lazy(() => import('./community/ChallengesSection'));
const RegionSection = lazy(() => import('./community/RegionSection'));

// Composant de chargement
const LoadingComponent = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
    <CircularProgress />
    <Typography variant="body2" sx={{ ml: 2 }}>
      Chargement en cours...
    </Typography>
  </Box>
);

// Styles personnalisés
const StyledTabs = styled(Tabs)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main,
    height: 3
  }
}));

const StyledCardHeader = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.default
}));

const EventCard = styled(Card)(({ theme, joined }) => ({
  marginBottom: theme.spacing(2),
  border: joined ? `1px solid ${theme.palette.success.main}` : `1px solid ${theme.palette.divider}`,
  '&:hover': {
    boxShadow: theme.shadows[3]
  },
  position: 'relative',
  '&::before': joined ? {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '4px',
    height: '100%',
    backgroundColor: theme.palette.success.main
  } : {}
}));

// Component de navigation de l'onglet
const TabNavigation = memo(function TabNavigation() {
  const location = useLocation();
  const { t } = useTranslation();
  const { isFeatureEnabled } = useCommunity();
  
  const getPath = (path) => {
    return `/community${path}`;
  };
  
  const isActive = (path) => {
    return location.pathname === getPath(path) || 
           (path === '' && location.pathname === '/community') ||
           (path !== '' && location.pathname.startsWith(getPath(path)));
  };

  return (
    <Paper elevation={0} sx={{ mb: 3 }}>
      <StyledTabs 
        value={isActive('') ? 0 : isActive('/events') ? 1 : isActive('/challenges') ? 2 : isActive('/region') ? 3 : 0}
        aria-label="Navigation du tableau de bord communautaire"
      >
        <Tab 
          icon={<FontAwesomeIcon icon={faHome} />} 
          iconPosition="start" 
          label="Vue d'ensemble" 
          component={Link} 
          to={getPath('')}
          aria-label="Vue d'ensemble de la communauté"
        />
        <Tab 
          icon={<FontAwesomeIcon icon={faCalendarAlt} />} 
          iconPosition="start" 
          label="Événements" 
          component={Link} 
          to={getPath('/events')}
          aria-label="Événements cyclistes à venir"
        />
        {isFeatureEnabled('enableMonthlyChallenge') && (
          <Tab 
            icon={<FontAwesomeIcon icon={faTrophy} />} 
            iconPosition="start" 
            label="Défis" 
            component={Link} 
            to={getPath('/challenges')}
            aria-label="Défis cyclistes"
          />
        )}
        <Tab 
          icon={<FontAwesomeIcon icon={faMapMarkedAlt} />} 
          iconPosition="start" 
          label="Région" 
          component={Link} 
          to={getPath('/region')}
          aria-label="Informations sur votre région"
        />
      </StyledTabs>
    </Paper>
  );
});

// Main Component
const CommunityDashboard = () => {
  const { t } = useTranslation();
  const { userProfile, communityStats, loading } = useCommunity();
  const { notify } = useNotification();
  const { isEnabled } = useFeatureFlags();

  // Si les données sont en cours de chargement, afficher une interface de chargement
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Tableau de bord communautaire
        </Typography>
        
        <Paper sx={{ p: 2, mb: 3 }}>
          <Skeleton variant="rectangular" height={150} />
        </Paper>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={350} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={350} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  // Vue principale du tableau de bord communautaire
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Tableau de bord communautaire
      </Typography>
      
      <TabNavigation />
      
      <Routes>
        <Route path="/" element={<OverviewSection userProfile={userProfile} communityStats={communityStats} />} />
        <Route path="/events" element={
          <Suspense fallback={<LoadingComponent />}>
            <EventsSection />
          </Suspense>
        } />
        {isEnabled('enableMonthlyChallenge') && (
          <Route path="/challenges" element={
            <Suspense fallback={<LoadingComponent />}>
              <ChallengesSection />
            </Suspense>
          } />
        )}
        <Route path="/region" element={
          <Suspense fallback={<LoadingComponent />}>
            <RegionSection />
          </Suspense>
        } />
        <Route path="*" element={<Navigate to="/community" replace />} />
      </Routes>
    </Container>
  );
};

// Section Vue d'ensemble
const OverviewSection = memo(({ userProfile, communityStats }) => {
  const { t } = useTranslation();
  const { isFeatureEnabled } = useCommunity();

  return (
    <Grid container spacing={4}>
      {/* Profile Card */}
      <Grid item lg={4}>
        <Card>
          <CardContent>
            <Box display="flex" flexDirection="column" alignItems="center" sx={{ mb: 2 }}>
              <Avatar 
                src={userProfile.avatar} 
                alt={userProfile.fullName}
                sx={{ width: 80, height: 80, mb: 2 }}
              />
              <Typography variant="h6" component="h2">
                {userProfile.fullName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                @{userProfile.username}
              </Typography>
              
              <Box display="flex" sx={{ mt: 1 }}>
                <Box sx={{ textAlign: 'center', mr: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Abonnés
                  </Typography>
                  <Typography variant="h6">
                    {userProfile.followers}
                  </Typography>
                </Box>
                
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Abonnements
                  </Typography>
                  <Typography variant="h6">
                    {userProfile.following}
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box>
              <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="body2">Région</Typography>
                <Typography variant="body2" fontWeight="bold">{userProfile.region}</Typography>
              </Box>
              
              <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="body2">Niveau</Typography>
                <Typography variant="body2" fontWeight="bold">{userProfile.level}</Typography>
              </Box>
              
              <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="body2">Points</Typography>
                <Typography variant="body2" fontWeight="bold">{userProfile.points}</Typography>
              </Box>
              
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Réussites</Typography>
                <Typography variant="body2" fontWeight="bold">{userProfile.achievementCount}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Community Stats Card */}
      <Grid item lg={8}>
        <Card>
          <StyledCardHeader
            title={
              <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
                <FontAwesomeIcon icon={faUsers} style={{ marginRight: '8px' }} />
                Statistiques communautaires
              </Typography>
            }
          />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <FontAwesomeIcon icon={faUserFriends} size="2x" style={{ color: '#3f51b5', marginBottom: '8px' }} />
                  <Typography variant="h6">{communityStats.totalMembers}</Typography>
                  <Typography variant="body2" color="text.secondary">Membres</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <FontAwesomeIcon icon={faBicycle} size="2x" style={{ color: '#4caf50', marginBottom: '8px' }} />
                  <Typography variant="h6">{communityStats.activeMembers}</Typography>
                  <Typography variant="body2" color="text.secondary">Actifs ce mois</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <FontAwesomeIcon icon={faTrophy} size="2x" style={{ color: '#ff9800', marginBottom: '8px' }} />
                  <Typography variant="h6">{communityStats.activeChallenges}</Typography>
                  <Typography variant="body2" color="text.secondary">Défis actifs</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <FontAwesomeIcon icon={faAward} size="2x" style={{ color: '#f44336', marginBottom: '8px' }} />
                  <Typography variant="h6">{communityStats.yourRank}</Typography>
                  <Typography variant="body2" color="text.secondary">Votre classement</Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="subtitle1" component="h3" gutterBottom>
              Activité hebdomadaire
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={1}>
                {communityStats.weeklyActivity.map((value, index) => (
                  <Grid item xs key={index}>
                    <Box sx={{ height: '100px', position: 'relative' }}>
                      <Box 
                        sx={{ 
                          position: 'absolute', 
                          bottom: 0, 
                          left: 0, 
                          right: 0,
                          height: `${(value / Math.max(...communityStats.weeklyActivity)) * 100}%`,
                          backgroundColor: 'primary.main',
                          borderTopLeftRadius: '4px',
                          borderTopRightRadius: '4px',
                        }}
                      />
                    </Box>
                    <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                      {['L', 'M', 'M', 'J', 'V', 'S', 'D'][index]}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Box>
            
            {isFeatureEnabled('enableRealTimeWeather') && (
              <Box mt={3}>
                <Alert severity="info">
                  Prévisions météo pour cyclistes disponibles. Consultez la section Région pour plus de détails.
                </Alert>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
      
      {/* Upcoming Events Section - Loaded conditionally with Suspense */}
      <Grid item lg={12}>
        <Card>
          <StyledCardHeader
            title={
              <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
                <FontAwesomeIcon icon={faChartLine} style={{ marginRight: '8px' }} />
                Activités de la communauté
              </Typography>
            }
          />
          <CardContent>
            <CommunityActivityFeed limit={5} />
          </CardContent>
        </Card>
      </Grid>
      
      {/* Upcoming Events Section - Loaded conditionally with Suspense */}
      <Grid item lg={12}>
        <Suspense fallback={<Skeleton variant="rectangular" height={350} />}>
          <EventsSection />
        </Suspense>
      </Grid>
    </Grid>
  );
});

// Composant pour afficher une carte d'événement
const EventCardItem = memo(({ event, formatDate, handleJoinEvent, handleLeaveEvent }) => {
  const { notify } = useNotification();
  
  const handleJoin = (eventId) => {
    try {
      handleJoinEvent(eventId);
    } catch (error) {
      notify.error('Une erreur est survenue lors de l\'inscription à l\'événement', error);
    }
  };
  
  const handleLeave = (eventId) => {
    try {
      handleLeaveEvent(eventId);
    } catch (error) {
      notify.error('Une erreur est survenue lors de l\'annulation de votre participation', error);
    }
  };
  
  return (
    <EventCard 
      joined={event.joined}
      tabIndex={0}
      aria-label={`Événement: ${event.title} à ${event.location} le ${formatDate(event.date)}`}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h6" component="h3">{event.title}</Typography>
            <Box sx={{ mb: 2 }}>
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', mr: 3 }}>
                <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: '4px', color: 'text.secondary' }} />
                <Typography variant="body2" component="span">{formatDate(event.date)} | {event.time}</Typography>
              </Box>
              
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                <FontAwesomeIcon icon={faMapMarkedAlt} style={{ marginRight: '4px', color: 'text.secondary' }} />
                <Typography variant="body2" component="span">{event.location}</Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ px: 3, py: 1, bgcolor: 'background.paper', borderRadius: 1, textAlign: 'center' }}>
            <Typography variant="body1" fontWeight="bold">{event.distance} km</Typography>
            <Typography variant="body2">{event.participants} participants</Typography>
          </Box>
        </Box>
        
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Organisé par {event.organizer}
          </Typography>
          
          {event.joined ? (
            <Button 
              variant="outlined" 
              color="error" 
              size="small"
              onClick={() => handleLeave(event.id)}
              aria-label={`Annuler votre participation à l'événement ${event.title}`}
            >
              Annuler participation
            </Button>
          ) : (
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => handleJoin(event.id)}
              aria-label={`Participer à l'événement ${event.title}`}
            >
              Participer
            </Button>
          )}
        </Box>
      </CardContent>
    </EventCard>
  );
});

export default CommunityDashboard;
