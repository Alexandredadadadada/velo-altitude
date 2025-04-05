import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, Box, Grid, Button, Divider, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tooltip, IconButton, Card, CardContent, Alert, Chip,
  Tabs, Tab, Skeleton, useTheme, List, ListItem, ToggleButtonGroup, 
  ToggleButton, alpha, LinearProgress, Avatar
} from '@mui/material';
import {
  TrendingUp, Info, Speed, DirectionsBike, Timer, ShowChart,
  BarChart, AccessTime, Star, StarBorder, Insights, HelpOutline,
  CalendarToday, NotificationsNone, ArrowUpward, ArrowDownward
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';
import { formatDistance, formatDuration, formatDate } from '../../utils/formatters';
import trainingService from '../../services/trainingService';

/**
 * Composant d'analyse de performance avec prédictions
 * Fournit des analyses avancées sur la progression et prédit les performances futures
 */
const PerformanceAnalysis = ({ userId, recentActivities }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('ftp');
  const [timeRange, setTimeRange] = useState('3m');

  // Métriques disponibles pour l'analyse
  const metrics = [
    { id: 'ftp', name: 'FTP (W)', icon: <TrendingUp aria-hidden="true" /> },
    { id: 'vo2max', name: 'VO2max', icon: <Speed aria-hidden="true" /> },
    { id: 'power_weight', name: 'W/kg', icon: <Insights aria-hidden="true" /> },
    { id: 'threshold_hr', name: 'FC seuil', icon: <ShowChart aria-hidden="true" /> },
    { id: 'endurance', name: 'Endurance', icon: <DirectionsBike aria-hidden="true" /> }
  ];

  // Périodes d'analyse disponibles
  const timeRanges = [
    { id: '1m', name: '1 mois', icon: <CalendarToday fontSize="small" aria-hidden="true" /> },
    { id: '3m', name: '3 mois', icon: <CalendarToday fontSize="small" aria-hidden="true" /> },
    { id: '6m', name: '6 mois', icon: <CalendarToday fontSize="small" aria-hidden="true" /> },
    { id: '1y', name: '1 an', icon: <CalendarToday fontSize="small" aria-hidden="true" /> }
  ];

  useEffect(() => {
    if (userId && recentActivities && recentActivities.length > 0) {
      fetchPerformanceData();
    }
  }, [userId, recentActivities, selectedMetric, timeRange]);

  // Récupérer les données de performance
  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      
      // En production, remplacer par un appel API réel
      // const data = await trainingService.getPerformanceAnalysis(userId, selectedMetric, timeRange);
      
      // Simulation d'analyse pour démonstration
      const data = simulatePerformanceAnalysis(recentActivities, selectedMetric, timeRange);
      
      setPerformanceData(data);
    } catch (error) {
      console.error("Erreur lors de l'analyse de performance:", error);
    } finally {
      setLoading(false);
    }
  };

  // Simulation d'analyse pour démonstration
  const simulatePerformanceAnalysis = (activities, metric, range) => {
    // Déterminer la période d'analyse
    const now = new Date();
    const rangeInDays = {
      '1m': 30,
      '3m': 90,
      '6m': 180,
      '1y': 365
    }[range];
    
    const startDate = new Date(now.getTime() - rangeInDays * 24 * 60 * 60 * 1000);
    
    // Filtrer les activités dans la période
    const filteredActivities = activities.filter(a => new Date(a.date) >= startDate);
    
    // Générer des valeurs de base pour chaque métrique
    const baseValues = {
      ftp: 250,
      vo2max: 50,
      power_weight: 3.5,
      threshold_hr: 170,
      endurance: 70
    };
    
    // Générer une progression sur la période (croissance légèrement exponentielle)
    const generateProgressionData = (baseValue) => {
      // Déterminer le nombre de points de données (environ 1 par semaine)
      const weeks = Math.ceil(rangeInDays / 7);
      const dataPoints = [];
      
      // Calculer l'amélioration totale (3-8% selon la période)
      const improvementPercentage = Math.min(3 + (rangeInDays / 30) * 0.5, 8) / 100;
      
      // Générer les points de données avec une progression non linéaire
      for (let i = 0; i < weeks; i++) {
        const progress = Math.pow(i / weeks, 0.8); // Progression non linéaire
        const improvement = baseValue * improvementPercentage * progress;
        
        // Ajouter un peu de variation aléatoire (+/- 1%)
        const randomVariation = baseValue * (Math.random() * 0.02 - 0.01);
        
        // Calculer la date pour ce point
        const pointDate = new Date(startDate.getTime() + (i * 7 * 24 * 60 * 60 * 1000));
        
        dataPoints.push({
          date: pointDate.toISOString(),
          value: baseValue + improvement + randomVariation
        });
      }
      
      return dataPoints;
    };
    
    // Générer les données spécifiques à la métrique sélectionnée
    const progressionData = generateProgressionData(baseValues[metric]);
    
    // Estimer les valeurs de progression future
    const lastValue = progressionData[progressionData.length - 1].value;
    const futureImprovements = [30, 60, 90].map(days => {
      const improvementRate = days / 30 * 1.0; // 1% par mois de progression
      return {
        days,
        value: lastValue * (1 + improvementRate / 100)
      };
    });
    
    // Calculer le niveau de performance
    const performanceLevel = calculatePerformanceLevel(lastValue, metric);
    
    // Générer les événements clés (pics de performance)
    const keyEvents = generateKeyEvents(progressionData, metric);
    
    return {
      metric,
      current: lastValue,
      progression: progressionData,
      futureProjections: futureImprovements,
      performanceLevel,
      keyEvents,
      benchmarks: generateBenchmarks(metric, lastValue)
    };
  };

  // Calculer le niveau de performance relatif
  const calculatePerformanceLevel = (value, metric) => {
    // Échelles de référence pour chaque métrique
    const scales = {
      ftp: [100, 150, 200, 250, 300, 350, 400],
      vo2max: [30, 35, 40, 45, 50, 55, 60],
      power_weight: [2, 2.5, 3, 3.5, 4, 4.5, 5],
      threshold_hr: [150, 155, 160, 165, 170, 175, 180],
      endurance: [40, 50, 60, 70, 80, 90, 95]
    };
    
    // Niveaux correspondants
    const levels = [
      'Débutant',
      'Intermédiaire débutant',
      'Intermédiaire',
      'Intermédiaire avancé',
      'Avancé',
      'Très avancé',
      'Elite'
    ];
    
    // Trouver le niveau dans l'échelle
    const scale = scales[metric];
    let levelIndex = 0;
    
    for (let i = 0; i < scale.length; i++) {
      if (value >= scale[i]) {
        levelIndex = i;
      } else {
        break;
      }
    }
    
    return {
      label: levels[levelIndex],
      index: levelIndex,
      max: scale.length - 1
    };
  };

  // Générer des événements clés (pics de performance)
  const generateKeyEvents = (progressionData, metric) => {
    // Sélectionner quelques points de la progression comme "événements clés"
    const events = [];
    
    // Calculer les valeurs min et max pour déterminer l'amélioration
    const values = progressionData.map(p => p.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const totalImprovement = maxValue - minValue;
    
    // Seuil pour considérer un événement comme significatif (15% de l'amélioration totale)
    const significantThreshold = minValue + totalImprovement * 0.15;
    
    // Trouver les points dépassant le seuil significatif
    for (let i = 1; i < progressionData.length; i++) {
      const prev = progressionData[i - 1];
      const current = progressionData[i];
      
      // Vérifier si c'est une amélioration significative
      if (current.value > significantThreshold && current.value > prev.value) {
        // Calculer le pourcentage d'amélioration
        const improvementPercent = ((current.value - prev.value) / prev.value) * 100;
        
        // Ajouter uniquement si l'amélioration est significative (>2%)
        if (improvementPercent > 2) {
          events.push({
            date: current.date,
            value: current.value,
            improvement: improvementPercent,
            description: getEventDescription(metric, improvementPercent)
          });
        }
      }
    }
    
    // Limiter à 3 événements maximum
    return events.slice(0, 3);
  };

  // Générer une description pour un événement clé
  const getEventDescription = (metric, improvementPercent) => {
    const descriptions = {
      ftp: [
        'Amélioration de votre puissance au seuil',
        'Progression significative de votre FTP',
        'Bond de performance en puissance soutenue'
      ],
      vo2max: [
        'Progression de votre capacité aérobie',
        'Amélioration notable de votre VO2max',
        'Bond de votre consommation maximale d\'oxygène'
      ],
      power_weight: [
        'Amélioration de votre ratio puissance/poids',
        'Progression significative de vos watts par kilo',
        'Bond de performance en montée'
      ],
      threshold_hr: [
        'Adaptation de votre fréquence cardiaque au seuil',
        'Amélioration de votre efficacité cardiaque',
        'Adaptation positive de votre système cardiovasculaire'
      ],
      endurance: [
        'Progression de votre capacité d\'endurance',
        'Amélioration notable de votre résistance',
        'Bond dans votre capacité à maintenir l\'effort'
      ]
    };
    
    // Sélectionner aléatoirement une description
    const options = descriptions[metric];
    const randomIndex = Math.floor(Math.random() * options.length);
    
    return `${options[randomIndex]} (+${improvementPercent.toFixed(1)}%)`;
  };

  // Générer des benchmarks de comparaison
  const generateBenchmarks = (metric, currentValue) => {
    // Valeurs de référence par métrique et catégorie de cycliste
    const benchmarkValues = {
      ftp: {
        'Cyclosportif débutant': 190,
        'Cyclosportif régulier': 250,
        'Coureur amateur': 300,
        'Coureur élite': 370,
        'Professionnel': 420
      },
      vo2max: {
        'Cyclosportif débutant': 42,
        'Cyclosportif régulier': 48,
        'Coureur amateur': 55,
        'Coureur élite': 62,
        'Professionnel': 75
      },
      power_weight: {
        'Cyclosportif débutant': 2.5,
        'Cyclosportif régulier': 3.2,
        'Coureur amateur': 4.0,
        'Coureur élite': 4.7,
        'Professionnel': 5.5
      },
      threshold_hr: {
        'Cyclosportif débutant': 165,
        'Cyclosportif régulier': 168,
        'Coureur amateur': 172,
        'Coureur élite': 175,
        'Professionnel': 178
      },
      endurance: {
        'Cyclosportif débutant': 50,
        'Cyclosportif régulier': 65,
        'Coureur amateur': 75,
        'Coureur élite': 85,
        'Professionnel': 95
      }
    };
    
    // Convertir en tableau pour l'affichage
    return Object.entries(benchmarkValues[metric]).map(([category, value]) => ({
      category,
      value,
      difference: ((currentValue - value) / value * 100).toFixed(1)
    }));
  };

  // Formater la valeur selon la métrique
  const formatValue = (value, metric) => {
    switch (metric) {
      case 'ftp':
        return `${Math.round(value)} W`;
      case 'vo2max':
        return `${value.toFixed(1)} ml/kg/min`;
      case 'power_weight':
        return `${value.toFixed(2)} W/kg`;
      case 'threshold_hr':
        return `${Math.round(value)} bpm`;
      case 'endurance':
        return `${Math.round(value)}`;
      default:
        return value.toString();
    }
  };

  // Générer les données pour le graphique d'évolution
  const getChartData = () => {
    if (!performanceData || !performanceData.progression) return null;
    
    const labels = performanceData.progression.map(p => formatDate(p.date, 'dayMonth'));
    const values = performanceData.progression.map(p => p.value);
    
    return {
      labels,
      datasets: [
        {
          label: metrics.find(m => m.id === selectedMetric)?.name || selectedMetric,
          data: values,
          fill: false,
          backgroundColor: '#1976d2',
          borderColor: '#1976d2',
          tension: 0.3
        }
      ]
    };
  };

  // Options du graphique
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return formatValue(context.raw, selectedMetric);
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return formatValue(value, selectedMetric);
          }
        }
      }
    }
  };

  // Rendu du composant
  return (
    <Paper 
      elevation={0} 
      variant="outlined" 
      sx={{ p: 2, mb: 3 }}
      component="section"
      aria-labelledby="performance-analysis-title"
    >
      <Typography variant="h6" component="h2" id="performance-analysis-title" gutterBottom>
        Analyse de performance
        <Tooltip title="Analyse avancée de vos données d'entraînement" arrow>
          <IconButton size="small" sx={{ ml: 1, mb: 0.5 }} aria-label="Plus d'informations sur l'analyse de performance">
            <HelpOutline fontSize="small" />
          </IconButton>
        </Tooltip>
      </Typography>
      
      {/* Sélecteurs de métrique et période */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 2, 
          mb: 3,
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box>
          <Typography 
            component="span" 
            variant="subtitle2" 
            id="metric-selector-label" 
            sx={{ mr: 1 }}
          >
            Métrique:
          </Typography>
          <ToggleButtonGroup
            value={selectedMetric}
            exclusive
            onChange={(e, newValue) => newValue && setSelectedMetric(newValue)}
            aria-labelledby="metric-selector-label"
            size="small"
            sx={{
              '.MuiToggleButton-root': {
                py: 0.5,
                px: 1.5,
                typography: 'body2',
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.85),
                  }
                }
              }
            }}
          >
            {metrics.map((metric) => (
              <ToggleButton 
                key={metric.id} 
                value={metric.id}
                aria-label={`Sélectionner métrique: ${metric.name}`}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ mr: 0.5, display: 'flex', alignItems: 'center' }}>
                    {metric.icon}
                  </Box>
                  {metric.name}
                </Box>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
        
        <Box>
          <Typography 
            component="span" 
            variant="subtitle2" 
            id="time-range-label" 
            sx={{ mr: 1 }}
          >
            Période:
          </Typography>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={(e, newValue) => newValue && setTimeRange(newValue)}
            aria-labelledby="time-range-label"
            size="small"
          >
            {timeRanges.map((range) => (
              <ToggleButton 
                key={range.id} 
                value={range.id}
                aria-label={`Sélectionner période: ${range.name}`}
              >
                {range.name}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      </Box>
      
      {/* Contenu principal */}
      {loading ? (
        <Box sx={{ py: 2 }}>
          <Grid container spacing={3}>
            {/* Squelette du graphique */}
            <Grid item xs={12}>
              <Skeleton 
                variant="rectangular" 
                height={250} 
                sx={{ borderRadius: 1 }} 
                animation="wave"
              />
            </Grid>
            
            {/* Squelettes des cartes */}
            {[1, 2].map((item) => (
              <Grid item xs={12} md={6} key={item}>
                <Card elevation={0} variant="outlined">
                  <CardContent>
                    <Skeleton variant="text" width={120} animation="wave" />
                    <Box sx={{ mt: 2 }}>
                      {Array.from(new Array(4)).map((_, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Skeleton variant="circular" width={20} height={20} sx={{ mr: 2 }} animation="wave" />
                          <Skeleton variant="text" width={`${Math.random() * 30 + 60}%`} animation="wave" />
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : performanceData ? (
        <Grid container spacing={3}>
          {/* Résumé des performances */}
          <Grid item xs={12}>
            <Card 
              elevation={0} 
              variant="outlined" 
              sx={{ mb: 2 }}
            >
              <CardContent>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 2,
                    mb: 2 
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      {metrics.find(m => m.id === selectedMetric)?.name}
                    </Typography>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'baseline', 
                        gap: 1 
                      }}
                    >
                      <Typography variant="h4" component="p" sx={{ fontWeight: 600 }}>
                        {formatValue(performanceData.current, selectedMetric)}
                      </Typography>
                      <Chip 
                        icon={performanceData.changePercent >= 0 
                          ? <ArrowUpward fontSize="small" color="inherit" /> 
                          : <ArrowDownward fontSize="small" color="inherit" />
                        }
                        label={`${performanceData.changePercent >= 0 ? '+' : ''}${performanceData.changePercent}%`}
                        size="small"
                        color={performanceData.changePercent >= 0 ? "success" : "error"}
                        sx={{ fontWeight: 500 }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {calculatePerformanceLevel(performanceData.current, selectedMetric).category}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Tooltip title="Votre objectif estimé" arrow>
                      <Box 
                        sx={{ 
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          textAlign: 'right'
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Objectif
                        </Typography>
                        <Typography variant="h6" component="p">
                          {formatValue(performanceData.target, selectedMetric)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Potentiel estimé dans {timeRanges.find(r => r.id === timeRange)?.name}
                        </Typography>
                      </Box>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Graphique d'évolution */}
                <Box 
                  sx={{ 
                    height: 240,
                    position: 'relative'
                  }}
                  aria-hidden="true"
                >
                  {getChartData() && (
                    <Line 
                      data={getChartData()} 
                      options={chartOptions} 
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Événements clés */}
          {performanceData.keyEvents && performanceData.keyEvents.length > 0 && (
            <Grid item xs={12} md={6}>
              <Card 
                elevation={0} 
                variant="outlined"
                component="article"
                aria-labelledby="key-events-title"
              >
                <CardContent>
                  <Typography 
                    variant="subtitle2" 
                    gutterBottom
                    id="key-events-title"
                  >
                    Événements clés
                  </Typography>
                  
                  <List disablePadding>
                    {performanceData.keyEvents.map((event, index) => (
                      <ListItem
                        key={index}
                        disablePadding
                        divider={index < performanceData.keyEvents.length - 1}
                        sx={{ py: 1 }}
                      >
                        <Box 
                          sx={{ 
                            mr: 2,
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center'
                          }}
                        >
                          <Avatar
                            sx={{ 
                              width: 32, 
                              height: 32, 
                              bgcolor: alpha(theme.palette.warning.main, 0.15),
                              color: theme.palette.warning.main
                            }}
                          >
                            <Star fontSize="small" />
                          </Avatar>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(event.date, 'dayMonth')}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {event.description}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Nouvelle valeur: {formatValue(event.value, selectedMetric)}
                          </Typography>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          )}
          
          {/* Comparaison benchmarks */}
          <Grid item xs={12} md={6}>
            <Card 
              elevation={0} 
              variant="outlined"
              component="article"
              aria-labelledby="benchmarks-title"
            >
              <CardContent>
                <Typography 
                  variant="subtitle2" 
                  gutterBottom
                  id="benchmarks-title"
                >
                  Comparaison avec références
                </Typography>
                
                <TableContainer>
                  <Table 
                    size="small"
                    aria-label="Tableau de comparaison des performances avec références"
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell>Catégorie</TableCell>
                        <TableCell>Valeur</TableCell>
                        <TableCell>Différence</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {performanceData.benchmarks.map((benchmark, index) => (
                        <TableRow key={index}>
                          <TableCell>{benchmark.category}</TableCell>
                          <TableCell>{formatValue(benchmark.value, selectedMetric)}</TableCell>
                          <TableCell>
                            <Box
                              sx={{ 
                                display: 'flex',
                                alignItems: 'center',
                                color: parseFloat(benchmark.difference) >= 0 
                                  ? theme.palette.success.main 
                                  : theme.palette.error.main
                              }}
                            >
                              {parseFloat(benchmark.difference) >= 0 ? (
                                <ArrowUpward fontSize="inherit" sx={{ mr: 0.5 }} />
                              ) : (
                                <ArrowDownward fontSize="inherit" sx={{ mr: 0.5 }} />
                              )}
                              <Typography 
                                variant="body2" 
                                component="span"
                                sx={{ fontWeight: 500 }}
                              >
                                {parseFloat(benchmark.difference) >= 0 ? '+' : ''}{benchmark.difference}%
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Alert 
          severity="info" 
          variant="outlined"
        >
          <AlertTitle>Données insuffisantes</AlertTitle>
          Données d'entraînement insuffisantes pour l'analyse de performance. Continuez à enregistrer vos activités pour obtenir des analyses plus précises.
        </Alert>
      )}
    </Paper>
  );
};

export default PerformanceAnalysis;
