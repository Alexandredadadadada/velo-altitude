import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box,
  Card, 
  CardContent, 
  CardHeader,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Paper,
  Divider,
  Chip,
  Stack,
  Slider,
  Tooltip
} from '@mui/material';
import { 
  FitnessCenterRounded as DumbbellIcon,
  AccessTimeOutlined as TimeIcon,
  PsychologyOutlined as ExperienceIcon,
  TrackChangesOutlined as TargetIcon,
  DirectionsRunOutlined as RunningIcon,
  SpeedOutlined as SpeedIcon,
  CalendarTodayOutlined as CalendarIcon
} from '@mui/icons-material';

/**
 * Composant de formulaire pour configurer et générer un plan d'entraînement
 * Optimisé avec React.memo pour éviter les re-renders inutiles
 * 
 * @param {Object} props - Les propriétés du composant
 * @param {string} props.goal - Objectif actuel sélectionné
 * @param {string} props.experience - Niveau d'expérience actuel sélectionné
 * @param {number} props.weeklyHours - Nombre d'heures d'entraînement par semaine
 * @param {number} props.planDuration - Durée du plan en semaines
 * @param {string} props.startDate - Date de début du plan
 * @param {Object} props.validationErrors - Erreurs de validation pour les champs
 * @param {Function} props.onFieldChange - Fonction pour mettre à jour n'importe quel champ
 * @param {Function} props.onGeneratePlan - Fonction à appeler pour générer le plan
 */
const PlanForm = memo(({
  goal,
  experience,
  weeklyHours,
  planDuration,
  startDate,
  validationErrors = {},
  onFieldChange,
  onGeneratePlan
}) => {
  const { t } = useTranslation();
  
  // Calculer le TSS hebdomadaire estimé
  const estimatedTSS = useMemo(() => {
    const baseIntensity = {
      beginner: 0.65,
      intermediate: 0.75,
      advanced: 0.82
    }[experience] || 0.75;
    
    // TSS = durée (heures) * intensité² * 100
    return Math.round(weeklyHours * baseIntensity * baseIntensity * 100);
  }, [weeklyHours, experience]);

  return (
    <Paper elevation={3}>
      <CardHeader
        title={
          <Box display="flex" alignItems="center">
            <DumbbellIcon sx={{ mr: 1 }} />
            <Typography variant="h6">
              {t('training.configureYourPlan')}
            </Typography>
          </Box>
        }
        sx={{ 
          bgcolor: 'primary.main', 
          color: 'primary.contrastText',
          '& .MuiCardHeader-subheader': { 
            color: 'primary.contrastText', 
            opacity: 0.8 
          }
        }}
      />
      
      <CardContent sx={{ pt: 3 }}>
        <Box component="form" noValidate autoComplete="off">
          {/* Objectif d'entraînement */}
          <Box sx={{ mb: 3 }}>
            <Box display="flex" alignItems="center" mb={1}>
              <TargetIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="subtitle1" fontWeight="medium">
                {t('training.goalSection')}
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <FormControl fullWidth error={!!validationErrors.goal}>
              <InputLabel id="goal-select-label">{t('training.goalLabel')}</InputLabel>
              <Select
                labelId="goal-select-label"
                value={goal}
                label={t('training.goalLabel')}
                onChange={(e) => onFieldChange('goal', e.target.value)}
              >
                <MenuItem value="general">{t('training.goals.general')}</MenuItem>
                <MenuItem value="performance">{t('training.goals.performance')}</MenuItem>
                <MenuItem value="endurance">{t('training.goals.endurance')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          {/* Expérience */}
          <Box sx={{ mb: 3 }}>
            <Box display="flex" alignItems="center" mb={1}>
              <ExperienceIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="subtitle1" fontWeight="medium">
                {t('training.levelSection')}
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <FormControl fullWidth error={!!validationErrors.experience}>
              <InputLabel id="experience-select-label">{t('training.levelLabel')}</InputLabel>
              <Select
                labelId="experience-select-label"
                value={experience}
                label={t('training.levelLabel')}
                onChange={(e) => onFieldChange('experience', e.target.value)}
              >
                <MenuItem value="beginner">{t('training.levels.beginner')}</MenuItem>
                <MenuItem value="intermediate">{t('training.levels.intermediate')}</MenuItem>
                <MenuItem value="advanced">{t('training.levels.advanced')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          {/* Volume d'entraînement */}
          <Box sx={{ mb: 3 }}>
            <Box display="flex" alignItems="center" mb={1}>
              <TimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="subtitle1" fontWeight="medium">
                {t('training.volumeSection')}
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 1 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">
                  {t('training.weeklyHoursLabel')}
                </Typography>
                <Chip 
                  label={`${weeklyHours} ${t('training.hours')}`}
                  size="small"
                  color="primary"
                  icon={<TimeIcon />}
                />
              </Box>
              <Slider
                value={weeklyHours}
                min={3}
                max={20}
                step={1}
                marks={[
                  { value: 3, label: '3h' },
                  { value: 10, label: '10h' },
                  { value: 20, label: '20h' },
                ]}
                valueLabelDisplay="auto"
                onChange={(e, newValue) => onFieldChange('weeklyHours', newValue)}
                sx={{ mt: 1 }}
              />
              {validationErrors.weeklyHours && (
                <Typography color="error" variant="caption">
                  {validationErrors.weeklyHours}
                </Typography>
              )}
            </Box>
            
            <Box sx={{ mb: 1, mt: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">
                  {t('training.durationLabel')}
                </Typography>
                <Chip 
                  label={`${planDuration} ${t('training.weeks')}`}
                  size="small"
                  color="primary"
                  icon={<CalendarIcon />}
                />
              </Box>
              <Slider
                value={planDuration}
                min={4}
                max={24}
                step={1}
                marks={[
                  { value: 4, label: '4w' },
                  { value: 12, label: '12w' },
                  { value: 24, label: '24w' },
                ]}
                valueLabelDisplay="auto"
                onChange={(e, newValue) => onFieldChange('planDuration', newValue)}
                sx={{ mt: 1 }}
              />
              {validationErrors.planDuration && (
                <Typography color="error" variant="caption">
                  {validationErrors.planDuration}
                </Typography>
              )}
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Tooltip title={t('training.estimatedTSSInfo')} placement="top">
                <Box 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'info.light', 
                    color: 'info.contrastText',
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Typography variant="body2" fontWeight="medium">
                    {t('training.estimatedTSS')}
                  </Typography>
                  <Chip 
                    label={estimatedTSS}
                    color="primary"
                    size="small"
                    icon={<SpeedIcon />}
                  />
                </Box>
              </Tooltip>
            </Box>
          </Box>
          
          {/* Date de début */}
          <Box sx={{ mb: 3 }}>
            <Box display="flex" alignItems="center" mb={1}>
              <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="subtitle1" fontWeight="medium">
                {t('training.startSection')}
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <TextField
              fullWidth
              type="date"
              label={t('training.startDateLabel')}
              value={startDate}
              onChange={(e) => onFieldChange('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              error={!!validationErrors.startDate}
              helperText={validationErrors.startDate}
            />
          </Box>

          {/* Bouton de génération */}
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={onGeneratePlan}
            sx={{ mt: 3 }}
            startIcon={<RunningIcon />}
            size="large"
          >
            {t('training.generatePlan')}
          </Button>
        </Box>
      </CardContent>
    </Paper>
  );
});

export default PlanForm;
