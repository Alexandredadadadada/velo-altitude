import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Divider,
  useMediaQuery,
  Card,
  CardContent,
  Alert,
  AlertTitle,
  Chip,
  useTheme,
  IconButton,
  MenuItem,
  Menu,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Dashboard,
  ShowChart,
  EmojiEvents,
  CalendarMonth,
  Whatshot,
  DirectionsBike,
  TrendingUp,
  Speed,
  Refresh,
  ArrowForward,
  MoreVert,
  FileDownload,
  Thermostat,
  Air,
  WbSunny,
  WbCloudy,
  Waves,
  AcUnit,
  LocalFireDepartment,
  Restaurant
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import TrainingStats from './TrainingStats';
import TrainingGoals from './TrainingGoals';
import StatCard from './StatCard';
import LongTermTrendsChart from './LongTermTrendsChart';
import OvertrainingDetection from './OvertrainingDetection';
import PerformanceAnalysis from './PerformanceAnalysis';
import TrainingPeriodization from './TrainingPeriodization';
import NutritionTrainingIntegration from '../nutrition/NutritionTrainingIntegration';
import trainingService from '../../services/trainingService';
import integrationService from '../../services/integrationService';
import nutritionService from '../../services/nutritionService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistance, formatDuration, formatDate, formatPercentage } from '../../utils/formatters';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { WeatherService } from '../../services/WeatherService';
import HiitWorkoutCard from '../hiit/HiitWorkoutCard';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

/**
 * Tableau de bord principal pour visualiser et gérer les données d'entraînement
 */
const TrainingDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // États pour les données et l'interface
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    week: {},
    month: {},
    year: {}
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingGoals, setUpcomingGoals] = useState([]);
  const [weatherAlert, setWeatherAlert] = useState(null);
  const [trainingTips, setTrainingTips] = useState([]);
  const [recentHiitWorkouts, setRecentHiitWorkouts] = useState([]);
  const [weatherImpact, setWeatherImpact] = useState(null);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);
  
  // Chargement initial des données
  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Utiliser le service d'intégration pour récupérer toutes les données
      const data = await integrationService.getDashboardData(user.id);
      
      // Récupérer les données nutritionnelles
      let nutritionInfo = null;
      try {
        nutritionInfo = await nutritionService.getUserNutritionData(user.id);
      } catch (nutritionError) {
        console.error('Erreur lors de la récupération des données nutritionnelles:', nutritionError);
      }
      
      setDashboardData(data);
      setNutritionData(nutritionInfo);
      
      if (!data) {
        console.error('Aucune donnée reçue du service d\'intégration');
        return;
      }
      
      // Mettre à jour les états avec les données récupérées
      setSummary({
        week: data.kpis || {},
        month: data.monthStats || {},
        year: data.yearStats || {}
      });
      
      // Vérifier et traiter les activités récentes
      const activities = data.recentActivities || [];
      setRecentActivities(activities.map(activity => ({
        ...activity,
        // Valider les propriétés essentielles avec des valeurs par défaut
        distance: activity.distance || 0,
        duration: activity.duration || 0,
        averageSpeed: activity.averageSpeed || 0,
        date: activity.date || new Date().toISOString(),
        type: activity.type || 'road',
        title: activity.title || 'Sortie vélo'
      })));
      
      // Traiter les objectifs à venir avec validation des dates
      try {
        setUpcomingGoals(
          (data.goals || [])
            .filter(goal => {
              try {
                return !goal.completed && goal.endDate && new Date(goal.endDate) > new Date();
              } catch (e) {
                console.error('Date invalide pour un objectif:', e);
                return false;
              }
            })
            .sort((a, b) => {
              try {
                return new Date(a.endDate) - new Date(b.endDate);
              } catch (e) {
                return 0;
              }
            })
            .slice(0, 3)
        );
      } catch (error) {
        console.error('Erreur lors du traitement des objectifs:', error);
        setUpcomingGoals([]);
      }
      
      // Vérifier les alertes météo
      if (data.weatherForecast && data.weatherForecast.alerts && data.weatherForecast.alerts.length > 0) {
        setWeatherAlert({
          title: 'Alerte météo pour votre région',
          description: data.weatherForecast.alerts[0].description || 'Conditions météorologiques défavorables',
          severity: 'warning'
        });
      } else {
        setWeatherAlert(null);
      }
      
      // Récupérer les entraînements HIIT récents
      if (data.hiitWorkouts && Array.isArray(data.hiitWorkouts)) {
        setRecentHiitWorkouts(data.hiitWorkouts.slice(0, 2));
      } else {
        setRecentHiitWorkouts([]);
      }
      
      // Générer des conseils d'entraînement personnalisés
      setTrainingTips(data.recommendations || generateTrainingTips(activities));
      
      // Récupérer l'impact de la météo sur les performances
      if (data.weatherImpact) {
        setWeatherImpact(data.weatherImpact);
      } else {
        setWeatherImpact(null);
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des données du tableau de bord:', error);
      // Réinitialiser les données pour éviter l'affichage de données invalides
      setSummary({ week: {}, month: {}, year: {} });
      setRecentActivities([]);
      setUpcomingGoals([]);
      setWeatherAlert(null);
      setTrainingTips([]);
      setRecentHiitWorkouts([]);
      setWeatherImpact(null);
    } finally {
      setLoading(false);
    }
  };
  
  // Génération de conseils d'entraînement basés sur l'historique d'activités
  const generateTrainingTips = (activities) => {
    if (!activities || activities.length === 0) {
      return [
        {
          title: 'Commencez votre entraînement',
          description: 'Ajoutez votre première activité pour recevoir des conseils personnalisés.',
          icon: <DirectionsBike />
        }
      ];
    }
    
    const tips = [];
    const now = new Date();
    const lastActivityDate = new Date(activities[0].date);
    const daysSinceLastActivity = Math.floor((now - lastActivityDate) / (1000 * 60 * 60 * 24));
    
    // Vérifier si l'utilisateur n'a pas fait d'activité récemment
    if (daysSinceLastActivity > 3) {
      tips.push({
        title: 'Reprenez le rythme',
        description: `Votre dernière activité remonte à ${daysSinceLastActivity} jours. Une sortie facile pourrait vous aider à maintenir votre condition.`,
        icon: <Speed />
      });
    }
    
    // Vérifier s'il y a eu beaucoup d'activités intenses récemment
    const intenseActivities = activities.filter(
      a => a.average_heart_rate > 150 || a.elevation_gain / a.distance > 15
    );
    
    if (intenseActivities.length >= 3 && intenseActivities.length === activities.length) {
      tips.push({
        title: 'Pensez à récupérer',
        description: 'Plusieurs activités intenses détectées. Prévoyez une journée de récupération ou une sortie à faible intensité.',
        icon: <Whatshot />
      });
    }
    
    // Vérifier si l'utilisateur a fait peu de dénivelé
    const totalElevation = activities.reduce((sum, a) => sum + a.elevation_gain, 0);
    const totalDistance = activities.reduce((sum, a) => sum + a.distance, 0);
    
    if (totalDistance > 50 && totalElevation / totalDistance < 5) {
      tips.push({
        title: 'Variez votre terrain',
        description: 'Essayez d\'intégrer plus de dénivelé dans vos sorties pour développer votre endurance.',
        icon: <TrendingUp />
      });
    }
    
    // Si pas assez de tips, ajouter un conseil général
    if (tips.length === 0) {
      tips.push({
        title: 'Maintenez votre progression',
        description: 'Continuez sur votre lancée! Variez l\'intensité et la durée de vos sorties pour progresser.',
        icon: <ShowChart />
      });
    }
    
    return tips;
  };
  
  // Gérer le changement d'onglet
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Rafraîchir les données du tableau de bord
  const handleRefresh = () => {
    window.location.reload();
  };
  
  // Données pour le graphique hebdomadaire
  const getWeeklyChartData = () => {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const distanceData = Array(7).fill(0);
    
    recentActivities.forEach(activity => {
      const date = new Date(activity.date);
      const dayIndex = date.getDay();
      const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
      distanceData[adjustedIndex] += activity.distance;
    });
    
    return {
      labels: days,
      datasets: [
        {
          label: 'Distance (km)',
          data: distanceData,
          backgroundColor: theme.palette.primary.main,
          borderRadius: 4
        }
      ]
    };
  };
  
  // Options du graphique hebdomadaire
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          drawBorder: false,
          display: true,
          drawTicks: false
        },
        ticks: {
          padding: 10
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: false
        }
      }
    }
  };
  
  // Gérer l'ouverture du menu d'exportation
  const handleExportMenuOpen = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };
  
  // Gérer la fermeture du menu d'exportation
  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };
  
  // Gérer l'exportation des données
  const handleExportData = async (format) => {
    handleExportMenuClose();
    
    try {
      const exportedData = await integrationService.exportTrainingData(
        user.id,
        'month',
        null,
        format
      );
      
      // Créer un URL pour télécharger le fichier
      const url = URL.createObjectURL(exportedData);
      const link = document.createElement('a');
      link.href = url;
      link.download = `entrainement_export_${format === 'csv' ? 'csv' : format === 'pdf' ? 'pdf' : 'json'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Erreur lors de l\'exportation des données:', error);
    }
  };

  // Afficher un loader pendant le chargement
  if (loading) {
    return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "ExercisePlan",
          "name": "Programme d'Entraînement Cycliste",
          "description": "Plans d'entraînement spécifiques pour préparer les ascensions de cols.",
          "url": "https://velo-altitude.com/trainingdashboard"
        }
      </script>
      <EnhancedMetaTags
        title="Programmes d'Entraînement | Velo-Altitude"
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="article"
        imageUrl="/images/og-image.jpg"
      />
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ pb: 4 }}>
      {/* Menu d'actions */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3
        }}
      >
        <Typography variant="h5" component="h2">
          Tableau de bord
        </Typography>
        
        <Box>
          <Tooltip title="Exporter les données">
            <IconButton onClick={handleExportMenuOpen}>
              <FileDownload />
            </IconButton>
          </Tooltip>
          
          <Menu
            anchorEl={exportMenuAnchor}
            open={Boolean(exportMenuAnchor)}
            onClose={handleExportMenuClose}
          >
            <MenuItem onClick={() => handleExportData('csv')}>Exporter en CSV</MenuItem>
            <MenuItem onClick={() => handleExportData('pdf')}>Exporter en PDF</MenuItem>
          </Menu>
          
          <Tooltip title="Actualiser">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Alerte météo */}
          {weatherAlert && (
            <Grid item xs={12}>
              <Alert 
                severity={weatherAlert.severity || 'info'}
                variant="outlined"
                onClose={() => setWeatherAlert(null)}
              >
                <AlertTitle>{weatherAlert.title}</AlertTitle>
                {weatherAlert.description}
              </Alert>
            </Grid>
          )}
          
          {/* Cartes de statistiques */}
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Cette semaine"
              icon={<DirectionsBike />}
              primaryStat={formatDistance(summary.week.totalDistance || 0)}
              secondaryStat={`${summary.week.activityCount || 0} activités`}
              trend={summary.week.distanceTrend}
              trendLabel="vs semaine précédente"
              chartData={getWeeklyChartData()}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Durée"
              icon={<CalendarMonth />}
              primaryStat={formatDuration(summary.week.totalDuration || 0)}
              secondaryStat={`${formatPercentage(summary.week.durationTrend || 0)}`}
              trend={summary.week.durationTrend}
              trendLabel="vs semaine précédente"
              color="secondary"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Intensité"
              icon={<Whatshot />}
              primaryStat={((summary.week.intensityScore || 0) * 10).toFixed(1)}
              secondaryStat={`sur 10`}
              trend={summary.week.intensityTrend}
              trendLabel="vs semaine précédente"
              color="warning"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Vitesse moyenne"
              icon={<Speed />}
              primaryStat={`${(summary.week.averageSpeed || 0).toFixed(1)} km/h`}
              secondaryStat={`${formatPercentage(summary.week.speedTrend || 0)}`}
              trend={summary.week.speedTrend}
              trendLabel="vs semaine précédente"
              color="info"
            />
          </Grid>
          
          {/* Colonne gauche */}
          <Grid item xs={12} md={8}>
            {/* Impact de la météo sur les performances */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Impact météo sur vos performances
              </Typography>
              
              {weatherImpact ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Influence des conditions météo
                    </Typography>
                    <Box sx={{ height: 200 }}>
                      {Object.keys(weatherImpact.categories).length > 0 ? (
                        <Bar
                          data={{
                            labels: Object.keys(weatherImpact.categories).map(cat => 
                              cat === 'sunny' ? 'Ensoleillé' :
                              cat === 'cloudy' ? 'Nuageux' :
                              cat === 'rainy' ? 'Pluvieux' :
                              cat === 'windy' ? 'Venteux' :
                              cat === 'cold' ? 'Froid' : 'Chaud'
                            ),
                            datasets: [{
                              label: 'Vitesse moyenne (km/h)',
                              data: Object.values(weatherImpact.categories).map(cat => cat.avgSpeed),
                              backgroundColor: [
                                '#ffd54f', // sunny
                                '#90caf9', // cloudy
                                '#4fc3f7', // rainy
                                '#b0bec5', // windy
                                '#81d4fa', // cold
                                '#ef5350'  // hot
                              ]
                            }]
                          }}
                          options={{
                            maintainAspectRatio: false,
                            indexAxis: 'y',
                            plugins: {
                              legend: {
                                display: false
                              }
                            }
                          }}
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 8 }}>
                          Pas assez de données pour analyser l'impact de la météo
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Vos meilleures conditions
                    </Typography>
                    
                    <List dense>
                      {weatherImpact.bestCondition && (
                        <ListItem sx={{ 
                          bgcolor: 'background.neutral', 
                          borderRadius: 1,
                          mb: 1 
                        }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {weatherImpact.bestCondition === 'sunny' ? <WbSunny color="warning" /> :
                             weatherImpact.bestCondition === 'cloudy' ? <WbCloudy color="action" /> :
                             weatherImpact.bestCondition === 'rainy' ? <Waves color="info" /> :
                             weatherImpact.bestCondition === 'windy' ? <Air color="info" /> :
                             weatherImpact.bestCondition === 'cold' ? <AcUnit color="info" /> :
                             <LocalFireDepartment color="error" />}
                          </ListItemIcon>
                          <ListItemText 
                            primary={`Meilleures performances: ${
                              weatherImpact.bestCondition === 'sunny' ? 'Temps ensoleillé' :
                              weatherImpact.bestCondition === 'cloudy' ? 'Temps nuageux' :
                              weatherImpact.bestCondition === 'rainy' ? 'Temps pluvieux' :
                              weatherImpact.bestCondition === 'windy' ? 'Temps venteux' :
                              weatherImpact.bestCondition === 'cold' ? 'Temps froid' :
                              'Temps chaud'
                            }`}
                            secondary={`Vitesse moyenne: ${Object.values(weatherImpact.categories)
                              .find(cat => cat.avgSpeed === Math.max(...Object.values(weatherImpact.categories).map(c => c.avgSpeed)))
                              ?.avgSpeed.toFixed(1)} km/h`}
                          />
                        </ListItem>
                      )}
                      
                      {weatherImpact.worstCondition && (
                        <ListItem sx={{ 
                          bgcolor: 'background.neutral', 
                          borderRadius: 1 
                        }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {weatherImpact.worstCondition === 'sunny' ? <WbSunny color="warning" /> :
                             weatherImpact.worstCondition === 'cloudy' ? <WbCloudy color="action" /> :
                             weatherImpact.worstCondition === 'rainy' ? <Waves color="info" /> :
                             weatherImpact.worstCondition === 'windy' ? <Air color="info" /> :
                             weatherImpact.worstCondition === 'cold' ? <AcUnit color="info" /> :
                             <LocalFireDepartment color="error" />}
                          </ListItemIcon>
                          <ListItemText 
                            primary={`Performances réduites: ${
                              weatherImpact.worstCondition === 'sunny' ? 'Temps ensoleillé' :
                              weatherImpact.worstCondition === 'cloudy' ? 'Temps nuageux' :
                              weatherImpact.worstCondition === 'rainy' ? 'Temps pluvieux' :
                              weatherImpact.worstCondition === 'windy' ? 'Temps venteux' :
                              weatherImpact.worstCondition === 'cold' ? 'Temps froid' :
                              'Temps chaud'
                            }`}
                            secondary={`Vitesse moyenne: ${Object.values(weatherImpact.categories)
                              .find(cat => cat.avgSpeed === Math.min(...Object.values(weatherImpact.categories)
                                .filter(c => c.avgSpeed > 0).map(c => c.avgSpeed)))
                              ?.avgSpeed.toFixed(1)} km/h`}
                          />
                        </ListItem>
                      )}
                    </List>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      {weatherImpact.speedDifference > 0 ? 
                        `Impact significatif: ${weatherImpact.speedDifference.toFixed(1)} km/h de différence entre vos meilleures et pires conditions` :
                        "Pas assez de données pour analyser l'impact complet des conditions météo"}
                    </Typography>
                  </Grid>
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Pas assez de données pour analyser l'impact de la météo sur vos performances
                </Typography>
              )}
            </Paper>
            
            {/* Visualisation des tendances à long terme */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Tendances à long terme
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/training/trends')}
                >
                  Analyse détaillée
                </Button>
              </Box>
              
              <Box sx={{ height: 300 }}>
                <LongTermTrendsChart userId={user?.id} condensed={true} />
              </Box>
            </Paper>
            
            {/* Entraînements HIIT recommandés */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Entraînements HIIT recommandés
              </Typography>
              
              {recentHiitWorkouts.length > 0 ? (
                <Grid container spacing={2}>
                  {recentHiitWorkouts.map(workout => (
                    <Grid item xs={12} sm={6} key={workout.id}>
                      <HiitWorkoutCard workout={workout} />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Améliorez vos performances avec des entraînements par intervalles
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={<Whatshot />}
                    onClick={() => navigate('/training/hiit')}
                    sx={{ mt: 1 }}
                  >
                    Découvrir les programmes HIIT
                  </Button>
                </Box>
              )}
            </Paper>
            
            {/* Activités récentes */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Activités récentes
              </Typography>
              
              {recentActivities.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Vous n'avez pas encore enregistré d'activités cette semaine
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<DirectionsBike />}
                    onClick={() => navigate('/activities/new')}
                    sx={{ mt: 1 }}
                  >
                    Ajouter une activité
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {recentActivities.map((activity) => (
                    <Grid item xs={12} key={activity.id}>
                      <Card 
                        variant="outlined"
                        sx={{ 
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          alignItems: { sm: 'center' },
                          bgcolor: 'background.neutral',
                          '&:hover': {
                            boxShadow: theme.shadows[2],
                            transform: 'translateY(-2px)',
                            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out'
                          }
                        }}
                      >
                        <Box 
                          sx={{ 
                            p: 2,
                            minWidth: { sm: '140px' },
                            borderRight: { sm: `1px solid ${theme.palette.divider}` }
                          }}
                        >
                          <Typography variant="h6" color="primary">
                            {formatDate(activity.date, 'dayMonth')}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {activity.type || 'Sortie vélo'}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ flexGrow: 1, p: 2 }}>
                          <Typography variant="subtitle1" sx={{ mb: 1 }}>
                            {activity.title}
                          </Typography>
                          
                          <Grid container spacing={2}>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="caption" color="text.secondary">Distance</Typography>
                              <Typography variant="body2">{formatDistance(activity.distance)}</Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="caption" color="text.secondary">Durée</Typography>
                              <Typography variant="body2">{formatDuration(activity.duration)}</Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="caption" color="text.secondary">Vitesse moy.</Typography>
                              <Typography variant="body2">{activity.averageSpeed.toFixed(1)} km/h</Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="caption" color="text.secondary">
                                {activity.elevation ? 'Dénivelé' : 'Calories'}
                              </Typography>
                              <Typography variant="body2">
                                {activity.elevation ? 
                                  `${activity.elevation} m` : 
                                  `${activity.calories || '-'} kcal`}
                              </Typography>
                            </Grid>
                          </Grid>
                          
                          {/* Conditions météo de l'activité si disponibles */}
                          {activity.weather && (
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              mt: 1,
                              pt: 1,
                              borderTop: `1px dashed ${theme.palette.divider}`
                            }}>
                              <Tooltip title="Température">
                                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                                  <Thermostat fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                  <Typography variant="body2">
                                    {activity.weather.temperature.toFixed(1)}°C
                                  </Typography>
                                </Box>
                              </Tooltip>
                              
                              <Tooltip title="Vent">
                                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                                  <Air fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                  <Typography variant="body2">
                                    {activity.weather.windSpeed.toFixed(1)} km/h
                                  </Typography>
                                </Box>
                              </Tooltip>
                            </Box>
                          )}
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
            
            {/* Détection de surmenage */}
            {dashboardData && (
              <Grid item xs={12} md={6} sx={{ mb: 3 }}>
                <OvertrainingDetection 
                  userId={user?.id} 
                  recentActivities={dashboardData.recentActivities || []} 
                  nutritionData={nutritionData}
                />
              </Grid>
            )}
            
            {/* Analyse de performance */}
            {dashboardData && (
              <Grid item xs={12} sx={{ mb: 3 }}>
                <PerformanceAnalysis 
                  userId={user?.id} 
                  recentActivities={dashboardData.recentActivities || []} 
                />
              </Grid>
            )}
            
            {/* Périodisation */}
            {dashboardData && (
              <Grid item xs={12} sx={{ mb: 3 }}>
                <TrainingPeriodization 
                  userId={user?.id} 
                />
              </Grid>
            )}
          </Grid>
        </Grid>
      )}
      
      {/* Onglets */}
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange} 
        variant={isMobile ? 'scrollable' : 'fullWidth'} 
        scrollButtons={isMobile ? 'auto' : 'disabled'}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab icon={<Dashboard />} label="Aperçu" iconPosition="start" />
        <Tab icon={<ShowChart />} label="Analyses" iconPosition="start" />
        <Tab icon={<EmojiEvents />} label="Objectifs" iconPosition="start" />
        <Tab icon={<CalendarMonth />} label="Planification" iconPosition="start" />
        <Tab icon={<Restaurant />} label="Nutrition & Entraînement" iconPosition="start" />
      </Tabs>
      
      {/* Contenu des onglets */}
      {activeTab === 0 && (
        <Box>
          {/* Contenu existant de l'onglet Aperçu - garder le contenu existant */}
          <Grid container spacing={3}>
            {/* KPIs hebdomadaires */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Statistiques hebdomadaires
              </Typography>
            </Grid>
            
            {Object.keys(summary.week).length > 0 ? (
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Distance"
                    value={formatDistance(summary.week.distance || 0)}
                    icon={<DirectionsBike color="primary" />}
                    trend={summary.week.distanceTrend}
                    trendLabel="vs semaine précédente"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Temps d'activité"
                    value={formatDuration(summary.week.duration || 0)}
                    icon={<Whatshot color="primary" />}
                    trend={summary.week.durationTrend}
                    trendLabel="vs semaine précédente"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Vitesse moyenne"
                    value={`${(summary.week.averageSpeed || 0).toFixed(1)} km/h`}
                    icon={<Speed color="primary" />}
                    trend={summary.week.speedTrend}
                    trendLabel="vs semaine précédente"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Intensité"
                    value={`${Math.round(summary.week.intensity || 0)}/10`}
                    icon={<TrendingUp color="primary" />}
                    trend={summary.week.intensityTrend}
                    trendLabel="vs semaine précédente"
                  />
                </Grid>
              </>
            ) : (
              <Grid item xs={12}>
                <Alert severity="info">
                  Aucune activité enregistrée cette semaine. Commencez à enregistrer vos entraînements pour voir vos statistiques.
                </Alert>
              </Grid>
            )}
          </Grid>
        </Box>
      )}
      
      {activeTab === 1 && (
        <Box>
          {/* Contenu de l'onglet Analyses */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Analyse de performance
                </Typography>
                <Typography variant="body2" paragraph>
                  Visualisez vos progrès et identifiez les tendances dans vos performances.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => navigate('/training/performance')}
                >
                  Voir l'analyse détaillée
                </Button>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Détection de surmenage
                </Typography>
                <Typography variant="body2" paragraph>
                  Analysez votre charge d'entraînement pour prévenir le surmenage et optimiser votre récupération.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => navigate('/training/overtraining')}
                >
                  Analyser ma charge d'entraînement
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}
      
      {activeTab === 2 && (
        <Box>
          {/* Contenu de l'onglet Objectifs */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Mes objectifs d'entraînement
                </Typography>
                
                {upcomingGoals.length > 0 ? (
                  <List>
                    {upcomingGoals.map((goal, index) => (
                      <ListItem 
                        key={index}
                        divider={index < upcomingGoals.length - 1}
                      >
                        <ListItemText
                          primary={goal.title}
                          secondary={`Échéance: ${formatDate(goal.endDate)}`}
                        />
                        <Chip 
                          label={`${goal.progress || 0}%`} 
                          color={goal.progress >= 80 ? "success" : goal.progress >= 50 ? "info" : "default"}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Alert severity="info">
                    Vous n'avez pas d'objectifs en cours. Définissez des objectifs pour suivre votre progression.
                  </Alert>
                )}
                
                <Button 
                  variant="contained" 
                  color="primary" 
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/training/goals')}
                >
                  Gérer mes objectifs
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}
      
      {activeTab === 3 && (
        <Box>
          {/* Contenu de l'onglet Planification */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Planification d'entraînement
                </Typography>
                <Typography variant="body2" paragraph>
                  Organisez votre saison cycliste avec des plans d'entraînement adaptés à vos objectifs.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => navigate('/training/periodization')}
                >
                  Voir mon plan
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}
      
      {activeTab === 4 && (
        <NutritionTrainingIntegration />
      )}
      
      {/* Indicateurs de nutrition */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* KPIs hebdomadaires existants... */}
        
        {nutritionData && (
          <Grid item xs={12} sm={6} lg={4}>
            <StatCard
              title="Nutrition & Entraînement"
              value={nutritionData.dailyCalories ? `${nutritionData.dailyCalories} kcal/jour` : 'Non configuré'}
              icon={<Restaurant color="primary" />}
              trend={nutritionData.dailyCalories && summary.week.calories ? 
                ((nutritionData.dailyCalories / (summary.week.calories / 7)) * 100 - 100).toFixed(0) : null}
              trendLabel={nutritionData.dailyCalories && summary.week.calories ? 
                `${((nutritionData.dailyCalories / (summary.week.calories / 7)) * 100 - 100) > 0 ? 'Surplus' : 'Déficit'} vs dépense` : 'Calculer vos besoins'}
              actionLabel="Voir détails"
              onAction={() => setActiveTab(4)}
              chipText={nutritionData && nutritionData.macronutrients ? 
                `${nutritionData.macronutrients.carbs.percentage}/${nutritionData.macronutrients.protein.percentage}/${nutritionData.macronutrients.fat.percentage}` : null}
              chipTooltip="Ratio Glucides/Protéines/Lipides (%)"
            />
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default TrainingDashboard;
