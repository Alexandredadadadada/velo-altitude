/**
 * Composant d'image responsive optimisé pour les performances
 * Supporte les formats modernes (WebP, AVIF) avec fallback
 * Utilise lazy loading, srcset et preloading
 */

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useImageOptimizer } from '../../utils/ImageOptimizer';
import { Box, Skeleton } from '@mui/material';

/**
 * Composant d'image responsive optimisé
 */
const ResponsiveImage = ({
  src,
  alt,
  width,
  height,
  sizes = '100vw',
  lazy = true,
  preload = false,
  quality = 'auto',
  placeholder = 'blur',
  blurDataURL,
  objectFit = 'cover',
  priority = false,
  onLoad,
  onError,
  sx = {},
  imgProps = {},
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);
  const observer = useRef(null);
  
  // Obtenir les utilitaires d'optimisation d'image
  const {
    getOptimizedImageUrl,
    getPlaceholderUrl,
    getBestImageFormat,
    getOptimalImageSize,
    supportsWebP,
    supportsAvif,
    isLowBandwidth
  } = useImageOptimizer();
  
  // Générer le srcset pour différentes tailles d'écran
  const generateSrcSet = (baseSrc, format) => {
    const breakpoints = [320, 640, 960, 1280, 1920, 2560];
    
    // Limiter les tailles à générer en cas de bande passante limitée
    const targetBreakpoints = isLowBandwidth 
      ? breakpoints.filter(bp => bp <= 960) 
      : breakpoints;
    
    return targetBreakpoints
      .map(size => {
        const optimizedUrl = getOptimizedImageUrl(baseSrc, {
          width: size,
          quality: getQualityValue(quality),
          format
        });
        return `${optimizedUrl} ${size}w`;
      })
      .join(', ');
  };
  
  // Convertir les valeurs de qualité en nombres
  const getQualityValue = (qualityParam) => {
    if (qualityParam === 'auto') {
      return isLowBandwidth ? 'low' : 'high';
    }
    
    switch (qualityParam) {
      case 'low': return 0.4;
      case 'medium': return 0.6;
      case 'high': return 0.8;
      case 'max': return 1.0;
      default: return 0.75;
    }
  };
  
  // Déterminer le meilleur format supporté
  const format = getBestImageFormat();
  
  // Générer les URLs optimisées
  const fallbackSrc = getOptimizedImageUrl(src, {
    width: getOptimalImageSize(width || 1200),
    quality: getQualityValue(quality)
  });
  
  const webpSrcSet = supportsWebP ? generateSrcSet(src, 'webp') : '';
  const avifSrcSet = supportsAvif ? generateSrcSet(src, 'avif') : '';
  const standardSrcSet = generateSrcSet(src);
  
  // URL du placeholder
  const placeholderUrl = blurDataURL || getPlaceholderUrl(src, { quality: 'low' });
  
  // Gérer le lazy loading
  useEffect(() => {
    if (!lazy || priority) {
      return;
    }
    
    const handleIntersection = (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        const img = imgRef.current;
        if (img) {
          img.loading = 'eager';
          img.decoding = 'async';
          img.sizes = sizes;
          
          // Activer les srcset
          if (avifSrcSet && img.parentNode) {
            const sourcesContainer = img.parentNode;
            const sources = sourcesContainer.querySelectorAll('source');
            sources.forEach(source => {
              source.sizes = sizes;
            });
          }
        }
        
        // Déconnecter l'observer une fois chargé
        if (observer.current) {
          observer.current.disconnect();
        }
      }
    };
    
    if (imgRef.current && !loaded) {
      observer.current = new IntersectionObserver(handleIntersection, {
        rootMargin: '200px',
        threshold: 0.01
      });
      observer.current.observe(imgRef.current);
    }
    
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [lazy, loaded, priority, avifSrcSet, sizes]);
  
  // Précharger l'image si prioritaire
  useEffect(() => {
    if (priority && !loaded && typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = fallbackSrc;
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [priority, fallbackSrc, loaded]);
  
  // Gérer le chargement et les erreurs
  const handleLoad = (e) => {
    setLoaded(true);
    if (onLoad) onLoad(e);
  };
  
  const handleError = (e) => {
    setError(true);
    if (onError) onError(e);
  };
  
  // Style du conteneur
  const containerStyle = {
    position: 'relative',
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : 'auto',
    overflow: 'hidden',
    ...sx
  };
  
  // Style de l'image
  const imgStyle = {
    display: 'block',
    objectFit,
    width: '100%',
    height: '100%',
    backgroundColor: placeholder === 'blur' ? 'transparent' : '#f0f0f0',
    transition: 'filter 0.3s ease-in-out, opacity 0.3s ease-in-out',
    filter: loaded ? 'none' : 'blur(10px)',
    opacity: loaded ? 1 : placeholder === 'blur' ? 0.5 : 1,
    ...imgProps.style
  };
  
  // Style du placeholder
  const placeholderStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit,
    filter: 'blur(20px)',
    opacity: loaded ? 0 : 0.7,
    transition: 'opacity 0.3s ease-in-out',
    zIndex: 0
  };
  
  return (
    <Box sx={containerStyle} {...props}>
      {placeholder === 'blur' && !error && placeholderUrl && (
        <img 
          src={placeholderUrl}
          alt=""
          aria-hidden="true"
          style={placeholderStyle}
        />
      )}
      
      {placeholder === 'skeleton' && !loaded && (
        <Skeleton 
          variant="rectangular" 
          width="100%" 
          height="100%" 
          animation="wave"
        />
      )}
      
      <picture>
        {avifSrcSet && (
          <source
            type="image/avif"
            srcSet={avifSrcSet}
            sizes={sizes}
          />
        )}
        {webpSrcSet && (
          <source
            type="image/webp"
            srcSet={webpSrcSet}
            sizes={sizes}
          />
        )}
        <img
          ref={imgRef}
          src={fallbackSrc}
          srcSet={standardSrcSet}
          sizes={sizes}
          alt={alt}
          loading={lazy && !priority ? 'lazy' : 'eager'}
          decoding={priority ? 'sync' : 'async'}
          onLoad={handleLoad}
          onError={handleError}
          style={imgStyle}
          {...imgProps}
        />
      </picture>
    </Box>
  );
};

ResponsiveImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  sizes: PropTypes.string,
  lazy: PropTypes.bool,
  preload: PropTypes.bool,
  quality: PropTypes.oneOf(['auto', 'low', 'medium', 'high', 'max']),
  placeholder: PropTypes.oneOf(['blur', 'skeleton', 'none']),
  blurDataURL: PropTypes.string,
  objectFit: PropTypes.oneOf(['contain', 'cover', 'fill', 'none', 'scale-down']),
  priority: PropTypes.bool,
  onLoad: PropTypes.func,
  onError: PropTypes.func,
  sx: PropTypes.object,
  imgProps: PropTypes.object
};

export default ResponsiveImage;
