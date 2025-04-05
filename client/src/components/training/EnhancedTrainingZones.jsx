import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Tabs, 
  Tab, 
  Chip, 
  Divider,
  IconButton,
  Button,
  Tooltip,
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material';
import { 
  FitnessCenter, 
  Speed, 
  Timeline, 
  Anchor, 
  TrendingUp,
  DirectionsBike,
  FilterVintage,
  LocalFireDepartment,
  ElectricBolt,
  Info,
  StackedLineChart,
  CompareArrows
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import Chart from 'chart.js/auto';
import { Line, Bar, Radar, Pie } from 'react-chartjs-2';
import { PolarArea } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';
import ZoneDistributionChart from './charts/ZoneDistributionChart';
import ZonePowerComparisonChart from './charts/ZonePowerComparisonChart';
import ZoneGuideCard from './cards/ZoneGuideCard';
import ExerciseAnimation from './animations/ExerciseAnimation';
import PhysiologicalEffectsVisualizer from './animations/PhysiologicalEffectsVisualizer';

// Enregistrer le plugin d'annotation
Chart.register(annotationPlugin);

/**
 * Composant de visualisation avancée des zones d'entraînement
 * Fournit des graphiques interactifs et des guides visuels pour les différentes intensités d'entraînement
 */
const EnhancedTrainingZones = ({ userProfile = {}, workouts = [] }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedZone, setSelectedZone] = useState(null);
  const [zoneData, setZoneData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState('6months'); // 'week', 'month', '3months', '6months', 'year'
  const [compareMode, setCompareMode] = useState(false);
  const [viewMode, setViewMode] = useState('detailed');

  // Définition des zones d'entraînement
  const ftp = userProfile.ftp || 250;
  const trainingZones = [
    { 
      id: 1, 
      name: 'Zone 1 - Récupération active', 
      min: 0, 
      max: Math.round(ftp * 0.55), 
      color: '#4caf50',
      icon: <DirectionsBike />,
      description: 'Récupération active, très facile. Conversation normale possible.',
      benefits: ['Récupération', 'Circulation', 'Endurance de base'],
      exampleWorkouts: ['Récupération après effort intense', 'Sorties longues à faible intensité'],
      physiologicalAdaptations: ['Amélioration de la circulation sanguine', 'Élimination des déchets métaboliques']
    },
    { 
      id: 2, 
      name: 'Zone 2 - Endurance', 
      min: Math.round(ftp * 0.56), 
      max: Math.round(ftp * 0.75), 
      color: '#8bc34a',
      icon: <Anchor />,
      description: 'Endurance fondamentale. Conversation encore facile mais respiration plus profonde.',
      benefits: ['Endurance aérobie', 'Utilisation des graisses', 'Adaptation cardiovasculaire'],
      exampleWorkouts: ['Sorties longues (2-5h)', 'Entraînement à faible intensité'],
      physiologicalAdaptations: ['Augmentation des mitochondries', 'Développement des capillaires']
    },
    { 
      id: 3, 
      name: 'Zone 3 - Tempo', 
      min: Math.round(ftp * 0.76), 
      max: Math.round(ftp * 0.90), 
      color: '#ffeb3b',
      icon: <TrendingUp />,
      description: 'Rythme modéré à soutenu. Conversation devient difficile.',
      benefits: ['Amélioration du seuil lactique', 'Endurance musculaire', 'Économie d\'effort'],
      exampleWorkouts: ['Intervals tempo (10-20min)', 'Montées à rythme régulier'],
      physiologicalAdaptations: ['Tolérance accrue au lactate', 'Adaptation cardiaque']
    },
    { 
      id: 4, 
      name: 'Zone 4 - Seuil lactique', 
      min: Math.round(ftp * 0.91), 
      max: Math.round(ftp * 1.05), 
      color: '#ff9800',
      icon: <LocalFireDepartment />,
      description: 'Effort intense. Conversation très limitée, courtes phrases seulement.',
      benefits: ['Augmentation du seuil lactique', 'Capacité à maintenir haute intensité'],
      exampleWorkouts: ['Intervals au seuil (5-20min)', 'Test FTP'],
      physiologicalAdaptations: ['Élévation du seuil lactique', 'Adaptation musculaire et métabolique']
    },
    { 
      id: 5, 
      name: 'Zone 5 - VO2 Max', 
      min: Math.round(ftp * 1.06), 
      max: Math.round(ftp * 1.20), 
      color: '#f44336',
      icon: <FilterVintage />,
      description: 'Très intense. Communication minimale, respiration très difficile.',
      benefits: ['Amélioration VO2 Max', 'Capacité cardio', 'Tolérance au lactate'],
      exampleWorkouts: ['Intervals courts (1-5min)', 'Répétitions de côtes'],
      physiologicalAdaptations: ['Augmentation VO2 Max', 'Adaptations cardiovasculaires']
    },
    { 
      id: 6, 
      name: 'Zone 6 - Capacité anaérobie', 
      min: Math.round(ftp * 1.21), 
      max: Math.round(ftp * 1.50), 
      color: '#9c27b0',
      icon: <Speed />,
      description: 'Sprint et efforts anaérobies. Conversation impossible.',
      benefits: ['Puissance anaérobie', 'Explosivité', 'Tolérance à l\'acide lactique'],
      exampleWorkouts: ['Sprint courts (30s-2min)', 'Intervals Tabata'],
      physiologicalAdaptations: ['Augmentation des enzymes anaérobies', 'Adaptations des fibres rapides']
    },
    { 
      id: 7, 
      name: 'Zone 7 - Sprint neuromuscular', 
      min: Math.round(ftp * 1.51), 
      max: Math.round(ftp * 2.50), 
      color: '#3f51b5',
      icon: <ElectricBolt />,
      description: 'Puissance maximale et explosivité. Très court.',
      benefits: ['Force maximale', 'Recrutement neuromusculaire', 'Coordination'],
      exampleWorkouts: ['Sprints courts (5-15s)', 'Départs arrêtés'],
      physiologicalAdaptations: ['Recrutement des fibres musculaires', 'Amélioration nerveuse']
    },
  ];
  
  // Simulation des données de distribution de zones
  const generateRandomZoneDistribution = () => {
    const total = 100;
    let remaining = total;
    const distribution = [];
    
    // Générer des valeurs aléatoires pour chaque zone
    for (let i = 0; i < trainingZones.length - 1; i++) {
      const value = i === 0 ? Math.round(Math.random() * 10) + 5 :
                   i === 1 ? Math.round(Math.random() * 20) + 30 :
                   i === 2 ? Math.round(Math.random() * 15) + 10 :
                   Math.round(Math.random() * 10) + 5;
      
      const actualValue = Math.min(value, remaining);
      distribution.push(actualValue);
      remaining -= actualValue;
    }
    
    // Allouer le reste à la dernière zone
    distribution.push(remaining);
    
    return distribution;
  };
  
  // Charger les données initiales
  useEffect(() => {
    setLoading(true);
    
    // Simuler un chargement de données
    setTimeout(() => {
      // Générer des données pour les différentes périodes
      const zoneDistributions = {
        week: generateRandomZoneDistribution(),
        month: generateRandomZoneDistribution(),
        '3months': generateRandomZoneDistribution(),
        '6months': generateRandomZoneDistribution(),
        year: generateRandomZoneDistribution()
      };
      
      setZoneData(zoneDistributions);
      setLoading(false);
    }, 1000);
  }, [userProfile.id]);
  
  // Gérer le changement d'onglet
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Sélectionner une zone pour plus de détails
  const handleZoneSelect = (zone) => {
    setSelectedZone(zone === selectedZone ? null : zone);
  };
  
  // Changer la période d'affichage
  const handleTimeFrameChange = (value) => {
    setTimeFrame(value);
  };
  
  // Activer/désactiver le mode de comparaison
  const toggleCompareMode = () => {
    setCompareMode(!compareMode);
  };
  
  // Rendu de la visualisation principale des zones
  const renderZoneVisualization = () => {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 2,
              bgcolor: alpha(theme.palette.background.paper, 0.7)
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                Zones d'Entraînement
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip 
                  icon={<DirectionsBike sx={{ fontSize: '1rem' }} />}
                  label={`FTP: ${ftp} watts`}
                  sx={{ 
                    mr: 1.5,
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
                <Tooltip title={compareMode ? "Désactiver la comparaison" : "Activer la comparaison de puissance"}>
                  <IconButton 
                    size="small"
                    onClick={toggleCompareMode}
                    color={compareMode ? "primary" : "default"}
                    sx={{ 
                      border: 1, 
                      borderColor: compareMode ? 'primary.main' : 'divider',
                      p: 1
                    }}
                  >
                    <CompareArrows />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            
            <Box sx={{ position: 'relative', height: 400, mb: 3 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`chart-${compareMode}`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.5 }}
                    style={{ height: '100%', width: '100%' }}
                  >
                    {compareMode ? (
                      <ZonePowerComparisonChart ftp={ftp} trainingZones={trainingZones} />
                    ) : (
                      <Box 
                        component={motion.div}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        sx={{ 
                          height: '100%', 
                          width: '100%',
                          backgroundImage: `linear-gradient(90deg, 
                            ${trainingZones.map(zone => zone.color).join(', ')})`,
                          borderRadius: 2,
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        {trainingZones.map((zone, index) => {
                          const width = ((zone.max - zone.min) / (ftp * 1.5)) * 100;
                          const left = (zone.min / (ftp * 1.5)) * 100;
                          
                          return (
                            <Tooltip
                              key={zone.id}
                              title={
                                <Box sx={{ p: 1 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                    {zone.name}
                                  </Typography>
                                  <Typography variant="body2">
                                    {zone.min} - {zone.max} watts
                                  </Typography>
                                </Box>
                              }
                              arrow
                              placement="top"
                            >
                              <Box
                                component={motion.div}
                                whileHover={{ 
                                  y: -10,
                                  boxShadow: "0 10px 15px rgba(0,0,0,0.1)"
                                }}
                                onClick={() => handleZoneSelect(zone)}
                                sx={{
                                  position: 'absolute',
                                  bottom: 0,
                                  height: (80 + (zone.id * 20)) + '%',
                                  width: `${width}%`,
                                  left: `${left}%`,
                                  bgcolor: zone.color,
                                  cursor: 'pointer',
                                  borderTopLeftRadius: 8,
                                  borderTopRightRadius: 8,
                                  transition: 'all 0.3s ease-in-out',
                                  display: 'flex',
                                  alignItems: 'flex-end',
                                  justifyContent: 'center',
                                  p: 1,
                                  boxSizing: 'border-box',
                                  border: selectedZone?.id === zone.id ? '3px solid white' : 'none',
                                  boxShadow: selectedZone?.id === zone.id ? '0 0 15px rgba(255,255,255,0.7)' : 'none',
                                  '&:hover': {
                                    filter: 'brightness(1.1)',
                                  }
                                }}
                              >
                                <Typography 
                                  variant="body2"
                                  sx={{ 
                                    color: 'white', 
                                    fontWeight: 'bold',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                                  }}
                                >
                                  Z{zone.id}
                                </Typography>
                              </Box>
                            </Tooltip>
                          );
                        })}
                        
                        {/* FTP marker */}
                        <Box
                          component={motion.div}
                          animate={{ 
                            y: [0, -5, 0], 
                            opacity: [0.7, 1, 0.7] 
                          }}
                          transition={{ 
                            repeat: Infinity, 
                            duration: 2 
                          }}
                          sx={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            width: 2,
                            left: `${(ftp / (ftp * 1.5)) * 100}%`,
                            bgcolor: 'white',
                            zIndex: 2,
                            boxShadow: '0 0 10px rgba(255,255,255,0.8)'
                          }}
                        />
                        <Tooltip
                          title="FTP (Puissance Seuil Fonctionnelle)"
                          placement="top"
                          arrow
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              position: 'absolute',
                              bottom: -25,
                              left: `${(ftp / (ftp * 1.5)) * 100}%`,
                              transform: 'translateX(-50%)',
                              bgcolor: 'background.paper',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              fontWeight: 'bold',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          >
                            FTP
                          </Typography>
                        </Tooltip>
                      </Box>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </Box>
            
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                flexWrap: 'wrap',
                gap: 1
              }}
            >
              {['week', 'month', '3months', '6months', 'year'].map((value) => (
                <Chip
                  key={value}
                  label={value === 'week' ? '7 jours' :
                         value === 'month' ? '30 jours' :
                         value === '3months' ? '3 mois' :
                         value === '6months' ? '6 mois' : '1 an'}
                  variant={timeFrame === value ? "filled" : "outlined"}
                  color={timeFrame === value ? "primary" : "default"}
                  onClick={() => handleTimeFrameChange(value)}
                  sx={{ 
                    '&:hover': { 
                      bgcolor: timeFrame === value ? 'primary.main' : alpha(theme.palette.primary.main, 0.1)
                    }
                  }}
                />
              ))}
            </Box>
          </Paper>
          
          {/* Sélecteur de zones amélioré */}
          <Paper 
            elevation={0} 
            sx={{ 
              mt: 3, 
              p: 3, 
              borderRadius: 2,
              bgcolor: alpha(theme.palette.background.paper, 0.7)
            }}
          >
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Explorer les Zones
            </Typography>
            
            <Box 
              sx={{ 
                display: 'flex',
                flexDirection: 'row',
                overflowX: 'auto',
                py: 1,
                gap: 2,
                scrollbarWidth: 'thin',
                '&::-webkit-scrollbar': {
                  height: 6,
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: alpha(theme.palette.grey[300], 0.3),
                  borderRadius: 3,
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: theme.palette.grey[400],
                  borderRadius: 3,
                  '&:hover': {
                    backgroundColor: theme.palette.grey[500],
                  }
                }
              }}
            >
              {trainingZones.map((zone) => (
                <Box
                  key={zone.id}
                  component={motion.div}
                  whileHover={{ y: -5 }}
                  onClick={() => handleZoneSelect(zone)}
                  sx={{
                    flexShrink: 0,
                    width: 120,
                    height: 80,
                    borderRadius: 2,
                    bgcolor: selectedZone?.id === zone.id ? zone.color : alpha(zone.color, 0.2),
                    color: selectedZone?.id === zone.id ? 'white' : 'text.primary',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: `2px solid ${selectedZone?.id === zone.id ? 'white' : 'transparent'}`,
                    boxShadow: selectedZone?.id === zone.id ? `0 0 15px ${alpha(zone.color, 0.6)}` : 'none',
                    p: 1,
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                    Z{zone.id}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    {zone.min}-{zone.max}w
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
          
          {/* Distribution des zones */}
          <Paper 
            elevation={0} 
            sx={{ 
              mt: 3, 
              p: 3, 
              borderRadius: 2,
              bgcolor: alpha(theme.palette.background.paper, 0.7)
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Distribution du Temps par Zone
              </Typography>
              <Tooltip title="Basé sur vos derniers entraînements">
                <IconButton size="small">
                  <Info sx={{ fontSize: '1.2rem' }} />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Box sx={{ height: 250 }}>
              <ZoneDistributionChart zoneData={zoneData} trainingZones={trainingZones} />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} lg={4}>
          {/* Détails de la zone sélectionnée */}
          <AnimatePresence mode="wait">
            {selectedZone ? (
              <motion.div
                key={selectedZone.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
              >
                <ZoneGuideCard zone={selectedZone} userProfile={userProfile} />
                
                {/* Nouveau composant de visualisation physiologique */}
                <PhysiologicalEffectsVisualizer zone={selectedZone} />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.background.paper, 0.7),
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 300
                  }}
                >
                  <Box 
                    component={motion.div}
                    animate={{ 
                      y: [0, -10, 0],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ 
                      repeat: Infinity,
                      duration: 2,
                      ease: "easeInOut"
                    }}
                    sx={{ 
                      mb: 2, 
                      display: 'flex',
                      justifyContent: 'center'
                    }}
                  >
                    <Timeline sx={{ fontSize: '4rem', color: 'primary.main', opacity: 0.8 }} />
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
                    Sélectionnez une zone
                  </Typography>
                  <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
                    Cliquez sur une zone d'entraînement pour voir ses détails, 
                    exercices recommandés et impacts physiologiques.
                  </Typography>
                </Paper>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Conseils dynamiques */}
          <Paper 
            elevation={0} 
            sx={{ 
              mt: 3, 
              p: 3, 
              borderRadius: 2,
              bgcolor: alpha(theme.palette.background.paper, 0.7)
            }}
          >
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Conseils d'Entraînement
            </Typography>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedZone ? selectedZone.id : 'default'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {selectedZone ? (
                  <>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" paragraph>
                        {selectedZone.id <= 2 
                          ? "Privilégiez les sorties longues à intensité contrôlée. Idéal pour développer l'endurance aérobie et l'économie énergétique."
                          : selectedZone.id <= 4
                            ? "Ces zones améliorent le seuil lactique et l'endurance spécifique. Dosez les efforts pour éviter la fatigue excessive."
                            : "Les entraînements à haute intensité sont efficaces mais exigeants. Prévoyez des récupérations adéquates entre les séances."}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedZone.benefits.map((benefit, index) => (
                        <Chip 
                          key={index}
                          label={benefit}
                          size="small"
                          sx={{ 
                            bgcolor: alpha(selectedZone.color, 0.1),
                            borderColor: selectedZone.color,
                            color: 'text.primary',
                            '& .MuiChip-label': { px: 1 }
                          }}
                        />
                      ))}
                    </Box>
                  </>
                ) : (
                  <Typography color="text.secondary">
                    Pour des conseils personnalisés, sélectionnez une zone d'entraînement spécifique.
                  </Typography>
                )}
              </motion.div>
            </AnimatePresence>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  // Rendu des exercices spécifiques pour chaque zone
  const renderExercises = () => {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.background.paper, 0.7)
            }}
          >
            <Typography variant="h6" gutterBottom>
              Exercices spécifiques par zone
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Visualisez les animations des exercices clés pour chaque zone d'intensité. Ces exercices vous aideront à développer les adaptations physiologiques spécifiques à chaque zone d'entraînement.
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Tabs
                value={selectedZone ? selectedZone.id - 1 : 0}
                onChange={(e, value) => setSelectedZone(trainingZones[value])}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="zones d'entraînement"
                sx={{
                  mb: 3,
                  '& .MuiTab-root': {
                    minHeight: 'unset',
                    py: 1,
                    px: 2,
                    minWidth: 'unset',
                    textTransform: 'none',
                    borderRadius: '20px',
                    mx: 0.5
                  }
                }}
              >
                {trainingZones.map((zone) => (
                  <Tab 
                    key={zone.id}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            width: 12, 
                            height: 12, 
                            borderRadius: '50%', 
                            bgcolor: zone.color,
                            mr: 1
                          }} 
                        />
                        <Typography variant="body2">Zone {zone.id}</Typography>
                      </Box>
                    }
                    sx={{
                      bgcolor: selectedZone?.id === zone.id 
                        ? alpha(zone.color, 0.15) 
                        : 'transparent',
                      color: selectedZone?.id === zone.id 
                        ? theme.palette.getContrastText(alpha(zone.color, 0.15))
                        : 'text.primary',
                      '&.Mui-selected': {
                        color: theme.palette.getContrastText(alpha(zone.color, 0.15))
                      }
                    }}
                  />
                ))}
              </Tabs>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedZone ? selectedZone.id : 'default'}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {selectedZone ? (
                    <ExerciseAnimation 
                      zone={selectedZone}
                      ftp={ftp}
                    />
                  ) : (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Typography color="text.secondary">
                        Sélectionnez une zone pour voir les exercices spécifiques
                      </Typography>
                    </Box>
                  )}
                </motion.div>
              </AnimatePresence>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    );
  };
  
  // Rendu du composant principal
  return (
    <Box sx={{ width: '100%' }}>
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 2,
          overflow: 'hidden',
          mb: 3,
          bgcolor: alpha(theme.palette.background.paper, 0.7)
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="training zones tabs"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '0.9rem',
              py: 1.5,
              minHeight: 'unset'
            }
          }}
        >
          <Tab 
            label="Visualisation des zones" 
            icon={<Timeline sx={{ fontSize: '1.2rem' }} />} 
            iconPosition="start"
          />
          <Tab 
            label="Exercices spécifiques" 
            icon={<FitnessCenter sx={{ fontSize: '1.2rem' }} />} 
            iconPosition="start"
          />
        </Tabs>
      </Paper>
      
      <Box sx={{ p: 0 }}>
        {activeTab === 0 && renderZoneVisualization()}
        {activeTab === 1 && renderExercises()}
      </Box>
    </Box>
  );
};

export default EnhancedTrainingZones;
