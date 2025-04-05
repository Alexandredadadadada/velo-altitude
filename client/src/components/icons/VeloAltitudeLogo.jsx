import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { FilterHdr } from '@mui/icons-material';

/**
 * Logo animé Velo-Altitude avec effets de montagne et vélo
 * 
 * @param {Object} props - Propriétés du composant
 * @param {String} props.variant - Variante du logo ('full', 'compact', 'icon')
 * @param {String} props.color - Couleur du texte ('primary', 'secondary', 'white', etc.)
 * @param {Number} props.fontSize - Taille de la police
 * @param {Object} props.sx - Styles supplémentaires
 * @returns {JSX.Element} - Composant logo
 */
const VeloAltitudeLogo = ({ 
  variant = 'full', 
  color = 'primary', 
  fontSize = 24,
  sx = {},
  ...props 
}) => {
  const theme = useTheme();
  
  // Animations
  const logoVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.8,
        ease: "easeOut"
      }
    },
    hover: {
      scale: 1.02,
      transition: { 
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };
  
  const mountainVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        delay: 0.2,
        ease: "easeOut"
      }
    },
    hover: {
      y: -3,
      transition: { 
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };
  
  const bikePathVariants = {
    initial: { pathLength: 0 },
    animate: { 
      pathLength: 1,
      transition: { 
        duration: 1.5,
        ease: "easeInOut"
      }
    }
  };

  // Couleurs dégradées pour le logo
  const gradientColors = {
    primary: `linear-gradient(120deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
    secondary: `linear-gradient(120deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
    white: 'linear-gradient(120deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))',
    accent: `linear-gradient(120deg, #e65100, #ff9800)`
  };
  
  const textColor = gradientColors[color] || (color === 'white' ? 'white' : theme.palette[color]?.main || color);
  
  // Rendu variant compact (juste l'icône avec le nom)
  if (variant === 'compact') {
    return (
      <Box
        component={motion.div}
        initial="initial"
        animate="animate"
        whileHover="hover"
        display="flex"
        alignItems="center"
        sx={{ 
          cursor: 'pointer',
          ...sx 
        }}
        {...props}
      >
        <Box 
          component={motion.div}
          variants={mountainVariants}
          sx={{ 
            mr: 1,
            display: 'flex',
            color: theme.palette.primary.main
          }}
        >
          <FilterHdr fontSize="large" />
        </Box>
        
        <Typography
          component={motion.div}
          variants={logoVariants}
          sx={{ 
            fontWeight: 700,
            fontSize: fontSize || 24,
            letterSpacing: 1,
            background: textColor,
            ...(typeof textColor === 'string' && textColor.includes('gradient') ? {
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            } : { color: textColor }),
          }}
        >
          Velo-Altitude
        </Typography>
      </Box>
    );
  }
  
  // Rendu icon only (juste l'icône stylisée)
  if (variant === 'icon') {
    return (
      <Box
        component={motion.div}
        initial="initial"
        animate="animate"
        whileHover="hover"
        sx={{ 
          cursor: 'pointer',
          width: fontSize * 2,
          height: fontSize * 2,
          position: 'relative',
          ...sx
        }}
        {...props}
      >
        <Box 
          component={motion.div}
          variants={mountainVariants}
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            color: theme.palette.primary.main,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FilterHdr sx={{ fontSize: fontSize * 1.5 }} />
        </Box>
        
        {/* Cercle autour de l'icône */}
        <Box 
          component={motion.div}
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: `2px solid ${theme.palette.primary.main}`,
            opacity: 0.7
          }}
        />
      </Box>
    );
  }
  
  // Rendu version complète par défaut
  return (
    <Box
      component={motion.div}
      initial="initial"
      animate="animate"
      whileHover="hover"
      display="flex"
      flexDirection="column"
      alignItems="center"
      sx={{ 
        cursor: 'pointer',
        ...sx 
      }}
      {...props}
    >
      <Typography
        component={motion.div}
        variants={logoVariants}
        sx={{ 
          fontWeight: 700,
          fontSize: fontSize || 32,
          letterSpacing: 1.5,
          mb: 0.5,
          background: textColor,
          ...(typeof textColor === 'string' && textColor.includes('gradient') ? {
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          } : { color: textColor }),
        }}
      >
        VELO-ALTITUDE
      </Typography>
      
      <Box 
        component={motion.div}
        variants={mountainVariants}
        sx={{ 
          position: 'relative',
          width: fontSize * 4,
          height: fontSize * 1.2,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {/* Silhouette de montagne */}
        <Box 
          sx={{ 
            color: theme.palette.primary.main,
            transform: 'scale(1.5)'
          }}
        >
          <FilterHdr fontSize="large" />
        </Box>
        
        {/* Ligne sinueuse (chemin de vélo) */}
        <Box
          component="svg"
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
          }}
          viewBox="0 0 100 30"
        >
          <motion.path
            d="M0,25 C20,5 30,30 50,15 C70,0 80,25 100,10"
            fill="transparent"
            stroke={theme.palette.secondary.main}
            strokeWidth="2"
            strokeLinecap="round"
            variants={bikePathVariants}
            initial="initial"
            animate="animate"
          />
        </Box>
      </Box>
      
      <Typography
        variant="caption"
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: 0.9,
          transition: { delay: 0.8, duration: 0.5 }
        }}
        sx={{ 
          fontStyle: 'italic',
          letterSpacing: 1,
          color: theme.palette.text.secondary,
          mt: 0.5
        }}
      >
        Relevez le défi des cols
      </Typography>
    </Box>
  );
};

export default VeloAltitudeLogo;
