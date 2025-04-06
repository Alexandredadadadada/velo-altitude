import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Divider,
  useTheme,
  Tooltip,
  IconButton
} from '@mui/material';
import { 
  Info as InfoIcon,
  LocalFireDepartment as LocalFireDepartmentIcon,
  Restaurant as RestaurantIcon,
  DirectionsBike as DirectionsBikeIcon
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { format, subDays, eachDayOfInterval, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

// Enregistrement des composants ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

// Interface pour les propriétés du composant
interface CalorieBurnChartProps {
  stravaData: any;
  nutritionData: any;
}

const CalorieBurnChart: React.FC<CalorieBurnChartProps> = ({ stravaData, nutritionData }) => {
  const theme = useTheme();
  
  // Préparation des données pour le graphique
  const prepareChartData = () => {
    if (!stravaData || !nutritionData) return null;
    
    // Les 14 derniers jours + prévision 7 jours
    const currentDate = new Date();
    const startDate = subDays(currentDate, 14);
    const endDate = addDays(currentDate, 7);
    
    // Créer un tableau de dates pour l'axe X
    const dates = eachDayOfInterval({ start: startDate, end: endDate });
    const formattedDates = dates.map(date => format(date, 'dd MMM', { locale: fr }));
    
    // Données passées (réelles)
    const pastCaloriesBurned = dates
      .filter(date => date <= currentDate)
      .map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const activity = stravaData.activities.find((act: any) => act.date === dateStr);
        return activity ? activity.caloriesBurned : 0;
      });
    
    // Données futures (prévues)
    const futurePredictedCalories = dates
      .filter(date => date > currentDate)
      .map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const planned = nutritionData.predictedCalorieBurn?.[dateStr] || 0;
        return planned;
      });
    
    // Combiner les données
    const caloriesBurnedData = [...pastCaloriesBurned, ...futurePredictedCalories];
    
    // Calories consommées (ou prévues)
    const caloriesConsumed = dates.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      // Pour les dates passées, utiliser les données réelles
      if (date <= currentDate) {
        return nutritionData.actualCaloriesConsumed?.[dateStr] || 0;
      } 
      // Pour les dates futures, utiliser les recommandations
      else {
        return nutritionData.recommendedCalories?.[dateStr] || 0;
      }
    });
    
    return {
      labels: formattedDates,
      datasets: [
        {
          label: 'Calories brûlées',
          data: caloriesBurnedData,
          borderColor: theme.palette.error.main,
          backgroundColor: `${theme.palette.error.main}33`,
          fill: true,
          tension: 0.3
        },
        {
          label: 'Calories consommées',
          data: caloriesConsumed,
          borderColor: theme.palette.primary.main,
          backgroundColor: `${theme.palette.primary.main}33`,
          fill: true,
          tension: 0.3
        }
      ]
    };
  };

  // Options pour le graphique
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y || 0;
            return `${label}: ${value} kcal`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: `${theme.palette.divider}55`
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Calories (kcal)'
        },
        grid: {
          display: true,
          color: `${theme.palette.divider}55`
        }
      }
    }
  };

  // Calcul des statistiques
  const calculateStats = () => {
    if (!stravaData || !stravaData.summary) return null;
    
    return {
      weeklyCaloriesBurned: stravaData.summary.weeklyCaloriesBurned,
      weeklyDistance: stravaData.summary.weeklyDistance,
      weeklyElevation: stravaData.summary.weeklyElevation,
      weeklyTime: stravaData.summary.weeklyTime,
      predictedWeeklyBurn: nutritionData?.predictedWeeklyBurn || 0
    };
  };

  const chartData = prepareChartData();
  const stats = calculateStats();
  
  // Ligne de démarcation présent/futur
  const todayIndex = 14; // Position de "aujourd'hui" dans le tableau de dates

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Équilibre énergétique - Passé et prévisions
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ position: 'relative', height: 400, mb: 3 }}>
          {chartData ? (
            <>
              <Line data={chartData} options={chartOptions} />
              
              {/* Ligne verticale pour marquer "aujourd'hui" */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `calc(${(todayIndex / (chartData.labels.length - 1)) * 100}%)`,
                  width: '2px',
                  backgroundColor: theme.palette.warning.main,
                  zIndex: 10,
                  pointerEvents: 'none'
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 20,
                  left: `calc(${(todayIndex / (chartData.labels.length - 1)) * 100}% - 30px)`,
                  backgroundColor: theme.palette.warning.main,
                  color: theme.palette.warning.contrastText,
                  padding: '2px 8px',
                  borderRadius: 1,
                  fontSize: '0.75rem',
                  zIndex: 10,
                  pointerEvents: 'none'
                }}
              >
                Aujourd'hui
              </Box>
            </>
          ) : (
            <Typography variant="body1" sx={{ textAlign: 'center', pt: 8 }}>
              Aucune donnée disponible
            </Typography>
          )}
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        {stats && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                    <LocalFireDepartmentIcon color="error" />
                    <Typography variant="subtitle2" color="text.secondary">
                      Calories hebdo.
                    </Typography>
                  </Box>
                  <Typography variant="h5" component="div">
                    {stats.weeklyCaloriesBurned.toLocaleString()} kcal
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Moyenne des 7 derniers jours
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                    <DirectionsBikeIcon color="success" />
                    <Typography variant="subtitle2" color="text.secondary">
                      Distance
                    </Typography>
                  </Box>
                  <Typography variant="h5" component="div">
                    {stats.weeklyDistance} km
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Cumul des 7 derniers jours
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                    <RestaurantIcon color="primary" />
                    <Typography variant="subtitle2" color="text.secondary">
                      Prévu semaine
                    </Typography>
                  </Box>
                  <Typography variant="h5" component="div">
                    {stats.predictedWeeklyBurn.toLocaleString()} kcal
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Prévision pour les 7 prochains jours
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined" sx={{ height: '100%', position: 'relative' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                    <InfoIcon color="info" />
                    <Typography variant="subtitle2" color="text.secondary">
                      Recommandation
                    </Typography>
                  </Box>
                  <Typography variant="h5" component="div" color="info.main">
                    {Math.round((stats.predictedWeeklyBurn * 1.1) / 7).toLocaleString()} kcal
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Apport quotidien recommandé
                  </Typography>
                  
                  <Tooltip title="Ce calcul tient compte de votre métabolisme de base et de vos objectifs personnels.">
                    <IconButton 
                      size="small" 
                      sx={{ position: 'absolute', top: 8, right: 8 }}
                    >
                      <InfoIcon fontSize="small" color="action" />
                    </IconButton>
                  </Tooltip>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Paper>
      
      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <InfoIcon fontSize="small" />
        Les prévisions sont basées sur votre calendrier d'entraînement et l'historique de vos activités.
      </Typography>
    </Box>
  );
};

export default CalorieBurnChart;
