import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  CardActionArea,
  Button,
  Divider,
  Paper,
  Stack,
  Chip,
  useTheme,
  useMediaQuery,
  LinearProgress,
  CircularProgress,
  IconButton,
  alpha
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Terrain as TerrainIcon,
  RouteRounded as RouteIcon,
  EmojiEvents as EventIcon,
  Article as NewsIcon,
  Equalizer as StatsIcon,
  ArrowForward as ArrowForwardIcon,
  OpenInNew as OpenInNewIcon,
  People as PeopleIcon,
  Star as StarIcon,
  DirectionsBike as BikeIcon,
  ExploreOutlined as ExploreIcon,
  LightMode as SunIcon,
  Refresh as RefreshIcon,
  FitnessCenter as TrainingIcon,
  Restaurant as RestaurantIcon
} from '@mui/icons-material';

// Components
import WeatherWidget from '../components/widgets/WeatherWidget';
import BikeAnimationCanvas from '../components/animations/BikeAnimationCanvas';
import EventsCarousel from '../components/home/EventsCarousel';
import NewsCard from '../components/home/NewsCard';
import RegionMap from '../components/maps/RegionMap';
import StatsSummary from '../components/home/StatsSummary';
import Breadcrumbs from '../components/common/Breadcrumbs';
import HeroParallax from '../components/animations/HeroParallax';
import PageTransition from '../components/animations/PageTransition';
import AnimatedStats from '../components/animations/AnimatedStats';
import TrainingSection from '../components/home/modern/TrainingSection';
import NutritionSection from '../components/home/modern/NutritionSection';

// Hooks
import { useAuth } from '../hooks/useAuthCentral';
import useErrorHandler from '../hooks/useErrorHandler';

// Styled Components
const SectionTitle = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
  position: 'relative',
  '&::after': {
    content: '""',
    flexGrow: 1,
    height: 2,
    backgroundColor: alpha(theme.palette.primary.main, 0.2),
    marginLeft: theme.spacing(2),
    borderRadius: 2,
  }
}));

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 6px 15px rgba(0, 0, 0, 0.08)',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 25px rgba(0, 0, 0, 0.15)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '4px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  '&:hover::before': {
    opacity: 1,
  },
}));

const DifficultyChip = styled(Chip)(({ theme, difficulty }) => {
  const colors = {
    1: { bg: '#e3f2fd', color: '#0d47a1' }, // Facile
    2: { bg: '#e8f5e9', color: '#1b5e20' }, // Modéré
    3: { bg: '#fff8e1', color: '#ff6f00' }, // Intermédiaire
    4: { bg: '#fff3e0', color: '#e65100' }, // Difficile
    5: { bg: '#ffebee', color: '#b71c1c' }  // Très difficile
  };
  const color = colors[difficulty] || colors[3];
  
  return {
    backgroundColor: color.bg,
    color: color.color,
    fontWeight: 600,
    '& .MuiChip-icon': {
      color: color.color
    }
  };
});

const FeatureSection = styled(Box)(({ theme, darkMode }) => ({
  padding: theme.spacing(6, 0),
  backgroundColor: darkMode ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(4),
}));

const StatsBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  transition: 'transform 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: theme.shadows[4],
  }
}));

/**
 * Page d'accueil principale
 * Présente un aperçu des principales fonctionnalités de l'application
 */
const Home = () => {
  const [weather, setWeather] = useState(null);
  const [featuredCols, setFeaturedCols] = useState([]);
  const [featuredRoutes, setFeaturedRoutes] = useState([]);
  const [newsItems, setNewsItems] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState({
    weather: true,
    cols: true,
    routes: true,
    news: true,
    events: true
  });
  
  const { user } = useAuth();
  const { handleApiRequest, tryCatch } = useErrorHandler();
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Animations Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        duration: 0.5 
      } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  // Animation d'entrée
  const sectionVariants = {
    offscreen: { opacity: 0, y: 50 },
    onscreen: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        bounce: 0.3,
        duration: 0.8
      }
    }
  };

  // Données de secours pour les cols
  const fallbackCols = [
    { id: 1, name: 'Col de la Schlucht', elevation: 1139, difficulty: 3, image: '/images/cols/schlucht.jpg' },
    { id: 2, name: 'Grand Ballon', elevation: 1424, difficulty: 4, image: '/images/cols/grand-ballon.jpg' },
    { id: 3, name: 'Col du Donon', elevation: 727, difficulty: 2, image: '/images/cols/donon.jpg' }
  ];

  // Données de secours pour les parcours
  const fallbackRoutes = [
    { id: 1, name: 'Tour des Vosges', distance: 120, elevation: 2200, difficulty: 4, image: '/images/routes/vosges.jpg' },
    { id: 2, name: 'Traversée de l\'Alsace', distance: 85, elevation: 1100, difficulty: 3, image: '/images/routes/alsace.jpg' },
    { id: 3, name: 'Circuit des Lacs', distance: 60, elevation: 800, difficulty: 2, image: '/images/routes/lacs.jpg' }
  ];

  // Données de secours pour les événements
  const fallbackEvents = [
    { 
      id: 1, 
      title: 'Tour du Grand Est', 
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
      location: 'Strasbourg', 
      image: '/images/events/tour-grand-est.jpg',
      participants: 120
    },
    { 
      id: 2, 
      title: 'Randonnée des Lacs', 
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 
      location: 'Gérardmer', 
      image: '/images/events/randonnee-lacs.jpg',
      participants: 85
    },
    { 
      id: 3, 
      title: 'Challenge des Cols Vosgiens', 
      date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), 
      location: 'Épinal', 
      image: '/images/events/cols-vosgiens.jpg',
      participants: 65
    }
  ];

  // Charger les données météo de la région
  const fetchWeather = useCallback(async () => {
    setLoading(prev => ({ ...prev, weather: true }));
    
    await handleApiRequest(
      axios.get('/api/weather/current?lat=48.7&lon=6.2'),
      {
        successMessage: null, // Pas de message de succès pour la météo
        errorMessage: 'Impossible de charger les données météo',
        showSuccess: false,
        showLoading: false,
        onSuccess: (data) => {
          setWeather(data);
          setLoading(prev => ({ ...prev, weather: false }));
        },
        onError: () => {
          setLoading(prev => ({ ...prev, weather: false }));
        }
      }
    );
  }, [handleApiRequest]);

  // Charger les cols mis en avant
  const fetchFeaturedCols = useCallback(async () => {
    setLoading(prev => ({ ...prev, cols: true }));
    
    await handleApiRequest(
      axios.get('/api/cols/featured'),
      {
        errorMessage: 'Impossible de charger les cols en vedette',
        showSuccess: false,
        showLoading: false,
        onSuccess: (data) => {
          setFeaturedCols(data);
          setLoading(prev => ({ ...prev, cols: false }));
        },
        onError: () => {
          // Utiliser les données de secours en cas d'erreur
          setFeaturedCols(fallbackCols);
          setLoading(prev => ({ ...prev, cols: false }));
        }
      }
    );
  }, [handleApiRequest, setFeaturedCols]);

  // Charger les itinéraires mis en avant
  const fetchFeaturedRoutes = useCallback(async () => {
    setLoading(prev => ({ ...prev, routes: true }));
    
    await handleApiRequest(
      axios.get('/api/routes/featured'),
      {
        errorMessage: 'Impossible de charger les parcours en vedette',
        showSuccess: false,
        showLoading: false,
        onSuccess: (data) => {
          setFeaturedRoutes(data);
          setLoading(prev => ({ ...prev, routes: false }));
        },
        onError: () => {
          // Utiliser les données de secours en cas d'erreur
          setFeaturedRoutes(fallbackRoutes);
          setLoading(prev => ({ ...prev, routes: false }));
        }
      }
    );
  }, [handleApiRequest, setFeaturedRoutes]);

  // Charger les actualités récentes
  const fetchNewsItems = useCallback(async () => {
    setLoading(prev => ({ ...prev, news: true }));
    
    await handleApiRequest(
      axios.get('/api/news/latest'),
      {
        errorMessage: 'Impossible de charger les dernières actualités',
        showSuccess: false,
        showLoading: false,
        onSuccess: (data) => {
          setNewsItems(data);
          setLoading(prev => ({ ...prev, news: false }));
        },
        onError: () => {
          setLoading(prev => ({ ...prev, news: false }));
        }
      }
    );
  }, [handleApiRequest, setNewsItems]);

  // Charger les événements à venir
  const fetchUpcomingEvents = useCallback(async () => {
    setLoading(prev => ({ ...prev, events: true }));
    
    await handleApiRequest(
      axios.get('/api/events/upcoming'),
      {
        errorMessage: 'Impossible de charger les événements à venir',
        showSuccess: false,
        showLoading: false,
        onSuccess: (data) => {
          setUpcomingEvents(data);
          setLoading(prev => ({ ...prev, events: false }));
        },
        onError: () => {
          // Utiliser les données de secours en cas d'erreur
          setUpcomingEvents(fallbackEvents);
          setLoading(prev => ({ ...prev, events: false }));
        }
      }
    );
  }, [handleApiRequest, setUpcomingEvents]);

  // Charger toutes les données au chargement de la page
  useEffect(() => {
    const loadAllData = async () => {
      // Utiliser Promise.allSettled pour continuer même si certaines requêtes échouent
      await Promise.allSettled([
        fetchWeather(),
        fetchFeaturedCols(),
        fetchFeaturedRoutes(),
        fetchNewsItems(),
        fetchUpcomingEvents()
      ]);
    };
    
    loadAllData();
  }, [fetchWeather, fetchFeaturedCols, fetchFeaturedRoutes, fetchNewsItems, fetchUpcomingEvents]);

  // Rendu des cartes de cols avec état de chargement
  const renderColCards = () => {
    if (loading.cols) {
      return Array(3).fill(0).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={`col-skeleton-${index}`}>
          <Card sx={{ height: '100%' }}>
            <LinearProgress />
            <CardContent>
              <Typography variant="h6" component="h3" sx={{ opacity: 0.5 }}>
                Chargement...
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.5 }}>
                Altitude: ...
              </Typography>
              <Chip 
                label="..." 
                size="small"
                color="primary"
                sx={{ opacity: 0.5 }}
              />
            </CardContent>
          </Card>
        </Grid>
      ));
    }
    
    return featuredCols.map(col => (
      <Grid item xs={12} sm={6} md={4} key={col.id}>
        <StyledCard 
          component={motion.div}
          variants={itemVariants}
          sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          <CardActionArea component={RouterLink} to={`/cols/${col.id}`}>
            <CardMedia
              component="img"
              height={140}
              image={col.image}
              alt={col.name}
            />
            <CardContent>
              <Typography gutterBottom variant="h6" component="h3">
                {col.name}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Altitude: {col.elevation}m
                </Typography>
                <DifficultyChip 
                  label={`Difficulté: ${col.difficulty}/5`} 
                  size="small"
                  difficulty={col.difficulty}
                />
              </Box>
            </CardContent>
          </CardActionArea>
        </StyledCard>
      </Grid>
    ));
  };

  // Rendu des cartes de parcours avec état de chargement
  const renderRouteCards = () => {
    if (loading.routes) {
      return Array(3).fill(0).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={`route-skeleton-${index}`}>
          <Card sx={{ height: '100%' }}>
            <LinearProgress />
            <CardContent>
              <Typography variant="h6" component="h3" sx={{ opacity: 0.5 }}>
                Chargement...
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.5 }}>
                Distance: ...
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.5 }}>
                D+: ...
              </Typography>
              <Chip 
                label="..." 
                size="small"
                color="primary"
                sx={{ opacity: 0.5 }}
              />
            </CardContent>
          </Card>
        </Grid>
      ));
    }
    
    return featuredRoutes.map(route => (
      <Grid item xs={12} sm={6} md={4} key={route.id}>
        <StyledCard 
          component={motion.div}
          variants={itemVariants}
          sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          <CardActionArea component={RouterLink} to={`/routes/${route.id}`}>
            <CardMedia
              component="img"
              height={140}
              image={route.image}
              alt={route.name}
            />
            <CardContent>
              <Typography gutterBottom variant="h6" component="h3">
                {route.name}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Distance: {route.distance}km
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  D+: {route.elevation}m
                </Typography>
              </Box>
              <DifficultyChip 
                label={`Difficulté: ${route.difficulty}/5`} 
                size="small"
                difficulty={route.difficulty}
              />
            </CardContent>
          </CardActionArea>
        </StyledCard>
      </Grid>
    ));
  };

  // Images pour le héros avec effet parallaxe
  const heroBackgroundImage = '/images/hero-cycliste.jpg';

  return (
    <PageTransition>
      <Box sx={{ overflow: 'hidden' }}>
        {/* Hero section avec parallaxe */}
        <HeroParallax
          backgroundImage={heroBackgroundImage}
          title="Grand Est Cyclisme"
          subtitle="Explorez les plus beaux cols et parcours cyclistes de la région Grand Est"
          ctaText="Découvrir les cols"
          ctaLink="/cols"
        />
        
        {/* Section statistiques rapides */}
        <Container maxWidth="xl">
          <motion.div
            initial="offscreen"
            whileInView="onscreen"
            viewport={{ once: true, amount: 0.3 }}
            variants={sectionVariants}
          >
            <Grid container spacing={3} sx={{ mb: 6 }}>
              <Grid item xs={6} md={3}>
                <StatsBox>
                  <BikeIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h3" component="div" color="primary" fontWeight="bold">
                    247
                  </Typography>
                  <Typography variant="subtitle1">Cols répertoriés</Typography>
                </StatsBox>
              </Grid>
              <Grid item xs={6} md={3}>
                <StatsBox>
                  <RouteIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h3" component="div" color="secondary" fontWeight="bold">
                    189
                  </Typography>
                  <Typography variant="subtitle1">Parcours</Typography>
                </StatsBox>
              </Grid>
              <Grid item xs={6} md={3}>
                <StatsBox>
                  <EventIcon sx={{ fontSize: 40, mb: 1, color: theme.palette.success.main }} />
                  <Typography variant="h3" component="div" sx={{ color: theme.palette.success.main }} fontWeight="bold">
                    42
                  </Typography>
                  <Typography variant="subtitle1">Événements</Typography>
                </StatsBox>
              </Grid>
              <Grid item xs={6} md={3}>
                <StatsBox>
                  <PeopleIcon sx={{ fontSize: 40, mb: 1, color: theme.palette.info.main }} />
                  <Typography variant="h3" component="div" sx={{ color: theme.palette.info.main }} fontWeight="bold">
                    5.2k
                  </Typography>
                  <Typography variant="subtitle1">Membres</Typography>
                </StatsBox>
              </Grid>
            </Grid>
          </motion.div>
        </Container>

        {/* Météo du jour */}
        <Container maxWidth="xl">
          <motion.div
            initial="offscreen"
            whileInView="onscreen"
            viewport={{ once: true, amount: 0.3 }}
            variants={sectionVariants}
          >
            <Box sx={{ mb: 6 }}>
              <Grid container spacing={3} alignItems="stretch">
                <Grid item xs={12} md={6}>
                  <Paper sx={{ 
                    p: 3, 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderRadius: theme.shape.borderRadius,
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
                    background: 'linear-gradient(135deg, #f5f7fa 0%, #e4ebf5 100%)'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <SunIcon sx={{ mr: 1, color: theme.palette.warning.main }} />
                      <Typography variant="h5" component="h2">
                        Météo du jour
                      </Typography>
                      <Box sx={{ ml: 'auto' }}>
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            setLoading(prev => ({ ...prev, weather: true }));
                            fetchWeather();
                          }}
                          aria-label="Actualiser la météo"
                        >
                          <RefreshIcon />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    {loading.weather ? (
                      <Box sx={{ p: 4, textAlign: 'center' }}>
                        <CircularProgress size={60} />
                        <Typography variant="body2" sx={{ mt: 2 }}>
                          Chargement des données météo...
                        </Typography>
                      </Box>
                    ) : weather ? (
                      <WeatherWidget data={weather} />
                    ) : (
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body1">
                          Données météo non disponibles pour le moment.
                        </Typography>
                        <Button 
                          variant="outlined" 
                          startIcon={<RefreshIcon />} 
                          sx={{ mt: 2 }}
                          onClick={() => {
                            setLoading(prev => ({ ...prev, weather: true }));
                            fetchWeather();
                          }}
                        >
                          Réessayer
                        </Button>
                      </Box>
                    )}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box
                    component={BikeAnimationCanvas}
                    sx={{ 
                      height: { xs: 200, md: '100%' },
                      minHeight: 250,
                      borderRadius: theme.shape.borderRadius,
                      overflow: 'hidden',
                      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </motion.div>
        </Container>
        
        {/* Sections principales */}
        <FeatureSection>
          <Container maxWidth="xl">
            <motion.div
              initial="offscreen"
              whileInView="onscreen"
              viewport={{ once: true, amount: 0.3 }}
              variants={sectionVariants}
            >
              <SectionTitle variant="h4" component="h2">
                <TerrainIcon color="primary" sx={{ mr: 1, fontSize: 30 }} />
                Cols populaires
              </SectionTitle>
              
              <Grid container spacing={3}>
                {renderColCards()}
              </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button 
                  component={RouterLink}
                  to="/cols"
                  variant="outlined"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ 
                    py: 1,
                    px: 3,
                    borderRadius: '50px',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  Explorer tous les cols
                </Button>
              </Box>
            </motion.div>
          </Container>
        </FeatureSection>

        <Container maxWidth="xl">
          <motion.div
            initial="offscreen"
            whileInView="onscreen"
            viewport={{ once: true, amount: 0.3 }}
            variants={sectionVariants}
          >
            <SectionTitle variant="h4" component="h2">
              <RouteIcon color="primary" sx={{ mr: 1, fontSize: 30 }} />
              Parcours à découvrir
            </SectionTitle>
            
            <Grid container spacing={3}>
              {renderRouteCards()}
            </Grid>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button 
                component={RouterLink}
                to="/routes"
                variant="outlined"
                endIcon={<ArrowForwardIcon />}
                sx={{ 
                  py: 1,
                  px: 3,
                  borderRadius: '50px',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }
                }}
              >
                Voir tous les parcours
              </Button>
            </Box>
          </motion.div>
        </Container>
        
        <Container maxWidth="xl">
          <motion.div
            initial="offscreen"
            whileInView="onscreen"
            viewport={{ once: true, amount: 0.3 }}
            variants={sectionVariants}
          >
            <SectionTitle variant="h4" component="h2" id="training-section">
              <TrainingIcon color="primary" sx={{ mr: 1 }} />
              Tableau de bord d'entraînement
            </SectionTitle>
            <TrainingSection />
          </motion.div>
        </Container>

        <Container maxWidth="xl">
          <motion.div
            initial="offscreen"
            whileInView="onscreen"
            viewport={{ once: true, amount: 0.3 }}
            variants={sectionVariants}
          >
            <SectionTitle variant="h4" component="h2" id="nutrition-section" sx={{ mt: 6 }}>
              <RestaurantIcon color="primary" sx={{ mr: 1 }} />
              Tableau de bord nutrition
            </SectionTitle>
            <NutritionSection />
          </motion.div>
        </Container>

        <FeatureSection darkMode>
          <Container maxWidth="xl">
            <motion.div
              initial="offscreen"
              whileInView="onscreen"
              viewport={{ once: true, amount: 0.3 }}
              variants={sectionVariants}
            >
              <SectionTitle variant="h4" component="h2">
                <EventIcon color="primary" sx={{ mr: 1, fontSize: 30 }} />
                Événements à venir
              </SectionTitle>
              
              {loading.events ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <CircularProgress />
                  <Typography sx={{ mt: 2 }}>Chargement des événements...</Typography>
                </Box>
              ) : upcomingEvents.length > 0 ? (
                <EventsCarousel events={upcomingEvents} />
              ) : (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body1">
                    Aucun événement à venir pour le moment.
                  </Typography>
                </Paper>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button 
                  component={RouterLink}
                  to="/events"
                  endIcon={<ArrowForwardIcon />}
                  color="primary"
                  sx={{ borderRadius: '50px' }}
                >
                  Voir tous les événements
                </Button>
              </Box>
            </motion.div>
          </Container>
        </FeatureSection>

        {/* Section carte de la région */}
        <Container maxWidth="xl" sx={{ mt: 6, mb: 6 }}>
          <motion.div
            initial="offscreen"
            whileInView="onscreen"
            viewport={{ once: true, amount: 0.2 }}
            variants={sectionVariants}
          >
            <SectionTitle variant="h4" component="h2">
              <ExploreIcon color="primary" sx={{ mr: 1, fontSize: 30 }} />
              Explorez la région
            </SectionTitle>
            
            <Paper 
              elevation={2}
              sx={{ 
                height: 400, 
                position: 'relative',
                overflow: 'hidden',
                borderRadius: theme.shape.borderRadius,
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
              }}
            >
              <RegionMap />
            </Paper>
            
            <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
              Carte interactive des cols et parcours cyclistes du Grand Est
            </Typography>
          </motion.div>
        </Container>

        {/* Section statistiques animées */}
        <motion.div
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ once: true, amount: 0.1 }}
          variants={sectionVariants}
        >
          <AnimatedStats 
            title="La plus grande communauté cycliste d'Europe"
            subtitle="Rejoignez des milliers de cyclistes et découvrez pourquoi Euro Cycling Dashboard est devenu la référence pour les passionnés de vélo"
            stats={[
              {
                id: 'cols',
                value: 240,
                label: 'Cols européens',
                description: 'Des plus célèbres aux plus secrets',
                color: 'primary'
              },
              {
                id: 'cyclists',
                value: 15750,
                label: 'Cyclistes actifs',
                description: 'Une communauté passionnée',
                color: 'secondary'
              },
              {
                id: 'routes',
                value: 1280,
                label: 'Itinéraires partagés',
                description: 'À travers toute l\'Europe',
                color: 'info'
              },
              {
                id: 'events',
                value: 125,
                label: 'Événements organisés',
                description: 'Challenges et compétitions',
                color: 'success'
              }
            ]}
            sx={{ mb: 6 }}
          />
        </motion.div>
        
        {/* Section Rejoindre la Communauté */}
        <Box 
          sx={{ 
            position: 'relative',
            py: 10,
            backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7)), url(/images/cycling-community.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: 'white',
            boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.4)',
            mb: 6
          }}
        >
          <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2 }}>
            <Typography 
              variant="h3" 
              component="h2" 
              gutterBottom
              sx={{ 
                fontWeight: 700,
                mb: 2,
                textShadow: '0 2px 10px rgba(0,0,0,0.3)'
              }}
            >
              Rejoignez la communauté cycliste de Velo-Altitude
            </Typography>
            <Typography 
              variant="h6" 
              paragraph 
              sx={{ 
                mb: 4, 
                maxWidth: '800px', 
                mx: 'auto',
                opacity: 0.9,
                textShadow: '0 1px 5px rgba(0,0,0,0.2)'
              }}
            >
              Planifiez vos parcours, suivez votre progression et rencontrez d'autres passionnés de vélo dans la région
            </Typography>
            
            <Stack 
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="center"
            >
              {!user ? (
                <>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant="contained" 
                      size="large"
                      component={RouterLink}
                      to="/auth/signup"
                      endIcon={<StarIcon />}
                      sx={{ 
                        px: 4, 
                        py: 1.5, 
                        bgcolor: 'white', 
                        color: '#1976d2',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.9)'
                        }
                      }}
                    >
                      S'inscrire
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant="outlined" 
                      size="large"
                      component={RouterLink}
                      to="/auth/login"
                      sx={{ 
                        px: 4, 
                        py: 1.5, 
                        borderColor: 'white', 
                        color: 'white',
                        '&:hover': {
                          borderColor: 'white',
                          bgcolor: 'rgba(255,255,255,0.1)'
                        }
                      }}
                    >
                      Se connecter
                    </Button>
                  </motion.div>
                </>
              ) : (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="contained" 
                    size="large"
                    component={RouterLink}
                    to="/social"
                    endIcon={<PeopleIcon />}
                    sx={{ 
                      px: 4, 
                      py: 1.5, 
                      bgcolor: 'white', 
                      color: '#1976d2',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.9)'
                      }
                    }}
                  >
                    Rejoindre la communauté
                  </Button>
                </motion.div>
              )}
            </Stack>
          </Container>
        </Box>
      </Box>
    </PageTransition>
  );
};

export default Home;
