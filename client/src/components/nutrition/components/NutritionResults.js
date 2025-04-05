import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Grid,
  Divider,
  Paper,
  Chip,
  LinearProgress,
  Stack,
  Skeleton,
  useMediaQuery,
  useTheme
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import GrainIcon from '@mui/icons-material/Grain';
import RiceBowlIcon from '@mui/icons-material/RiceBowl';
import OilBarrelIcon from '@mui/icons-material/OilBarrel';
import { PieChart } from '@mui/x-charts/PieChart';

/**
 * Composant pour afficher les résultats des calculs nutritionnels
 * 
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.calculatorResults - Résultats du calculateur nutritionnel
 * @param {boolean} props.loading - Indique si les données sont en cours de chargement
 */
const NutritionResults = memo(({ calculatorResults, loading = false }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  if (!calculatorResults && !loading) {
    return null;
  }
  
  // Utilisation des données réelles si disponibles, sinon des placeholders pour le chargement
  const dailyIntake = calculatorResults?.dailyIntake || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const macroRatio = calculatorResults?.macroRatio || { protein: 30, carbs: 50, fat: 20 };
  const profile = calculatorResults?.profile || { goal: 'performance', activityLevel: 'moderate' };
  
  // Données pour le graphique de répartition des macros
  const macroData = [
    { id: 0, value: macroRatio.protein, label: t('nutrition.macros.protein'), color: theme.palette.success.main },
    { id: 1, value: macroRatio.carbs, label: t('nutrition.macros.carbs'), color: theme.palette.primary.main },
    { id: 2, value: macroRatio.fat, label: t('nutrition.macros.fat'), color: theme.palette.warning.main }
  ];
  
  return (
    <Card 
      elevation={2}
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        height: '100%',
        opacity: loading ? 0.8 : 1
      }}
    >
      <CardHeader
        title={
          loading ? (
            <Skeleton variant="text" width="60%" height={32} />
          ) : (
            <Box display="flex" alignItems="center" component="h2">
              <RestaurantIcon sx={{ mr: 1 }} />
              <Typography variant="h6" component="span">
                {t('nutrition.results_title')}
              </Typography>
            </Box>
          )
        }
        subheader={
          loading ? (
            <Skeleton variant="text" width="80%" height={24} />
          ) : (
            t('nutrition.results_subtitle')
          )
        }
        sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          '& .MuiCardHeader-subheader': { 
            color: 'rgba(255, 255, 255, 0.8)' 
          },
          py: { xs: 1.5, sm: 2 },
          px: { xs: 2, sm: 3 }
        }}
      />
      
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Grid container spacing={3}>
          {/* Apport calorique journalier et répartition des macros */}
          <Grid item xs={12} md={7}>
            <Paper 
              elevation={0} 
              variant="outlined" 
              sx={{ 
                p: { xs: 2, sm: 3 }, 
                height: '100%',
                borderRadius: 1,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  borderColor: 'primary.main'
                }
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <WhatshotIcon color="error" />
                {loading ? (
                  <Skeleton variant="text" width="50%" height={28} />
                ) : (
                  <Typography 
                    variant="h6" 
                    component="h3"
                    id="daily-calories-title"
                  >
                    {t('nutrition.daily_calories')}
                  </Typography>
                )}
              </Stack>
              
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 2 
                }}
                aria-labelledby="daily-calories-title"
              >
                {loading ? (
                  <Skeleton variant="text" width="30%" height={60} />
                ) : (
                  <Typography 
                    variant="h3" 
                    component="p" 
                    color="primary" 
                    sx={{ 
                      mr: 2,
                      fontWeight: 'bold'
                    }}
                  >
                    {dailyIntake.calories}
                  </Typography>
                )}
                {loading ? (
                  <Skeleton variant="text" width="20%" height={24} />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    kcal / {t('nutrition.day')}
                  </Typography>
                )}
              </Box>
              
              {loading ? (
                <Skeleton variant="text" width="100%" height={60} />
              ) : (
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ mb: 3 }}
                >
                  {t('nutrition.goal_explanation', { 
                    goal: t(`nutrition.goals.${profile.goal}`),
                    activity: t(`nutrition.activity.${profile.activityLevel}`)
                  })}
                </Typography>
              )}
              
              <Divider sx={{ mb: 3 }} />
              
              <Typography 
                variant="subtitle1" 
                sx={{ mb: 2 }}
                id="macros-distribution-title"
              >
                {loading ? (
                  <Skeleton variant="text" width="60%" height={24} />
                ) : (
                  t('nutrition.macro_distribution')
                )}
              </Typography>
              
              <Box 
                sx={{ mb: 2 }}
                role="region"
                aria-labelledby="macros-distribution-title"
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <GrainIcon color="success" />
                  {loading ? (
                    <Skeleton variant="text" width="20%" height={24} />
                  ) : (
                    <Typography variant="body2">
                      {t('nutrition.macros.protein')}
                    </Typography>
                  )}
                  <Box sx={{ flexGrow: 1 }}>
                    {loading ? (
                      <Skeleton 
                        variant="rounded" 
                        height={8} 
                        width="100%" 
                        sx={{ borderRadius: 5 }}
                      />
                    ) : (
                      <LinearProgress 
                        variant="determinate" 
                        value={macroRatio.protein} 
                        color="success"
                        sx={{ 
                          height: 8, 
                          borderRadius: 5,
                          '.MuiLinearProgress-bar': {
                            transition: 'transform 1s ease-in-out'
                          }
                        }}
                        aria-label={`${t('nutrition.macros.protein')}: ${macroRatio.protein}%`}
                      />
                    )}
                  </Box>
                  {loading ? (
                    <Skeleton variant="text" width="20%" height={24} />
                  ) : (
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      aria-live="polite"
                    >
                      {dailyIntake.protein}g ({macroRatio.protein}%)
                    </Typography>
                  )}
                </Stack>
                
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <RiceBowlIcon color="primary" />
                  {loading ? (
                    <Skeleton variant="text" width="20%" height={24} />
                  ) : (
                    <Typography variant="body2">
                      {t('nutrition.macros.carbs')}
                    </Typography>
                  )}
                  <Box sx={{ flexGrow: 1 }}>
                    {loading ? (
                      <Skeleton 
                        variant="rounded" 
                        height={8}
                        width="100%" 
                        sx={{ borderRadius: 5 }}
                      />
                    ) : (
                      <LinearProgress 
                        variant="determinate" 
                        value={macroRatio.carbs} 
                        color="primary"
                        sx={{ 
                          height: 8, 
                          borderRadius: 5,
                          '.MuiLinearProgress-bar': {
                            transition: 'transform 1s ease-in-out'
                          }
                        }}
                        aria-label={`${t('nutrition.macros.carbs')}: ${macroRatio.carbs}%`}
                      />
                    )}
                  </Box>
                  {loading ? (
                    <Skeleton variant="text" width="20%" height={24} />
                  ) : (
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      aria-live="polite"
                    >
                      {dailyIntake.carbs}g ({macroRatio.carbs}%)
                    </Typography>
                  )}
                </Stack>
                
                <Stack direction="row" spacing={1} alignItems="center">
                  <OilBarrelIcon color="warning" />
                  {loading ? (
                    <Skeleton variant="text" width="20%" height={24} />
                  ) : (
                    <Typography variant="body2">
                      {t('nutrition.macros.fat')}
                    </Typography>
                  )}
                  <Box sx={{ flexGrow: 1 }}>
                    {loading ? (
                      <Skeleton 
                        variant="rounded" 
                        height={8} 
                        width="100%" 
                        sx={{ borderRadius: 5 }}
                      />
                    ) : (
                      <LinearProgress 
                        variant="determinate" 
                        value={macroRatio.fat} 
                        color="warning"
                        sx={{ 
                          height: 8, 
                          borderRadius: 5,
                          '.MuiLinearProgress-bar': {
                            transition: 'transform 1s ease-in-out'
                          }
                        }}
                        aria-label={`${t('nutrition.macros.fat')}: ${macroRatio.fat}%`}
                      />
                    )}
                  </Box>
                  {loading ? (
                    <Skeleton variant="text" width="20%" height={24} />
                  ) : (
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      aria-live="polite"
                    >
                      {dailyIntake.fat}g ({macroRatio.fat}%)
                    </Typography>
                  )}
                </Stack>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              {loading ? (
                <Skeleton variant="text" width="100%" height={60} />
              ) : (
                <Typography 
                  variant="subtitle2" 
                  color="text.secondary"
                >
                  {t('nutrition.results_explanation')}
                </Typography>
              )}
            </Paper>
          </Grid>
          
          {/* Graphique des macros et recommandations */}
          <Grid item xs={12} md={5}>
            <Paper 
              elevation={0} 
              variant="outlined" 
              sx={{ 
                p: { xs: 2, sm: 3 }, 
                height: '100%',
                borderRadius: 1,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  borderColor: 'primary.main'
                }
              }}
            >
              <Typography 
                variant="subtitle1" 
                gutterBottom
                id="macro-chart-title"
              >
                {loading ? (
                  <Skeleton variant="text" width="60%" height={24} />
                ) : (
                  t('nutrition.macro_chart')
                )}
              </Typography>
              
              <Box 
                sx={{ 
                  height: 200, 
                  mb: 2,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                aria-labelledby="macro-chart-title"
              >
                {loading ? (
                  <Skeleton 
                    variant="circular" 
                    width={180} 
                    height={180} 
                    sx={{ 
                      opacity: 0.7,
                      margin: '0 auto'
                    }}
                  />
                ) : (
                  <PieChart
                    series={[
                      {
                        data: macroData,
                        highlightScope: { faded: 'global', highlighted: 'item' },
                        faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                        innerRadius: 30,
                        paddingAngle: 2,
                        cornerRadius: 4,
                        arcLabel: (item) => `${item.value}%`,
                        arcLabelMinAngle: 20,
                      }
                    ]}
                    slotProps={{
                      legend: { hidden: true }
                    }}
                    height={200}
                    aria-label={t('nutrition.macro_chart')}
                    sx={{
                      '--ChartsLegend-rootOffsetX': '0px',
                      '--ChartsLegend-rootOffsetY': '0px',
                    }}
                  />
                )}
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                {loading ? (
                  <Stack direction="row" spacing={1}>
                    <Skeleton variant="rounded" width={80} height={32} />
                    <Skeleton variant="rounded" width={80} height={32} />
                    <Skeleton variant="rounded" width={80} height={32} />
                  </Stack>
                ) : (
                  <Stack 
                    direction="row" 
                    spacing={1}
                    flexWrap={isMobile ? 'wrap' : 'nowrap'}
                    justifyContent="center"
                    sx={{ gap: 1 }}
                  >
                    <Chip 
                      label={`${t('nutrition.macros.protein')} ${macroRatio.protein}%`}
                      color="success"
                      size="small"
                      aria-label={`${t('nutrition.macros.protein')}: ${macroRatio.protein}%`}
                    />
                    <Chip 
                      label={`${t('nutrition.macros.carbs')} ${macroRatio.carbs}%`}
                      color="primary"
                      size="small"
                      aria-label={`${t('nutrition.macros.carbs')}: ${macroRatio.carbs}%`}
                    />
                    <Chip 
                      label={`${t('nutrition.macros.fat')} ${macroRatio.fat}%`}
                      color="warning"
                      size="small"
                      aria-label={`${t('nutrition.macros.fat')}: ${macroRatio.fat}%`}
                    />
                  </Stack>
                )}
              </Box>
              
              <Typography 
                variant="subtitle2" 
                gutterBottom
                id="recommendations-title"
              >
                {loading ? (
                  <Skeleton variant="text" width="70%" height={24} />
                ) : (
                  `${t('nutrition.recommendations')}:`
                )}
              </Typography>
              
              <Box 
                sx={{ pl: 2 }}
                role="region"
                aria-labelledby="recommendations-title"
              >
                {loading ? (
                  <>
                    <Skeleton variant="text" width="90%" height={24} sx={{ mb: 1 }} />
                    <Skeleton variant="text" width="85%" height={24} sx={{ mb: 1 }} />
                    <Skeleton variant="text" width="80%" height={24} />
                  </>
                ) : (
                  <>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      • {t('nutrition.cycling_tip_1')}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      • {t('nutrition.cycling_tip_2')}
                    </Typography>
                    <Typography variant="body2">
                      • {t('nutrition.cycling_tip_3')}
                    </Typography>
                  </>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
});

export default NutritionResults;
