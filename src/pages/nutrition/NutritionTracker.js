import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper,
  Breadcrumbs,
  Link,
  Grid,
  Button,
  Card,
  CardContent,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  NavigateNext as NavigateNextIcon,
  InsertChart as ChartIcon,
  RestaurantMenu as FoodIcon,
  LocalFireDepartment as FireIcon,
  DirectionsBike as BikeIcon,
  Event as EventIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  MonitorWeight as WeightIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import SEOHelmet from '../../components/common/SEOHelmet';
import { useAuth } from '../../contexts/AuthContext';
import nutritionService from '../../services/nutritionService';

// Styles personnalisés
const PageContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(4, 0, 8),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2, 0, 6),
  }
}));

const PageHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(5),
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  position: 'relative',
  marginBottom: theme.spacing(1),
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

const StyledTabs = styled(Tabs)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  '& .MuiTab-root': {
    textTransform: 'none',
    fontWeight: 600,
    minHeight: 48,
  }
}));

/**
 * Page de Suivi Nutritionnel
 * Permet aux cyclistes de suivre leur alimentation et obtenir des recommandations
 */
const NutritionTracker = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [nutritionData, setNutritionData] = useState(null);
  const { currentUser } = useAuth();
  
  // Données factices pour la démonstration
  const demoData = {
    dailyIntake: {
      calories: 2780,
      carbs: 345,
      protein: 145,
      fat: 78,
      fiber: 32,
      hydration: 2.6
    },
    targets: {
      calories: 3000,
      carbs: 375,
      protein: 150,
      fat: 83,
      fiber: 35,
      hydration: 3
    },
    weeklyProgress: [
      { day: 'Lun', calories: 2600, training: 45 },
      { day: 'Mar', calories: 2850, training: 90 },
      { day: 'Mer', calories: 2500, training: 0 },
      { day: 'Jeu', calories: 3100, training: 120 },
      { day: 'Ven', calories: 2900, training: 75 },
      { day: 'Sam', calories: 3300, training: 180 },
      { day: 'Dim', calories: 2780, training: 60 }
    ],
    recentMeals: [
      { id: 1, name: 'Petit déjeuner', time: '07:30', calories: 650, carbs: 95, protein: 25, fat: 22 },
      { id: 2, name: 'Collation pré-entraînement', time: '10:00', calories: 320, carbs: 55, protein: 12, fat: 5 },
      { id: 3, name: 'Déjeuner', time: '13:30', calories: 850, carbs: 105, protein: 45, fat: 28 },
      { id: 4, name: 'Collation post-entraînement', time: '16:30', calories: 380, carbs: 45, protein: 35, fat: 8 },
      { id: 5, name: 'Dîner', time: '19:30', calories: 750, carbs: 85, protein: 38, fat: 24 }
    ]
  };
  
  useEffect(() => {
    const fetchNutritionData = async () => {
      setLoading(true);
      try {
        // En situation réelle, récupérez les données de l'utilisateur
        // const data = await nutritionService.getUserNutritionData(currentUser?.id);
        // setNutritionData(data);
        
        // Pour la démonstration, utilisez les données factices
        setTimeout(() => {
          setNutritionData(demoData);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        setLoading(false);
      }
    };
    
    fetchNutritionData();
  }, [currentUser]);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Calculer les pourcentages de macronutriments
  const calculatePercentage = (value, target) => {
    return Math.round((value / target) * 100);
  };
  
  return (
    <>
      <SEOHelmet 
        title="Suivi Nutritionnel pour Cyclistes | Velo-Altitude"
        description="Suivez votre alimentation quotidienne, vos macronutriments et votre hydratation pour optimiser vos performances à vélo."
        keywords="suivi nutritionnel, nutrition cycliste, tracker calories, hydratation vélo, alimentation cyclisme"
      />
      
      <PageContainer>
        <PageHeader>
          <Breadcrumbs 
            separator={<NavigateNextIcon fontSize="small" />} 
            aria-label="breadcrumb"
            sx={{ mb: 2 }}
          >
            <Link component={RouterLink} to="/" color="inherit">
              Accueil
            </Link>
            <Link component={RouterLink} to="/nutrition/dashboard" color="inherit">
              Nutrition
            </Link>
            <Typography color="text.primary">Suivi Nutritionnel</Typography>
          </Breadcrumbs>
          
          <SectionTitle variant="h3" component="h1">
            Suivi Nutritionnel
          </SectionTitle>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
            Suivez votre alimentation et optimisez vos apports nutritionnels pour améliorer vos performances
          </Typography>
        </PageHeader>
        
        <StyledTabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Tableau de bord" icon={<ChartIcon />} iconPosition="start" />
          <Tab label="Journal alimentaire" icon={<FoodIcon />} iconPosition="start" />
          <Tab label="Analyse" icon={<TimelineIcon />} iconPosition="start" />
          <Tab label="Recommandations" icon={<TrendingUpIcon />} iconPosition="start" />
        </StyledTabs>
        
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress size={60} thickness={4} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Chargement de vos données...
            </Typography>
          </Box>
        ) : (
          <>
            {/* Tableau de bord */}
            <Box role="tabpanel" hidden={activeTab !== 0}>
              {activeTab === 0 && nutritionData && (
                <Grid container spacing={3}>
                  {/* Résumé quotidien */}
                  <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                      <Typography variant="h6" component="h2" gutterBottom>
                        Résumé Quotidien
                      </Typography>
                      
                      <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6} md={4}>
                          <Card sx={{ bgcolor: '#f3f8ff', height: '100%' }}>
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                  Calories
                                </Typography>
                                <FireIcon color="primary" />
                              </Box>
                              <Box sx={{ mt: 2, mb: 1 }}>
                                <Typography variant="h4" component="div" fontWeight={600}>
                                  {nutritionData.dailyIntake.calories}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  / {nutritionData.targets.calories} kcal
                                </Typography>
                              </Box>
                              <Box sx={{ 
                                height: 6, 
                                bgcolor: '#e0e0e0', 
                                borderRadius: 3, 
                                position: 'relative',
                                overflow: 'hidden'
                              }}>
                                <Box sx={{ 
                                  position: 'absolute', 
                                  top: 0, 
                                  left: 0, 
                                  height: '100%', 
                                  width: `${calculatePercentage(nutritionData.dailyIntake.calories, nutritionData.targets.calories)}%`,
                                  bgcolor: 'primary.main',
                                  borderRadius: 3
                                }} />
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={4}>
                          <Card sx={{ bgcolor: '#fff5f5', height: '100%' }}>
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                  Glucides
                                </Typography>
                                <BikeIcon color="error" />
                              </Box>
                              <Box sx={{ mt: 2, mb: 1 }}>
                                <Typography variant="h4" component="div" fontWeight={600}>
                                  {nutritionData.dailyIntake.carbs}g
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  / {nutritionData.targets.carbs}g
                                </Typography>
                              </Box>
                              <Box sx={{ 
                                height: 6, 
                                bgcolor: '#e0e0e0', 
                                borderRadius: 3, 
                                position: 'relative',
                                overflow: 'hidden'
                              }}>
                                <Box sx={{ 
                                  position: 'absolute', 
                                  top: 0, 
                                  left: 0, 
                                  height: '100%', 
                                  width: `${calculatePercentage(nutritionData.dailyIntake.carbs, nutritionData.targets.carbs)}%`,
                                  bgcolor: 'error.main',
                                  borderRadius: 3
                                }} />
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={4}>
                          <Card sx={{ bgcolor: '#f3fff5', height: '100%' }}>
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                  Protéines
                                </Typography>
                                <WeightIcon color="success" />
                              </Box>
                              <Box sx={{ mt: 2, mb: 1 }}>
                                <Typography variant="h4" component="div" fontWeight={600}>
                                  {nutritionData.dailyIntake.protein}g
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  / {nutritionData.targets.protein}g
                                </Typography>
                              </Box>
                              <Box sx={{ 
                                height: 6, 
                                bgcolor: '#e0e0e0', 
                                borderRadius: 3, 
                                position: 'relative',
                                overflow: 'hidden'
                              }}>
                                <Box sx={{ 
                                  position: 'absolute', 
                                  top: 0, 
                                  left: 0, 
                                  height: '100%', 
                                  width: `${calculatePercentage(nutritionData.dailyIntake.protein, nutritionData.targets.protein)}%`,
                                  bgcolor: 'success.main',
                                  borderRadius: 3
                                }} />
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                  
                  {/* Actions rapides */}
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, borderRadius: 3, mb: 3, height: '100%' }}>
                      <Typography variant="h6" component="h2" gutterBottom>
                        Actions rapides
                      </Typography>
                      <List>
                        <ListItem 
                          button
                          sx={{ borderRadius: 2, mb: 1 }}
                          component={RouterLink} 
                          to="/nutrition/meal-planner"
                        >
                          <ListItemIcon>
                            <FoodIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText primary="Planifier mes repas" />
                        </ListItem>
                        <ListItem 
                          button
                          sx={{ borderRadius: 2, mb: 1 }}
                          component={RouterLink} 
                          to="/nutrition/macro-calculator"
                        >
                          <ListItemIcon>
                            <ChartIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText primary="Calculer mes besoins" />
                        </ListItem>
                        <ListItem 
                          button
                          sx={{ borderRadius: 2, mb: 1 }}
                          component={RouterLink} 
                          to="/nutrition/recipes"
                        >
                          <ListItemIcon>
                            <RestaurantMenu color="primary" />
                          </ListItemIcon>
                          <ListItemText primary="Explorer les recettes" />
                        </ListItem>
                      </List>
                    </Paper>
                  </Grid>
                  
                  {/* Derniers repas */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                      <Typography variant="h6" component="h2" gutterBottom>
                        Derniers repas enregistrés
                      </Typography>
                      <List>
                        {nutritionData.recentMeals.map((meal) => (
                          <ListItem key={meal.id} sx={{ px: 0 }}>
                            <ListItemIcon>
                              <FoodIcon color="action" />
                            </ListItemIcon>
                            <ListItemText 
                              primary={meal.name} 
                              secondary={
                                <Typography variant="body2" color="text.secondary">
                                  {meal.time} • {meal.calories} kcal • {meal.carbs}g glucides • {meal.protein}g protéines
                                </Typography>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                      <Button 
                        variant="outlined" 
                        color="primary" 
                        fullWidth 
                        sx={{ mt: 2 }}
                      >
                        Ajouter un repas
                      </Button>
                    </Paper>
                  </Grid>
                  
                  {/* Progrès hebdomadaire */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                      <Typography variant="h6" component="h2" gutterBottom sx={{ mb: 3 }}>
                        Progrès hebdomadaire
                      </Typography>
                      
                      <Box sx={{ height: 200, display: 'flex', justifyContent: 'space-between' }}>
                        {nutritionData.weeklyProgress.map((day, index) => (
                          <Box 
                            key={index} 
                            sx={{ 
                              display: 'flex', 
                              flexDirection: 'column',
                              alignItems: 'center',
                              width: '14%'
                            }}
                          >
                            <Box 
                              sx={{ 
                                height: 150,
                                width: '80%',
                                position: 'relative',
                                mb: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-end'
                              }}
                            >
                              <Tooltip 
                                title={`${day.calories} kcal • ${day.training} min d'entraînement`}
                                arrow
                                placement="top"
                              >
                                <Box 
                                  sx={{ 
                                    height: `${(day.calories / 3500) * 100}%`,
                                    bgcolor: day.training > 0 ? 'primary.main' : 'grey.300',
                                    borderRadius: '4px 4px 0 0',
                                    width: '100%',
                                    position: 'relative',
                                    '&::after': day.training > 0 ? {
                                      content: '""',
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      height: 3,
                                      bgcolor: '#ff4081',
                                      borderRadius: '4px 4px 0 0',
                                    } : {}
                                  }}
                                />
                              </Tooltip>
                            </Box>
                            <Typography variant="caption" fontWeight={day.day === 'Dim' ? 700 : 400}>
                              {day.day}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              )}
            </Box>
            
            {/* Onglets supplémentaires - à compléter */}
            <Box role="tabpanel" hidden={activeTab !== 1}>
              {activeTab === 1 && (
                <Paper sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    Journal Alimentaire
                  </Typography>
                  <Typography>
                    Fonctionnalité en cours de développement...
                  </Typography>
                </Paper>
              )}
            </Box>
            
            <Box role="tabpanel" hidden={activeTab !== 2}>
              {activeTab === 2 && (
                <Paper sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    Analyse Nutritionnelle
                  </Typography>
                  <Typography>
                    Fonctionnalité en cours de développement...
                  </Typography>
                </Paper>
              )}
            </Box>
            
            <Box role="tabpanel" hidden={activeTab !== 3}>
              {activeTab === 3 && (
                <Paper sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    Recommandations Personnalisées
                  </Typography>
                  <Typography>
                    Fonctionnalité en cours de développement...
                  </Typography>
                </Paper>
              )}
            </Box>
          </>
        )}
        
        <Box sx={{ mt: 5, textAlign: 'center' }}>
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            component={RouterLink}
            to="/nutrition/dashboard"
            startIcon={<NavigateNextIcon />}
          >
            Retour au Dashboard Nutrition
          </Button>
        </Box>
      </PageContainer>
    </>
  );
};

export default NutritionTracker;
