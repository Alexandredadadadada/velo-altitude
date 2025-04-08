/**
 * Utilitaire pour le chargement paresseux des composants
 * Optimise le chargement des routes et composants lourds
 */

import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { keyframes } from '@emotion/react';

// Animation de pulsation pour le loader
const pulse = keyframes`
  0% { opacity: 0.6; transform: scale(0.98); }
  50% { opacity: 1; transform: scale(1); }
  100% { opacity: 0.6; transform: scale(0.98); }
`;

// Composant de skeleton avec style Velo-Altitude
const ComponentSkeleton = ({ height = 400, width = '100%', text, icon }) => {
  return (
    <Box
      sx={{
        height,
        width,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: 'background.paper',
        borderRadius: 1,
        animation: `${pulse} 1.5s infinite ease-in-out`,
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
        padding: 3
      }}
    >
      {icon && React.cloneElement(icon, { style: { fontSize: 48, opacity: 0.3, marginBottom: 2 } })}
      
      <CircularProgress size={36} sx={{ mb: 2 }} />
      
      {text && (
        <Typography variant="body2" color="text.secondary" align="center">
          {text}
        </Typography>
      )}
    </Box>
  );
};

// Composant de fallback pour les erreurs de chargement
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <Box
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        bgcolor: 'error.light',
        color: 'error.contrastText',
        borderRadius: 1
      }}
    >
      <Typography variant="h6" component="h3" gutterBottom>
        Erreur de chargement
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        {error.message || 'Une erreur s\'est produite lors du chargement du composant.'}
      </Typography>
      <button 
        onClick={resetErrorBoundary}
        style={{
          padding: '8px 16px',
          backgroundColor: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Réessayer
      </button>
    </Box>
  );
};

/**
 * HOC pour charger paresseusement un composant avec un skeleton personnalisé
 * @param {Function} importFn - Fonction d'import dynamique (ex: () => import('./MonComposant'))
 * @param {Object} options - Options de configuration
 * @returns {React.Component} Composant avec lazy loading
 */
export function withLazyLoading(importFn, options = {}) {
  const {
    fallback = null,
    height = 400,
    width = '100%',
    loadingText = 'Chargement...',
    errorComponent = ErrorFallback,
    minDelay = 300, // Délai minimal pour éviter les flashs
    timeout = 10000, // Timeout après lequel on considère qu'il y a un problème
    retryCount = 2, // Nombre de tentatives en cas d'échec
    preload = false // Précharger le composant au montage
  } = options;

  // Composant Lazy
  const LazyComponent = lazy(() => {
    // Ajouter un délai minimal pour éviter les flashs
    const startTime = Date.now();
    
    // Fonction avec retry
    const loadWithRetry = (retries) => {
      return importFn().catch(error => {
        if (retries > 0) {
          return new Promise(resolve => setTimeout(resolve, 1000))
            .then(() => loadWithRetry(retries - 1));
        }
        throw error;
      });
    };
    
    // Promise avec timeout
    const loadWithTimeout = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Chargement trop long. Veuillez vérifier votre connexion.'));
      }, timeout);
      
      loadWithRetry(retryCount)
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
    
    // Respecter le délai minimum
    return Promise.all([
      loadWithTimeout,
      new Promise(resolve => {
        const elapsed = Date.now() - startTime;
        const remainingDelay = Math.max(0, minDelay - elapsed);
        setTimeout(resolve, remainingDelay);
      })
    ]).then(([moduleExports]) => moduleExports);
  });

  // Wrapper avec error boundary et preload
  const WrappedComponent = (props) => {
    const [error, setError] = useState(null);
    
    // Précharger le composant si demandé
    useEffect(() => {
      if (preload) {
        importFn().catch(err => console.warn('Erreur de préchargement:', err));
      }
    }, []);
    
    // Reset de l'erreur
    const resetError = () => {
      setError(null);
    };
    
    // Fallback personnalisé ou par défaut
    const fallbackComponent = fallback || (
      <ComponentSkeleton 
        height={height} 
        width={width} 
        text={loadingText} 
      />
    );
    
    if (error) {
      const ErrorComponent = errorComponent;
      return <ErrorComponent error={error} resetErrorBoundary={resetError} />;
    }
    
    return (
      <Suspense fallback={fallbackComponent}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };

  return WrappedComponent;
}

/**
 * Précharge un composant en arrière-plan
 * @param {Function} importFn - Fonction d'import dynamique
 */
export const preloadComponent = (importFn) => {
  // Utiliser requestIdleCallback si disponible, sinon setTimeout
  const schedulePreload = window.requestIdleCallback || 
    ((cb) => setTimeout(cb, 1000));
    
  schedulePreload(() => {
    importFn().catch(err => 
      console.warn('Erreur lors du préchargement du composant:', err)
    );
  });
};

/**
 * Charge un composant lorsqu'il entre dans le viewport
 * @param {Function} importFn - Fonction d'import dynamique
 * @param {Object} options - Options de configuration
 */
export function withViewportLoading(importFn, options = {}) {
  const Component = withLazyLoading(importFn, options);
  
  return function ViewportLoadedComponent(props) {
    const [isVisible, setIsVisible] = useState(false);
    const wrapperRef = useRef();
    
    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { rootMargin: '200px' } // Précharge quand on approche à 200px
      );
      
      if (wrapperRef.current) {
        observer.observe(wrapperRef.current);
      }
      
      return () => observer.disconnect();
    }, []);
    
    // Placeholder jusqu'à ce que le composant soit visible
    if (!isVisible) {
      return (
        <div ref={wrapperRef} style={{ height: options.height || 400, width: '100%' }} />
      );
    }
    
    return <Component {...props} />;
  };
}

export default {
  withLazyLoading,
  preloadComponent,
  withViewportLoading
};
