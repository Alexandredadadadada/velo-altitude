import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Card,
  CardContent,
  Grid,
  Zoom,
  Button,
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
  BarElement,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';
import zoomPlugin from 'chartjs-plugin-zoom';
import { motion, AnimatePresence } from 'framer-motion';

// Icons
import TerrainIcon from '@mui/icons-material/Terrain';
import LandscapeIcon from '@mui/icons-material/Landscape';
import OpacityIcon from '@mui/icons-material/Opacity';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import WarningIcon from '@mui/icons-material/Warning';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestoreIcon from '@mui/icons-material/Restore';
import FilterAltIcon from '@mui/icons-material/FilterAlt';

// Enregistrer les composants nécessaires pour Chart.js
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

// Palette de couleurs pour les points d'intérêt
const poiColors = {
  viewpoint: '#f59e0b', // Ambre
  water: '#0ea5e9',     // Bleu ciel
  rest: '#10b981',      // Émeraude
  steep: '#ef4444',     // Rouge
  info: '#8b5cf6',      // Violet
  photo: '#ec4899',     // Rose
};

// Types de points d'intérêt avec leurs icônes
const poiTypes = {
  viewpoint: { 
    icon: <LandscapeIcon />, 
    label: 'Point de vue',
    color: poiColors.viewpoint,
    description: 'Panorama exceptionnel'
  },
  water: { 
    icon: <OpacityIcon />, 
    label: 'Point d\'eau',
    color: poiColors.water,
    description: 'Source ou fontaine'
  },
  rest: { 
    icon: <LocalCafeIcon />, 
    label: 'Aire de repos',
    color: poiColors.rest,
    description: 'Zone de repos ou café'
  },
  steep: { 
    icon: <WarningIcon />, 
    label: 'Section difficile',
    color: poiColors.steep,
    description: 'Pente supérieure à 10%'
  },
  info: { 
    icon: <InfoOutlinedIcon />, 
    label: 'Information',
    color: poiColors.info,
    description: 'Point d\'intérêt historique ou culturel'
  },
  photo: { 
    icon: <PhotoCameraIcon />, 
    label: 'Spot photo',
    color: poiColors.photo,
    description: 'Lieu idéal pour prendre des photos'
  },
};

// Palette de couleurs pour les zones de difficulté
const difficultyColors = {
  easy: '#4ade80',      // Vert
  moderate: '#facc15',  // Jaune
  hard: '#fb923c',      // Orange
  extreme: '#ef4444',   // Rouge
};

// Seuils de pente pour les niveaux de difficulté
const gradientThresholds = {
  easy: 4,       // 0-4%
  moderate: 7,   // 4-7%
  hard: 10,      // 7-10%
  extreme: 100,  // >10%
};

// Fonction pour déterminer la couleur en fonction de la pente
const getGradientColor = (gradient) => {
  if (gradient < gradientThresholds.easy) return difficultyColors.easy;
  if (gradient < gradientThresholds.moderate) return difficultyColors.moderate;
  if (gradient < gradientThresholds.hard) return difficultyColors.hard;
  return difficultyColors.extreme;
};

/**
 * Composant pour afficher un profil d'élévation interactif avec points d'intérêt cliquables
 */
const ElevationProfileChart = ({ 
  colData, 
  isComparison = false,
  comparisonDatasets = null,
  colors = null,
  onSelectCol = null,
  activeCol = null
}) => {
  const theme = useTheme();
  const chartRef = useRef(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [poiFilterType, setPoiFilterType] = useState(null);
  const [zoomedSection, setZoomedSection] = useState(null);
  const [showGradientLegend, setShowGradientLegend] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);

  // Préparer les options du graphique
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: isComparison,
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 6,
          boxHeight: 6,
          padding: 20,
          font: {
            family: theme.typography.fontFamily,
            size: 12,
          },
          color: theme.palette.text.secondary,
        },
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true
          },
          mode: 'x',
        },
        limits: {
          x: {min: 'original', max: 'original'},
        }
      },
      annotation: {
        annotations: generateGradientZones()
      },
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: alpha(theme.palette.divider, 0.05),
          drawBorder: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            family: theme.typography.fontFamily,
            size: 11,
          },
          maxRotation: 0,
        },
        title: {
          display: true,
          text: 'Distance (km)',
          color: theme.palette.text.secondary,
          font: {
            family: theme.typography.fontFamily,
            size: 12,
            weight: 'normal',
          },
          padding: { top: 10 },
        },
      },
      y: {
        grid: {
          display: true,
          color: alpha(theme.palette.divider, 0.1),
          drawBorder: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            family: theme.typography.fontFamily,
            size: 11,
          },
          callback: (value) => `${value} m`,
        },
        title: {
          display: true,
          text: 'Altitude (m)',
          color: theme.palette.text.secondary,
          font: {
            family: theme.typography.fontFamily,
            size: 12,
            weight: 'normal',
          },
          padding: { bottom: 10 },
        },
      },
    },
    onClick: (event, elements) => {
      if (elements && elements.length) {
        const { datasetIndex, index } = elements[0];
        const dataset = chartRef.current.data.datasets[datasetIndex];
        const distance = dataset.distances[index];
        
        // Vérifier s'il y a un point d'intérêt à cette position
        const poi = dataset.pointsOfInterest?.find(p => 
          Math.abs(p.distance - distance) < dataset.colInfo.length / 50
        );
        
        if (poi) {
          // Si le même POI est cliqué à nouveau, le désélectionner
          if (selectedPoi && selectedPoi.id === poi.id) {
            setSelectedPoi(null);
          } else {
            setSelectedPoi({
              ...poi,
              col: dataset.colInfo,
              distance,
              elevation: dataset.data[index],
              color: dataset.borderColor
            });
          }
        } else if (isComparison && onSelectCol) {
          // Sélectionner le col pour plus de détails en mode comparaison
          onSelectCol(dataset.colInfo);
        }
      } else {
        // Clic en dehors d'un point, fermer les détails
        setSelectedPoi(null);
      }
    },
    onHover: (event, elements) => {
      if (elements && elements.length) {
        const { datasetIndex, index } = elements[0];
        const dataset = chartRef.current.data.datasets[datasetIndex];
        const distance = dataset.distances[index];
        const elevation = dataset.data[index];
        
        // Vérifier s'il y a un point d'intérêt à cette position
        const poi = dataset.pointsOfInterest?.find(poi => 
          Math.abs(poi.distance - distance) < dataset.colInfo.length / 50
        );
        
        setHoveredPoint({
          col: dataset.colInfo,
          distance,
          elevation,
          poi,
          color: dataset.borderColor
        });
      } else {
        setHoveredPoint(null);
      }
    }
  };

  // Générer les données pour un col unique
  const generateSingleColData = () => {
    const col = colData;
    if (!col) return null;

    // Points d'intérêt pour ce col
    const poiForCol = col.pointsOfInterest || generateMockPointsOfInterest(col);
    
    // Filtrer les points d'intérêt si un filtre est actif
    const filteredPoi = poiFilterType 
      ? poiForCol.filter(poi => poi.type === poiFilterType)
      : poiForCol;

    // Génération des points de distance
    const numPoints = 50;
    const distanceStep = col.length / numPoints;
    const distancePoints = Array.from({ length: numPoints + 1 }, (_, i) => +(i * distanceStep).toFixed(2));
    
    // Calcul du profil d'élévation simulé
    const startElevation = col.altitude - (col.length * col.averageGradient * 10);
    let prevElevation = startElevation;
    
    const elevationPoints = distancePoints.map((distance, i) => {
      const progress = distance / col.length;
      const linearElevation = startElevation + (col.altitude - startElevation) * progress;
      
      // Ajouter des variations pour un profil plus naturel
      const variation = Math.sin(i * 0.8) * (30 + Math.random() * 50) * (col.difficulty / 3);
      const elevation = Math.max(prevElevation, linearElevation + variation);
      prevElevation = elevation;
      
      return Math.round(elevation);
    });

    const primaryColor = theme.palette.primary;
    
    return {
      labels: distancePoints.map(d => d.toFixed(1)),
      datasets: [
        {
          label: col.name,
          data: elevationPoints,
          borderColor: primaryColor.main,
          backgroundColor: alpha(primaryColor.main, 0.2),
          fill: true,
          borderWidth: 2,
          pointRadius: (ctx) => {
            // Augmenter le rayon pour les points d'intérêt
            const index = ctx.dataIndex;
            const distance = distancePoints[index];
            const hasPointOfInterest = filteredPoi.some(poi => 
              Math.abs(poi.distance - distance) < col.length / numPoints
            );

            return hasPointOfInterest ? 6 : 0;
          },
          pointBackgroundColor: (ctx) => {
            const index = ctx.dataIndex;
            const distance = distancePoints[index];
            
            // Trouver le point d'intérêt correspondant
            const poi = filteredPoi.find(poi => 
              Math.abs(poi.distance - distance) < col.length / numPoints
            );
            
            if (!poi) return primaryColor.main;
            
            // Couleurs différentes selon le type de point d'intérêt
            return poiColors[poi.type] || primaryColor.main;
          },
          pointHoverRadius: 8,
          pointHoverBackgroundColor: primaryColor.dark,
          pointHoverBorderColor: 'white',
          pointHoverBorderWidth: 2,
          tension: 0.4,
          pointHitRadius: 15, // Zone élargie pour la détection des interactions
          distances: distancePoints,
          pointsOfInterest: filteredPoi,
          colInfo: col
        }
      ]
    };
  };

  // Utiliser les données de comparaison ou générer des données pour un seul col
  useEffect(() => {
    if (isComparison && comparisonDatasets) {
      setChartData(comparisonDatasets);
    } else if (colData) {
      setChartData(generateSingleColData());
    }
  }, [colData, isComparison, comparisonDatasets, poiFilterType]);

  // Générer des points d'intérêt fictifs pour les démonstrations
  const generateMockPointsOfInterest = (col) => {
    const numPoi = 3 + Math.floor(Math.random() * 4); // 3 à 6 points d'intérêt
    const poiTypes = ['viewpoint', 'water', 'rest', 'steep', 'info', 'photo'];
    const pois = [];
    
    for (let i = 0; i < numPoi; i++) {
      // Éviter les points trop proches du début et de la fin
      const minDistance = col.length * 0.15;
      const maxDistance = col.length * 0.85;
      const distance = minDistance + Math.random() * (maxDistance - minDistance);
      
      const type = poiTypes[Math.floor(Math.random() * poiTypes.length)];
      const poiNames = {
        viewpoint: ['Panorama du sommet', 'Vue sur la vallée', 'Belvédère des Alpes'],
        water: ['Source alpine', 'Fontaine du col', 'Point d\'eau'],
        rest: ['Refuge du cycliste', 'Café du sommet', 'Aire de repos'],
        steep: ['Rampe à 14%', 'Section difficile', 'Virage en épingle'],
        info: ['Monument historique', 'Borne kilométrique', 'Site géologique'],
        photo: ['Spot photo', 'Cadre panoramique', 'Vue imprenable'],
      };
      
      pois.push({
        id: `poi-${col.id}-${i}`,
        type,
        name: poiNames[type][Math.floor(Math.random() * poiNames[type].length)],
        distance: parseFloat(distance.toFixed(2)),
        description: `Point d'intérêt à ${distance.toFixed(1)} km du départ.${
          type === 'steep' ? ` Pente moyenne de ${(10 + Math.random() * 5).toFixed(1)}% sur 500m.` : ''
        }`,
        images: type === 'viewpoint' || type === 'photo' ? [
          {
            url: `/images/cols/poi/${col.id}-${i}.jpg`,
            alt: `Vue depuis le col ${col.name}`,
            credit: 'Velo-Altitude'
          }
        ] : []
      });
    }
    
    // Trier par distance
    return pois.sort((a, b) => a.distance - b.distance);
  };

  // Générer les données pour le graphique du gradient
  const generateGradientData = () => {
    if (!colData || !colData.gradientData) return null;
    
    return {
      labels: colData.gradientData.map((_, i) => i),
      datasets: [{
        label: 'Pente (%)',
        data: colData.gradientData,
        backgroundColor: colData.gradientData.map(gradient => getGradientColor(gradient)),
        borderColor: 'transparent',
        barPercentage: 1,
        categoryPercentage: 1,
        borderRadius: 0,
      }]
    };
  };

  // Réinitialiser le zoom
  const resetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
      setZoomedSection(null);
    }
  };

  // Zoomer sur une section spécifique
  const zoomToSection = (start, end) => {
    if (chartRef.current) {
      chartRef.current.zoom({
        scaleX: {
          left: start,
          right: end,
        }
      });
      setZoomedSection({ start, end });
    }
  };

  // Filtrer par niveau de difficulté
  const filterByDifficulty = (difficulty) => {
    if (selectedDifficulty === difficulty) {
      setSelectedDifficulty(null); 
      resetZoom();
      return;
    }
    
    setSelectedDifficulty(difficulty);
    
    if (!colData || !colData.gradientData) return;
    
    // Trouver les sections correspondant à la difficulté sélectionnée
    const sections = [];
    let currentStart = null;
    
    colData.gradientData.forEach((gradient, index) => {
      const matchesDifficulty = 
        difficulty === 'easy' ? gradient < gradientThresholds.easy :
        difficulty === 'moderate' ? gradient >= gradientThresholds.easy && gradient < gradientThresholds.moderate :
        difficulty === 'hard' ? gradient >= gradientThresholds.moderate && gradient < gradientThresholds.hard :
        gradient >= gradientThresholds.hard;
      
      if (matchesDifficulty && currentStart === null) {
        currentStart = index;
      } else if (!matchesDifficulty && currentStart !== null) {
        sections.push({ start: currentStart, end: index - 1 });
        currentStart = null;
      }
    });
    
    if (currentStart !== null) {
      sections.push({ start: currentStart, end: colData.gradientData.length - 1 });
    }
    
    // S'il y a des sections, zoomer sur la première
    if (sections.length > 0) {
      const longestSection = sections.reduce(
        (max, section) => (section.end - section.start > max.end - max.start) ? section : max, 
        sections[0]
      );
      
      // Ajouter une marge pour la visibilité
      const padding = Math.max(5, Math.floor((longestSection.end - longestSection.start) * 0.1));
      zoomToSection(
        Math.max(0, longestSection.start - padding),
        Math.min(colData.gradientData.length - 1, longestSection.end + padding)
      );
    }
  };

  // Générer les zones de gradient pour les annotations
  const generateGradientZones = () => {
    if (!colData || !colData.gradientData) return {};
    
    const annotations = {};
    let currentType = null;
    let startIndex = 0;
    
    colData.gradientData.forEach((gradient, index) => {
      let type = 
        gradient < gradientThresholds.easy ? 'easy' :
        gradient < gradientThresholds.moderate ? 'moderate' :
        gradient < gradientThresholds.hard ? 'hard' : 'extreme';
      
      if (type !== currentType) {
        if (currentType !== null) {
          annotations[`gradient-${startIndex}`] = {
            type: 'box',
            xMin: startIndex,
            xMax: index - 1,
            backgroundColor: alpha(difficultyColors[currentType], 0.2),
            borderColor: difficultyColors[currentType],
            borderWidth: 0,
            drawTime: 'beforeDatasetsDraw',
          };
        }
        currentType = type;
        startIndex = index;
      }
    });
    
    // Ajouter la dernière section
    if (currentType !== null) {
      annotations[`gradient-${startIndex}`] = {
        type: 'box',
        xMin: startIndex,
        xMax: colData.gradientData.length - 1,
        backgroundColor: alpha(difficultyColors[currentType], 0.2),
        borderColor: difficultyColors[currentType],
        borderWidth: 0,
        drawTime: 'beforeDatasetsDraw',
      };
    }
    
    return annotations;
  };

  // Gérer le filtrage des points d'intérêt par type
  const handlePoiFilterChange = (type) => {
    setPoiFilterType(poiFilterType === type ? null : type);
    // Fermer les détails du POI sélectionné si le filtre change
    if (selectedPoi && selectedPoi.type !== type && type !== null) {
      setSelectedPoi(null);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Filtres pour les points d'intérêt */}
      <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {Object.entries(poiTypes).map(([type, data]) => (
          <Chip
            key={type}
            icon={
              <Box sx={{ 
                color: poiFilterType === type ? 'inherit' : data.color,
                display: 'flex',
                alignItems: 'center'
              }}>
                {data.icon}
              </Box>
            }
            label={data.label}
            onClick={() => handlePoiFilterChange(type)}
            clickable
            variant={poiFilterType === type ? 'filled' : 'outlined'}
            color={poiFilterType === type ? 'primary' : 'default'}
            sx={{
              borderColor: alpha(data.color, 0.5),
              color: poiFilterType === type ? 'white' : theme.palette.text.primary,
              '&:hover': {
                backgroundColor: poiFilterType === type 
                  ? theme.palette.primary.main 
                  : alpha(data.color, 0.1),
              },
              transition: 'all 0.2s ease'
            }}
          />
        ))}
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2,
          height: '100%',
          flexGrow: 1,
          minHeight: 300,
          position: 'relative',
          background: theme => alpha(theme.palette.background.paper, 0.6),
          backdropFilter: 'blur(10px)',
          border: '1px solid',
          borderColor: theme => alpha(theme.palette.divider, 0.1),
        }}
      >
        <Box sx={{ 
          height: '100%', 
          position: 'relative',
          ...(selectedPoi && { opacity: 0.7 })
        }}>
          {chartData ? (
            <Line ref={chartRef} data={chartData} options={chartOptions} />
          ) : (
            <Box sx={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Typography variant="subtitle2" color="text.secondary">
                Chargement du profil d'élévation...
              </Typography>
            </Box>
          )}
        </Box>

        {/* Overlay pour afficher le point survolé */}
        <AnimatePresence>
          {hoveredPoint && !selectedPoi && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                right: 16,
                zIndex: 10,
                pointerEvents: 'none'
              }}
            >
              <Paper
                elevation={3}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.background.paper, 0.95),
                  backdropFilter: 'blur(10px)',
                  borderLeft: '4px solid',
                  borderColor: hoveredPoint.color || theme.palette.primary.main,
                  maxWidth: 'max-content'
                }}
              >
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  {hoveredPoint.col.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TerrainIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
                    <Typography variant="body2" fontWeight={500}>
                      {hoveredPoint.elevation} m
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ArrowDropUpIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
                    <Typography variant="body2" fontWeight={500}>
                      {hoveredPoint.distance} km
                    </Typography>
                  </Box>
                </Box>
                
                {hoveredPoint.poi && (
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                    <Box 
                      sx={{ 
                        mr: 1, 
                        color: poiColors[hoveredPoint.poi.type] || theme.palette.primary.main,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {poiTypes[hoveredPoint.poi.type]?.icon || <InfoOutlinedIcon />}
                    </Box>
                    <Typography variant="body2" fontWeight={500}>
                      {hoveredPoint.poi.name}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contrôles de zoom */}
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 10,
            display: 'flex',
            gap: 1,
          }}
        >
          <Tooltip title="Filtrer les points d'intérêt">
            <IconButton
              size="small"
              onClick={() => setPoiFilterType(prev => prev ? null : 'viewpoint')}
              sx={{
                bgcolor: theme.palette.background.paper,
                boxShadow: 1,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              <FilterAltIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Zoom avant">
            <IconButton
              size="small"
              onClick={() => chartRef.current && chartRef.current.zoom({step: 0.2})}
              sx={{
                bgcolor: theme.palette.background.paper,
                boxShadow: 1,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Zoom arrière">
            <IconButton
              size="small"
              onClick={() => chartRef.current && chartRef.current.zoom({step: -0.2})}
              sx={{
                bgcolor: theme.palette.background.paper,
                boxShadow: 1,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              <ZoomOutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Réinitialiser le zoom">
            <IconButton
              size="small"
              onClick={resetZoom}
              disabled={!zoomedSection}
              sx={{
                bgcolor: theme.palette.background.paper,
                boxShadow: 1,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                },
                opacity: zoomedSection ? 1 : 0.5,
              }}
            >
              <RestoreIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Légende des niveaux de difficulté */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            zIndex: 10,
            p: 1,
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            borderRadius: 1,
            boxShadow: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
          }}
        >
          <Typography variant="caption" fontWeight={600} sx={{ mb: 0.5 }}>
            Niveaux de difficulté
          </Typography>
          
          {Object.keys(difficultyColors).map(difficulty => (
            <Box 
              key={difficulty}
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                cursor: 'pointer',
                p: 0.5,
                borderRadius: 1,
                bgcolor: selectedDifficulty === difficulty ? alpha(difficultyColors[difficulty], 0.2) : 'transparent',
                '&:hover': {
                  bgcolor: alpha(difficultyColors[difficulty], 0.1),
                }
              }}
              onClick={() => filterByDifficulty(difficulty)}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: difficultyColors[difficulty],
                  mr: 1,
                }}
              />
              <Typography variant="caption">
                {difficulty === 'easy' ? '0-4%' : 
                 difficulty === 'moderate' ? '4-7%' :
                 difficulty === 'hard' ? '7-10%' : '>10%'}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Filtre des points d'intérêt */}
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 10,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.5,
          }}
        >
          {Object.entries(poiTypes).map(([type, { label, color }]) => (
            <Chip
              key={type}
              label={label}
              size="small"
              icon={React.cloneElement(poiTypes[type].icon, { style: { color: 'inherit' } })}
              onClick={() => handlePoiFilterChange(type)}
              sx={{
                bgcolor: poiFilterType === type ? alpha(color, 0.2) : theme.palette.background.paper,
                borderColor: poiFilterType === type ? color : 'transparent',
                color: poiFilterType === type ? color : theme.palette.text.primary,
                border: '1px solid',
                '&:hover': {
                  bgcolor: alpha(color, 0.1),
                },
                transition: 'all 0.2s ease',
              }}
            />
          ))}
          
          {poiFilterType && (
            <Chip
              label="Réinitialiser"
              size="small"
              onClick={() => setPoiFilterType(null)}
              sx={{
                bgcolor: theme.palette.background.paper,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                },
              }}
            />
          )}
        </Box>

        {/* Panneau de détails pour les points d'intérêt sélectionnés */}
        <AnimatePresence>
          {selectedPoi && (
            <Zoom in={true} timeout={300}>
              <Card
                elevation={4}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: { xs: '90%', sm: '70%', md: '50%' },
                  maxWidth: 500,
                  maxHeight: '80%',
                  overflow: 'auto',
                  borderRadius: 3,
                  zIndex: 20,
                  bgcolor: 'background.paper',
                  boxShadow: theme => `0 8px 32px ${alpha(theme.palette.common.black, 0.2)}`
                }}
              >
                <Box sx={{ 
                  position: 'relative', 
                  bgcolor: poiColors[selectedPoi.type] || theme.palette.primary.main,
                  color: 'white',
                  p: 2,
                  pr: 6
                }}>
                  <IconButton
                    size="small"
                    onClick={() => setSelectedPoi(null)}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      color: 'white',
                      bgcolor: alpha('#fff', 0.2),
                      '&:hover': {
                        bgcolor: alpha('#fff', 0.3),
                      }
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {poiTypes[selectedPoi.type]?.icon || <InfoOutlinedIcon />}
                    <Typography variant="subtitle1" fontWeight={600} sx={{ ml: 1 }}>
                      {poiTypes[selectedPoi.type]?.label || 'Point d\'intérêt'}
                    </Typography>
                  </Box>

                  <Typography variant="h6" fontWeight={700}>
                    {selectedPoi.name}
                  </Typography>
                  
                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TerrainIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.8 }} />
                      <Typography variant="body2" fontWeight={500}>
                        Alt. {selectedPoi.elevation} m
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ArrowDropUpIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.8 }} />
                      <Typography variant="body2" fontWeight={500}>
                        {selectedPoi.distance} km du départ
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <CardContent>
                  <Typography variant="body1" paragraph>
                    {selectedPoi.description || poiTypes[selectedPoi.type]?.description || 'Information sur ce point d\'intérêt.'}
                  </Typography>

                  {selectedPoi.images && selectedPoi.images.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Photos
                      </Typography>
                      <Grid container spacing={1}>
                        {selectedPoi.images.map((img, idx) => (
                          <Grid item xs={12} sm={6} key={idx}>
                            <Box
                              component="img"
                              src={img.url || '/images/cols/default-poi.jpg'}
                              alt={img.alt || 'Point d\'intérêt'}
                              sx={{
                                width: '100%',
                                borderRadius: 1,
                                height: 140,
                                objectFit: 'cover',
                              }}
                            />
                            {img.credit && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                {img.credit}
                              </Typography>
                            )}
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                      onClick={() => setSelectedPoi(null)} 
                      variant="outlined"
                      size="small"
                    >
                      Fermer
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Zoom>
          )}
        </AnimatePresence>
      </Paper>
    </Box>
  );
};

export default ElevationProfileChart;
