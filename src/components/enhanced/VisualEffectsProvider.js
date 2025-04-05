import React from 'react';
import './VisualEffectsProvider.css';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

const VisualEffectsProvider = ({ children }) => {
  // Détection des capacités du navigateur pour les effets visuels
  React.useEffect(() => {
    const supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(10px)');
    const supportsWebP = document.createElement('canvas')
      .toDataURL('image/webp')
      .indexOf('data:image/webp') === 0;
    
    // Ajout de classes au body pour adapter les effets visuels
    if (supportsBackdropFilter) {
      document.body.classList.add('supports-backdrop-filter');
    }
    
    if (supportsWebP) {
      document.body.classList.add('supports-webp');
    }
    
    // Détection des préférences de mouvement réduit
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.body.classList.add('reduced-motion');
    }
    
    // Détection du mode sombre
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.classList.add('dark-theme');
    }
    
    // Nettoyage lors du démontage
    return () => {
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/visualeffectsprovider"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
      document.body.classList.remove('supports-backdrop-filter');
      document.body.classList.remove('supports-webp');
      document.body.classList.remove('reduced-motion');
      document.body.classList.remove('dark-theme');
    };
  }, []);
  
  return (
    <div className="visual-effects-provider">
      {children}
    </div>
  );
};

export default VisualEffectsProvider;
