import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  Button, 
  Card, 
  CardContent, 
  CardMedia, 
  CardActions,
  IconButton, 
  Divider, 
  Chip, 
  Tooltip,
  Zoom,
  Fade,
  useMediaQuery,
  Skeleton,
  LinearProgress,
  Tabs,
  Tab
} from '@mui/material';
import { styled, useTheme, alpha } from '@mui/material/styles';
import { 
  Restaurant as RestaurantIcon,
  FlashOn as FlashOnIcon,
  TrendingUp as TrendingUpIcon,
  Opacity as OpacityIcon,
  WaterDrop as WaterDropIcon,
  Schedule as ScheduleIcon,
  DirectionsBike as BikeIcon,
  Bolt as BoltIcon,
  Search as SearchIcon,
  NavigateNext as NavigateNextIcon,
  LocalFireDepartment as FireIcon,
  FitnessCenter as FitnessIcon,
  Analytics as AnalyticsIcon,
  NewReleases as NewIcon,
  Star as StarIcon,
  Speed as SpeedIcon,
  Favorite as FavoriteIcon,
  TimerOutlined as TimerIcon,
  BarChart as BarChartIcon,
  Chat as ChatIcon
} from '@mui/icons-material';

// Import des services
import nutritionService from '../../services/nutritionService';
import { useAuth } from '../../contexts/AuthContext';
// Import du composant AIChatbox
import AIChatbox from '../../components/dashboard/AIChatbox';

// Styles personnalisés
const DashboardContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(4, 0, 8),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2, 0, 6),
  }
}));

const WelcomeSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(6, 4),
  borderRadius: theme.shape.borderRadius * 3,
  marginBottom: theme.spacing(6),
  backgroundImage: 'linear-gradient(120deg, #0288d1 0%, #26a69a 100%)',
  color: 'white',
  overflow: 'hidden',
  boxShadow: theme.shadows[5],
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(4, 2),
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: 'url(/assets/images/nutrition/nutrition-pattern.png)',
    backgroundSize: 'cover',
    opacity: 0.1,
    zIndex: 1,
  }
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  position: 'relative',
  marginBottom: theme.spacing(3),
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: -8,
    left: 0,
    width: 60,
    height: 4,
    backgroundColor: theme.palette.primary.main,
    borderRadius: 2,
  }
}));

const ToolCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.shape.borderRadius * 2,
  transition: 'all 0.3s ease',
  overflow: 'hidden',
  boxShadow: theme.shadows[2],
  position: 'relative',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.shadows[8],
    '& .MuiCardMedia-root': {
      transform: 'scale(1.05)'
    }
  }
}));

const NewBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 16,
  right: 16,
  zIndex: 2,
  backgroundColor: theme.palette.error.main,
  color: 'white',
  padding: '4px 8px',
  borderRadius: 12,
  fontSize: '0.75rem',
  fontWeight: 700,
  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  display: 'flex',
  alignItems: 'center',
  gap: 4
}));

const ToolCardMedia = styled(CardMedia)(({ theme }) => ({
  height: 180,
  transition: 'transform 0.5s ease',
  transformOrigin: 'center',
}));

const ToolCardContent = styled(CardContent)(({ theme }) => ({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(3),
}));

const ToolCardActions = styled(CardActions)(({ theme }) => ({
  padding: theme.spacing(0, 3, 2),
  justifyContent: 'flex-end'
}));

const ToolIconWrapper = styled(Box)(({ theme, bgcolor }) => ({
  width: 60,
  height: 60,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(2),
  backgroundColor: bgcolor || alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
}));

const UserProgress = styled(Box)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.background.paper, 0.9),
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(3),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(4),
  boxShadow: theme.shadows[1],
  position: 'relative',
  zIndex: 2
}));

const ProgressItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(1),
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  '& .MuiTab-root': {
    textTransform: 'none',
    minHeight: 60,
    fontWeight: 600,
    fontSize: '1rem',
  },
  '& .MuiTabs-indicator': {
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
}));

// Composant principal du dashboard Nutrition
const NutritionDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  // États
  const [loading, setLoading] = useState(true);
  const [userNutrition, setUserNutrition] = useState(null);
  const [recentRecipes, setRecentRecipes] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  // État pour le chatbox
  const [chatboxVisible, setChatboxVisible] = useState(true);
  
  // Récupération des données de nutrition de l'utilisateur
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        if (user && user.id) {
          // Récupération des données nutritionnelles de l'utilisateur
          const nutritionData = await nutritionService.getUserNutritionData(user.id);
          setUserNutrition(nutritionData);
        }
        
        // Récupération des recettes récentes
        const recipes = await nutritionService.getRecipes({ 
          sort: 'recent',
          limit: 4
        });
        setRecentRecipes(recipes.slice(0, 4));
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [user]);
  
  // Gestion du changement d'onglet
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Navigation vers les outils
  const handleNavigate = (path) => {
    navigate(path);
  };
  
  // Outils nutrition par catégorie
  const nutritionTools = {
    recettes: [
      {
        id: 'recipe-gallery',
        title: 'Galerie de Recettes HD',
        description: 'Explorez plus de 100 recettes adaptées aux cyclistes avec notre nouvelle interface visuelle améliorée',
        icon: <RestaurantIcon fontSize="large" />,
        path: '/nutrition/recipes',
        iconBg: alpha(theme.palette.success.main, 0.1),
        iconColor: theme.palette.success.main,
        image: '/assets/images/nutrition/recipe-gallery.jpg',
        isNew: true
      },
      {
        id: 'recipe-finder',
        title: 'Recherche Avancée',
        description: 'Trouvez des recettes selon vos besoins spécifiques : phase d\'entraînement, objectifs, préférences',
        icon: <SearchIcon fontSize="large" />,
        path: '/nutrition/recipe-finder',
        iconBg: alpha(theme.palette.info.main, 0.1),
        iconColor: theme.palette.info.main,
        image: '/assets/images/nutrition/recipe-search.jpg'
      }
    ],
    planification: [
      {
        id: 'meal-planner',
        title: 'Planificateur de Repas',
        description: 'Créez votre plan alimentaire hebdomadaire adapté à votre calendrier d\'entraînement',
        icon: <ScheduleIcon fontSize="large" />,
        path: '/nutrition/meal-planner',
        iconBg: alpha(theme.palette.primary.main, 0.1),
        iconColor: theme.palette.primary.main,
        image: '/assets/images/nutrition/meal-planning.jpg'
      },
      {
        id: 'nutrition-training-sync',
        title: 'Synchronisation Entraînement',
        description: 'Synchronisez votre nutrition avec votre plan d\'entraînement pour des performances optimales',
        icon: <BikeIcon fontSize="large" />,
        path: '/nutrition/sync-training',
        iconBg: alpha(theme.palette.secondary.main, 0.1),
        iconColor: theme.palette.secondary.main,
        image: '/assets/images/nutrition/training-sync.jpg'
      }
    ],
    calculateurs: [
      {
        id: 'macro-calculator',
        title: 'Calculateur de Macros',
        description: 'Déterminez vos besoins en calories et macronutriments selon votre profil et vos objectifs',
        icon: <BarChartIcon fontSize="large" />,
        path: '/nutrition/macro-calculator',
        iconBg: alpha(theme.palette.warning.main, 0.1),
        iconColor: theme.palette.warning.main,
        image: '/assets/images/nutrition/macro-calc.jpg'
      },
      {
        id: 'hydration-calculator',
        title: 'Calculateur d\'Hydratation',
        description: 'Calculez vos besoins en hydratation pour vos sorties selon la durée, l\'intensité et la météo',
        icon: <WaterDropIcon fontSize="large" />,
        path: '/nutrition/hydration-calculator',
        iconBg: alpha('#2196f3', 0.1),
        iconColor: '#2196f3',
        image: '/assets/images/nutrition/hydration.jpg'
      },
      {
        id: 'race-day-nutrition',
        title: 'Nutrition Jour de Course',
        description: 'Plan nutritionnel spécifique pour vos journées de compétition ou grandes sorties',
        icon: <FireIcon fontSize="large" />,
        path: '/nutrition/race-day',
        iconBg: alpha(theme.palette.error.main, 0.1),
        iconColor: theme.palette.error.main,
        image: '/assets/images/nutrition/race-day.jpg'
      }
    ],
    suivi: [
      {
        id: 'nutrition-tracker',
        title: 'Suivi Nutritionnel',
        description: 'Suivez votre apport quotidien en calories et macronutriments, avec analyses et recommandations',
        icon: <TrendingUpIcon fontSize="large" />,
        path: '/nutrition/tracker',
        iconBg: alpha(theme.palette.primary.main, 0.1),
        iconColor: theme.palette.primary.main,
        image: '/assets/images/nutrition/nutrition-tracking.jpg'
      },
      {
        id: 'recovery-nutrition',
        title: 'Nutrition Récupération',
        description: 'Optimisez votre récupération avec des recommandations nutritionnelles personnalisées',
        icon: <FitnessIcon fontSize="large" />,
        path: '/nutrition/recovery',
        iconBg: alpha('#9c27b0', 0.1),
        iconColor: '#9c27b0',
        image: '/assets/images/nutrition/recovery.jpg'
      }
    ]
  };
  
  // Rendu des cartes d'outils
  const renderToolCards = (tools) => {
    return tools.map((tool) => (
      <Grid item xs={12} sm={6} md={4} key={tool.id}>
        <Zoom in={true} style={{ transitionDelay: '100ms' }}>
          <ToolCard>
            {tool.isNew && (
              <NewBadge>
                <NewIcon fontSize="small" />
                NOUVEAU
              </NewBadge>
            )}
            <ToolCardMedia
              image={tool.image}
              title={tool.title}
            />
            <ToolCardContent>
              <ToolIconWrapper bgcolor={tool.iconBg} sx={{ color: tool.iconColor }}>
                {tool.icon}
              </ToolIconWrapper>
              <Typography variant="h6" component="h3" gutterBottom>
                {tool.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {tool.description}
              </Typography>
            </ToolCardContent>
            <ToolCardActions>
              <Button 
                variant="contained" 
                color="primary" 
                endIcon={<NavigateNextIcon />}
                onClick={() => handleNavigate(tool.path)}
              >
                Accéder
              </Button>
            </ToolCardActions>
          </ToolCard>
        </Zoom>
      </Grid>
    ));
  };
  
  return (
    <DashboardContainer maxWidth="xl">
      {/* Section d'accueil */}
      <WelcomeSection>
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Typography variant="h3" component="h1" gutterBottom fontWeight={700}>
            Dashboard Nutrition
          </Typography>
          <Typography variant="h6" component="div" sx={{ mb: 3, maxWidth: 700 }}>
            Optimisez votre alimentation pour des performances cyclistes maximales
          </Typography>
          
          <Button 
            variant="contained" 
            color="secondary" 
            size="large"
            startIcon={<StarIcon />}
            sx={{ 
              borderRadius: 30, 
              px: 3, 
              py: 1, 
              backgroundColor: 'white', 
              color: theme.palette.primary.main,
              '&:hover': { backgroundColor: alpha(theme.palette.common.white, 0.9) }
            }}
            onClick={() => handleNavigate('/nutrition/recipes')}
          >
            Découvrir Notre Nouvelle Galerie de Recettes
          </Button>
        </Box>
        
        {/* Progrès de l'utilisateur */}
        {!loading && user && userNutrition && (
          <UserProgress>
            <Typography variant="h6" gutterBottom>
              Votre Suivi Nutritionnel
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <ProgressItem>
                  <Typography variant="body2" sx={{ width: 180 }}>
                    Complétude du profil:
                  </Typography>
                  <Box sx={{ flexGrow: 1, ml: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={userNutrition.profileCompletion} 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ ml: 2, minWidth: 40, textAlign: 'right' }}>
                    {userNutrition.profileCompletion}%
                  </Typography>
                </ProgressItem>
                
                <ProgressItem>
                  <Typography variant="body2" sx={{ width: 180 }}>
                    Adhérence au plan:
                  </Typography>
                  <Box sx={{ flexGrow: 1, ml: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={userNutrition.planAdherence} 
                      color="success"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ ml: 2, minWidth: 40, textAlign: 'right' }}>
                    {userNutrition.planAdherence}%
                  </Typography>
                </ProgressItem>
                
                <ProgressItem>
                  <Typography variant="body2" sx={{ width: 180 }}>
                    Synchronisation entraînement:
                  </Typography>
                  <Box sx={{ flexGrow: 1, ml: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={userNutrition.trainingSyncLevel} 
                      color="secondary"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ ml: 2, minWidth: 40, textAlign: 'right' }}>
                    {userNutrition.trainingSyncLevel}%
                  </Typography>
                </ProgressItem>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <RestaurantIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {userNutrition.weeklySummary.mealsLogged} repas enregistrés cette semaine
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <FavoriteIcon color="error" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {userNutrition.weeklySummary.favoriteRecipes} recettes ajoutées aux favoris
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TimerIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {userNutrition.weeklySummary.planningDays} jours de planification complétés
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => handleNavigate('/nutrition/dashboard/details')}
              >
                Voir mon rapport complet
              </Button>
            </Box>
          </UserProgress>
        )}
      </WelcomeSection>
      
      {/* Navigation principale */}
      <StyledTabs 
        value={activeTab} 
        onChange={handleTabChange}
        variant={isMobile ? "scrollable" : "standard"}
        scrollButtons={isMobile ? "auto" : undefined}
        centered={!isMobile}
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab 
          icon={<RestaurantIcon />} 
          iconPosition="start" 
          label="Recettes" 
        />
        <Tab 
          icon={<ScheduleIcon />} 
          iconPosition="start" 
          label="Planification" 
        />
        <Tab 
          icon={<AnalyticsIcon />} 
          iconPosition="start" 
          label="Calculateurs" 
        />
        <Tab 
          icon={<TrendingUpIcon />} 
          iconPosition="start" 
          label="Suivi" 
        />
      </StyledTabs>
      
      {/* Contenu des onglets */}
      <Box role="tabpanel" hidden={activeTab !== 0}>
        {activeTab === 0 && (
          <>
            <SectionTitle variant="h4" component="h2">
              Exploration de Recettes
            </SectionTitle>
            <Typography variant="subtitle1" paragraph color="text.secondary">
              Découvrez nos recettes spécialement conçues pour les cyclistes à chaque étape de votre entraînement.
            </Typography>
            
            <Grid container spacing={3}>
              {renderToolCards(nutritionTools.recettes)}
              
              {/* Recettes récentes */}
              {recentRecipes.length > 0 && (
                <Grid item xs={12}>
                  <Box sx={{ mt: 4, mb: 2 }}>
                    <Typography variant="h5" component="h3" gutterBottom>
                      Recettes Récemment Ajoutées
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    {recentRecipes.map((recipe, index) => (
                      <Grid item xs={12} sm={6} md={3} key={recipe.id || index}>
                        <Card 
                          sx={{ 
                            height: '100%',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              boxShadow: theme.shadows[6],
                              transform: 'translateY(-4px)'
                            }
                          }}
                          onClick={() => handleNavigate(`/nutrition/recipes/${recipe.id}`)}
                        >
                          <CardMedia
                            component="img"
                            height="140"
                            image={recipe.imageUrl}
                            alt={recipe.title}
                          />
                          <CardContent>
                            <Typography variant="h6" component="div" noWrap>
                              {recipe.title}
                            </Typography>
                            <Box sx={{ display: 'flex', mt: 1, gap: 0.5 }}>
                              {recipe.category && (
                                <Chip 
                                  label={recipe.category} 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined"
                                />
                              )}
                              {recipe.prepTime && (
                                <Chip 
                                  icon={<TimerIcon />} 
                                  label={`${recipe.prepTime} min`} 
                                  size="small" 
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              )}
            </Grid>
          </>
        )}
      </Box>
      
      <Box role="tabpanel" hidden={activeTab !== 1}>
        {activeTab === 1 && (
          <>
            <SectionTitle variant="h4" component="h2">
              Planification Nutritionnelle
            </SectionTitle>
            <Typography variant="subtitle1" paragraph color="text.secondary">
              Planifiez votre alimentation en fonction de vos objectifs et de votre calendrier d'entraînement.
            </Typography>
            
            <Grid container spacing={3}>
              {renderToolCards(nutritionTools.planification)}
            </Grid>
          </>
        )}
      </Box>
      
      <Box role="tabpanel" hidden={activeTab !== 2}>
        {activeTab === 2 && (
          <>
            <SectionTitle variant="h4" component="h2">
              Calculateurs Nutritionnels
            </SectionTitle>
            <Typography variant="subtitle1" paragraph color="text.secondary">
              Déterminez précisément vos besoins nutritionnels selon votre profil, vos objectifs et vos activités.
            </Typography>
            
            <Grid container spacing={3}>
              {renderToolCards(nutritionTools.calculateurs)}
            </Grid>
          </>
        )}
      </Box>
      
      <Box role="tabpanel" hidden={activeTab !== 3}>
        {activeTab === 3 && (
          <>
            <SectionTitle variant="h4" component="h2">
              Suivi et Analyse
            </SectionTitle>
            <Typography variant="subtitle1" paragraph color="text.secondary">
              Suivez vos habitudes alimentaires et obtenez des recommandations personnalisées.
            </Typography>
            
            <Grid container spacing={3}>
              {renderToolCards(nutritionTools.suivi)}
            </Grid>
          </>
        )}
      </Box>
      
      {/* AI Chatbox integration */}
      {chatboxVisible && (
        <AIChatbox
          position="fixed"
          bottom={isMobile ? 0 : 20}
          right={isMobile ? 0 : 20}
          width={isMobile ? '100%' : '350px'}
          height={isMobile ? '70vh' : '500px'}
        />
      )}
      
      {/* Chat toggle button for mobile */}
      {isMobile && !chatboxVisible && (
        <button 
          className="chat-toggle-button"
          onClick={() => setChatboxVisible(true)}
          aria-label="Ouvrir l'assistant IA"
        >
          <span className="chat-icon">💬</span>
        </button>
      )}
      
      {/* Section Mise en avant */}
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper
          sx={{
            p: 4,
            borderRadius: theme.shape.borderRadius * 2,
            backgroundImage: 'linear-gradient(120deg, #f5f5f5 0%, #e0f7fa 100%)',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography variant="h4" component="h2" gutterBottom fontWeight={700}>
                Module Nutrition Amélioré
              </Typography>
              <Typography variant="body1" paragraph>
                Profitez de notre toute nouvelle expérience visuelle pour explorer et utiliser nos recettes adaptées aux cyclistes. 
                Découvrez l'infographie nutritionnelle interactive, les filtres visuels et les instructions étape par étape.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<RestaurantIcon />}
                  onClick={() => handleNavigate('/nutrition/recipes')}
                >
                  Explorer la Galerie HD
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  startIcon={<AnalyticsIcon />}
                  onClick={() => handleNavigate('/nutrition/macro-calculator')}
                >
                  Calculer Mes Besoins
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box
                component="img"
                src="/assets/images/nutrition/nutrition-dashboard-illustration.png"
                alt="Nutrition pour cyclistes"
                sx={{
                  width: '100%',
                  maxHeight: 300,
                  objectFit: 'contain'
                }}
              />
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </DashboardContainer>
  );
};

export default NutritionDashboard;
