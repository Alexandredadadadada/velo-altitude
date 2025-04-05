import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Paper, 
  Button, 
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  Divider,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Terrain as TerrainIcon, 
  Compare as CompareIcon, 
  Route as RouteIcon,
  Dashboard as DashboardIcon,
  ThreeDRotation as ThreeDIcon,
  Insights as InsightsIcon,
  ExploreOutlined as ExploreIcon,
  BookmarkBorder as BookmarkIcon,
  Favorite as FavoriteIcon
} from '@mui/icons-material';
import axios from 'axios';
import { motion } from 'framer-motion';

// Components
import PageTransition from '../components/animations/PageTransition';
import PassVisualizer from '../components/visualization/PassVisualizer';
import PassComparison from '../components/visualization/PassComparison';
import RouteAlternatives from '../components/visualization/RouteAlternatives';
import ColVisualization3D from '../components/visualization/ColVisualization3D';
import VisualizationGrid from '../components/visualization/VisualizationGrid';
import VisualizationCarousel from '../components/visualization/VisualizationCarousel';
import './VisualizationDashboard.css';
import '../i18n'; // Ensure i18n is initialized

// Styled Components
const DashboardHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4, 0),
  marginBottom: theme.spacing(4),
  background: `linear-gradient(120deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
  color: theme.palette.primary.contrastText,
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: `url('/images/topography-pattern.svg')`,
    opacity: 0.1,
    zIndex: 1,
  }
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  '& .MuiTabs-indicator': {
    height: 3,
    borderRadius: '3px 3px 0 0',
  },
  '& .MuiTab-root': {
    minHeight: 64,
    fontSize: '0.9rem',
    fontWeight: 'medium',
    textTransform: 'none',
    '&.Mui-selected': {
      fontWeight: 'bold',
    },
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  '& .MuiSvgIcon-root': {
    marginRight: theme.spacing(1),
    fontSize: '1.2rem',
  },
}));

const VisualizationContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(4),
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
  minHeight: '60vh',
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)',
  },
}));

const FeatureIcon = styled(Box)(({ theme, color }) => ({
  width: 60,
  height: 60,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  backgroundColor: alpha(theme.palette[color || 'primary'].main, 0.1),
  color: theme.palette[color || 'primary'].main,
  marginBottom: theme.spacing(2),
}));

const VisualizationDashboard = () => {
  const [passes, setPasses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPassId, setSelectedPassId] = useState(null);
  const [comparePassId1, setComparePassId1] = useState(null);
  const [comparePassId2, setComparePassId2] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [featuredItems, setFeaturedItems] = useState([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.5,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Simulation d'appel API - à remplacer par de vrais appels en production
        // const [passesResponse, routesResponse] = await Promise.all([
        //   axios.get('/api/passes'),
        //   axios.get('/api/routes')
        // ]);
        
        // Données fictives pour développement
        const mockPasses = [
          {
            id: 'col-1',
            title: 'Col du Galibier',
            subtitle: 'Un des plus beaux cols des Alpes',
            image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba',
            type: 'col',
            location: 'Alpes, France',
            stats: {
              difficulty: 'difficile',
              distance: '23',
              elevation: '1245',
              views: '3248'
            },
            details: [
              { title: 'Histoire', content: 'Le Col du Galibier est un col mythique du Tour de France...' },
              { title: 'Conseils', content: 'Prévoyez des vêtements chauds même en été.' }
            ],
            detailsUrl: '/cols/galibier',
            isFavorite: false,
            isBookmarked: true
          },
          {
            id: 'col-2',
            title: 'Col du Tourmalet',
            subtitle: 'Le géant des Pyrénées',
            image: 'https://images.unsplash.com/photo-1455156218388-7a8e488e8606',
            type: 'col',
            location: 'Pyrénées, France',
            stats: {
              difficulty: 'très difficile',
              distance: '19',
              elevation: '1404',
              views: '5248'
            },
            details: [
              { title: 'Histoire', content: 'Le Col du Tourmalet est le plus haut col routier des Pyrénées...' },
              { title: 'Conseils', content: 'Prévoyez de l\'eau en quantité suffisante.' }
            ],
            detailsUrl: '/cols/tourmalet',
            isFavorite: true,
            isBookmarked: false
          },
          {
            id: 'col-3',
            title: 'Col de la Bonette',
            subtitle: 'La route la plus haute d\'Europe',
            image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',
            type: 'col',
            location: 'Alpes-Maritimes, France',
            stats: {
              difficulty: 'extrême',
              distance: '26',
              elevation: '1652',
              views: '2789'
            },
            detailsUrl: '/cols/bonette',
            isFavorite: false,
            isBookmarked: false
          },
          {
            id: 'col-4',
            title: 'Col d\'Aubisque',
            subtitle: 'Un paysage exceptionnel',
            image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba',
            type: 'col',
            location: 'Pyrénées, France',
            stats: {
              difficulty: 'difficile',
              distance: '16',
              elevation: '1190',
              views: '3102'
            },
            detailsUrl: '/cols/aubisque',
            isFavorite: false,
            isBookmarked: true
          }
        ];
        
        const mockRoutes = [
          {
            id: 'route-1',
            title: 'Route des Crêtes',
            subtitle: 'Un parcours panoramique',
            image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7',
            type: 'route',
            location: 'Vosges, France',
            stats: {
              difficulty: 'moyen',
              distance: '38',
              elevation: '980',
              views: '2187'
            },
            detailsUrl: '/routes/cretes',
            isFavorite: false,
            isBookmarked: false
          },
          {
            id: 'route-2',
            title: 'Route des Grandes Alpes',
            subtitle: 'Une traversée mythique',
            image: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606',
            type: 'route',
            location: 'Alpes, France',
            stats: {
              difficulty: 'extrême',
              distance: '684',
              elevation: '15700',
              views: '5347'
            },
            detailsUrl: '/routes/grandes-alpes',
            isFavorite: true,
            isBookmarked: true
          }
        ];
        
        setPasses(mockPasses);
        setRoutes(mockRoutes);
        
        // Sélectionner des éléments mis en avant
        setFeaturedItems([
          ...mockPasses.filter(pass => pass.isFavorite).slice(0, 2),
          ...mockRoutes.filter(route => route.isFavorite).slice(0, 1)
        ]);
        
        setSelectedPassId(mockPasses[0]?.id);
        setComparePassId1(mockPasses[0]?.id);
        setComparePassId2(mockPasses[1]?.id);
        setSelectedRouteId(mockRoutes[0]?.id);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Impossible de charger les données. Veuillez réessayer plus tard.');
      } finally {
        // Simuler un temps de chargement pour montrer les états de chargement
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      }
    };

    fetchData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Actions pour les nouveaux composants de visualisation
  const handleFavoriteToggle = (id) => {
    // Mettre à jour les passes
    setPasses(prevPasses => 
      prevPasses.map(pass => 
        pass.id === id ? { ...pass, isFavorite: !pass.isFavorite } : pass
      )
    );
    
    // Mettre à jour les routes
    setRoutes(prevRoutes => 
      prevRoutes.map(route => 
        route.id === id ? { ...route, isFavorite: !route.isFavorite } : route
      )
    );
    
    // Mettre à jour les éléments mis en avant
    setFeaturedItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
  };
  
  const handleBookmarkToggle = (id) => {
    // Mettre à jour les passes
    setPasses(prevPasses => 
      prevPasses.map(pass => 
        pass.id === id ? { ...pass, isBookmarked: !pass.isBookmarked } : pass
      )
    );
    
    // Mettre à jour les routes
    setRoutes(prevRoutes => 
      prevRoutes.map(route => 
        route.id === id ? { ...route, isBookmarked: !route.isBookmarked } : route
      )
    );
    
    // Mettre à jour les éléments mis en avant
    setFeaturedItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, isBookmarked: !item.isBookmarked } : item
      )
    );
  };
  
  const handleShare = (id) => {
    // Simuler un partage
    console.log(`Partage de l'élément ${id}`);
    // En production, cela ouvrirait une boîte de dialogue de partage
  };

  // Filtres disponibles pour la grille de visualisation
  const availableFilters = {
    type: ['col', 'route'],
    difficulty: ['facile', 'moyen', 'difficile', 'très difficile', 'extrême'],
    region: ['Alpes', 'Pyrénées', 'Vosges', 'Jura', 'Massif central', 'Alsace', 'Provence']
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      );
    }

    switch (activeTab) {
      case 0: // Visualisation 3D
        return (
          <ColVisualization3D 
            passId={selectedPassId} 
            passes={passes}
            onPassChange={(id) => setSelectedPassId(id)}
          />
        );
      case 1: // Visualisation Standard
        return (
          <PassVisualizer 
            passId={selectedPassId} 
            passes={passes}
            onPassChange={(id) => setSelectedPassId(id)}
          />
        );
      case 2: // Comparaison
        return (
          <PassComparison 
            passId1={comparePassId1} 
            passId2={comparePassId2}
            passes={passes}
            onPassChange1={(id) => setComparePassId1(id)}
            onPassChange2={(id) => setComparePassId2(id)}
          />
        );
      case 3: // Alternatives
        return (
          <RouteAlternatives 
            routeId={selectedRouteId} 
            routes={routes}
            onRouteChange={(id) => setSelectedRouteId(id)}
          />
        );
      case 4: // Explorer (nouveau)
        return (
          <VisualizationGrid
            items={[...passes, ...routes]}
            loading={loading}
            title="Toutes les visualisations"
            filters={availableFilters}
            onFavoriteToggle={handleFavoriteToggle}
            onBookmarkToggle={handleBookmarkToggle}
            onShare={handleShare}
          />
        );
      case 5: // Favoris (nouveau)
        return (
          <VisualizationGrid
            items={[...passes, ...routes].filter(item => item.isFavorite)}
            loading={loading}
            title="Mes favoris"
            filters={availableFilters}
            onFavoriteToggle={handleFavoriteToggle}
            onBookmarkToggle={handleBookmarkToggle}
            onShare={handleShare}
            emptyStateMessage="Vous n'avez pas encore de favoris. Explorez les cols et parcours pour en ajouter."
          />
        );
      case 6: // Enregistrés (nouveau)
        return (
          <VisualizationGrid
            items={[...passes, ...routes].filter(item => item.isBookmarked)}
            loading={loading}
            title="Mes enregistrements"
            filters={availableFilters}
            onFavoriteToggle={handleFavoriteToggle}
            onBookmarkToggle={handleBookmarkToggle}
            onShare={handleShare}
            emptyStateMessage="Vous n'avez pas encore d'éléments enregistrés. Explorez les cols et parcours pour en ajouter."
          />
        );
      default:
        return null;
    }
  };

  return (
    <PageTransition>
      <Container maxWidth="xl">
        <Box component={motion.div} 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          sx={{ my: 4 }}
        >
          <DashboardHeader>
            <Container>
              <Typography variant="h3" component="h1" gutterBottom>
                Tableau de bord des visualisations
              </Typography>
              <Typography variant="h6">
                Explorez, comparez et planifiez vos aventures cyclistes
              </Typography>
            </Container>
          </DashboardHeader>
          
          {/* Section Carrousel - Nouveau */}
          <Box sx={{ mb: 6 }}>
            <VisualizationCarousel
              items={featuredItems}
              title="Découvertes recommandées"
              loading={loading}
              variant={isTablet ? "compact" : "expanded"}
              onFavoriteToggle={handleFavoriteToggle}
              onBookmarkToggle={handleBookmarkToggle}
              onShare={handleShare}
            />
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} md={3}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  <DashboardIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Visualisations
                </Typography>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  Découvrez nos différentes méthodes de visualisation pour explorer les cols et parcours cyclistes.
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  <Grid item xs={12}>
                    <motion.div
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    >
                      <FeatureCard>
                        <CardContent>
                          <FeatureIcon color="primary">
                            <ThreeDIcon fontSize="large" />
                          </FeatureIcon>
                          <Typography variant="h6" gutterBottom>
                            Visualisation 3D
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Explorez les cols en trois dimensions et préparez votre ascension avec une vision précise du terrain.
                          </Typography>
                        </CardContent>
                      </FeatureCard>
                    </motion.div>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <motion.div
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    >
                      <FeatureCard>
                        <CardContent>
                          <FeatureIcon color="secondary">
                            <CompareIcon fontSize="large" />
                          </FeatureIcon>
                          <Typography variant="h6" gutterBottom>
                            Comparaison de cols
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Comparez les profils de différents cols pour mieux planifier vos défis et votre entraînement.
                          </Typography>
                        </CardContent>
                      </FeatureCard>
                    </motion.div>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <motion.div
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    >
                      <FeatureCard>
                        <CardContent>
                          <FeatureIcon color="info">
                            <RouteIcon fontSize="large" />
                          </FeatureIcon>
                          <Typography variant="h6" gutterBottom>
                            Alternatives de parcours
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Découvrez des variantes de parcours adaptées à vos préférences et aux conditions météo.
                          </Typography>
                        </CardContent>
                      </FeatureCard>
                    </motion.div>
                  </Grid>
                </Grid>
              </motion.div>
            </Grid>

            <Grid item xs={12} md={9}>
              <StyledTabs 
                value={activeTab} 
                onChange={handleTabChange}
                variant={isMobile ? "scrollable" : "standard"}
                scrollButtons={isMobile ? "auto" : false}
                textColor="primary"
                indicatorColor="primary"
                aria-label="visualisation tabs"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <StyledTab icon={<ThreeDIcon />} label="Visualisation 3D" />
                <StyledTab icon={<TerrainIcon />} label="Visualisation Standard" />
                <StyledTab icon={<CompareIcon />} label="Comparaison" />
                <StyledTab icon={<RouteIcon />} label="Alternatives" />
                <StyledTab icon={<ExploreIcon />} label="Explorer" />
                <StyledTab icon={<FavoriteIcon />} label="Favoris" />
                <StyledTab icon={<BookmarkIcon />} label="Enregistrés" />
              </StyledTabs>
              
              <VisualizationContainer>
                {renderTabContent()}
              </VisualizationContainer>
              
              <Paper elevation={1} sx={{ p: 3, mt: 2, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  <InsightsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Fonctionnalités Premium
                </Typography>
                <Typography variant="body2" paragraph>
                  Nos visualisations avancées vous offrent une expérience complète pour préparer vos sorties cyclistes. 
                  Explorez les cols et itinéraires en 3D, analysez chaque segment et comparez les différentes options pour choisir 
                  le parcours qui correspond parfaitement à votre niveau.
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="subtitle2" gutterBottom color="primary">
                        Visualisations 3D complètes
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Explorez chaque détail des cols
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="subtitle2" gutterBottom color="primary">
                        Comparaison détaillée
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Analysez les différences entre les cols
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="subtitle2" gutterBottom color="primary">
                        Alternatives d'itinéraires
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Adaptées à la météo et votre profil
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="subtitle2" gutterBottom color="primary">
                        Export des données
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pour vos appareils GPS et smartphones
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </PageTransition>
  );
};

export default VisualizationDashboard;
