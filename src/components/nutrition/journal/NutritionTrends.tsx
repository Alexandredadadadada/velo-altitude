import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Divider,
  ButtonGroup,
  Button,
  CircularProgress,
  useTheme,
  Tooltip,
  Alert
} from '@mui/material';
import { 
  ShowChart as ShowChartIcon,
  DateRange as DateRangeIcon,
  LocalFireDepartment as LocalFireDepartmentIcon,
  Restaurant as RestaurantIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Info as InfoIcon
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
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { APIOrchestrator } from '../../../api/orchestration';

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

const NutritionTrends: React.FC = () => {
  const theme = useTheme();
  
  // États
  const [period, setPeriod] = useState<'7days' | '14days' | '30days' | '90days'>('7days');
  const [dataType, setDataType] = useState<'calories' | 'macros' | 'balance'>('calories');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [trendsData, setTrendsData] = useState<any>(null);
  const [comparisonData, setComparisonData] = useState<any>(null);
  
  // Récupération des données
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const api = new APIOrchestrator();
        
        // Déterminer l'intervalle de dates
        const endDate = new Date();
        let startDate: Date;
        
        switch (period) {
          case '14days':
            startDate = subDays(endDate, 14);
            break;
          case '30days':
            startDate = subDays(endDate, 30);
            break;
          case '90days':
            startDate = subDays(endDate, 90);
            break;
          default:
            startDate = subDays(endDate, 7);
        }
        
        // Formatage des dates pour l'API
        const startDateStr = format(startDate, 'yyyy-MM-dd');
        const endDateStr = format(endDate, 'yyyy-MM-dd');
        
        // Récupération des données nutritionnelles pour la période
        const data = await api.getNutritionTrends(startDateStr, endDateStr);
        setTrendsData(data);
        
        // Récupération des statistiques comparatives
        if (period !== '90days') {
          const previousPeriodStartDate = subDays(startDate, endDate.getTime() - startDate.getTime());
          const previousPeriodStartDateStr = format(previousPeriodStartDate, 'yyyy-MM-dd');
          const previousPeriodEndDateStr = format(subDays(startDate, 1), 'yyyy-MM-dd');
          
          const previousData = await api.getNutritionTrends(previousPeriodStartDateStr, previousPeriodEndDateStr);
          setComparisonData({
            current: data,
            previous: previousData
          });
        } else {
          setComparisonData(null);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors de la récupération des données de tendances:', err);
        setError('Impossible de charger les données de tendances. Veuillez réessayer plus tard.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [period]);

  // Préparation des données pour les graphiques
  const prepareChartData = () => {
    if (!trendsData) return null;
    
    const dates = Object.keys(trendsData.dailyData);
    const formattedDates = dates.map(date => format(new Date(date), 'dd MMM', { locale: fr }));
    
    // Données pour graphique de calories
    const caloriesData = {
      labels: formattedDates,
      datasets: [
        {
          label: 'Calories consommées',
          data: dates.map(date => trendsData.dailyData[date].calories),
          borderColor: theme.palette.error.main,
          backgroundColor: `${theme.palette.error.main}33`,
          tension: 0.3,
          fill: true
        },
        {
          label: 'Objectif calorique',
          data: dates.map(date => trendsData.dailyData[date].calorieTarget),
          borderColor: theme.palette.primary.main,
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0
        }
      ]
    };
    
    // Données pour graphique de macronutriments
    const macrosData = {
      labels: formattedDates,
      datasets: [
        {
          label: 'Protéines',
          data: dates.map(date => trendsData.dailyData[date].protein),
          backgroundColor: theme.palette.primary.main
        },
        {
          label: 'Glucides',
          data: dates.map(date => trendsData.dailyData[date].carbs),
          backgroundColor: theme.palette.info.main
        },
        {
          label: 'Lipides',
          data: dates.map(date => trendsData.dailyData[date].fat),
          backgroundColor: theme.palette.warning.main
        }
      ]
    };
    
    // Données pour graphique de balance calorique
    const calorieBalanceData = {
      labels: formattedDates,
      datasets: [
        {
          label: 'Balance calorique',
          data: dates.map(date => {
            const balance = trendsData.dailyData[date].calories - trendsData.dailyData[date].calorieTarget;
            return balance;
          }),
          borderColor: theme.palette.secondary.main,
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, `${theme.palette.error.main}80`);
            gradient.addColorStop(0.5, `${theme.palette.grey[300]}10`);
            gradient.addColorStop(1, `${theme.palette.success.main}80`);
            return gradient;
          },
          tension: 0.3,
          fill: true
        }
      ]
    };
    
    return {
      calories: caloriesData,
      macros: macrosData,
      balance: calorieBalanceData
    };
  };

  // Options des graphiques
  const chartOptions = {
    calories: {
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
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Calories (kcal)'
          }
        }
      }
    },
    macros: {
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
              return `${label}: ${value}g`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Quantité (g)'
          }
        }
      }
    },
    balance: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const value = context.parsed.y || 0;
              return `Balance: ${value > 0 ? '+' : ''}${value} kcal`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'Balance (kcal)'
          }
        }
      }
    }
  };

  // Calcul des statistiques comparatives
  const calculateComparison = () => {
    if (!comparisonData) return null;
    
    const current = comparisonData.current;
    const previous = comparisonData.previous;
    
    // Moyennes des calories
    const currentAvgCalories = Object.keys(current.dailyData).reduce((sum, date) => 
      sum + current.dailyData[date].calories, 0) / Object.keys(current.dailyData).length;
    
    const previousAvgCalories = Object.keys(previous.dailyData).reduce((sum, date) => 
      sum + previous.dailyData[date].calories, 0) / Object.keys(previous.dailyData).length;
    
    const caloriesChange = ((currentAvgCalories - previousAvgCalories) / previousAvgCalories) * 100;
    
    // Moyennes des macronutriments
    const currentAvgProtein = Object.keys(current.dailyData).reduce((sum, date) => 
      sum + current.dailyData[date].protein, 0) / Object.keys(current.dailyData).length;
    
    const previousAvgProtein = Object.keys(previous.dailyData).reduce((sum, date) => 
      sum + previous.dailyData[date].protein, 0) / Object.keys(previous.dailyData).length;
    
    const proteinChange = ((currentAvgProtein - previousAvgProtein) / previousAvgProtein) * 100;
    
    const currentAvgCarbs = Object.keys(current.dailyData).reduce((sum, date) => 
      sum + current.dailyData[date].carbs, 0) / Object.keys(current.dailyData).length;
    
    const previousAvgCarbs = Object.keys(previous.dailyData).reduce((sum, date) => 
      sum + previous.dailyData[date].carbs, 0) / Object.keys(previous.dailyData).length;
    
    const carbsChange = ((currentAvgCarbs - previousAvgCarbs) / previousAvgCarbs) * 100;
    
    const currentAvgFat = Object.keys(current.dailyData).reduce((sum, date) => 
      sum + current.dailyData[date].fat, 0) / Object.keys(current.dailyData).length;
    
    const previousAvgFat = Object.keys(previous.dailyData).reduce((sum, date) => 
      sum + previous.dailyData[date].fat, 0) / Object.keys(previous.dailyData).length;
    
    const fatChange = ((currentAvgFat - previousAvgFat) / previousAvgFat) * 100;
    
    return {
      calories: {
        current: Math.round(currentAvgCalories),
        previous: Math.round(previousAvgCalories),
        change: Math.round(caloriesChange)
      },
      protein: {
        current: Math.round(currentAvgProtein),
        previous: Math.round(previousAvgProtein),
        change: Math.round(proteinChange)
      },
      carbs: {
        current: Math.round(currentAvgCarbs),
        previous: Math.round(previousAvgCarbs),
        change: Math.round(carbsChange)
      },
      fat: {
        current: Math.round(currentAvgFat),
        previous: Math.round(previousAvgFat),
        change: Math.round(fatChange)
      }
    };
  };

  // Gestion du changement de période
  const handlePeriodChange = (newPeriod: '7days' | '14days' | '30days' | '90days') => {
    setPeriod(newPeriod);
  };

  // Gestion du changement de type de données
  const handleDataTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setDataType(event.target.value as 'calories' | 'macros' | 'balance');
  };

  // Rendu de l'icône de comparaison
  const renderTrendIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUpIcon color="error" fontSize="small" />;
    } else if (change < 0) {
      return <TrendingDownIcon color="success" fontSize="small" />;
    }
    return null;
  };

  const chartData = prepareChartData();
  const comparison = calculateComparison();

  return (
    <Box>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3
        }}
      >
        <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShowChartIcon color="primary" />
          Tendances Nutritionnelles
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ButtonGroup variant="outlined" size="small">
            <Button 
              onClick={() => handlePeriodChange('7days')}
              variant={period === '7days' ? 'contained' : 'outlined'}
            >
              7 jours
            </Button>
            <Button 
              onClick={() => handlePeriodChange('14days')}
              variant={period === '14days' ? 'contained' : 'outlined'}
            >
              14 jours
            </Button>
            <Button 
              onClick={() => handlePeriodChange('30days')}
              variant={period === '30days' ? 'contained' : 'outlined'}
            >
              30 jours
            </Button>
            <Button 
              onClick={() => handlePeriodChange('90days')}
              variant={period === '90days' ? 'contained' : 'outlined'}
            >
              90 jours
            </Button>
          </ButtonGroup>
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="data-type-label">Type de données</InputLabel>
            <Select
              labelId="data-type-label"
              id="data-type"
              value={dataType}
              onChange={handleDataTypeChange}
              label="Type de données"
            >
              <MenuItem value="calories">Calories</MenuItem>
              <MenuItem value="macros">Macronutriments</MenuItem>
              <MenuItem value="balance">Balance calorique</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
      
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
          {/* Carte de visualisation */}
          <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Box sx={{ height: 400, mb: 3 }}>
              {chartData && (
                dataType === 'calories' ? (
                  <Line data={chartData.calories} options={chartOptions.calories} />
                ) : dataType === 'macros' ? (
                  <Bar data={chartData.macros} options={chartOptions.macros} />
                ) : (
                  <Line data={chartData.balance} options={chartOptions.balance} />
                )
              )}
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                <InfoIcon fontSize="small" />
                {dataType === 'calories' 
                  ? 'Ce graphique montre vos apports caloriques quotidiens par rapport à vos objectifs.'
                  : dataType === 'macros'
                    ? 'Ce graphique montre la répartition quotidienne de vos macronutriments (protéines, glucides, lipides).'
                    : 'Ce graphique montre votre balance calorique quotidienne (différence entre calories consommées et objectif).'}
              </Typography>
            </Box>
          </Paper>
          
          {/* Comparaison avec la période précédente */}
          {comparison && (
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Comparaison avec la période précédente
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Calories moyennes
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="h5" component="div">
                            {comparison.calories.current}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            kcal/jour
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {renderTrendIcon(comparison.calories.change)}
                          <Typography 
                            variant="body2" 
                            color={comparison.calories.change > 0 ? 'error.main' : 'success.main'}
                          >
                            {comparison.calories.change > 0 ? '+' : ''}{comparison.calories.change}%
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Protéines moyennes
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="h5" component="div" color="primary.main">
                            {comparison.protein.current}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            g/jour
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {renderTrendIcon(comparison.protein.change)}
                          <Typography 
                            variant="body2" 
                            color={comparison.protein.change > 0 ? 'success.main' : 'error.main'}
                          >
                            {comparison.protein.change > 0 ? '+' : ''}{comparison.protein.change}%
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Glucides moyens
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="h5" component="div" color="info.main">
                            {comparison.carbs.current}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            g/jour
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {renderTrendIcon(comparison.carbs.change)}
                          <Typography 
                            variant="body2" 
                            color={comparison.carbs.change > 0 ? 'info.main' : 'text.secondary'}
                          >
                            {comparison.carbs.change > 0 ? '+' : ''}{comparison.carbs.change}%
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Lipides moyens
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="h5" component="div" color="warning.main">
                            {comparison.fat.current}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            g/jour
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {renderTrendIcon(comparison.fat.change)}
                          <Typography 
                            variant="body2" 
                            color={comparison.fat.change > 0 ? 'warning.main' : 'text.secondary'}
                          >
                            {comparison.fat.change > 0 ? '+' : ''}{comparison.fat.change}%
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Cette comparaison vous montre l'évolution de vos habitudes alimentaires par rapport à la période précédente.
                </Typography>
              </Box>
            </Paper>
          )}
          
          {/* Recommandations basées sur les données */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle1" gutterBottom>
              Recommandations personnalisées
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                    <LocalFireDepartmentIcon color="error" />
                    <Typography variant="subtitle2">
                      Recommandations pour l'apport calorique
                    </Typography>
                  </Box>
                  <Typography variant="body2" paragraph>
                    {!trendsData ? 'Chargement...' :
                      trendsData.recommendations.calories || 
                      "Basé sur vos données, visez un apport calorique régulier qui correspond à vos objectifs. Ajustez en fonction de l'intensité de vos entraînements."}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                    <RestaurantIcon color="primary" />
                    <Typography variant="subtitle2">
                      Recommandations pour les macronutriments
                    </Typography>
                  </Box>
                  <Typography variant="body2" paragraph>
                    {!trendsData ? 'Chargement...' :
                      trendsData.recommendations.macros || 
                      "Pour optimiser vos performances cyclistes, visez un ratio équilibré avec suffisamment de glucides pour l'énergie et de protéines pour la récupération musculaire."}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </>
      )}
    </Box>
  );
};

export default NutritionTrends;
