import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

/**
 * OptimizedImage Component
 * Provides optimized image loading with:
 * - Lazy loading
 * - Modern format support (AVIF, WebP) with fallback
 * - Responsive srcset
 * - Blur-up loading effect
 * - Error handling with fallback image
 * - Core Web Vitals optimization
 * - SEO enhancements
 */
const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  loading = 'lazy',
  fetchPriority = 'auto',
  decoding = 'async',
  srcSet = '',
  sizes = '',
  fallbackSrc = '/images/placeholder.webp',
  blurPlaceholder = true,
  objectFit = 'cover',
  priority = false,
  seoCaption = '',
  onLoad = () => {},
  onError = () => {}
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);
  
  // Determine appropriate loading and fetchPriority based on priority prop
  const imgLoading = priority ? 'eager' : loading;
  const imgFetchPriority = priority ? 'high' : fetchPriority;
  
  // Convert src to modern formats if browser supports them
  const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  const avifSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.avif');
  
  // Generate srcset from src if none provided
  const generateSrcSet = (baseSrc, format) => {
    if (srcSet) return srcSet;
    if (!width) return null;
    
    // Generate responsive srcset based on original width
    const widths = [width/2, width, width*1.5, width*2].map(w => Math.round(w));
    const formatExt = format === 'webp' ? '.webp' : format === 'avif' ? '.avif' : '';
    
    return widths
      .filter(w => w > 50) // Exclude tiny sizes
      .map(w => {
        const responsiveSrc = baseSrc.replace(/\.(jpg|jpeg|png|webp|avif)$/i, `_${w}w${formatExt}`);
        return `${responsiveSrc} ${w}w`;
      })
      .join(', ');
  };
  
  // Generate sizes attribute if not provided
  const generateSizes = () => {
    if (sizes) return sizes;
    if (!width) return '100vw';
    
    return `(max-width: 768px) 100vw, ${width}px`;
  };
  
  useEffect(() => {
    // Add browser detection for modern formats if needed
    const detectImageFormats = () => {
      if (typeof document === 'undefined') return { webp: false, avif: false };
      
      const canvas = document.createElement('canvas');
      let supportsWebP = false;
      let supportsAVIF = false;
      
      if (canvas.getContext && canvas.getContext('2d')) {
        supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        
        // AVIF detection is more complex, we'll use a feature detection approach
        supportsAVIF = 
          document.createElement('img').srcset !== undefined && 
          // This is a simplified check, browsers that support AVIF typically support these features
          'loading' in HTMLImageElement.prototype &&
          'decoding' in HTMLImageElement.prototype;
      }
      
      return { webp: supportsWebP, avif: supportsAVIF };
    };
    
    // Set data attributes on html element
    if (typeof document !== 'undefined') {
      const { webp, avif } = detectImageFormats();
      document.documentElement.setAttribute('data-supports-webp', webp);
      document.documentElement.setAttribute('data-supports-avif', avif);
    }
    
    // Use Intersection Observer for better lazy loading
    if (imgRef.current && loading === 'lazy' && !priority) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              // Preload the image when it's about to enter viewport
              const img = new Image();
              img.src = src;
              observer.disconnect();
            }
          });
        },
        { rootMargin: '200px 0px' } // Start loading 200px before image enters viewport
      );
      
      observer.observe(imgRef.current);
      return () => observer.disconnect();
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/optimizedimage"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
    }
  }, [src, loading, priority]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    onLoad(e);
    
    // Report LCP metric if this is a priority image
    if (priority && window.performance && window.performance.mark) {
      window.performance.mark('lcp-image-loaded');
    }
  };

  const handleError = (e) => {
    console.warn(`Failed to load image: ${src}`);
    setError(true);
    onError(e);
  };

  // Determine final source based on error state
  const finalSrc = error ? fallbackSrc : src;
  const finalSrcSet = error ? '' : generateSrcSet(src);
  const finalSizes = generateSizes();
  
  // Calculate aspect ratio for preventing CLS
  const aspectRatio = width && height ? width / height : null;
  
  return (
    <div 
      className={`optimized-image-container ${className} ${isLoaded ? 'loaded' : 'loading'}`}
      style={{ 
        position: 'relative',
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        aspectRatio: aspectRatio ? `${aspectRatio}` : 'auto',
        overflow: 'hidden',
      }}
      ref={imgRef}
    >
      {blurPlaceholder && !isLoaded && !error && (
        <div 
          className="image-placeholder" 
          aria-hidden="true"
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
        {/* AVIF format - best compression, modern browsers */}
        {document.documentElement.getAttribute('data-supports-avif') === 'true' && (
          <source 
            type="image/avif" 
            srcSet={generateSrcSet(avifSrc, 'avif') || avifSrc} 
            sizes={finalSizes}
          />
        )}
        
        {/* WebP format - good compression, wide support */}
        {document.documentElement.getAttribute('data-supports-webp') === 'true' && (
          <source 
            type="image/webp" 
            srcSet={generateSrcSet(webpSrc, 'webp') || webpSrc} 
            sizes={finalSizes}
          />
        )}
        
        {/* Original format - fallback */}
        <source srcSet={finalSrcSet || finalSrc} sizes={finalSizes} />
        
        <img
          src={finalSrc}
          alt={alt}
          width={width}
          height={height}
          loading={imgLoading}
          fetchpriority={imgFetchPriority}
          decoding={decoding}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: objectFit,
            transition: 'opacity 0.3s ease',
            opacity: isLoaded ? 1 : 0,
            zIndex: 2,
            position: 'relative',
          }}
        />
      </picture>
      
      {/* Optional caption for SEO */}
      {seoCaption && (
        <figcaption className="image-caption" style={{ 
          fontSize: '0.875rem',
          color: '#666',
          padding: '0.5rem 0',
          textAlign: 'center'
        }}>
          {seoCaption}
        </figcaption>
      )}
      
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
  fetchPriority: PropTypes.oneOf(['auto', 'high', 'low']),
  decoding: PropTypes.oneOf(['async', 'sync', 'auto']),
  srcSet: PropTypes.string,
  sizes: PropTypes.string,
  fallbackSrc: PropTypes.string,
  blurPlaceholder: PropTypes.bool,
  objectFit: PropTypes.oneOf(['cover', 'contain', 'fill', 'none', 'scale-down']),
  priority: PropTypes.bool,
  seoCaption: PropTypes.string,
  onLoad: PropTypes.func,
  onError: PropTypes.func
};

export default OptimizedImage;
