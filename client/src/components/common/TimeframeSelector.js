import React from 'react';
import { 
  ToggleButtonGroup, 
  ToggleButton, 
  Tooltip, 
  useTheme, 
  useMediaQuery,
  Box,
  alpha
} from '@mui/material';

/**
 * Composant permettant de sélectionner une période de temps pour les données affichées
 * @param {Object} props - Propriétés du composant
 * @param {string} props.value - Période actuellement sélectionnée
 * @param {Function} props.onChange - Fonction appelée lors du changement de période
 * @param {Array} [props.options] - Options de période personnalisées (optionnel)
 * @param {string} [props['aria-label']] - Label d'accessibilité (optionnel)
 * @param {Object} [props.sx] - Styles supplémentaires (optionnel)
 */
const TimeframeSelector = ({ 
  value, 
  onChange, 
  options = [
    { value: 'week', label: '7 jours', tooltip: 'Derniers 7 jours' },
    { value: 'month', label: '30 jours', tooltip: 'Derniers 30 jours' },
    { value: 'year', label: '12 mois', tooltip: 'Derniers 12 mois' },
    { value: 'all', label: 'Tout', tooltip: 'Toutes les données disponibles' }
  ],
  "aria-label": ariaLabel = "Sélection de période",
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
    <Box
      role="group"
      aria-labelledby={ariaLabel.replace(/\s+/g, '-').toLowerCase()}
    >
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={handleChange}
        aria-label={ariaLabel}
        size={isMobile ? "small" : "medium"}
        sx={{
          borderRadius: theme.shape.borderRadius,
          bgcolor: theme.palette.background.paper,
          boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.08)}`,
          transition: theme.transitions.create(['box-shadow']),
          '&:hover': {
            boxShadow: `0 2px 6px ${alpha(theme.palette.common.black, 0.12)}`,
          },
          ...sx
        }}
      >
        {options.map((option) => (
          <Tooltip 
            key={option.value} 
            title={option.tooltip || option.label} 
            arrow
            placement="top"
          >
            <ToggleButton 
              value={option.value} 
              aria-label={option.tooltip || `Sélectionner période: ${option.label}`}
              sx={{
                px: isMobile ? 1.5 : 2,
                py: isMobile ? 0.5 : 0.75,
                fontWeight: 500,
                textTransform: 'none',
                transition: theme.transitions.create(['background-color', 'color', 'box-shadow'], {
                  duration: theme.transitions.duration.short,
                }),
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                    color: theme.palette.primary.contrastText,
                  }
                },
                '&:focus-visible': {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: 2,
                }
              }}
            >
              {option.label}
            </ToggleButton>
          </Tooltip>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
};

export default TimeframeSelector;
