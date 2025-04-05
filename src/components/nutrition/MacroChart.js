import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Chart from 'chart.js/auto';
import { Card, CardContent, Typography, Box, Grid, Slider, IconButton, Tooltip } from '@mui/material';
import { RestaurantMenu, EggAlt, Cake, InfoOutlined } from '@mui/icons-material';
import AnimatedTransition from '../common/AnimatedTransition';

/**
 * MacroChart Component
 * Visualizes macronutrient distribution with interactive adjustment capabilities
 */
const MacroChart = ({ 
  macros, 
  onMacroChange, 
  calorieTarget,
  editable = true,
  className = '' 
}) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  // Standardize macro input format if needed
  const standardizedMacros = {
    carbs: {
      percentage: typeof macros.carbs === 'object' ? macros.carbs.percentage : macros.carbs,
      grams: typeof macros.carbs === 'object' ? macros.carbs.grams : 
        Math.round((calorieTarget * (macros.carbs / 100)) / 4) // 4 calories per gram of carbs
    },
    protein: {
      percentage: typeof macros.protein === 'object' ? macros.protein.percentage : macros.protein,
      grams: typeof macros.protein === 'object' ? macros.protein.grams : 
        Math.round((calorieTarget * (macros.protein / 100)) / 4) // 4 calories per gram of protein
    },
    fat: {
      percentage: typeof macros.fat === 'object' ? macros.fat.percentage : macros.fat,
      grams: typeof macros.fat === 'object' ? macros.fat.grams : 
        Math.round((calorieTarget * (macros.fat / 100)) / 9) // 9 calories per gram of fat
    }
  };
  
  // Create and update chart when macros change
  useEffect(() => {
    if (!chartRef.current) return;
    
    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    // Chart configuration
    const chartConfig = {
      type: 'doughnut',
      data: {
        labels: ['Glucides', 'Protéines', 'Lipides'],
        datasets: [{
          data: [
            standardizedMacros.carbs.percentage, 
            standardizedMacros.protein.percentage, 
            standardizedMacros.fat.percentage
          ],
          backgroundColor: [
            'rgba(54, 162, 235, 0.8)', // Blue for carbs
            'rgba(255, 99, 132, 0.8)', // Red for protein
            'rgba(255, 206, 86, 0.8)'  // Yellow for fat
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: {
                size: 14
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (tooltipItem) => {
                const macro = ['carbs', 'protein', 'fat'][tooltipItem.dataIndex];
                return `${tooltipItem.label}: ${tooltipItem.raw}% (${standardizedMacros[macro].grams}g)`;
              }
            }
          }
        },
        layout: {
          padding: 5
        },
        animations: {
          tension: {
            duration: 1000,
            easing: 'easeOutQuad',
            from: 0.8,
            to: 0,
            loop: false
          }
        }
      }
    };
    
    // Create chart
    chartInstance.current = new Chart(chartRef.current, chartConfig);
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [standardizedMacros.carbs.percentage, standardizedMacros.protein.percentage, standardizedMacros.fat.percentage, calorieTarget]);
  
  // Handle macro adjustment
  const handleMacroChange = (macro, value) => {
    if (!editable || !onMacroChange) return;
    
    // Calculate new percentages ensuring they sum to 100%
    const delta = value - standardizedMacros[macro].percentage;
    const otherMacros = ['carbs', 'protein', 'fat'].filter(m => m !== macro);
    
    const newPercentages = {
      ...standardizedMacros,
      [macro]: {
        ...standardizedMacros[macro],
        percentage: value
      }
    };
    
    // Distribute the change proportionally among other macros
    const sum = otherMacros.reduce((acc, m) => acc + standardizedMacros[m].percentage, 0);
    
    if (sum > 0) {
      otherMacros.forEach(m => {
        const proportion = standardizedMacros[m].percentage / sum;
        newPercentages[m] = {
          ...standardizedMacros[m],
          percentage: Math.max(5, standardizedMacros[m].percentage - delta * proportion)
        };
      });
    }
    
    // Ensure all percentages add up to 100% (adjust the last one if needed)
    const totalPercentage = newPercentages.carbs.percentage + 
                           newPercentages.protein.percentage + 
                           newPercentages.fat.percentage;
    
    if (Math.abs(totalPercentage - 100) > 0.5) {
      const lastMacro = otherMacros[1];
      newPercentages[lastMacro].percentage = Math.max(5, 
        100 - newPercentages[macro].percentage - newPercentages[otherMacros[0]].percentage
      );
    }
    
    // Calculate grams based on percentages
    newPercentages.carbs.grams = Math.round((calorieTarget * (newPercentages.carbs.percentage / 100)) / 4);
    newPercentages.protein.grams = Math.round((calorieTarget * (newPercentages.protein.percentage / 100)) / 4);
    newPercentages.fat.grams = Math.round((calorieTarget * (newPercentages.fat.percentage / 100)) / 9);
    
    // Update macros
    onMacroChange(newPercentages);
  };
  
  // Calculate total calories from macros
  const calculateCaloriesFromMacros = () => {
    const carbCalories = standardizedMacros.carbs.grams * 4;
    const proteinCalories = standardizedMacros.protein.grams * 4;
    const fatCalories = standardizedMacros.fat.grams * 9;
    
    return carbCalories + proteinCalories + fatCalories;
  };
  
  const totalCalories = calculateCaloriesFromMacros();
  const calorieDeviation = Math.abs(totalCalories - calorieTarget);
  const calorieAccuracy = 100 - Math.min(100, (calorieDeviation / calorieTarget) * 100);
  
  return (
    <AnimatedTransition type="fade-up">
      <Card className={`macro-chart-card ${className}`} elevation={2}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="h2">
              Répartition des Macronutriments
            </Typography>
            <Tooltip title="Les macronutriments sont les nutriments dont votre corps a besoin en grande quantité: glucides, protéines et lipides.">
              <IconButton size="small">
                <InfoOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Box sx={{ height: 200, position: 'relative', mb: 3 }}>
            <canvas ref={chartRef} />
            <Box 
              sx={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)',
                textAlign: 'center'
              }}
            >
              <Typography variant="h6">{calorieTarget}</Typography>
              <Typography variant="body2" color="text.secondary">kcal</Typography>
            </Box>
          </Box>
          
          <Grid container spacing={3}>
            {/* Carbs */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <RestaurantMenu sx={{ color: 'rgba(54, 162, 235, 0.8)', mr: 1 }} />
                <Typography variant="body1" component="div" sx={{ flexGrow: 1 }}>
                  Glucides
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {standardizedMacros.carbs.percentage}% ({standardizedMacros.carbs.grams}g)
                </Typography>
              </Box>
              {editable ? (
                <Slider
                  value={standardizedMacros.carbs.percentage}
                  onChange={(_, value) => handleMacroChange('carbs', value)}
                  aria-labelledby="carbs-slider"
                  min={10}
                  max={75}
                  step={1}
                  sx={{ 
                    color: 'rgba(54, 162, 235, 0.8)',
                    '& .MuiSlider-thumb': {
                      height: 20,
                      width: 20,
                    },
                    '& .MuiSlider-track': {
                      height: 8,
                    },
                    '& .MuiSlider-rail': {
                      height: 8,
                    }
                  }}
                />
              ) : (
                <Box 
                  sx={{
                    width: '100%',
                    height: 8,
                    bgcolor: 'rgba(0, 0, 0, 0.1)',
                    borderRadius: 4,
                    position: 'relative',
                    mb: 2
                  }}
                >
                  <Box 
                    sx={{
                      position: 'absolute',
                      height: '100%',
                      borderRadius: 4,
                      bgcolor: 'rgba(54, 162, 235, 0.8)',
                      width: `${standardizedMacros.carbs.percentage}%`
                    }}
                  />
                </Box>
              )}
            </Grid>
            
            {/* Protein */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <EggAlt sx={{ color: 'rgba(255, 99, 132, 0.8)', mr: 1 }} />
                <Typography variant="body1" component="div" sx={{ flexGrow: 1 }}>
                  Protéines
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {standardizedMacros.protein.percentage}% ({standardizedMacros.protein.grams}g)
                </Typography>
              </Box>
              {editable ? (
                <Slider
                  value={standardizedMacros.protein.percentage}
                  onChange={(_, value) => handleMacroChange('protein', value)}
                  aria-labelledby="protein-slider"
                  min={10}
                  max={50}
                  step={1}
                  sx={{ 
                    color: 'rgba(255, 99, 132, 0.8)',
                    '& .MuiSlider-thumb': {
                      height: 20,
                      width: 20,
                    },
                    '& .MuiSlider-track': {
                      height: 8,
                    },
                    '& .MuiSlider-rail': {
                      height: 8,
                    }
                  }}
                />
              ) : (
                <Box 
                  sx={{
                    width: '100%',
                    height: 8,
                    bgcolor: 'rgba(0, 0, 0, 0.1)',
                    borderRadius: 4,
                    position: 'relative',
                    mb: 2
                  }}
                >
                  <Box 
                    sx={{
                      position: 'absolute',
                      height: '100%',
                      borderRadius: 4,
                      bgcolor: 'rgba(255, 99, 132, 0.8)',
                      width: `${standardizedMacros.protein.percentage}%`
                    }}
                  />
                </Box>
              )}
            </Grid>
            
            {/* Fat */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Cake sx={{ color: 'rgba(255, 206, 86, 0.8)', mr: 1 }} />
                <Typography variant="body1" component="div" sx={{ flexGrow: 1 }}>
                  Lipides
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {standardizedMacros.fat.percentage}% ({standardizedMacros.fat.grams}g)
                </Typography>
              </Box>
              {editable ? (
                <Slider
                  value={standardizedMacros.fat.percentage}
                  onChange={(_, value) => handleMacroChange('fat', value)}
                  aria-labelledby="fat-slider"
                  min={10}
                  max={40}
                  step={1}
                  sx={{ 
                    color: 'rgba(255, 206, 86, 0.8)',
                    '& .MuiSlider-thumb': {
                      height: 20,
                      width: 20,
                    },
                    '& .MuiSlider-track': {
                      height: 8,
                    },
                    '& .MuiSlider-rail': {
                      height: 8,
                    }
                  }}
                />
              ) : (
                <Box 
                  sx={{
                    width: '100%',
                    height: 8,
                    bgcolor: 'rgba(0, 0, 0, 0.1)',
                    borderRadius: 4,
                    position: 'relative',
                    mb: 2
                  }}
                >
                  <Box 
                    sx={{
                      position: 'absolute',
                      height: '100%',
                      borderRadius: 4,
                      bgcolor: 'rgba(255, 206, 86, 0.8)',
                      width: `${standardizedMacros.fat.percentage}%`
                    }}
                  />
                </Box>
              )}
            </Grid>
            
            {/* Calorie accuracy indicator */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Total: {totalCalories} kcal sur {calorieTarget} kcal
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: calorieAccuracy > 98 ? 'success.main' : 'warning.main'
                  }}
                >
                  {calorieAccuracy.toFixed(1)}% précision
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </AnimatedTransition>
  );
};

MacroChart.propTypes = {
  macros: PropTypes.shape({
    carbs: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.shape({
        percentage: PropTypes.number.isRequired,
        grams: PropTypes.number.isRequired
      })
    ]).isRequired,
    protein: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.shape({
        percentage: PropTypes.number.isRequired,
        grams: PropTypes.number.isRequired
      })
    ]).isRequired,
    fat: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.shape({
        percentage: PropTypes.number.isRequired,
        grams: PropTypes.number.isRequired
      })
    ]).isRequired
  }).isRequired,
  onMacroChange: PropTypes.func,
  calorieTarget: PropTypes.number.isRequired,
  editable: PropTypes.bool,
  className: PropTypes.string
};

export default MacroChart;
