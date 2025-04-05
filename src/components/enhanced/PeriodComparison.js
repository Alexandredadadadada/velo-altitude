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
  Divider,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  useTheme
} from '@mui/material';
import { 
  DateRange, 
  CompareArrows, 
  InfoOutlined, 
  FileDownload,
  Add,
  SwapHoriz,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Print
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { fr } from 'date-fns/locale';
import { addDays, addWeeks, subDays, subWeeks, subMonths, format, isWithinInterval } from 'date-fns';
import { Bar, Radar } from 'react-chartjs-2';
import trainingService from '../../services/trainingService';
import { formatDistance, formatDuration, formatPercentage } from '../../utils/formatters';
import ComparisonCharts from './ComparisonCharts';
import MetricComparisonCard from './MetricComparisonCard';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

/**
 * Composant pour comparer les performances entre différentes périodes d'entraînement
 * @param {Object} props - Propriétés du composant
 * @param {string} props.userId - ID de l'utilisateur
 * @param {Object} [props.sx] - Styles supplémentaires
 */
const PeriodComparison = ({ userId, sx = {} }) => {
  const theme = useTheme();
  
  // États pour les périodes de comparaison
  const [loading, setLoading] = useState(false);
  const [periodType, setPeriodType] = useState('custom'); // custom, weekToWeek, monthToMonth, yearToYear, vsLastYear
  const [period1, setPeriod1] = useState({
    start: subWeeks(new Date(), 2),
    end: subWeeks(new Date(), 1),
    label: 'Période 1'
  });
  const [period2, setPeriod2] = useState({
    start: subWeeks(new Date(), 1),
    end: new Date(),
    label: 'Période 2'
  });
  const [periodData, setPeriodData] = useState({
    period1: null,
    period2: null
  });
  const [metrics, setMetrics] = useState([
    'distance',
    'duration',
    'elevation',
    'activitiesCount',
    'averageSpeed'
  ]);
  const [selectedTab, setSelectedTab] = useState(0);
  
  // Définition des périodes prédéfinies disponibles
  const periodTypes = [
    { value: 'custom', label: 'Périodes personnalisées' },
    { value: 'weekToWeek', label: 'Semaine à semaine' },
    { value: 'monthToMonth', label: 'Mois à mois' },
    { value: 'yearToYear', label: 'Année à année' },
    { value: 'vsLastYear', label: 'Même période l\'année dernière' }
  ];
  
  // Définition des métriques disponibles
  const availableMetrics = [
    { value: 'distance', label: 'Distance (km)', color: theme.palette.primary.main },
    { value: 'duration', label: 'Durée (heures)', color: theme.palette.secondary.main },
    { value: 'elevation', label: 'Dénivelé (m)', color: theme.palette.success.main },
    { value: 'activitiesCount', label: 'Nombre de sorties', color: theme.palette.warning.main },
    { value: 'averageSpeed', label: 'Vitesse moyenne (km/h)', color: theme.palette.info.main },
    { value: 'calories', label: 'Calories (kcal)', color: theme.palette.error.main },
    { value: 'maxSpeed', label: 'Vitesse max (km/h)', color: theme.palette.grey[700] },
    { value: 'longestActivity', label: 'Plus longue sortie (km)', color: '#9c27b0' }
  ];
  
  // Effectuer la comparaison lorsque les périodes changent
  useEffect(() => {
    if (periodType === 'custom') {
      // Garder les périodes personnalisées actuelles
      return;
    }
    
    // Mettre à jour les périodes en fonction du type sélectionné
    updatePeriodsBasedOnType();
  }, [periodType]);
  
  // Charger les données lorsque les périodes sont définies
  useEffect(() => {
    if (!userId || !period1.start || !period1.end || !period2.start || !period2.end) {
      return;
    }
    
    fetchComparisonData();
  }, [userId, period1, period2]);
  
  // Mettre à jour les périodes en fonction du type sélectionné
  const updatePeriodsBasedOnType = () => {
    const now = new Date();
    
    switch (periodType) {
      case 'weekToWeek':
        // Cette semaine vs semaine dernière
        setPeriod1({
          start: subWeeks(now, 1),
          end: subDays(now, 1),
          label: 'Semaine dernière'
        });
        setPeriod2({
          start: subDays(now, 7),
          end: now,
          label: 'Cette semaine'
        });
        break;
        
      case 'monthToMonth':
        // Ce mois vs mois dernier
        setPeriod1({
          start: subMonths(now, 1),
          end: subDays(now, 1),
          label: 'Mois dernier'
        });
        setPeriod2({
          start: subDays(now, 30),
          end: now,
          label: 'Ce mois'
        });
        break;
        
      case 'yearToYear':
        // Cette année vs année dernière
        const currentYear = now.getFullYear();
        setPeriod1({
          start: new Date(currentYear - 1, 0, 1),
          end: new Date(currentYear - 1, 11, 31),
          label: 'Année dernière'
        });
        setPeriod2({
          start: new Date(currentYear, 0, 1),
          end: now,
          label: 'Cette année'
        });
        break;
        
      case 'vsLastYear':
        // Même période que maintenant mais l'année dernière
        const period = 30; // 30 jours
        setPeriod1({
          start: new Date(subDays(now, period).setFullYear(now.getFullYear() - 1)),
          end: new Date(now.setFullYear(now.getFullYear() - 1)),
          label: `Il y a un an (${period} jours)`
        });
        setPeriod2({
          start: subDays(new Date(), period),
          end: new Date(),
          label: `Maintenant (${period} jours)`
        });
        break;
        
      default:
        // Ne rien faire pour 'custom'
        break;
    }
  };
  
  // Récupérer les données de comparaison
  const fetchComparisonData = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      // Récupérer les données pour les deux périodes
      const [data1, data2] = await Promise.all([
        trainingService.getPeriodData(userId, {
          startDate: period1.start,
          endDate: period1.end
        }),
        trainingService.getPeriodData(userId, {
          startDate: period2.start,
          endDate: period2.end
        })
      ]);
      
      setPeriodData({
        period1: data1,
        period2: data2
      });
      
    } catch (error) {
      console.error('Erreur lors de la récupération des données de comparaison:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Gérer le changement de type de période
  const handlePeriodTypeChange = (event) => {
    setPeriodType(event.target.value);
  };
  
  // Gérer le changement de date pour une période
  const handleDateChange = (periodKey, dateType, date) => {
    if (periodKey === 'period1') {
      setPeriod1(prev => ({
        ...prev,
        [dateType]: date
      }));
    } else {
      setPeriod2(prev => ({
        ...prev,
        [dateType]: date
      }));
    }
  };
  
  // Inverser les périodes
  const handleSwapPeriods = () => {
    const temp = period1;
    setPeriod1(period2);
    setPeriod2(temp);
  };
  
  // Exporter en PDF
  const handleExportPDF = async () => {
    try {
      const element = document.getElementById('comparison-container');
      if (!element) return;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`comparaison_${format(new Date(), 'yyyyMMdd')}.pdf`);
      
    } catch (error) {
      console.error('Erreur lors de l\'exportation en PDF:', error);
    }
  };
  
  // Calculer la différence en pourcentage entre deux valeurs
  const calculateDifference = (value1, value2) => {
    if (value1 === 0 && value2 === 0) return 0;
    if (value1 === 0) return 100; // Si la première valeur est 0, on considère une augmentation de 100%
    
    return ((value2 - value1) / Math.abs(value1)) * 100;
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/periodcomparison"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
  };
  
  // Générer le résumé des différences
  const getDifferenceSummary = () => {
    if (!periodData.period1 || !periodData.period2) return null;
    
    const { period1: p1, period2: p2 } = periodData;
    
    return [
      {
        metric: 'distance',
        label: 'Distance totale',
        value1: p1.totalDistance,
        value2: p2.totalDistance,
        unit: 'km',
        difference: calculateDifference(p1.totalDistance, p2.totalDistance),
        format: (val) => formatDistance(val, false)
      },
      {
        metric: 'duration',
        label: 'Durée totale',
        value1: p1.totalDuration,
        value2: p2.totalDuration,
        unit: 'h',
        difference: calculateDifference(p1.totalDuration / 3600, p2.totalDuration / 3600),
        format: (val) => formatDuration(val, 'short')
      },
      {
        metric: 'elevation',
        label: 'Dénivelé total',
        value1: p1.totalElevation,
        value2: p2.totalElevation,
        unit: 'm',
        difference: calculateDifference(p1.totalElevation, p2.totalElevation),
        format: (val) => val.toLocaleString()
      },
      {
        metric: 'activitiesCount',
        label: 'Nombre de sorties',
        value1: p1.activitiesCount,
        value2: p2.activitiesCount,
        unit: '',
        difference: calculateDifference(p1.activitiesCount, p2.activitiesCount),
        format: (val) => val
      },
      {
        metric: 'averageSpeed',
        label: 'Vitesse moyenne',
        value1: p1.averageSpeed,
        value2: p2.averageSpeed,
        unit: 'km/h',
        difference: calculateDifference(p1.averageSpeed, p2.averageSpeed),
        format: (val) => val.toFixed(1)
      },
      {
        metric: 'calories',
        label: 'Calories brûlées',
        value1: p1.calories,
        value2: p2.calories,
        unit: 'kcal',
        difference: calculateDifference(p1.calories, p2.calories),
        format: (val) => val.toLocaleString()
      }
    ];
  };
  
  // Vérifier si les dates sont valides
  const arePeriodsValid = () => {
    return (
      period1.start &&
      period1.end &&
      period2.start &&
      period2.end &&
      period1.start <= period1.end &&
      period2.start <= period2.end
    );
  };
  
  // Obtenir l'icône de tendance
  const getTrendIcon = (difference) => {
    if (difference > 5) return <TrendingUp color="success" />;
    if (difference < -5) return <TrendingDown color="error" />;
    return <TrendingFlat color="action" />;
  };
  
  return (
    <Box sx={{ ...sx }} id="comparison-container">
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" component="h3">
            Comparaison de périodes
            <Tooltip title="Comparez vos performances entre différentes périodes d'entraînement">
              <IconButton size="small" sx={{ ml: 1, mt: -0.5 }}>
                <InfoOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          </Typography>
          
          <Box>
            <Tooltip title="Exporter en PDF">
              <IconButton 
                size="small" 
                onClick={handleExportPDF}
                disabled={loading || !periodData.period1 || !periodData.period2}
                sx={{ mr: 1 }}
              >
                <Print fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Télécharger les données (CSV)">
              <IconButton 
                size="small" 
                disabled={loading || !periodData.period1 || !periodData.period2}
              >
                <FileDownload fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="period-type-select-label">Type de comparaison</InputLabel>
              <Select
                labelId="period-type-select-label"
                id="period-type-select"
                value={periodType}
                label="Type de comparaison"
                onChange={handlePeriodTypeChange}
              >
                {periodTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <DatePicker
                  label={`${period1.label} début`}
                  value={period1.start}
                  onChange={(date) => handleDateChange('period1', 'start', date)}
                  disabled={periodType !== 'custom'}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
                <DatePicker
                  label={`${period1.label} fin`}
                  value={period1.end}
                  onChange={(date) => handleDateChange('period1', 'end', date)}
                  disabled={periodType !== 'custom'}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Box>
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={12} md={1} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Tooltip title="Inverser les périodes">
              <IconButton 
                onClick={handleSwapPeriods} 
                disabled={periodType !== 'custom' || loading}
              >
                <SwapHoriz />
              </IconButton>
            </Tooltip>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <DatePicker
                  label={`${period2.label} début`}
                  value={period2.start}
                  onChange={(date) => handleDateChange('period2', 'start', date)}
                  disabled={periodType !== 'custom'}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
                <DatePicker
                  label={`${period2.label} fin`}
                  value={period2.end}
                  onChange={(date) => handleDateChange('period2', 'end', date)}
                  disabled={periodType !== 'custom'}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Box>
            </LocalizationProvider>
          </Grid>
        </Grid>
        
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant="contained" 
            startIcon={<CompareArrows />}
            onClick={fetchComparisonData}
            disabled={!arePeriodsValid() || loading}
          >
            Comparer
          </Button>
        </Box>
      </Paper>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : !periodData.period1 || !periodData.period2 ? (
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 3, 
            textAlign: 'center',
            borderStyle: 'dashed',
            borderColor: theme.palette.divider
          }}
        >
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Sélectionnez deux périodes à comparer et cliquez sur "Comparer"
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Résumé de la comparaison */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Résumé de la comparaison
            </Typography>
            
            <Grid container spacing={2}>
              {getDifferenceSummary().map((item) => (
                <Grid item xs={12} sm={6} md={4} lg={2} key={item.metric}>
                  <MetricComparisonCard
                    label={item.label}
                    value1={item.format(item.value1)}
                    value2={item.format(item.value2)}
                    unit={item.unit}
                    difference={item.difference}
                    period1Label={period1.label}
                    period2Label={period2.label}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
          
          {/* Visualisations de comparaison */}
          <ComparisonCharts
            periodData={periodData}
            period1={period1}
            period2={period2}
          />
          
          {/* Liste des activités par période */}
          <Paper variant="outlined" sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Activités par période
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  {period1.label} ({format(period1.start, 'dd/MM/yyyy')} - {format(period1.end, 'dd/MM/yyyy')})
                </Typography>
                {periodData.period1.activities.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Aucune activité pour cette période
                  </Typography>
                ) : (
                  <List dense>
                    {periodData.period1.activities.map(activity => (
                      <ListItem 
                        key={activity.id}
                        sx={{ 
                          bgcolor: 'background.neutral',
                          mb: 1,
                          borderRadius: 1
                        }}
                      >
                        <ListItemText
                          primary={activity.title}
                          secondary={
                            <React.Fragment>
                              {format(new Date(activity.date), 'dd/MM/yyyy')} • {formatDistance(activity.distance)} • {formatDuration(activity.duration, 'short')}
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  {period2.label} ({format(period2.start, 'dd/MM/yyyy')} - {format(period2.end, 'dd/MM/yyyy')})
                </Typography>
                {periodData.period2.activities.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Aucune activité pour cette période
                  </Typography>
                ) : (
                  <List dense>
                    {periodData.period2.activities.map(activity => (
                      <ListItem 
                        key={activity.id}
                        sx={{ 
                          bgcolor: 'background.neutral',
                          mb: 1,
                          borderRadius: 1
                        }}
                      >
                        <ListItemText
                          primary={activity.title}
                          secondary={
                            <React.Fragment>
                              {format(new Date(activity.date), 'dd/MM/yyyy')} • {formatDistance(activity.distance)} • {formatDuration(activity.duration, 'short')}
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Grid>
            </Grid>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default PeriodComparison;
