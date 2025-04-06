import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Breadcrumbs,
  Link as MuiLink,
  useTheme
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  LocalFireDepartment as LocalFireDepartmentIcon,
  MenuBook as MenuBookIcon,
  ShowChart as ShowChartIcon,
  DirectionsBike as DirectionsBikeIcon,
  FitnessCenter as FitnessCenterIcon,
  BarChart as BarChartIcon,
  EmojiEvents as EmojiEventsIcon,
  Today as TodayIcon,
  Home as HomeIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { APIOrchestrator } from '../../api/orchestration';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Composant de carte pour le Dashboard
interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  linkText: string;
  linkUrl: string;
  stats?: {
    label: string;
    value: string;
  }[];
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  description,
  icon,
  color,
  linkText,
  linkUrl,
  stats
}) => {
  const theme = useTheme();
  
  return (
    <Card 
      variant="outlined" 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderLeft: `4px solid ${color}`,
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[3]
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 2,
            gap: 1
          }}
        >
          <Avatar sx={{ bgcolor: `${color}20`, color: color }}>
            {icon}
          </Avatar>
          <Typography variant="h6" component="h2">
            {title}
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          {description}
        </Typography>
        
        {stats && (
          <Box sx={{ my: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {stats.map((stat, index) => (
                <Grid item xs={6} key={index}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {stat.label}
                  </Typography>
                  <Typography variant="subtitle2" color="text.primary">
                    {stat.value}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
        <Button 
          component={Link} 
          href={linkUrl}
          endIcon={<ArrowForwardIcon />}
          sx={{ color }}
        >
          {linkText}
        </Button>
      </CardActions>
    </Card>
  );
};

// Composant principal du Dashboard Nutritionnel
const NutritionDashboard: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  
  // États
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [todayEntries, setTodayEntries] = useState<any[]>([]);
  
  // Récupération des données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const api = new APIOrchestrator();
        
        // Date d'aujourd'hui
        const today = format(new Date(), 'yyyy-MM-dd');
        
        // Récupérer les entrées du journal pour aujourd'hui
        const entries = await api.getNutritionLogEntries(today);
        setTodayEntries(entries);
        
        // Récupérer le plan nutritionnel actif
        const activePlan = await api.getActiveNutritionPlan();
        
        // Récupérer les tendances nutritionnelles
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        const startDateStr = format(startDate, 'yyyy-MM-dd');
        const endDateStr = format(endDate, 'yyyy-MM-dd');
        
        const trends = await api.getNutritionTrends(startDateStr, endDateStr);
        
        // Récupérer les séances d'entraînement à venir
        const trainingSessions = await api.getUpcomingTrainingSessions();
        
        // Récupérer les recommandations
        const recommendations = await api.getNutritionTrainingRecommendations(activePlan?.id);
        
        // Combiner toutes les données
        setDashboardData({
          activePlan,
          trends,
          trainingSessions,
          recommendations
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors de la récupération des données du dashboard:', err);
        setError('Impossible de charger les données. Veuillez réessayer plus tard.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Calcul des totaux nutritionnels pour aujourd'hui
  const calculateTotals = () => {
    if (!todayEntries || todayEntries.length === 0) {
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      };
    }
    
    return todayEntries.reduce((acc, entry) => {
      return {
        calories: acc.calories + entry.calories,
        protein: acc.protein + entry.protein,
        carbs: acc.carbs + entry.carbs,
        fat: acc.fat + entry.fat
      };
    }, {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    });
  };
  
  const totals = calculateTotals();
  const dailyTarget = dashboardData?.activePlan?.dailyCalories || 0;
  const calorieProgress = dailyTarget > 0 ? Math.min(Math.round((totals.calories / dailyTarget) * 100), 100) : 0;
  
  // Formatage de la date pour l'affichage
  const formattedDate = format(new Date(), 'EEEE d MMMM yyyy', { locale: fr });
  
  return (
    <>
      <Head>
        <title>Dashboard Nutritionnel | Velo-Altitude</title>
        <meta name="description" content="Tableau de bord nutritionnel complet pour cyclistes, avec suivi des repas, plans personnalisés et recommandations d'entraînement." />
      </Head>
      
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          {/* Fil d'Ariane */}
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
            <Link href="/" passHref>
              <MuiLink
                underline="hover"
                sx={{ display: 'flex', alignItems: 'center' }}
                color="inherit"
              >
                <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Accueil
              </MuiLink>
            </Link>
            <Link href="/nutrition" passHref>
              <MuiLink
                underline="hover"
                sx={{ display: 'flex', alignItems: 'center' }}
                color="inherit"
              >
                <RestaurantIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Nutrition
              </MuiLink>
            </Link>
            <Typography
              sx={{ display: 'flex', alignItems: 'center' }}
              color="text.primary"
            >
              <BarChartIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              Dashboard Nutritionnel
            </Typography>
          </Breadcrumbs>
          
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Dashboard Nutritionnel
          </Typography>
          
          {error ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          ) : loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Section: Résumé quotidien */}
              <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TodayIcon color="primary" />
                    Résumé nutritionnel du {formattedDate}
                  </Typography>
                  
                  <Button 
                    variant="outlined" 
                    component={Link}
                    href="/nutrition/journal"
                  >
                    Voir le journal
                  </Button>
                </Box>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        Progression calorique quotidienne
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ position: 'relative', width: 60, height: 60 }}>
                          <CircularProgress
                            variant="determinate"
                            value={calorieProgress}
                            size={60}
                            sx={{
                              color: calorieProgress > 100 
                                ? theme.palette.error.main 
                                : theme.palette.primary.main
                            }}
                          />
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              bottom: 0,
                              right: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Typography variant="caption" component="div" color="text.secondary">
                              {calorieProgress}%
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box>
                          <Typography variant="body2">
                            <strong>{totals.calories}</strong> / {dailyTarget} kcal
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {dailyTarget - totals.calories > 0 
                              ? `Reste ${dailyTarget - totals.calories} kcal`
                              : `Dépassement de ${totals.calories - dailyTarget} kcal`}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 3, mt: 3 }}>
                      <Box>
                        <Typography variant="body2" color="primary.main">
                          Protéines
                        </Typography>
                        <Typography variant="h6">
                          {totals.protein}g
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="info.main">
                          Glucides
                        </Typography>
                        <Typography variant="h6">
                          {totals.carbs}g
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="warning.main">
                          Lipides
                        </Typography>
                        <Typography variant="h6">
                          {totals.fat}g
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    {todayEntries.length === 0 ? (
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 3, 
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%',
                          minHeight: 200
                        }}
                      >
                        <RestaurantIcon color="action" sx={{ fontSize: 40, mb: 2, opacity: 0.5 }} />
                        <Typography variant="body1" paragraph>
                          Aucun repas enregistré aujourd'hui
                        </Typography>
                        <Button 
                          variant="contained" 
                          component={Link}
                          href="/nutrition/journal"
                        >
                          Ajouter un repas
                        </Button>
                      </Paper>
                    ) : (
                      <List sx={{ width: '100%' }}>
                        {todayEntries.slice(0, 3).map((entry) => (
                          <ListItem
                            key={entry.id}
                            alignItems="flex-start"
                            sx={{ 
                              p: 1.5, 
                              mb: 1, 
                              borderRadius: 1,
                              bgcolor: `${theme.palette.background.default}50`
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                                <RestaurantIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={entry.foodName}
                              secondary={
                                <>
                                  <Typography component="span" variant="body2" color="text.primary">
                                    {entry.mealType}
                                  </Typography>
                                  {` — ${entry.calories} kcal`}
                                </>
                              }
                            />
                            <Chip 
                              label={`${entry.protein}g P`} 
                              size="small" 
                              sx={{ mr: 0.5 }} 
                              color="primary"
                              variant="outlined"
                            />
                          </ListItem>
                        ))}
                        
                        {todayEntries.length > 3 && (
                          <Button 
                            fullWidth
                            sx={{ mt: 1 }}
                            component={Link}
                            href="/nutrition/journal"
                          >
                            Voir tous les repas ({todayEntries.length})
                          </Button>
                        )}
                      </List>
                    )}
                  </Grid>
                </Grid>
              </Paper>
              
              {/* Section: Modules de Nutrition */}
              <Typography variant="h5" component="h2" gutterBottom>
                Modules de Nutrition
              </Typography>
              
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6} lg={4}>
                  <DashboardCard
                    title="Journal Nutritionnel"
                    description="Suivez votre alimentation quotidienne, analysez vos tendances et synchronisez avec vos entraînements."
                    icon={<MenuBookIcon />}
                    color={theme.palette.primary.main}
                    linkText="Accéder au journal"
                    linkUrl="/nutrition/journal"
                    stats={[
                      { label: 'Repas aujourd\'hui', value: `${todayEntries.length}` },
                      { label: 'Calories', value: `${totals.calories} / ${dailyTarget} kcal` }
                    ]}
                  />
                </Grid>
                
                <Grid item xs={12} md={6} lg={4}>
                  <DashboardCard
                    title="Plans Nutritionnels"
                    description="Créez et suivez des plans nutritionnels personnalisés adaptés à vos objectifs cyclistes."
                    icon={<LocalFireDepartmentIcon />}
                    color={theme.palette.error.main}
                    linkText="Voir mes plans"
                    linkUrl="/nutrition/plans"
                    stats={[
                      { label: 'Plan actif', value: dashboardData?.activePlan ? 'Oui' : 'Non' },
                      { label: 'Objectif calorique', value: `${dailyTarget} kcal` }
                    ]}
                  />
                </Grid>
                
                <Grid item xs={12} md={6} lg={4}>
                  <DashboardCard
                    title="Recettes pour Cyclistes"
                    description="Découvrez plus de 200 recettes spécialement conçues pour les cyclistes et adaptées à vos besoins."
                    icon={<RestaurantIcon />}
                    color={theme.palette.success.main}
                    linkText="Explorer les recettes"
                    linkUrl="/nutrition/recettes"
                    stats={[
                      { label: 'Recettes disponibles', value: '200+' },
                      { label: 'Catégories', value: '4' }
                    ]}
                  />
                </Grid>
                
                <Grid item xs={12} md={6} lg={4}>
                  <DashboardCard
                    title="Calculateur de Macros"
                    description="Calculez vos besoins caloriques et en macronutriments en fonction de votre profil cycliste."
                    icon={<BarChartIcon />}
                    color={theme.palette.info.main}
                    linkText="Calculer mes besoins"
                    linkUrl="/nutrition/MacroCalculator"
                    stats={[
                      { label: 'Dernière mise à jour', value: '7 jours' },
                      { label: 'Précision', value: 'Élevée' }
                    ]}
                  />
                </Grid>
                
                <Grid item xs={12} md={6} lg={4}>
                  <DashboardCard
                    title="Synchronisation Entraînement"
                    description="Adaptez votre nutrition en fonction de vos séances d'entraînement pour maximiser vos performances."
                    icon={<DirectionsBikeIcon />}
                    color={theme.palette.warning.main}
                    linkText="Synchroniser"
                    linkUrl="/nutrition/journal?tab=sync"
                    stats={[
                      { label: 'Séances à venir', value: `${dashboardData?.trainingSessions?.length || 0}` },
                      { label: 'Recommandations', value: 'Personnalisées' }
                    ]}
                  />
                </Grid>
                
                <Grid item xs={12} md={6} lg={4}>
                  <DashboardCard
                    title="Tendances & Analyses"
                    description="Visualisez vos tendances nutritionnelles sur la durée et recevez des recommandations personnalisées."
                    icon={<ShowChartIcon />}
                    color={theme.palette.secondary.main}
                    linkText="Voir les tendances"
                    linkUrl="/nutrition/journal?tab=trends"
                    stats={[
                      { label: 'Période d\'analyse', value: '7-90 jours' },
                      { label: 'Comparaisons', value: 'Automatiques' }
                    ]}
                  />
                </Grid>
              </Grid>
              
              {/* Section: Recommandations personnalisées */}
              <Typography variant="h5" component="h2" gutterBottom>
                Recommandations personnalisées
              </Typography>
              
              <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
                  <Avatar sx={{ bgcolor: `${theme.palette.warning.main}20`, color: theme.palette.warning.main }}>
                    <EmojiEventsIcon />
                  </Avatar>
                  <Typography variant="h6">
                    Pour vos objectifs cyclistes
                  </Typography>
                </Box>
                
                {!dashboardData?.recommendations?.goalSpecificAdvice ? (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Définissez vos objectifs cyclistes dans votre profil pour recevoir des recommandations personnalisées.
                  </Alert>
                ) : (
                  <List>
                    {dashboardData.recommendations.goalSpecificAdvice.map((advice: string, index: number) => (
                      <ListItem key={index} sx={{ pl: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: `${theme.palette.warning.main}20`, color: theme.palette.warning.main }}>
                            {index + 1}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={advice} />
                      </ListItem>
                    ))}
                  </List>
                )}
                
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  Actions recommandées
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={4}>
                    <Button
                      variant="outlined"
                      fullWidth
                      component={Link}
                      href="/nutrition/journal"
                      startIcon={<MenuBookIcon />}
                    >
                      Mettre à jour mon journal
                    </Button>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Button
                      variant="outlined"
                      fullWidth
                      component={Link}
                      href="/nutrition/plans"
                      startIcon={<LocalFireDepartmentIcon />}
                      color="error"
                    >
                      Ajuster mon plan
                    </Button>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Button
                      variant="outlined"
                      fullWidth
                      component={Link}
                      href="/nutrition/recettes"
                      startIcon={<RestaurantIcon />}
                      color="success"
                    >
                      Découvrir des recettes
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </>
          )}
        </Box>
      </Container>
    </>
  );
};

export default NutritionDashboard;
