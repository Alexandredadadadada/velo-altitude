import React, { memo, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  LinearProgress,
  FormControlLabel,
  Slider,
  Radio,
  RadioGroup,
  Alert,
  Chip,
  Stack,
  Paper,
  Tooltip,
  Divider,
  Skeleton
} from '@mui/material';
import {
  CalculateOutlined as CalculateIcon,
  FitnessCenterOutlined as FitnessCenterIcon,
  DirectionsBikeOutlined as DirectionsBikeIcon,
  SpeedOutlined as SpeedIcon,
  HelpOutlineOutlined as HelpIcon,
  PersonOutlineOutlined as PersonIcon
} from '@mui/icons-material';

/**
 * Composant pour le calculateur nutritionnel
 * Optimisé avec memo, useCallback et useMemo pour éviter les re-renders inutiles
 * 
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.userProfile - Profil de l'utilisateur
 * @param {Function} props.setUserProfile - Fonction pour mettre à jour le profil
 * @param {Function} props.calculateNutrition - Fonction pour calculer les besoins nutritionnels
 * @param {boolean} props.loading - Indique si le calcul est en cours
 * @param {string} props.error - Message d'erreur éventuel
 */
const NutritionCalculator = memo(({
  userProfile,
  setUserProfile,
  calculateNutrition,
  loading,
  error
}) => {
  const { t } = useTranslation();
  
  // Validation des champs
  const [validationErrors, setValidationErrors] = useState({});
  
  // Handler pour les changements de champs avec useCallback pour optimisation
  const handleProfileChange = useCallback((field, value) => {
    setUserProfile(prevProfile => ({
      ...prevProfile,
      [field]: value
    }));
    
    // Effacer l'erreur de validation pour ce champ
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [setUserProfile, validationErrors]);
  
  // Fonction pour valider le formulaire
  const validateForm = useCallback(() => {
    const errors = {};
    
    if (!userProfile.age || userProfile.age < 16 || userProfile.age > 100) {
      errors.age = t('nutrition.validation.age');
    }
    
    if (!userProfile.weight || userProfile.weight < 40 || userProfile.weight > 200) {
      errors.weight = t('nutrition.validation.weight');
    }
    
    if (!userProfile.height || userProfile.height < 140 || userProfile.height > 220) {
      errors.height = t('nutrition.validation.height');
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [userProfile, t]);
  
  // Gestionnaire pour soumettre le formulaire
  const handleSubmit = useCallback(() => {
    if (validateForm()) {
      calculateNutrition(userProfile);
    }
  }, [validateForm, calculateNutrition, userProfile]);
  
  // Calculer le niveau d'activité en texte
  const activityLevelText = useMemo(() => {
    const levels = {
      sedentary: t('nutrition.activity.sedentary'),
      light: t('nutrition.activity.light'),
      moderate: t('nutrition.activity.moderate'),
      active: t('nutrition.activity.active'),
      veryActive: t('nutrition.activity.very_active')
    };
    return levels[userProfile.activityLevel] || levels.moderate;
  }, [userProfile.activityLevel, t]);
  
  // Calculer le texte pour l'objectif
  const goalText = useMemo(() => {
    const goals = {
      performance: t('nutrition.goals.performance'),
      weightLoss: t('nutrition.goals.weight_loss'),
      endurance: t('nutrition.goals.endurance'),
      recovery: t('nutrition.goals.recovery')
    };
    return goals[userProfile.goal] || goals.performance;
  }, [userProfile.goal, t]);
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        overflow: 'hidden',
        borderRadius: 2,
        transition: 'all 0.3s ease-in-out',
      }}
    >
      <CardHeader 
        title={
          <Box display="flex" alignItems="center">
            <CalculateIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component="h2">
              {t('nutrition.calculator_title')}
            </Typography>
          </Box>
        }
        subheader={
          <Typography variant="body2" component="div" sx={{ mt: 0.5 }}>
            {t('nutrition.calculator_description')}
          </Typography>
        }
        sx={{ 
          bgcolor: 'primary.main', 
          color: 'primary.contrastText',
          '& .MuiCardHeader-subheader': { 
            color: 'primary.contrastText', 
            opacity: 0.8 
          },
          px: { xs: 2, sm: 3 },
          py: { xs: 1.5, sm: 2 }
        }}
      />
      
      <CardContent sx={{ pt: 3, px: { xs: 2, sm: 3 } }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            role="alert"
            aria-live="assertive"
          >
            {error}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          {/* Informations personnelles */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={1} 
              sx={{ 
                p: { xs: 2, sm: 3 }, 
                mb: { xs: 2, md: 0 },
                height: '100%',
                transition: 'box-shadow 0.3s ease'
              }}
            >
              <Box 
                display="flex" 
                alignItems="center" 
                mb={2}
                component="section"
                aria-labelledby="personal-info-title"
              >
                <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography 
                  variant="h6" 
                  component="h3" 
                  id="personal-info-title"
                >
                  {t('nutrition.personal_info')}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                {loading ? (
                  <Skeleton 
                    variant="rounded" 
                    height={56} 
                    width="100%" 
                    animation="wave" 
                  />
                ) : (
                  <TextField
                    fullWidth
                    label={t('nutrition.fields.age')}
                    type="number"
                    value={userProfile.age || ''}
                    onChange={(e) => handleProfileChange('age', parseInt(e.target.value, 10) || '')}
                    margin="normal"
                    size="small"
                    inputProps={{ 
                      min: 16, 
                      max: 100,
                      'aria-label': t('nutrition.fields.age') 
                    }}
                    error={!!validationErrors.age}
                    helperText={validationErrors.age}
                    required
                  />
                )}
              </Box>
              
              <Box sx={{ mb: 2 }}>
                {loading ? (
                  <Skeleton 
                    variant="rounded" 
                    height={56} 
                    width="100%" 
                    animation="wave" 
                  />
                ) : (
                  <FormControl 
                    fullWidth 
                    margin="normal" 
                    size="small" 
                    required
                  >
                    <InputLabel id="gender-select-label">
                      {t('nutrition.fields.gender')}
                    </InputLabel>
                    <Select
                      labelId="gender-select-label"
                      id="gender-select"
                      value={userProfile.gender || ''}
                      onChange={(e) => handleProfileChange('gender', e.target.value)}
                      label={t('nutrition.fields.gender')}
                      inputProps={{
                        'aria-label': t('nutrition.fields.gender')
                      }}
                    >
                      <MenuItem value="male">{t('nutrition.gender.male')}</MenuItem>
                      <MenuItem value="female">{t('nutrition.gender.female')}</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </Box>
              
              <Box sx={{ mb: 2 }}>
                {loading ? (
                  <Skeleton 
                    variant="rounded" 
                    height={56} 
                    width="100%" 
                    animation="wave" 
                  />
                ) : (
                  <TextField
                    fullWidth
                    label={t('nutrition.fields.weight_kg')}
                    type="number"
                    value={userProfile.weight || ''}
                    onChange={(e) => handleProfileChange('weight', parseFloat(e.target.value) || '')}
                    margin="normal"
                    size="small"
                    inputProps={{ 
                      min: 40, 
                      max: 200, 
                      step: 0.1,
                      'aria-label': t('nutrition.fields.weight_kg')
                    }}
                    error={!!validationErrors.weight}
                    helperText={validationErrors.weight}
                    required
                  />
                )}
              </Box>
              
              <Box sx={{ mb: 2 }}>
                {loading ? (
                  <Skeleton 
                    variant="rounded" 
                    height={56} 
                    width="100%" 
                    animation="wave" 
                  />
                ) : (
                  <TextField
                    fullWidth
                    label={t('nutrition.fields.height_cm')}
                    type="number"
                    value={userProfile.height || ''}
                    onChange={(e) => handleProfileChange('height', parseInt(e.target.value, 10) || '')}
                    margin="normal"
                    size="small"
                    inputProps={{ 
                      min: 140, 
                      max: 220,
                      'aria-label': t('nutrition.fields.height_cm')
                    }}
                    error={!!validationErrors.height}
                    helperText={validationErrors.height}
                    required
                  />
                )}
              </Box>
            </Paper>
          </Grid>
          
          {/* Activité et objectifs */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={1} 
              sx={{ 
                p: { xs: 2, sm: 3 },
                height: '100%',
                transition: 'box-shadow 0.3s ease'
              }}
            >
              <Box 
                display="flex" 
                alignItems="center" 
                mb={2}
                component="section"
                aria-labelledby="activity-goals-title"
              >
                <FitnessCenterIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography 
                  variant="h6" 
                  component="h3"
                  id="activity-goals-title"
                >
                  {t('nutrition.activity_goals')}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                {loading ? (
                  <Skeleton 
                    variant="rounded" 
                    height={56} 
                    width="100%" 
                    animation="wave" 
                  />
                ) : (
                  <FormControl fullWidth margin="normal" size="small" required>
                    <InputLabel id="activity-level-label">
                      {t('nutrition.fields.activity_level')}
                    </InputLabel>
                    <Select
                      labelId="activity-level-label"
                      id="activity-level-select"
                      value={userProfile.activityLevel || 'moderate'}
                      onChange={(e) => handleProfileChange('activityLevel', e.target.value)}
                      label={t('nutrition.fields.activity_level')}
                      inputProps={{
                        'aria-label': t('nutrition.fields.activity_level')
                      }}
                    >
                      <MenuItem value="sedentary">{t('nutrition.activity.sedentary')}</MenuItem>
                      <MenuItem value="light">{t('nutrition.activity.light')}</MenuItem>
                      <MenuItem value="moderate">{t('nutrition.activity.moderate')}</MenuItem>
                      <MenuItem value="active">{t('nutrition.activity.active')}</MenuItem>
                      <MenuItem value="veryActive">{t('nutrition.activity.very_active')}</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Box 
                  display="flex" 
                  alignItems="center" 
                  justifyContent="space-between" 
                  mb={1}
                >
                  <Typography variant="body2">
                    {t('nutrition.fields.cycling_hours')}
                  </Typography>
                  <Box 
                    display="flex" 
                    alignItems="center"
                  >
                    <DirectionsBikeIcon 
                      fontSize="small" 
                      sx={{ mr: 0.5, color: 'text.secondary' }}
                    />
                    <Typography 
                      variant="body2" 
                      color="primary"
                      aria-live="polite"
                    >
                      {userProfile.cyclingHoursPerWeek || 0} {t('nutrition.hours')}
                    </Typography>
                  </Box>
                </Box>
                
                {loading ? (
                  <Skeleton 
                    variant="rounded" 
                    height={40} 
                    width="100%" 
                    animation="wave" 
                  />
                ) : (
                  <Slider
                    value={userProfile.cyclingHoursPerWeek || 0}
                    min={0}
                    max={30}
                    step={1}
                    marks={[
                      { value: 0, label: '0h' },
                      { value: 10, label: '10h' },
                      { value: 20, label: '20h' },
                      { value: 30, label: '30h' }
                    ]}
                    valueLabelDisplay="auto"
                    onChange={(e, newValue) => handleProfileChange('cyclingHoursPerWeek', newValue)}
                    aria-labelledby="cycling-hours-slider"
                    sx={{
                      '& .MuiSlider-thumb': {
                        height: 20,
                        width: 20,
                      },
                      '& .MuiSlider-rail': {
                        opacity: 0.5,
                      }
                    }}
                  />
                )}
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography 
                  variant="body2" 
                  gutterBottom
                  id="goals-group-label"
                >
                  {t('nutrition.fields.goal')}
                </Typography>
                
                {loading ? (
                  <Stack spacing={1}>
                    <Skeleton variant="text" height={30} width="70%" />
                    <Skeleton variant="text" height={30} width="60%" />
                    <Skeleton variant="text" height={30} width="65%" />
                    <Skeleton variant="text" height={30} width="55%" />
                    <Skeleton variant="text" height={30} width="50%" />
                  </Stack>
                ) : (
                  <FormControl component="fieldset" sx={{ width: '100%' }}>
                    <RadioGroup
                      aria-labelledby="goals-group-label"
                      name="goal-group"
                      value={userProfile.goal || 'performance'}
                      onChange={(e) => handleProfileChange('goal', e.target.value)}
                    >
                      <FormControlLabel 
                        value="performance" 
                        control={
                          <Radio 
                            size="small"
                            sx={{ '& .MuiSvgIcon-root': { fontSize: 20 } }}
                          />
                        }
                        label={
                          <Tooltip title={t('nutrition.goal_descriptions.performance')}>
                            <Typography variant="body2">
                              {t('nutrition.goals.performance')}
                            </Typography>
                          </Tooltip>
                        }
                      />
                      <FormControlLabel 
                        value="weightLoss" 
                        control={
                          <Radio 
                            size="small"
                            sx={{ '& .MuiSvgIcon-root': { fontSize: 20 } }}
                          />
                        }
                        label={
                          <Tooltip title={t('nutrition.goal_descriptions.weight_loss')}>
                            <Typography variant="body2">
                              {t('nutrition.goals.weight_loss')}
                            </Typography>
                          </Tooltip>
                        }
                      />
                      <FormControlLabel 
                        value="endurance" 
                        control={
                          <Radio 
                            size="small"
                            sx={{ '& .MuiSvgIcon-root': { fontSize: 20 } }}
                          />
                        }
                        label={
                          <Tooltip title={t('nutrition.goal_descriptions.endurance')}>
                            <Typography variant="body2">
                              {t('nutrition.goals.endurance')}
                            </Typography>
                          </Tooltip>
                        }
                      />
                      <FormControlLabel 
                        value="recovery" 
                        control={
                          <Radio 
                            size="small"
                            sx={{ '& .MuiSvgIcon-root': { fontSize: 20 } }}
                          />
                        }
                        label={
                          <Tooltip title={t('nutrition.goal_descriptions.recovery')}>
                            <Typography variant="body2">
                              {t('nutrition.goals.recovery')}
                            </Typography>
                          </Tooltip>
                        }
                      />
                    </RadioGroup>
                  </FormControl>
                )}
              </Box>
              
              {/* Résumé du profil */}
              <Box 
                sx={{ 
                  mb: 3, 
                  p: 2, 
                  bgcolor: 'background.paper', 
                  borderRadius: 1,
                  border: '1px dashed',
                  borderColor: 'divider',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                aria-label={t('nutrition.profile_summary')}
              >
                {loading ? (
                  <>
                    <Skeleton variant="text" width="40%" height={24} />
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      <Skeleton variant="rounded" width={60} height={24} />
                      <Skeleton variant="rounded" width={70} height={24} />
                      <Skeleton variant="rounded" width={65} height={24} />
                      <Skeleton variant="rounded" width={80} height={24} />
                      <Skeleton variant="rounded" width={90} height={24} />
                    </Box>
                  </>
                ) : (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      {t('nutrition.profile_summary')}
                    </Typography>
                    <Stack 
                      direction="row" 
                      spacing={1} 
                      flexWrap="wrap" 
                      useFlexGap
                      sx={{ gap: 0.5 }}
                    >
                      <Chip 
                        label={`${userProfile.age || '?'} ${t('nutrition.years')}`} 
                        size="small" 
                        variant="outlined"
                        aria-label={`${t('nutrition.fields.age')}: ${userProfile.age || '?'} ${t('nutrition.years')}`}
                      />
                      <Chip 
                        label={userProfile.gender ? t(`nutrition.gender.${userProfile.gender}`) : '?'} 
                        size="small" 
                        variant="outlined"
                        aria-label={`${t('nutrition.fields.gender')}: ${userProfile.gender ? t(`nutrition.gender.${userProfile.gender}`) : '?'}`}
                      />
                      <Chip 
                        label={`${userProfile.weight || '?'} kg`} 
                        size="small" 
                        variant="outlined"
                        aria-label={`${t('nutrition.fields.weight_kg')}: ${userProfile.weight || '?'} kg`}
                      />
                      <Chip 
                        label={`${userProfile.height || '?'} cm`} 
                        size="small" 
                        variant="outlined"
                        aria-label={`${t('nutrition.fields.height_cm')}: ${userProfile.height || '?'} cm`}
                      />
                      <Chip 
                        label={activityLevelText} 
                        size="small" 
                        variant="outlined"
                        aria-label={`${t('nutrition.fields.activity_level')}: ${activityLevelText}`}
                      />
                      <Chip 
                        label={goalText} 
                        size="small" 
                        variant="outlined" 
                        color="primary"
                        aria-label={`${t('nutrition.fields.goal')}: ${goalText}`}
                      />
                    </Stack>
                  </>
                )}
              </Box>
              
              {loading ? (
                <Skeleton 
                  variant="rounded" 
                  height={48} 
                  width="100%" 
                  animation="wave" 
                />
              ) : (
                <Button 
                  variant="contained" 
                  color="primary"
                  fullWidth
                  startIcon={<CalculateIcon />}
                  onClick={handleSubmit}
                  disabled={loading}
                  size="large"
                  aria-label={loading ? t('nutrition.models.calculating') : t('nutrition.models.apply')}
                  sx={{
                    py: 1.2,
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: 2,
                    '&:hover': {
                      boxShadow: 4,
                    },
                  }}
                >
                  {loading ? t('nutrition.models.calculating') : t('nutrition.models.apply')}
                </Button>
              )}
              
              {loading && (
                <LinearProgress 
                  sx={{ mt: 2 }} 
                  aria-label={t('nutrition.models.calculating')}
                />
              )}
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Paper>
  );
});

export default NutritionCalculator;
