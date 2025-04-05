import { useState, useEffect } from 'react';

/**
 * Hook personnalisé pour gérer les drapeaux de fonctionnalités (feature flags)
 * Permet d'activer/désactiver certaines fonctionnalités de manière dynamique
 * 
 * @param {string} flagName - Nom du drapeau de fonctionnalité à vérifier
 * @param {boolean} defaultValue - Valeur par défaut si le drapeau n'est pas défini
 * @returns {boolean} - État actuel du drapeau de fonctionnalité
 */
const useFeatureFlags = (flagName, defaultValue = false) => {
  const [isEnabled, setIsEnabled] = useState(defaultValue);

  useEffect(() => {
    const checkFeatureFlag = async () => {
      try {
        // En environnement de production, on pourrait récupérer ces valeurs d'une API
        // Pour l'instant, on utilise des valeurs statiques ou celles stockées en localStorage
        const featureFlags = {
          // Fonctionnalités principales
          'map-3d-visualization': true,
          'weather-integration': true,
          'ftp-calculator': true,
          'hiit-module': true,
          
          // Fonctionnalités en cours de développement
          'strava-integration': true,
          'advanced-analytics': true,
          'nutrition-planner': true,
          'community-challenges': true,
          
          // Fonctionnalités expérimentales
          'route-comparison': true,
          'ai-training-suggestions': false,
          'virtual-reality-preview': false,
          'live-group-rides': false
        };

        // Vérifier si la fonctionnalité est activée
        const storedValue = localStorage.getItem(`feature-flag-${flagName}`);
        
        // Priorité au localStorage, puis aux valeurs statiques, puis à la valeur par défaut
        if (storedValue !== null) {
          setIsEnabled(storedValue === 'true');
        } else if (flagName in featureFlags) {
          setIsEnabled(featureFlags[flagName]);
          // Stocker la valeur pour utilisation future
          localStorage.setItem(`feature-flag-${flagName}`, featureFlags[flagName]);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des feature flags:', error);
        setIsEnabled(defaultValue);
      }
    };

    checkFeatureFlag();
  }, [flagName, defaultValue]);

  return isEnabled;
};

// Exporter comme default export pour maintenir la compatibilité avec le code existant
export default useFeatureFlags;

// Exporter également comme named export pour maintenir la compatibilité avec les imports nommés
export { useFeatureFlags };
