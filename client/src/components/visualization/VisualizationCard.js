import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Button,
  Chip,
  Divider,
  Box,
  IconButton,
  Collapse,
  useTheme,
  alpha,
  Link,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  ExpandMore as ExpandMoreIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
  Terrain as TerrainIcon,
  Route as RouteIcon,
  Visibility as VisibilityIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Bookmark as BookmarkIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

// Styled components
const StyledCard = styled(Card)(({ theme, variant }) => ({
  position: 'relative',
  overflow: 'hidden',
  transition: 'transform 0.3s, box-shadow 0.3s',
  borderRadius: '16px',
  ...variant === 'compact' && {
    maxWidth: 345,
    height: '100%',
  },
  ...variant === 'expanded' && {
    maxWidth: '100%',
    marginBottom: theme.spacing(3),
  },
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[10],
  }
}));

const CardOverlay = styled(Box)(({ theme, overlay }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  background: overlay === 'dark' 
    ? 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0) 100%)'
    : 'linear-gradient(to top, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0) 100%)',
  padding: theme.spacing(2),
  transition: 'opacity 0.3s',
  color: overlay === 'dark' ? '#fff' : theme.palette.text.primary,
}));

const ExpandButton = styled(IconButton)(({ theme, expanded }) => ({
  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

const StatsChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  '& .MuiChip-icon': {
    color: 'inherit',
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 600,
  paddingLeft: theme.spacing(1),
  paddingRight: theme.spacing(1),
  minWidth: 0,
}));

const StyledCardMedia = styled(CardMedia)(({ theme, variant }) => ({
  height: variant === 'compact' ? 140 : 300,
  position: 'relative',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}));

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6,
      ease: 'easeOut'
    }
  },
  hover: {
    scale: 1.03,
    boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.1)',
    transition: { 
      duration: 0.3
    }
  }
};

const detailsVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { 
    height: 'auto',
    opacity: 1,
    transition: {
      height: {
        duration: 0.3
      },
      opacity: {
        delay: 0.1,
        duration: 0.3
      }
    }
  }
};

/**
 * VisualizationCard - Composant de carte pour afficher les visualisations de cols et itinéraires
 * 
 * @param {Object} props - Propriétés du composant
 * @param {string} props.id - Identifiant unique de la visualisation
 * @param {string} props.title - Titre de la visualisation
 * @param {string} props.subtitle - Sous-titre ou description courte
 * @param {string} props.image - URL de l'image d'aperçu
 * @param {string} props.type - Type de visualisation ('col' ou 'route')
 * @param {string} props.location - Localisation de la visualisation
 * @param {Object} props.stats - Statistiques (difficulté, distance, dénivelé, etc.)
 * @param {Object[]} props.details - Détails supplémentaires à afficher dans la section expandable
 * @param {string} props.detailsUrl - URL pour afficher la visualisation complète
 * @param {string} props.variant - Variante d'affichage ('compact' ou 'expanded')
 * @param {boolean} props.isFavorite - Si la visualisation est dans les favoris
 * @param {boolean} props.isBookmarked - Si la visualisation est enregistrée
 * @param {Function} props.onFavoriteToggle - Fonction appelée lors du clic sur le bouton favori
 * @param {Function} props.onBookmarkToggle - Fonction appelée lors du clic sur le bouton enregistrement
 * @param {Function} props.onShare - Fonction appelée lors du clic sur le bouton partage
 */
const VisualizationCard = ({
  id,
  title,
  subtitle,
  image,
  type = 'col', // 'col' ou 'route'
  location,
  stats = {},
  details = [],
  detailsUrl,
  variant = 'compact', // 'compact' ou 'expanded'
  isFavorite = false,
  isBookmarked = false,
  onFavoriteToggle,
  onBookmarkToggle,
  onShare,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };
  
  const getDifficultyColor = (difficulty) => {
    if (!difficulty) return theme.palette.grey[500];
    
    const difficultyMap = {
      'facile': theme.palette.success.main,
      'moyen': theme.palette.warning.main,
      'difficile': theme.palette.error.main,
      'très difficile': theme.palette.error.dark,
      'extrême': '#8B0000', // Dark red
    };
    
    return difficultyMap[difficulty.toLowerCase()] || theme.palette.grey[500];
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      whileHover="hover"
      variants={cardVariants}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <StyledCard variant={variant} elevation={hovered ? 8 : 2}>
        <StyledCardMedia
          component="div"
          image={image}
          title={title}
          variant={variant}
        >
          <Box 
            sx={{ 
              position: 'absolute',
              top: 12,
              right: 12,
              display: 'flex',
              gap: 1
            }}
          >
            <Tooltip title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}>
              <IconButton
                aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                onClick={() => onFavoriteToggle && onFavoriteToggle(id)}
                sx={{
                  color: '#fff',
                  background: alpha(theme.palette.common.black, 0.4),
                  '&:hover': {
                    background: alpha(theme.palette.common.black, 0.6),
                  }
                }}
                size="small"
              >
                {isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title={isBookmarked ? "Retirer des enregistrements" : "Enregistrer"}>
              <IconButton
                aria-label={isBookmarked ? "Retirer des enregistrements" : "Enregistrer"}
                onClick={() => onBookmarkToggle && onBookmarkToggle(id)}
                sx={{
                  color: '#fff',
                  background: alpha(theme.palette.common.black, 0.4),
                  '&:hover': {
                    background: alpha(theme.palette.common.black, 0.6),
                  }
                }}
                size="small"
              >
                {isBookmarked ? <BookmarkIcon color="primary" /> : <BookmarkBorderIcon />}
              </IconButton>
            </Tooltip>
          </Box>
          
          {/* Type badge */}
          <Box sx={{ position: 'absolute', top: 12, left: 12 }}>
            <Chip
              icon={type === 'col' ? <TerrainIcon /> : <RouteIcon />}
              label={type === 'col' ? 'Col' : 'Parcours'}
              sx={{
                bgcolor: type === 'col' ? theme.palette.primary.main : theme.palette.secondary.main,
                color: '#fff',
                fontWeight: 600,
              }}
              size="small"
            />
          </Box>
          
          {/* Overlay for compact cards */}
          {variant === 'compact' && (
            <CardOverlay overlay="dark">
              <Typography variant="h6" component="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                {title}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {location}
              </Typography>
            </CardOverlay>
          )}
        </StyledCardMedia>
        
        {variant === 'expanded' && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {title}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {location}
                </Typography>
              </Box>
              
              {stats.difficulty && (
                <Chip 
                  label={`Difficulté: ${stats.difficulty}`}
                  sx={{
                    bgcolor: alpha(getDifficultyColor(stats.difficulty), 0.1),
                    color: getDifficultyColor(stats.difficulty),
                    fontWeight: 600,
                    border: `1px solid ${alpha(getDifficultyColor(stats.difficulty), 0.3)}`,
                  }}
                />
              )}
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
              {subtitle}
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 2 }}>
              {stats.distance && (
                <StatsChip 
                  icon={<RouteIcon />} 
                  label={`${stats.distance} km`}
                  variant="outlined"
                  size="small"
                />
              )}
              {stats.elevation && (
                <StatsChip 
                  icon={<TerrainIcon />} 
                  label={`${stats.elevation} m D+`}
                  variant="outlined"
                  size="small"
                />
              )}
              {stats.views && (
                <StatsChip 
                  icon={<VisibilityIcon />} 
                  label={`${stats.views} vues`}
                  variant="outlined"
                  size="small"
                />
              )}
            </Box>
          </CardContent>
        )}
        
        <Divider sx={{ opacity: 0.6 }} />
        
        <CardActions disableSpacing>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', px: 1 }}>
            <Box>
              {variant === 'expanded' && (
                <>
                  <ActionButton
                    aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                    onClick={() => onFavoriteToggle && onFavoriteToggle(id)}
                    startIcon={isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                    size="small"
                  >
                    {isFavorite ? 'Favori' : 'Favori'}
                  </ActionButton>
                  
                  <ActionButton
                    aria-label="Partager"
                    onClick={() => onShare && onShare(id)}
                    startIcon={<ShareIcon />}
                    size="small"
                  >
                    Partager
                  </ActionButton>
                </>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {details.length > 0 && (
                <ExpandButton
                  expanded={expanded ? 1 : 0}
                  onClick={handleExpandClick}
                  aria-expanded={expanded}
                  aria-label="Afficher plus"
                  size="small"
                >
                  <ExpandMoreIcon />
                </ExpandButton>
              )}
              
              {detailsUrl && (
                <Button
                  component={RouterLink}
                  to={detailsUrl}
                  endIcon={<ArrowForwardIcon />}
                  size="small"
                  sx={{ ml: 1 }}
                  color="primary"
                >
                  Détails
                </Button>
              )}
            </Box>
          </Box>
        </CardActions>
        
        {details.length > 0 && (
          <motion.div
            initial="collapsed"
            animate={expanded ? "expanded" : "collapsed"}
            variants={detailsVariants}
          >
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <CardContent>
                {details.map((detail, index) => (
                  <Box key={index} sx={{ mb: index < details.length - 1 ? 2 : 0 }}>
                    {detail.title && (
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {detail.title}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {detail.content}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Collapse>
          </motion.div>
        )}
      </StyledCard>
    </motion.div>
  );
};

export default VisualizationCard;
