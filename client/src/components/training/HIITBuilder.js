import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Chip,
  CircularProgress,
  Paper,
  Alert,
  IconButton,
  Tooltip,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Slider,
  Badge
} from '@mui/material';
import {
  DirectionsRun as RunIcon,
  FitnessCenter as FitnessIcon,
  Timer as TimerIcon,
  LocalFireDepartment as FireIcon,
  Favorite as HeartIcon,
  Info as InfoIcon,
  Save as SaveIcon,
  TimelapseRounded as ClockIcon,
  BoltRounded as ExpressIcon,
  Terrain as MountainIcon,
  Balance as BalanceIcon,
  ViewModule as StructuredIcon,
  FilterAlt as FilterIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useNotification } from '../common/NotificationSystem';
import { brandConfig } from '../../config/branding';
import CalorieCalculator from './CalorieCalculator';
import UserService from '../../services/UserService';

// Importer les données HIIT structurées
import { 
  hiitWorkoutsByTime, 
  hiitWorkoutsByCalories, 
  workoutBadges, 
  getAllWorkouts,
  findWorkouts,
  calculateCalories 
} from '../../data/hiitWorkouts';

/**
 * Composant de programmes HIIT spécifiques pour fitness et entraînement cycliste
 * Permet de créer et suivre des programmes d'entraînement par intervalles à haute intensité
 */
const HIITBuilder = ({ userProfile, onSaveWorkout }) => {
  const { t } = useTranslation();
  const { notify } = useNotification();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [workouts, setWorkouts] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [filterView, setFilterView] = useState('time'); // 'time' ou 'calories'
  const [filterCriteria, setFilterCriteria] = useState({
    minDuration: 0,
    maxDuration: 90,
    minCalories: 0,
    maxCalories: 1200,
    type: 'all',
    badgeType: 'all'
  });
  const [customWorkout, setCustomWorkout] = useState({
    name: '',
    description: '',
    targetSystem: 'aerobic', // aerobic, anaerobic, mixed
    duration: 30,
    intervals: []
  });
  const [currentInterval, setCurrentInterval] = useState({
    intensity: 90, // % of FTP or max heart rate
    duration: 30, // seconds
    recovery: 30, // seconds
    repetitions: 5
  });
  const [previewData, setPreviewData] = useState([]);
  
  // État pour le calculateur de calories
  const [calorieCalculatorOpen, setCalorieCalculatorOpen] = useState(false);
  const [calorieSettings, setCalorieSettings] = useState({
    weight: userProfile?.weight || 70,
    age: userProfile?.age || 35,
    gender: userProfile?.gender || 'male',
    activityLevel: userProfile?.cyclist_type === 'beginner' ? 'beginner' :
                   userProfile?.cyclist_type === 'all-rounder' ? 'recreational' :
                   userProfile?.cyclist_type === 'climber' ? 'intermediate' :
                   userProfile?.cyclist_type === 'sprinter' ? 'advanced' : 'recreational',
    ftp: userProfile?.ftp || 200,
    useCustomFTP: userProfile?.ftp ? true : false
  });
  const [personalizedCalories, setPersonalizedCalories] = useState(true);

  // Systèmes d'énergie ciblés
  const energySystems = [
    { value: 'aerobic', label: t('aerobicSystem'), color: '#4CAF50', description: t('aerobicSystemDesc') },
    { value: 'anaerobic', label: t('anaerobicSystem'), color: '#F44336', description: t('anaerobicSystemDesc') },
    { value: 'mixed', label: t('mixedSystem'), color: '#FF9800', description: t('mixedSystemDesc') },
    { value: 'neuromuscular', label: t('neuromuscularSystem'), color: '#9C27B0', description: t('neuromuscularSystemDesc') }
  ];

  // Charger les templates HIIT
  useEffect(() => {
    if (userProfile) {
      loadHIITData();
    }
  }, [userProfile]);

  // Charger toutes les données HIIT
  const loadHIITData = () => {
    setLoading(true);
    
    // Utiliser les données du fichier hiitWorkouts.js au lieu des mocks
    setWorkouts(getAllWorkouts());
    
    setLoading(false);
  };

  // Filtrer les séances HIIT selon les critères
  const getFilteredWorkouts = () => {
    return findWorkouts({
      minDuration: filterCriteria.minDuration,
      maxDuration: filterCriteria.maxDuration,
      minCalories: filterCriteria.minCalories,
      maxCalories: filterCriteria.maxCalories,
      type: filterCriteria.type !== 'all' ? filterCriteria.type : undefined,
      badgeType: filterCriteria.badgeType !== 'all' ? filterCriteria.badgeType : undefined
    });
  };

  // Gérer le changement d'onglet
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Gérer le changement de vue des filtres (temps ou calories)
  const handleFilterViewChange = (event, newView) => {
    if (newView !== null) {
      setFilterView(newView);
    }
  };

  // Gérer les changements dans les critères de filtre
  const handleFilterChange = (name, value) => {
    setFilterCriteria(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Générer un rendu pour le badge d'une séance
  const renderWorkoutBadge = (badgeType) => {
    if (!badgeType || !workoutBadges[badgeType]) return null;
    
    const badge = workoutBadges[badgeType];
    const icon = {
      'bolt': <ExpressIcon />,
      'local_fire_department': <FireIcon />,
      'terrain': <MountainIcon />,
      'watch_later': <ClockIcon />,
      'balance': <BalanceIcon />,
      'view_module': <StructuredIcon />
    }[badge.icon] || <InfoIcon />;
    
    return (
      <Chip
        icon={icon}
        label={badge.label}
        size="small"
        sx={{
          backgroundColor: badge.color,
          color: 'white',
          fontWeight: 500,
          '& .MuiChip-icon': {
            color: 'white'
          }
        }}
      />
    );
  };

  // Sélectionner une séance
  const handleSelectWorkout = (workout) => {
    setSelectedWorkout(workout);
    setActiveTab(3); // Passer à l'onglet de prévisualisation
    
    notify({
      message: t('workoutSelected', { name: workout.name }),
      severity: 'success'
    });
  };

  // Générer des intervalles simples
  const generateIntervals = (workSecs, restSecs, repetitions, intensity) => {
    const intervals = [];
    
    // Échauffement: 10 minutes en Z1-Z2
    intervals.push({
      type: 'warmup',
      duration: 600,
      intensity: 60,
      label: t('warmup')
    });
    
    // Intervalles principaux
    for (let i = 0; i < repetitions; i++) {
      intervals.push({
        type: 'work',
        duration: workSecs,
        intensity: intensity,
        label: `${t('interval')} ${i + 1}/${repetitions}`
      });
      
      intervals.push({
        type: 'rest',
        duration: restSecs,
        intensity: 50,
        label: `${t('recovery')} ${i + 1}/${repetitions}`
      });
    }
    
    // Récupération: 5 minutes en Z1
    intervals.push({
      type: 'cooldown',
      duration: 300,
      intensity: 50,
      label: t('cooldown')
    });
    
    return intervals;
  };

  // Générer des intervalles Sweet Spot (nouveau)
  const generateSweetSpotIntervals = (repetitions, workSecs, restSecs, intensity) => {
    const intervals = [];
    
    // Échauffement: 15 minutes progression Z1 à Z3
    intervals.push({
      type: 'warmup',
      duration: 900,
      intensity: 65,
      label: t('warmup'),
      progressiveIntensity: true
    });
    
    // Intervalles Sweet Spot
    for (let i = 0; i < repetitions; i++) {
      intervals.push({
        type: 'work',
        duration: workSecs,
        intensity: intensity,
        label: `${t('sweetSpotInterval')} ${i + 1}/${repetitions}`
      });
      
      intervals.push({
        type: 'rest',
        duration: restSecs,
        intensity: 55,
        label: `${t('recovery')} ${i + 1}/${repetitions}`
      });
    }
    
    // Récupération: 10 minutes en Z1
    intervals.push({
      type: 'cooldown',
      duration: 600,
      intensity: 50,
      label: t('cooldown')
    });
    
    return intervals;
  };
  
  // Générer des intervalles au seuil (nouveau)
  const generateThresholdIntervals = (repetitions, workSecs, restSecs, intensity) => {
    const intervals = [];
    
    // Échauffement: 15 minutes progression Z1 à Z3
    intervals.push({
      type: 'warmup',
      duration: 900,
      intensity: 65,
      label: t('warmup'),
      progressiveIntensity: true
    });
    
    // Intervalles au seuil
    for (let i = 0; i < repetitions; i++) {
      intervals.push({
        type: 'work',
        duration: workSecs,
        intensity: intensity,
        label: `${t('thresholdInterval')} ${i + 1}/${repetitions}`
      });
      
      intervals.push({
        type: 'rest',
        duration: restSecs,
        intensity: 55,
        label: `${t('recovery')} ${i + 1}/${repetitions}`
      });
    }
    
    // Récupération: 10 minutes en Z1
    intervals.push({
      type: 'cooldown',
      duration: 600,
      intensity: 50,
      label: t('cooldown')
    });
    
    return intervals;
  };
  
  // Générer une simulation de montée avec intensité progressive (nouveau)
  const generateClimbPyramid = () => {
    const intervals = [];
    
    // Échauffement: 15 minutes
    intervals.push({
      type: 'warmup',
      duration: 900,
      intensity: 65,
      label: t('warmup'),
      progressiveIntensity: true
    });
    
    // Phase 1: Approche de la montée (75% FTP pendant 5 min)
    intervals.push({
      type: 'work',
      duration: 300,
      intensity: 75,
      label: t('approachClimb')
    });
    
    // Phase 2: Début de montée (85% FTP pendant 5 min)
    intervals.push({
      type: 'work',
      duration: 300,
      intensity: 85,
      label: t('startClimb')
    });
    
    // Phase 3: Section raide (100% FTP pendant 3 min)
    intervals.push({
      type: 'work',
      duration: 180,
      intensity: 100,
      label: t('steepSection')
    });
    
    // Phase 4: Section très raide (110% FTP pendant 2 min)
    intervals.push({
      type: 'work',
      duration: 120,
      intensity: 110,
      label: t('verySteepSection')
    });
    
    // Phase 5: Sommet (120% FTP pendant 1 min)
    intervals.push({
      type: 'work',
      duration: 60,
      intensity: 120,
      label: t('summit')
    });
    
    // Phase 6: Récupération active (60% FTP pendant 5 min)
    intervals.push({
      type: 'rest',
      duration: 300,
      intensity: 60,
      label: t('activeRecovery')
    });
    
    // Phase 7: Deuxième montée (inverse de la première)
    intervals.push({
      type: 'work',
      duration: 60,
      intensity: 120,
      label: t('summit2')
    });
    
    intervals.push({
      type: 'work',
      duration: 120,
      intensity: 110,
      label: t('verySteepSection2')
    });
    
    intervals.push({
      type: 'work',
      duration: 180,
      intensity: 100,
      label: t('steepSection2')
    });
    
    intervals.push({
      type: 'work',
      duration: 300,
      intensity: 85,
      label: t('descentClimb')
    });
    
    // Récupération: 10 minutes en Z1
    intervals.push({
      type: 'cooldown',
      duration: 600,
      intensity: 50,
      label: t('cooldown')
    });
    
    return intervals;
  };

  // Calculer les statistiques du workout
  const calculateWorkoutStats = (intervals) => {
    if (!intervals || intervals.length === 0) {
      return {
        totalDuration: 0,
        workDuration: 0,
        restDuration: 0,
        avgIntensity: 0,
        maxIntensity: 0,
        tss: 0,
        intensityDistribution: []
      };
    }
    
    let totalDuration = 0;
    let totalWorkDuration = 0;
    let totalRestDuration = 0;
    let intensitySum = 0;
    let maxIntensity = 0;
    let workIfNormalized = 0;
    
    // Distribution de l'intensité par zones
    const zoneDistribution = {
      'Z1': 0, // Récupération (<60% FTP)
      'Z2': 0, // Endurance (60-75% FTP)
      'Z3': 0, // Tempo (76-90% FTP)
      'Z4': 0, // Seuil (91-105% FTP)
      'Z5': 0, // VO2Max (106-120% FTP)
      'Z6': 0  // Anaérobie (>120% FTP)
    };
    
    intervals.forEach(interval => {
      totalDuration += interval.duration;
      
      if (interval.type === 'work') {
        totalWorkDuration += interval.duration;
      } else if (interval.type === 'rest' || interval.type === 'cooldown') {
        totalRestDuration += interval.duration;
      }
      
      intensitySum += interval.intensity * interval.duration;
      maxIntensity = Math.max(maxIntensity, interval.intensity);
      
      // Calculer le travail normalisé (pour TSS)
      const normalizedIntensity = Math.pow(interval.intensity / 100, 4);
      workIfNormalized += normalizedIntensity * interval.duration;
      
      // Ajouter à la distribution des zones
      if (interval.intensity <= 60) {
        zoneDistribution['Z1'] += interval.duration;
      } else if (interval.intensity <= 75) {
        zoneDistribution['Z2'] += interval.duration;
      } else if (interval.intensity <= 90) {
        zoneDistribution['Z3'] += interval.duration;
      } else if (interval.intensity <= 105) {
        zoneDistribution['Z4'] += interval.duration;
      } else if (interval.intensity <= 120) {
        zoneDistribution['Z5'] += interval.duration;
      } else {
        zoneDistribution['Z6'] += interval.duration;
      }
    });
    
    const avgIntensity = intensitySum / totalDuration;
    
    // Calculer l'intensité normalisée
    const normalizedIntensity = Math.pow(workIfNormalized / totalDuration, 0.25) * 100;
    
    // Calculer le TSS
    // TSS = (sec × NP × IF) ÷ (FTP × 3600) × 100
    // Où IF = NP/FTP
    const userFTP = userProfile?.ftp || 200;
    const intensityFactor = normalizedIntensity / 100;
    const tss = Math.round((totalDuration * normalizedIntensity * intensityFactor) / (userFTP * 36));
    
    // Préparer les données pour le graphique de distribution des zones
    const intensityDistribution = Object.keys(zoneDistribution).map(zone => {
      return {
        name: zone,
        value: Math.round(zoneDistribution[zone] / 60), // Convertir en minutes
        time: formatTime(zoneDistribution[zone])
      };
    });
    
    return {
      totalDuration,
      workDuration: totalWorkDuration,
      restDuration: totalRestDuration,
      avgIntensity,
      maxIntensity,
      normalizedIntensity: Math.round(normalizedIntensity),
      tss,
      intensityDistribution
    };
  };
  
  // Formater les secondes en format MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Gérer la sauvegarde du workout
  const handleSaveWorkout = (workout) => {
    if (onSaveWorkout) {
      // Ajouter des métadonnées avant de sauvegarder
      const workoutToSave = {
        ...workout,
        id: workout.id || `custom-${Date.now()}`,
        createdAt: new Date().toISOString(),
        stats: calculateWorkoutStats(workout.intervals),
        calories: workout.caloriesBurned || calculateWorkoutStats(workout.intervals).calories
      };
      
      onSaveWorkout(workoutToSave);
      
      notify({
        message: t('workoutSaved', { name: workout.name }),
        severity: 'success'
      });
    }
  };

  // Gérer les changements des paramètres de calories
  const handleCalorieSettingsChange = (newSettings) => {
    setCalorieSettings(newSettings);
    
    // Si nous avons un utilisateur connecté, enregistrer ses préférences
    if (userProfile && userProfile.id) {
      try {
        // Dans une véritable implémentation, cela appellerait l'API pour sauvegarder les préférences
        console.log('Sauvegarde des préférences calorigènes:', newSettings);
        notify(t('caloriePreferencesSaved'), 'success');
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des préférences:', error);
        notify(t('errorSavingPreferences'), 'error');
      }
    }
    
    // Mettre à jour les calories personnalisées pour tous les workouts
    setPersonalizedCalories(true);
  };

  // Calculer les calories personnalisées pour un workout
  const getPersonalizedCalories = (workout) => {
    if (!personalizedCalories || !workout) return workout.caloriesBurned;
    
    // Calculer l'intensité totale pour cette séance
    let totalIntensity = 0;
    
    if (workout.format) {
      totalIntensity = workout.format.reduce((total, interval) => {
        const duration = interval.duration || 0;
        const intensity = interval.intensity || 0;
        const repeat = interval.repeat || 1;
        
        if (interval.recovery && interval.recoveryIntensity) {
          const recoveryEffort = interval.recovery * interval.recoveryIntensity * repeat;
          return total + (duration * intensity * repeat) + recoveryEffort;
        }
        
        return total + (duration * intensity * repeat);
      }, 0);
    }
    
    // Utiliser la fonction de calcul des calories
    return calculateCalories(
      totalIntensity, 
      calorieSettings.weight, 
      calorieSettings.ftp
    );
  };

  // Rendu des onglets
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Catalogue de séances
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('workoutCatalog')}
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    <FilterIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                    {t('filterWorkouts')}
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <ToggleButtonGroup
                        value={filterView}
                        exclusive
                        onChange={handleFilterViewChange}
                        aria-label="filter view"
                        size="small"
                        sx={{ mb: 2 }}
                      >
                        <ToggleButton value="time" aria-label="filter by time">
                          <TimerIcon fontSize="small" sx={{ mr: 1 }} />
                          {t('filterByTime')}
                        </ToggleButton>
                        <ToggleButton value="calories" aria-label="filter by calories">
                          <FireIcon fontSize="small" sx={{ mr: 1 }} />
                          {t('filterByCalories')}
                        </ToggleButton>
                      </ToggleButtonGroup>
                      
                      {filterView === 'time' ? (
                        <Box sx={{ width: '100%', px: 2 }}>
                          <Typography variant="body2" gutterBottom>
                            {t('duration')}: {filterCriteria.minDuration} - {filterCriteria.maxDuration} min
                          </Typography>
                          <Slider
                            value={[filterCriteria.minDuration, filterCriteria.maxDuration]}
                            onChange={(e, value) => {
                              handleFilterChange('minDuration', value[0]);
                              handleFilterChange('maxDuration', value[1]);
                            }}
                            valueLabelDisplay="auto"
                            min={0}
                            max={90}
                            step={5}
                          />
                        </Box>
                      ) : (
                        <Box sx={{ width: '100%', px: 2 }}>
                          <Typography variant="body2" gutterBottom>
                            {t('calories')}: {filterCriteria.minCalories} - {filterCriteria.maxCalories} kcal
                          </Typography>
                          <Slider
                            value={[filterCriteria.minCalories, filterCriteria.maxCalories]}
                            onChange={(e, value) => {
                              handleFilterChange('minCalories', value[0]);
                              handleFilterChange('maxCalories', value[1]);
                            }}
                            valueLabelDisplay="auto"
                            min={0}
                            max={1200}
                            step={100}
                          />
                        </Box>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl size="small" fullWidth sx={{ mb: 2 }}>
                        <InputLabel id="workout-type-label">{t('workoutType')}</InputLabel>
                        <Select
                          labelId="workout-type-label"
                          value={filterCriteria.type}
                          onChange={(e) => handleFilterChange('type', e.target.value)}
                          label={t('workoutType')}
                        >
                          <MenuItem value="all">{t('allTypes')}</MenuItem>
                          <MenuItem value="power">{t('power')}</MenuItem>
                          <MenuItem value="endurance">{t('endurance')}</MenuItem>
                          <MenuItem value="mountain">{t('mountain')}</MenuItem>
                        </Select>
                      </FormControl>
                      
                      <FormControl size="small" fullWidth>
                        <InputLabel id="badge-type-label">{t('workoutCategory')}</InputLabel>
                        <Select
                          labelId="badge-type-label"
                          value={filterCriteria.badgeType}
                          onChange={(e) => handleFilterChange('badgeType', e.target.value)}
                          label={t('workoutCategory')}
                        >
                          <MenuItem value="all">{t('allCategories')}</MenuItem>
                          {Object.entries(workoutBadges).map(([key, badge]) => (
                            <MenuItem key={key} value={key}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    bgcolor: badge.color,
                                    mr: 1
                                  }}
                                />
                                {badge.label}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Paper>
                
                <Typography variant="subtitle1" gutterBottom>
                  {getFilteredWorkouts().length} {t('workoutsFound')}
                </Typography>
                
                <Grid container spacing={2}>
                  {getFilteredWorkouts().map((workout) => (
                    <Grid item xs={12} sm={6} md={4} key={workout.id}>
                      <Card 
                        sx={{ 
                          height: '100%', 
                          display: 'flex', 
                          flexDirection: 'column',
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 6
                          }
                        }}
                      >
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="h6" component="div">
                              {workout.name}
                            </Typography>
                            {renderWorkoutBadge(workout.badgeType)}
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                            {workout.description}
                          </Typography>
                          
                          <Divider sx={{ my: 1 }} />
                          
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                            <Chip
                              icon={<TimerIcon />}
                              size="small"
                              label={`${workout.duration} min`}
                              variant="outlined"
                            />
                            <Chip
                              icon={<FireIcon />}
                              size="small"
                              label={`${workout.caloriesBurned} kcal`}
                              variant="outlined"
                              color="error"
                            />
                            <Chip
                              icon={
                                workout.intensity === 'high' || workout.intensity === 'very-high' ? 
                                <FitnessIcon /> : <HeartIcon />
                              }
                              size="small"
                              label={t(workout.intensity)}
                              variant="outlined"
                              color={
                                workout.intensity === 'high' ? 'warning' :
                                workout.intensity === 'very-high' ? 'error' :
                                'primary'
                              }
                            />
                          </Box>
                        </CardContent>
                        
                        <Box sx={{ p: 2, pt: 0 }}>
                          <Button 
                            variant="contained"
                            fullWidth
                            onClick={() => handleSelectWorkout(workout)}
                          >
                            {t('selectWorkout')}
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </Box>
        );
      
      case 1: // Création de séance personnalisée
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('customWorkout')}
            </Typography>
            
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={t('workoutName')}
                    value={customWorkout.name}
                    onChange={(e) => setCustomWorkout({ ...customWorkout, name: e.target.value })}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>{t('targetSystem')}</InputLabel>
                    <Select
                      value={customWorkout.targetSystem}
                      onChange={(e) => setCustomWorkout({ ...customWorkout, targetSystem: e.target.value })}
                      label={t('targetSystem')}
                    >
                      {energySystems.map((system) => (
                        <MenuItem key={system.value} value={system.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: system.color,
                                mr: 1
                              }}
                            />
                            {system.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label={t('workoutDescription')}
                    value={customWorkout.description}
                    onChange={(e) => setCustomWorkout({ ...customWorkout, description: e.target.value })}
                    fullWidth
                    multiline
                    rows={2}
                    margin="normal"
                  />
                </Grid>
              </Grid>
            </Paper>
            
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                {t('addIntervals')}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label={t('workDuration')}
                    type="number"
                    value={currentInterval.duration}
                    onChange={(e) => setCurrentInterval({ ...currentInterval, duration: parseInt(e.target.value) })}
                    fullWidth
                    margin="normal"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">{t('seconds')}</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label={t('recovery')}
                    type="number"
                    value={currentInterval.recovery}
                    onChange={(e) => setCurrentInterval({ ...currentInterval, recovery: parseInt(e.target.value) })}
                    fullWidth
                    margin="normal"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">{t('seconds')}</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label={t('intensity')}
                    type="number"
                    value={currentInterval.intensity}
                    onChange={(e) => setCurrentInterval({ ...currentInterval, intensity: parseInt(e.target.value) })}
                    fullWidth
                    margin="normal"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">% FTP</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label={t('repetitions')}
                    type="number"
                    value={currentInterval.repetitions}
                    onChange={(e) => setCurrentInterval({ ...currentInterval, repetitions: parseInt(e.target.value) })}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => {
                    const newIntervals = generateIntervals(
                      currentInterval.duration,
                      currentInterval.recovery,
                      currentInterval.repetitions,
                      currentInterval.intensity
                    );
                    setCustomWorkout({
                      ...customWorkout,
                      intervals: [...customWorkout.intervals, ...newIntervals]
                    });
                  }}
                >
                  {t('addBasicIntervals')}
                </Button>
                
                <Button 
                  variant="outlined" 
                  onClick={() => {
                    const newIntervals = generateSweetSpotIntervals(
                      currentInterval.repetitions,
                      currentInterval.duration,
                      currentInterval.recovery,
                      currentInterval.intensity
                    );
                    setCustomWorkout({
                      ...customWorkout,
                      intervals: [...customWorkout.intervals, ...newIntervals]
                    });
                  }}
                >
                  {t('addSweetSpotIntervals')}
                </Button>
                
                <Button 
                  variant="outlined" 
                  onClick={() => {
                    const newIntervals = generateThresholdIntervals(
                      currentInterval.repetitions,
                      currentInterval.duration,
                      currentInterval.recovery,
                      currentInterval.intensity
                    );
                    setCustomWorkout({
                      ...customWorkout,
                      intervals: [...customWorkout.intervals, ...newIntervals]
                    });
                  }}
                >
                  {t('addThresholdIntervals')}
                </Button>
                
                <Button 
                  variant="outlined" 
                  onClick={() => {
                    const newIntervals = generateClimbPyramid();
                    setCustomWorkout({
                      ...customWorkout,
                      intervals: [...customWorkout.intervals, ...newIntervals]
                    });
                  }}
                >
                  {t('addClimbPyramid')}
                </Button>
              </Box>
            </Paper>
            
            {customWorkout.intervals.length > 0 && (
              <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1">
                    {t('currentIntervals')}
                  </Typography>
                  <Button 
                    variant="outlined" 
                    color="error" 
                    size="small"
                    onClick={() => setCustomWorkout({ ...customWorkout, intervals: [] })}
                  >
                    {t('clearAll')}
                  </Button>
                </Box>
                
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('type')}</TableCell>
                        <TableCell align="right">{t('duration')}</TableCell>
                        <TableCell align="right">{t('intensity')}</TableCell>
                        <TableCell>{t('description')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {customWorkout.intervals.map((interval, idx) => (
                        <TableRow
                          key={idx}
                          sx={{
                            backgroundColor: 
                              interval.type === 'work' ? 'rgba(244, 67, 54, 0.1)' :
                              interval.type === 'rest' ? 'rgba(76, 175, 80, 0.1)' :
                              interval.type === 'warmup' ? 'rgba(33, 150, 243, 0.1)' :
                              'rgba(255, 152, 0, 0.1)'
                          }}
                        >
                          <TableCell>
                            {interval.type === 'work' ? t('work') :
                             interval.type === 'rest' ? t('rest') :
                             interval.type === 'warmup' ? t('warmup') :
                             t('cooldown')}
                          </TableCell>
                          <TableCell align="right">
                            {Math.floor(interval.duration / 60)}:{(interval.duration % 60).toString().padStart(2, '0')}
                          </TableCell>
                          <TableCell align="right">
                            {interval.intensity}% FTP
                          </TableCell>
                          <TableCell>{interval.label}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    onClick={() => {
                      // Mettre à jour la durée totale
                      const totalDuration = Math.round(calculateTotalDuration(customWorkout.intervals) / 60);
                      setCustomWorkout({
                        ...customWorkout,
                        duration: totalDuration
                      });
                      
                      // Passer à l'onglet de prévisualisation
                      setActiveTab(3);
                    }}
                  >
                    {t('previewWorkout')}
                  </Button>
                </Box>
              </Paper>
            )}
          </Box>
        );
      
      case 2: // Statistiques HIIT
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('hiitStats')}
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                {t('benefitsOfHiit')}
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom>
                        {t('effectivenessByDuration')}
                      </Typography>
                      
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                          data={[
                            { duration: '15min', effectiveness: 65, fatigue: 40 },
                            { duration: '30min', effectiveness: 85, fatigue: 65 },
                            { duration: '45min', effectiveness: 95, fatigue: 80 },
                            { duration: '60min', effectiveness: 100, fatigue: 95 },
                            { duration: '75min', effectiveness: 95, fatigue: 100 }
                          ]}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="duration" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Bar dataKey="effectiveness" name={t('trainingImpact')} fill={brandConfig.colors.primary} />
                          <Bar dataKey="fatigue" name={t('fatigue')} fill={brandConfig.colors.secondary} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom>
                        {t('energySystemTargeting')}
                      </Typography>
                      
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: t('aerobicSystem'), value: 35, color: '#4CAF50' },
                              { name: t('anaerobicSystem'), value: 45, color: '#F44336' },
                              { name: t('mixedSystem'), value: 20, color: '#FF9800' }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {[
                              { name: t('aerobicSystem'), value: 35, color: '#4CAF50' },
                              { name: t('anaerobicSystem'), value: 45, color: '#F44336' },
                              { name: t('mixedSystem'), value: 20, color: '#FF9800' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
            
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                {t('workoutCalorieEstimations')}
              </Typography>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                {t('calorieCalculationNote')}
              </Alert>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('workoutType')}</TableCell>
                      <TableCell align="right">15 {t('minutes')}</TableCell>
                      <TableCell align="right">30 {t('minutes')}</TableCell>
                      <TableCell align="right">45 {t('minutes')}</TableCell>
                      <TableCell align="right">60+ {t('minutes')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <Chip icon={<ExpressIcon />} label="Express" size="small" sx={{ backgroundColor: workoutBadges.express.color, color: 'white' }} />
                      </TableCell>
                      <TableCell align="right">200-250 kcal</TableCell>
                      <TableCell align="right">-</TableCell>
                      <TableCell align="right">-</TableCell>
                      <TableCell align="right">-</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Chip icon={<FireIcon />} label="Brûle-graisse" size="small" sx={{ backgroundColor: workoutBadges.burn.color, color: 'white' }} />
                      </TableCell>
                      <TableCell align="right">250-300 kcal</TableCell>
                      <TableCell align="right">450-550 kcal</TableCell>
                      <TableCell align="right">650-750 kcal</TableCell>
                      <TableCell align="right">800-1000 kcal</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Chip icon={<MountainIcon />} label="Grimpeur" size="small" sx={{ backgroundColor: workoutBadges.climb.color, color: 'white' }} />
                      </TableCell>
                      <TableCell align="right">-</TableCell>
                      <TableCell align="right">400-500 kcal</TableCell>
                      <TableCell align="right">600-700 kcal</TableCell>
                      <TableCell align="right">800-950 kcal</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Chip icon={<ClockIcon />} label="Endurance" size="small" sx={{ backgroundColor: workoutBadges.endurance.color, color: 'white' }} />
                      </TableCell>
                      <TableCell align="right">-</TableCell>
                      <TableCell align="right">350-450 kcal</TableCell>
                      <TableCell align="right">550-650 kcal</TableCell>
                      <TableCell align="right">750-900 kcal</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        );
      
      case 3: // Onglet Prévisualisation du workout
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('workoutPreview')}
            </Typography>
            
            {!selectedWorkout && customWorkout.intervals.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                {t('selectOrCreateWorkout')}
              </Alert>
            ) : (
              <>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={8}>
                    <Paper 
                      elevation={2} 
                      sx={{ 
                        p: 2, 
                        bgcolor: 'background.paper' 
                      }}
                    >
                      <Typography variant="h6">
                        {selectedWorkout ? selectedWorkout.name : customWorkout.name || t('customWorkout')}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {selectedWorkout ? selectedWorkout.description : customWorkout.description || t('noDescription')}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        <Chip 
                          icon={<TimerIcon />} 
                          label={`${Math.round((selectedWorkout ? calculateTotalDuration(selectedWorkout.intervals) : calculateTotalDuration(customWorkout.intervals)) / 60)} min`} 
                          size="small" 
                          color="primary"
                          variant="outlined"
                        />
                        
                        <Chip 
                          icon={<FitnessIcon />} 
                          label={energySystems.find(s => s.value === (selectedWorkout ? selectedWorkout.targetSystem : customWorkout.targetSystem))?.label} 
                          size="small"
                          sx={{ 
                            bgcolor: energySystems.find(s => s.value === (selectedWorkout ? selectedWorkout.targetSystem : customWorkout.targetSystem))?.color,
                            color: 'white'
                          }}
                        />
                        
                        <Chip 
                          icon={<HeartIcon />} 
                          label={`${t('intensity')}: ${Math.round(calculateWorkoutStats(selectedWorkout ? selectedWorkout.intervals : customWorkout.intervals).avgIntensity)}%`} 
                          size="small"
                          variant="outlined"
                          color="secondary"
                        />
                        
                        <Chip 
                          icon={<FireIcon />} 
                          label={`TSS: ${calculateWorkoutStats(selectedWorkout ? selectedWorkout.intervals : customWorkout.intervals).tss}`} 
                          size="small"
                          variant="outlined"
                          color="error"
                        />
                      </Box>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle1" gutterBottom>
                        {t('workoutStats')}
                      </Typography>
                      
                      {loading ? (
                        <CircularProgress />
                      ) : (
                        <List dense>
                          <ListItem>
                            <ListItemText 
                              primary={t('totalDuration')}
                              secondary={`${Math.round((selectedWorkout ? calculateTotalDuration(selectedWorkout.intervals) : calculateTotalDuration(customWorkout.intervals)) / 60)} ${t('minutes')}`}
                            />
                          </ListItem>
                          
                          <ListItem>
                            <ListItemText 
                              primary={t('workToRestRatio')}
                              secondary={`${Math.round((calculateWorkoutStats(selectedWorkout ? selectedWorkout.intervals : customWorkout.intervals).workDuration / calculateWorkoutStats(selectedWorkout ? selectedWorkout.intervals : customWorkout.intervals).restDuration) * 10) / 10}:1`}
                            />
                          </ListItem>
                          
                          <ListItem>
                            <ListItemText 
                              primary={t('avgIntensity')}
                              secondary={`${Math.round(calculateWorkoutStats(selectedWorkout ? selectedWorkout.intervals : customWorkout.intervals).avgIntensity)}% FTP`}
                            />
                          </ListItem>
                          
                          <ListItem>
                            <ListItemText 
                              primary={t('normalizedIntensity')}
                              secondary={`${calculateWorkoutStats(selectedWorkout ? selectedWorkout.intervals : customWorkout.intervals).normalizedIntensity}% FTP`}
                            />
                          </ListItem>
                          
                          <ListItem>
                            <ListItemText 
                              primary={t('tssLabel')}
                              secondary={
                                <Tooltip title={t('tssExplanation')}>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <span>{calculateWorkoutStats(selectedWorkout ? selectedWorkout.intervals : customWorkout.intervals).tss}</span>
                                    <InfoIcon fontSize="small" color="action" sx={{ ml: 1 }} />
                                  </Box>
                                </Tooltip>
                              }
                            />
                          </ListItem>
                        </List>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={7}>
                    <Typography variant="subtitle1" gutterBottom>
                      {t('intensityProfile')}
                    </Typography>
                    
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={previewData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="time" 
                          label={{ value: t('time'), position: 'insideBottomRight', offset: -10 }}
                        />
                        <YAxis 
                          label={{ value: t('intensity'), angle: -90, position: 'insideLeft' }}
                          domain={[0, dataMax => Math.max(120, dataMax)]}
                        />
                        <Tooltip formatter={(value) => [`${value}% FTP`, t('intensity')]} />
                        <Legend />
                        <ReferenceLine y={100} stroke="red" strokeDasharray="3 3" label={{ value: "FTP", position: 'right' }} />
                        <ReferenceLine y={90} stroke="#ff9800" strokeDasharray="3 3" label={{ value: "90%", position: 'right' }} />
                        <ReferenceLine y={75} stroke="#4caf50" strokeDasharray="3 3" label={{ value: "75%", position: 'right' }} />
                        <Line 
                          type="stepAfter" 
                          dataKey="intensity" 
                          stroke="#8884d8" 
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Grid>
                  
                  <Grid item xs={12} md={5}>
                    <Typography variant="subtitle1" gutterBottom>
                      {t('zoneDistribution')}
                    </Typography>
                    
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={calculateWorkoutStats(selectedWorkout ? selectedWorkout.intervals : customWorkout.intervals).intensityDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent, time }) => `${name}: ${(percent * 100).toFixed(0)}% (${time})`}
                        >
                          {calculateWorkoutStats(selectedWorkout ? selectedWorkout.intervals : customWorkout.intervals).intensityDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={
                              entry.name === 'Z1' ? '#4fc3f7' :
                              entry.name === 'Z2' ? '#4caf50' :
                              entry.name === 'Z3' ? '#ff9800' :
                              entry.name === 'Z4' ? '#f44336' :
                              entry.name === 'Z5' ? '#9c27b0' :
                              '#e91e63'
                            } />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name, entry) => [`${value} min (${entry.payload.time})`, name]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Grid>
                </Grid>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={7}>
                    <Typography variant="subtitle1" gutterBottom>
                      {t('intervalStructure')}
                    </Typography>
                    
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>{t('type')}</TableCell>
                            <TableCell align="right">{t('duration')}</TableCell>
                            <TableCell align="right">{t('intensity')}</TableCell>
                            <TableCell>{t('description')}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(selectedWorkout ? selectedWorkout.intervals : customWorkout.intervals).map((interval, idx) => (
                            <TableRow
                              key={idx}
                              sx={{
                                backgroundColor: 
                                  interval.type === 'work' ? 'rgba(244, 67, 54, 0.1)' :
                                  interval.type === 'rest' ? 'rgba(76, 175, 80, 0.1)' :
                                  interval.type === 'warmup' ? 'rgba(33, 150, 243, 0.1)' :
                                  'rgba(255, 152, 0, 0.1)'
                              }}
                            >
                              <TableCell>
                                {interval.type === 'work' ? t('work') :
                                 interval.type === 'rest' ? t('rest') :
                                 interval.type === 'warmup' ? t('warmup') :
                                 t('cooldown')}
                              </TableCell>
                              <TableCell align="right">
                                {Math.floor(interval.duration / 60)}:{(interval.duration % 60).toString().padStart(2, '0')}
                              </TableCell>
                              <TableCell align="right">
                                {interval.intensity}% FTP
                              </TableCell>
                              <TableCell>{interval.label}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={() => handleSaveWorkout(selectedWorkout || customWorkout)}
                  >
                    {t('saveWorkout')}
                  </Button>
                </Box>
              </>
            )}
          </Box>
        );
      // ... (autres onglets)
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        {t('hiitBuilder')}
      </Typography>
      
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange} 
        variant="scrollable" 
        scrollButtons="auto"
      >
        <Tab label={t('templates')} />
        <Tab label={t('customWorkout')} />
        <Tab label={t('workoutStats')} />
        <Tab label={t('workoutPreview')} />
      </Tabs>
      
      {renderTabContent()}
      
      <CalorieCalculator
        userProfile={userProfile}
        onCalorieSettingsChange={handleCalorieSettingsChange}
        open={calorieCalculatorOpen}
        onClose={() => setCalorieCalculatorOpen(false)}
      />
    </Box>
  );
};

export default HIITBuilder;