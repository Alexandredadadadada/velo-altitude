import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Card, 
  CardContent,
  CardActions,
  Button,
  Chip,
  LinearProgress,
  IconButton,
  Skeleton,
  Tooltip,
  Divider,
  useTheme,
  alpha,
  Avatar,
  Badge,
  Grid
} from '@mui/material';
import { 
  PlayArrow as PlayIcon,
  Edit as EditIcon,
  FitnessCenter,
  DirectionsBike,
  AccessTime,
  ShowChart,
  Bolt,
  MoreVert,
  Refresh,
  Timer,
  Favorite,
  WbSunny,
  CloudQueue,
  Opacity,
  Air,
  LocalFireDepartment,
  TrendingUp,
  BarChart
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Widget pour afficher l'entraînement du jour sur le dashboard
 * Permet de visualiser et démarrer rapidement la séance prévue
 */
const TodayTrainingWidget = ({ userProfile, stravaData }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [workoutStatus, setWorkoutStatus] = useState('pending'); // pending, completed, inProgress
  const [recentStats, setRecentStats] = useState({
    ftpChange: 0,
    tssAverage: 0,
    weeklyHours: 0,
    completionRate: 0
  });
  
  // Simuler le chargement des données
  useEffect(() => {
    setLoading(true);
    
    // Simule une requête API
    const fetchData = async () => {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Exemple de données d'entraînement
      const mockWorkout = {
        id: 'workout-123',
        name: 'Intervals VO2 Max + Travail de seuil',
        description: 'Séance mixte pour développer la VO2 Max et le seuil lactique',
        type: 'intervalsHigh',
        icon: <Bolt />,
        intensity: 8.5, // Sur 10
        duration: 75, // Minutes
        tss: 95, // Training Stress Score
        focus: ['VO2 Max', 'Seuil'],
        intervals: [
          { name: 'Échauffement', duration: 15, intensity: 'Z1-Z2', description: 'Progressif jusqu\'à Z2' },
          { name: 'Activation', duration: 5, intensity: 'Z3', description: '3x30s à 100-110rpm' },
          { name: 'Intervals VO2', duration: 20, intensity: 'Z5', description: '5x2min Z5 / 2min Z1' },
          { name: 'Récupération', duration: 5, intensity: 'Z1', description: 'Cadence légère' },
          { name: 'Seuil', duration: 20, intensity: 'Z4', description: '2x8min à Z4 / 4min Z2' },
          { name: 'Retour au calme', duration: 10, intensity: 'Z1', description: 'Cadence libre' }
        ],
        targetPower: userProfile?.ftp ? Math.round(userProfile.ftp * 0.9) : 200,
        zones: [
          { name: 'Z1', percentage: 15 },
          { name: 'Z2', percentage: 10 },
          { name: 'Z3', percentage: 5 },
          { name: 'Z4', percentage: 30 },
          { name: 'Z5', percentage: 40 }
        ],
        status: 'pending',
        weekProgress: 4, // 4/7 entraînements complétés cette semaine
        weekTotal: 7
      };
      
      // Statistiques récentes
      const stats = {
        ftpChange: +12, // +12 watts depuis le mois dernier
        tssAverage: 285, // TSS hebdomadaire moyen
        weeklyHours: 8.5, // Heures d'entraînement hebdomadaires
        completionRate: 0.85 // 85% des entraînements complétés
      };
      
      // Simulation des données météo
      const weatherData = {
        temperature: 18, // °C
        condition: 'Ensoleillé',
        icon: <WbSunny color="warning" />,
        wind: 12, // km/h
        humidity: 65, // %
        feelsLike: 17, // °C
        recommendation: "Conditions idéales pour un entraînement à haute intensité. N'oubliez pas de vous hydrater suffisamment."
      };

      // Données d'aperçu physiologique
      const physiologicalImpact = {
        cardiovascular: 85, // Impact sur le système cardiovasculaire (%)
        muscular: 70, // Impact musculaire (%)
        neuromuscular: 60, // Impact neuromusculaire (%)
        energySystems: { aerobic: 65, anaerobic: 35 }, // Répartition systèmes énergétiques (%)
        recovery: {
          expectedTSB: -25, // Training Stress Balance attendu
          recoveryTime: 36, // Heures de récupération estimées
        }
      };

      setTodayWorkout(mockWorkout);
      setRecentStats(stats);
      setWorkoutStatus(mockWorkout.status);
      setLoading(false);
    };
    
    fetchData();
  }, [userProfile]);
  
  // Navigation vers le module d'entraînement
  const handleStartWorkout = () => {
    navigate('/training/workout/' + todayWorkout.id);
  };
  
  // Navigation vers l'éditeur d'entraînement
  const handleEditWorkout = () => {
    navigate('/training/edit/' + todayWorkout.id);
  };
  
  // Animation variants
  const containerAnimation = {
    hidden: { opacity: 0 },
    show: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };
  
  const itemAnimation = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  // Rendu de la timeline des intervalles
  const renderIntervalTimeline = () => {
    if (!todayWorkout?.intervals) return null;
    
    const intervals = todayWorkout.intervals;
    
    // Calculer la durée totale pour les proportions
    const totalDuration = intervals.reduce((sum, interval) => sum + interval.duration, 0);
    
    return (
      <Box sx={{ width: '100%', mt: 2, mb: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Déroulement de la séance
        </Typography>
        <Box sx={{ display: 'flex', width: '100%', height: 40, borderRadius: 1, overflow: 'hidden' }}>
          {intervals.map((interval, index) => {
            // Déterminer la couleur basée sur l'intensité
            const getColorFromZone = (zoneText) => {
              if (zoneText.includes('Z1')) return '#4caf50';
              if (zoneText.includes('Z2')) return '#8bc34a';
              if (zoneText.includes('Z3')) return '#ffeb3b';
              if (zoneText.includes('Z4')) return '#ff9800';
              if (zoneText.includes('Z5')) return '#f44336';
              if (zoneText.includes('Z6')) return '#9c27b0';
              if (zoneText.includes('Z7')) return '#3f51b5';
              return '#78909c';
            };
            
            const bgColor = getColorFromZone(interval.intensity);
            const width = `${(interval.duration / totalDuration) * 100}%`;
            
            return (
              <Tooltip 
                key={`interval-${index}`}
                title={
                  <Box sx={{ p: 1 }}>
                    <Typography variant="subtitle2">{interval.name}</Typography>
                    <Typography variant="body2">{interval.duration} min - {interval.intensity}</Typography>
                    <Typography variant="body2">{interval.description}</Typography>
                  </Box>
                }
                arrow
              >
                <Box
                  component={motion.div}
                  whileHover={{ 
                    y: -3,
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                  }}
                  sx={{
                    width,
                    height: '100%',
                    bgcolor: bgColor,
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'white', 
                      fontWeight: 'bold',
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                      display: interval.duration > 10 ? 'block' : 'none'
                    }}
                  >
                    {interval.duration}'
                  </Typography>
                </Box>
              </Tooltip>
            );
          })}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            0:00
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {Math.floor(totalDuration / 60)}:{totalDuration % 60 < 10 ? '0' : ''}{totalDuration % 60}
          </Typography>
        </Box>
      </Box>
    );
  };

  // Rendu de l'aperçu physiologique
  const renderPhysiologicalPreview = () => {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Impact physiologique attendu
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Favorite sx={{ fontSize: '0.875rem', mr: 0.5, color: '#e53935' }} />
                <Typography variant="caption" sx={{ fontWeight: 'medium' }}>Cardiovasculaire</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={physiologicalImpact.cardiovascular}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: alpha('#e53935', 0.2),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#e53935',
                  }
                }}
              />
            </Box>
            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <FitnessCenter sx={{ fontSize: '0.875rem', mr: 0.5, color: '#7b1fa2' }} />
                <Typography variant="caption" sx={{ fontWeight: 'medium' }}>Musculaire</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={physiologicalImpact.muscular}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: alpha('#7b1fa2', 0.2),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#7b1fa2',
                  }
                }}
              />
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Bolt sx={{ fontSize: '0.875rem', mr: 0.5, color: '#ff9800' }} />
                <Typography variant="caption" sx={{ fontWeight: 'medium' }}>Neuromusculaire</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={physiologicalImpact.neuromuscular}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: alpha('#ff9800', 0.2),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#ff9800',
                  }
                }}
              />
            </Box>
            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <LocalFireDepartment sx={{ fontSize: '0.875rem', mr: 0.5, color: '#f44336' }} />
                <Typography variant="caption" sx={{ fontWeight: 'medium' }}>Temps récupération</Typography>
              </Box>
              <Tooltip title={`~${physiologicalImpact.recovery.recoveryTime}h de récupération`}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {Array(3).fill(0).map((_, i) => (
                    <Box 
                      key={i}
                      sx={{
                        width: 8,
                        height: 16,
                        bgcolor: i < Math.ceil(physiologicalImpact.recovery.recoveryTime / 24) 
                          ? '#f44336' 
                          : alpha('#f44336', 0.2),
                        borderRadius: 0.5,
                        mr: 0.5
                      }}
                    />
                  ))}
                </Box>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
        
        {/* Répartition énergétique */}
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <Box sx={{ flex: 1, mr: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Aérobie
            </Typography>
            <Box 
              sx={{ 
                height: 4, 
                width: '100%', 
                bgcolor: alpha(theme.palette.info.main, 0.2),
                borderRadius: 1,
                overflow: 'hidden'
              }}
            >
              <Box 
                sx={{ 
                  height: '100%', 
                  width: `${physiologicalImpact.energySystems.aerobic}%`, 
                  bgcolor: theme.palette.info.main,
                  borderRadius: 1
                }}
              />
            </Box>
          </Box>
          <Box sx={{ width: 24, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">VS</Typography>
          </Box>
          <Box sx={{ flex: 1, ml: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right' }}>
              Anaérobie
            </Typography>
            <Box 
              sx={{ 
                height: 4, 
                width: '100%', 
                bgcolor: alpha(theme.palette.error.main, 0.2),
                borderRadius: 1,
                overflow: 'hidden'
              }}
            >
              <Box 
                sx={{ 
                  height: '100%', 
                  width: `${physiologicalImpact.energySystems.anaerobic}%`, 
                  bgcolor: theme.palette.error.main,
                  borderRadius: 1,
                  ml: 'auto'
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    );
  };

  // Rendu des conditions météo
  const renderWeatherInfo = () => {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          p: 1.5,
          mt: 2,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.background.paper, 0.5)
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            sx={{ 
              width: 40, 
              height: 40, 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main
            }}
          >
            {weatherData.icon}
          </Avatar>
          <Box sx={{ ml: 1.5 }}>
            <Typography variant="subtitle2">
              {weatherData.temperature}°C
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {weatherData.condition}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex' }}>
          <Tooltip title="Vent">
            <Box sx={{ textAlign: 'center', mx: 1 }}>
              <Air sx={{ fontSize: '1rem', color: 'text.secondary' }} />
              <Typography variant="caption" display="block">
                {weatherData.wind} km/h
              </Typography>
            </Box>
          </Tooltip>
          <Tooltip title="Humidité">
            <Box sx={{ textAlign: 'center', mx: 1 }}>
              <Opacity sx={{ fontSize: '1rem', color: 'text.secondary' }} />
              <Typography variant="caption" display="block">
                {weatherData.humidity}%
              </Typography>
            </Box>
          </Tooltip>
        </Box>
      </Box>
    );
  };

  // Afficher le chargement
  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          height: '100%',
          bgcolor: alpha(theme.palette.background.paper, 0.7),
          backdropFilter: 'blur(10px)'
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6">
            <Skeleton width={150} />
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <Skeleton width={220} />
          </Typography>
        </Box>
        
        <Box sx={{ p: 2 }}>
          <Skeleton variant="rectangular" height={130} sx={{ borderRadius: 1, mb: 2 }} />
          
          <Box sx={{ display: 'flex', mb: 2 }}>
            <Skeleton variant="circular" width={40} height={40} sx={{ mr: 1 }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton width="60%" />
              <Skeleton width="40%" />
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Skeleton width={100} height={35} />
            <Skeleton width={100} height={35} />
          </Box>
        </Box>
      </Paper>
    );
  }
  
  // Aucun entraînement prévu
  if (!todayWorkout) {
    return (
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          height: '100%',
          bgcolor: alpha(theme.palette.background.paper, 0.7),
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 3
        }}
      >
        <FitnessCenter sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom textAlign="center">
          Aucun entraînement prévu aujourd'hui
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" paragraph>
          Profitez de cette journée de récupération ou planifiez une séance.
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<EditIcon />}
          onClick={() => navigate('/training/planner')}
        >
          Planifier un entraînement
        </Button>
      </Paper>
    );
  }
  
  // Calcul de la durée totale
  const totalMinutes = todayWorkout.intervals.reduce((sum, interval) => sum + interval.duration, 0);
  
  return (
    <motion.div
      variants={containerAnimation}
      initial="hidden"
      animate="show"
      style={{ height: '100%' }}
    >
      <Paper
        component={motion.div}
        elevation={0}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          height: '100%',
          position: 'relative',
          bgcolor: alpha(theme.palette.background.paper, 0.7),
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* Entête avec badge d'intensité */}
        <Box
          sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: theme.palette.background.paper,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {todayWorkout.icon}
                </Box>
              }
            >
              <Avatar
                sx={{
                  bgcolor: theme.palette.primary.main,
                  width: 40,
                  height: 40
                }}
              >
                <DirectionsBike />
              </Avatar>
            </Badge>
            <Box sx={{ ml: 2 }}>
              <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                Entraînement du jour
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTime sx={{ fontSize: '0.875rem', mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {todayWorkout.duration} min
                </Typography>
                <Box 
                  sx={{ 
                    display: 'inline-block', 
                    width: 4, 
                    height: 4, 
                    borderRadius: '50%', 
                    bgcolor: 'text.disabled',
                    mx: 0.8
                  }} 
                />
                <ShowChart sx={{ fontSize: '0.875rem', mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  TSS {todayWorkout.tss}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Box>
            <Chip
              label={`${todayWorkout.weekProgress}/${todayWorkout.weekTotal}`}
              size="small"
              color="primary"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
        </Box>
        
        <CardContent>
          <motion.div variants={itemAnimation}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              {todayWorkout.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {todayWorkout.description}
            </Typography>
            
            {/* Focus de l'entraînement */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {todayWorkout.focus.map((focus, index) => (
                <Chip
                  key={index}
                  label={focus}
                  size="small"
                  icon={focus.includes('VO2') ? <Bolt sx={{ fontSize: '1rem' }} /> : <TrendingUp sx={{ fontSize: '1rem' }} />}
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    fontWeight: 'medium'
                  }}
                />
              ))}
            </Box>
            
            {/* Déroulement de la séance - Nouvelle visualisation animée */}
            {renderIntervalTimeline()}
            
            {/* Météo - Nouveau */}
            {renderWeatherInfo()}
            
            {/* Aperçu physiologique - Nouveau */}
            {renderPhysiologicalPreview()}
          </motion.div>
          
          <Divider sx={{ my: 2 }} />
          
          <motion.div variants={itemAnimation}>
            <Typography variant="subtitle2" gutterBottom>
              Intensité par zones
            </Typography>
            <Box sx={{ mt: 1, mb: 0.5, position: 'relative', height: 20 }}>
              <Box 
                sx={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  borderRadius: 1,
                  overflow: 'hidden'
                }}
              >
                {todayWorkout.zones.map((zone, index) => (
                  <Box
                    key={index}
                    component={motion.div}
                    initial={{ width: 0 }}
                    animate={{ width: `${zone.percentage}%` }}
                    transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                    sx={{
                      height: '100%',
                      bgcolor: 
                        zone.name === 'Z1' ? '#4caf50' :
                        zone.name === 'Z2' ? '#8bc34a' :
                        zone.name === 'Z3' ? '#ffeb3b' :
                        zone.name === 'Z4' ? '#ff9800' :
                        zone.name === 'Z5' ? '#f44336' :
                        zone.name === 'Z6' ? '#9c27b0' :
                        zone.name === 'Z7' ? '#3f51b5' : 'grey'
                    }}
                  />
                ))}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                Récupération
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Max
              </Typography>
            </Box>
          </motion.div>
          
          <Divider sx={{ my: 2 }} />
          
          <motion.div variants={itemAnimation}>
            <Typography variant="subtitle2" gutterBottom>
              Progression récente
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Tooltip title="Évolution FTP sur 30 jours">
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography 
                    variant="h6" 
                    color={recentStats.ftpChange > 0 ? 'success.main' : 'error.main'}
                    sx={{ fontWeight: 'bold' }}
                  >
                    {recentStats.ftpChange > 0 ? '+' : ''}{recentStats.ftpChange}W
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    FTP
                  </Typography>
                </Box>
              </Tooltip>
              
              <Tooltip title="TSS hebdomadaire moyen">
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {recentStats.tssAverage}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    TSS
                  </Typography>
                </Box>
              </Tooltip>
              
              <Tooltip title="Heures d'entraînement hebdomadaires">
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {recentStats.weeklyHours}h
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Volume
                  </Typography>
                </Box>
              </Tooltip>
              
              <Tooltip title="Taux de complétion des entraînements">
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {Math.round(recentStats.completionRate * 100)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Complétion
                  </Typography>
                </Box>
              </Tooltip>
            </Box>
          </motion.div>
        </CardContent>
        
        {/* Actions */}
        <CardActions 
          sx={{ 
            p: 2, 
            pt: 0,
            display: 'flex', 
            justifyContent: 'space-between',
            borderTop: `1px solid ${theme.palette.divider}`
          }}
        >
          <Box>
            <Button
              size="small"
              startIcon={<EditIcon />}
              onClick={handleEditWorkout}
            >
              Modifier
            </Button>
          </Box>
          
          <Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayIcon />}
              onClick={handleStartWorkout}
              sx={{
                px: 3,
                '&:hover': {
                  boxShadow: `0 4px 10px ${alpha(theme.palette.primary.main, 0.4)}`
                }
              }}
            >
              Démarrer
            </Button>
          </Box>
        </CardActions>
      </Paper>
    </motion.div>
  );
};

export default TodayTrainingWidget;
