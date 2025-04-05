import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, Box, Grid, Button, Divider, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tooltip, IconButton, Card, CardContent, Alert, Chip
} from '@mui/material';
import {
  TrendingUp, Info, Speed, DirectionsBike, Timer, ShowChart,
  BarChart, AccessTime, Star, StarBorder, Insights, HelpOutline
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';
import { formatDistance, formatDuration, formatDate } from '../../utils/formatters';
import trainingService from '../../services/trainingService';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

/**
 * Composant d'analyse de performance avec prédictions
 * Fournit des analyses avancées sur la progression et prédit les performances futures
 */
const PerformanceAnalysis = ({ userId, recentActivities }) => {
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('ftp');
  const [timeRange, setTimeRange] = useState('3m');

  // Métriques disponibles pour l'analyse
  const metrics = [
    { id: 'ftp', name: 'FTP (W)', icon: <TrendingUp /> },
    { id: 'vo2max', name: 'VO2max', icon: <Speed /> },
    { id: 'power_weight', name: 'W/kg', icon: <Insights /> },
    { id: 'threshold_hr', name: 'FC seuil', icon: <ShowChart /> },
    { id: 'endurance', name: 'Endurance', icon: <DirectionsBike /> }
  ];

  // Périodes d'analyse disponibles
  const timeRanges = [
    { id: '1m', name: '1 mois' },
    { id: '3m', name: '3 mois' },
    { id: '6m', name: '6 mois' },
    { id: '1y', name: '1 an' }
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
      currentValue: lastValue,
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
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/performanceanalysis"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
    <Paper elevation={0} variant="outlined" sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
          Analyse de progression
        </Typography>
        
        {/* Sélection de la métrique */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {metrics.map(metric => (
            <Tooltip key={metric.id} title={metric.name}>
              <Chip
                icon={metric.icon}
                label={metric.id.toUpperCase()}
                onClick={() => setSelectedMetric(metric.id)}
                color={selectedMetric === metric.id ? 'primary' : 'default'}
                variant={selectedMetric === metric.id ? 'filled' : 'outlined'}
                size="small"
              />
            </Tooltip>
          ))}
        </Box>
      </Box>
      
      {/* Sélection de la période */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        {timeRanges.map(range => (
          <Button
            key={range.id}
            size="small"
            onClick={() => setTimeRange(range.id)}
            color={timeRange === range.id ? 'primary' : 'inherit'}
            variant={timeRange === range.id ? 'contained' : 'text'}
            sx={{ minWidth: 'auto', px: 1 }}
          >
            {range.name}
          </Button>
        ))}
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : performanceData ? (
        <Grid container spacing={3}>
          {/* Valeur actuelle et niveau */}
          <Grid item xs={12} md={4}>
            <Card elevation={0} variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ mr: 1 }}>
                    {metrics.find(m => m.id === selectedMetric)?.name || selectedMetric}
                  </Typography>
                  <Tooltip title="Cette métrique représente votre niveau de performance actuel.">
                    <IconButton size="small">
                      <HelpOutline fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="h3" gutterBottom>
                  {formatValue(performanceData.currentValue, selectedMetric)}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    Niveau:
                  </Typography>
                  <Chip 
                    label={performanceData.performanceLevel.label}
                    size="small"
                    color={performanceData.performanceLevel.index >= 4 ? 'success' : 'primary'}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', mt: 1.5 }}>
                  {[...Array(7)].map((_, i) => (
                    <Box
                      key={i}
                      sx={{
                        width: 12,
                        height: 8,
                        borderRadius: '2px',
                        mr: 0.5,
                        bgcolor: i <= performanceData.performanceLevel.index ? 
                          (i >= 4 ? 'success.main' : 'primary.main') : 
                          'divider'
                      }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Projections futures */}
          <Grid item xs={12} md={8}>
            <Card elevation={0} variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Projection de progression
                </Typography>
                
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Période</TableCell>
                        <TableCell>Valeur estimée</TableCell>
                        <TableCell>Progression</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {performanceData.futureProjections.map((projection, index) => (
                        <TableRow key={index}>
                          <TableCell>{`+ ${projection.days} jours`}</TableCell>
                          <TableCell>{formatValue(projection.value, selectedMetric)}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <TrendingUp fontSize="small" color="success" sx={{ mr: 1 }} />
                              <Typography variant="body2">
                                {`+${((projection.value / performanceData.currentValue - 1) * 100).toFixed(1)}%`}
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    * Projections basées sur votre rythme de progression actuel et supposant un entraînement régulier.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Graphique d'évolution */}
          <Grid item xs={12}>
            <Card elevation={0} variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Évolution sur {timeRanges.find(r => r.id === timeRange)?.name}
                </Typography>
                
                <Box sx={{ height: 250, mt: 2 }}>
                  {getChartData() && (
                    <Line data={getChartData()} options={chartOptions} />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Événements clés */}
          {performanceData.keyEvents && performanceData.keyEvents.length > 0 && (
            <Grid item xs={12} md={6}>
              <Card elevation={0} variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Événements clés
                  </Typography>
                  
                  <List disablePadding>
                    {performanceData.keyEvents.map((event, index) => (
                      <Box key={index} sx={{ 
                        display: 'flex', 
                        py: 1,
                        borderBottom: index < performanceData.keyEvents.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider'
                      }}>
                        <Box sx={{ 
                          mr: 2,
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'center'
                        }}>
                          <Star color="warning" />
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
                      </Box>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          )}
          
          {/* Comparaison benchmarks */}
          <Grid item xs={12} md={6}>
            <Card elevation={0} variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Comparaison avec références
                </Typography>
                
                <TableContainer>
                  <Table size="small">
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
                            <Typography 
                              variant="body2" 
                              color={parseFloat(benchmark.difference) >= 0 ? 'success.main' : 'error.main'}
                            >
                              {parseFloat(benchmark.difference) >= 0 ? '+' : ''}{benchmark.difference}%
                            </Typography>
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
        <Alert severity="info">
          Données d'entraînement insuffisantes pour l'analyse de performance.
        </Alert>
      )}
    </Paper>
  );
};

export default PerformanceAnalysis;
