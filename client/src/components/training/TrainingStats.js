import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Paper, 
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
  Skeleton,
  LinearProgress,
  Menu,
  MenuItem,
  Tooltip,
  Avatar,
  Badge,
  Container,
  alpha
} from '@mui/material';
import { 
  DirectionsBike, 
  Timer, 
  Whatshot, 
  Speed, 
  TrendingUp, 
  Today,
  CalendarMonth,
  EmojiEvents,
  ShowChart,
  FilterAlt,
  MoreVert,
  InfoOutlined,
  FitnessCenter,
  Terrain,
  AccessTime,
  BarChart,
  LocalFireDepartment,
  Download,
  PictureAsPdf,
  Share,
  Refresh
} from '@mui/icons-material';
import { Line, Bar, Radar, Doughnut } from 'react-chartjs-2';
import trainingService from '../../services/trainingService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDuration, formatDistance, calculateIntensity, formatDate } from '../../utils/formatters';
import StatCard from './StatCard';
import TimeframeSelector from '../common/TimeframeSelector';
import ProgressChart from './ProgressChart';

/**
 * Composant d'affichage et d'analyse des statistiques d'entraînement
 */
const TrainingStats = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  
  // États pour les données
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('month'); // week, month, year, all
  const [activeTab, setActiveTab] = useState(0);
  const [statsSummary, setStatsSummary] = useState({
    totalDistance: 0,
    totalDuration: 0,
    totalElevation: 0,
    averageSpeed: 0,
    caloriesBurned: 0,
    activitiesCount: 0
  });
  
  // Charger les données d'entraînement
  useEffect(() => {
    const fetchTrainingData = async () => {
      try {
        setLoading(true);
        const response = await trainingService.getActivities(user.id, timeframe);
        
        setActivities(response.activities || []);
        setStatsSummary(response.summary || {
          totalDistance: 0,
          totalDuration: 0,
          totalElevation: 0,
          averageSpeed: 0,
          caloriesBurned: 0,
          activitiesCount: 0
        });
        
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des données d\'entraînement:', err);
        setError('Impossible de charger les données. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchTrainingData();
    }
  }, [user, timeframe]);
  
  // Gérer le changement de période
  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };
  
  // Gérer le changement d'onglet
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Préparer les données pour le graphique d'activité par semaine
  const prepareWeeklyActivityData = () => {
    // Vérifier que les activités existent
    if (!activities || activities.length === 0) {
      return {
        labels: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
        datasets: [
          {
            label: 'Distance (km)',
            data: [0, 0, 0, 0, 0, 0, 0],
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Durée (min)',
            data: [0, 0, 0, 0, 0, 0, 0],
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
          }
        ]
      };
    }
    
    // Créer un tableau de 7 jours avec des valeurs à 0
    const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const distanceData = Array(7).fill(0);
    const durationData = Array(7).fill(0);
    
    // Remplir les données pour chaque jour
    activities.forEach(activity => {
      if (!activity.date) return;
      
      try {
        const date = new Date(activity.date);
        const dayIndex = date.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
        const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Convertir pour que 0 = Lundi
        
        distanceData[adjustedIndex] += (activity.distance || 0);
        durationData[adjustedIndex] += (activity.duration || 0);
      } catch (error) {
        console.error('Erreur lors du traitement de la date de l\'activité:', error);
      }
    });
    
    return {
      labels: weekDays,
      datasets: [
        {
          label: 'Distance (km)',
          data: distanceData,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Durée (min)',
          data: durationData.map(d => d / 60), // Convertir en minutes
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };
  };
  
  // Préparer les données pour le graphique de progression
  const prepareProgressionData = () => {
    // Vérifier que les activités existent
    if (!activities || activities.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: 'Distance (km)',
            data: [],
            borderColor: theme.palette.primary.main,
            backgroundColor: 'rgba(0, 0, 0, 0)',
            tension: 0.4
          },
          {
            label: 'Vitesse moyenne (km/h)',
            data: [],
            borderColor: theme.palette.secondary.main,
            backgroundColor: 'rgba(0, 0, 0, 0)',
            tension: 0.4,
            yAxisID: 'y1'
          }
        ]
      };
    }
    
    // Trier les activités par date
    const sortedActivities = [...activities]
      .filter(activity => activity.date) // S'assurer que la date existe
      .sort((a, b) => {
        try {
          return new Date(a.date) - new Date(b.date);
        } catch (error) {
          console.error('Erreur lors du tri des dates:', error);
          return 0;
        }
      });
    
    return {
      labels: sortedActivities.map(activity => formatDate(activity.date, 'short')),
      datasets: [
        {
          label: 'Distance (km)',
          data: sortedActivities.map(activity => activity.distance || 0),
          borderColor: theme.palette.primary.main,
          backgroundColor: 'rgba(0, 0, 0, 0)',
          tension: 0.4
        },
        {
          label: 'Vitesse moyenne (km/h)',
          data: sortedActivities.map(activity => activity.average_speed || 0),
          borderColor: theme.palette.secondary.main,
          backgroundColor: 'rgba(0, 0, 0, 0)',
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    };
  };
  
  // Préparer les données pour le graphique radar des capacités
  const prepareCapabilitiesData = () => {
    // S'assurer que les données du résumé existent
    const totalDistance = statsSummary?.totalDistance || 0;
    const averageSpeed = statsSummary?.averageSpeed || 0;
    const totalElevation = statsSummary?.totalElevation || 0;
    const activitiesCount = statsSummary?.activitiesCount || 0;
    
    // Calculer les scores pour différentes métriques (0-100)
    const enduranceScore = Math.min(100, totalDistance / 5);
    const speedScore = Math.min(100, averageSpeed * 3);
    const climbingScore = Math.min(100, totalElevation / 50);
    const consistencyScore = Math.min(100, activitiesCount * 10);
    const intensityScore = Math.min(100, calculateIntensity(activities) * 20);
    
    return {
      labels: ['Endurance', 'Vitesse', 'Grimpeur', 'Régularité', 'Intensité'],
      datasets: [
        {
          label: 'Vos capacités',
          data: [enduranceScore, speedScore, climbingScore, consistencyScore, intensityScore],
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          pointBackgroundColor: 'rgba(54, 162, 235, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
        }
      ]
    };
  };
  
  // Afficher un loader pendant le chargement
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }
  
  // Afficher un message d'erreur si nécessaire
  if (error) {
    return (
      <Box>
        <Typography color="error" variant="body1" gutterBottom>
          {error}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => handleTimeframeChange(timeframe)}
        >
          Réessayer
        </Button>
      </Box>
    );
  }

  return (
    <Box component="section" aria-labelledby="training-stats-title">
      <Paper 
        elevation={0} 
        variant="outlined" 
        sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" component="h2" id="training-stats-title">
            Statistiques d'entraînement
            <Tooltip title="Analyse détaillée de vos activités d'entraînement" arrow>
              <IconButton size="small" aria-label="Plus d'informations sur les statistiques d'entraînement" sx={{ ml: 0.5, mb: 0.5 }}>
                <InfoOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimeframeSelector 
              value={timeframe} 
              onChange={handleTimeframeChange} 
              options={[
                { value: 'week', label: 'Semaine' },
                { value: 'month', label: 'Mois' },
                { value: 'year', label: 'Année' },
                { value: 'all', label: 'Tout' }
              ]}
              aria-label="Sélectionner la période"
            />
            <Tooltip title="Actualiser les données" arrow>
              <IconButton 
                size="small" 
                onClick={() => fetchTrainingData()}
                aria-label="Actualiser les données"
                disabled={loading}
              >
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {loading ? (
          <Box sx={{ py: 4 }}>
            <Grid container spacing={3}>
              {/* Skeleton pour les cartes de statistiques */}
              {[1, 2, 3, 4].map(i => (
                <Grid item xs={12} sm={6} md={3} key={i}>
                  <Card elevation={0} variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Skeleton variant="text" width={100} animation="wave" />
                        <Skeleton variant="circular" width={24} height={24} animation="wave" />
                      </Box>
                      <Skeleton variant="text" width={80} height={40} animation="wave" />
                      <Skeleton variant="text" width={60} animation="wave" />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              
              {/* Skeleton pour les graphiques */}
              <Grid item xs={12}>
                <Card elevation={0} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', py: 2 }}>
                      <Skeleton variant="text" width={200} animation="wave" />
                      <Skeleton variant="rectangular" width="100%" height={300} animation="wave" sx={{ mt: 2, borderRadius: 1 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        ) : error ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error" gutterBottom>
              {error}
            </Typography>
            <Button 
              variant="outlined" 
              color="primary" 
              startIcon={<Refresh />} 
              onClick={() => fetchTrainingData()}
              sx={{ mt: 2 }}
            >
              Réessayer
            </Button>
          </Box>
        ) : (
          <Box>
            {/* Résumé des statistiques */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Distance totale"
                  value={formatDistance(statsSummary.totalDistance)}
                  unit="km"
                  icon={<DirectionsBike color="primary" aria-hidden="true" />}
                  trend={statsSummary.distanceTrend}
                  trendLabel={statsSummary.distanceTrend ? `${statsSummary.distanceTrend > 0 ? '+' : ''}${statsSummary.distanceTrend}% vs période précédente` : undefined}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Temps d'entraînement"
                  value={formatDuration(statsSummary.totalDuration, 'short')}
                  icon={<AccessTime color="primary" aria-hidden="true" />}
                  trend={statsSummary.durationTrend}
                  trendLabel={statsSummary.durationTrend ? `${statsSummary.durationTrend > 0 ? '+' : ''}${statsSummary.durationTrend}% vs période précédente` : undefined}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Dénivelé positif"
                  value={statsSummary.totalElevation.toString()}
                  unit="m"
                  icon={<Terrain color="primary" aria-hidden="true" />}
                  trend={statsSummary.elevationTrend}
                  trendLabel={statsSummary.elevationTrend ? `${statsSummary.elevationTrend > 0 ? '+' : ''}${statsSummary.elevationTrend}% vs période précédente` : undefined}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Calories dépensées"
                  value={statsSummary.caloriesBurned.toLocaleString()}
                  unit="kcal"
                  icon={<LocalFireDepartment color="primary" aria-hidden="true" />}
                  trend={statsSummary.caloriesTrend}
                  trendLabel={statsSummary.caloriesTrend ? `${statsSummary.caloriesTrend > 0 ? '+' : ''}${statsSummary.caloriesTrend}% vs période précédente` : undefined}
                />
              </Grid>
            </Grid>
            
            {/* Onglets d'analyse */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange} 
                variant={isMobile ? "scrollable" : "standard"}
                scrollButtons={isMobile ? "auto" : false}
                allowScrollButtonsMobile
                aria-label="Onglets d'analyse d'entraînement"
              >
                <Tab 
                  label="Résumé" 
                  icon={<ShowChart />} 
                  iconPosition="start" 
                  id="training-tab-0"
                  aria-controls="training-tabpanel-0"
                />
                <Tab 
                  label="Progression" 
                  icon={<TrendingUp />} 
                  iconPosition="start" 
                  id="training-tab-1"
                  aria-controls="training-tabpanel-1"
                />
                <Tab 
                  label="Analyse" 
                  icon={<BarChart />} 
                  iconPosition="start" 
                  id="training-tab-2"
                  aria-controls="training-tabpanel-2"
                />
                <Tab 
                  label="Historique" 
                  icon={<CalendarMonth />} 
                  iconPosition="start" 
                  id="training-tab-3"
                  aria-controls="training-tabpanel-3"
                />
              </Tabs>
            </Box>
            
            {/* Contenu des onglets */}
            <Box
              role="tabpanel"
              id={`training-tabpanel-${activeTab}`}
              aria-labelledby={`training-tab-${activeTab}`}
            >
              {/* Onglet Résumé */}
              {activeTab === 0 && (
                <Grid container spacing={3}>
                  {/* Graphique d'activité hebdomadaire */}
                  <Grid item xs={12} md={6}>
                    <Card elevation={0} variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Activité par jour de la semaine
                        </Typography>
                        <Box sx={{ height: 300 }} aria-hidden="true">
                          <Bar
                            data={prepareWeeklyActivityData()}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'top',
                                },
                                tooltip: {
                                  callbacks: {
                                    label: function(context) {
                                      let label = context.dataset.label || '';
                                      if (label) {
                                        label += ': ';
                                      }
                                      if (context.parsed.y !== null) {
                                        if (label.includes('Distance')) {
                                          label += parseFloat(context.parsed.y).toFixed(1) + ' km';
                                        } else if (label.includes('Durée')) {
                                          label += parseFloat(context.parsed.y).toFixed(0) + ' min';
                                        } else {
                                          label += parseFloat(context.parsed.y).toFixed(1);
                                        }
                                      }
                                      return label;
                                    }
                                  }
                                }
                              },
                              scales: {
                                x: {
                                  grid: {
                                    display: false
                                  }
                                },
                                y: {
                                  beginAtZero: true
                                }
                              }
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 2, textAlign: 'center' }}>
                          Distribution de vos activités par jour de la semaine
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Graphique de répartition par type d'activité */}
                  <Grid item xs={12} md={6}>
                    <Card elevation={0} variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Répartition par type d'activité
                        </Typography>
                        <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }} aria-hidden="true">
                          <Doughnut
                            data={{
                              labels: ['Route', 'VTT', 'Gravel', 'Indoor'],
                              datasets: [
                                {
                                  data: [
                                    activities.filter(a => a.type === 'road').length,
                                    activities.filter(a => a.type === 'mountain').length,
                                    activities.filter(a => a.type === 'gravel').length,
                                    activities.filter(a => a.type === 'indoor').length
                                  ],
                                  backgroundColor: [
                                    theme.palette.primary.main,
                                    theme.palette.success.main,
                                    theme.palette.warning.main,
                                    theme.palette.secondary.main
                                  ],
                                  borderWidth: 1
                                }
                              ]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'right'
                                },
                                tooltip: {
                                  callbacks: {
                                    label: function(context) {
                                      const label = context.label || '';
                                      const value = context.raw || 0;
                                      const percentage = Math.round((value / activities.length) * 100);
                                      return `${label}: ${value} (${percentage}%)`;
                                    }
                                  }
                                }
                              }
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 2, textAlign: 'center' }}>
                          Types d'entraînements effectués durant cette période
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
              
              {/* Onglet Progression */}
              {activeTab === 1 && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Card elevation={0} variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Progression sur la période
                        </Typography>
                        <Box sx={{ height: 350 }} aria-hidden="true">
                          <Line
                            data={prepareProgressionData()}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'top',
                                },
                                tooltip: {
                                  mode: 'index',
                                  intersect: false,
                                }
                              },
                              scales: {
                                x: {
                                  title: {
                                    display: true,
                                    text: 'Date'
                                  }
                                },
                                y: {
                                  beginAtZero: true,
                                  title: {
                                    display: true,
                                    text: 'Valeur'
                                  }
                                }
                              }
                            }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                          {['distance', 'duration', 'elevation', 'intensity'].map(metric => (
                            <Chip
                              key={metric}
                              label={
                                metric === 'distance' ? 'Distance' : 
                                metric === 'duration' ? 'Durée' : 
                                metric === 'elevation' ? 'Dénivelé' : 'Intensité'
                              }
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ m: 0.5 }}
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Card elevation={0} variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Capacités et points forts
                        </Typography>
                        <Box sx={{ height: 350, display: 'flex', justifyContent: 'center' }} aria-hidden="true">
                          <Radar
                            data={prepareCapabilitiesData()}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              scales: {
                                r: {
                                  beginAtZero: true,
                                  max: 100,
                                  ticks: {
                                    display: false
                                  }
                                }
                              },
                              plugins: {
                                legend: {
                                  position: 'bottom',
                                }
                              }
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 2, textAlign: 'center' }}>
                          Vos points forts et axes d'amélioration basés sur vos données d'entraînement
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
              
              {/* Onglet Analyse */}
              {activeTab === 2 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card elevation={0} variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Zones d'intensité
                        </Typography>
                        <Box sx={{ height: 350, display: 'flex', justifyContent: 'center', alignItems: 'center' }} aria-hidden="true">
                          <Doughnut
                            data={{
                              labels: ['Z1 - Récupération', 'Z2 - Endurance', 'Z3 - Tempo', 'Z4 - Seuil', 'Z5 - VO2max'],
                              datasets: [
                                {
                                  data: [30, 40, 15, 10, 5], // Données simulées
                                  backgroundColor: [
                                    alpha(theme.palette.primary.light, 0.7),
                                    alpha(theme.palette.primary.main, 0.7),
                                    alpha(theme.palette.warning.main, 0.7),
                                    alpha(theme.palette.error.light, 0.7),
                                    alpha(theme.palette.error.main, 0.7)
                                  ],
                                  borderWidth: 1
                                }
                              ]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'right',
                                  labels: {
                                    boxWidth: 12,
                                    font: {
                                      size: 11
                                    }
                                  }
                                }
                              }
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 2, textAlign: 'center' }}>
                          Répartition du temps passé dans chaque zone d'intensité
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card elevation={0} variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Types d'entraînement
                        </Typography>
                        <Box sx={{ height: 350, display: 'flex', justifyContent: 'center', alignItems: 'center' }} aria-hidden="true">
                          <Doughnut
                            data={{
                              labels: ['Route', 'VTT', 'Gravel', 'Indoor'],
                              datasets: [
                                {
                                  data: [
                                    activities.filter(a => a.type === 'road').length,
                                    activities.filter(a => a.type === 'mountain').length,
                                    activities.filter(a => a.type === 'gravel').length,
                                    activities.filter(a => a.type === 'indoor').length
                                  ],
                                  backgroundColor: [
                                    theme.palette.primary.main,
                                    theme.palette.success.main,
                                    theme.palette.warning.main,
                                    theme.palette.secondary.main
                                  ]
                                }
                              ]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'right'
                                }
                              }
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 2, textAlign: 'center' }}>
                          Répartition de vos entraînements par type
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
              
              {/* Onglet Historique */}
              {activeTab === 3 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1">
                      Historique des activités
                      <Chip 
                        label={`${activities.length} activités`} 
                        size="small"
                        sx={{ ml: 1, bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}
                      />
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Télécharger les données" arrow>
                        <IconButton size="small" aria-label="Télécharger les données d'entraînement">
                          <Download fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Filtrer les activités" arrow>
                        <IconButton size="small" aria-label="Filtrer les activités">
                          <FilterAlt fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small" aria-label="Tableau des activités d'entraînement">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Titre</TableCell>
                          <TableCell align="right">Distance</TableCell>
                          <TableCell align="right">Durée</TableCell>
                          <TableCell align="right">Vitesse</TableCell>
                          <TableCell align="right">Dénivelé</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell aria-label="Actions"></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {activities.map((activity) => (
                          <TableRow key={activity.id} hover>
                            <TableCell>{formatDate(activity.date)}</TableCell>
                            <TableCell>{activity.title}</TableCell>
                            <TableCell align="right">{activity.distance.toFixed(1)} km</TableCell>
                            <TableCell align="right">{formatDuration(activity.duration, 'short')}</TableCell>
                            <TableCell align="right">{activity.average_speed.toFixed(1)} km/h</TableCell>
                            <TableCell align="right">{activity.elevation_gain} m</TableCell>
                            <TableCell>
                              <Chip 
                                label={activity.type} 
                                size="small"
                                color={
                                  activity.type === 'road' ? 'primary' :
                                  activity.type === 'mountain' ? 'success' :
                                  activity.type === 'gravel' ? 'warning' : 'secondary'
                                }
                                sx={{ textTransform: 'capitalize' }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="Plus d'options" arrow>
                                <IconButton 
                                  size="small"
                                  aria-label={`Options pour l'activité ${activity.title}`}
                                >
                                  <MoreVert fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  {activities.length === 0 && (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography color="text.secondary" gutterBottom>
                        Aucune activité trouvée pour cette période
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default TrainingStats;
