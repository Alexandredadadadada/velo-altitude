import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Avatar,
  Grid,
  Tabs,
  Tab,
  CircularProgress,
  Container,
  Card,
  CardContent,
  Chip,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Group as GroupIcon,
  Route as RouteIcon,
  Event as EventIcon,
  Person as PersonIcon,
  DynamicFeed as FeedIcon
} from '@mui/icons-material';
import CommunityFeed from './CommunityFeed';
import RouteSharing from './RouteSharing';
import EventsCalendar from './EventsCalendar';
import UserProfile from './UserProfile';
import ClubsDirectory from './ClubsDirectory';

/**
 * SocialHub component integrating community features, route sharing, events, and user profiles
 * @param {Object} props - Component properties
 * @param {string} props.userId - Current user ID
 * @param {string} props.initialView - Initial view to display (feed, routes, events, profile, clubs)
 * @param {Function} props.onViewChange - Callback function when view changes
 */
const SocialHub = ({ userId, initialView = 'feed', onViewChange }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeView, setActiveView] = useState(initialView);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        // In a real implementation, this would be an API call
        // const response = await axios.get(`/api/users/${userId}`);
        // setUserData(response.data);
        
        // Mock user data for development
        setUserData({
          id: userId || 'user123',
          name: 'Jean Dupont',
          level: 'intermediate',
          location: 'Strasbourg, France',
          profileImage: 'https://randomuser.me/api/portraits/men/32.jpg',
          following: 68,
          followers: 42,
          totalRides: 156,
          totalDistance: 3840,
          clubs: [
            { id: 'club1', name: 'Grand Est Cyclisme' },
            { id: 'club2', name: 'Strasbourg Vélo Club' }
          ],
          achievements: [
            { id: 'ach1', name: 'Ascension du Galibier', date: '2025-03-15' },
            { id: 'ach2', name: '1000 km parcourus', date: '2025-02-28' },
            { id: 'ach3', name: 'Premier événement', date: '2025-01-10' }
          ]
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId]);
  
  // Synchronize with initialView when it changes
  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);
  
  // Navigation handler
  const handleNavigation = (view) => {
    setActiveView(view);
    // Call the callback if provided
    if (onViewChange) {
      onViewChange(view);
    }
  };
  
  // TabPanel component for managing tab content
  const TabPanel = (props) => {
    const { children, value, index, ...other } = props;
    return (
      <Box
        role="tabpanel"
        hidden={value !== index}
        id={`social-tabpanel-${index}`}
        aria-labelledby={`social-tab-${index}`}
        sx={{ pt: 3 }}
        {...other}
      >
        {value === index && children}
      </Box>
    );
  };
  
  // Get tab index from active view
  const getTabIndex = () => {
    const views = ['feed', 'routes', 'events', 'clubs', 'profile'];
    return views.indexOf(activeView);
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    const views = ['feed', 'routes', 'events', 'clubs', 'profile'];
    handleNavigation(views[newValue]);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="xl">
      <Paper sx={{ p: 2, mb: 4 }} elevation={1}>
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Typography variant="h5" component="h2">
                Hub Social
              </Typography>
            </Grid>
            <Grid item xs />
            <Grid item>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  src={userData.profileImage} 
                  alt={userData.name}
                  sx={{ width: 40, height: 40, mr: 1 }}
                />
                <Box>
                  <Typography variant="subtitle1" sx={{ lineHeight: 1.2 }}>
                    {userData.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                    {userData.location}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
        
        <Paper sx={{ borderRadius: 1, mb: 3 }} elevation={0}>
          <Tabs 
            value={getTabIndex()} 
            onChange={handleTabChange}
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons={isMobile ? "auto" : false}
            aria-label="Social hub navigation"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              icon={<FeedIcon />} 
              label={isMobile ? "" : "Fil d'actualité"} 
              iconPosition={isMobile ? "top" : "start"}
              aria-label="Fil d'actualité"
            />
            <Tab 
              icon={<RouteIcon />} 
              label={isMobile ? "" : "Partage d'itinéraires"} 
              iconPosition={isMobile ? "top" : "start"}
              aria-label="Partage d'itinéraires"
            />
            <Tab 
              icon={<EventIcon />} 
              label={isMobile ? "" : "Événements"} 
              iconPosition={isMobile ? "top" : "start"}
              aria-label="Événements"
            />
            <Tab 
              icon={<GroupIcon />} 
              label={isMobile ? "" : "Clubs"} 
              iconPosition={isMobile ? "top" : "start"}
              aria-label="Clubs"
            />
            <Tab 
              icon={<PersonIcon />} 
              label={isMobile ? "" : "Mon profil"} 
              iconPosition={isMobile ? "top" : "start"}
              aria-label="Mon profil"
            />
          </Tabs>
        </Paper>
        
        <Box sx={{ minHeight: '60vh' }}>
          <TabPanel value={getTabIndex()} index={0}>
            <CommunityFeed userId={userData.id} />
          </TabPanel>
          
          <TabPanel value={getTabIndex()} index={1}>
            <RouteSharing userId={userData.id} />
          </TabPanel>
          
          <TabPanel value={getTabIndex()} index={2}>
            <EventsCalendar userId={userData.id} />
          </TabPanel>
          
          <TabPanel value={getTabIndex()} index={3}>
            <ClubsDirectory userId={userData.id} userClubs={userData.clubs} />
          </TabPanel>
          
          <TabPanel value={getTabIndex()} index={4}>
            <UserProfile userData={userData} />
          </TabPanel>
        </Box>
      </Paper>
    </Container>
  );
};

export default SocialHub;
