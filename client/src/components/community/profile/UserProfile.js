import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Button,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Badge,
  useMediaQuery
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import MessageIcon from '@mui/icons-material/Message';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import TerrainIcon from '@mui/icons-material/Terrain';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MapIcon from '@mui/icons-material/Map';
import ForumIcon from '@mui/icons-material/Forum';
import PeopleIcon from '@mui/icons-material/People';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import StarIcon from '@mui/icons-material/Star';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCommunity } from '../../../contexts/CommunityContext';
import { useAuth } from '../../../context/AuthContext';

// Composants stylisés
const ProfileHeader = styled(Box)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(3),
  boxShadow: theme.shadows[1],
}));

const CoverPhoto = styled(Box)(({ theme }) => ({
  height: 200,
  borderRadius: theme.shape.borderRadius,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  marginBottom: theme.spacing(6),
  [theme.breakpoints.down('sm')]: {
    height: 150,
  },
}));

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  border: `4px solid ${theme.palette.background.paper}`,
  position: 'absolute',
  bottom: theme.spacing(2),
  left: theme.spacing(4),
  zIndex: 2,
  [theme.breakpoints.down('sm')]: {
    width: 90,
    height: 90,
    left: theme.spacing(2),
  },
}));

const LevelBadge = styled(Chip)(({ theme, level }) => {
  const getColor = () => {
    switch (level) {
      case 'Expert': return 'error';
      case 'Confirmé': return 'warning';
      case 'Intermédiaire': return 'info';
      case 'Débutant': return 'success';
      default: return 'default';
    }
  };
  
  return {
    fontWeight: 'bold',
    backgroundColor: theme.palette[getColor()].main,
    color: theme.palette[getColor()].contrastText,
  };
});

const StatCard = styled(Card)(({ theme }) => ({
  height: '100%',
  boxShadow: theme.shadows[1],
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[3],
  },
}));

const UserProfile = () => {
  const { userId } = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAuthenticated, user } = useAuth();
  const { loading, formatDate } = useCommunity();
  
  // États
  const [profile, setProfile] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isFriend, setIsFriend] = useState(false);
  
  // Données mock de profil utilisateur
  const mockUser = {
    id: userId,
    name: 'Thomas Laurent',
    username: 'thomas83',
    avatar: '/images/profiles/user2.jpg',
    coverPhoto: '/images/profiles/cover-photo.jpg',
    bio: "Passionné de cyclisme depuis 15 ans, spécialisé dans les cols des Vosges et des Alpes. En quête constante de nouveaux défis et d'amélioration personnelle.",
    level: 'Confirmé',
    team: 'Cyclistes des Vosges',
    location: 'Strasbourg, Grand Est',
    joinDate: '2024-01-15T00:00:00Z',
    lastActive: '2025-04-02T14:30:00Z',
    socialLinks: {
      facebook: 'https://facebook.com/thomaslaurent',
      instagram: 'https://instagram.com/thomas_cyclist',
      twitter: 'https://twitter.com/thomas_cyclist',
      youtube: null,
      linkedin: null,
    },
    stats: {
      rank: 2,
      points: 980,
      totalDistance: 3482,
      totalElevation: 52300,
      routesShared: 12,
      challenges: 8,
      kudosReceived: 156,
      forumTopics: 5,
      forumReplies: 23,
    },
    badges: [
      { id: 'badge1', title: 'Conquérant des Vosges', icon: 'terrain', description: 'A gravi tous les cols majeurs des Vosges', date: '2024-08-15T00:00:00Z' },
      { id: 'badge2', title: 'Grand Voyageur', icon: 'map', description: 'A parcouru plus de 3000 km en une saison', date: '2024-10-20T00:00:00Z' },
      { id: 'badge3', title: 'Contributeur Actif', icon: 'forum', description: 'A créé plus de 5 sujets de forum', date: '2024-09-05T00:00:00Z' },
    ],
    activities: [
      { id: 'activity1', type: 'challenge', title: 'Défi du Ventoux', date: '2025-03-28T00:00:00Z', description: 'A complété le défi du Mont Ventoux', points: 150 },
      { id: 'activity2', type: 'route', title: 'Tour des Ballons', date: '2025-03-15T00:00:00Z', description: 'A partagé un nouvel itinéraire', points: 20 },
      { id: 'activity3', type: 'forum', title: 'Préparation hivernale', date: '2025-02-20T00:00:00Z', description: 'A créé un nouveau sujet de forum', points: 5 },
      { id: 'activity4', type: 'badge', title: 'Conquérant des Vosges', date: '2024-08-15T00:00:00Z', description: 'A débloqué un nouveau badge', points: 50 },
    ],
    routes: [
      { id: 'route1', title: 'Tour du Petit Ballon', date: '2025-03-15T00:00:00Z', distance: 78, elevation: 1250, likes: 23, image: '/images/routes/route1.jpg' },
      { id: 'route2', title: 'Boucle des Crêtes', date: '2025-02-02T00:00:00Z', distance: 65, elevation: 980, likes: 17, image: '/images/routes/route2.jpg' },
      { id: 'route3', title: 'Vallée de Munster', date: '2024-10-12T00:00:00Z', distance: 45, elevation: 650, likes: 9, image: '/images/routes/route3.jpg' },
    ],
    friends: [
      { id: 'user1', name: 'Marie Dufour', avatar: '/images/profiles/user1.jpg' },
      { id: 'user3', name: 'Sophie Moreau', avatar: '/images/profiles/user3.jpg' },
      { id: 'user5', name: 'Lucie Bernard', avatar: '/images/profiles/user5.jpg' },
    ],
  };
  
  // Charger les données du profil
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        // Dans une implémentation réelle, nous récupérerions les données depuis une API
        setTimeout(() => {
          setProfile(mockUser);
          setIsLoading(false);
        }, 800);
      } catch (err) {
        setError('Erreur lors du chargement du profil');
        setIsLoading(false);
      }
    };
    
    loadProfile();
  }, [userId]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    
    // Dans une implémentation réelle, nous enverrions le message à l'API
    alert(`Message envoyé à ${profile.name}: ${messageText}`);
    setMessageText('');
    setMessageDialogOpen(false);
  };
  
  const handleToggleFriend = () => {
    // Dans une implémentation réelle, nous mettrions à jour l'API
    setIsFriend(!isFriend);
    if (!isFriend) {
      alert(`Vous suivez maintenant ${profile.name}`);
    } else {
      alert(`Vous ne suivez plus ${profile.name}`);
    }
  };
  
  // Déterminer si c'est le profil de l'utilisateur courant
  const isOwnProfile = user && user.sub === userId;
  
  // Rendu conditionnel pendant le chargement
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Rendu en cas d'erreur
  if (error || !profile) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Utilisateur introuvable'}
        </Alert>
        <Button component={Link} to="/community/users" variant="outlined">
          Retour à la liste des membres
        </Button>
      </Box>
    );
  }
  
  const getBadgeIcon = (icon) => {
    switch (icon) {
      case 'terrain': return <TerrainIcon />;
      case 'map': return <MapIcon />;
      case 'forum': return <ForumIcon />;
      case 'event': return <CalendarTodayIcon />;
      case 'people': return <PeopleIcon />;
      default: return <StarIcon />;
    }
  };
  
  const getActivityIcon = (type) => {
    switch (type) {
      case 'challenge': return <EmojiEventsIcon />;
      case 'route': return <MapIcon />;
      case 'forum': return <ForumIcon />;
      case 'badge': return <StarIcon />;
      default: return <DirectionsBikeIcon />;
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <ProfileHeader>
        <CoverPhoto sx={{ backgroundImage: `url(${profile.coverPhoto || '/images/profiles/default-cover.jpg'})` }} />
        
        <ProfileAvatar
          src={profile.avatar}
          alt={profile.name}
        />
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          mt: 1,
          ml: { xs: 14, sm: 18 }
        }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              {profile.name}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary" gutterBottom>
              @{profile.username}
              {profile.team && (
                <Typography component="span" color="primary" sx={{ ml: 1 }}>
                  • {profile.team}
                </Typography>
              )}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              <LevelBadge 
                label={profile.level} 
                level={profile.level}
                size="small"
              />
              
              <Chip 
                icon={<EmojiEventsIcon />} 
                label={`Rang #${profile.stats.rank}`} 
                size="small" 
                variant="outlined" 
                color="primary"
              />
              
              {profile.location && (
                <Chip 
                  label={profile.location} 
                  size="small" 
                  variant="outlined" 
                />
              )}
            </Box>
          </Box>
          
          {!isOwnProfile && isAuthenticated && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<MessageIcon />}
                onClick={() => setMessageDialogOpen(true)}
                sx={{ mr: 1 }}
              >
                Message
              </Button>
              
              <Button
                variant={isFriend ? "contained" : "outlined"}
                color={isFriend ? "primary" : "primary"}
                startIcon={isFriend ? <CheckIcon /> : <PersonAddIcon />}
                onClick={handleToggleFriend}
              >
                {isFriend ? 'Suivi' : 'Suivre'}
              </Button>
            </Box>
          )}
          
          {isOwnProfile && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              component={Link}
              to="/profile/edit"
              sx={{ mt: 2 }}
            >
              Modifier le profil
            </Button>
          )}
        </Box>
        
        {profile.bio && (
          <Typography variant="body1" paragraph sx={{ mt: 3 }}>
            {profile.bio}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <Typography variant="body2" color="textSecondary">
            Membre depuis {formatDate(profile.joinDate)}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mx: 1 }}>
            •
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Dernière activité {formatDate(profile.lastActive)}
          </Typography>
        </Box>
        
        {profile.socialLinks && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            {profile.socialLinks.facebook && (
              <IconButton color="primary" size="small" component="a" href={profile.socialLinks.facebook} target="_blank">
                <FacebookIcon />
              </IconButton>
            )}
            {profile.socialLinks.twitter && (
              <IconButton color="primary" size="small" component="a" href={profile.socialLinks.twitter} target="_blank">
                <TwitterIcon />
              </IconButton>
            )}
            {profile.socialLinks.instagram && (
              <IconButton color="primary" size="small" component="a" href={profile.socialLinks.instagram} target="_blank">
                <InstagramIcon />
              </IconButton>
            )}
            {profile.socialLinks.youtube && (
              <IconButton color="primary" size="small" component="a" href={profile.socialLinks.youtube} target="_blank">
                <YouTubeIcon />
              </IconButton>
            )}
            {profile.socialLinks.linkedin && (
              <IconButton color="primary" size="small" component="a" href={profile.socialLinks.linkedin} target="_blank">
                <LinkedInIcon />
              </IconButton>
            )}
          </Box>
        )}
      </ProfileHeader>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DirectionsBikeIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary">
                  Distance totale
                </Typography>
              </Box>
              <Typography variant="h4" component="div" sx={{ mt: 1 }}>
                {profile.stats.totalDistance.toLocaleString()} km
              </Typography>
            </CardContent>
          </StatCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TerrainIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary">
                  Dénivelé total
                </Typography>
              </Box>
              <Typography variant="h4" component="div" sx={{ mt: 1 }}>
                {profile.stats.totalElevation.toLocaleString()} m
              </Typography>
            </CardContent>
          </StatCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EmojiEventsIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary">
                  Points
                </Typography>
              </Box>
              <Typography variant="h4" component="div" sx={{ mt: 1 }}>
                {profile.stats.points.toLocaleString()}
              </Typography>
            </CardContent>
          </StatCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MapIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary">
                  Routes partagées
                </Typography>
              </Box>
              <Typography variant="h4" component="div" sx={{ mt: 1 }}>
                {profile.stats.routesShared}
              </Typography>
            </CardContent>
          </StatCard>
        </Grid>
      </Grid>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="profile tabs"
          variant={isMobile ? "scrollable" : "fullWidth"}
          scrollButtons={isMobile ? "auto" : false}
        >
          <Tab label="Activités" />
          <Tab label="Itinéraires" />
          <Tab label="Badges" />
          <Tab label={`Amis (${profile.friends.length})`} />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {/* Onglet Activités */}
          {tabValue === 0 && (
            <>
              <Typography variant="h6" gutterBottom>
                Activités récentes
              </Typography>
              <List>
                {profile.activities.map((activity) => (
                  <React.Fragment key={activity.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {getActivityIcon(activity.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1">
                              {activity.title}
                            </Typography>
                            <Chip 
                              label={`+${activity.points} pts`} 
                              size="small" 
                              color="primary" 
                              variant="outlined" 
                            />
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="textPrimary">
                              {activity.description}
                            </Typography>
                            <Typography variant="caption" display="block" color="textSecondary" sx={{ mt: 0.5 }}>
                              {formatDate(activity.date)}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
            </>
          )}
          
          {/* Onglet Itinéraires */}
          {tabValue === 1 && (
            <>
              <Typography variant="h6" gutterBottom>
                Itinéraires partagés
              </Typography>
              <Grid container spacing={2}>
                {profile.routes.map((route) => (
                  <Grid item xs={12} sm={6} md={4} key={route.id}>
                    <Card>
                      <Box 
                        sx={{ 
                          height: 140,
                          backgroundImage: `url(${route.image || '/images/routes/default-route.jpg'})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }} 
                      />
                      <CardContent sx={{ pb: 1 }}>
                        <Typography variant="h6" component={Link} to={`/community/routes/${route.id}`} sx={{
                          textDecoration: 'none',
                          color: 'inherit',
                          '&:hover': { color: 'primary.main' }
                        }}>
                          {route.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <Chip
                            icon={<DirectionsBikeIcon />}
                            label={`${route.distance} km`}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 1 }}
                          />
                          <Chip
                            icon={<TerrainIcon />}
                            label={`${route.elevation} m`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                          <Typography variant="caption" color="textSecondary">
                            {formatDate(route.date)}
                          </Typography>
                          <Typography variant="body2">
                            ❤️ {route.likes}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
          
          {/* Onglet Badges */}
          {tabValue === 2 && (
            <>
              <Typography variant="h6" gutterBottom>
                Badges obtenus
              </Typography>
              <Grid container spacing={2}>
                {profile.badges.map((badge) => (
                  <Grid item xs={12} sm={6} md={4} key={badge.id}>
                    <Card sx={{ display: 'flex', height: '100%' }}>
                      <Box sx={{ display: 'flex', p: 2, alignItems: 'center', justifyContent: 'center', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                        <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.dark' }}>
                          {getBadgeIcon(badge.icon)}
                        </Avatar>
                      </Box>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" component="div">
                          {badge.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                          {badge.description}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Obtenu le {formatDate(badge.date)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
          
          {/* Onglet Amis */}
          {tabValue === 3 && (
            <>
              <Typography variant="h6" gutterBottom>
                Amis
              </Typography>
              <Grid container spacing={2}>
                {profile.friends.map((friend) => (
                  <Grid item xs={12} sm={6} md={4} key={friend.id}>
                    <Card>
                      <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          src={friend.avatar}
                          alt={friend.name}
                          sx={{ width: 60, height: 60, mr: 2 }}
                        />
                        <Box>
                          <Typography variant="h6" component={Link} to={`/community/users/${friend.id}`} sx={{
                            textDecoration: 'none',
                            color: 'inherit',
                            '&:hover': { color: 'primary.main' }
                          }}>
                            {friend.name}
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<MessageIcon />}
                            sx={{ mt: 1 }}
                            component={Link}
                            to={`/community/messages/${friend.id}`}
                          >
                            Message
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </Box>
      </Paper>
      
      {/* Dialogue pour envoyer un message */}
      <Dialog
        open={messageDialogOpen}
        onClose={() => setMessageDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Message à {profile.name}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Votre message"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMessageDialogOpen(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSendMessage} 
            variant="contained" 
            color="primary" 
            disabled={!messageText.trim()}
          >
            Envoyer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserProfile;
