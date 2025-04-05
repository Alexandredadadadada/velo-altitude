import React, { useState, useEffect, memo } from 'react';
import { useTheme } from '@mui/material/styles';
import { 
  IconButton, 
  Tooltip, 
  useMediaQuery, 
  Box, 
  Zoom,
  Badge
} from '@mui/material';
import { 
  DarkMode as DarkIcon, 
  LightMode as LightIcon 
} from '@mui/icons-material';
import { toggleTheme } from '../../theme/materialTheme';
import themeManager from '../../utils/ThemeManager';

/**
 * Composant de bascule entre les modes clair et sombre
 * Optimisé avec React.memo pour éviter les re-renders inutiles
 * 
 * @param {Object} props - Propriétés du composant
 * @param {string} props.tooltipPlacement - Placement du tooltip (par défaut: "bottom")
 * @param {string} props.size - Taille du bouton (par défaut: "medium")
 * @param {string} props.lightTooltip - Texte du tooltip pour le mode clair (traduit par défaut)
 * @param {string} props.darkTooltip - Texte du tooltip pour le mode sombre (traduit par défaut)
 * @param {Object} props.sx - Styles personnalisés pour le conteneur
 */
const ThemeToggle = memo(({
  tooltipPlacement = "bottom",
  size = "medium",
  lightTooltip = "Passer en mode sombre",
  darkTooltip = "Passer en mode clair",
  sx = {}
}) => {
  const theme = useTheme();
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [isDarkMode, setIsDarkMode] = useState(themeManager.isDarkModeEnabled());
  const [showBadge, setShowBadge] = useState(false);

  // Effet pour montrer temporairement le badge lors du premier chargement
  // ou lorsque la préférence système change
  useEffect(() => {
    // Afficher le badge pendant 3 secondes
    setShowBadge(true);
    const timer = setTimeout(() => {
      setShowBadge(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [prefersDarkMode]);

  // Mettre à jour le state local lors des changements de thème
  useEffect(() => {
    const handleThemeChange = (darkMode) => {
      setIsDarkMode(darkMode);
    };
    
    themeManager.addThemeListener(handleThemeChange);
    return () => themeManager.removeThemeListener(handleThemeChange);
  }, []);

  const handleToggle = () => {
    const newMode = toggleTheme();
    setIsDarkMode(newMode);
  };
  
  return (
    <Box sx={sx}>
      <Tooltip 
        title={isDarkMode ? darkTooltip : lightTooltip} 
        placement={tooltipPlacement}
        TransitionComponent={Zoom}
        arrow
      >
        <Badge
          color="secondary"
          variant="dot"
          invisible={!showBadge}
        >
          <IconButton 
            onClick={handleToggle} 
            color="inherit"
            size={size}
            aria-label={isDarkMode ? "Mode clair" : "Mode sombre"}
            sx={{
              transition: theme.transitions.create(['transform'], {
                duration: theme.transitions.duration.shorter,
              }),
              '&:hover': {
                transform: 'rotate(12deg)',
              },
            }}
          >
            {isDarkMode ? <LightIcon /> : <DarkIcon />}
          </IconButton>
        </Badge>
      </Tooltip>
    </Box>
  );
});

export default ThemeToggle;
