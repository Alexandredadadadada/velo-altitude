import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardMedia, 
  CardContent, 
  Grid, 
  IconButton, 
  Chip,
  useTheme,
  alpha,
  Paper,
  Stack,
  Tooltip,
  Badge
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HeightIcon from '@mui/icons-material/Height';
import TerrainIcon from '@mui/icons-material/Terrain';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { useNavigate } from 'react-router-dom';

/**
 * Widget d'affichage des cols récemment consultés
 * Affiche une liste de cols avec miniatures et permet un accès rapide
 */
const RecentColsWidget = ({ cols = [], onColClick, maxCols = 4 }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [favoriteColIds, setFavoriteColIds] = useState([]);
  
  // Tri des cols par date de consultation (du plus récent au plus ancien)
  const sortedCols = [...cols].sort((a, b) => {
    return new Date(b.lastVisited) - new Date(a.lastVisited);
  }).slice(0, maxCols);
  
  // Simulation de chargement des favoris depuis le localStorage
  useEffect(() => {
    const loadFavorites = () => {
      try {
        const storedFavorites = localStorage.getItem('favoriteColIds');
        if (storedFavorites) {
          setFavoriteColIds(JSON.parse(storedFavorites));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des favoris:', error);
      }
    };
    
    loadFavorites();
  }, []);
  
  // Gestion des favoris
  const toggleFavorite = (colId, event) => {
    event.stopPropagation();
    
    setFavoriteColIds(prev => {
      const newFavorites = prev.includes(colId)
        ? prev.filter(id => id !== colId)
        : [...prev, colId];
      
      // Sauvegarder dans localStorage
      localStorage.setItem('favoriteColIds', JSON.stringify(newFavorites));
      return newFavorites;
    });
  };
  
  // Gestion du clic sur un col
  const handleColClick = (col) => {
    if (onColClick) {
      onColClick(col);
    } else {
      navigate(`/cols/${col.id}`);
    }
  };
  
  // Format de date relatif
  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Il y a quelques minutes';
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    }
  };
  
  // Animations pour les cartes
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },
    hover: { 
      y: -8, 
      boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
      transition: { type: "spring", stiffness: 400, damping: 20 }
    }
  };
  
  // Si aucun col n'est disponible
  if (sortedCols.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          bgcolor: 'background.paper',
          boxShadow: theme.shadows[1],
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 200
        }}
      >
        <Typography variant="body1" color="text.secondary" align="center">
          Aucun col consulté récemment
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
          Explorez le catalogue pour découvrir des cols
        </Typography>
      </Paper>
    );
  }
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        bgcolor: 'background.paper',
        boxShadow: theme.shadows[1],
        height: '100%'
      }}
    >
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
          <AccessTimeIcon sx={{ mr: 1, fontSize: '1.2rem', color: 'primary.main' }} />
          Cols récemment consultés
        </Typography>
        <Tooltip title="Voir tous les cols">
          <IconButton size="small" color="primary" onClick={() => navigate('/cols')}>
            <ArrowForwardIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Grid container spacing={2}>
        <AnimatePresence>
          {sortedCols.map((col) => (
            <Grid item xs={12} sm={6} key={col.id}>
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                layout
              >
                <Card 
                  sx={{ 
                    display: 'flex',
                    borderRadius: 2,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    height: '100%',
                    position: 'relative'
                  }}
                  onClick={() => handleColClick(col)}
                >
                  <CardMedia
                    component="img"
                    sx={{ width: 100, objectFit: 'cover' }}
                    image={col.images?.thumbnail || '/images/cols/default-thumb.jpg'}
                    alt={col.name}
                  />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <CardContent sx={{ flex: '1 0 auto', p: 2, pb: '8px !important' }}>
                      <Typography component="div" variant="subtitle1" fontWeight="bold" noWrap>
                        {col.name}
                      </Typography>
                      
                      <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 1 }}>
                        {col.location?.region}, {col.location?.country}
                      </Typography>
                      
                      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                        <Chip 
                          icon={<HeightIcon sx={{ fontSize: '0.8rem !important' }} />} 
                          label={`${col.altitude}m`}
                          size="small"
                          sx={{ 
                            height: 22, 
                            '& .MuiChip-label': { px: 1, fontSize: '0.75rem' }
                          }}
                        />
                        <Chip 
                          icon={<TrendingUpIcon sx={{ fontSize: '0.8rem !important' }} />} 
                          label={`${col.averageGradient}%`}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ 
                            height: 22, 
                            '& .MuiChip-label': { px: 1, fontSize: '0.75rem' }
                          }}
                        />
                      </Stack>
                      
                      <Typography variant="caption" color="text.secondary">
                        {getRelativeTime(col.lastVisited)}
                      </Typography>
                    </CardContent>
                  </Box>
                  
                  {/* Bouton favori */}
                  <IconButton 
                    size="small" 
                    sx={{ 
                      position: 'absolute', 
                      top: 8, 
                      right: 8,
                      bgcolor: alpha(theme.palette.background.paper, 0.8),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.background.paper, 0.9),
                      },
                      width: 30,
                      height: 30
                    }}
                    onClick={(e) => toggleFavorite(col.id, e)}
                  >
                    {favoriteColIds.includes(col.id) ? (
                      <BookmarkIcon fontSize="small" color="primary" />
                    ) : (
                      <BookmarkBorderIcon fontSize="small" />
                    )}
                  </IconButton>
                  
                  {/* Badge de difficulté */}
                  {col.difficulty && (
                    <Box 
                      sx={{ 
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        bgcolor: alpha(theme.palette.background.paper, 0.8),
                        borderRadius: 1,
                        px: 1,
                        py: 0.5
                      }}
                    >
                      <TerrainIcon sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {col.difficulty}/5
                      </Typography>
                    </Box>
                  )}
                </Card>
              </motion.div>
            </Grid>
          ))}
        </AnimatePresence>
      </Grid>
    </Paper>
  );
};

export default RecentColsWidget;
