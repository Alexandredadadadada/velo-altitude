/**
 * Utilitaire pour faciliter le chargement paresseux (lazy loading) des composants
 * et données dans l'application Dashboard-Velo
 */

import React, { lazy, Suspense } from 'react';
import { LinearProgress, Skeleton, Box, Typography, Paper } from '@mui/material';
import { DirectionsBike } from '@mui/icons-material';

/**
 * Wrapper d'un composant React pour le lazy loading avec un fallback visuellement attrayant
 * @param {Function} importFunction - Fonction d'importation dynamique du composant
 * @param {Object} options - Options de configuration
 * @param {string} options.moduleName - Nom du module pour l'affichage dans le fallback
 * @param {number} options.minDelay - Délai minimum d'affichage du fallback (ms)
 * @param {string} options.skeletonType - Type de squelette ('text', 'card', 'complex', 'content')
 * @param {number} options.skeletonHeight - Hauteur du squelette (px)
 * @returns {React.LazyExoticComponent} Composant avec lazy loading
 */
export const lazyLoad = (importFunction, options = {}) => {
  const {
    moduleName = 'Composant',
    minDelay = 300,
    skeletonType = 'content',
    skeletonHeight = 400
  } = options;
  
  // Ajout d'un délai minimum pour éviter les flashs
  const importWithMinDelay = () => {
    return Promise.all([
      importFunction(),
      new Promise(resolve => setTimeout(resolve, minDelay))
    ]).then(([moduleExport]) => moduleExport);
  };
  
  const LazyComponent = lazy(importWithMinDelay);
  
  return props => (
    <Suspense fallback={<LoadingFallback type={skeletonType} name={moduleName} height={skeletonHeight} />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

/**
 * Composant fallback visuellement attrayant pour les composants en chargement
 * @param {Object} props - Propriétés du composant
 * @param {string} props.type - Type de fallback ('text', 'card', 'complex', 'content')
 * @param {string} props.name - Nom du module en cours de chargement
 * @param {number} props.height - Hauteur du fallback
 * @returns {React.Component} Composant de fallback
 */
export const LoadingFallback = ({ type = 'content', name = 'Contenu', height = 400 }) => {
  // Styles communs
  const commonStyles = {
    width: '100%',
    height: height,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden'
  };
  
  // Animation du cycliste
  const bikeAnimation = {
    '@keyframes ride': {
      '0%': { transform: 'translateX(-100%)' },
      '100%': { transform: 'translateX(100%)' }
    },
    animation: 'ride 4s infinite linear',
    position: 'absolute',
    bottom: '20%',
    fontSize: 40,
    color: 'primary.main',
  };
  
  switch (type) {
    case 'text':
      return (
        <Box sx={{ width: '100%', p: 2 }}>
          <Skeleton animation="wave" height={40} width="70%" />
          <Skeleton animation="wave" height={20} width="90%" />
          <Skeleton animation="wave" height={20} width="85%" />
          <Skeleton animation="wave" height={20} width="80%" />
          <LinearProgress color="primary" sx={{ mt: 1 }} />
        </Box>
      );
      
    case 'card':
      return (
        <Paper elevation={2} sx={{ p: 2, width: '100%' }}>
          <Skeleton animation="wave" variant="rectangular" height={140} width="100%" />
          <Skeleton animation="wave" height={40} width="60%" sx={{ mt: 2 }} />
          <Skeleton animation="wave" height={20} width="90%" />
          <Skeleton animation="wave" height={20} width="85%" />
          <Skeleton animation="wave" height={36} width="30%" sx={{ mt: 1 }} />
          <LinearProgress color="primary" sx={{ mt: 2 }} />
        </Paper>
      );
      
    case 'complex':
      return (
        <Box sx={{ width: '100%' }}>
          <Box sx={{ mb: 2 }}>
            <Skeleton animation="wave" height={40} width="50%" />
            <LinearProgress color="primary" sx={{ mt: 1 }} />
          </Box>
          <Grid container spacing={2}>
            {[1, 2, 3, 4].map(i => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Skeleton animation="wave" variant="rectangular" height={120} />
                  <Skeleton animation="wave" height={30} width="80%" sx={{ mt: 1 }} />
                  <Skeleton animation="wave" height={20} width="90%" />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      );
      
    case 'content':
    default:
      return (
        <Box sx={commonStyles}>
          <Box 
            sx={{
              borderRadius: 2,
              backgroundColor: 'background.paper',
              p: 3,
              textAlign: 'center',
              maxWidth: 400,
              zIndex: 1
            }}
          >
            <Typography variant="h6" color="primary" gutterBottom>
              Chargement du module {name}
            </Typography>
            <LinearProgress color="primary" sx={{ mb: 2, mt: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Préparation des données en cours...
            </Typography>
          </Box>
          
          <Box sx={bikeAnimation}>
            <DirectionsBike fontSize="inherit" color="inherit" />
          </Box>
        </Box>
      );
  }
};

/**
 * Fonction pour créer un composant React qui charge les données selon une stratégie de lazy loading
 * @param {Function} Component - Composant React à wrapper
 * @param {Function} dataFetcher - Fonction asynchrone qui charge les données
 * @returns {Function} Composant avec chargement de données optimisé
 */
export const withLazyData = (Component, dataFetcher) => {
  return function WithLazyDataWrapper(props) {
    const [data, setData] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    
    React.useEffect(() => {
      let isMounted = true;
      
      const fetchData = async () => {
        try {
          setLoading(true);
          // Simuler un délai minimum pour éviter les flashs de chargement
          const [result] = await Promise.all([
            dataFetcher(props),
            new Promise(resolve => setTimeout(resolve, 300))
          ]);
          
          if (isMounted) {
            setData(result);
            setLoading(false);
          }
        } catch (err) {
          console.error('Erreur lors du chargement des données:', err);
          if (isMounted) {
            setError(err);
            setLoading(false);
          }
        }
      };
      
      fetchData();
      
      return () => {
        isMounted = false;
      };
    }, [props.id]); // Rechargement quand l'ID change
    
    if (loading) {
      return (
        <LoadingFallback 
          type={props.loadingType || 'content'} 
          name={props.moduleName || 'données'} 
          height={props.loadingHeight || 400} 
        />
      );
    }
    
    if (error) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Impossible de charger les données
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Une erreur s'est produite. Veuillez réessayer plus tard.
          </Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            sx={{ mt: 2 }} 
            onClick={() => window.location.reload()}
          >
            Réessayer
          </Button>
        </Box>
      );
    }
    
    return <Component {...props} data={data} />;
  };
};

// Hook personnalisé pour le lazy loading des données
export const useLazyData = (fetchFunction, dependencies = []) => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  
  React.useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await fetchFunction();
        
        if (isMounted) {
          setData(result);
          setLoading(false);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, dependencies);
  
  return { data, loading, error, refresh: () => setLoading(true) };
};

export default {
  lazyLoad,
  LoadingFallback,
  withLazyData,
  useLazyData
};
