import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Paper,
  Divider,
  Chip,
  Stack,
  useTheme,
  alpha,
  Tooltip,
  Avatar,
  useMediaQuery,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import TerrainIcon from '@mui/icons-material/Terrain';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StraightenIcon from '@mui/icons-material/Straighten';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FilterCenterFocusIcon from '@mui/icons-material/FilterCenterFocus';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

/**
 * Composant d'affichage et de gestion des cols sélectionnés pour un défi
 * Permet de réorganiser, supprimer et visualiser les statistiques des cols
 */
const SelectedColsView = ({ 
  selectedCols = [], 
  onRemoveCol, 
  onReorderCols,
  maxSelection = 7
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [reorderEnabled, setReorderEnabled] = useState(false);
  const [cols, setCols] = useState(selectedCols);
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggingEnabled, setDraggingEnabled] = useState(false);
  
  // Synchroniser le state local avec les props
  useEffect(() => {
    setCols(selectedCols);
  }, [selectedCols]);
  
  // Mise à jour de l'ordre des cols
  const handleReorder = (newOrder) => {
    setCols(newOrder);
    if (onReorderCols) {
      onReorderCols(newOrder);
    }
  };
  
  // Calculer les statistiques totales
  const totalDistance = cols.reduce((sum, col) => sum + col.length, 0).toFixed(1);
  const totalElevation = Math.round(cols.reduce((sum, col) => sum + (col.length * col.averageGradient * 10), 0));
  const averageGradient = cols.length > 0 
    ? (cols.reduce((sum, col) => sum + col.averageGradient, 0) / cols.length).toFixed(1) 
    : 0;
  const maxAltitude = cols.length > 0 
    ? Math.max(...cols.map(col => col.altitude)) 
    : 0;
    
  // Gérer le début du drag
  const handleDragStart = (col) => {
    setDraggedItem(col);
    setDraggingEnabled(true);
  };
  
  // Gérer la fin du drag
  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggingEnabled(false);
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.08,
        delayChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    },
    exit: { 
      opacity: 0, 
      x: 20, 
      scale: 0.9,
      transition: { duration: 0.2 }
    }
  };
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        background: theme => theme.palette.mode === 'dark' 
          ? alpha(theme.palette.background.paper, 0.4)
          : alpha(theme.palette.background.paper, 0.7),
        backdropFilter: 'blur(8px)',
        boxShadow: theme => theme.palette.mode === 'dark' 
          ? '0 8px 32px rgba(0,0,0,0.2)' 
          : '0 8px 32px rgba(0,0,0,0.07)',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: theme => theme.palette.mode === 'dark' 
          ? alpha(theme.palette.divider, 0.1)
          : alpha(theme.palette.divider, 0.5),
      }}
    >
      {/* Éléments décoratifs */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          left: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.03) 0%, rgba(99,102,241,0) 70%)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.03) 0%, rgba(99,102,241,0) 70%)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* En-tête */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3,
          position: 'relative',
          zIndex: 1
        }}>
          <Typography variant="h6" component="h3" fontWeight={600}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <EmojiEventsIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
              Cols sélectionnés ({cols.length}/{maxSelection})
            </Box>
          </Typography>
          
          {cols.length > 1 && (
            <Button
              variant={reorderEnabled ? "contained" : "outlined"}
              size="small"
              color={reorderEnabled ? "primary" : "inherit"}
              onClick={() => setReorderEnabled(!reorderEnabled)}
              startIcon={reorderEnabled ? <FilterCenterFocusIcon /> : <DragIndicatorIcon />}
              sx={{ 
                borderRadius: 6,
                px: 2,
                background: reorderEnabled 
                  ? 'linear-gradient(45deg, #2563EB 30%, #3B82F6 90%)'
                  : 'transparent',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: reorderEnabled ? '0 4px 12px rgba(37,99,235,0.3)' : 'none'
                }
              }}
            >
              {reorderEnabled ? "Terminer" : "Réorganiser"}
            </Button>
          )}
        </Box>
        
        {/* Statistiques du défi actuel */}
        {cols.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Tooltip title="Distance totale">
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 40, 
                        height: 40,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main',
                        mb: 1
                      }}
                    >
                      <StraightenIcon />
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      Distance
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {totalDistance} km
                    </Typography>
                  </Box>
                </Tooltip>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Tooltip title="Dénivelé total">
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 40, 
                        height: 40,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main',
                        mb: 1
                      }}
                    >
                      <TerrainIcon />
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      Dénivelé
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {totalElevation} m
                    </Typography>
                  </Box>
                </Tooltip>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Tooltip title="Altitude maximale">
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 40, 
                        height: 40,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main',
                        mb: 1
                      }}
                    >
                      <FilterCenterFocusIcon />
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      Altitude max
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {maxAltitude} m
                    </Typography>
                  </Box>
                </Tooltip>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Tooltip title="Pente moyenne">
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 40, 
                        height: 40,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main',
                        mb: 1
                      }}
                    >
                      <TrendingUpIcon />
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      Pente moyenne
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {averageGradient}%
                    </Typography>
                  </Box>
                </Tooltip>
              </Grid>
            </Grid>
          </Paper>
        )}
        
        {/* Grille des cols sélectionnés */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {cols.length > 0 ? (
            <Reorder.Group
              axis="y"
              values={cols}
              onReorder={handleReorder}
              as="div"
              style={{ 
                display: 'grid', 
                gap: '16px',
                gridTemplateColumns: isMobile ? '1fr' : '1fr',
                position: 'relative'
              }}
            >
              <AnimatePresence>
                {cols.map((col, index) => (
                  <Reorder.Item
                    key={col.id}
                    value={col}
                    dragListener={reorderEnabled}
                    dragControls={reorderEnabled}
                    onDragStart={() => handleDragStart(col)}
                    onDragEnd={handleDragEnd}
                    layoutId={`selected-col-${col.id}`}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ 
                      scale: draggedItem && draggedItem.id === col.id ? 1.02 : 1, 
                      opacity: 1,
                      boxShadow: draggedItem && draggedItem.id === col.id 
                        ? '0 16px 30px rgba(0,0,0,0.15)' 
                        : '0 4px 20px rgba(0,0,0,0.05)',
                      y: draggedItem && draggedItem.id === col.id ? -4 : 0
                    }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    style={{ 
                      borderRadius: '16px',
                      position: 'relative',
                      cursor: reorderEnabled ? 'grab' : 'default',
                      transform: 'none'
                    }}
                    whileHover={{ 
                      scale: reorderEnabled ? 1.01 : 1,
                      boxShadow: reorderEnabled ? '0 8px 30px rgba(0,0,0,0.12)' : 'none'
                    }}
                    whileDrag={{ 
                      scale: 1.03, 
                      boxShadow: '0 16px 30px rgba(0,0,0,0.2)',
                      cursor: 'grabbing',
                      zIndex: 10
                    }}
                  >
                    <Card 
                      sx={{ 
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        borderRadius: '16px',
                        background: alpha(theme.palette.background.paper, 0.7),
                        backdropFilter: 'blur(10px)',
                        overflow: 'hidden',
                        position: 'relative',
                        transition: 'all 0.3s ease',
                        '&::before': reorderEnabled ? {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: '4px',
                          background: 'linear-gradient(to bottom, #2563EB, #60A5FA)',
                          borderRadius: '4px 0 0 4px'
                        } : {}
                      }}
                    >
                      {/* Ordre du col */}
                      <Box 
                        sx={{ 
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          bgcolor: alpha(theme.palette.primary.main, 0.2),
                          color: theme.palette.primary.main,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '0.8rem',
                          border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                          zIndex: 2
                        }}
                      >
                        {index + 1}
                      </Box>
                      
                      {/* Image du col */}
                      <Box 
                        sx={{ 
                          width: { xs: '100%', sm: 120 },
                          position: 'relative',
                          height: { xs: 120, sm: 'auto' }
                        }}
                      >
                        <CardMedia
                          component="img"
                          sx={{ 
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          image={col.images?.thumbnail || '/images/cols/default-thumb.jpg'}
                          alt={col.name}
                        />
                        
                        {/* Badge d'altitude */}
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
                            p: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'white',
                              fontWeight: 600,
                              textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                            }}
                          >
                            {col.altitude} m
                          </Typography>
                        </Box>
                      </Box>
                      
                      {/* Contenu du col */}
                      <CardContent 
                        sx={{ 
                          flexGrow: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          py: 2,
                          position: 'relative'
                        }}
                      >
                        <Box>
                          <Typography variant="subtitle1" component="h3" fontWeight={600}>
                            {col.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {col.location?.country}{col.location?.region ? `, ${col.location.region}` : ''}
                          </Typography>
                          
                          <Box sx={{ 
                            display: 'flex', 
                            gap: { xs: 1, sm: 2 },
                            flexWrap: 'wrap',
                            my: 1
                          }}>
                            <Chip 
                              label={`${col.length} km`}
                              size="small"
                              icon={<StraightenIcon />}
                              sx={{ 
                                borderRadius: '20px',
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                              }}
                            />
                            <Chip 
                              label={`${col.averageGradient}%`}
                              size="small"
                              icon={<TrendingUpIcon />}
                              sx={{ 
                                borderRadius: '20px',
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                              }}
                            />
                            <Chip 
                              label={`Difficulté ${col.difficulty}/5`}
                              size="small"
                              icon={<TerrainIcon />}
                              sx={{ 
                                borderRadius: '20px',
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                              }}
                            />
                          </Box>
                        </Box>
                        
                        {/* Actions sur le col */}
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'flex-end',
                            mt: 1
                          }}
                        >
                          <IconButton
                            color="error"
                            onClick={() => onRemoveCol(col)}
                            disabled={reorderEnabled}
                            sx={{ 
                              '&.Mui-disabled': {
                                opacity: 0.3,
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </CardContent>
                      
                      {/* Indicateur de glisser-déposer */}
                      {reorderEnabled && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            right: 0,
                            width: 40,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main
                          }}
                        >
                          <DragIndicatorIcon />
                        </Box>
                      )}
                    </Card>
                  </Reorder.Item>
                ))}
              </AnimatePresence>
            </Reorder.Group>
          ) : (
            <Box 
              sx={{ 
                textAlign: 'center', 
                py: 6,
                px: 2,
                backgroundColor: alpha(theme.palette.background.paper, 0.5),
                borderRadius: 2,
                border: `1px dashed ${theme.palette.divider}`
              }}
            >
              <EmojiEventsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" gutterBottom>
                Aucun col sélectionné
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
                Choisissez jusqu'à {maxSelection} cols depuis la galerie pour créer votre défi personnalisé
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default SelectedColsView;
