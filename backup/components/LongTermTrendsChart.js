import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Tooltip,
  IconButton,
  CircularProgress,
  useTheme
} from '@mui/material';
import { 
  InfoOutlined, 
  FileDownload,
  ShowChart,
  Timeline,
  BarChart as BarChartIcon,
  DonutLarge
} from '@mui/icons-material';
import { Line, Bar } from 'react-chartjs-2';
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
import 'chartjs-adapter-date-fns';
import annotationPlugin from 'chartjs-plugin-annotation';
import zoomPlugin from 'chartjs-plugin-zoom';
import { fr } from 'date-fns/locale';
import trainingService from '../../services/trainingService';
import { formatDistance, formatDuration } from '../../utils/formatters';

// Enregistrer les plugins et composants Chart.js nécessaires
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  Filler,
  annotationPlugin,
  zoomPlugin
);

/**
 * Composant avancé pour visualiser et analyser les tendances d'entraînement à long terme
 * @param {Object} props - Propriétés du composant
 * @param {string} props.userId - ID de l'utilisateur
 * @param {Object} [props.sx] - Styles supplémentaires
 */
const LongTermTrendsChart = ({ userId, sx = {} }) => {
  const theme = useTheme();
  
  // États pour les données et options d'affichage
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [timeRange, setTimeRange] = useState('year'); // week, month, year, all
  const [chartType, setChartType] = useState('line'); // line, bar, area
  const [aggregation, setAggregation] = useState('week'); // day, week, month
  const [metric, setMetric] = useState('distance'); // distance, duration, elevation, speed, calories
  const [annotations, setAnnotations] = useState([]);
  const [downloadUrl, setDownloadUrl] = useState(null);
  
  // Définition des métriques disponibles
  const metrics = [
    { value: 'distance', label: 'Distance (km)', color: theme.palette.primary.main },
    { value: 'duration', label: 'Durée (heures)', color: theme.palette.secondary.main },
    { value: 'elevation', label: 'Dénivelé (m)', color: theme.palette.success.main },
    { value: 'speed', label: 'Vitesse moyenne (km/h)', color: theme.palette.info.main },
    { value: 'calories', label: 'Calories (kcal)', color: theme.palette.warning.main },
    { value: 'activities', label: 'Nombre de sorties', color: theme.palette.error.main }
  ];
  
  // Liste des périodes disponibles
  const timeRanges = [
    { value: 'month', label: '3 mois' },
    { value: 'sixMonths', label: '6 mois' },
    { value: 'year', label: '1 an' },
    { value: 'twoYears', label: '2 ans' },
    { value: 'all', label: 'Tout' }
  ];
  
  // Liste des agrégations disponibles
  const aggregations = [
    { value: 'day', label: 'Par jour' },
    { value: 'week', label: 'Par semaine' },
    { value: 'month', label: 'Par mois' },
    { value: 'year', label: 'Par année' }
  ];
  
  // Chargement des données historiques
  useEffect(() => {
    fetchHistoricalData();
  }, [userId, timeRange, aggregation, metric]);

  const fetchHistoricalData = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Récupérer les données en fonction de la période sélectionnée
      const response = await trainingService.getHistoricalData(userId, {
        timeRange,
        aggregation,
        metric
      });
      
      // Vérifier que la réponse contient des données valides
      if (!response || !response.data) {
        console.error('Données historiques invalides ou vides');
        setChartData(null);
        setAnnotations([]);
        return;
      }
      
      // Préparer les annotations (événements, records, objectifs atteints)
      let annotationsData = [];
      try {
        annotationsData = await trainingService.getTrainingAnnotations(userId, timeRange) || [];
      } catch (annotationError) {
        console.error('Erreur lors du chargement des annotations:', annotationError);
        annotationsData = [];
      }
      
      setAnnotations(annotationsData);
      prepareChartData(response.data, annotationsData);
    } catch (error) {
      console.error('Erreur lors du chargement des données historiques:', error);
      setChartData(null);
      setAnnotations([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Préparation des données pour le graphique
  const prepareChartData = (data, annotationsData) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      setChartData(null);
      setDownloadUrl(null);
      return;
    }
    
    try {
      // Filtrer les données invalides
      const validData = data.filter(item => 
        item && 
        item.date && 
        (item.value !== null && item.value !== undefined)
      );
      
      if (validData.length === 0) {
        setChartData(null);
        setDownloadUrl(null);
        return;
      }
      
      // Trier les données par date
      const sortedData = [...validData].sort((a, b) => {
        try {
          return new Date(a.date) - new Date(b.date);
        } catch (error) {
          console.error('Erreur lors du tri des dates:', error);
          return 0;
        }
      });
      
      // Obtenir la couleur de la métrique actuelle
      const metricColor = metrics.find(m => m.value === metric)?.color || theme.palette.primary.main;
      const metricLabel = metrics.find(m => m.value === metric)?.label || 'Valeur';
      
      // Préparer les données en fonction du type de graphique
      const chartDataset = {
        labels: sortedData.map(item => item.date),
        datasets: [
          {
            label: metricLabel,
            data: sortedData.map(item => item.value),
            borderColor: metricColor,
            backgroundColor: chartType === 'area' 
              ? `${metricColor}33` // Ajouter transparence pour l'aire
              : chartType === 'bar'
                ? metricColor
                : 'rgba(0, 0, 0, 0)',
            fill: chartType === 'area',
            tension: 0.4,
            pointRadius: sortedData.length > 30 ? 0 : 3,
            pointHoverRadius: 6,
            borderWidth: 2
          }
        ]
      };
      
      // Ajouter la moyenne mobile si c'est un graphique en ligne ou aire
      if (chartType !== 'bar' && sortedData.length > 10) {
        const movingAverageWindowSize = Math.min(5, Math.floor(sortedData.length / 3));
        if (movingAverageWindowSize > 1) {
          try {
            const movingAverages = calculateMovingAverage(
              sortedData.map(item => item.value),
              movingAverageWindowSize
            );
            
            chartDataset.datasets.push({
              label: 'Moyenne mobile',
              data: movingAverages,
              borderColor: theme.palette.grey[600],
              backgroundColor: 'rgba(0, 0, 0, 0)',
              borderDash: [5, 5],
              tension: 0.4,
              pointRadius: 0,
              borderWidth: 1.5
            });
          } catch (error) {
            console.error('Erreur lors du calcul de la moyenne mobile:', error);
          }
        }
      }
      
      // Ajouter la tendance si suffisamment de données
      if (sortedData.length > 5) {
        try {
          const trendLine = calculateTrendLine(
            sortedData.map((_, index) => index),
            sortedData.map(item => item.value)
          );
          
          chartDataset.datasets.push({
            label: 'Tendance',
            data: sortedData.map((_, index) => trendLine.slope * index + trendLine.intercept),
            borderColor: theme.palette.info.dark,
            backgroundColor: 'rgba(0, 0, 0, 0)',
            borderDash: [10, 5],
            borderWidth: 2,
            pointRadius: 0
          });
        } catch (error) {
          console.error('Erreur lors du calcul de la ligne de tendance:', error);
        }
      }
      
      setChartData(chartDataset);
      
      // Générer l'URL de téléchargement pour les données
      try {
        generateDownloadUrl(sortedData);
      } catch (error) {
        console.error('Erreur lors de la génération de l\'URL de téléchargement:', error);
        setDownloadUrl(null);
      }
    } catch (error) {
      console.error('Erreur lors de la préparation des données du graphique:', error);
      setChartData(null);
      setDownloadUrl(null);
    }
  };
  
  // Calcul de la moyenne mobile
  const calculateMovingAverage = (data, windowSize) => {
    if (!data || !Array.isArray(data) || data.length < windowSize) {
      return Array(data.length).fill(null);
    }
    
    try {
      const result = [];
      
      // Ajouter des valeurs null pour les premiers points (pas assez de données)
      for (let i = 0; i < windowSize - 1; i++) {
        result.push(null);
      }
      
      // Calculer la moyenne mobile pour chaque fenêtre
      for (let i = windowSize - 1; i < data.length; i++) {
        let sum = 0;
        let validCount = 0;
        
        for (let j = 0; j < windowSize; j++) {
          const value = data[i - j];
          if (value !== null && value !== undefined && !isNaN(value)) {
            sum += value;
            validCount++;
          }
        }
        
        if (validCount > 0) {
          result.push(sum / validCount);
        } else {
          result.push(null);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Erreur dans le calcul de la moyenne mobile:', error);
      return Array(data.length).fill(null);
    }
  };
  
  // Calcul de la ligne de tendance (régression linéaire)
  const calculateTrendLine = (xValues, yValues) => {
    if (!xValues || !yValues || xValues.length !== yValues.length || xValues.length < 2) {
      return { slope: 0, intercept: 0 };
    }
    
    try {
      // Filtrer les paires de points valides
      const validPairs = [];
      for (let i = 0; i < xValues.length; i++) {
        if (yValues[i] !== null && yValues[i] !== undefined && !isNaN(yValues[i])) {
          validPairs.push({ x: xValues[i], y: yValues[i] });
        }
      }
      
      if (validPairs.length < 2) {
        return { slope: 0, intercept: 0 };
      }
      
      // Calculer les moyennes
      const n = validPairs.length;
      const sumX = validPairs.reduce((acc, pair) => acc + pair.x, 0);
      const sumY = validPairs.reduce((acc, pair) => acc + pair.y, 0);
      const meanX = sumX / n;
      const meanY = sumY / n;
      
      // Calculer les coefficients
      let numerator = 0;
      let denominator = 0;
      
      for (const pair of validPairs) {
        numerator += (pair.x - meanX) * (pair.y - meanY);
        denominator += (pair.x - meanX) ** 2;
      }
      
      // Éviter la division par zéro
      if (Math.abs(denominator) < 0.0001) {
        return { slope: 0, intercept: meanY };
      }
      
      const slope = numerator / denominator;
      const intercept = meanY - slope * meanX;
      
      return { slope, intercept };
    } catch (error) {
      console.error('Erreur dans le calcul de la ligne de tendance:', error);
      return { slope: 0, intercept: 0 };
    }
  };
  
  // Générer l'URL de téléchargement pour les données CSV
  const generateDownloadUrl = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      setDownloadUrl(null);
      return;
    }
    
    try {
      // Créer les en-têtes
      const headers = ['Date', metrics.find(m => m.value === metric)?.label || 'Valeur'];
      
      // Créer les lignes
      const rows = data.map(item => {
        if (!item || !item.date) return null;
        
        try {
          // Formater la date
          const formattedDate = typeof item.date === 'string' ? item.date : formatDate(item.date);
          return [formattedDate, item.value !== undefined ? item.value : ''].join(',');
        } catch (error) {
          return null;
        }
      }).filter(Boolean); // Filtrer les lignes nulles
      
      // Combiner tout
      const csvContent = [headers.join(','), ...rows].join('\n');
      
      // Créer un blob et une URL
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      setDownloadUrl(url);
    } catch (error) {
      console.error('Erreur lors de la génération de l\'URL de téléchargement:', error);
      setDownloadUrl(null);
    }
  };
  
  // Options pour les différents types de graphiques
  const getChartOptions = () => {
    const metricUnit = metric === 'distance' ? 'km' :
                       metric === 'duration' ? 'h' :
                       metric === 'elevation' ? 'm' :
                       metric === 'speed' ? 'km/h' :
                       metric === 'calories' ? 'kcal' : '';
    
    // Options de base pour tous les types de graphiques
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              if (!context || !context.dataset) return '';
              
              try {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed && context.parsed.y !== null && context.parsed.y !== undefined) {
                  if (metric === 'duration') {
                    // Convertir les heures en format heures:minutes
                    const hours = Math.floor(context.parsed.y);
                    const minutes = Math.round((context.parsed.y - hours) * 60);
                    label += `${hours}h ${minutes}min`;
                  } else {
                    label += `${Number(context.parsed.y).toFixed(1)} ${metricUnit}`;
                  }
                }
                return label;
              } catch (error) {
                console.error("Erreur dans le format d'affichage du tooltip:", error);
                return 'Valeur non disponible';
              }
            }
          }
        },
        annotation: {
          annotations: Array.isArray(annotations) ? annotations.map(ann => {
            try {
              if (!ann || !ann.date) return null;
              
              return {
                type: 'line',
                scaleID: 'x',
                value: ann.date,
                borderColor: ann.type === 'record' ? theme.palette.success.main :
                           ann.type === 'goal' ? theme.palette.primary.main :
                           theme.palette.warning.main,
                borderWidth: 2,
                label: {
                  display: true,
                  content: ann.label || '',
                  position: 'start',
                  backgroundColor: ann.type === 'record' ? theme.palette.success.main :
                                 ann.type === 'goal' ? theme.palette.primary.main :
                                 theme.palette.warning.main,
                  font: {
                    size: 10
                  }
                }
              };
            } catch (error) {
              console.error("Erreur dans la création des annotations:", error);
              return null;
            }
          }).filter(Boolean) : []
        },
        zoom: {
          pan: {
            enabled: true,
            mode: 'x'
          },
          zoom: {
            wheel: {
              enabled: true
            },
            pinch: {
              enabled: true
            },
            mode: 'x'
          }
        }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: aggregation === 'day' ? 'day' :
                 aggregation === 'week' ? 'week' :
                 aggregation === 'month' ? 'month' : 'year',
            displayFormats: {
              day: 'dd/MM',
              week: 'dd/MM',
              month: 'MMM yyyy',
              year: 'yyyy'
            },
            tooltipFormat: 'dd/MM/yyyy'
          },
          adapters: {
            date: {
              locale: fr
            }
          },
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          title: {
            display: true,
            text: metrics.find(m => m.value === metric)?.label || 'Valeur'
          },
          beginAtZero: true
        }
      }
    };
    
    // Ajustements spécifiques en fonction du type de graphique
    try {
      if (chartType === 'area') {
        return baseOptions;
      } else if (chartType === 'bar') {
        return {
          ...baseOptions,
          scales: {
            ...baseOptions.scales,
            x: {
              ...baseOptions.scales.x,
              stacked: false
            },
            y: {
              ...baseOptions.scales.y,
              stacked: false
            }
          }
        };
      } else {
        return baseOptions;
      }
    } catch (error) {
      console.error("Erreur dans la génération des options du graphique:", error);
      return baseOptions;
    }
  };
  
  // Gestion des changements de type de graphique
  const handleChartTypeChange = (event, newType) => {
    try {
      if (newType !== null) {
        setChartType(newType);
      }
    } catch (error) {
      console.error("Erreur lors du changement de type de graphique:", error);
    }
  };
  
  // Gestion des changements de métrique
  const handleMetricChange = (event) => {
    try {
      if (event && event.target) {
        setMetric(event.target.value);
      }
    } catch (error) {
      console.error("Erreur lors du changement de métrique:", error);
    }
  };
  
  // Gestion des changements de période
  const handleTimeRangeChange = (event) => {
    try {
      if (event && event.target) {
        setTimeRange(event.target.value);
      }
    } catch (error) {
      console.error("Erreur lors du changement de période:", error);
    }
  };
  
  // Gestion des changements d'agrégation
  const handleAggregationChange = (event) => {
    try {
      if (event && event.target) {
        setAggregation(event.target.value);
      }
    } catch (error) {
      console.error("Erreur lors du changement d'agrégation:", error);
    }
  };
  
  // Télécharger les données CSV
  const handleDownloadData = () => {
    try {
      if (downloadUrl) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', `tendances_${metric}_${timeRange}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement des données:", error);
    }
  };
  
  return (
    <Paper 
      variant="outlined" 
      sx={{ 
        p: 3, 
        position: 'relative', 
        height: '100%',
        ...sx 
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h3">
            Analyse des tendances à long terme
            <Tooltip title="Visualisez l'évolution de vos performances dans le temps et identifiez les tendances de progression">
              <IconButton size="small" sx={{ ml: 1, mt: -0.5 }}>
                <InfoOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          </Typography>
          
          <Box>
            <Tooltip title="Télécharger les données (CSV)">
              <IconButton 
                size="small" 
                onClick={handleDownloadData}
                disabled={!downloadUrl}
              >
                <FileDownload fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="metric-select-label">Métrique</InputLabel>
              <Select
                labelId="metric-select-label"
                id="metric-select"
                value={metric}
                label="Métrique"
                onChange={handleMetricChange}
              >
                {metrics.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="time-range-select-label">Période</InputLabel>
              <Select
                labelId="time-range-select-label"
                id="time-range-select"
                value={timeRange}
                label="Période"
                onChange={handleTimeRangeChange}
              >
                {timeRanges.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="aggregation-select-label">Agrégation</InputLabel>
              <Select
                labelId="aggregation-select-label"
                id="aggregation-select"
                value={aggregation}
                label="Agrégation"
                onChange={handleAggregationChange}
              >
                {aggregations.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <ToggleButtonGroup
              value={chartType}
              exclusive
              onChange={handleChartTypeChange}
              aria-label="type de graphique"
              size="small"
              fullWidth
            >
              <ToggleButton value="line" aria-label="ligne">
                <Tooltip title="Graphique en ligne">
                  <ShowChart />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="area" aria-label="aire">
                <Tooltip title="Graphique en aire">
                  <Timeline />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="bar" aria-label="barres">
                <Tooltip title="Graphique en barres">
                  <BarChartIcon />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
        
        <Box sx={{ flexGrow: 1, minHeight: '400px', position: 'relative' }}>
          {loading ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%' 
            }}>
              <CircularProgress />
            </Box>
          ) : !chartData ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              border: `1px dashed ${theme.palette.divider}`,
              borderRadius: 1
            }}>
              <Typography variant="body2" color="text.secondary">
                Aucune donnée disponible pour cette période et cette métrique
              </Typography>
            </Box>
          ) : (
            <Box sx={{ height: '100%' }}>
              {chartType === 'bar' ? (
                <Bar data={chartData} options={getChartOptions()} />
              ) : (
                <Line data={chartData} options={getChartOptions()} />
              )}
            </Box>
          )}
        </Box>
        
        {/* Insights sur les tendances */}
        {chartData && chartData.datasets && chartData.datasets[0] && chartData.datasets[0].data && !loading && (
          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle2" gutterBottom>
              Insights
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ bgcolor: 'background.neutral', p: 1.5, borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Tendance générale
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {(() => {
                      try {
                        const data = chartData.datasets[0].data;
                        if (!data || data.length < 2) return 'Données insuffisantes';
                        
                        // Filtrer les valeurs valides
                        const validData = data.filter(val => val !== null && val !== undefined && !isNaN(val));
                        if (validData.length < 2) return 'Données insuffisantes';
                        
                        const first = validData[0];
                        const last = validData[validData.length - 1];
                        
                        if (Math.abs(last - first) < 0.001) return 'Stable';
                        return last > first ? 'En progression' : 'En diminution';
                      } catch (error) {
                        console.error('Erreur dans le calcul de la tendance:', error);
                        return 'Non disponible';
                      }
                    })()}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ bgcolor: 'background.neutral', p: 1.5, borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Variation
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {chartData.datasets[0].data && formatVariation(chartData.datasets[0].data)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ bgcolor: 'background.neutral', p: 1.5, borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Consistance
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {chartData.datasets[0].data && calculateConsistency(chartData.datasets[0].data)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

// Formater la variation des données
const formatVariation = (data) => {
  try {
    if (!data || !Array.isArray(data) || data.length < 2) return 'N/A';
    
    // Filtrer les valeurs valides
    const validData = data.filter(val => val !== null && val !== undefined && !isNaN(val));
    if (validData.length < 2) return 'N/A';
    
    const first = validData[0];
    const last = validData[validData.length - 1];
    
    if (first === 0) return last > 0 ? '+∞%' : last < 0 ? '-∞%' : '0%';
    
    const change = last - first;
    const percentChange = (change / Math.abs(first)) * 100;
    
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)} (${sign}${percentChange.toFixed(1)}%)`;
  } catch (error) {
    console.error('Erreur lors du calcul de la variation:', error);
    return 'N/A';
  }
};

// Calculer la consistance des données (coefficient de variation)
const calculateConsistency = (data) => {
  try {
    if (!data || !Array.isArray(data) || data.length < 2) return 'N/A';
    
    // Filtrer les valeurs valides
    const validData = data.filter(val => val !== null && val !== undefined && !isNaN(val));
    if (validData.length < 2) return 'N/A';
    
    // Calculer la moyenne
    const sum = validData.reduce((acc, val) => acc + val, 0);
    const mean = sum / validData.length;
    
    // Si la moyenne est trop proche de zéro, éviter la division par zéro
    if (Math.abs(mean) < 0.0001) return 'Non calculable';
    
    // Calculer l'écart-type
    const squaredDifferences = validData.map(val => Math.pow(val - mean, 2));
    const variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / validData.length;
    const stdDev = Math.sqrt(variance);
    
    // Coefficient de variation (en pourcentage)
    const cv = (stdDev / Math.abs(mean)) * 100;
    
    if (cv < 10) return 'Très consistant';
    if (cv < 20) return 'Consistant';
    if (cv < 30) return 'Moyennement consistant';
    if (cv < 50) return 'Variable';
    return 'Très variable';
  } catch (error) {
    console.error('Erreur lors du calcul de la consistance:', error);
    return 'N/A';
  }
};

export default LongTermTrendsChart;
