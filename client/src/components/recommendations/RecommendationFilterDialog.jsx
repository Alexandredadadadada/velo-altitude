import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Slider,
  Chip,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
  Grid,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close,
  TrendingUp,
  Landscape,
  DirectionsBike,
  Terrain,
  Speed
} from '@mui/icons-material';

/**
 * Dialogue de filtrage pour les recommandations d'itinéraires
 * 
 * @param {Object} props - Propriétés du composant
 * @param {boolean} props.open - Indique si le dialogue est ouvert
 * @param {Function} props.onClose - Fonction appelée à la fermeture du dialogue
 * @param {Function} props.onApply - Fonction appelée lors de l'application des filtres
 * @param {Object} props.currentFilters - Filtres actuellement appliqués
 */
const RecommendationFilterDialog = ({ open, onClose, onApply, currentFilters }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  // État local pour les filtres
  const [filters, setFilters] = useState({
    difficulty: [],
    distance: { min: 0, max: 200 },
    elevation: { min: 0, max: 3000 },
    surface: []
  });

  // Options de difficulté
  const difficultyOptions = [
    { value: 'facile', label: 'Facile', color: 'success' },
    { value: 'modere', label: 'Modéré', color: 'info' },
    { value: 'difficile', label: 'Difficile', color: 'warning' },
    { value: 'tres-difficile', label: 'Très difficile', color: 'error' }
  ];

  // Options de surface
  const surfaceOptions = [
    { value: 'route', label: 'Route', icon: <Speed fontSize="small" /> },
    { value: 'chemin', label: 'Chemin', icon: <Terrain fontSize="small" /> },
    { value: 'mixte', label: 'Mixte', icon: <DirectionsBike fontSize="small" /> }
  ];

  // Initialiser les filtres avec les valeurs actuelles
  useEffect(() => {
    if (currentFilters) {
      setFilters({
        difficulty: currentFilters.difficulty || [],
        distance: currentFilters.distance || { min: 0, max: 200 },
        elevation: currentFilters.elevation || { min: 0, max: 3000 },
        surface: currentFilters.surface || []
      });
    }
  }, [currentFilters, open]);

  /**
   * Gère le changement de la distance
   */
  const handleDistanceChange = (event, newValue) => {
    setFilters({
      ...filters,
      distance: {
        min: newValue[0],
        max: newValue[1]
      }
    });
  };

  /**
   * Gère le changement de l'élévation
   */
  const handleElevationChange = (event, newValue) => {
    setFilters({
      ...filters,
      elevation: {
        min: newValue[0],
        max: newValue[1]
      }
    });
  };

  /**
   * Gère le changement de la difficulté
   */
  const handleDifficultyChange = (value) => {
    const newDifficulty = filters.difficulty.includes(value)
      ? filters.difficulty.filter(item => item !== value)
      : [...filters.difficulty, value];
    
    setFilters({
      ...filters,
      difficulty: newDifficulty
    });
  };

  /**
   * Gère le changement de la surface
   */
  const handleSurfaceChange = (value) => {
    const newSurface = filters.surface.includes(value)
      ? filters.surface.filter(item => item !== value)
      : [...filters.surface, value];
    
    setFilters({
      ...filters,
      surface: newSurface
    });
  };

  /**
   * Réinitialise les filtres
   */
  const handleReset = () => {
    setFilters({
      difficulty: [],
      distance: { min: 0, max: 200 },
      elevation: { min: 0, max: 3000 },
      surface: []
    });
  };

  /**
   * Applique les filtres
   */
  const handleApply = () => {
    onApply(filters);
  };

  /**
   * Formate la valeur de distance pour l'affichage
   */
  const formatDistance = (value) => {
    return `${value} km`;
  };

  /**
   * Formate la valeur d'élévation pour l'affichage
   */
  const formatElevation = (value) => {
    return `${value} m`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 2,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TrendingUp sx={{ mr: 1 }} />
          <Typography variant="h6">Filtrer les itinéraires</Typography>
        </Box>
        <IconButton edge="end" color="inherit" onClick={onClose} aria-label="fermer">
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ py: 1 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <DirectionsBike sx={{ mr: 1 }} />
            Distance
          </Typography>
          
          <Box sx={{ px: 2, mt: 3, mb: 4 }}>
            <Slider
              value={[filters.distance.min, filters.distance.max]}
              onChange={handleDistanceChange}
              valueLabelDisplay="auto"
              valueLabelFormat={formatDistance}
              min={0}
              max={200}
              step={5}
              marks={[
                { value: 0, label: '0 km' },
                { value: 50, label: '50 km' },
                { value: 100, label: '100 km' },
                { value: 150, label: '150 km' },
                { value: 200, label: '200 km' }
              ]}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Min: {formatDistance(filters.distance.min)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Max: {formatDistance(filters.distance.max)}
              </Typography>
            </Box>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Landscape sx={{ mr: 1 }} />
            Dénivelé
          </Typography>
          
          <Box sx={{ px: 2, mt: 3, mb: 4 }}>
            <Slider
              value={[filters.elevation.min, filters.elevation.max]}
              onChange={handleElevationChange}
              valueLabelDisplay="auto"
              valueLabelFormat={formatElevation}
              min={0}
              max={3000}
              step={100}
              marks={[
                { value: 0, label: '0 m' },
                { value: 1000, label: '1000 m' },
                { value: 2000, label: '2000 m' },
                { value: 3000, label: '3000 m' }
              ]}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Min: {formatElevation(filters.elevation.min)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Max: {formatElevation(filters.elevation.max)}
              </Typography>
            </Box>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Difficulté
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            {difficultyOptions.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                color={option.color}
                variant={filters.difficulty.includes(option.value) ? "filled" : "outlined"}
                onClick={() => handleDifficultyChange(option.value)}
                sx={{ 
                  fontWeight: filters.difficulty.includes(option.value) ? 'bold' : 'normal',
                  '&:hover': {
                    opacity: 0.9
                  }
                }}
              />
            ))}
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Type de surface
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            {surfaceOptions.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                icon={option.icon}
                variant={filters.surface.includes(option.value) ? "filled" : "outlined"}
                onClick={() => handleSurfaceChange(option.value)}
                sx={{ 
                  fontWeight: filters.surface.includes(option.value) ? 'bold' : 'normal',
                  '&:hover': {
                    opacity: 0.9
                  }
                }}
              />
            ))}
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ 
        justifyContent: 'space-between', 
        px: 3, 
        py: 2,
        borderTop: `1px solid ${theme.palette.divider}`
      }}>
        <Button 
          onClick={handleReset}
          color="inherit"
        >
          Réinitialiser
        </Button>
        
        <Box>
          <Button 
            onClick={onClose}
            color="inherit"
            sx={{ mr: 1 }}
          >
            Annuler
          </Button>
          
          <Button 
            onClick={handleApply}
            color="primary"
            variant="contained"
          >
            Appliquer
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default RecommendationFilterDialog;
