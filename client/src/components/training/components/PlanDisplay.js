import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Divider,
  Paper,
  Avatar,
  Tooltip,
  useTheme,
  Stack,
  LinearProgress
} from '@mui/material';
import { 
  CalendarMonthOutlined as CalendarIcon, 
  ShowChartOutlined as ChartIcon,
  DownloadOutlined as DownloadIcon,
  DirectionsRunOutlined as RunningIcon,
  DirectionsBikeOutlined as BikeIcon,
  FitnessCenterOutlined as FitnessIcon,
  HotelOutlined as RestIcon,
  SpeedOutlined as SpeedIcon,
  AccessTimeOutlined as TimeIcon,
  LocalFireDepartmentOutlined as IntensityIcon,
  LoopOutlined as PhaseIcon,
  EventAvailableOutlined as ScheduleIcon
} from '@mui/icons-material';

/**
 * Composant pour afficher un plan d'entraînement généré
 * Optimisé avec React.memo pour éviter les re-renders inutiles
 * 
 * @param {Object} props - Les propriétés du composant
 * @param {Object} props.plan - Le plan d'entraînement à afficher
 * @param {Function} props.onExportPlan - Fonction pour exporter le plan en JSON
 * @param {Function} props.onAddToCalendar - Fonction pour ajouter le plan au calendrier
 */
const PlanDisplay = memo(({ plan, onExportPlan, onAddToCalendar }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  if (!plan) return null;

  // Fonction pour déterminer la couleur de l'indicateur de type de semaine
  const getWeekTypeColor = (type) => {
    switch (type) {
      case 'recovery': return 'info';
      case 'intensive': return 'error';
      case 'taper': return 'success';
      default: return 'primary';
    }
  };
  
  // Fonction pour obtenir l'icône de la séance d'entraînement
  const getWorkoutIcon = (workout) => {
    if (workout.toLowerCase().includes('rest') || workout.toLowerCase().includes('repos')) {
      return <RestIcon />;
    } else if (workout.toLowerCase().includes('interval') || workout.toLowerCase().includes('intervalle')) {
      return <IntensityIcon />;
    } else if (workout.toLowerCase().includes('strength') || workout.toLowerCase().includes('force')) {
      return <FitnessIcon />;
    } else {
      return <BikeIcon />;
    }
  };
  
  // Fonction pour calculer l'intensité relative d'une semaine
  const getWeekIntensity = (weekTSS, maxTSS) => {
    return (weekTSS / maxTSS) * 100;
  };
  
  // Calcul du TSS maximum pour le plan
  const maxTSS = useMemo(() => {
    return Math.max(...plan.weeks.map(week => week.tss));
  }, [plan.weeks]);

  return (
    <Box sx={{ mt: 1 }}>
      {/* Résumé du plan */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, height: '100%', borderTop: '4px solid', borderTopColor: 'primary.main' }}>
            <Stack spacing={1} alignItems="center" textAlign="center">
              <Avatar sx={{ bgcolor: 'primary.main', mb: 1 }}>
                <RunningIcon />
              </Avatar>
              <Typography variant="subtitle2" color="text.secondary">
                {t('training.goal')}
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {t(`training.goals.${plan.goal}`)}
              </Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, height: '100%', borderTop: '4px solid', borderTopColor: 'secondary.main' }}>
            <Stack spacing={1} alignItems="center" textAlign="center">
              <Avatar sx={{ bgcolor: 'secondary.main', mb: 1 }}>
                <PhaseIcon />
              </Avatar>
              <Typography variant="subtitle2" color="text.secondary">
                {t('training.level')}
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {t(`training.levels.${plan.level}`)}
              </Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, height: '100%', borderTop: '4px solid', borderTopColor: 'info.main' }}>
            <Stack spacing={1} alignItems="center" textAlign="center">
              <Avatar sx={{ bgcolor: 'info.main', mb: 1 }}>
                <CalendarIcon />
              </Avatar>
              <Typography variant="subtitle2" color="text.secondary">
                {t('training.duration')}
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {plan.weeks.length} {t('common.weeks')}
              </Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, height: '100%', borderTop: '4px solid', borderTopColor: 'success.main' }}>
            <Stack spacing={1} alignItems="center" textAlign="center">
              <Avatar sx={{ bgcolor: 'success.main', mb: 1 }}>
                <TimeIcon />
              </Avatar>
              <Typography variant="subtitle2" color="text.secondary">
                {t('training.weekly')}
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {plan.weeklyHours}h
              </Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* En-tête de la section hebdomadaire */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ScheduleIcon sx={{ mr: 1, color: 'text.secondary' }} />
          <Typography variant="h6" component="h3">
            {t('training.weeklyPlans')}
          </Typography>
        </Box>
        <Box>
          <Button
            size="small"
            startIcon={<DownloadIcon />}
            onClick={onExportPlan}
            sx={{ mr: 1 }}
          >
            {t('training.export')}
          </Button>
          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={<CalendarIcon />}
            onClick={onAddToCalendar}
          >
            {t('training.addToCalendar')}
          </Button>
        </Box>
      </Box>

      {/* Semaines du plan */}
      {plan.weeks.map((week) => (
        <Paper 
          key={week.week} 
          elevation={2}
          sx={{ 
            mb: 3,
            overflow: 'hidden',
            borderLeft: '6px solid',
            borderColor: theme => {
              const color = getWeekTypeColor(week.type);
              return theme.palette[color].main;
            }
          }}
        >
          <Box sx={{ px: 3, py: 1.5, bgcolor: 'grey.100' }}>
            <Grid container alignItems="center">
              <Grid item xs={12} md={7}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {t('training.week')} {week.week} - {t(`training.phases.${week.phase}`)}
                  </Typography>
                  <Chip 
                    label={t(`training.weekTypes.${week.type}`)}
                    size="small" 
                    color={getWeekTypeColor(week.type)}
                    sx={{ ml: 1 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={5}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <Tooltip title={t('training.tssTooltip')} placement="top">
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                      <SpeedIcon sx={{ mr: 0.5, fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2" fontWeight="medium">
                        TSS: {week.tss}
                      </Typography>
                    </Box>
                  </Tooltip>
                  <Tooltip title={t('training.intensityTooltip')} placement="top">
                    <Box sx={{ width: 120 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={getWeekIntensity(week.tss, maxTSS)} 
                        color={getWeekTypeColor(week.type)}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  </Tooltip>
                </Box>
              </Grid>
            </Grid>
          </Box>
          
          <Divider />
          
          <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
              {week.schedule.map((day, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 1.5, 
                      height: '100%',
                      borderLeft: '3px solid',
                      borderLeftColor: day.workout.toLowerCase().includes('rest') || day.workout.toLowerCase().includes('repos')
                        ? 'grey.400'
                        : theme.palette.primary.main
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" fontWeight="bold" color="text.secondary">
                        {day.day}
                      </Typography>
                      <Avatar 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          bgcolor: day.workout.toLowerCase().includes('rest') || day.workout.toLowerCase().includes('repos')
                            ? 'grey.300'
                            : 'primary.light'
                        }}
                      >
                        {getWorkoutIcon(day.workout)}
                      </Avatar>
                    </Box>
                    <Typography variant="body2">
                      {day.workout}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Paper>
      ))}
    </Box>
  );
});

export default PlanDisplay;
