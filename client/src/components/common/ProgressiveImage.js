import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import progressiveImageLoader, { LOAD_PRIORITIES } from '../../services/progressiveImageLoader';

// Styles pour les différents états de l'image
const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: ${props => props.height || 'auto'};
  overflow: hidden;
  background-color: ${props => props.placeholderColor || '#f0f0f0'};
  
  &.loaded {
    background-color: transparent;
  }
`;

const StyledImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: ${props => props.objectFit || 'cover'};
  object-position: ${props => props.objectPosition || 'center'};
  opacity: ${props => (props.isLoaded ? 1 : 0)};
  transition: opacity 0.3s ease-in-out;
`;

const Placeholder = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: ${props => (props.isLoaded ? 'none' : 'flex')};
  justify-content: center;
  align-items: center;
  background-color: ${props => props.backgroundColor || '#f0f0f0'};
  z-index: 1;
  
  ${props => props.placeholderType === 'blur' && `
    background-image: url(${props.placeholderUrl});
    background-size: cover;
    background-position: center;
    filter: blur(10px);
  `}
`;

// Composant de spinner pour l'état de chargement
const LoadingSpinner = styled.div`
  display: ${props => (props.isLoading ? 'block' : 'none')};
  width: 30px;
  height: 30px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #3498db;
  animation: spin 1s ease-in-out infinite;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  
  @keyframes spin {
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }
`;

/**
 * Composant de chargement progressif d'images
 * Gère automatiquement le chargement optimisé des images avec placeholders
 */
const ProgressiveImage = ({
  src,
  alt,
  id,
  priority = LOAD_PRIORITIES.MEDIUM,
  size = 'medium',
  objectFit = 'cover',
  objectPosition = 'center',
  height = 'auto',
  width = '100%',
  className = '',
  placeholderColor = '#f0f0f0',
  placeholderUrl = null,
  showSpinner = true,
  onLoad = null,
  useBlur = false,
  lazy = true,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  const containerRef = useRef(null);
  const imageId = id || `img-${src.split('/').pop().split('.')[0]}`;

  useEffect(() => {
    let mounted = true;
    
    const loadImage = async () => {
      if (!src) return;
      
      try {
        setIsLoading(true);
        
        // Charger l'image via le service
        const loadedSrc = await progressiveImageLoader.loadImage(imageId, src, {
          priority,
          size,
          element: containerRef.current,
          useCache: true
        });
        
        if (mounted) {
          setImageSrc(loadedSrc);
          setIsLoaded(true);
          setIsLoading(false);
          
          if (onLoad) {
            onLoad(loadedSrc);
          }
        }
      } catch (error) {
        console.error('Error loading image:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    // Si lazy=false, charger immédiatement
    // Sinon, utiliser l'Intersection Observer du service
    if (!lazy) {
      loadImage();
    } else if (containerRef.current) {
      const options = {
        root: null,
        rootMargin: '200px', // Précharger avant d'être visible
        threshold: 0.01
      };
      
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          loadImage();
          observer.disconnect();
        }
      }, options);
      
      observer.observe(containerRef.current);
      
      return () => {
        observer.disconnect();
      };
    }
    
    return () => {
      mounted = false;
    };
  }, [src, imageId, priority, size, lazy, onLoad]);

  // Définir le type de placeholder
  const placeholderType = useBlur && placeholderUrl ? 'blur' : 'color';
  
  return (
    <ImageContainer
      ref={containerRef}
      className={`progressive-image ${isLoaded ? 'loaded' : 'loading'} ${className}`}
      height={height}
      width={width}
      placeholderColor={placeholderColor}
      data-image-id={imageId}
      data-image-url={src}
      data-image-priority={priority}
      data-image-size={size}
      {...props}
    >
      {imageSrc && (
        <StyledImage
          src={imageSrc}
          alt={alt}
          isLoaded={isLoaded}
          objectFit={objectFit}
          objectPosition={objectPosition}
          loading={lazy ? 'lazy' : 'eager'}
          onLoad={() => setIsLoaded(true)}
        />
      )}
      
      <Placeholder
        isLoaded={isLoaded}
        backgroundColor={placeholderColor}
        placeholderType={placeholderType}
        placeholderUrl={placeholderUrl}
      />
      
      {showSpinner && <LoadingSpinner isLoading={isLoading && !isLoaded} />}
    </ImageContainer>
  );
};

ProgressiveImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  id: PropTypes.string,
  priority: PropTypes.number,
  size: PropTypes.oneOf(['thumbnail', 'small', 'medium', 'large', 'original']),
  objectFit: PropTypes.string,
  objectPosition: PropTypes.string,
  height: PropTypes.string,
  width: PropTypes.string,
  className: PropTypes.string,
  placeholderColor: PropTypes.string,
  placeholderUrl: PropTypes.string,
  showSpinner: PropTypes.bool,
  onLoad: PropTypes.func,
  useBlur: PropTypes.bool,
  lazy: PropTypes.bool
};

export default ProgressiveImage;
