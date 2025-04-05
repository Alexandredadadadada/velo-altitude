import React, { memo } from 'react';
import PropTypes from 'prop-types';
import {
  Card, CardActionArea, CardContent,
  Typography, Box, Chip, Grid, Skeleton, useMediaQuery, useTheme
} from '@mui/material';
import {
  Terrain as TerrainIcon,
  LocationOn as LocationIcon,
  DirectionsBike as BikeIcon,
  Straighten as DistanceIcon,
  ArrowUpward as ElevationIcon,
  Favorite as FavoriteIcon
} from '@mui/icons-material';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

/**
 * Composant de carte pour afficher un col cycliste
 * Utilise les composants Material-UI avec une structure standardisée
 */
const ColCard = ({ col, isSelected, onClick, isFavorite, onToggleFavorite }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // Obtenir la couleur de la difficulté
  const getDifficultyColor = (level) => {
    switch (level.toLowerCase()) {
      case 'difficile':
      case 'hard':
        return 'error';
      case 'modéré':
      case 'moyen':
      case 'medium':
        return 'warning';
      case 'facile':
      case 'easy':
        return 'success';
      default:
        return 'info';
    }
  };

  // Déterminer la classe de catégorie
  const getCategoryClass = (category) => {
    switch (category) {
      case 'HC':
        return 'category-hc';
      case '1':
        return 'category-1';
      case '2':
        return 'category-2';
      case '3':
        return 'category-3';
      case '4':
        return 'category-4';
      default:
        return '';
    }
  };

  // Déterminer la hauteur de l'image en fonction du breakpoint
  const getImageHeight = () => {
    if (isMobile) return 100;
    if (isTablet) return 110;
    return 120;
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation(); // Éviter que le clic se propage au CardActionArea
    if (onToggleFavorite) {
      onToggleFavorite(col.id);
    }
  };

  return (
    <Card 
      elevation={isSelected ? 3 : 1}
      sx={{ 
        mb: 2, 
        border: isSelected ? '2px solid #1976d2' : 'none',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        },
        position: 'relative'
      }}
      role="article"
      aria-label={`Col ${col.name}, altitude ${col.elevation} mètres, difficulté ${col.difficulty}`}
    >
      <CardActionArea 
        onClick={onClick}
        aria-pressed={isSelected}
      >
        <Grid container>
          <Grid 
            item 
            xs={5} 
            sm={4} 
            md={4}
            sx={{ 
              position: 'relative',
              height: getImageHeight()
            }}
          >
            <Box
              sx={{
                height: '100%',
                width: '100%',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <LazyLoadImage
                src={col.imageUrl || '/images/cols/default-col.jpg'}
                alt={`Vue du col ${col.name}`}
                effect="blur"
                height={getImageHeight()}
                width="100%"
                style={{
                  objectFit: 'cover',
                  objectPosition: 'center',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}
                placeholder={
                  <Skeleton 
                    variant="rectangular" 
                    width="100%" 
                    height={getImageHeight()} 
                    animation="wave" 
                  />
                }
              />
              {col.category && (
                <Box 
                  className={getCategoryClass(col.category)}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    bgcolor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    borderRadius: '50%',
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: isMobile ? '0.7rem' : '0.8rem',
                    zIndex: 1
                  }}
                  aria-label={`Catégorie ${col.category}`}
                >
                  {col.category}
                </Box>
              )}
            </Box>
          </Grid>
          <Grid item xs={7} sm={8} md={8}>
            <CardContent 
              sx={{ 
                pb: '12px !important', 
                pt: isMobile ? 1 : 2,
                px: isMobile ? 1.5 : 2
              }}
            >
              <Typography 
                variant={isMobile ? "subtitle1" : "h6"} 
                component="h3" 
                noWrap
                sx={{ 
                  fontWeight: isSelected ? 600 : 500,
                  fontSize: isMobile ? '0.9rem' : undefined
                }}
              >
                {col.name}
              </Typography>
              
              <Box 
                display="flex" 
                alignItems="center" 
                mt={isMobile ? 0.5 : 1}
                sx={{ 
                  flexWrap: isMobile ? 'wrap' : 'nowrap' 
                }}
              >
                <LocationIcon 
                  fontSize="small" 
                  color="action" 
                  sx={{ 
                    mr: 0.5,
                    fontSize: isMobile ? '0.9rem' : '1rem' 
                  }} 
                />
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                  noWrap
                >
                  {col.region || 'Région non spécifiée'}
                </Typography>
              </Box>
              
              <Box 
                display="flex" 
                alignItems="center" 
                mt={0.5}
                flexWrap={isMobile ? 'wrap' : 'nowrap'}
              >
                <Box display="flex" alignItems="center" mr={1}>
                  <TerrainIcon 
                    fontSize="small" 
                    color="action" 
                    sx={{ 
                      mr: 0.5,
                      fontSize: isMobile ? '0.9rem' : '1rem' 
                    }} 
                  />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                  >
                    {col.elevation} m
                  </Typography>
                </Box>
                
                {col.length && (
                  <Box display="flex" alignItems="center" mr={1}>
                    <DistanceIcon 
                      fontSize="small" 
                      color="action" 
                      sx={{ 
                        mr: 0.5,
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        ml: isMobile ? 0 : 1
                      }} 
                    />
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                    >
                      {col.length} km
                    </Typography>
                  </Box>
                )}
              </Box>
              
              {col.gradient && (
                <Box display="flex" alignItems="center" mt={0.5}>
                  <ElevationIcon 
                    fontSize="small" 
                    color="action" 
                    sx={{ 
                      mr: 0.5,
                      fontSize: isMobile ? '0.9rem' : '1rem'
                    }} 
                  />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                  >
                    {col.gradient}% moyen
                  </Typography>
                </Box>
              )}
              
              <Box 
                display="flex" 
                flexWrap="wrap" 
                mt={isMobile ? 0.5 : 1} 
                gap={0.5}
                sx={{ alignItems: 'center' }}
              >
                <Chip 
                  size="small"
                  label={col.difficulty}
                  color={getDifficultyColor(col.difficulty)}
                  sx={{ 
                    height: isMobile ? 22 : 24,
                    '& .MuiChip-label': {
                      fontSize: isMobile ? '0.65rem' : '0.75rem',
                      px: isMobile ? 0.8 : 1
                    }
                  }}
                />
                
                {col.recommended && (
                  <Chip 
                    size="small"
                    icon={<BikeIcon sx={{ fontSize: isMobile ? '0.9rem' : '1rem' }} />}
                    label="Recommandé"
                    color="primary"
                    variant="outlined"
                    sx={{ 
                      height: isMobile ? 22 : 24,
                      '& .MuiChip-label': {
                        fontSize: isMobile ? '0.65rem' : '0.75rem',
                        px: isMobile ? 0.8 : 1
                      }
                    }}
                  />
                )}
                
                {onToggleFavorite && (
                  <Box 
                    onClick={handleFavoriteClick}
                    sx={{
                      ml: 'auto',
                      mr: 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '50%',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                    role="button"
                    aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                    aria-pressed={isFavorite}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleFavoriteClick(e);
                      }
                    }}
                  >
                    <FavoriteIcon 
                      color={isFavorite ? "error" : "action"} 
                      fontSize="small"
                      sx={{ 
                        fontSize: isMobile ? '1.1rem' : '1.2rem',
                        transition: 'color 0.3s ease, transform 0.2s ease',
                        transform: isFavorite ? 'scale(1.1)' : 'scale(1)'
                      }}
                    />
                  </Box>
                )}
              </Box>
            </CardContent>
          </Grid>
        </Grid>
      </CardActionArea>
    </Card>
  );
};

ColCard.propTypes = {
  // Données du col
  col: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    region: PropTypes.string,
    elevation: PropTypes.number.isRequired,
    difficulty: PropTypes.string.isRequired,
    imageUrl: PropTypes.string,
    category: PropTypes.string,
    length: PropTypes.number,
    gradient: PropTypes.number,
    recommended: PropTypes.bool
  }).isRequired,
  
  // État de sélection
  isSelected: PropTypes.bool,
  
  // Fonction de callback lors du clic
  onClick: PropTypes.func.isRequired,
  
  // Favoris
  isFavorite: PropTypes.bool,
  onToggleFavorite: PropTypes.func
};

ColCard.defaultProps = {
  isSelected: false,
  isFavorite: false,
  onToggleFavorite: null
};

// Utiliser memo pour éviter les re-rendus inutiles
export default memo(ColCard);
