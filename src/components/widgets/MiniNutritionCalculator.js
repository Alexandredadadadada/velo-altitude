import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, Slider, Grid, Tooltip, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';

// Styled components
const MacroBar = styled(Box)(({ theme, type }) => ({
  height: '10px',
  borderRadius: '4px',
  margin: '2px 0',
  background: type === 'proteins' ? '#FF5757' : 
              type === 'carbs' ? '#7ED957' : 
              type === 'fats' ? '#FFDE59' : '#5CE1E6',
  transition: 'width 0.5s ease'
}));

const IntensityDot = styled(Box)(({ theme, active }) => ({
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  background: active ? theme.palette.primary.main : theme.palette.grey[300],
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'scale(1.2)',
  }
}));

const StyledTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .MuiTooltip-tooltip`]: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    boxShadow: theme.shadows[1],
    border: `1px solid ${theme.palette.divider}`,
    padding: '4px 8px',
    fontSize: '0.7rem',
  },
}));

const MiniNutritionCalculator = ({ onClose }) => {
  const { t } = useTranslation();
  const [weight, setWeight] = useState(70);
  const [intensity, setIntensity] = useState(2); // 1-5 scale for workout intensity
  const [duration, setDuration] = useState(60); // Minutes

  // Calculate calories and macros based on weight, intensity, and duration
  const calculateNutrition = () => {
    // Base calories per kg per hour for cycling at different intensities
    const caloriesPerKgIntensity = [5, 7, 10, 13, 15];
    
    // Calculate total calories
    const hourlyCalories = weight * caloriesPerKgIntensity[intensity - 1];
    const totalCalories = Math.round(hourlyCalories * (duration / 60));
    
    // Calculate macros
    const carbsPercentage = 0.6 + (intensity * 0.05); // 65-85% based on intensity
    const proteinsPercentage = 0.15;
    const fatsPercentage = 1 - carbsPercentage - proteinsPercentage;
    
    const carbsGrams = Math.round((totalCalories * carbsPercentage) / 4); // 4 calories per gram
    const proteinsGrams = Math.round((totalCalories * proteinsPercentage) / 4);
    const fatsGrams = Math.round((totalCalories * fatsPercentage) / 9); // 9 calories per gram
    
    return {
      calories: totalCalories,
      carbs: carbsGrams,
      proteins: proteinsGrams,
      fats: fatsGrams,
      carbsPercentage,
      proteinsPercentage,
      fatsPercentage
    };
  };

  const nutrition = calculateNutrition();

  const handleWeightChange = (event, newValue) => {
    setWeight(newValue);
  };

  const handleDurationChange = (event, newValue) => {
    setDuration(newValue);
  };

  const handleIntensityChange = (value) => {
    setIntensity(value);
  };

  return (
    <Card sx={{ minWidth: 275, maxWidth: 350 }}>
      <CardContent sx={{ padding: 2 }}>
        <Typography variant="h6" component="div" gutterBottom>
          {t('quickNutrition')}
        </Typography>
        
        <Box sx={{ mt: 2, mb: 1 }}>
          <Typography variant="body2" gutterBottom>
            {t('weight')}: {weight} kg
          </Typography>
          <Slider
            value={weight}
            onChange={handleWeightChange}
            min={40}
            max={120}
            step={1}
            aria-label="Weight"
            size="small"
          />
        </Box>
        
        <Box sx={{ mt: 2, mb: 1 }}>
          <Typography variant="body2" gutterBottom>
            {t('duration')}: {duration} min
          </Typography>
          <Slider
            value={duration}
            onChange={handleDurationChange}
            min={15}
            max={240}
            step={5}
            aria-label="Duration"
            size="small"
          />
        </Box>
        
        <Box sx={{ mt: 2, mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            {t('intensity')}:
          </Typography>
          <Grid container spacing={1} justifyContent="space-between" sx={{ pl: 1, pr: 1 }}>
            {[1, 2, 3, 4, 5].map(level => (
              <Grid item key={level}>
                <StyledTooltip 
                  title={level === 1 ? t('recovery') : 
                         level === 2 ? t('endurance') : 
                         level === 3 ? t('tempo') : 
                         level === 4 ? t('threshold') : 
                         t('maximum')}
                  arrow
                >
                  <IntensityDot 
                    active={intensity >= level} 
                    onClick={() => handleIntensityChange(level)} 
                  />
                </StyledTooltip>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <LocalFireDepartmentIcon color="error" sx={{ mr: 1 }} />
          <Typography variant="body1" fontWeight="bold">
            {nutrition.calories} {t('calories')}
          </Typography>
        </Box>
        
        <Grid container spacing={1}>
          <Grid item xs={8}>
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption">
                {t('carbs')}: {nutrition.carbs}g
              </Typography>
              <MacroBar type="carbs" sx={{ width: `${nutrition.carbsPercentage * 100}%` }} />
            </Box>
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption">
                {t('proteins')}: {nutrition.proteins}g
              </Typography>
              <MacroBar type="proteins" sx={{ width: `${nutrition.proteinsPercentage * 100}%` }} />
            </Box>
            <Box>
              <Typography variant="caption">
                {t('fats')}: {nutrition.fats}g
              </Typography>
              <MacroBar type="fats" sx={{ width: `${nutrition.fatsPercentage * 100}%` }} />
            </Box>
          </Grid>
          <Grid item xs={4} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress 
                variant="determinate" 
                value={100} 
                size={60}
                thickness={4}
                sx={{ color: (theme) => theme.palette.grey[200] }}
              />
              <CircularProgress 
                variant="determinate" 
                value={75} 
                size={60}
                thickness={4}
                sx={{ 
                  color: '#7ED957',
                  position: 'absolute',
                  left: 0,
                }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DirectionsBikeIcon color="action" />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default MiniNutritionCalculator;
