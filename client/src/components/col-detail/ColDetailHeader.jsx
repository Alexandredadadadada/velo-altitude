import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Chip, 
  Button, 
  Stack, 
  Fade,
  useTheme,
  useMediaQuery
} from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HeightIcon from '@mui/icons-material/Height';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

/**
 * En-tête améliorée pour la page de détail d'un col
 * Présentation immersive avec parallaxe et mise en valeur des programmes associés
 * Supporte le concept des "7 Majeurs" avec tous les cols principaux
 */
const ColDetailHeader = ({ 
  col, 
  hasPlan = false, 
  hasNutritionPlan = false,
  isInMajorChallenge = false,
  majorChallengeProgress = 0,
  onPlanClick,
  onNutritionClick,
  onMajorChallengeClick
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [scrollPosition, setScrollPosition] = useState(0);
  
  // Gestion de l'effet parallaxe
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Déterminer la couleur associée au col ou utiliser la couleur par défaut
  const colColor = theme.veloAltitude.colsColors[col.id] || theme.palette.primary.main;
  
  // Modifier le gradient selon l'altitude (plus élevé = plus intense)
  const altitudeIntensity = Math.min(col.altitude / 3000, 1);
  const gradientOverlay = `linear-gradient(to bottom, 
    rgba(0,0,0,0.1) 0%, 
    rgba(0,0,0,0.6) 70%, 
    ${colColor}99 100%)`;
  
  return (
    <Box sx={{ position: 'relative', mb: 6 }}>
      {/* Image de couverture avec effet parallaxe */}
      <Box
        sx={{
          height: { xs: '350px', md: '450px', lg: '550px' },
          width: '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${col.images?.main || '/images/cols/default.jpg'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `translateY(${scrollPosition * 0.3}px)`,
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: gradientOverlay,
              zIndex: 1
            }
          }}
        />
        
        {/* Informations principales superposées */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: { xs: 3, md: 5 },
            color: 'white',
            zIndex: 2,
          }}
        >
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} md={8}>
              <Typography 
                variant="overline" 
                sx={{ 
                  opacity: 0.9,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.palette.common.white
                }}
              >
                {col.location?.region || 'Région alpine'}
              </Typography>
              
              <Typography 
                variant="h1" 
                sx={{ 
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  fontWeight: 800,
                  textShadow: '0px 2px 4px rgba(0,0,0,0.5)',
                  color: theme.palette.common.white,
                  mb: 1
                }}
              >
                {col.name}
              </Typography>
              
              <Typography 
                variant="h6" 
                sx={{ 
                  opacity: 0.9,
                  fontWeight: 400,
                  color: theme.palette.common.white,
                  maxWidth: '800px'
                }}
              >
                {col.description?.short || 'Une des ascensions mythiques du cyclisme européen.'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box 
                sx={{ 
                  bgcolor: 'rgba(0,0,0,0.3)',
                  backdropFilter: 'blur(10px)',
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <Typography 
                  variant="altitude" 
                  sx={{ 
                    display: 'block',
                    color: theme.palette.common.white,
                    lineHeight: 1
                  }}
                >
                  {col.altitude} m
                </Typography>
                
                <Typography 
                  variant="body2" 
                  sx={{ 
                    opacity: 0.7,
                    color: theme.palette.common.white
                  }}
                >
                  Altitude
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          {/* Tags et labels */}
          <Stack 
            direction="row" 
            spacing={1} 
            sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}
          >
            <Chip 
              icon={<PlaceIcon />} 
              label={`${col.location?.country || 'Europe'}`} 
              size="small"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '& .MuiChip-icon': { color: 'white' }
              }} 
            />
            
            <Chip 
              icon={<TrendingUpIcon />} 
              label={`${col.averageGradient || '8'}% moyen`} 
              size="small"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '& .MuiChip-icon': { color: 'white' }
              }} 
            />
            
            <Chip 
              icon={<HeightIcon />} 
              label={`${col.elevation || '1100'}m dénivelé`} 
              size="small"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '& .MuiChip-icon': { color: 'white' }
              }} 
            />
            
            <Chip 
              icon={<DirectionsBikeIcon />} 
              label={`${col.length || '15'}km`} 
              size="small"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '& .MuiChip-icon': { color: 'white' }
              }} 
            />
            
            {/* Indicateur "7 Majeurs" */}
            {isInMajorChallenge && (
              <Chip 
                icon={<EmojiEventsIcon />} 
                label="7 Majeurs" 
                size="small"
                sx={{ 
                  bgcolor: theme.palette.warning.main,
                  color: 'white',
                  '& .MuiChip-icon': { color: 'white' }
                }} 
              />
            )}
            
            {/* Afficher si le col a des programmes associés */}
            {hasPlan && (
              <Chip 
                icon={<FitnessCenterIcon />} 
                label="Programme d'entraînement" 
                size="small"
                sx={{ 
                  bgcolor: theme.palette.secondary.main,
                  color: 'white',
                  '& .MuiChip-icon': { color: 'white' }
                }} 
              />
            )}
            
            {hasNutritionPlan && (
              <Chip 
                icon={<RestaurantIcon />} 
                label="Plan nutritionnel" 
                size="small"
                sx={{ 
                  bgcolor: theme.palette.secondary.light,
                  color: 'white',
                  '& .MuiChip-icon': { color: 'white' }
                }} 
              />
            )}
          </Stack>
        </Box>
      </Box>
      
      {/* Section d'actions rapides - adaptée pour tous les cols */}
      <Box 
        sx={{ 
          mt: -4,
          mx: { xs: 2, md: 5 },
          p: 3,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 3,
          position: 'relative',
          zIndex: 3
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={7}>
            <Typography variant="h5" gutterBottom>
              {isInMajorChallenge 
                ? `Relevez le défi des 7 Majeurs avec ${col.name}`
                : `Préparez-vous pour conquérir ${col.name}`}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {isInMajorChallenge 
                ? `Ce col fait partie du défi ultime des 7 Majeurs. Rejoignez les cyclistes qui se lancent dans cette aventure exceptionnelle.`
                : `Découvrez les ressources disponibles pour préparer et réussir cette ascension mythique.`}
              {hasPlan && hasNutritionPlan && " Profitez d'un programme d'entraînement spécifique et d'un plan nutritionnel adapté."}
            </Typography>
            
            {/* Afficher la progression du défi 7 Majeurs si applicable */}
            {isInMajorChallenge && majorChallengeProgress > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Votre progression dans le défi des 7 Majeurs
                </Typography>
                <Box sx={{ 
                  mt: 0.5,
                  height: 8,
                  width: '100%',
                  bgcolor: 'grey.200',
                  borderRadius: 4,
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <Box sx={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: `${Math.min(majorChallengeProgress, 100)}%`,
                    bgcolor: theme.palette.warning.main,
                    borderRadius: 4,
                    transition: 'width 1s ease-in-out'
                  }} />
                </Box>
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, textAlign: 'right' }}>
                  {Math.round(majorChallengeProgress)}% complété
                </Typography>
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12} md={5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {/* Bouton Défi 7 Majeurs */}
              {isInMajorChallenge && (
                <Button 
                  variant="contained" 
                  color="warning"
                  startIcon={<EmojiEventsIcon />}
                  fullWidth
                  onClick={onMajorChallengeClick}
                >
                  Défi 7 Majeurs
                </Button>
              )}
              
              {/* Bouton Programme Spécifique */}
              {hasPlan && (
                <Button 
                  variant="contained" 
                  color="secondary"
                  startIcon={<FitnessCenterIcon />}
                  fullWidth
                  onClick={onPlanClick}
                >
                  Programme
                </Button>
              )}
              
              {/* Bouton Plan Nutrition */}
              {hasNutritionPlan && (
                <Button 
                  variant="outlined" 
                  color="secondary"
                  startIcon={<RestaurantIcon />}
                  fullWidth
                  onClick={onNutritionClick}
                >
                  Nutrition
                </Button>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default ColDetailHeader;
