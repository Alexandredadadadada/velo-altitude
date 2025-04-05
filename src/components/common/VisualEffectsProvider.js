import React from 'react';
import './VisualEffectsProvider.css';

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
