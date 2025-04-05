import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  LinearProgress,
  Tooltip,
  IconButton,
  useTheme,
  Divider
} from '@mui/material';
import {
  DirectionsBike,
  Whatshot,
  Timer,
  PlayArrow,
  Bookmark,
  BookmarkBorder,
  Share
} from '@mui/icons-material';
import { formatDuration } from '../../utils/formatters';

/**
 * Carte affichant un programme d'entraînement HIIT avec ses caractéristiques
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.workout - Données de l'entraînement
 * @param {boolean} [props.compact=false] - Mode d'affichage compact
 * @param {Function} [props.onStart] - Callback lorsque l'utilisateur démarre l'entraînement
 * @param {Function} [props.onSave] - Callback lorsque l'utilisateur sauvegarde l'entraînement
 */
const HiitWorkoutCard = ({ workout, compact = false, onStart, onSave }) => {
  const theme = useTheme();
  
  // Déterminer le niveau de difficulté
  const getDifficultyColor = (level) => {
    switch (level) {
      case 'easy':
        return theme.palette.success.main;
      case 'medium':
        return theme.palette.warning.main;
      case 'hard':
        return theme.palette.error.main;
      default:
        return theme.palette.info.main;
    }
  };
  
  // Formater la durée totale
  const getTotalDuration = () => {
    if (!workout.intervals) return '0:00';
    
    const totalSeconds = workout.intervals.reduce((total, interval) => {
      return total + (interval.duration * interval.repeat);
    }, 0);
    
    return formatDuration(totalSeconds, 'short');
  };
  
  // Calculer l'intensité moyenne
  const getAverageIntensity = () => {
    if (!workout.intervals || workout.intervals.length === 0) return 0;
    
    const weightedSum = workout.intervals.reduce((sum, interval) => {
      return sum + (interval.intensity * interval.duration * interval.repeat);
    }, 0);
    
    const totalDuration = workout.intervals.reduce((total, interval) => {
      return total + (interval.duration * interval.repeat);
    }, 0);
    
    return Math.round((weightedSum / totalDuration) * 10) / 10;
  };
  
  return (
    <Card 
      variant="outlined" 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: `4px solid ${getDifficultyColor(workout.difficulty)}`,
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4]
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: compact ? 1.5 : 2 }}>
        {/* En-tête */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box>
            <Typography variant={compact ? "subtitle1" : "h6"} component="h3" sx={{ mb: 0.5 }}>
              {workout.title}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              <Chip 
                size="small" 
                icon={<Whatshot fontSize="small" />} 
                label={workout.difficulty === 'easy' ? 'Facile' : 
                       workout.difficulty === 'medium' ? 'Moyen' : 'Difficile'} 
                sx={{ 
                  bgcolor: `${getDifficultyColor(workout.difficulty)}20`,
                  borderColor: getDifficultyColor(workout.difficulty),
                  color: getDifficultyColor(workout.difficulty),
                  borderWidth: 1,
                  borderStyle: 'solid'
                }}
              />
              <Chip 
                size="small"
                label={workout.type === 'road' ? 'Route' : 
                       workout.type === 'mountain' ? 'VTT' : 
                       workout.type === 'gravel' ? 'Gravel' : 'Indoor'}
                variant="outlined"
              />
            </Box>
          </Box>
          
          {!compact && (
            <Box>
              <Tooltip title={workout.saved ? "Retirer des favoris" : "Ajouter aux favoris"}>
                <IconButton 
                  size="small" 
                  onClick={() => onSave && onSave(workout)}
                  color="primary"
                >
                  {workout.saved ? <Bookmark /> : <BookmarkBorder />}
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Partager">
                <IconButton size="small">
                  <Share fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
        
        {/* Description */}
        {!compact && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {workout.description}
          </Typography>
        )}
        
        {/* Statistiques */}
        <Grid 
          container 
          spacing={compact ? 1 : 2} 
          sx={{ 
            mb: compact ? 1 : 1.5,
            mt: compact ? 1 : 0
          }}
        >
          <Grid item xs={4}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Durée
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Timer fontSize="small" color="action" sx={{ mr: 0.5, opacity: 0.6 }} />
                <Typography variant="body2" fontWeight="medium">
                  {getTotalDuration()}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={4}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Intensité
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Whatshot fontSize="small" color="action" sx={{ mr: 0.5, opacity: 0.6 }} />
                <Typography variant="body2" fontWeight="medium">
                  {getAverageIntensity()}/10
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={4}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Intervalles
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {workout.intervals ? workout.intervals.length : 0} types
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        {/* Visualisation des intervalles */}
        {!compact && workout.intervals && workout.intervals.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Structure des intervalles
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              height: 30, 
              borderRadius: 1,
              overflow: 'hidden',
              bgcolor: 'background.paper' 
            }}>
              {workout.intervals.map((interval, index) => {
                // Calculer la largeur proportionnelle à la durée de l'intervalle
                const totalDuration = workout.intervals.reduce((total, int) => {
                  return total + (int.duration * int.repeat);
                }, 0);
                
                const width = ((interval.duration * interval.repeat) / totalDuration) * 100;
                
                return (
                  <Tooltip 
                    key={index}
                    title={`${interval.name}: ${interval.duration}s x${interval.repeat}, intensité ${interval.intensity}/10`}
                  >
                    <Box 
                      sx={{
                        width: `${width}%`,
                        bgcolor: interval.intensity > 7 ? 'error.main' : 
                                interval.intensity > 4 ? 'warning.main' : 'success.main',
                        opacity: 0.8,
                        position: 'relative',
                        '&:after': interval.repeat > 1 ? {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.1) 5px, transparent 5px, transparent 10px)'
                        } : {}
                      }}
                    />
                  </Tooltip>
                );
              })}
            </Box>
          </Box>
        )}
        
        {/* Bouton de démarrage */}
        {!compact && (
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth
            startIcon={<PlayArrow />}
            onClick={() => onStart && onStart(workout)}
            sx={{ mt: 'auto' }}
          >
            Démarrer l'entraînement
          </Button>
        )}
        
        {compact && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => onStart && onStart(workout)}
              endIcon={<PlayArrow />}
            >
              Démarrer
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default HiitWorkoutCard;
