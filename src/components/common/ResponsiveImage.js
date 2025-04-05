import React, { useState, useEffect } from 'react';
import { Box, Skeleton } from '@mui/material';

/**
 * ResponsiveImage
 * Composant d'image optimisé pour les performances
 * - Chargement paresseux (lazy loading)
 * - Placeholder pendant le chargement
 * - Support des images responsives (srcset)
 * - Gestion des erreurs de chargement
 */
const ResponsiveImage = ({
  src,
  alt,
  width,
  height,
  sizes = '100vw',
  sx = {},
  placeholderSrc = null,
  quality = 80,
  priority = false,
  onLoad = () => {},
  onError = () => {},
  ...props
}) => {
  const [loading, setLoading] = useState(!priority);
  const [error, setError] = useState(false);
  const [imgSrc, setImgSrc] = useState(priority ? src : placeholderSrc || src);

  // Générer les différentes tailles d'images pour srcset si disponible
  const generateSrcSet = () => {
    if (!src || !src.includes('/images/')) return '';
    
    // Pour les images stockées dans notre CDN, on peut générer des variantes
    // Format: /images/original/nom-image.jpg
    const basePath = src.substring(0, src.lastIndexOf('/') + 1);
    const fileName = src.substring(src.lastIndexOf('/') + 1);
    
    return `
      ${basePath}320w/${fileName}?q=${quality} 320w,
      ${basePath}640w/${fileName}?q=${quality} 640w,
      ${basePath}960w/${fileName}?q=${quality} 960w,
      ${basePath}1280w/${fileName}?q=${quality} 1280w,
      ${src}?q=${quality} 1920w
    `;
  };

  // Charger l'image complète si en mode lazy
  useEffect(() => {
    if (!priority && src !== placeholderSrc) {
      const img = new Image();
      img.src = src;
      
      img.onload = () => {
        setImgSrc(src);
        setLoading(false);
        onLoad();
      };
      
      img.onerror = () => {
        setError(true);
        setLoading(false);
        onError();
      };
      
      return () => {
        img.onload = null;
        img.onerror = null;
      };
    }
  }, [src, placeholderSrc, priority, onLoad, onError]);

  // Gérer le chargement de l'image
  const handleImageLoaded = () => {
    setLoading(false);
    onLoad();
  };

  // Gérer les erreurs de chargement
  const handleImageError = () => {
    setError(true);
    setLoading(false);
    onError();
  };

  // Afficher un placeholder pendant le chargement
  if (loading) {
    return (
      <Box sx={{ position: 'relative', ...sx }}>
        <Skeleton 
          variant="rectangular" 
          width={width || '100%'} 
          height={height || '100%'} 
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            ...sx
          }}
        />
        {placeholderSrc && (
          <img
            src={placeholderSrc}
            alt={alt}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'blur(10px)',
              transition: 'opacity 0.3s ease',
              opacity: 0.7,
              ...sx
            }}
          />
        )}
      </Box>
    );
  }

  // Afficher une image de remplacement en cas d'erreur
  if (error) {
    return (
      <Box
        sx={{
          width: width || '100%',
          height: height || '100%',
          backgroundColor: 'grey.200',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
          fontSize: '0.875rem',
          ...sx
        }}
      >
        Image non disponible
      </Box>
    );
  }

  // Afficher l'image
  return (
    <img
      src={imgSrc}
      alt={alt}
      srcSet={generateSrcSet()}
      sizes={sizes}
      loading={priority ? 'eager' : 'lazy'}
      onLoad={handleImageLoaded}
      onError={handleImageError}
      style={{
        width: width || '100%',
        height: height || '100%',
        objectFit: 'cover',
        ...sx
      }}
      {...props}
    />
  );
};

export default ResponsiveImage;
