import React from 'react';
import { ToggleButtonGroup, ToggleButton, Tooltip, useTheme, useMediaQuery } from '@mui/material';

/**
 * Composant permettant de sélectionner une période de temps pour les données affichées
 * @param {Object} props - Propriétés du composant
 * @param {string} props.currentTimeframe - Période actuellement sélectionnée
 * @param {Function} props.onChange - Fonction appelée lors du changement de période
 * @param {Array} [props.options] - Options de période personnalisées (optionnel)
 * @param {Object} [props.sx] - Styles supplémentaires (optionnel)
 */
const TimeframeSelector = ({ 
  currentTimeframe, 
  onChange, 
  options = [
    { value: 'week', label: '7 jours', tooltip: 'Derniers 7 jours' },
    { value: 'month', label: '30 jours', tooltip: 'Derniers 30 jours' },
    { value: 'year', label: '12 mois', tooltip: 'Derniers 12 mois' },
    { value: 'all', label: 'Tout', tooltip: 'Toutes les données disponibles' }
  ],
  sx = {} 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Gérer le changement de période
  const handleChange = (event, newTimeframe) => {
    if (newTimeframe !== null) {
      onChange(newTimeframe);
    }
  };
  
  return (
    <ToggleButtonGroup
      value={currentTimeframe}
      exclusive
      onChange={handleChange}
      aria-label="sélection de période"
      size={isMobile ? "small" : "medium"}
      sx={{
        borderRadius: '8px',
        bgcolor: theme.palette.background.paper,
        boxShadow: theme.shadows[1],
        ...sx
      }}
    >
      {options.map((option) => (
        <Tooltip key={option.value} title={option.tooltip} arrow>
          <ToggleButton 
            value={option.value} 
            aria-label={option.tooltip}
            sx={{
              px: isMobile ? 1.5 : 2,
              py: isMobile ? 0.5 : 0.75,
              fontWeight: 500,
              '&.Mui-selected': {
                bgcolor: `${theme.palette.primary.main}`,
                color: 'white',
                '&:hover': {
                  bgcolor: `${theme.palette.primary.dark}`,
                  color: 'white',
                }
              }
            }}
          >
            {option.label}
          </ToggleButton>
        </Tooltip>
      ))}
    </ToggleButtonGroup>
  );
};

export default TimeframeSelector;
