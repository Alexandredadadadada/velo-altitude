/**
 * CalorieCalculator.js
 * Composant pour personnaliser et calculer la dépense calorique des séances HIIT
 * Intégré au module HIITBuilder de Velo-Altitude
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Slider,
  Stack,
  TextField,
  Typography,
  Tooltip,
  Zoom
} from '@mui/material';
import {
  LocalFireDepartment as FireIcon,
  Settings as SettingsIcon,
  FitnessCenter as FitnessIcon,
  Person as PersonIcon,
  EmojiPeople as ActivityIcon,
  Speed as FTPIcon,
  Close as CloseIcon,
  InfoOutlined as InfoIcon,
  Save as SaveIcon,
  RestartAlt as ResetIcon
} from '@mui/icons-material';
import { brandConfig } from '../../config/branding';
import UserService from '../../services/UserService';
import { calculateCalories } from '../../data/hiitWorkouts';

// Niveaux d'activité prédéfinis
const activityLevels = [
  { 
    id: 'beginner', 
    label: 'Débutant', 
    description: 'Moins de 3 heures d\'activité par semaine, FTP estimée < 2.5 W/kg',
    multiplier: 0.8,
    ftpEstimate: 2.0
  },
  { 
    id: 'recreational', 
    label: 'Loisir', 
    description: '3-5 heures d\'activité par semaine, FTP estimée 2.5-3.0 W/kg',
    multiplier: 1.0,
    ftpEstimate: 2.7
  },
  { 
    id: 'intermediate', 
    label: 'Intermédiaire', 
    description: '5-8 heures d\'activité par semaine, FTP estimée 3.0-3.5 W/kg',
    multiplier: 1.2,
    ftpEstimate: 3.2
  },
  { 
    id: 'advanced', 
    label: 'Avancé', 
    description: '8-12 heures d\'activité par semaine, FTP estimée 3.5-4.1 W/kg',
    multiplier: 1.4,
    ftpEstimate: 3.8
  },
  { 
    id: 'expert', 
    label: 'Expert', 
    description: 'Plus de 12 heures d\'activité par semaine, FTP estimée > 4.1 W/kg',
    multiplier: 1.6,
    ftpEstimate: 4.3
  }
];

/**
 * Composant de calculateur de calories personnalisé
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.userProfile - Profil de l'utilisateur
 * @param {Function} props.onCalorieSettingsChange - Fonction appelée quand les paramètres sont modifiés
 * @param {boolean} props.open - Contrôle l'ouverture du panneau
 * @param {Function} props.onClose - Fonction appelée à la fermeture du panneau
 */
const CalorieCalculator = ({ userProfile, onCalorieSettingsChange, open, onClose }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [calculationType, setCalculationType] = useState('auto'); // 'auto' ou 'manual'
  
  // Paramètres du calculateur
  const [settings, setSettings] = useState({
    weight: 70,
    age: 35,
    gender: 'male',
    activityLevel: 'recreational',
    ftp: 200,
    useCustomFTP: false,
  });
  
  // Valeurs de test pour visualiser l'impact
  const [testWorkout, setTestWorkout] = useState({
    duration: 45,
    intensity: 'medium-high',
    standardCalories: 650
  });
  
  // Charger les données utilisateur au montage du composant
  useEffect(() => {
    if (userProfile) {
      loadUserData();
    }
  }, [userProfile]);
  
  // Charger les données de l'utilisateur
  const loadUserData = async () => {
    setLoading(true);
    try {
      // Utiliser les données de profil si disponibles
      if (userProfile) {
        const newSettings = {
          ...settings,
          weight: userProfile.weight || settings.weight,
          age: userProfile.age || settings.age,
          gender: userProfile.gender || settings.gender,
          activityLevel: userProfile.cyclist_type === 'beginner' ? 'beginner' :
                          userProfile.cyclist_type === 'all-rounder' ? 'recreational' :
                          userProfile.cyclist_type === 'climber' ? 'intermediate' :
                          userProfile.cyclist_type === 'sprinter' ? 'advanced' : 'recreational',
          ftp: userProfile.ftp || settings.ftp,
          useCustomFTP: userProfile.ftp ? true : false
        };
        setSettings(newSettings);
        
        // Mettre à jour immédiatement les paramètres de calorie
        if (onCalorieSettingsChange) {
          onCalorieSettingsChange(newSettings);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données utilisateur:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Mettre à jour un paramètre spécifique
  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    
    // Si le niveau d'activité change et que l'utilisateur n'a pas de FTP personnalisé,
    // mettre à jour la FTP estimée
    if (key === 'activityLevel' && !settings.useCustomFTP) {
      const activityLevel = activityLevels.find(level => level.id === value);
      if (activityLevel) {
        newSettings.ftp = Math.round(activityLevel.ftpEstimate * newSettings.weight);
      }
    }
    
    // Si le poids change et que l'utilisateur n'a pas de FTP personnalisée,
    // mettre à jour la FTP estimée
    if (key === 'weight' && !settings.useCustomFTP) {
      const activityLevel = activityLevels.find(level => level.id === settings.activityLevel);
      if (activityLevel) {
        newSettings.ftp = Math.round(activityLevel.ftpEstimate * value);
      }
    }
    
    // Mettre à jour l'utilisation de FTP personnalisée
    if (key === 'useCustomFTP') {
      if (!value) {
        // Si l'utilisateur n'utilise plus de FTP personnalisée, revenir à l'estimation
        const activityLevel = activityLevels.find(level => level.id === settings.activityLevel);
        if (activityLevel) {
          newSettings.ftp = Math.round(activityLevel.ftpEstimate * settings.weight);
        }
      }
    }
    
    setSettings(newSettings);
  };
  
  // Calculer les calories personnalisées
  const calculatePersonalizedCalories = (standardCalories) => {
    const activityLevel = activityLevels.find(level => level.id === settings.activityLevel);
    const baseMultiplier = activityLevel ? activityLevel.multiplier : 1.0;
    
    // Coefficient de genre (légère différence due à la composition corporelle moyenne)
    const genderMultiplier = settings.gender === 'female' ? 0.9 : 1.0;
    
    // Coefficient d'âge (métabolisme plus lent avec l'âge)
    const ageMultiplier = settings.age < 30 ? 1.1 :
                          settings.age < 40 ? 1.0 :
                          settings.age < 50 ? 0.95 :
                          settings.age < 60 ? 0.9 : 0.85;
    
    // Coefficient de poids (ajusté par rapport au poids standard de 70kg)
    const weightMultiplier = settings.weight / 70;
    
    // Coefficient de FTP (ajusté par rapport à la FTP standard de 200W)
    const ftpMultiplier = settings.ftp / 200;
    
    // Calcul final
    const totalMultiplier = baseMultiplier * genderMultiplier * ageMultiplier * weightMultiplier * ftpMultiplier;
    return Math.round(standardCalories * totalMultiplier);
  };
  
  // Enregistrer les modifications et fermer
  const handleSave = () => {
    if (onCalorieSettingsChange) {
      onCalorieSettingsChange(settings);
    }
    onClose();
  };
  
  // Réinitialiser aux valeurs par défaut
  const handleReset = () => {
    setSettings({
      weight: 70,
      age: 35,
      gender: 'male',
      activityLevel: 'recreational',
      ftp: 200,
      useCustomFTP: false
    });
  };
  
  // Calculer les calories pour la séance de test
  const testWorkoutCalories = calculatePersonalizedCalories(testWorkout.standardCalories);
  const calorieChange = testWorkoutCalories - testWorkout.standardCalories;
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: brandConfig.colors.primary, 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box display="flex" alignItems="center">
          <FireIcon sx={{ mr: 1 }} />
          {t('personalizedCalorieCalculator')}
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Typography variant="subtitle1" gutterBottom>
          {t('calorieCalculatorDescription')}
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonIcon sx={{ mr: 1 }} />
              {t('yourProfile')}
            </Typography>
            
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label={t('weight')}
                      type="number"
                      value={settings.weight}
                      onChange={(e) => handleSettingChange('weight', parseInt(e.target.value))}
                      fullWidth
                      InputProps={{
                        endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label={t('age')}
                      type="number"
                      value={settings.age}
                      onChange={(e) => handleSettingChange('age', parseInt(e.target.value))}
                      fullWidth
                      InputProps={{
                        endAdornment: <InputAdornment position="end">{t('years')}</InputAdornment>,
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControl component="fieldset">
                      <RadioGroup 
                        row 
                        value={settings.gender} 
                        onChange={(e) => handleSettingChange('gender', e.target.value)}
                      >
                        <FormControlLabel value="male" control={<Radio />} label={t('male')} />
                        <FormControlLabel value="female" control={<Radio />} label={t('female')} />
                      </RadioGroup>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <ActivityIcon sx={{ mr: 1 }} />
              {t('activityLevel')}
            </Typography>
            
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <FormControl fullWidth>
                  <InputLabel>{t('yourCyclingLevel')}</InputLabel>
                  <Select
                    value={settings.activityLevel}
                    onChange={(e) => handleSettingChange('activityLevel', e.target.value)}
                    label={t('yourCyclingLevel')}
                  >
                    {activityLevels.map(level => (
                      <MenuItem key={level.id} value={level.id}>
                        {level.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {activityLevels.find(level => level.id === settings.activityLevel)?.description}
                  </FormHelperText>
                </FormControl>
              </CardContent>
            </Card>
            
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <FTPIcon sx={{ mr: 1 }} />
              {t('yourFTP')}
              <Tooltip 
                title={t('ftpDescription')} 
                arrow
                TransitionComponent={Zoom}
              >
                <InfoIcon fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />
              </Tooltip>
            </Typography>
            
            <Card variant="outlined">
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Radio
                          checked={!settings.useCustomFTP}
                          onChange={() => handleSettingChange('useCustomFTP', false)}
                        />
                      }
                      label={t('estimatedFTP')}
                    />
                    
                    {!settings.useCustomFTP && (
                      <Box sx={{ ml: 4, mb: 2 }}>
                        <Typography variant="body1" color="primary" fontWeight="bold">
                          {settings.ftp} watts
                          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            ({(settings.ftp / settings.weight).toFixed(1)} W/kg)
                          </Typography>
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t('basedOnProfileAndActivity')}
                        </Typography>
                      </Box>
                    )}
                    
                    <FormControlLabel
                      control={
                        <Radio
                          checked={settings.useCustomFTP}
                          onChange={() => handleSettingChange('useCustomFTP', true)}
                        />
                      }
                      label={t('customFTP')}
                    />
                    
                    {settings.useCustomFTP && (
                      <Box sx={{ ml: 4 }}>
                        <TextField
                          label={t('yourFTPWatts')}
                          type="number"
                          value={settings.ftp}
                          onChange={(e) => handleSettingChange('ftp', parseInt(e.target.value))}
                          fullWidth
                          InputProps={{
                            endAdornment: <InputAdornment position="end">watts</InputAdornment>,
                          }}
                          helperText={`${(settings.ftp / settings.weight).toFixed(1)} W/kg`}
                        />
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={5}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <FireIcon sx={{ mr: 1 }} />
              {t('calorieImpact')}
            </Typography>
            
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                bgcolor: 'background.default',
                borderRadius: 2
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    mb: 2,
                    bgcolor: 'white'
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    {t('exampleWorkout')}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('intensityLevel')}: {
                      testWorkout.intensity === 'low' ? t('low') :
                      testWorkout.intensity === 'medium' ? t('medium') :
                      testWorkout.intensity === 'medium-high' ? t('mediumHigh') :
                      testWorkout.intensity === 'high' ? t('high') :
                      t('veryHigh')
                    }
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('duration')}: {testWorkout.duration} min
                  </Typography>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Grid container spacing={1} alignItems="center">
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        {t('standardCalories')}:
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="h6" align="right">
                        {testWorkout.standardCalories} kcal
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        {t('yourCalories')}:
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography 
                        variant="h5" 
                        color="primary" 
                        align="right"
                        fontWeight="bold"
                      >
                        {testWorkoutCalories} kcal
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Box 
                        sx={{ 
                          mt: 1, 
                          p: 1, 
                          borderRadius: 1,
                          bgcolor: calorieChange > 0 ? 'success.light' : 'warning.light',
                          color: calorieChange > 0 ? 'success.contrastText' : 'warning.contrastText',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        <Typography variant="body2" fontWeight="medium">
                          {calorieChange > 0 ? '+' : ''}{calorieChange} kcal ({Math.round((calorieChange / testWorkout.standardCalories) * 100)}%)
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
                
                <Typography variant="subtitle2" gutterBottom>
                  {t('testDifferentWorkout')}:
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" gutterBottom>
                      {t('duration')}: {testWorkout.duration} min
                    </Typography>
                    <Slider
                      value={testWorkout.duration}
                      onChange={(e, value) => setTestWorkout({ ...testWorkout, duration: value })}
                      min={15}
                      max={90}
                      step={5}
                      marks={[
                        { value: 15, label: '15' },
                        { value: 30, label: '30' },
                        { value: 45, label: '45' },
                        { value: 60, label: '60' },
                        { value: 90, label: '90' }
                      ]}
                      valueLabelDisplay="auto"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>{t('intensityLevel')}</InputLabel>
                      <Select
                        value={testWorkout.intensity}
                        onChange={(e) => {
                          const intensity = e.target.value;
                          let standardCalories;
                          
                          // Ajuster les calories standard en fonction de l'intensité et de la durée
                          if (intensity === 'low') {
                            standardCalories = Math.round(testWorkout.duration * 8); // ~8 kcal/min
                          } else if (intensity === 'medium') {
                            standardCalories = Math.round(testWorkout.duration * 10); // ~10 kcal/min
                          } else if (intensity === 'medium-high') {
                            standardCalories = Math.round(testWorkout.duration * 14); // ~14 kcal/min
                          } else if (intensity === 'high') {
                            standardCalories = Math.round(testWorkout.duration * 18); // ~18 kcal/min
                          } else { // very-high
                            standardCalories = Math.round(testWorkout.duration * 22); // ~22 kcal/min
                          }
                          
                          setTestWorkout({ 
                            ...testWorkout, 
                            intensity, 
                            standardCalories
                          });
                        }}
                        label={t('intensityLevel')}
                      >
                        <MenuItem value="low">{t('low')}</MenuItem>
                        <MenuItem value="medium">{t('medium')}</MenuItem>
                        <MenuItem value="medium-high">{t('mediumHigh')}</MenuItem>
                        <MenuItem value="high">{t('high')}</MenuItem>
                        <MenuItem value="very-high">{t('veryHigh')}</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('calorieCalculationFactors')}:
                  </Typography>
                  
                  <Typography variant="body2" gutterBottom>
                    • {t('weightFactor')}: {Math.round((settings.weight / 70) * 100)}%
                  </Typography>
                  
                  <Typography variant="body2" gutterBottom>
                    • {t('ageFactor')}: {
                      settings.age < 30 ? '110%' :
                      settings.age < 40 ? '100%' :
                      settings.age < 50 ? '95%' :
                      settings.age < 60 ? '90%' : '85%'
                    }
                  </Typography>
                  
                  <Typography variant="body2" gutterBottom>
                    • {t('genderFactor')}: {settings.gender === 'female' ? '90%' : '100%'}
                  </Typography>
                  
                  <Typography variant="body2" gutterBottom>
                    • {t('ftpFactor')}: {Math.round((settings.ftp / 200) * 100)}%
                  </Typography>
                  
                  <Typography variant="body2">
                    • {t('activityFactor')}: {
                      activityLevels.find(level => level.id === settings.activityLevel)?.multiplier * 100
                    }%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={handleReset}
          startIcon={<ResetIcon />}
          color="inherit"
        >
          {t('resetToDefaults')}
        </Button>
        <Box flexGrow={1} />
        <Button onClick={onClose}>{t('cancel')}</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
          startIcon={<SaveIcon />}
        >
          {t('saveAndApply')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

CalorieCalculator.propTypes = {
  userProfile: PropTypes.object,
  onCalorieSettingsChange: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default CalorieCalculator;
