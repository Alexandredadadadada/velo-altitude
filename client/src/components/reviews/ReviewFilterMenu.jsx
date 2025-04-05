import React, { useState, useEffect } from 'react';
import {
  Menu,
  Box,
  Typography,
  Divider,
  Slider,
  FormControlLabel,
  Checkbox,
  Button,
  Rating
} from '@mui/material';

/**
 * Menu de filtrage pour les avis
 * 
 * @param {Object} props - Propriétés du composant
 * @param {HTMLElement} props.anchorEl - Élément d'ancrage du menu
 * @param {Function} props.onClose - Fonction appelée à la fermeture du menu
 * @param {Function} props.onApply - Fonction appelée lors de l'application des filtres
 * @param {Object} props.currentFilters - Filtres actuellement appliqués
 */
const ReviewFilterMenu = ({ anchorEl, onClose, onApply, currentFilters }) => {
  // État local pour les filtres
  const [filters, setFilters] = useState({
    minRating: 0,
    maxRating: 5,
    hasComments: false
  });

  // Initialiser les filtres avec les valeurs actuelles
  useEffect(() => {
    if (currentFilters) {
      setFilters({
        minRating: currentFilters.minRating !== undefined ? currentFilters.minRating : 0,
        maxRating: currentFilters.maxRating !== undefined ? currentFilters.maxRating : 5,
        hasComments: currentFilters.hasComments || false
      });
    }
  }, [currentFilters, anchorEl]);

  // Gérer les changements de filtres
  const handleChange = (field) => (event, newValue) => {
    setFilters({
      ...filters,
      [field]: newValue !== undefined ? newValue : event.target.checked
    });
  };

  // Appliquer les filtres
  const handleApply = () => {
    onApply(filters);
  };

  // Réinitialiser les filtres
  const handleReset = () => {
    const defaultFilters = {
      minRating: 0,
      maxRating: 5,
      hasComments: false
    };
    setFilters(defaultFilters);
    onApply(defaultFilters);
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      PaperProps={{
        elevation: 3,
        sx: { 
          width: 300,
          maxWidth: '90vw',
          borderRadius: 2,
          p: 2
        }
      }}
    >
      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
        Filtrer les avis
      </Typography>
      
      <Divider sx={{ my: 1.5 }} />
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Note
        </Typography>
        
        <Box sx={{ px: 1 }}>
          <Slider
            value={[filters.minRating, filters.maxRating]}
            onChange={(event, newValue) => {
              setFilters({
                ...filters,
                minRating: newValue[0],
                maxRating: newValue[1]
              });
            }}
            valueLabelDisplay="auto"
            step={1}
            marks
            min={0}
            max={5}
            valueLabelFormat={(value) => `${value} ★`}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                Min:
              </Typography>
              <Rating 
                value={filters.minRating} 
                readOnly 
                size="small" 
                precision={1}
              />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                Max:
              </Typography>
              <Rating 
                value={filters.maxRating} 
                readOnly 
                size="small" 
                precision={1}
              />
            </Box>
          </Box>
        </Box>
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.hasComments}
              onChange={handleChange('hasComments')}
              color="primary"
            />
          }
          label="Afficher uniquement les avis avec commentaires"
        />
      </Box>
      
      <Divider sx={{ my: 1.5 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button 
          onClick={handleReset}
          color="inherit"
          size="small"
        >
          Réinitialiser
        </Button>
        
        <Box>
          <Button 
            onClick={onClose}
            color="inherit"
            size="small"
            sx={{ mr: 1 }}
          >
            Annuler
          </Button>
          
          <Button 
            onClick={handleApply}
            color="primary"
            variant="contained"
            size="small"
          >
            Appliquer
          </Button>
        </Box>
      </Box>
    </Menu>
  );
};

export default ReviewFilterMenu;
