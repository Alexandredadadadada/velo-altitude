/**
 * Hook pour surveiller l'état du réseau
 * 
 * Ce hook permet de surveiller l'état de la connexion réseau de l'utilisateur
 * et de réagir aux changements de connectivité.
 */

import { useState, useEffect } from 'react';
import { notificationService } from '../services/notification/notificationService';

/**
 * Hook pour surveiller l'état du réseau
 * @param {Object} options - Options de configuration
 * @param {boolean} options.showNotifications - Afficher des notifications lors des changements d'état
 * @param {Function} options.onOffline - Fonction appelée lorsque l'utilisateur passe hors ligne
 * @param {Function} options.onOnline - Fonction appelée lorsque l'utilisateur revient en ligne
 * @returns {Object} État du réseau
 */
const useNetworkStatus = ({
  showNotifications = true,
  onOffline = null,
  onOnline = null
} = {}) => {
  // État initial basé sur navigator.onLine
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  
  // Gérer la bande passante en mode économie de données
  const [isSavingData, setIsSavingData] = useState(false);
  
  // Qualité de connexion mesurée par la latence des API (simulé ici)
  const [connectionQuality, setConnectionQuality] = useState('good');
  
  // Effectuer cette vérification uniquement côté client
  useEffect(() => {
    // Vérifier si le navigateur prend en charge les modes d'économie de données
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      if (connection) {
        // Vérifier si le mode économie de données est activé
        if ('saveData' in connection) {
          setIsSavingData(connection.saveData);
        }
        
        // Fonction pour mettre à jour la qualité de connexion
        const updateConnectionQuality = () => {
          if (!connection) return;
          
          // Déterminer la qualité de connexion
          let quality = 'good';
          
          // Utiliser le type de connexion (2g, 3g, 4g, etc.)
          if ('effectiveType' in connection) {
            const effectiveType = connection.effectiveType;
            
            if (effectiveType === '2g' || effectiveType === 'slow-2g') {
              quality = 'poor';
            } else if (effectiveType === '3g') {
              quality = 'moderate';
            }
          }
          
          setConnectionQuality(quality);
        };
        
        // Écouter les changements de type de connexion
        if ('onchange' in connection) {
          connection.addEventListener('change', updateConnectionQuality);
        }
        
        // Initialiser la qualité de connexion
        updateConnectionQuality();
        
        // Nettoyage
        return () => {
          if ('onchange' in connection) {
            connection.removeEventListener('change', updateConnectionQuality);
          }
        };
      }
    }
  }, []);
  
  useEffect(() => {
    // Fonction pour gérer l'état hors ligne
    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      
      // Afficher une notification si activé
      if (showNotifications) {
        notificationService.showWarning(
          'Vous êtes actuellement hors ligne. Certaines fonctionnalités peuvent être limitées.',
          { title: 'Connexion perdue', autoClose: 5000 }
        );
      }
      
      // Appeler la fonction de callback
      if (onOffline) {
        onOffline();
      }
    };
    
    // Fonction pour gérer l'état en ligne
    const handleOnline = () => {
      setIsOnline(true);
      
      // Afficher une notification uniquement si l'utilisateur était précédemment hors ligne
      if (showNotifications && wasOffline) {
        notificationService.showSuccess(
          'Vous êtes de nouveau connecté !',
          { title: 'Connexion rétablie', autoClose: 3000 }
        );
        setWasOffline(false);
      }
      
      // Appeler la fonction de callback
      if (onOnline) {
        onOnline();
      }
    };
    
    // Ajouter les écouteurs d'événements
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    
    // Nettoyer les écouteurs d'événements lors du démontage
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [showNotifications, wasOffline, onOffline, onOnline]);
  
  // Retourner l'état du réseau et les fonctions utilitaires
  return {
    isOnline,
    isSavingData,
    connectionQuality,
    // Fonction pour déterminer si une fonctionnalité intense en données doit être activée
    shouldEnableDataIntensiveFeature: () => {
      // Désactiver si hors ligne ou en mode économie de données
      if (!isOnline || isSavingData) {
        return false;
      }
      
      // Désactiver si la connexion est de mauvaise qualité
      if (connectionQuality === 'poor') {
        return false;
      }
      
      return true;
    }
  };
};

export default useNetworkStatus;
