import React from 'react';
import PropTypes from 'prop-types';
import { Box, CircularProgress, Skeleton, Typography, Paper, useTheme, alpha } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * Composant d'indicateur de chargement utilisé comme fallback pour le lazy loading
 * Fournit différentes visualisations selon le type de contenu en cours de chargement
 * 
 * @param {Object} props - Propriétés du composant
 * @param {string} props.type - Type de contenu en chargement ('navigation', 'content', 'image', 'card')
 * @param {number} props.height - Hauteur du composant (utilisé pour certains types)
 * @param {string} props.message - Message personnalisé à afficher
 * @param {boolean} props.showProgressValue - Si la valeur de progression doit être affichée
 * @param {number} props.progressValue - Valeur de progression (0-100)
 */
const LoadingFallback = ({ 
  type = 'content', 
  height, 
  message,
  showProgressValue = false,
  progressValue = 0
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  
  // Message par défaut selon le type
  const getDefaultMessage = () => {
    switch (type) {
      case 'navigation':
        return t('common.loadingNavigation');
      case 'content':
        return t('common.loadingContent');
      case 'image':
        return t('common.loadingImage');
      case 'card':
        return t('common.loadingCard');
      default:
        return t('common.loading');
    }
  };
  
  const displayMessage = message || getDefaultMessage();
  
  // Style pour le conteneur principal, adapté selon le type
  const getContainerStyle = () => {
    const baseStyle = { 
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      overflow: 'hidden'
    };
    
    switch (type) {
      case 'navigation':
        return {
          ...baseStyle,
          height: height || 64,
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.shadows[2]
        };
      case 'content':
        return {
          ...baseStyle,
          flexDirection: 'column',
          height: height || 'calc(100vh - 200px)',
          minHeight: 300,
          padding: theme.spacing(3)
        };
      case 'image':
        return {
          ...baseStyle,
          height: height || 200,
          backgroundColor: alpha(theme.palette.primary.main, 0.05),
          borderRadius: theme.shape.borderRadius
        };
      case 'card':
        return {
          ...baseStyle,
          flexDirection: 'column',
          height: height || 300,
          padding: theme.spacing(2),
          backgroundColor: theme.palette.background.paper,
          borderRadius: theme.shape.borderRadius,
          boxShadow: theme.shadows[1]
        };
      default:
        return baseStyle;
    }
  };
  
  // Rendu en fonction du type
  const renderFallback = () => {
    switch (type) {
      case 'navigation':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
            <Skeleton variant="rectangular" width={120} height={32} />
            <Box sx={{ flex: 1, mx: 2 }} />
            <Skeleton variant="rectangular" width={40} height={24} sx={{ mr: 1 }} />
            <Skeleton variant="rectangular" width={40} height={24} />
          </Box>
        );
      
      case 'content':
        return (
          <>
            <CircularProgress 
              size={48} 
              variant={showProgressValue ? 'determinate' : 'indeterminate'} 
              value={progressValue}
              aria-label={displayMessage}
            />
            <Typography 
              variant="body1" 
              sx={{ mt: 2, color: 'text.secondary' }}
              aria-live="polite"
            >
              {displayMessage}
              {showProgressValue && ` (${Math.round(progressValue)}%)`}
            </Typography>
            
            <Box sx={{ width: '100%', maxWidth: 800, mt: 6 }}>
              <Skeleton variant="rectangular" width="100%" height={60} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" width="90%" height={30} sx={{ mb: 1.5 }} />
              <Skeleton variant="rectangular" width="80%" height={30} sx={{ mb: 1.5 }} />
              <Skeleton variant="rectangular" width="95%" height={30} sx={{ mb: 3 }} />
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 2 }}>
                <Skeleton variant="rectangular" width="48%" height={120} />
                <Skeleton variant="rectangular" width="48%" height={120} />
                <Skeleton variant="rectangular" width="48%" height={120} />
                <Skeleton variant="rectangular" width="48%" height={120} />
              </Box>
            </Box>
          </>
        );
      
      case 'image':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={30} aria-label={displayMessage} />
          </Box>
        );
      
      case 'card':
        return (
          <>
            <Skeleton variant="rectangular" width="100%" height={140} />
            <Box sx={{ width: '100%', p: 2 }}>
              <Skeleton variant="text" width="80%" height={32} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="60%" height={20} sx={{ mb: 2 }} />
              <Skeleton variant="text" width="90%" height={20} />
              <Skeleton variant="text" width="90%" height={20} />
              <Skeleton variant="text" width="40%" height={20} sx={{ mt: 2 }} />
            </Box>
          </>
        );
      
      default:
        return (
          <CircularProgress aria-label={displayMessage} />
        );
    }
  };
  
  // Ajouter un wrapper Paper pour le type card
  const content = renderFallback();
  if (type === 'card') {
    return (
      <Paper 
        elevation={1} 
        sx={getContainerStyle()}
        role="alert"
        aria-busy="true"
      >
        {content}
      </Paper>
    );
  }
  
  return (
    <Box 
      sx={getContainerStyle()}
      role="alert"
      aria-busy="true"
    >
      {content}
    </Box>
  );
};

LoadingFallback.propTypes = {
  type: PropTypes.oneOf(['navigation', 'content', 'image', 'card']),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  message: PropTypes.string,
  showProgressValue: PropTypes.bool,
  progressValue: PropTypes.number
};

export default LoadingFallback;
