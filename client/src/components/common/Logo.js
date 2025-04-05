import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Box, useTheme } from '@mui/material';
import { DirectionsBike as BikeIcon, Terrain as MountainIcon } from '@mui/icons-material';
import { brandConfig } from '../../config/branding';

/**
 * Composant Logo pour l'application Velo-Altitude
 * Optimisé avec React.memo pour éviter les re-renders inutiles
 * 
 * @param {Object} props - Les propriétés du composant
 * @param {number} props.height - Hauteur du logo en pixels
 * @param {string} props.variant - Variante du logo (color, mono, white)
 * @param {boolean} props.clickable - Si le logo est cliquable (renvoie à la page d'accueil)
 */
const Logo = memo(({ height = 40, variant = 'color', clickable = true }) => {
  const theme = useTheme();
  
  // Définir les couleurs en fonction du variant et du thème
  const getColors = () => {
    const isDarkMode = theme.palette.mode === 'dark';
    
    switch (variant) {
      case 'mono':
        return {
          primary: isDarkMode ? '#ffffff' : '#000000',
          secondary: isDarkMode ? '#ffffff' : '#000000',
          tertiary: isDarkMode ? '#ffffff' : '#000000',
          mountain: isDarkMode ? '#ffffff' : '#000000',
        };
      case 'white':
        return {
          primary: '#ffffff',
          secondary: '#ffffff',
          tertiary: '#ffffff',
          mountain: '#ffffff',
        };
      case 'color':
      default:
        return {
          primary: brandConfig.colors.primary,
          secondary: brandConfig.colors.secondary,
          tertiary: brandConfig.colors.altitude,
          mountain: brandConfig.colors.mountain,
        };
    }
  };
  
  const colors = getColors();
  const scaleFactor = height / 40; // Base height is 40px
  
  // Logo simple avec icône pour les petites tailles
  if (height < 30) {
    return (
      <Box 
        component={clickable ? Link : 'div'}
        to={clickable ? "/" : undefined}
        sx={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.primary,
          textDecoration: 'none'
        }}
      >
        <BikeIcon sx={{ fontSize: height, color: 'inherit' }} />
      </Box>
    );
  }
  
  // Logo complet pour les tailles normales
  const LogoContent = (
    <Box sx={{ display: 'flex', alignItems: 'center', height: height }}>
      {/* Icône de vélo */}
      <BikeIcon 
        sx={{ 
          fontSize: height, 
          color: colors.primary,
          transform: 'translateY(-2px)',
          mr: 0.5
        }} 
      />
      
      {/* Icône de montagne */}
      <MountainIcon
        sx={{
          fontSize: height * 0.8,
          color: colors.mountain,
          position: 'absolute',
          transform: `translateX(${height * 0.5}px)`,
          zIndex: -1
        }}
      />
      
      {/* Graphique d'élévation stylisé */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'flex-end', 
        height: height * 0.5, 
        ml: 1
      }}>
        <Box sx={{ width: 4 * scaleFactor, height: '30%', bgcolor: colors.secondary, borderRadius: '1px' }} />
        <Box sx={{ width: 4 * scaleFactor, height: '50%', bgcolor: colors.tertiary, borderRadius: '1px', mx: 0.3 * scaleFactor }} />
        <Box sx={{ width: 4 * scaleFactor, height: '80%', bgcolor: colors.primary, borderRadius: '1px' }} />
        <Box sx={{ width: 4 * scaleFactor, height: '60%', bgcolor: colors.mountain, borderRadius: '1px', mx: 0.3 * scaleFactor }} />
        <Box sx={{ width: 4 * scaleFactor, height: '100%', bgcolor: colors.tertiary, borderRadius: '1px' }} />
      </Box>
    </Box>
  );
  
  // Si le logo est cliquable, l'entourer d'un Link
  if (clickable) {
    return (
      <Link to="/" style={{ textDecoration: 'none', display: 'flex' }}>
        {LogoContent}
      </Link>
    );
  }
  
  return LogoContent;
});

Logo.propTypes = {
  height: PropTypes.number,
  variant: PropTypes.oneOf(['color', 'mono', 'white']),
  clickable: PropTypes.bool,
};

export default Logo;
