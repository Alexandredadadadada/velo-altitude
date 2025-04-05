import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
  alpha,
  Tooltip,
  Divider,
  IconButton,
  Zoom,
  useMediaQuery,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import LandscapeIcon from '@mui/icons-material/Landscape';
import TerrainIcon from '@mui/icons-material/Terrain';
import TuneIcon from '@mui/icons-material/Tune';
import OpacityIcon from '@mui/icons-material/Opacity';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import FlagIcon from '@mui/icons-material/Flag';
import ColWeatherForecast from '../cols/ColWeatherForecast';
import { motion, AnimatePresence } from 'framer-motion';

// Enregistrer les composants nécessaires pour Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

/**
 * Composant de comparaison visuelle des cols sélectionnés
 * Permet de comparer les profils d'élévation, statistiques et caractéristiques
 */
const CompareView = ({ selectedCols = [] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const chartRef = useRef(null);
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState('elevation');
  const [visibleCols, setVisibleCols] = useState({});
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [selectedColForDetails, setSelectedColForDetails] = useState(null);

  // Couleurs pour les différents cols
  const colColors = [
    { main: '#3b82f6', light: '#93c5fd', dark: '#1d4ed8' }, // Bleu
    { main: '#ef4444', light: '#fca5a5', dark: '#b91c1c' }, // Rouge
    { main: '#16a34a', light: '#86efac', dark: '#166534' }, // Vert
    { main: '#eab308', light: '#fde047', dark: '#a16207' }, // Jaune
    { main: '#8b5cf6', light: '#c4b5fd', dark: '#5b21b6' }, // Violet
    { main: '#ec4899', light: '#f9a8d4', dark: '#9d174d' }, // Rose
    { main: '#06b6d4', light: '#67e8f9', dark: '#0e7490' }, // Cyan
  ];

  // Points d'intérêt sur les cols (simulés)
  const pointsOfInterest = {
    // Format: colId: [{distance: km, elevation: m, type: 'viewpoint'|'water'|'rest'|'steep', name: 'Description'}]
    1: [
      { distance: 2.5, elevation: 850, type: 'viewpoint', name: 'Panorama Vallée' },
      { distance: 5.8, elevation: 1200, type: 'water', name: 'Source d\'eau' },
      { distance: 8.2, elevation: 1550, type: 'steep', name: 'Section à 12%' }
    ],
    2: [
      { distance: 3.1, elevation: 920, type: 'rest', name: 'Aire de repos' },
      { distance: 7.5, elevation: 1480, type: 'viewpoint', name: 'Vue sur les Alpes' }
    ],
    3: [
      { distance: 4.2, elevation: 1100, type: 'steep', name: 'Passage difficile 15%' },
      { distance: 9.0, elevation: 1750, type: 'viewpoint', name: 'Vue panoramique' }
    ]
    // Autres points d'intérêt pour d'autres cols...
  };

  // Initialiser l'état de visibilité des cols
  useEffect(() => {
    const initialVisible = {};
    selectedCols.forEach((col) => {
      initialVisible[col.id] = true;
    });
    setVisibleCols(initialVisible);
    setAnimationComplete(false);

    // Réinitialiser après un court délai pour déclencher l'animation
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [selectedCols]);

  // Gestionnaire pour le changement d'onglet
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Gestionnaire pour le changement de mode de visualisation
  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
      // Réinitialiser l'animation pour le nouveau mode
      setAnimationComplete(false);
      setTimeout(() => {
        setAnimationComplete(true);
      }, 100);
    }
  };

  // Gestionnaire pour basculer la visibilité d'un col
  const toggleColVisibility = (colId) => {
    setVisibleCols(prev => ({
      ...prev,
      [colId]: !prev[colId]
    }));
  };

  // Afficher ou masquer tous les cols
  const toggleAllCols = (visible) => {
    const newVisibility = {};
    selectedCols.forEach(col => {
      newVisibility[col.id] = visible;
    });
    setVisibleCols(newVisibility);
  };

  // Afficher les détails d'un col 
  const showColDetails = (col) => {
    setSelectedColForDetails(col);
  };

  // Fermer les détails d'un col
  const closeColDetails = () => {
    setSelectedColForDetails(null);
  };

  // Générer les données pour le graphique d'élévation
  const generateElevationChartData = () => {
    const datasets = [];
    const visibleColsList = selectedCols.filter(col => visibleCols[col.id]);

    visibleColsList.forEach((col, index) => {
      const colorIndex = index % colColors.length;
      const color = colColors[colorIndex];

      // Nombre de points pour un profil plus détaillé
      const numPoints = 50;

      // Simulation des données d'élévation (dans une application réelle, ces données viendraient d'une API)
      const distancePoints = Array.from({ length: numPoints }, (_, i) => i * (col.length / (numPoints-1))).map(val => Math.round(val * 10) / 10);

      // Calculer un profil d'élévation simulé basé sur la longueur, l'altitude et la pente moyenne
      const startElevation = col.altitude - (col.length * col.averageGradient * 10);

      // Créer un profil plus naturel avec des variations
      let prevElevation = startElevation;
      const elevationPoints = distancePoints.map((distance, i) => {
        // Progression linéaire de base
        const progress = distance / col.length;
        const linearElevation = startElevation + (col.altitude - startElevation) * progress;

        // Ajouter des variations pour rendre le profil plus naturel
        const variation = Math.sin(i * 0.8) * (30 + Math.random() * 50) * (col.difficulty / 3);

        // Assurer une progression générale ascendante
        const elevation = Math.max(prevElevation, linearElevation + variation);
        prevElevation = elevation;

        return Math.round(elevation);
      });

      // Ajuster le dernier point pour qu'il corresponde exactement à l'altitude du col
      elevationPoints[elevationPoints.length - 1] = col.altitude;

      // Points d'intérêt pour ce col (s'ils existent)
      const poiForCol = pointsOfInterest[col.id] || [];

      datasets.push({
        label: col.name,
        data: elevationPoints,
        fill: true,
        borderColor: color.main,
        backgroundColor: `${color.main}20`,
        borderWidth: 3,
        pointRadius: (ctx) => {
          // Augmenter le rayon pour les points d'intérêt
          const index = ctx.dataIndex;
          const distance = distancePoints[index];
          const hasPointOfInterest = poiForCol.some(poi => 
            Math.abs(poi.distance - distance) < col.length / numPoints
          );

          return hasPointOfInterest ? 6 : 0;
        },
        pointBackgroundColor: (ctx) => {
          const index = ctx.dataIndex;
          const distance = distancePoints[index];

          // Trouver le point d'intérêt correspondant
          const poi = poiForCol.find(poi => 
            Math.abs(poi.distance - distance) < col.length / numPoints
          );

          if (!poi) return color.main;

          // Couleurs différentes selon le type de point d'intérêt
          switch (poi.type) {
            case 'viewpoint': return '#f59e0b'; // Ambre
            case 'water': return '#0ea5e9'; // Bleu ciel
            case 'rest': return '#10b981'; // Émeraude
            case 'steep': return '#ef4444'; // Rouge
            default: return color.main;
          }
        },
        pointHoverRadius: 8,
        pointHoverBackgroundColor: color.dark,
        pointHoverBorderColor: 'white',
        pointHoverBorderWidth: 2,
        tension: 0.4,
        pointHitRadius: 15, // Zone élargie pour la détection des interactions
        distances: distancePoints,
        pointsOfInterest: poiForCol,
        colInfo: col
      });
    });

    return {
      labels: datasets.length > 0 ? datasets[0].distances : [],
      datasets: datasets
    };
  };

  // Options pour le graphique d'élévation
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'nearest',
      intersect: false,
      axis: 'x'
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        backgroundColor: alpha(theme.palette.background.paper, 0.9),
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        cornerRadius: 8,
        titleFont: {
          weight: 'bold'
        },
        callbacks: {
          title: (items) => {
            if (!items.length) return '';
            const item = items[0];
            return `Distance: ${item.parsed.x.toFixed(1)} km`;
          },
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += `${context.parsed.y.toFixed(0)} m`;

              // Ajouter des informations sur les points d'intérêt s'il y en a un à cet endroit
              const distance = context.dataset.distances[context.dataIndex];
              const poi = context.dataset.pointsOfInterest?.find(p => 
                Math.abs(p.distance - distance) < context.dataset.colInfo.length / 50
              );

              if (poi) {
                label += `\n${poi.name}`;
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Distance (km)',
          color: theme.palette.text.secondary
        },
        grid: {
          display: true,
          color: alpha(theme.palette.divider, 0.1)
        },
        ticks: {
          color: theme.palette.text.secondary,
          maxRotation: 0
        }
      },
      y: {
        title: {
          display: true,
          text: 'Altitude (m)',
          color: theme.palette.text.secondary
        },
        grid: {
          display: true,
          color: alpha(theme.palette.divider, 0.1)
        },
        ticks: {
          color: theme.palette.text.secondary
        }
      }
    },
    animation: {
      duration: 1500,
      easing: 'easeOutQuart'
    },
    onHover: (event, elements) => {
      if (elements && elements.length) {
        const { datasetIndex, index } = elements[0];
        const dataset = chartRef.current.data.datasets[datasetIndex];
        const distance = dataset.distances[index];
        const elevation = dataset.data[index];
        const poi = dataset.pointsOfInterest?.find(p => 
          Math.abs(p.distance - distance) < dataset.colInfo.length / 50
        );

        setHoveredPoint({
          col: dataset.colInfo,
          distance,
          elevation,
          poi,
          color: colColors[datasetIndex % colColors.length]
        });
      } else {
        setHoveredPoint(null);
      }
    }
  };

  // Données pour le graphique
  const chartData = generateElevationChartData();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        background: theme => theme.palette.mode === 'dark' 
          ? alpha(theme.palette.background.paper, 0.4)
          : alpha(theme.palette.background.paper, 0.7),
        backdropFilter: 'blur(8px)',
        boxShadow: theme => theme.palette.mode === 'dark' 
          ? '0 8px 32px rgba(0,0,0,0.2)' 
          : '0 8px 32px rgba(0,0,0,0.05)',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: theme => theme.palette.mode === 'dark' 
          ? alpha(theme.palette.divider, 0.1)
          : alpha(theme.palette.divider, 0.5),
        minHeight: 450
      }}
    >
      {/* Éléments décoratifs */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.03) 0%, rgba(99,102,241,0) 70%)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* En-tête avec titre et onglets de navigation */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            mb: 3,
          }}
        >
          <Typography variant="h6" component="h2" fontWeight={600} sx={{ display: 'flex', alignItems: 'center' }}>
            <CompareArrowsIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            Comparaison des cols
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {selectedCols.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Tooltip title="Afficher tous les cols">
                  <IconButton 
                    onClick={() => toggleAllCols(true)}
                    color="primary"
                    size="small"
                    sx={{ 
                      mr: 0.5,
                      opacity: Object.values(visibleCols).every(v => v) ? 0.5 : 1 
                    }}
                  >
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Masquer tous les cols">
                  <IconButton 
                    onClick={() => toggleAllCols(false)}
                    color="primary"
                    size="small"
                    sx={{ 
                      opacity: Object.values(visibleCols).every(v => !v) ? 0.5 : 1 
                    }}
                  >
                    <VisibilityOffIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            )}

            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              size="small"
              aria-label="Mode de visualisation"
              sx={{
                '& .MuiToggleButton-root': {
                  borderRadius: 2,
                  px: 1.5,
                  py: 0.5,
                  borderColor: alpha(theme.palette.divider, 0.5),
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    }
                  }
                }
              }}
            >
              <ToggleButton value="elevation" aria-label="Profil d'élévation">
                <Tooltip title="Profil d'élévation">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ShowChartIcon fontSize="small" sx={{ mr: isMobile ? 0 : 0.5 }} />
                    {!isMobile && <Typography variant="body2">Élévation</Typography>}
                  </Box>
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="comparison" aria-label="Comparaison statistique">
                <Tooltip title="Comparaison des statistiques">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BarChartIcon fontSize="small" sx={{ mr: isMobile ? 0 : 0.5 }} />
                    {!isMobile && <Typography variant="body2">Statistiques</Typography>}
                  </Box>
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* Chips pour sélectionner les cols visibles */}
        {selectedCols.length > 0 && (
          <Box 
            sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 1,
              mb: 3 
            }}
          >
            {selectedCols.map((col, index) => {
              const colorIndex = index % colColors.length;
              const color = colColors[colorIndex];
              const isVisible = visibleCols[col.id];

              return (
                <Chip
                  key={col.id}
                  label={col.name}
                  onClick={() => toggleColVisibility(col.id)}
                  onDelete={() => showColDetails(col)}
                  deleteIcon={<TuneIcon fontSize="small" />}
                  sx={{
                    backgroundColor: isVisible 
                      ? alpha(color.main, 0.15)
                      : alpha(theme.palette.action.disabledBackground, 0.3),
                    color: isVisible ? color.dark : theme.palette.text.disabled,
                    borderRadius: '16px',
                    border: `1px solid ${isVisible ? alpha(color.main, 0.3) : 'transparent'}`,
                    '& .MuiChip-deleteIcon': {
                      color: isVisible ? color.main : theme.palette.text.disabled,
                    },
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: isVisible 
                        ? alpha(color.main, 0.25)
                        : alpha(theme.palette.action.disabledBackground, 0.5),
                    }
                  }}
                />
              );
            })}
          </Box>
        )}

        {/* Contenu principal selon le mode de visualisation */}
        <Box sx={{ minHeight: 300 }}>
          {viewMode === 'elevation' ? (
            <>
              {/* Affichage du profil d'élévation */}
              {selectedCols.length > 0 && selectedCols.some(col => visibleCols[col.id]) ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: animationComplete ? 1 : 0, 
                    y: animationComplete ? 0 : 20 
                  }}
                  transition={{ duration: 0.5 }}
                  style={{ height: 350, position: 'relative' }}
                >
                  <Line 
                    ref={chartRef}
                    data={chartData}
                    options={chartOptions}
                  />

                  {/* Infobulle pour les points d'intérêt */}
                  <AnimatePresence>
                    {hoveredPoint && hoveredPoint.poi && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          position: 'absolute',
                          bottom: 70,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          zIndex: 10
                        }}
                      >
                        <Paper
                          elevation={4}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            maxWidth: 280,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                            border: '1px solid',
                            borderColor: alpha(theme.palette.divider, 0.1),
                            backgroundColor: alpha(theme.palette.background.paper, 0.95),
                            backdropFilter: 'blur(10px)'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                            <Box
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: (() => {
                                  switch (hoveredPoint.poi.type) {
                                    case 'viewpoint': return alpha('#f59e0b', 0.2);
                                    case 'water': return alpha('#0ea5e9', 0.2);
                                    case 'rest': return alpha('#10b981', 0.2);
                                    case 'steep': return alpha('#ef4444', 0.2);
                                    default: return alpha(hoveredPoint.color.main, 0.2);
                                  }
                                })(),
                                color: (() => {
                                  switch (hoveredPoint.poi.type) {
                                    case 'viewpoint': return '#f59e0b';
                                    case 'water': return '#0ea5e9';
                                    case 'rest': return '#10b981';
                                    case 'steep': return '#ef4444';
                                    default: return hoveredPoint.color.main;
                                  }
                                })(),
                                mr: 1.5
                              }}
                            >
                              {(() => {
                                switch (hoveredPoint.poi.type) {
                                  case 'viewpoint': return <LandscapeIcon />;
                                  case 'water': return <OpacityIcon />;
                                  case 'rest': return <LocalCafeIcon />;
                                  case 'steep': return <TerrainIcon />;
                                  default: return <FlagIcon />;
                                }
                              })()}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle2" fontWeight={600}>
                                {hoveredPoint.poi.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {hoveredPoint.col.name} • {hoveredPoint.poi.distance} km • {hoveredPoint.poi.elevation} m
                              </Typography>
                            </Box>
                          </Box>

                          <Typography variant="body2">
                            {(() => {
                              switch (hoveredPoint.poi.type) {
                                case 'viewpoint': return 'Point de vue panoramique offrant une vue exceptionnelle sur le paysage environnant.';
                                case 'water': return 'Source d\'eau potable, parfaite pour refaire le plein de vos bidons.';
                                case 'rest': return 'Zone de repos équipée pour faire une pause et récupérer.';
                                case 'steep': return 'Section particulièrement raide qui demande un effort soutenu.';
                                default: return 'Point d\'intérêt sur le parcours.';
                              }
                            })()}
                          </Typography>
                        </Paper>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Légende des points d'intérêt */}
                  <Box 
                    sx={{ 
                      display: 'flex',
                      justifyContent: 'center',
                      flexWrap: 'wrap',
                      gap: 2,
                      mt: 2
                    }}
                  >
                    <Chip 
                      icon={<LandscapeIcon style={{ color: '#f59e0b' }} />} 
                      label="Point de vue" 
                      size="small"
                      sx={{ backgroundColor: alpha('#f59e0b', 0.1), color: '#b45309' }}
                    />
                    <Chip 
                      icon={<OpacityIcon style={{ color: '#0ea5e9' }} />} 
                      label="Point d'eau" 
                      size="small"
                      sx={{ backgroundColor: alpha('#0ea5e9', 0.1), color: '#0369a1' }}
                    />
                    <Chip 
                      icon={<LocalCafeIcon style={{ color: '#10b981' }} />} 
                      label="Aire de repos" 
                      size="small"
                      sx={{ backgroundColor: alpha('#10b981', 0.1), color: '#047857' }}
                    />
                    <Chip 
                      icon={<TerrainIcon style={{ color: '#ef4444' }} />} 
                      label="Section difficile" 
                      size="small"
                      sx={{ backgroundColor: alpha('#ef4444', 0.1), color: '#b91c1c' }}
                    />
                  </Box>
                </motion.div>
              ) : (
                <Box 
                  sx={{ 
                    textAlign: 'center', 
                    py: 8,
                    px: 2,
                    backgroundColor: alpha(theme.palette.background.paper, 0.5),
                    borderRadius: 2,
                    border: `1px dashed ${theme.palette.divider}`
                  }}
                >
                  <TerrainIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" gutterBottom>
                    Aucun col à comparer
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
                    Sélectionnez au moins un col dans la galerie pour visualiser son profil d'élévation
                  </Typography>
                </Box>
              )}
            </>
          ) : (
            // Contenu pour le mode de comparaison statistique
            <Box sx={{ minHeight: 300 }}>
              {selectedCols.length > 0 ? (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Grid container spacing={2}>
                    {selectedCols.map((col, index) => {
                      const colorIndex = index % colColors.length;
                      const color = colColors[colorIndex];

                      return (
                        <Grid item xs={12} sm={6} md={4} key={col.id}>
                          <motion.div variants={cardVariants}>
                            <Card
                              sx={{
                                borderTop: `4px solid ${color.main}`,
                                borderRadius: 2,
                                boxShadow: `0 6px 16px ${alpha(color.main, 0.1)}`,
                                height: '100%',
                              }}
                            >
                              <CardContent>
                                <Typography variant="h6" component="h3" gutterBottom fontWeight={600}>
                                  {col.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  {col.location?.country}{col.location?.region ? `, ${col.location.region}` : ''}
                                </Typography>

                                <Divider sx={{ my: 2 }} />

                                <Grid container spacing={1} sx={{ mb: 2 }}>
                                  <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                      Altitude
                                    </Typography>
                                    <Typography variant="subtitle1" fontWeight={600}>
                                      {col.altitude} m
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                      Longueur
                                    </Typography>
                                    <Typography variant="subtitle1" fontWeight={600}>
                                      {col.length} km
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                      Pente moyenne
                                    </Typography>
                                    <Typography variant="subtitle1" fontWeight={600}>
                                      {col.averageGradient}%
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                      Difficulté
                                    </Typography>
                                    <Box sx={{ display: 'flex', mt: 0.5 }}>
                                      {[...Array(5)].map((_, i) => (
                                        <Box
                                          key={i}
                                          sx={{
                                            width: 16,
                                            height: 6,
                                            borderRadius: 1,
                                            mr: 0.5,
                                            bgcolor: i < col.difficulty 
                                              ? color.main 
                                              : alpha(theme.palette.divider, 0.3),
                                          }}
                                        />
                                      ))}
                                    </Box>
                                  </Grid>
                                </Grid>

                                <Divider sx={{ my: 2 }} />

                                <Typography variant="body2" color="text.secondary">
                                  Dénivelé positif
                                </Typography>
                                <Typography variant="subtitle1" fontWeight={600}>
                                  {Math.round(col.length * col.averageGradient * 10)} m
                                </Typography>

                                <Box sx={{ mt: 3 }}>
                                  <ColWeatherForecast col={col} embedded={true} />
                                </Box>
                              </CardContent>
                            </Card>
                          </motion.div>
                        </Grid>
                      );
                    })}
                  </Grid>
                </motion.div>
              ) : (
                <Box 
                  sx={{ 
                    textAlign: 'center', 
                    py: 8,
                    px: 2,
                    backgroundColor: alpha(theme.palette.background.paper, 0.5),
                    borderRadius: 2,
                    border: `1px dashed ${theme.palette.divider}`
                  }}
                >
                  <CompareArrowsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" gutterBottom>
                    Aucun col à comparer
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
                    Sélectionnez au moins un col dans la galerie pour comparer ses caractéristiques
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default CompareView;
