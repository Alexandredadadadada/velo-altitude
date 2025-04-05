import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Divider, 
  CircularProgress, 
  Button, 
  Card, 
  CardContent, 
  LinearProgress,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import { 
  DirectionsBike, 
  Restaurant, 
  LocalDrink, 
  Timeline, 
  Info, 
  CalendarToday,
  Speed,
  MonitorWeight,
  Add,
  Refresh
} from '@mui/icons-material';
import TrendingUpIcon from '../icons/TrendingIcon';
import TrendingDownIcon from '../icons/TrendingDownIcon';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import nutritionService from '../../services/nutritionService';

// Enregistrer les composants Chart.js
ChartJS.register(...registerables);

/**
 * Tableau de bord de nutrition pour afficher les métriques principales
 * et l'historique nutritionnel du cycliste
 */
const NutritionDashboard = ({ nutritionData, userId, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [dateRange, setDateRange] = useState('week'); // week, month, year

  // Utiliser les données passées en props ou les récupérer si non disponibles
  useEffect(() => {
    if (nutritionData) {
      setDashboardData(nutritionData);
    } else {
      fetchDashboardData();
    }
  }, [nutritionData, userId]);

  // Récupérer les données de tableau de bord si nécessaire
  const fetchDashboardData = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await nutritionService.getUserNutritionData(userId);
      
      // Valider les structures de données essentielles
      if (!data || typeof data !== 'object') {
        throw new Error('Format de données invalide');
      }
      
      // S'assurer que les structures de données nécessaires existent
      if (!data.dailyIntake) data.dailyIntake = { calories: 0, carbs: 0, protein: 0, fat: 0, hydration: 0 };
      if (!data.metrics) data.metrics = { weight: 70, height: 175, bodyFat: 15, basalMetabolicRate: 1600 };
      if (!data.goals) data.goals = { type: 'performance', weeklyCalories: 0 };
      if (!data.activityLog) data.activityLog = [];
      
      setDashboardData(data);
    } catch (err) {
      console.error('Erreur lors de la récupération des données du tableau de bord:', err);
      setError('Impossible de charger les données du tableau de bord.');
    } finally {
      setLoading(false);
    }
  };

  // Rafraîchir manuellement les données
  const handleRefresh = () => {
    fetchDashboardData();
    if (onRefresh) onRefresh();
  };

  // Changer la plage de dates pour les graphiques
  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  // Formatter les données de macronutriments pour le graphique en anneau
  const getMacroData = () => {
    if (!dashboardData || !dashboardData.dailyIntake) {
      return {
        labels: ['Glucides', 'Protéines', 'Lipides'],
        datasets: [{
          data: [60, 20, 20], // Valeurs par défaut
          backgroundColor: ['#4CAF50', '#2196F3', '#FF9800'],
          borderWidth: 1
        }]
      };
    }

    const { carbs = 0, protein = 0, fat = 0 } = dashboardData.dailyIntake;
    const totalGrams = carbs + protein + fat;
    
    if (totalGrams === 0) {
      return {
        labels: ['Glucides', 'Protéines', 'Lipides'],
        datasets: [{
          data: [60, 20, 20], // Valeurs par défaut
          backgroundColor: ['#4CAF50', '#2196F3', '#FF9800'],
          borderWidth: 1
        }]
      };
    }
    
    return {
      labels: ['Glucides', 'Protéines', 'Lipides'],
      datasets: [{
        data: [
          Math.round((carbs / totalGrams) * 100),
          Math.round((protein / totalGrams) * 100),
          Math.round((fat / totalGrams) * 100)
        ],
        backgroundColor: ['#4CAF50', '#2196F3', '#FF9800'],
        borderWidth: 1
      }]
    };
  };

  // Options pour le graphique en anneau
  const macroChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 15
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.raw}%`;
          }
        }
      }
    },
    cutout: '70%'
  };

  // Formatter les données de calories pour le graphique en ligne
  const getCalorieData = () => {
    if (!dashboardData || !dashboardData.activityLog || !dashboardData.activityLog.length) {
      return {
        labels: Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - 6 + i);
          return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }),
        datasets: [
          {
            label: 'Calories consommées',
            data: Array(7).fill(0),
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Calories dépensées',
            data: Array(7).fill(0),
            borderColor: '#f44336',
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      };
    }

    // Prendre les 7 derniers jours pour la semaine, 30 pour le mois, etc.
    const limit = dateRange === 'week' ? 7 : (dateRange === 'month' ? 30 : 365);
    
    // Trier les entrées par date et limiter au nombre requis
    const sortedEntries = [...dashboardData.activityLog]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-limit);

    // Si le nombre d'entrées est inférieur à la limite, ajouter des entrées vides pour compléter
    const labels = [];
    const consumedData = [];
    const burnedData = [];
    
    const today = new Date();
    
    for (let i = 0; i < limit; i++) {
      const date = new Date();
      date.setDate(today.getDate() - (limit - 1) + i);
      const dateString = date.toISOString().split('T')[0];
      
      const entry = sortedEntries.find(e => e.date === dateString);
      
      labels.push(date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
      consumedData.push(entry ? entry.calories.consumed : null);
      burnedData.push(entry ? entry.calories.burned : null);
    }

    return {
      labels: labels,
      datasets: [
        {
          label: 'Calories consommées',
          data: consumedData,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Calories dépensées',
          data: burnedData,
          borderColor: '#f44336',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };
  };

  // Options pour le graphique en ligne
  const calorieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Calories'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        position: 'top'
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    }
  };

  // Formatter les données d'hydratation pour le graphique en barre
  const getHydrationData = () => {
    if (!dashboardData || !dashboardData.activityLog || !dashboardData.activityLog.length) {
      return {
        labels: Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - 6 + i);
          return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }),
        datasets: [
          {
            label: 'Hydratation (litres)',
            data: Array(7).fill(0),
            backgroundColor: '#2196F3',
            borderColor: '#1976D2',
            borderWidth: 1
          }
        ]
      };
    }

    // Prendre les 7 derniers jours pour la semaine, 30 pour le mois, etc.
    const limit = dateRange === 'week' ? 7 : (dateRange === 'month' ? 30 : 365);
    
    // Générer les données d'hydratation avec la même logique que pour les calories
    const labels = [];
    const hydrationData = [];
    
    const today = new Date();
    
    for (let i = 0; i < limit; i++) {
      const date = new Date();
      date.setDate(today.getDate() - (limit - 1) + i);
      const dateString = date.toISOString().split('T')[0];
      
      const entry = dashboardData.activityLog.find(e => e.date === dateString);
      
      labels.push(date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
      hydrationData.push(entry ? entry.hydration : null);
    }

    return {
      labels: labels,
      datasets: [
        {
          label: 'Hydratation (litres)',
          data: hydrationData,
          backgroundColor: '#2196F3',
          borderColor: '#1976D2',
          borderWidth: 1
        }
      ]
    };
  };

  // Options pour le graphique en barre
  const hydrationChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Litres'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

  // Calculer le pourcentage d'avancement vers l'objectif calorique
  const getCalorieProgress = () => {
    if (!dashboardData || !dashboardData.dailyIntake || !dashboardData.goals) {
      return 0;
    }

    // Valeur par défaut si les données sont manquantes
    const currentCalories = dashboardData.dailyIntake.calories || 0;
    
    let targetCalories = 2000; // Valeur par défaut
    
    // Calculer la cible calorique en fonction de l'objectif
    if (dashboardData.metrics && dashboardData.metrics.basalMetabolicRate) {
      const bmr = dashboardData.metrics.basalMetabolicRate;
      if (dashboardData.goals.type === 'weight-loss') {
        targetCalories = Math.round(bmr * 0.85);
      } else if (dashboardData.goals.type === 'performance') {
        targetCalories = Math.round(bmr * 1.1);
      } else {
        targetCalories = bmr;
      }
    }

    if (targetCalories === 0) return 0;
    
    return Math.min(100, Math.round((currentCalories / targetCalories) * 100));
  };

  // Obtenir la valeur de protéines en g/kg de poids corporel
  const getProteinPerKg = () => {
    if (!dashboardData || !dashboardData.dailyIntake || !dashboardData.metrics) {
      return 0;
    }
    
    const protein = dashboardData.dailyIntake.protein || 0;
    const weight = dashboardData.metrics.weight || 70;
    
    if (weight === 0) return 0;
    
    return Math.round((protein / weight) * 10) / 10;
  };

  // Calculer le pourcentage d'hydratation par rapport à l'objectif
  const getHydrationProgress = () => {
    if (!dashboardData || !dashboardData.dailyIntake || !dashboardData.metrics) {
      return 0;
    }
    
    const hydration = dashboardData.dailyIntake.hydration || 0;
    const weight = dashboardData.metrics.weight || 70;
    
    // Recommandation d'hydratation: 35ml par kg de poids corporel
    const targetHydration = (weight * 0.035);
    
    if (targetHydration === 0) return 0;
    
    return Math.min(100, Math.round((hydration / targetHydration) * 100));
  };

  // Calculer l'Indice de Masse Corporelle (IMC)
  const calculateBMI = () => {
    if (!dashboardData || !dashboardData.metrics) {
      return 0;
    }
    
    const weight = dashboardData.metrics.weight || 70;
    const height = dashboardData.metrics.height || 175;
    
    if (height === 0) return 0;
    
    // IMC = poids (kg) / taille² (m)
    return Math.round((weight / Math.pow(height / 100, 2)) * 10) / 10;
  };

  // Rendu du composant
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ mb: 3 }}
        action={
          <Button color="inherit" size="small" onClick={handleRefresh}>
            Réessayer
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (!dashboardData) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        Aucune donnée nutritionnelle disponible. Commencez à enregistrer vos repas pour voir les statistiques.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button 
          startIcon={<Refresh />} 
          size="small" 
          onClick={handleRefresh}
        >
          Actualiser
        </Button>
      </Box>
      
      {/* Cartes métriques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Carte calories */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Restaurant sx={{ color: '#4CAF50', mr: 1 }} />
              <Typography variant="h6">Calories</Typography>
            </Box>
            <Typography variant="h4" sx={{ my: 1 }}>
              {dashboardData.dailyIntake?.calories || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Objectif: {Math.round(dashboardData.metrics?.basalMetabolicRate * (dashboardData.goals?.type === 'weight-loss' ? 0.85 : 1.1)) || 0} kcal
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={getCalorieProgress()} 
              sx={{ mt: 1, mb: 0.5, height: 8, borderRadius: 4 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                {getCalorieProgress()}% de l'objectif
              </Typography>
              {dashboardData.activityLog && dashboardData.activityLog.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                  {dashboardData.activityLog[dashboardData.activityLog.length-1].calories.balance > 0 ? (
                    <>+{dashboardData.activityLog[dashboardData.activityLog.length-1].calories.balance} <TrendingUpIcon fontSize="small" color="success" sx={{ ml: 0.5 }} /></>
                  ) : (
                    <>{dashboardData.activityLog[dashboardData.activityLog.length-1].calories.balance} <TrendingDownIcon fontSize="small" color="error" sx={{ ml: 0.5 }} /></>
                  )}
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Carte protéines */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Speed sx={{ color: '#2196F3', mr: 1 }} />
              <Typography variant="h6">Protéines</Typography>
            </Box>
            <Typography variant="h4" sx={{ my: 1 }}>
              {dashboardData.dailyIntake?.protein || 0}g
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(((dashboardData.dailyIntake?.protein || 0) / dashboardData.dailyIntake?.calories) * 400) || 0} kcal
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={Math.min(100, ((dashboardData.dailyIntake?.protein || 0) / ((dashboardData.metrics?.weight || 70) * 1.6)) * 100)} 
              sx={{ mt: 1, mb: 0.5, height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { backgroundColor: '#2196F3' } }}
            />
            <Typography variant="caption" color="text.secondary">
              {getProteinPerKg()}g/kg (recommandé: 1.6-2.0g/kg)
            </Typography>
          </Paper>
        </Grid>

        {/* Carte hydratation */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LocalDrink sx={{ color: '#03A9F4', mr: 1 }} />
              <Typography variant="h6">Hydratation</Typography>
            </Box>
            <Typography variant="h4" sx={{ my: 1 }}>
              {dashboardData.dailyIntake?.hydration || 0}L
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Objectif: {Math.round((dashboardData.metrics?.weight || 70) * 0.035 * 100) / 100}L
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={getHydrationProgress()} 
              sx={{ mt: 1, mb: 0.5, height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { backgroundColor: '#03A9F4' } }}
            />
            <Typography variant="caption" color="text.secondary">
              {getHydrationProgress()}% de l'objectif
            </Typography>
          </Paper>
        </Grid>

        {/* Carte poids */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <MonitorWeight sx={{ color: '#9C27B0', mr: 1 }} />
              <Typography variant="h6">Poids</Typography>
            </Box>
            <Typography variant="h4" sx={{ my: 1 }}>
              {dashboardData.metrics?.weight || 0}kg
            </Typography>
            <Typography variant="body2" color="text.secondary">
              IMC: {calculateBMI()}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                Masse grasse: {dashboardData.metrics?.bodyFat || 0}%
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Graphiques */}
      <Grid container spacing={3}>
        {/* Graphique des calories */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Historique calorique</Typography>
              <Box>
                <Button 
                  size="small" 
                  variant={dateRange === 'week' ? 'contained' : 'outlined'} 
                  onClick={() => handleDateRangeChange('week')}
                  sx={{ mr: 1 }}
                >
                  Semaine
                </Button>
                <Button 
                  size="small" 
                  variant={dateRange === 'month' ? 'contained' : 'outlined'} 
                  onClick={() => handleDateRangeChange('month')}
                  sx={{ mr: 1 }}
                >
                  Mois
                </Button>
                <Button 
                  size="small" 
                  variant={dateRange === 'year' ? 'contained' : 'outlined'} 
                  onClick={() => handleDateRangeChange('year')}
                >
                  Année
                </Button>
              </Box>
            </Box>
            <Box sx={{ height: 300 }}>
              <Line data={getCalorieData()} options={calorieChartOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* Graphique des macronutriments */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Répartition des macros</Typography>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Doughnut data={getMacroData()} options={macroChartOptions} />
            </Box>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="body2" align="center" color="text.secondary">Glucides</Typography>
                  <Typography variant="h6" align="center">{dashboardData.dailyIntake?.carbs || 0}g</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" align="center" color="text.secondary">Protéines</Typography>
                  <Typography variant="h6" align="center">{dashboardData.dailyIntake?.protein || 0}g</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" align="center" color="text.secondary">Lipides</Typography>
                  <Typography variant="h6" align="center">{dashboardData.dailyIntake?.fat || 0}g</Typography>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Graphique d'hydratation */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Historique d'hydratation</Typography>
            <Box sx={{ height: 250 }}>
              <Bar data={getHydrationData()} options={hydrationChartOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Dernières notes */}
      {dashboardData.activityLog && dashboardData.activityLog.length > 0 ? (
        <Paper elevation={2} sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Dernières notes</Typography>
          <Grid container spacing={2}>
            {dashboardData.activityLog.slice(-3).reverse().map((log, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        <CalendarToday fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                        {new Date(log.date).toLocaleDateString()}
                      </Typography>
                      <Typography 
                        variant="subtitle2" 
                        color={log.calories.balance > 0 ? 'success.main' : 'error.main'}
                      >
                        {log.calories.balance > 0 ? '+' : ''}{log.calories.balance} kcal
                      </Typography>
                    </Box>
                    <Typography variant="body2">{log.notes || 'Aucune note'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      ) : (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Alert severity="info" sx={{ display: 'inline-flex', textAlign: 'left' }}>
            Aucun historique d'activité disponible. Commencez à enregistrer vos repas et activités.
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default NutritionDashboard;
