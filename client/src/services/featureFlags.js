/**
 * Service de gestion des Feature Flags
 * Permet l'activation/désactivation de fonctionnalités sans redéploiement
 * Supporte plusieurs sources de configuration (local, API, localStorage)
 */
import axios from 'axios';
import { useEffect, useState, createContext, useContext } from 'react';

// Valeurs par défaut des feature flags (utilisées en fallback)
const DEFAULT_FLAGS = {
  // Fonctionnalités liées à l'interface utilisateur
  enableDarkMode: false,
  showBetaFeatures: false,
  useNewNavigation: false,
  
  // Fonctionnalités liées aux défis
  enableSevenMajorsChallenge: true,
  enableMonthlyChallenge: true,
  enableSocialSharing: true,
  
  // Fonctionnalités liées à l'API et aux performances
  enableApiCaching: true,
  enablePerformanceMonitoring: true,
  
  // Fonctionnalités expérimentales
  enable3DColVisualization: true,
  enableProgressiveLoading3D: true,  // Nouveau flag pour le chargement progressif des visualisations 3D
  enableAIRecommendations: false,
  enableRealTimeWeather: true,
  
  // Fonctionnalités liées au cache et à l'optimisation
  enableAdvancedCaching: true,      // Nouveau flag pour le système de cache avancé
  enableOfflineMode: false,         // Nouveau flag pour le mode hors ligne
  enableLazyLoadingImages: true,    // Nouveau flag pour le chargement paresseux des images
  
  // Fonctionnalités administratives
  enableAdvancedMetrics: true,
  enableBulkOperations: false,
  
  // Fonctionnalités liées à la nutrition
  enableNutritionPlanner: true,     // Nouveau flag pour le planificateur de nutrition
  enableMealSuggestions: true,      // Nouveau flag pour les suggestions de repas
  enableColSpecificNutrition: true, // Nouveau flag pour la nutrition spécifique aux cols
  
  // Fonctionnalités liées à l'entraînement
  enableTrainingPrograms: true,     // Nouveau flag pour les programmes d'entraînement
  enablePerformanceAnalytics: true, // Nouveau flag pour les analyses de performance
  enableColSpecificTraining: true,  // Nouveau flag pour l'entraînement spécifique aux cols
  
  // Fonctionnalités liées à la montagne
  enableMountainModule: true,       // Nouveau flag pour le module montagne
  enableRegionalTrainingPlans: true // Nouveau flag pour les plans d'entraînement par région
};

// Types d'environnement supportés
const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production'
};

// Contexte React pour fournir les flags à travers l'application
const FeatureFlagsContext = createContext({
  flags: DEFAULT_FLAGS,
  isLoading: true,
  error: null,
  updateFlag: () => {},
  refreshFlags: () => {},
  isEnabled: () => false,     // Nouvelle méthode pour vérifier plus facilement un flag
  getVariant: () => null      // Nouvelle méthode pour les tests A/B
});

/**
 * Classe principale de gestion des feature flags
 */
class FeatureFlagsService {
  constructor() {
    this.flags = { ...DEFAULT_FLAGS };
    this.subscribers = [];
    this.isInitialized = false;
    this.lastFetchTime = 0;
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes en ms
    this.environment = process.env.NODE_ENV || ENVIRONMENTS.DEVELOPMENT;
    this.userSegment = null;
    this.flagsHistory = {}; // Historique des changements de flags
  }

  /**
   * Initialise le service et charge les flags depuis toutes les sources
   * @returns {Promise<Object>} Les feature flags
   */
  async initialize() {
    if (this.isInitialized) {
      return this.flags;
    }

    try {
      // Déterminer le segment utilisateur pour les flags ciblés
      this.determineUserSegment();
      
      // Chargement en cascade avec priorité (localStorage > API > defaults)
      await this.loadFlagsFromLocalStorage();
      await this.fetchFlagsFromApi();
      
      // Vérifier les flags qui doivent être activés/désactivés par environnement
      this.applyEnvironmentOverrides();
      
      // Initialiser l'historique des flags
      Object.keys(this.flags).forEach(key => {
        this.flagsHistory[key] = [{
          value: this.flags[key],
          timestamp: Date.now(),
          source: 'initialization'
        }];
      });
      
      this.isInitialized = true;
      this.notifySubscribers();
      
      return this.flags;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des feature flags:', error);
      // En cas d'erreur, utiliser les flags par défaut
      return this.flags;
    }
  }

  /**
   * Détermine le segment utilisateur pour une expérience personnalisée
   */
  determineUserSegment() {
    try {
      // Récupérer les informations utilisateur du localStorage
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      
      // On peut déterminer un segment basé sur différents critères
      if (userInfo.role === 'admin') {
        this.userSegment = 'admin';
      } else if (userInfo.visits && userInfo.visits > 10) {
        this.userSegment = 'power_user';
      } else if (userInfo.registeredAt) {
        const registrationDate = new Date(userInfo.registeredAt);
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        if (registrationDate > oneMonthAgo) {
          this.userSegment = 'new_user';
        } else {
          this.userSegment = 'regular_user';
        }
      } else {
        this.userSegment = 'anonymous';
      }
    } catch (error) {
      console.error('Erreur lors de la détermination du segment utilisateur:', error);
      this.userSegment = 'unknown';
    }
  }

  /**
   * Applique les valeurs par défaut spécifiques à l'environnement
   */
  applyEnvironmentOverrides() {
    // Désactiver certaines fonctionnalités en production pour éviter les problèmes
    if (this.environment === ENVIRONMENTS.PRODUCTION) {
      // En production, désactiver les fonctionnalités expérimentales par défaut
      const productionOverrides = {
        showBetaFeatures: false,
        enableAIRecommendations: false
      };
      
      // Mais ne pas écraser si explicitement activé via API ou localStorage
      Object.keys(productionOverrides).forEach(key => {
        // Vérifier si la valeur a été définie explicitement par l'API ou localStorage
        if (!this.flagsHistory[key] || this.flagsHistory[key].length === 0) {
          this.flags[key] = productionOverrides[key];
        }
      });
    }
    
    // Activer plus de fonctionnalités en développement pour les tests
    if (this.environment === ENVIRONMENTS.DEVELOPMENT) {
      const devOverrides = {
        showBetaFeatures: true,
        enablePerformanceMonitoring: true
      };
      
      Object.assign(this.flags, devOverrides);
    }
  }

  /**
   * Charge les flags depuis le localStorage
   */
  async loadFlagsFromLocalStorage() {
    try {
      const storedFlags = localStorage.getItem('featureFlags');
      if (storedFlags) {
        const parsedFlags = JSON.parse(storedFlags);
        this.flags = { ...this.flags, ...parsedFlags };
        
        // Enregistrer la source dans l'historique
        Object.keys(parsedFlags).forEach(key => {
          if (!this.flagsHistory[key]) this.flagsHistory[key] = [];
          this.flagsHistory[key].push({
            value: parsedFlags[key],
            timestamp: Date.now(),
            source: 'localStorage'
          });
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des feature flags du localStorage:', error);
    }
  }

  /**
   * Récupère les flags depuis l'API
   * @param {boolean} force Force le rafraîchissement même si le cache est valide
   */
  async fetchFlagsFromApi(force = false) {
    const now = Date.now();
    
    // Vérifier si nous devons rafraîchir le cache
    if (!force && (now - this.lastFetchTime) < this.cacheDuration) {
      return this.flags;
    }
    
    try {
      const response = await axios.get('/api/feature-flags', {
        params: {
          segment: this.userSegment,
          environment: this.environment
        }
      });
      
      if (response.data && response.data.flags) {
        // Enregistrer les anciennes valeurs pour le tracking des changements
        const oldFlags = { ...this.flags };
        
        // Mettre à jour les flags
        this.flags = { ...this.flags, ...response.data.flags };
        this.lastFetchTime = now;
        
        // Stocker dans localStorage pour utilisation offline
        localStorage.setItem('featureFlags', JSON.stringify(this.flags));
        
        // Mettre à jour l'historique des changements
        Object.keys(response.data.flags).forEach(key => {
          if (!this.flagsHistory[key]) this.flagsHistory[key] = [];
          this.flagsHistory[key].push({
            value: response.data.flags[key],
            previousValue: oldFlags[key],
            timestamp: now,
            source: 'api'
          });
        });
        
        this.notifySubscribers();
        this.logFlagChanges(oldFlags, this.flags);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des feature flags depuis l\'API:', error);
      // En cas d'erreur, continuer avec les flags actuels
    }
    
    return this.flags;
  }

  /**
   * Journalise les changements de flags pour débogage et analyses
   * @param {Object} oldFlags Anciens flags
   * @param {Object} newFlags Nouveaux flags
   */
  logFlagChanges(oldFlags, newFlags) {
    const changes = [];
    
    Object.keys(newFlags).forEach(key => {
      if (oldFlags[key] !== newFlags[key]) {
        changes.push({
          flag: key,
          oldValue: oldFlags[key],
          newValue: newFlags[key],
          timestamp: Date.now()
        });
      }
    });
    
    if (changes.length > 0) {
      console.info('Feature Flags mis à jour:', changes);
      
      // En développement, afficher une notification visuelle
      if (this.environment === ENVIRONMENTS.DEVELOPMENT && typeof window !== 'undefined') {
        // Créer une notification simple pour les développeurs
        this.showDevNotification(`${changes.length} feature flags mis à jour`);
      }
    }
  }

  /**
   * Affiche une notification pour les développeurs
   * @param {string} message Message à afficher
   */
  showDevNotification(message) {
    if (typeof document === 'undefined') return;
    
    const notificationId = 'feature-flag-notification';
    let notification = document.getElementById(notificationId);
    
    // Créer l'élément s'il n'existe pas
    if (!notification) {
      notification = document.createElement('div');
      notification.id = notificationId;
      notification.style.position = 'fixed';
      notification.style.bottom = '20px';
      notification.style.right = '20px';
      notification.style.padding = '10px 15px';
      notification.style.backgroundColor = '#333';
      notification.style.color = 'white';
      notification.style.borderRadius = '4px';
      notification.style.zIndex = '9999';
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s ease-in-out';
      document.body.appendChild(notification);
    }
    
    // Mettre à jour le contenu
    notification.textContent = message;
    notification.style.opacity = '1';
    
    // Faire disparaître après 3 secondes
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  /**
   * Met à jour un ou plusieurs feature flags
   * @param {Object} flagUpdates Objet contenant les flags à mettre à jour
   * @param {boolean} persistToServer Si vrai, envoie les modifications au serveur
   * @returns {Promise<Object>} Les feature flags mis à jour
   */
  async updateFlags(flagUpdates, persistToServer = true) {
    // Enregistrer les anciennes valeurs
    const oldFlags = { ...this.flags };
    
    // Mettre à jour les flags localement
    this.flags = { ...this.flags, ...flagUpdates };
    
    // Stocker dans localStorage
    localStorage.setItem('featureFlags', JSON.stringify(this.flags));
    
    // Mettre à jour l'historique
    Object.keys(flagUpdates).forEach(key => {
      if (!this.flagsHistory[key]) this.flagsHistory[key] = [];
      this.flagsHistory[key].push({
        value: flagUpdates[key],
        previousValue: oldFlags[key],
        timestamp: Date.now(),
        source: 'manual_update'
      });
    });
    
    // Journaliser les changements
    this.logFlagChanges(oldFlags, this.flags);
    
    // Notifier les abonnés
    this.notifySubscribers();
    
    // Persister sur le serveur si demandé
    if (persistToServer) {
      try {
        await axios.post('/api/feature-flags', { 
          flags: flagUpdates,
          segment: this.userSegment,
          environment: this.environment
        });
      } catch (error) {
        console.error('Erreur lors de la mise à jour des feature flags sur le serveur:', error);
      }
    }
    
    return this.flags;
  }

  /**
   * Vérifie si un feature flag est activé
   * @param {string} flagName Nom du flag à vérifier
   * @returns {boolean} Statut du flag (true = activé)
   */
  isEnabled(flagName) {
    // Si le flag n'existe pas, retourner false
    if (!(flagName in this.flags)) {
      console.warn(`Feature flag "${flagName}" non trouvé`);
      return false;
    }
    
    return this.flags[flagName] === true;
  }

  /**
   * Récupère la valeur d'un flag pour les tests A/B ou les flags multi-valeurs
   * @param {string} flagName Nom du flag
   * @param {any} defaultValue Valeur par défaut si le flag n'existe pas
   * @returns {any} Valeur du flag ou valeur par défaut
   */
  getVariant(flagName, defaultValue = null) {
    if (!(flagName in this.flags)) {
      console.warn(`Feature flag variant "${flagName}" non trouvé`);
      return defaultValue;
    }
    
    return this.flags[flagName];
  }

  /**
   * S'abonne aux changements de feature flags
   * @param {Function} callback Fonction appelée lors d'un changement
   * @returns {Function} Fonction pour se désabonner
   */
  subscribe(callback) {
    this.subscribers.push(callback);
    
    // Retourner une fonction de nettoyage pour le désabonnement
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  /**
   * Notifie tous les abonnés d'un changement de flags
   */
  notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.flags);
      } catch (error) {
        console.error('Erreur lors de la notification d\'un abonné aux feature flags:', error);
      }
    });
  }

  /**
   * Récupère l'historique des changements pour un flag
   * @param {string} flagName Nom du flag
   * @returns {Array} Historique des changements
   */
  getFlagHistory(flagName) {
    return this.flagsHistory[flagName] || [];
  }

  /**
   * Définit la durée du cache
   * @param {number} durationMs Durée en milliseconds
   */
  setCacheDuration(durationMs) {
    this.cacheDuration = durationMs;
  }
}

// Créer une instance singleton du service
const featureFlagsService = new FeatureFlagsService();

/**
 * Hook React pour utiliser les feature flags dans les composants
 * @returns {Object} Objet contenant les flags et fonctions utilitaires
 */
export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagsContext);
  
  if (!context) {
    throw new Error('useFeatureFlags doit être utilisé à l\'intérieur d\'un FeatureFlagsProvider');
  }
  
  return context;
};

/**
 * Fournisseur de contexte pour les feature flags
 * @param {Object} props Props du composant
 * @param {React.ReactNode} props.children Enfants du composant
 */
export const FeatureFlagsProvider = ({ children }) => {
  const [flags, setFlags] = useState(DEFAULT_FLAGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les flags au montage du composant
  useEffect(() => {
    const initializeFlags = async () => {
      try {
        setIsLoading(true);
        await featureFlagsService.initialize();
        setFlags({ ...featureFlagsService.flags });
        setError(null);
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement des feature flags');
      } finally {
        setIsLoading(false);
      }
    };

    initializeFlags();

    // S'abonner aux changements
    const unsubscribe = featureFlagsService.subscribe(updatedFlags => {
      setFlags({ ...updatedFlags });
    });

    // Se désabonner lors du démontage
    return unsubscribe;
  }, []);

  // Fonction pour mettre à jour un flag
  const updateFlag = async (flagName, value, persistToServer = true) => {
    try {
      await featureFlagsService.updateFlags({ [flagName]: value }, persistToServer);
    } catch (err) {
      setError(err.message || 'Erreur lors de la mise à jour du feature flag');
    }
  };

  // Fonction pour rafraîchir tous les flags
  const refreshFlags = async () => {
    try {
      setIsLoading(true);
      await featureFlagsService.fetchFlagsFromApi(true);
      setFlags({ ...featureFlagsService.flags });
      setError(null);
    } catch (err) {
      setError(err.message || 'Erreur lors du rafraîchissement des feature flags');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour vérifier si un flag est activé (raccourci)
  const isEnabled = (flagName) => {
    return featureFlagsService.isEnabled(flagName);
  };

  // Fonction pour récupérer la valeur d'un flag variant
  const getVariant = (flagName, defaultValue = null) => {
    return featureFlagsService.getVariant(flagName, defaultValue);
  };

  const value = {
    flags,
    isLoading,
    error,
    updateFlag,
    refreshFlags,
    isEnabled,
    getVariant
  };

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

// Exporter le service pour une utilisation directe si nécessaire
export default featureFlagsService;
