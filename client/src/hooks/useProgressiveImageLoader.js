import { useState, useEffect } from 'react';

/**
 * Hook personnalisé pour charger progressivement des images
 * Permet d'afficher d'abord une version basse résolution puis la version haute résolution
 * 
 * @param {string} lowQualitySrc - URL de l'image basse résolution
 * @param {string} highQualitySrc - URL de l'image haute résolution
 * @returns {Object} - État du chargement et URL de l'image à afficher
 */
const useProgressiveImageLoader = (lowQualitySrc, highQualitySrc) => {
  const [src, setSrc] = useState(lowQualitySrc || null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Réinitialiser l'état si les sources changent
    setSrc(lowQualitySrc || null);
    setIsLoaded(false);
    setError(null);

    // Si aucune source haute qualité n'est fournie, on s'arrête là
    if (!highQualitySrc) {
      return;
    }

    // Charger l'image haute résolution
    const highQualityImage = new Image();
    
    highQualityImage.onload = () => {
      setSrc(highQualitySrc);
      setIsLoaded(true);
    };
    
    highQualityImage.onerror = (err) => {
      console.error('Erreur lors du chargement de l\'image haute résolution:', err);
      setError(err);
      // On garde l'image basse résolution en cas d'erreur
    };
    
    highQualityImage.src = highQualitySrc;
    
    // Nettoyage en cas de démontage du composant
    return () => {
      highQualityImage.onload = null;
      highQualityImage.onerror = null;
    };
  }, [lowQualitySrc, highQualitySrc]);

  return { src, isLoaded, error };
};

export default useProgressiveImageLoader;
