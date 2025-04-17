/**
 * Composants standardisés pour les états de chargement dans Velo-Altitude
 * Fournit des composants cohérents pour les skeletons, spinners et états de chargement
 */

import React from 'react';
import { Box, CircularProgress, LinearProgress, Skeleton, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

// Types
interface LoadingProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'circular' | 'linear';
  transparent?: boolean;
  fullPage?: boolean;
}

interface SkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: number | string;
  height?: number | string;
  count?: number;
  animation?: 'pulse' | 'wave' | false;
}

// Styles
const LoadingContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'transparent' && prop !== 'fullPage'
})<{ transparent?: boolean; fullPage?: boolean }>(({ theme, transparent, fullPage }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(3),
  margin: 'auto',
  backgroundColor: transparent ? 'transparent' : theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  ...(fullPage && {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: theme.zIndex.modal,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  }),
}));

const SkeletonContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  '& > *': {
    margin: theme.spacing(0.5, 0),
  },
}));

/**
 * Composant LoadingSpinner standard
 * Affiche un indicateur de chargement circulaire ou linéaire avec un message optionnel
 */
export const LoadingSpinner: React.FC<LoadingProps> = ({
  message = 'Chargement en cours...',
  size = 'medium',
  variant = 'circular',
  transparent = false,
  fullPage = false
}) => {
  // Mapper les tailles en pixels
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 60
  };
  
  const spinnerSize = sizeMap[size];
  
  return (
    <LoadingContainer transparent={transparent} fullPage={fullPage}>
      {variant === 'circular' ? (
        <CircularProgress 
          size={spinnerSize} 
          thickness={4} 
          color="primary"
          aria-label="Chargement"
        />
      ) : (
        <Box sx={{ width: '100%', maxWidth: 300 }}>
          <LinearProgress 
            color="primary"
            aria-label="Chargement"
          />
        </Box>
      )}
      
      {message && (
        <Typography 
          variant="body2" 
          color="textSecondary" 
          sx={{ mt: 2, textAlign: 'center' }}
        >
          {message}
        </Typography>
      )}
    </LoadingContainer>
  );
};

/**
 * Squelette de chargement pour les cartes recettes
 */
export const RecipeCardSkeleton: React.FC = () => (
  <Box sx={{ width: '100%', borderRadius: 2, overflow: 'hidden' }}>
    <Skeleton variant="rectangular" width="100%" height={180} animation="wave" />
    <Box sx={{ p: 2 }}>
      <Skeleton variant="text" width="70%" height={28} animation="wave" />
      <Skeleton variant="text" width="40%" height={20} animation="wave" />
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Skeleton variant="rectangular" width="30%" height={36} animation="wave" />
        <Skeleton variant="circular" width={36} height={36} animation="wave" />
      </Box>
    </Box>
  </Box>
);

/**
 * Squelette de chargement pour les éléments de liste
 */
export const ListItemSkeleton: React.FC = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', py: 1, width: '100%' }}>
    <Skeleton variant="circular" width={40} height={40} animation="wave" />
    <Box sx={{ ml: 2, width: '100%' }}>
      <Skeleton variant="text" width="60%" height={24} animation="wave" />
      <Skeleton variant="text" width="40%" height={16} animation="wave" />
    </Box>
  </Box>
);

/**
 * Squelette de chargement pour les détails de col
 */
export const ColDetailSkeleton: React.FC = () => (
  <Box sx={{ width: '100%' }}>
    <Skeleton variant="rectangular" width="100%" height={300} animation="wave" />
    <Box sx={{ p: 2 }}>
      <Skeleton variant="text" width="50%" height={40} animation="wave" />
      <Skeleton variant="text" width="70%" height={24} animation="wave" />
      
      <Box sx={{ display: 'flex', mt: 2, mb: 2 }}>
        <Skeleton variant="rectangular" width={80} height={80} animation="wave" />
        <Box sx={{ ml: 2, flex: 1 }}>
          <Skeleton variant="text" width="90%" height={20} animation="wave" />
          <Skeleton variant="text" width="80%" height={20} animation="wave" />
          <Skeleton variant="text" width="70%" height={20} animation="wave" />
        </Box>
      </Box>
      
      <Skeleton variant="rectangular" width="100%" height={200} animation="wave" />
    </Box>
  </Box>
);

/**
 * Squelette de chargement pour les séances d'entraînement
 */
export const WorkoutSkeleton: React.FC = () => (
  <Box sx={{ width: '100%', p: 2, border: '1px solid #eee', borderRadius: 2 }}>
    <Skeleton variant="text" width="60%" height={32} animation="wave" />
    <Skeleton variant="text" width="40%" height={20} animation="wave" />
    
    <Box sx={{ mt: 2 }}>
      <Skeleton variant="rectangular" width="100%" height={120} animation="wave" />
    </Box>
    
    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
      <Skeleton variant="rectangular" width="48%" height={36} animation="wave" />
      <Skeleton variant="rectangular" width="48%" height={36} animation="wave" />
    </Box>
  </Box>
);

/**
 * Composant LoadingSkeleton générique
 * Génère plusieurs squelettes selon les paramètres
 */
export const LoadingSkeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width = '100%',
  height = 100,
  count = 3,
  animation = 'pulse'
}) => (
  <SkeletonContainer>
    {Array(count).fill(0).map((_, index) => (
      <Skeleton 
        key={index}
        variant={variant}
        width={width}
        height={height}
        animation={animation}
      />
    ))}
  </SkeletonContainer>
);

/**
 * Composant d'état vide
 * À utiliser quand aucune donnée n'est disponible
 */
export const EmptyState: React.FC<{
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}> = ({ 
  message = "Aucune donnée disponible", 
  icon, 
  action 
}) => (
  <Box 
    sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      py: 4,
      px: 2,
      textAlign: 'center'
    }}
  >
    {icon && <Box sx={{ mb: 2, fontSize: '3rem' }}>{icon}</Box>}
    <Typography variant="body1" color="textSecondary" gutterBottom>
      {message}
    </Typography>
    {action && <Box sx={{ mt: 2 }}>{action}</Box>}
  </Box>
);

export default {
  LoadingSpinner,
  LoadingSkeleton,
  RecipeCardSkeleton,
  ListItemSkeleton,
  ColDetailSkeleton,
  WorkoutSkeleton,
  EmptyState
};
