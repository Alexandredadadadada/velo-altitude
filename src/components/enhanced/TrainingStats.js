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
  useMediaQuery
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
  MoreVert
} from '@mui/icons-material';
import { Line, Bar, Radar, Doughnut } from 'react-chartjs-2';
import trainingService from '../../services/trainingService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDuration, formatDistance, calculateIntensity, formatDate } from '../../utils/formatters';
import StatCard from './StatCard';
import TimeframeSelector from '../common/TimeframeSelector';
import ProgressChart from './ProgressChart';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

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
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "ExercisePlan",
          "name": "Programme d'Entraînement Cycliste",
          "description": "Plans d'entraînement spécifiques pour préparer les ascensions de cols.",
          "url": "https://velo-altitude.com/trainingstats"
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
    <Box className="training-stats-container">
      {/* Sélecteur de période */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="h5" component="h2" gutterBottom={isMobile} sx={{ mb: isMobile ? 2 : 0 }}>
          Statistiques d'entraînement
        </Typography>
        <TimeframeSelector 
          currentTimeframe={timeframe} 
          onChange={handleTimeframeChange} 
        />
      </Box>
      
      {/* Cartes de statistiques principales */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard 
            title="Distance" 
            value={formatDistance(statsSummary.totalDistance)} 
            unit="km"
            icon={<DirectionsBike color="primary" />}
            trend={statsSummary.distanceTrend}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard 
            title="Durée" 
            value={formatDuration(statsSummary.totalDuration)} 
            icon={<Timer color="primary" />}
            trend={statsSummary.durationTrend}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard 
            title="Calories" 
            value={statsSummary.caloriesBurned.toLocaleString()} 
            unit="kcal"
            icon={<Whatshot color="primary" />}
            trend={statsSummary.caloriesTrend}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard 
            title="Vitesse moyenne" 
            value={statsSummary.averageSpeed.toFixed(1)} 
            unit="km/h"
            icon={<Speed color="primary" />}
            trend={statsSummary.speedTrend}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard 
            title="Dénivelé" 
            value={statsSummary.totalElevation.toLocaleString()} 
            unit="m"
            icon={<TrendingUp color="primary" />}
            trend={statsSummary.elevationTrend}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard 
            title="Sorties" 
            value={statsSummary.activitiesCount} 
            icon={<CalendarMonth color="primary" />}
            trend={statsSummary.activitiesTrend}
          />
        </Grid>
      </Grid>
      
      {/* Onglets pour les différents graphiques */}
      <Box sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="training statistics tabs"
        >
          <Tab label="Progression" icon={<ShowChart />} iconPosition="start" />
          <Tab label="Activité hebdomadaire" icon={<Today />} iconPosition="start" />
          <Tab label="Capacités" icon={<EmojiEvents />} iconPosition="start" />
          <Tab label="Historique" icon={<CalendarMonth />} iconPosition="start" />
        </Tabs>
      </Box>
      
      {/* Contenu des onglets */}
      <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        {/* Onglet Progression */}
        {activeTab === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Progression sur la période
            </Typography>
            <Box sx={{ height: 400 }}>
              <ProgressChart 
                data={prepareProgressionData()} 
                timeframe={timeframe}
              />
            </Box>
          </Box>
        )}
        
        {/* Onglet Activité hebdomadaire */}
        {activeTab === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Activité par jour de la semaine
            </Typography>
            <Box sx={{ height: 400 }}>
              <Bar 
                data={prepareWeeklyActivityData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Distance (km)'
                      }
                    }
                  }
                }}
              />
            </Box>
          </Box>
        )}
        
        {/* Onglet Capacités */}
        {activeTab === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Profil d'athlète
              </Typography>
              <Box sx={{ height: 350 }}>
                <Radar
                  data={prepareCapabilitiesData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      r: {
                        angleLines: {
                          display: true
                        },
                        suggestedMin: 0,
                        suggestedMax: 100
                      }
                    }
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Répartition des activités
              </Typography>
              <Box sx={{ height: 350, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
            </Grid>
          </Grid>
        )}
        
        {/* Onglet Historique */}
        {activeTab === 3 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Historique des activités
              </Typography>
              <IconButton size="small">
                <FilterAlt fontSize="small" />
              </IconButton>
            </Box>
            
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Titre</TableCell>
                    <TableCell align="right">Distance</TableCell>
                    <TableCell align="right">Durée</TableCell>
                    <TableCell align="right">Vitesse</TableCell>
                    <TableCell align="right">Dénivelé</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell></TableCell>
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
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small">
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TrainingStats;
