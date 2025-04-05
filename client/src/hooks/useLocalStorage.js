import { useState, useEffect } from 'react';

/**
 * Hook personnalisé pour persister des données dans le localStorage
 * @param {string} key - Clé pour stocker les données dans localStorage
 * @param {any} initialValue - Valeur initiale si aucune donnée n'existe en localStorage
 * @returns {Array} - [storedValue, setValue] - valeur stockée et fonction pour la mettre à jour
 */
export const useLocalStorage = (key, initialValue) => {
  // État pour stocker la valeur
  // Passer la fonction d'initialisation à useState pour que la logique ne s'exécute qu'une fois
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Récupérer depuis localStorage par clé
      const item = window.localStorage.getItem(key);
      // Parser le JSON stocké ou retourner initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // En cas d'erreur, utiliser la valeur initiale
      console.error(`Erreur lors de la récupération de ${key} du localStorage:`, error);
      return initialValue;
    }
  });

  // Retourner une fonction wrapped pour mettre à jour localStorage
  const setValue = (value) => {
    try {
      // Permettre à value d'être une fonction pour la même API que useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Sauvegarder l'état
      setStoredValue(valueToStore);
      
      // Sauvegarder dans localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      
      // Déclencher un événement personnalisé pour la synchronisation entre onglets (optionnel)
      window.dispatchEvent(new Event('local-storage-update'));
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde de ${key} dans localStorage:`, error);
    }
  };

  // Écouter les changements dans d'autres onglets/fenêtres (optionnel)
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === key) {
        try {
          const newValue = JSON.parse(event.newValue);
          if (JSON.stringify(newValue) !== JSON.stringify(storedValue)) {
            setStoredValue(newValue);
          }
        } catch (e) {
          console.error("Erreur lors de la synchronisation du localStorage:", e);
        }
      }
    };

    // Écouter les changements
    window.addEventListener('storage', handleStorageChange);
    
    // Nettoyer
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, storedValue]);

  return [storedValue, setValue];
};
