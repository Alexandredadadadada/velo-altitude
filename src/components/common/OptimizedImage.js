import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * OptimizedImage Component
 * Provides optimized image loading with:
 * - Lazy loading
 * - WebP support with fallback
 * - Responsive srcset
 * - Blur-up loading effect
 * - Error handling with fallback image
 */
const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  loading = 'lazy',
  srcSet = '',
  sizes = '',
  fallbackSrc = '/images/placeholder.webp',
  blurPlaceholder = true,
  onLoad = () => {},
  onError = () => {}
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  // Convert src to WebP if browser supports it
  const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  const webpSrcSet = srcSet ? srcSet : null;
  
  // Generate srcset from src if none provided
  useEffect(() => {
    // Add browser detection for webP if needed
    const detectWebP = () => {
      const canvas = document.createElement('canvas');
      if (canvas.getContext && canvas.getContext('2d')) {
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      }
      return false;
    };
    
    // Set data-supports-webp attribute on html element
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-supports-webp', detectWebP());
    }
  }, []);

  const handleLoad = (e) => {
    setIsLoaded(true);
    onLoad(e);
  };

  const handleError = (e) => {
    console.warn(`Failed to load image: ${src}`);
    setError(true);
    onError(e);
  };

  // Determine final source based on error state
  const finalSrc = error ? fallbackSrc : src;
  const finalSrcSet = error ? '' : webpSrcSet;

  return (
    <div 
      className={`optimized-image-container ${className} ${isLoaded ? 'loaded' : 'loading'}`}
      style={{ 
        position: 'relative',
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        overflow: 'hidden',
      }}
    >
      {blurPlaceholder && !isLoaded && !error && (
        <div 
          className="image-placeholder" 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#f0f0f0',
            backgroundImage: 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjwvc3ZnPg==)',
            backgroundSize: 'cover',
            filter: 'blur(8px)',
            transform: 'scale(1.1)',
            zIndex: 1,
          }}
        />
      )}
      
      <picture>
        {document.documentElement.getAttribute('data-supports-webp') === 'true' && (
          <source 
            type="image/webp" 
            srcSet={webpSrcSet || webpSrc} 
            sizes={sizes}
          />
        )}
        <source srcSet={finalSrcSet || finalSrc} sizes={sizes} />
        <img
          src={finalSrc}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'opacity 0.3s ease',
            opacity: isLoaded ? 1 : 0,
            zIndex: 2,
            position: 'relative',
          }}
        />
      </picture>
      
      {error && (
        <div className="image-error-message" style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          color: 'white',
          padding: '4px 8px',
          fontSize: '12px',
          zIndex: 3,
        }}>
          Image non disponible
        </div>
      )}
    </div>
  );
};

OptimizedImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  className: PropTypes.string,
  loading: PropTypes.oneOf(['lazy', 'eager', 'auto']),
  srcSet: PropTypes.string,
  sizes: PropTypes.string,
  fallbackSrc: PropTypes.string,
  blurPlaceholder: PropTypes.bool,
  onLoad: PropTypes.func,
  onError: PropTypes.func
};

export default OptimizedImage;
