import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Divider, 
  Chip,
  Button,
  Slider,
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material';
import { 
  DirectionsBike, 
  Speed, 
  Timer, 
  TrendingUp,
  FitnessCenter
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'react-lottie-player';

// Note: Ces imports seraient remplacés par les animations réelles
// Ils sont utilisés ici à titre d'exemple
import cadenceAnimation from '../../../assets/animations/cadence_animation.json';
import sprintAnimation from '../../../assets/animations/sprint_animation.json';
import climbingAnimation from '../../../assets/animations/climbing_animation.json';
import enduranceAnimation from '../../../assets/animations/endurance_animation.json';
import thresholdAnimation from '../../../assets/animations/threshold_animation.json';
import recoveryAnimation from '../../../assets/animations/recovery_animation.json';
import vo2maxAnimation from '../../../assets/animations/vo2max_animation.json';

/**
 * Composant d'animation d'exercices spécifiques pour chaque zone d'entraînement
 * Fournit des visualisations interactives des différents types d'efforts
 */
const ExerciseAnimation = ({ zone, ftp }) => {
  const theme = useTheme();
  const [activeExercise, setActiveExercise] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [loading, setLoading] = useState(true);
  const animationRef = useRef(null);
  
  // Données des exercices spécifiques selon la zone
  const getZoneExercises = () => {
    // Exercices de base présents dans toutes les zones
    const baseExercises = [
      {
        id: 'position',
        name: 'Position optimale',
        description: 'Maintenir une position aérodynamique adaptée à l\'intensité',
        animation: enduranceAnimation,
        tips: [
          'Garder le dos droit mais détendu',
          'Coudes légèrement fléchis pour absorber les vibrations',
          'Regard porté à 10-15m devant vous',
          'Épaules relâchées'
        ],
        parameters: {
          cadence: zone.id <= 2 ? '85-95 rpm' : '70-85 rpm',
          position: zone.id <= 3 ? 'Haut du guidon' : 'Bas du guidon',
          grip: 'Détendue'
        }
      }
    ];
    
    // Exercices spécifiques selon la zone
    const specificExercises = {
      1: [
        {
          id: 'recovery_spin',
          name: 'Pédalage de récupération',
          description: 'Pédalage fluide à cadence élevée et faible résistance',
          animation: recoveryAnimation,
          tips: [
            'Cadence élevée (95-105 rpm)',
            'Résistance minimale',
            'Focus sur la fluidité du mouvement',
            'Respiration profonde et régulière'
          ],
          parameters: {
            cadence: '95-105 rpm',
            position: 'Relaxée',
            duration: '20-60 minutes'
          }
        }
      ],
      2: [
        {
          id: 'endurance_tempo',
          name: 'Tempo d\'endurance',
          description: 'Pédalage régulier à cadence modérée pour développer l\'endurance aérobie',
          animation: enduranceAnimation,
          tips: [
            'Maintenir une cadence régulière (85-95 rpm)',
            'Respiration contrôlée',
            'Concentrez-vous sur l\'efficacité du pédalage',
            'Alternez position assise et danseuse sur les longues sorties'
          ],
          parameters: {
            cadence: '85-95 rpm',
            position: 'Confortable',
            duration: '1-5 heures'
          }
        }
      ],
      3: [
        {
          id: 'tempo_climbing',
          name: 'Montée à tempo',
          description: 'Effort soutenu en montée à puissance constante',
          animation: climbingAnimation,
          tips: [
            'Maintenir une puissance constante',
            'Adapter la cadence à la pente (70-85 rpm)',
            'Position assise pour les pentes modérées',
            'Contrôler la respiration et éviter l\'hyperventilation'
          ],
          parameters: {
            cadence: '70-85 rpm',
            position: 'Assis avec mains en haut du guidon',
            duration: '10-30 minutes'
          }
        }
      ],
      4: [
        {
          id: 'threshold_intervals',
          name: 'Intervals au seuil',
          description: 'Effort intense au niveau du seuil lactique',
          animation: thresholdAnimation,
          tips: [
            'Maintenir une puissance constante juste en dessous du point de rupture',
            'Respiration profonde et contrôlée',
            'Concentration sur le maintien de l\'effort',
            'Position stable et aérodynamique'
          ],
          parameters: {
            cadence: '85-95 rpm',
            position: 'Bas du guidon',
            duration: '5-20 minutes par interval'
          }
        }
      ],
      5: [
        {
          id: 'vo2max_bursts',
          name: 'Bursts VO2 Max',
          description: 'Efforts courts et très intenses pour développer la VO2 Max',
          animation: vo2maxAnimation,
          tips: [
            'Effort explosif et maximal',
            'Respiration maximale',
            'Récupération complète entre les efforts',
            'Position stable malgré l\'intensité'
          ],
          parameters: {
            cadence: '90-110 rpm',
            position: 'Dynamique, bas du guidon',
            duration: '1-5 minutes par interval'
          }
        }
      ],
      6: [
        {
          id: 'anaerobic_capacity',
          name: 'Capacité anaérobie',
          description: 'Efforts très courts et ultra-intenses pour développer la puissance anaérobie',
          animation: sprintAnimation,
          tips: [
            'Explosivité maximale',
            'Engager tout le corps dans l\'effort',
            'Récupération complète entre les efforts',
            'Technique de sprint avec mains aux cocottes'
          ],
          parameters: {
            cadence: '100-120+ rpm',
            position: 'Dynamique, mains aux cocottes',
            duration: '30s-2min par interval'
          }
        }
      ],
      7: [
        {
          id: 'neuromuscular_sprint',
          name: 'Sprint neuromusculaire',
          description: 'Sprints explosifs maximaux pour développer la force maximale et la coordination',
          animation: sprintAnimation,
          tips: [
            'Explosivité absolue',
            'Coordination maximale',
            'Technique parfaite avec corps dynamique',
            'Récupération très longue entre efforts'
          ],
          parameters: {
            cadence: '110-130+ rpm',
            position: 'Sprint, en danseuse',
            duration: '5-15 secondes par sprint'
          }
        }
      ]
    };
    
    // Exercices de cadence présents dans toutes les zones
    const cadenceExercises = {
      id: 'cadence_drills',
      name: 'Travail de cadence',
      description: `Travail de cadence spécifique pour la zone ${zone.id}`,
      animation: cadenceAnimation,
      tips: [
        zone.id <= 2 ? 'Focus sur cadence élevée (100+ rpm)' : 'Alternance cadence haute/basse',
        'Maintenir la fluidité du pédalage',
        'Éviter les rebonds en danseuse',
        'Limiter le mouvement du haut du corps'
      ],
      parameters: {
        cadence: zone.id <= 3 ? '95-110 rpm' : '70-100 rpm variable',
        position: zone.id <= 2 ? 'Assis, haut du guidon' : 'Variable',
        duration: '5-15 minutes'
      }
    };
    
    // Combiner les exercices
    return [...baseExercises, ...(specificExercises[zone.id] || []), cadenceExercises];
  };
  
  const exercises = getZoneExercises();
  
  // Simuler le chargement de l'animation
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [zone, activeExercise]);
  
  // Contrôle de l'animation
  const handlePlayPause = () => {
    setPlaying(!playing);
  };
  
  const handleSpeedChange = (event, newValue) => {
    setSpeed(newValue);
  };
  
  const handleExerciseChange = (index) => {
    setActiveExercise(index);
    setPlaying(true);
  };
  
  // Animation pour les transitions
  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    },
    exit: { 
      opacity: 0, 
      y: -10,
      transition: { duration: 0.3 }
    }
  };
  
  const currentExercise = exercises[activeExercise];
  
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={7}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 0, 
            overflow: 'hidden',
            borderRadius: 2,
            bgcolor: alpha(theme.palette.background.paper, 0.6),
            height: '100%',
            position: 'relative'
          }}
        >
          {loading ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              height: '100%',
              minHeight: 400
            }}>
              <CircularProgress size={60} sx={{ color: zone.color }} />
            </Box>
          ) : (
            <Box 
              sx={{ 
                position: 'relative', 
                height: '100%',
                minHeight: 400,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                bgcolor: alpha(zone.color, 0.05),
                p: 2
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentExercise.id}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={containerVariants}
                  style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center' }}
                >
                  <Lottie
                    ref={animationRef}
                    loop={playing}
                    animationData={currentExercise.animation}
                    play={playing}
                    speed={speed}
                    style={{ width: '100%', maxWidth: 400 }}
                  />
                </motion.div>
              </AnimatePresence>
              
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  left: 0,
                  right: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  px: 3
                }}
              >
                <Box sx={{ width: '100%', maxWidth: 500, mb: 1 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item>
                      <Button 
                        variant="contained" 
                        size="small"
                        color={playing ? "error" : "primary"}
                        onClick={handlePlayPause}
                        sx={{ 
                          minWidth: 'unset', 
                          width: 36, 
                          height: 36,
                          borderRadius: '50%'
                        }}
                      >
                        {playing ? <Timer /> : <DirectionsBike />}
                      </Button>
                    </Grid>
                    <Grid item xs>
                      <Slider
                        value={speed}
                        onChange={handleSpeedChange}
                        min={0.5}
                        max={2}
                        step={0.25}
                        marks={[
                          { value: 0.5, label: '0.5x' },
                          { value: 1, label: '1x' },
                          { value: 1.5, label: '1.5x' },
                          { value: 2, label: '2x' },
                        ]}
                        sx={{ 
                          color: zone.color,
                          '& .MuiSlider-thumb': {
                            '&:hover, &.Mui-focusVisible': {
                              boxShadow: `0px 0px 0px 8px ${alpha(zone.color, 0.16)}`
                            },
                            '&.Mui-active': {
                              boxShadow: `0px 0px 0px 14px ${alpha(zone.color, 0.16)}`
                            }
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            </Box>
          )}
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={5}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            borderRadius: 2,
            bgcolor: alpha(theme.palette.background.paper, 0.7),
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box 
                sx={{ 
                  bgcolor: alpha(zone.color, 0.2), 
                  color: zone.color,
                  p: 1,
                  borderRadius: '50%',
                  mr: 2
                }}
              >
                {zone.icon}
              </Box>
              <Box>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                  {zone.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {zone.min}-{zone.max} watts
                </Typography>
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1" component="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
              {currentExercise.name}
            </Typography>
            
            <Typography variant="body2" paragraph>
              {currentExercise.description}
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                Paramètres clés:
              </Typography>
              <Grid container spacing={1}>
                {Object.entries(currentExercise.parameters).map(([key, value]) => (
                  <Grid item key={key}>
                    <Chip 
                      size="small" 
                      label={`${key}: ${value}`}
                      sx={{ 
                        bgcolor: alpha(zone.color, 0.1),
                        color: 'text.primary',
                        '& .MuiChip-label': { px: 1 }
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                Conseils techniques:
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                {currentExercise.tips.map((tip, index) => (
                  <Typography component="li" variant="body2" key={index} sx={{ mb: 0.5 }}>
                    {tip}
                  </Typography>
                ))}
              </Box>
            </Box>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ mt: 'auto' }}>
            <Typography variant="subtitle2" gutterBottom>
              Autres exercices pour cette zone:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {exercises.map((exercise, index) => (
                <Chip
                  key={exercise.id}
                  label={exercise.name}
                  onClick={() => handleExerciseChange(index)}
                  variant={activeExercise === index ? "filled" : "outlined"}
                  sx={{
                    bgcolor: activeExercise === index ? zone.color : 'transparent',
                    color: activeExercise === index ? 'white' : 'text.primary',
                    borderColor: zone.color,
                    '&:hover': {
                      bgcolor: activeExercise === index ? zone.color : alpha(zone.color, 0.1),
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default ExerciseAnimation;
