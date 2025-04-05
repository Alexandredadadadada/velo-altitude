import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  useTheme, 
  alpha 
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';
import { motion } from 'framer-motion';
import { prepareChartDataInWorker } from '../../../utils/OptimizedVisualizationLoader';

// Enregistrer les composants Chart.js pour l'optimisation
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * Composant de graphique de zones d'entraînement optimisé pour les performances
 * Utilise Web Workers pour les calculs intensifs et React.memo pour minimiser les re-rendus
 */
const OptimizedZoneChart = React.memo(({ 
  trainingZones = [], 
  userProfile = {}, 
  workoutData = [],
  timeRange = '30days',
  height = 300,
  animated = true 
}) => {
  const theme = useTheme();
  const chartRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);

  // Configuration du graphique
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: animated ? { duration: 2000, easing: 'easeOutQuart' } : false,
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          font: {
            family: theme.typography.fontFamily,
            size: 11
          },
          color: theme.palette.text.secondary
        }
      },
      y: {
        min: 0,
        max: userProfile.ftp ? userProfile.ftp * 1.5 : 300,
        grid: {
          color: alpha(theme.palette.divider, 0.1),
          drawBorder: false
        },
        ticks: {
          font: {
            family: theme.typography.fontFamily,
            size: 11
          },
          color: theme.palette.text.secondary,
          callback: (value) => `${value}w`
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: {
            family: theme.typography.fontFamily,
            size: 12
          },
          color: theme.palette.text.primary,
          usePointStyle: true,
          boxWidth: 8
        }
      },
      tooltip: {
        backgroundColor: alpha(theme.palette.background.paper, 0.9),
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 12,
        bodyFont: {
          family: theme.typography.fontFamily
        },
        titleFont: {
          family: theme.typography.fontFamily,
          weight: 'bold'
        },
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value} watts`;
          }
        }
      }
    }
  };

  // Préparation des données via Web Worker pour délester le thread principal
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    
    // Préparation des données à envoyer au worker
    const rawData = {
      zones: trainingZones,
      ftp: userProfile.ftp || 250,
      workouts: workoutData,
      timeRange,
      theme: {
        mode: theme.palette.mode,
        primary: theme.palette.primary.main,
        secondary: theme.palette.secondary.main,
        success: theme.palette.success.main,
        warning: theme.palette.warning.main,
        error: theme.palette.error.main
      }
    };

    // Fonction qui sera exécutée dans le Web Worker
    const prepareData = async () => {
      try {
        // Déléguer le traitement au worker
        const processedData = await prepareChartDataInWorker(rawData);
        
        if (isMounted) {
          setChartData(processedData);
          setLoading(false);
        }
      } catch (err) {
        console.error("Erreur lors du traitement des données:", err);
        if (isMounted) {
          setError("Impossible de traiter les données du graphique");
          setLoading(false);
        }
      }
    };

    // En cas d'absence de Web Worker (ou pour le développement), simuler des données
    const simulateData = () => {
      const ftp = userProfile.ftp || 250;
      
      // Créer des données simulées pour le graphique
      const labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'];
      
      // Générer les zones d'entraînement pour le graphique
      const zones = trainingZones.map(zone => ({
        label: `Zone ${zone.id} (${zone.min}-${zone.max}w)`,
        data: labels.map(() => {
          // Simuler une progression réaliste des valeurs selon la zone
          const base = zone.id === 4 ? ftp : (zone.min + zone.max) / 2;
          const variance = base * 0.1; // +/- 10% de variation
          return base + (Math.random() * variance * 2 - variance);
        }),
        borderColor: zone.color,
        backgroundColor: alpha(zone.color, 0.1),
        borderWidth: 2,
        tension: 0.4,
        fill: false,
        pointRadius: 3,
        pointHoverRadius: 6
      }));
      
      // Ajouter la FTP comme série de référence
      zones.push({
        label: 'FTP',
        data: labels.map((_, index) => {
          // Simuler une progression de FTP dans le temps
          const progression = index / (labels.length - 1) * 0.05; // +5% sur la période
          return ftp * (1 + progression);
        }),
        borderColor: theme.palette.primary.main,
        backgroundColor: 'transparent',
        borderWidth: 3,
        borderDash: [5, 5],
        tension: 0.1,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0
      });
      
      return {
        labels,
        datasets: zones
      };
    };

    // Lancer le traitement en arrière-plan ou utiliser des données simulées pour le développement
    if (process.env.NODE_ENV === 'development' || !window.Worker) {
      // En développement, utiliser des données simulées pour éviter la surcharge
      setTimeout(() => {
        if (isMounted) {
          setChartData(simulateData());
          setLoading(false);
        }
      }, 600);
    } else {
      prepareData();
    }

    return () => {
      isMounted = false;
    };
  }, [trainingZones, userProfile, workoutData, timeRange, theme]);

  // Afficher un loader pendant le chargement
  if (loading) {
    return (
      <Box 
        sx={{ 
          height, 
          width: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: alpha(theme.palette.background.paper, 0.4),
          borderRadius: 2
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Chargement des données...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Afficher un message d'erreur si nécessaire
  if (error) {
    return (
      <Box 
        sx={{ 
          height, 
          width: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: alpha(theme.palette.error.main, 0.05),
          borderRadius: 2,
          p: 3
        }}
      >
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  // Rendu du graphique avec animation
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ height, width: '100%' }}
    >
      <Line ref={chartRef} options={options} data={chartData} height={height} />
    </motion.div>
  );
});

export default OptimizedZoneChart;
