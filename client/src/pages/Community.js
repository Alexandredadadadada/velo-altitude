import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Tab,
  Tabs,
  Button,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Badge,
  useMediaQuery
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import ForumIcon from '@mui/icons-material/Forum';
import MapIcon from '@mui/icons-material/Map';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import MessageIcon from '@mui/icons-material/Message';
import { CommunityProvider } from '../contexts/CommunityContext';

// Importation des composants de la communauté
import ForumsList from '../components/community/forums/ForumsList';
import ForumTopicList from '../components/community/forums/ForumTopicList';
import ForumTopic from '../components/community/forums/ForumTopic';
import NewTopicForm from '../components/community/forums/NewTopicForm';
import RouteSharing from '../components/community/sharing/RouteSharing';
import RouteGallery from '../components/community/sharing/RouteGallery';
import RouteDetail from '../components/community/sharing/RouteDetail';

// Styles personnalisés
const StyledTabs = styled(Tabs)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  '& .MuiTab-root': {
    minWidth: 80,
    fontWeight: theme.typography.fontWeightMedium,
    textTransform: 'none',
    fontSize: '0.9rem',
    [theme.breakpoints.up('sm')]: {
      fontSize: '1rem',
    },
  },
}));

const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`community-tabpanel-${index}`}
      aria-labelledby={`community-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const SidebarCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const Community = () => {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Détecter l'onglet actif en fonction de l'URL
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/forums')) return 0;
    if (path.includes('/routes')) return 1;
    if (path.includes('/events')) return 2;
    if (path.includes('/ranking')) return 3;
    if (path.includes('/users')) return 4;
    if (path.includes('/messages')) return 5;
    return 0;
  };
  
  const [tabValue, setTabValue] = useState(getActiveTabFromPath());
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Données simulées pour le sidebar
  const upcomingEvents = [
    { id: 1, title: 'Tour du Mont Blanc', date: '15 juillet 2025', participants: 45 },
    { id: 2, title: 'Randonnée des Vosges', date: '29 août 2025', participants: 28 },
  ];
  
  const topCyclists = [
    { id: 1, name: 'Marie Dufour', points: 1250, avatar: '/images/profiles/user1.jpg' },
    { id: 2, name: 'Thomas Laurent', points: 980, avatar: '/images/profiles/user2.jpg' },
    { id: 3, name: 'Sophie Moreau', points: 875, avatar: '/images/profiles/user3.jpg' },
  ];
  
  const renderSidebar = () => (
    <Box>
      <SidebarCard>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Événements à venir
          </Typography>
          <List dense>
            {upcomingEvents.map((event) => (
              <ListItem key={event.id} button component={Link} to={`/community/events/${event.id}`}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                    <EventIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={event.title}
                  secondary={`${event.date} • ${event.participants} participants`}
                />
              </ListItem>
            ))}
          </List>
          <Button
            fullWidth
            variant="outlined"
            component={Link}
            to="/community/events"
            sx={{ mt: 1 }}
          >
            Voir tous les événements
          </Button>
        </CardContent>
      </SidebarCard>
      
      <SidebarCard>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Top cyclistes
          </Typography>
          <List dense>
            {topCyclists.map((cyclist) => (
              <ListItem key={cyclist.id} button component={Link} to={`/community/users/${cyclist.id}`}>
                <ListItemAvatar>
                  <Avatar src={cyclist.avatar} alt={cyclist.name} />
                </ListItemAvatar>
                <ListItemText
                  primary={cyclist.name}
                  secondary={`${cyclist.points} points`}
                />
              </ListItem>
            ))}
          </List>
          <Button
            fullWidth
            variant="outlined"
            component={Link}
            to="/community/ranking"
            sx={{ mt: 1 }}
          >
            Voir le classement complet
          </Button>
        </CardContent>
      </SidebarCard>
      
      <SidebarCard>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Rejoignez la communauté
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Partagez vos expériences, participez aux événements et connectez-vous avec d'autres passionnés de cyclisme.
          </Typography>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            component={Link}
            to="/register"
          >
            S'inscrire maintenant
          </Button>
        </CardContent>
      </SidebarCard>
    </Box>
  );
  
  // Navigation tabs
  const tabs = [
    { label: 'Forums', icon: <ForumIcon />, path: '/community/forums' },
    { label: 'Itinéraires', icon: <MapIcon />, path: '/community/routes' },
    { label: 'Événements', icon: <EventIcon />, path: '/community/events' },
    { label: 'Classement', icon: <EmojiEventsIcon />, path: '/community/ranking' },
    { label: 'Membres', icon: <PeopleIcon />, path: '/community/users' },
    { label: 'Messages', icon: <MessageIcon />, path: '/community/messages', badge: 3 },
  ];

  return (
    <CommunityProvider>
      <Box sx={{ flexGrow: 1, py: 3 }}>
        <Container maxWidth="xl">
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ mb: 3 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <StyledTabs
                    value={tabValue}
                    onChange={handleTabChange}
                    aria-label="community tabs"
                    variant={isMobile ? "scrollable" : "standard"}
                    scrollButtons={isMobile ? "auto" : false}
                  >
                    {tabs.map((tab, index) => (
                      <Tab
                        key={index}
                        component={Link}
                        to={tab.path}
                        label={
                          tab.badge ? (
                            <Badge badgeContent={tab.badge} color="error">
                              {tab.label}
                            </Badge>
                          ) : (
                            tab.label
                          )
                        }
                        icon={tab.icon}
                        iconPosition="start"
                      />
                    ))}
                  </StyledTabs>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={8} lg={9}>
              <Routes>
                {/* Routes Forums */}
                <Route path="/" element={<Navigate to="forums" replace />} />
                <Route path="forums" element={<ForumsList />} />
                <Route path="forums/:forumId" element={<ForumTopicList />} />
                <Route path="forums/:forumId/new-topic" element={<NewTopicForm />} />
                <Route path="forums/:forumId/topics/:topicId" element={<ForumTopic />} />
                
                {/* Routes Itinéraires */}
                <Route path="routes" element={<RouteGallery />} />
                <Route path="routes/create" element={<RouteSharing />} />
                <Route path="routes/:routeId" element={<RouteDetail />} />
                <Route path="routes/edit/:routeId" element={<RouteSharing isEdit={true} />} />
                
                {/* Autres routes à implémenter */}
                <Route path="events" element={
                  <Box sx={{ textAlign: 'center', py: 5 }}>
                    <Typography variant="h5" gutterBottom>
                      Événements à venir
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      Cette section est en cours de développement
                    </Typography>
                  </Box>
                } />
                
                <Route path="ranking" element={
                  <Box sx={{ textAlign: 'center', py: 5 }}>
                    <Typography variant="h5" gutterBottom>
                      Classement des cyclistes
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      Cette section est en cours de développement
                    </Typography>
                  </Box>
                } />
                
                <Route path="users" element={
                  <Box sx={{ textAlign: 'center', py: 5 }}>
                    <Typography variant="h5" gutterBottom>
                      Membres de la communauté
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      Cette section est en cours de développement
                    </Typography>
                  </Box>
                } />
                
                <Route path="messages" element={
                  <Box sx={{ textAlign: 'center', py: 5 }}>
                    <Typography variant="h5" gutterBottom>
                      Messagerie privée
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      Cette section est en cours de développement
                    </Typography>
                  </Box>
                } />
                
                <Route path="*" element={<Navigate to="forums" replace />} />
              </Routes>
            </Grid>
            
            {/* Sidebar - Masqué sur mobile */}
            {!isMobile && (
              <Grid item md={4} lg={3}>
                {renderSidebar()}
              </Grid>
            )}
          </Grid>
        </Container>
      </Box>
    </CommunityProvider>
  );
};

export default Community;
