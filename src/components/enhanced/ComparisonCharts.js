import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  Tabs,
  Tab,
  useTheme
} from '@mui/material';
import { 
  ShowChart,
  BarChart as BarChartIcon,
  DonutLarge,
  RadioButtonChecked,
  CalendarMonth,
  Speed,
  Timer
} from '@mui/icons-material';
import { Bar, Line, Radar, Doughnut } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatDistance, formatDuration } from '../../utils/formatters';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

/**
 * Composant affichant différentes visualisations pour comparer deux périodes d'entraînement
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.periodData - Données des deux périodes (period1, period2)
 * @param {Object} props.period1 - Informations sur la première période (dates et libellé)
 * @param {Object} props.period2 - Informations sur la deuxième période (dates et libellé)
 */
const ComparisonCharts = ({ periodData, period1, period2 }) => {
  const theme = useTheme();
  
  // États pour les options d'affichage
  const [activeTab, setActiveTab] = useState(0);
  const [chartType, setChartType] = useState('bar');
  
  // Gérer le changement d'onglet
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Gérer le changement de type de graphique
  const handleChartTypeChange = (event, newValue) => {
    if (newValue !== null) {
      setChartType(newValue);
    }
  };
  
  // Préparer les données pour le graphique de distance quotidienne
  const prepareDailyDistanceData = () => {
    if (!periodData.period1 || !periodData.period2) return null;
    
    // Créer un dictionnaire des distances par jour pour chaque période
    const dailyDistance1 = {};
    const dailyDistance2 = {};
    
    // Ajouter les activités de la période 1
    periodData.period1.activities.forEach(activity => {
      const date = format(new Date(activity.date), 'yyyy-MM-dd');
      dailyDistance1[date] = (dailyDistance1[date] || 0) + activity.distance;
    });
    
    // Ajouter les activités de la période 2
    periodData.period2.activities.forEach(activity => {
      const date = format(new Date(activity.date), 'yyyy-MM-dd');
      dailyDistance2[date] = (dailyDistance2[date] || 0) + activity.distance;
    });
    
    // Trouver toutes les dates uniques dans les deux périodes
    const allDates = [...new Set([
      ...Object.keys(dailyDistance1),
      ...Object.keys(dailyDistance2)
    ])].sort();
    
    // Normaliser les données pour l'affichage sur le graphique
    // Nous voulons représenter les jours par "jour 1", "jour 2", etc. plutôt que par dates réelles
    // pour pouvoir comparer des périodes différentes
    const labels = Array.from({ length: Math.max(allDates.length, 30) }, (_, i) => `Jour ${i + 1}`);
    
    // Extraire les distances pour la période 1
    const distances1 = Array(labels.length).fill(0);
    Object.entries(dailyDistance1).forEach(([date, distance], index) => {
      if (index < labels.length) {
        distances1[index] = distance;
      }
    });
    
    // Extraire les distances pour la période 2
    const distances2 = Array(labels.length).fill(0);
    Object.entries(dailyDistance2).forEach(([date, distance], index) => {
      if (index < labels.length) {
        distances2[index] = distance;
      }
    });
    
    return {
      labels,
      datasets: [
        {
          label: period1.label,
          data: distances1,
          backgroundColor: theme.palette.primary.main,
          borderColor: theme.palette.primary.main,
          borderWidth: 1,
          barPercentage: 0.6,
          categoryPercentage: 0.8
        },
        {
          label: period2.label,
          data: distances2,
          backgroundColor: theme.palette.secondary.main,
          borderColor: theme.palette.secondary.main,
          borderWidth: 1,
          barPercentage: 0.6,
          categoryPercentage: 0.8
        }
      ]
    };
  };
  
  // Préparer les données pour le graphique d'intensité par semaine
  const prepareWeeklyIntensityData = () => {
    if (!periodData.period1 || !periodData.period2) return null;
    
    // Calculer l'intensité hebdomadaire pour chaque période
    const weeklyIntensity1 = calculateWeeklyIntensity(periodData.period1.activities);
    const weeklyIntensity2 = calculateWeeklyIntensity(periodData.period2.activities);
    
    // Normaliser pour avoir le même nombre de semaines
    const maxWeeks = Math.max(
      Object.keys(weeklyIntensity1).length,
      Object.keys(weeklyIntensity2).length
    );
    
    const labels = Array.from({ length: maxWeeks }, (_, i) => `Semaine ${i + 1}`);
    
    // Extraire les intensités
    const intensity1 = Array(labels.length).fill(0);
    Object.values(weeklyIntensity1).forEach((intensity, index) => {
      if (index < labels.length) {
        intensity1[index] = intensity.averageIntensity;
      }
    });
    
    const intensity2 = Array(labels.length).fill(0);
    Object.values(weeklyIntensity2).forEach((intensity, index) => {
      if (index < labels.length) {
        intensity2[index] = intensity.averageIntensity;
      }
    });
    
    return {
      labels,
      datasets: [
        {
          label: period1.label,
          data: intensity1,
          backgroundColor: theme.palette.primary.main,
          borderColor: theme.palette.primary.main,
          borderWidth: 1,
          fill: false,
          tension: 0.4
        },
        {
          label: period2.label,
          data: intensity2,
          backgroundColor: theme.palette.secondary.main,
          borderColor: theme.palette.secondary.main,
          borderWidth: 1,
          fill: false,
          tension: 0.4
        }
      ]
    };
  };
  
  // Calculer l'intensité hebdomadaire des activités
  const calculateWeeklyIntensity = (activities) => {
    const weeklyData = {};
    
    activities.forEach(activity => {
      const date = new Date(activity.date);
      const weekNumber = getWeekNumber(date);
      const weekKey = `${date.getFullYear()}-${weekNumber}`;
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          activities: [],
          totalDistance: 0,
          totalDuration: 0,
          totalIntensity: 0,
          averageIntensity: 0
        };
      }
      
      // Calculer l'intensité de l'activité en fonction de plusieurs facteurs
      const speedFactor = activity.average_speed / 25; // Normalisé à 25 km/h
      const heartRateFactor = activity.average_heart_rate ? activity.average_heart_rate / 180 : 0.5; // Normalisé à 180 bpm
      const elevationFactor = activity.elevation_gain ? (activity.elevation_gain / activity.distance) / 20 : 0; // m/km, normalisé à 20m/km
      
      const activityIntensity = (speedFactor * 0.3) + (heartRateFactor * 0.5) + (elevationFactor * 0.2);
      const normalizedIntensity = Math.min(1, activityIntensity) * 10; // Sur une échelle de 0 à 10
      
      weeklyData[weekKey].activities.push(activity);
      weeklyData[weekKey].totalDistance += activity.distance;
      weeklyData[weekKey].totalDuration += activity.duration;
      weeklyData[weekKey].totalIntensity += normalizedIntensity;
    });
    
    // Calculer l'intensité moyenne pour chaque semaine
    Object.keys(weeklyData).forEach(week => {
      const data = weeklyData[week];
      data.averageIntensity = data.activities.length > 0
        ? data.totalIntensity / data.activities.length
        : 0;
    });
    
    return weeklyData;
  };
  
  // Obtenir le numéro de semaine d'une date
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };
  
  // Préparer les données pour le graphique radar des capacités
  const prepareCapabilitiesData = () => {
    if (!periodData.period1 || !periodData.period2) return null;
    
    // Calculer les scores pour différentes métriques (0-100)
    const { period1: p1, period2: p2 } = periodData;
    
    const enduranceScore1 = Math.min(100, p1.totalDistance / 5);
    const speedScore1 = Math.min(100, p1.averageSpeed * 3);
    const climbingScore1 = Math.min(100, p1.totalElevation / 50);
    const consistencyScore1 = Math.min(100, p1.activitiesCount * 10);
    const intensityScore1 = Math.min(100, p1.averageIntensity * 20 || 50);
    
    const enduranceScore2 = Math.min(100, p2.totalDistance / 5);
    const speedScore2 = Math.min(100, p2.averageSpeed * 3);
    const climbingScore2 = Math.min(100, p2.totalElevation / 50);
    const consistencyScore2 = Math.min(100, p2.activitiesCount * 10);
    const intensityScore2 = Math.min(100, p2.averageIntensity * 20 || 50);
    
    return {
      labels: ['Endurance', 'Vitesse', 'Grimpeur', 'Régularité', 'Intensité'],
      datasets: [
        {
          label: period1.label,
          data: [enduranceScore1, speedScore1, climbingScore1, consistencyScore1, intensityScore1],
          backgroundColor: `${theme.palette.primary.main}33`,
          borderColor: theme.palette.primary.main,
          pointBackgroundColor: theme.palette.primary.main,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: theme.palette.primary.main
        },
        {
          label: period2.label,
          data: [enduranceScore2, speedScore2, climbingScore2, consistencyScore2, intensityScore2],
          backgroundColor: `${theme.palette.secondary.main}33`,
          borderColor: theme.palette.secondary.main,
          pointBackgroundColor: theme.palette.secondary.main,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: theme.palette.secondary.main
        }
      ]
    };
  };
  
  // Préparer les données pour le graphique des types d'activités
  const prepareActivityTypesData = () => {
    if (!periodData.period1 || !periodData.period2) return null;
    
    // Compter les différents types d'activités pour chaque période
    const typeCount1 = {
      road: 0,
      mountain: 0,
      gravel: 0,
      indoor: 0,
      other: 0
    };
    
    const typeCount2 = {
      road: 0,
      mountain: 0,
      gravel: 0,
      indoor: 0,
      other: 0
    };
    
    periodData.period1.activities.forEach(activity => {
      if (typeCount1[activity.type]) {
        typeCount1[activity.type]++;
      } else {
        typeCount1.other++;
      }
    });
    
    periodData.period2.activities.forEach(activity => {
      if (typeCount2[activity.type]) {
        typeCount2[activity.type]++;
      } else {
        typeCount2.other++;
      }
    });
    
    return {
      labels: ['Route', 'VTT', 'Gravel', 'Indoor', 'Autre'],
      datasets: [
        {
          label: period1.label,
          data: [
            typeCount1.road,
            typeCount1.mountain,
            typeCount1.gravel,
            typeCount1.indoor,
            typeCount1.other
          ],
          backgroundColor: [
            theme.palette.primary.main,
            theme.palette.success.main,
            theme.palette.warning.main,
            theme.palette.info.main,
            theme.palette.grey[500]
          ]
        },
        {
          label: period2.label,
          data: [
            typeCount2.road,
            typeCount2.mountain,
            typeCount2.gravel,
            typeCount2.indoor,
            typeCount2.other
          ],
          backgroundColor: [
            theme.palette.primary.light,
            theme.palette.success.light,
            theme.palette.warning.light,
            theme.palette.info.light,
            theme.palette.grey[300]
          ]
        }
      ]
    };
  };
  
  // Options communes pour les graphiques
  const getChartOptions = (type) => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top'
        }
      }
    };
    
    if (type === 'radar') {
      return {
        ...baseOptions,
        scale: {
          ticks: {
            beginAtZero: true,
            max: 100
          }
        }
      };
    }
    
    if (type === 'doughnut') {
      return {
        ...baseOptions,
        cutout: '50%'
      };
    }
    
    return {
      ...baseOptions,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    };
  };
  
  return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/comparisoncharts"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Visualisation comparative
        </Typography>
        
        {activeTab !== 3 && ( // Pas pour le graphique des types d'activités
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={handleChartTypeChange}
            aria-label="type de graphique"
            size="small"
          >
            <ToggleButton value="bar" aria-label="barres">
              <BarChartIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="line" aria-label="ligne">
              <ShowChart fontSize="small" />
            </ToggleButton>
            {activeTab === 2 && (
              <ToggleButton value="radar" aria-label="radar">
                <RadioButtonChecked fontSize="small" />
              </ToggleButton>
            )}
          </ToggleButtonGroup>
        )}
      </Box>
      
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        <Tab icon={<CalendarMonth />} label="Distance quotidienne" iconPosition="start" />
        <Tab icon={<Speed />} label="Intensité hebdomadaire" iconPosition="start" />
        <Tab icon={<Timer />} label="Profil d'athlète" iconPosition="start" />
        <Tab icon={<DonutLarge />} label="Types d'activités" iconPosition="start" />
      </Tabs>
      
      <Box sx={{ height: 400 }}>
        {activeTab === 0 && (
          // Graphique de distance quotidienne
          <>
            {chartType === 'bar' ? (
              <Bar data={prepareDailyDistanceData()} options={getChartOptions('bar')} />
            ) : (
              <Line data={prepareDailyDistanceData()} options={getChartOptions('line')} />
            )}
          </>
        )}
        
        {activeTab === 1 && (
          // Graphique d'intensité hebdomadaire
          <>
            {chartType === 'bar' ? (
              <Bar data={prepareWeeklyIntensityData()} options={getChartOptions('bar')} />
            ) : (
              <Line data={prepareWeeklyIntensityData()} options={getChartOptions('line')} />
            )}
          </>
        )}
        
        {activeTab === 2 && (
          // Graphique radar des capacités
          <>
            {chartType === 'radar' ? (
              <Radar data={prepareCapabilitiesData()} options={getChartOptions('radar')} />
            ) : chartType === 'bar' ? (
              <Bar data={prepareCapabilitiesData()} options={getChartOptions('bar')} />
            ) : (
              <Line data={prepareCapabilitiesData()} options={getChartOptions('line')} />
            )}
          </>
        )}
        
        {activeTab === 3 && (
          // Graphique des types d'activités
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="subtitle1" sx={{ mb: 2, textAlign: 'center' }}>
                  {period1.label}
                </Typography>
                <Box sx={{ width: '80%', maxWidth: 300 }}>
                  <Doughnut data={{
                    labels: prepareActivityTypesData().labels,
                    datasets: [prepareActivityTypesData().datasets[0]]
                  }} options={getChartOptions('doughnut')} />
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="subtitle1" sx={{ mb: 2, textAlign: 'center' }}>
                  {period2.label}
                </Typography>
                <Box sx={{ width: '80%', maxWidth: 300 }}>
                  <Doughnut data={{
                    labels: prepareActivityTypesData().labels,
                    datasets: [prepareActivityTypesData().datasets[1]]
                  }} options={getChartOptions('doughnut')} />
                </Box>
              </Box>
            </Grid>
          </Grid>
        )}
      </Box>
      
      {/* Insights sur les différences */}
      <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="subtitle2" gutterBottom>
          Observations clés
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Box sx={{ bgcolor: 'background.neutral', p: 2, borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {activeTab === 0 ? 'Distribution des distances' : 
                 activeTab === 1 ? 'Tendance d\'intensité' :
                 activeTab === 2 ? 'Évolution du profil' : 'Variété d\'activités'}
              </Typography>
              <Typography variant="body1">
                {activeTab === 0 ? (
                  periodData.period2.totalDistance > periodData.period1.totalDistance
                    ? `Augmentation de ${((periodData.period2.totalDistance - periodData.period1.totalDistance) / periodData.period1.totalDistance * 100).toFixed(1)}% du volume d'entraînement`
                    : `Diminution de ${((periodData.period1.totalDistance - periodData.period2.totalDistance) / periodData.period1.totalDistance * 100).toFixed(1)}% du volume d'entraînement`
                ) : activeTab === 1 ? (
                  periodData.period2.averageIntensity > periodData.period1.averageIntensity
                    ? "L'intensité moyenne a augmenté dans la période récente"
                    : "L'intensité moyenne a diminué dans la période récente"
                ) : activeTab === 2 ? (
                  "Votre profil d'athlète montre des évolutions dans vos capacités"
                ) : (
                  periodData.period2.activities.length > periodData.period1.activities.length
                    ? "Plus grande variété d'activités dans la période récente"
                    : "Moins de variété d'activités dans la période récente"
                )}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ bgcolor: 'background.neutral', p: 2, borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Fréquence
              </Typography>
              <Typography variant="body1">
                {periodData.period1.activitiesCount === 0 ? "Pas d'activités dans la première période" :
                 periodData.period2.activitiesCount === 0 ? "Pas d'activités dans la seconde période" :
                 periodData.period2.activitiesCount > periodData.period1.activitiesCount
                  ? `${((periodData.period2.activitiesCount / periodData.period1.activitiesCount - 1) * 100).toFixed(0)}% d'activités en plus dans la seconde période`
                  : `${((periodData.period1.activitiesCount / periodData.period2.activitiesCount - 1) * 100).toFixed(0)}% d'activités en moins dans la seconde période`}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ bgcolor: 'background.neutral', p: 2, borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Recommandation
              </Typography>
              <Typography variant="body1">
                {activeTab === 0 ? (
                  periodData.period2.totalDistance < periodData.period1.totalDistance
                    ? "Augmentez progressivement votre volume pour retrouver votre niveau précédent"
                    : "Continuez à maintenir ce volume d'entraînement tout en surveillant votre récupération"
                ) : activeTab === 1 ? (
                  periodData.period2.averageIntensity > periodData.period1.averageIntensity * 1.2
                    ? "Intégrez plus de séances de récupération pour éviter le surentraînement"
                    : "Votre balance intensité/volume semble équilibrée"
                ) : activeTab === 2 ? (
                  "Concentrez-vous sur les aspects de votre profil qui montrent une régression"
                ) : (
                  "Diversifiez vos types d'activités pour un développement plus complet"
                )}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default ComparisonCharts;
