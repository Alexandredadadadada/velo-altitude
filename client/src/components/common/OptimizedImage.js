import React, { useState, useEffect, useRef, memo } from 'react';
import PropTypes from 'prop-types';
import { Box, Skeleton, useTheme } from '@mui/material';
import { useInView } from 'react-intersection-observer';
import LoadingFallback from './LoadingFallback';

/**
 * Composant d'image optimisée avec techniques de performance
 * - Lazy loading avec Intersection Observer
 * - Technique de blur-up (affichage d'une version floue puis transition vers l'image complète)
 * - Placeholder et fallback en cas d'erreur
 * - Support du ratio d'aspect pour éviter les changements de mise en page (CLS)
 * - Optimisé avec React.memo pour éviter les re-renders inutiles
 *
 * @param {Object} props - Propriétés du composant
 * @param {string} props.src - URL de l'image
 * @param {string} props.lowResSrc - URL de l'image basse résolution pour blur-up (optionnel)
 * @param {string} props.alt - Texte alternatif pour l'accessibilité (obligatoire)
 * @param {number} props.aspectRatio - Ratio d'aspect de l'image (16/9, 4/3, 1, etc.)
 * @param {string} props.width - Largeur de l'image (en px, % ou toute unité CSS valide)
 * @param {string} props.height - Hauteur de l'image (en px, % ou toute unité CSS valide)
 * @param {string} props.borderRadius - Rayon de la bordure
 * @param {string} props.objectFit - Comportement de redimensionnement (cover, contain, etc.)
 * @param {Function} props.onLoad - Callback appelé quand l'image est chargée
 * @param {Function} props.onError - Callback appelé en cas d'erreur de chargement
 * @param {boolean} props.disableLazyLoading - Désactive le lazy loading
 * @param {boolean} props.priority - Si l'image est prioritaire (charge immédiatement)
 * @param {Object} props.imgProps - Props supplémentaires à passer à l'élément img
 */
const OptimizedImage = memo(({
  src,
  lowResSrc,
  alt,
  aspectRatio,
  width = '100%',
  height = 'auto',
  borderRadius,
  objectFit = 'cover',
  onLoad,
  onError,
  disableLazyLoading = false,
  priority = false,
  imgProps = {},
  ...rest
}) => {
  const theme = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [showLowRes, setShowLowRes] = useState(!!lowResSrc);
  const imgRef = useRef(null);
  
  // Utiliser IntersectionObserver pour le lazy loading
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px', // Préchargement quand l'image est à 200px de l'écran
    skip: disableLazyLoading || priority // Sauter l'observation si le lazy loading est désactivé ou si l'image est prioritaire
  });
  
  // Combiner les références
  const setRefs = (element) => {
    imgRef.current = element;
    if (!disableLazyLoading && !priority) {
      ref(element);
    }
  };
  
  // Si l'image est prioritaire ou si lazy loading désactivé, on charge immédiatement
  const shouldLoad = priority || disableLazyLoading || inView;
  
  // Effet pour pré-charger l'image basse résolution
  useEffect(() => {
    if (lowResSrc && shouldLoad) {
      const lowResImage = new Image();
      lowResImage.src = lowResSrc;
      lowResImage.onload = () => {
        setShowLowRes(true);
      };
    }
  }, [lowResSrc, shouldLoad]);
  
  // Gestionnaire de chargement de l'image principale
  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
    
    // Après un court délai pour la transition, cacher l'image basse résolution
    if (lowResSrc) {
      setTimeout(() => {
        setShowLowRes(false);
      }, 500);
    }
  };
  
  // Gestionnaire d'erreur
  const handleError = (e) => {
    setIsError(true);
    if (onError) onError(e);
  };
  
  // Styles pour l'image basse résolution
  const lowResStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit,
    filter: 'blur(10px)',
    opacity: showLowRes && !isLoaded ? 1 : 0,
    transition: 'opacity 0.3s ease-out',
  };
  
  // Styles pour l'image principale
  const mainImageStyle = {
    width: '100%',
    height: '100%',
    objectFit,
    borderRadius,
    opacity: isLoaded ? 1 : 0,
    transition: 'opacity 0.3s ease-in',
  };
  
  // Conteneur pour maintenir le ratio d'aspect
  const containerStyle = {
    position: 'relative',
    width,
    height: aspectRatio ? 'auto' : height,
    paddingBottom: aspectRatio ? `${(1 / aspectRatio) * 100}%` : 0,
    overflow: 'hidden',
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    borderRadius,
    ...rest.sx
  };
  
  // Gérer les états d'erreur
  if (isError) {
    return (
      <Box
        sx={{
          ...containerStyle,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          color: 'text.secondary',
          fontSize: '0.875rem',
          textAlign: 'center',
          padding: 2
        }}
        role="img"
        aria-label={alt}
      >
        {alt || 'Image non disponible'}
      </Box>
    );
  }
  
  return (
    <Box sx={containerStyle} ref={setRefs} {...rest}>
      {/* Placeholder pendant le chargement */}
      {!isLoaded && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <LoadingFallback type="image" />
        </Box>
      )}
      
      {/* Image basse résolution pour effet "blur-up" */}
      {lowResSrc && shouldLoad && (
        <img
          src={lowResSrc}
          alt=""
          style={lowResStyle}
          aria-hidden="true"
        />
      )}
      
      {/* Image principale */}
      {shouldLoad && (
        <img
          src={src}
          alt={alt}
          style={mainImageStyle}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'} // Support natif de lazy loading en plus
          decoding="async"
          {...imgProps}
        />
      )}
    </Box>
  );
});

OptimizedImage.propTypes = {
  src: PropTypes.string.isRequired,
  lowResSrc: PropTypes.string,
  alt: PropTypes.string.isRequired,
  aspectRatio: PropTypes.number,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  borderRadius: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  objectFit: PropTypes.oneOf(['cover', 'contain', 'fill', 'none', 'scale-down']),
  onLoad: PropTypes.func,
  onError: PropTypes.func,
  disableLazyLoading: PropTypes.bool,
  priority: PropTypes.bool,
  imgProps: PropTypes.object,
};

export default OptimizedImage;
