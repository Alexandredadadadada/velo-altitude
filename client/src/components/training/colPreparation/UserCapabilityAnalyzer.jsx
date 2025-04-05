import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  TextField, 
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Button,
  InputAdornment,
  Alert,
  Divider,
  Tooltip,
  IconButton,
  useTheme,
  alpha,
  Paper,
  Stack,
  Switch
} from '@mui/material';
import { 
  DatePicker,
  LocalizationProvider
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { 
  DirectionsBike,
  StackedLineChart,
  AccessTime,
  Info,
  EmojiEvents,
  FitnessCenter,
  Whatshot,
  MonitorWeight,
  CalendarMonth,
  Timer,
  Speed,
  TrendingUp,
  Help,
  SportsCycling
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Composant personnalisé pour afficher la FTP et son unité W/kg
const FTPDisplay = ({ ftp, weight }) => {
  const wattsPerKg = weight > 0 ? Math.round((ftp / weight) * 10) / 10 : 0;
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Typography variant="h4" component="div" fontWeight="bold">
        {ftp}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        W ({wattsPerKg} W/kg)
      </Typography>
    </Box>
  );
};

// Composant d'affichage d'un paramètre avec une icône
const CapabilityItem = ({ icon, label, value, unit, color }) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box 
        sx={{ 
          p: 1, 
          borderRadius: '50%', 
          bgcolor: alpha(color || theme.palette.primary.main, 0.1),
          color: color || theme.palette.primary.main
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body1" fontWeight="medium">
          {value} {unit}
        </Typography>
      </Box>
    </Box>
  );
};

/**
 * Composant d'analyse des capacités de l'utilisateur
 * Permet d'évaluer et de définir les capacités actuelles, les objectifs et les préférences
 */
const UserCapabilityAnalyzer = ({ userCapabilities, onChange, selectedCol }) => {
  const theme = useTheme();
  const [estimatedTime, setEstimatedTime] = useState(
    selectedCol 
      ? Math.round((selectedCol.elevation / (userCapabilities.ftp / userCapabilities.weight)) * 0.1) 
      : 60
  );
  
  // Gérer les changements de dates
  const handleDateChange = (date) => {
    onChange('raceDate', date);
  };
  
  // Gérer les changements de jours d'entraînement préférés
  const handleTrainingDayChange = (day) => {
    const currentDays = [...userCapabilities.preferredTrainingDays];
    
    if (currentDays.includes(day)) {
      onChange('preferredTrainingDays', currentDays.filter(d => d !== day));
    } else {
      onChange('preferredTrainingDays', [...currentDays, day].sort());
    }
  };
  
  // Gérer les changements de facteurs limitants
  const handleLimitingFactorChange = (factor) => {
    const currentFactors = [...userCapabilities.limitingFactors];
    
    if (currentFactors.includes(factor)) {
      onChange('limitingFactors', currentFactors.filter(f => f !== factor));
    } else {
      onChange('limitingFactors', [...currentFactors, factor]);
    }
  };
  
  // Calculer la qualité de l'appariement entre l'utilisateur et le col
  const calculateMatchScore = () => {
    if (!selectedCol) return 0;
    
    let score = 0;
    const maxScore = 100;
    
    // Facteurs qui contribuent au score
    const ftpWkg = userCapabilities.ftp / userCapabilities.weight;
    
    // Ajustement en fonction de la FTP/kg et de la difficulté du col
    if (selectedCol.difficulty === 'easy') {
      score += ftpWkg >= 2.5 ? 30 : ftpWkg >= 2.0 ? 25 : 15;
    } else if (selectedCol.difficulty === 'medium') {
      score += ftpWkg >= 3.0 ? 30 : ftpWkg >= 2.5 ? 25 : ftpWkg >= 2.0 ? 15 : 5;
    } else if (selectedCol.difficulty === 'hard') {
      score += ftpWkg >= 3.5 ? 30 : ftpWkg >= 3.0 ? 25 : ftpWkg >= 2.5 ? 15 : 5;
    } else if (selectedCol.difficulty === 'extreme') {
      score += ftpWkg >= 4.0 ? 30 : ftpWkg >= 3.5 ? 25 : ftpWkg >= 3.0 ? 15 : 5;
    }
    
    // Ajustement en fonction du niveau d'expérience
    score += userCapabilities.experience === 'beginner' ? 10 :
             userCapabilities.experience === 'intermediate' ? 15 :
             userCapabilities.experience === 'advanced' ? 20 : 25;
    
    // Ajustement en fonction des heures d'entraînement hebdomadaires
    score += userCapabilities.weeklyHours >= 12 ? 20 :
             userCapabilities.weeklyHours >= 8 ? 15 :
             userCapabilities.weeklyHours >= 5 ? 10 : 5;
    
    // Ajustement en fonction de l'entraînement en force
    score += userCapabilities.strengthTraining ? 10 : 0;
    
    // Ajustement négatif en fonction des facteurs limitants
    score -= userCapabilities.limitingFactors.length * 5;
    
    // Assurer que le score reste dans l'intervalle [0, 100]
    return Math.max(0, Math.min(maxScore, score));
  };
  
  const matchScore = calculateMatchScore();
  
  // Obtenir le niveau de difficulté estimé pour l'utilisateur
  const getDifficultyLevel = () => {
    if (matchScore >= 80) return { level: 'Accessible', color: theme.palette.success.main };
    if (matchScore >= 60) return { level: 'Modéré', color: theme.palette.info.main };
    if (matchScore >= 40) return { level: 'Challengeant', color: theme.palette.warning.main };
    return { level: 'Très difficile', color: theme.palette.error.main };
  };
  
  const difficultyLevel = getDifficultyLevel();
  
  // Calculer une estimation du temps d'ascension en fonction des capacités
  const calculateEstimatedTime = () => {
    if (!selectedCol) return 60;
    
    const ftpWkg = userCapabilities.ftp / userCapabilities.weight;
    const baseFactor = 60; // minutes par 1000m à 3 W/kg
    
    // Ajuster en fonction de la FTP/kg
    let timeFactor = baseFactor;
    if (ftpWkg > 0) {
      timeFactor = baseFactor * (3 / ftpWkg);
    }
    
    // Calculer le temps en minutes
    const timeInMinutes = Math.round((selectedCol.elevation / 1000) * timeFactor);
    
    return timeInMinutes;
  };
  
  // Obtenir les noms des jours de la semaine
  const getDayName = (day) => {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    return days[day - 1];
  };
  
  // Animation pour le conteneur principal
  const containerAnimation = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.4 }
    }
  };
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerAnimation}
    >
      <Box>
        <Typography variant="h6" gutterBottom>
          Analyse de vos capacités
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Définissez vos capacités actuelles et vos objectifs pour que nous puissions générer un programme d'entraînement adapté à votre profil et au col sélectionné.
        </Typography>
        
        {selectedCol && (
          <Card sx={{ mb: 4, bgcolor: alpha(theme.palette.info.main, 0.05), borderLeft: `4px solid ${theme.palette.info.main}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Info color="info" />
                <Typography variant="body1">
                  Vous préparez l'ascension du <strong>{selectedCol.name}</strong> ({selectedCol.elevation}m de dénivelé sur {selectedCol.distance}km).
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}
        
        <Grid container spacing={3}>
          {/* Colonne gauche: capacités physiologiques */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FitnessCenter /> Capacités physiologiques
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    FTP (Functional Threshold Power)
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <FTPDisplay ftp={userCapabilities.ftp} weight={userCapabilities.weight} />
                  </Box>
                  <Slider
                    value={userCapabilities.ftp}
                    min={100}
                    max={400}
                    step={5}
                    onChange={(e, newValue) => onChange('ftp', newValue)}
                    valueLabelDisplay="auto"
                    aria-labelledby="ftp-slider"
                    sx={{ color: theme.palette.primary.main }}
                  />
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <TextField
                        label="FTP (W)"
                        type="number"
                        value={userCapabilities.ftp}
                        onChange={(e) => onChange('ftp', Math.max(100, Math.min(400, parseInt(e.target.value) || 0)))}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">W</InputAdornment>,
                        }}
                        fullWidth
                        variant="outlined"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Poids"
                        type="number"
                        value={userCapabilities.weight}
                        onChange={(e) => onChange('weight', Math.max(40, Math.min(150, parseInt(e.target.value) || 0)))}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                        }}
                        fullWidth
                        variant="outlined"
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Box>
                
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Niveau d'expérience
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={userCapabilities.experience}
                      onChange={(e) => onChange('experience', e.target.value)}
                    >
                      <MenuItem value="beginner">Débutant (1ère année)</MenuItem>
                      <MenuItem value="intermediate">Intermédiaire (2-3 ans)</MenuItem>
                      <MenuItem value="advanced">Avancé (4-7 ans)</MenuItem>
                      <MenuItem value="expert">Expert (8+ ans)</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Facteurs limitants
                    <Tooltip title="Sélectionnez les facteurs qui peuvent limiter votre performance">
                      <IconButton size="small">
                        <Help fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Typography>
                  <FormGroup>
                    <Grid container spacing={1}>
                      {[
                        { value: 'endurance', label: 'Endurance limitée', icon: <AccessTime fontSize="small" /> },
                        { value: 'vo2max', label: 'VO2max faible', icon: <Whatshot fontSize="small" /> },
                        { value: 'climbing', label: 'Difficulté en montée', icon: <Terrain fontSize="small" /> },
                        { value: 'recovery', label: 'Récupération lente', icon: <TrendingUp fontSize="small" /> },
                        { value: 'technique', label: 'Technique de pédalage', icon: <SportsCycling fontSize="small" /> },
                        { value: 'mental', label: 'Mental/concentration', icon: <EmojiEvents fontSize="small" /> }
                      ].map((factor) => (
                        <Grid item xs={6} key={factor.value}>
                          <FormControlLabel
                            control={
                              <Checkbox 
                                checked={userCapabilities.limitingFactors.includes(factor.value)}
                                onChange={() => handleLimitingFactorChange(factor.value)}
                                size="small"
                              />
                            }
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {factor.icon}
                                <Typography variant="body2">{factor.label}</Typography>
                              </Box>
                            }
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </FormGroup>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Colonne droite: planning et objectifs */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarMonth /> Planning d'entraînement
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Date cible pour l'ascension
                  </Typography>
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                    <DatePicker
                      label="Date cible"
                      value={userCapabilities.raceDate}
                      onChange={handleDateChange}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                      disablePast
                      sx={{ width: '100%' }}
                    />
                  </LocalizationProvider>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Sélectionnez la date à laquelle vous prévoyez de gravir le col.
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Heures d'entraînement par semaine</span>
                    <Typography variant="body2" color="primary" fontWeight="medium">
                      {userCapabilities.weeklyHours} heures
                    </Typography>
                  </Typography>
                  <Slider
                    value={userCapabilities.weeklyHours}
                    min={3}
                    max={20}
                    step={1}
                    onChange={(e, newValue) => onChange('weeklyHours', newValue)}
                    valueLabelDisplay="auto"
                    aria-labelledby="weekly-hours-slider"
                    marks={[
                      { value: 3, label: '3h' },
                      { value: 8, label: '8h' },
                      { value: 12, label: '12h' },
                      { value: 20, label: '20h' }
                    ]}
                  />
                </Box>
                
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Jours d'entraînement préférés
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                      <Chip
                        key={day}
                        label={getDayName(day)}
                        onClick={() => handleTrainingDayChange(day)}
                        color={userCapabilities.preferredTrainingDays.includes(day) ? 'primary' : 'default'}
                        variant={userCapabilities.preferredTrainingDays.includes(day) ? 'filled' : 'outlined'}
                        sx={{ width: 52 }}
                      />
                    ))}
                  </Box>
                </Box>
                
                <Box sx={{ mb: 4 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userCapabilities.strengthTraining}
                        onChange={(e) => onChange('strengthTraining', e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FitnessCenter fontSize="small" />
                        <Typography variant="body2">Inclure l'entraînement en force</Typography>
                      </Box>
                    }
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, ml: 4 }}>
                    Recommandé pour les cols avec des sections raides
                  </Typography>
                </Box>
                
                {/* Résumé des capacités et match avec le col sélectionné */}
                {selectedCol && (
                  <Paper
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      borderRadius: 2
                    }}
                  >
                    <Typography variant="subtitle1" gutterBottom>
                      Matching avec {selectedCol.name}
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ position: 'relative', textAlign: 'center', py: 1 }}>
                          <Box
                            sx={{
                              position: 'relative',
                              display: 'inline-flex'
                            }}
                          >
                            <Box
                              sx={{
                                position: 'absolute',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                top: 0,
                                left: 0,
                                bottom: 0,
                                right: 0,
                                flexDirection: 'column'
                              }}
                            >
                              <Typography variant="h4" component="div" fontWeight="bold" color={difficultyLevel.color}>
                                {matchScore}%
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Match
                              </Typography>
                            </Box>
                            <Box sx={{ position: 'relative' }}>
                              {/* Le cercle de progression */}
                              <Box
                                component="svg"
                                sx={{
                                  width: 100,
                                  height: 100,
                                  transform: 'rotate(-90deg)'
                                }}
                              >
                                {/* Cercle de fond */}
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="45"
                                  fill="none"
                                  stroke={alpha(theme.palette.divider, 0.3)}
                                  strokeWidth="8"
                                />
                                {/* Cercle de progression */}
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="45"
                                  fill="none"
                                  stroke={difficultyLevel.color}
                                  strokeWidth="8"
                                  strokeDasharray={`${2 * Math.PI * 45 * matchScore / 100} ${2 * Math.PI * 45 * (1 - matchScore / 100)}`}
                                  strokeLinecap="round"
                                />
                              </Box>
                            </Box>
                          </Box>
                          <Typography variant="body2" fontWeight="medium" color={difficultyLevel.color} sx={{ mt: 1 }}>
                            {difficultyLevel.level}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Stack spacing={1.5}>
                          <CapabilityItem 
                            icon={<Timer />} 
                            label="Temps estimé" 
                            value={`${Math.floor(calculateEstimatedTime() / 60)}h${calculateEstimatedTime() % 60 ? `${calculateEstimatedTime() % 60}min` : ''}`}
                            unit=""
                            color={theme.palette.info.main}
                          />
                          <CapabilityItem 
                            icon={<Speed />} 
                            label="Vitesse ascension" 
                            value={Math.round((selectedCol.elevation / calculateEstimatedTime()) * 10) / 10}
                            unit="m/min"
                            color={theme.palette.success.main}
                          />
                        </Stack>
                      </Grid>
                    </Grid>
                    
                    <Alert 
                      severity={
                        matchScore >= 80 ? "success" : 
                        matchScore >= 60 ? "info" : 
                        matchScore >= 40 ? "warning" : 
                        "error"
                      }
                      sx={{ mt: 1 }}
                    >
                      {matchScore >= 80 
                        ? `Vous êtes bien préparé pour le ${selectedCol.name}. Votre programme sera orienté vers l'optimisation de votre performance.` 
                        : matchScore >= 60 
                        ? `Vous avez un bon niveau pour le ${selectedCol.name}, mais certains aspects peuvent être améliorés.` 
                        : matchScore >= 40 
                        ? `Ce col représente un défi important pour vous. Votre programme sera conçu pour développer progressivement vos capacités.` 
                        : `Ce col est très exigeant pour votre niveau actuel. Nous vous proposerons un programme de développement à long terme.`}
                    </Alert>
                  </Paper>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </motion.div>
  );
};

export default UserCapabilityAnalyzer;
