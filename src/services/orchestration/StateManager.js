/**
 * Service de gestion d'état pour l'orchestration des données entre modules
 * Centralise la gestion des états et les transitions entre les modules nutrition et entraînement
 */

import { BehaviorSubject } from 'rxjs';
import dataValidator from './DataValidator';
import conflictResolver, { ResolutionStrategy } from './ConflictResolver';

/**
 * Enum pour les états de synchronisation
 */
class SyncState {
  static IDLE = 'idle';
  static IN_PROGRESS = 'syncing';
  static SUCCESS = 'success';
  static ERROR = 'error';
  static PARTIAL = 'partial';
  static OFFLINE = 'offline';
}

/**
 * Configuration du cache
 */
class CacheConfig {
  static TTL = 30 * 60 * 1000; // 30 minutes
  static VERSION = '1.0';
}

/**
 * Erreur personnalisée pour la gestion d'état
 */
class StateError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'StateError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Classe pour le suivi des métriques de performance
 */
class PerformanceMetrics {
  constructor() {
    this.metrics = {
      syncDuration: [],
      validationDuration: [],
      cacheHits: 0,
      cacheMisses: 0,
      errors: {
        validation: 0,
        sync: 0,
        cache: 0
      }
    };
  }

  /**
   * Enregistre la durée d'une opération de synchronisation
   * @param {number} duration - Durée en ms
   */
  trackSync(duration) {
    this.metrics.syncDuration.push(duration);
    // Conserver seulement les 100 dernières mesures
    if (this.metrics.syncDuration.length > 100) {
      this.metrics.syncDuration.shift();
    }
  }

  /**
   * Enregistre la durée d'une opération de validation
   * @param {number} duration - Durée en ms
   */
  trackValidation(duration) {
    this.metrics.validationDuration.push(duration);
    // Conserver seulement les 100 dernières mesures
    if (this.metrics.validationDuration.length > 100) {
      this.metrics.validationDuration.shift();
    }
  }

  /**
   * Enregistre un succès de cache
   */
  trackCacheHit() {
    this.metrics.cacheHits++;
  }

  /**
   * Enregistre un échec de cache
   */
  trackCacheMiss() {
    this.metrics.cacheMisses++;
  }

  /**
   * Enregistre une erreur
   * @param {string} type - Type d'erreur ('validation', 'sync', 'cache')
   */
  trackError(type) {
    if (this.metrics.errors[type] !== undefined) {
      this.metrics.errors[type]++;
    }
  }

  /**
   * Calcule la durée moyenne de synchronisation
   * @returns {number} Durée moyenne en ms
   */
  getAverageSyncDuration() {
    if (this.metrics.syncDuration.length === 0) return 0;
    return this.metrics.syncDuration.reduce((a, b) => a + b, 0) / this.metrics.syncDuration.length;
  }

  /**
   * Calcule la durée moyenne de validation
   * @returns {number} Durée moyenne en ms
   */
  getAverageValidationDuration() {
    if (this.metrics.validationDuration.length === 0) return 0;
    return this.metrics.validationDuration.reduce((a, b) => a + b, 0) / this.metrics.validationDuration.length;
  }

  /**
   * Calcule le taux de réussite du cache
   * @returns {number} Pourcentage entre 0 et 100
   */
  getCacheHitRate() {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    if (total === 0) return 0;
    return (this.metrics.cacheHits / total) * 100;
  }

  /**
   * Obtient toutes les métriques
   * @returns {Object} Métriques de performance
   */
  getAllMetrics() {
    return {
      ...this.metrics,
      averageSyncDuration: this.getAverageSyncDuration(),
      averageValidationDuration: this.getAverageValidationDuration(),
      cacheHitRate: this.getCacheHitRate()
    };
  }

  /**
   * Réinitialise toutes les métriques
   */
  resetMetrics() {
    this.metrics = {
      syncDuration: [],
      validationDuration: [],
      cacheHits: 0,
      cacheMisses: 0,
      errors: {
        validation: 0,
        sync: 0,
        cache: 0
      }
    };
  }
}

/**
 * Gestionnaire du mode hors ligne
 */
class OfflineManager {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.pendingOperations = [];
    this.isOnline = navigator.onLine;
    
    // Écouter les événements de connectivité
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  /**
   * Gère le passage en mode hors ligne
   */
  handleOffline() {
    this.isOnline = false;
    console.log('Application passée en mode hors ligne');
    
    this.stateManager.updateSyncState({
      status: SyncState.OFFLINE,
      error: 'Mode hors ligne actif - Les données seront synchronisées au retour de la connexion'
    });
  }

  /**
   * Gère le retour en ligne et synchronise les opérations en attente
   */
  async handleOnline() {
    this.isOnline = true;
    console.log('Connexion rétablie, traitement des opérations en attente');
    
    this.stateManager.updateSyncState({
      status: SyncState.IN_PROGRESS,
      error: null
    });
    
    await this.processPendingOperations();
    
    this.stateManager.updateSyncState({
      status: SyncState.SUCCESS,
      lastSynced: new Date()
    });
  }

  /**
   * Ajoute une opération à la file d'attente
   * @param {Function} operation - Fonction à exécuter quand la connexion sera rétablie
   */
  addPendingOperation(operation) {
    this.pendingOperations.push(operation);
  }

  /**
   * Traite toutes les opérations en attente
   * @returns {Promise<void>}
   */
  async processPendingOperations() {
    console.log(`Traitement de ${this.pendingOperations.length} opérations en attente`);
    
    for (const operation of this.pendingOperations) {
      try {
        await operation();
      } catch (error) {
        console.error('Erreur pendant le traitement d\'une opération en attente:', error);
        this.stateManager.performanceMetrics.trackError('sync');
      }
    }
    
    // Vider la file d'attente
    this.pendingOperations = [];
  }

  /**
   * Vérifie si l'application est en ligne
   * @returns {boolean} Vrai si l'application est connectée
   */
  isConnected() {
    return this.isOnline;
  }
}

/**
 * Planificateur de synchronisation
 */
class SyncScheduler {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.schedules = new Map();
  }

  /**
   * Programme une synchronisation périodique
   * @param {string} moduleId - Identifiant du module
   * @param {number} interval - Intervalle en millisecondes
   * @param {Function} callback - Fonction à exécuter
   */
  schedulePeriodic(moduleId, interval, callback) {
    // Annuler toute planification existante
    if (this.schedules.has(moduleId)) {
      clearInterval(this.schedules.get(moduleId));
    }
    
    const timerId = setInterval(async () => {
      try {
        if (this.stateManager.offlineManager.isConnected()) {
          await callback();
        }
      } catch (error) {
        console.error(`Erreur dans la synchronisation planifiée pour ${moduleId}:`, error);
        this.stateManager.performanceMetrics.trackError('sync');
      }
    }, interval);
    
    this.schedules.set(moduleId, timerId);
    console.log(`Synchronisation périodique configurée pour ${moduleId} (${interval}ms)`);
  }

  /**
   * Supprime une planification
   * @param {string} moduleId - Identifiant du module
   */
  clearSchedule(moduleId) {
    if (this.schedules.has(moduleId)) {
      clearInterval(this.schedules.get(moduleId));
      this.schedules.delete(moduleId);
      console.log(`Synchronisation périodique supprimée pour ${moduleId}`);
    }
  }

  /**
   * Supprime toutes les planifications
   */
  clearAllSchedules() {
    for (const [moduleId, timerId] of this.schedules.entries()) {
      clearInterval(timerId);
      console.log(`Synchronisation périodique supprimée pour ${moduleId}`);
    }
    this.schedules.clear();
  }
}

class StateManager {
  constructor() {
    // États observables pour les différents modules
    this.nutritionState = new BehaviorSubject(null);
    this.trainingState = new BehaviorSubject(null);
    this.syncState = new BehaviorSubject({
      status: SyncState.IDLE,
      lastSynced: null,
      error: null
    });
    
    // État des modules actifs
    this.activeModules = new BehaviorSubject({
      nutrition: false,
      training: false,
      cols: false,
      sevenMajors: false,
      community: false
    });
    
    // Cache interne des données
    this._cache = {
      nutrition: null,
      training: null,
      syncResults: null
    };
    
    // Initialiser les gestionnaires additionnels
    this.performanceMetrics = new PerformanceMetrics();
    this.offlineManager = new OfflineManager(this);
    this.syncScheduler = new SyncScheduler(this);
    
    // Charger les données du cache local au démarrage
    this._initializeFromCache();
    
    // Configurer les synchronisations périodiques
    this._setupPeriodicSync();
    
    // Configurer la résolution de conflits
    this.configureConflictResolution();
  }

  /**
   * Configure les stratégies de résolution de conflits
   */
  configureConflictResolution() {
    // Définir des stratégies par défaut pour les différents types de données
    conflictResolver.setDefaultStrategy('nutrition', ResolutionStrategy.LATEST_WINS);
    conflictResolver.setDefaultStrategy('training', ResolutionStrategy.MERGE);
    
    // Écouter les événements de résolution manuelle
    window.addEventListener('conflict-resolution-completed', (event) => {
      const { dataType, resolvedData } = event.detail;
      if (dataType === 'nutrition') {
        this.updateNutritionState(resolvedData, true);  // Skip conflict check
      } else if (dataType === 'training') {
        this.updateTrainingState(resolvedData, true);   // Skip conflict check
      }
    });
  }

  /**
   * Synchronise les données nutritionnelles avec le backend
   * @returns {Promise<void>}
   */
  async syncNutritionData() {
    const startTime = performance.now();
    try {
      console.log('Début de la synchronisation des données nutritionnelles');
      this.beginSync();
      
      // Ici, nous ferions normalement un appel à l'API pour récupérer/mettre à jour les données
      // Pour l'exemple, nous simulons juste un délai
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mise à jour réussie
      this.syncSuccess({ type: 'nutrition', timestamp: new Date() });
      
      // Suivi des performances
      const duration = performance.now() - startTime;
      this.performanceMetrics.trackSync(duration);
      console.log(`Synchronisation nutrition terminée en ${duration.toFixed(2)}ms`);
    } catch (error) {
      console.error('Erreur lors de la synchronisation nutrition:', error);
      this.syncError(error);
      this.performanceMetrics.trackError('sync');
    }
  }

  /**
   * Synchronise les données d'entraînement avec le backend
   * @returns {Promise<void>}
   */
  async syncTrainingData() {
    const startTime = performance.now();
    try {
      console.log('Début de la synchronisation des données d\'entraînement');
      this.beginSync();
      
      // Ici, nous ferions normalement un appel à l'API pour récupérer/mettre à jour les données
      // Pour l'exemple, nous simulons juste un délai
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Mise à jour réussie
      this.syncSuccess({ type: 'training', timestamp: new Date() });
      
      // Suivi des performances
      const duration = performance.now() - startTime;
      this.performanceMetrics.trackSync(duration);
      console.log(`Synchronisation entraînement terminée en ${duration.toFixed(2)}ms`);
    } catch (error) {
      console.error('Erreur lors de la synchronisation entraînement:', error);
      this.syncError(error);
      this.performanceMetrics.trackError('sync');
    }
  }

  /**
   * Met à jour l'état nutritionnel avec validation
   * @param {Object} nutritionData - Données nutritionnelles à jour
   * @param {boolean} [skipConflictCheck=false] - Ignorer la vérification des conflits
   * @returns {Promise<void>}
   */
  async updateNutritionState(nutritionData, skipConflictCheck = false) {
    const startTime = performance.now();
    
    try {
      // Valider les données
      const validationResult = await dataValidator.validateNutritionProfile(nutritionData);
      this.performanceMetrics.trackValidationDuration('nutrition', performance.now() - startTime);
      
      if (!validationResult.valid) {
        throw new StateError('ValidationError', 'Validation des données nutritionnelles échouée', validationResult.errors);
      }
      
      // Ajouter des métadonnées pour la résolution de conflits
      const enrichedData = {
        ...nutritionData,
        lastModified: new Date().toISOString(),
        version: (nutritionData.version || 0) + 1
      };
      
      // Vérifier les conflits avec les données distantes si en ligne
      if (!skipConflictCheck && !this.offlineManager.isOffline()) {
        try {
          const remoteData = await this._fetchRemoteData('/api/nutrition/profile');
          
          if (remoteData && conflictResolver.hasConflict(enrichedData, remoteData)) {
            console.log('Conflit détecté pour les données nutritionnelles');
            
            // Résoudre le conflit selon la stratégie définie
            const resolvedData = await conflictResolver.resolveConflict('nutrition', enrichedData, remoteData);
            
            // Mettre à jour l'état avec les données résolues
            this.nutritionState.next(resolvedData);
            this._saveToCache('nutrition', resolvedData);
            
            // Synchroniser les données résolues
            await this.syncNutritionData(resolvedData);
            
            this.performanceMetrics.trackOperationDuration('conflictResolution', performance.now() - startTime);
            
            // Mettre à jour l'état intégré si le module d'entraînement est actif
            if (this.isModuleActive('training')) {
              this._updateIntegratedState();
            }
            
            return {
              success: true,
              status: 'conflict_resolved',
              data: resolvedData
            };
          }
        } catch (error) {
          console.warn('Erreur lors de la vérification des conflits:', error);
          // Continuer avec la mise à jour normale même en cas d'erreur de vérification des conflits
        }
      }
      
      // Si hors ligne, ajouter à la file d'attente
      if (this.offlineManager.isOffline()) {
        this.offlineManager.queueOperation('nutrition', 'update', enrichedData);
        console.log('Opération de mise à jour nutritionnelle mise en file d\'attente pour synchronisation ultérieure');
      } else {
        // Sinon, synchroniser immédiatement avec le backend
        await this.syncNutritionData(enrichedData);
      }
      
      // Mettre à jour l'état local
      this.nutritionState.next(enrichedData);
      this._saveToCache('nutrition', enrichedData);
      
      // Activer le module si ce n'est pas déjà fait
      if (!this.isModuleActive('nutrition')) {
        this.activeModules.next({
          ...this.activeModules.value,
          nutrition: true
        });
      }
      
      // Mettre à jour l'état intégré si le module d'entraînement est actif
      if (this.isModuleActive('training')) {
        this._updateIntegratedState();
      }
      
      this.performanceMetrics.trackOperationDuration('updateNutrition', performance.now() - startTime);
      
      return {
        success: true,
        status: this.offlineManager.isOffline() ? 'queued' : 'synchronized',
        data: enrichedData
      };
    } catch (error) {
      // Gérer et enregistrer l'erreur
      this.performanceMetrics.trackError('nutrition');
      this.errorState.next({
        source: 'nutrition',
        timestamp: new Date(),
        error: error instanceof StateError ? error : new StateError('UpdateError', 'Erreur lors de la mise à jour de l\'état nutritionnel', error)
      });
      
      console.error('Erreur lors de la mise à jour de l\'état nutritionnel:', error);
      
      return {
        success: false,
        status: 'error',
        error: error instanceof StateError ? error : new StateError('UpdateError', 'Erreur lors de la mise à jour de l\'état nutritionnel', error)
      };
    }
  }
  
  /**
   * Met à jour l'état d'entraînement avec validation
   * @param {Object} trainingData - Données d'entraînement à jour
   * @param {boolean} [skipConflictCheck=false] - Ignorer la vérification des conflits
   * @returns {Promise<void>}
   */
  async updateTrainingState(trainingData, skipConflictCheck = false) {
    const startTime = performance.now();
    
    try {
      // Valider les données
      const validationResult = await dataValidator.validateTrainingPlan(trainingData);
      this.performanceMetrics.trackValidationDuration('training', performance.now() - startTime);
      
      if (!validationResult.valid) {
        throw new StateError('ValidationError', 'Validation des données d\'entraînement échouée', validationResult.errors);
      }
      
      // Ajouter des métadonnées pour la résolution de conflits
      const enrichedData = {
        ...trainingData,
        lastModified: new Date().toISOString(),
        version: (trainingData.version || 0) + 1
      };
      
      // Vérifier les conflits avec les données distantes si en ligne
      if (!skipConflictCheck && !this.offlineManager.isOffline()) {
        try {
          const remoteData = await this._fetchRemoteData('/api/training/plan');
          
          if (remoteData && conflictResolver.hasConflict(enrichedData, remoteData)) {
            console.log('Conflit détecté pour les données d\'entraînement');
            
            // Résoudre le conflit selon la stratégie définie
            const resolvedData = await conflictResolver.resolveConflict('training', enrichedData, remoteData);
            
            // Mettre à jour l'état avec les données résolues
            this.trainingState.next(resolvedData);
            this._saveToCache('training', resolvedData);
            
            // Synchroniser les données résolues
            await this.syncTrainingData(resolvedData);
            
            this.performanceMetrics.trackOperationDuration('conflictResolution', performance.now() - startTime);
            
            // Mettre à jour l'état intégré si le module de nutrition est actif
            if (this.isModuleActive('nutrition')) {
              this._updateIntegratedState();
            }
            
            return {
              success: true,
              status: 'conflict_resolved',
              data: resolvedData
            };
          }
        } catch (error) {
          console.warn('Erreur lors de la vérification des conflits:', error);
          // Continuer avec la mise à jour normale même en cas d'erreur de vérification des conflits
        }
      }
      
      // Si hors ligne, ajouter à la file d'attente
      if (this.offlineManager.isOffline()) {
        this.offlineManager.queueOperation('training', 'update', enrichedData);
        console.log('Opération de mise à jour d\'entraînement mise en file d\'attente pour synchronisation ultérieure');
      } else {
        // Sinon, synchroniser immédiatement avec le backend
        await this.syncTrainingData(enrichedData);
      }
      
      // Mettre à jour l'état local
      this.trainingState.next(enrichedData);
      this._saveToCache('training', enrichedData);
      
      // Activer le module si ce n'est pas déjà fait
      if (!this.isModuleActive('training')) {
        this.activeModules.next({
          ...this.activeModules.value,
          training: true
        });
      }
      
      // Mettre à jour l'état intégré si le module de nutrition est actif
      if (this.isModuleActive('nutrition')) {
        this._updateIntegratedState();
      }
      
      this.performanceMetrics.trackOperationDuration('updateTraining', performance.now() - startTime);
      
      return {
        success: true,
        status: this.offlineManager.isOffline() ? 'queued' : 'synchronized',
        data: enrichedData
      };
    } catch (error) {
      // Gérer et enregistrer l'erreur
      this.performanceMetrics.trackError('training');
      this.errorState.next({
        source: 'training',
        timestamp: new Date(),
        error: error instanceof StateError ? error : new StateError('UpdateError', 'Erreur lors de la mise à jour de l\'état d\'entraînement', error)
      });
      
      console.error('Erreur lors de la mise à jour de l\'état d\'entraînement:', error);
      
      return {
        success: false,
        status: 'error',
        error: error instanceof StateError ? error : new StateError('UpdateError', 'Erreur lors de la mise à jour de l\'état d\'entraînement', error)
      };
    }
  }

  /**
   * Met à jour l'état de synchronisation
   * @param {Object} syncData - État de synchronisation
   */
  updateSyncState(syncData) {
    if (!syncData) return;
    
    const currentSyncState = this.syncState.value;
    this.syncState.next({
      ...currentSyncState,
      ...syncData,
      lastUpdated: new Date()
    });
    
    if (syncData.status === SyncState.SUCCESS && syncData.result) {
      this._cache.syncResults = syncData.result;
    }
  }

  /**
   * Signale le début d'une opération de synchronisation
   */
  beginSync() {
    this.updateSyncState({
      status: SyncState.IN_PROGRESS,
      error: null
    });
  }

  /**
   * Signale le succès d'une opération de synchronisation
   * @param {Object} result - Résultat de la synchronisation
   */
  syncSuccess(result) {
    this.updateSyncState({
      status: SyncState.SUCCESS,
      lastSynced: new Date(),
      error: null,
      result
    });
  }

  /**
   * Signale l'échec d'une opération de synchronisation
   * @param {Error|string} error - Erreur survenue
   */
  syncError(error) {
    if (error instanceof StateError) {
      this.updateSyncState({
        status: SyncState.ERROR,
        error: {
          message: error.message,
          code: error.code,
          details: error.details
        }
      });
    } else {
      this.updateSyncState({
        status: SyncState.ERROR,
        error: {
          message: error instanceof Error ? error.message : error,
          code: 'UNKNOWN_ERROR'
        }
      });
    }
  }

  /**
   * Gère les erreurs de manière centralisée
   * @param {Error} error - L'erreur à gérer
   * @param {string} context - Le contexte dans lequel l'erreur s'est produite
   */
  handleError(error, context) {
    console.error(`Erreur d'état dans ${context}:`, error);
    
    if (error instanceof StateError) {
      this.syncState.next({
        status: SyncState.ERROR,
        error: {
          message: error.message,
          code: error.code,
          details: error.details
        }
      });
    } else {
      this.syncState.next({
        status: SyncState.ERROR,
        error: {
          message: error.message,
          code: 'UNKNOWN_ERROR'
        }
      });
    }
  }

  /**
   * Obtient l'état nutritionnel actuel
   * @returns {Object} État nutritionnel
   */
  getNutritionState() {
    return this._cache.nutrition;
  }

  /**
   * Obtient l'état d'entraînement actuel
   * @returns {Object} État d'entraînement
   */
  getTrainingState() {
    return this._cache.training;
  }

  /**
   * Obtient l'état de synchronisation actuel
   * @returns {Object} État de synchronisation
   */
  getSyncState() {
    return this.syncState.value;
  }

  /**
   * Vérifie si les deux modules sont actifs
   * @returns {boolean} Vrai si les deux modules sont actifs
   */
  areBothModulesActive() {
    const { nutrition, training } = this.activeModules.value;
    return nutrition && training;
  }

  /**
   * Réinitialise tous les états
   */
  resetAllStates() {
    this._cache = {
      nutrition: null,
      training: null,
      syncResults: null
    };
    
    // Supprimer les caches locaux
    this._clearCache('nutrition');
    this._clearCache('training');
    
    this.nutritionState.next(null);
    this.trainingState.next(null);
    this.syncState.next({
      status: SyncState.IDLE,
      lastSynced: null,
      error: null
    });
    
    this.activeModules.next({
      nutrition: false,
      training: false,
      cols: false,
      sevenMajors: false,
      community: false
    });
    
    // Réinitialiser les métriques de performance
    this.performanceMetrics.resetMetrics();
  }

  /**
   * Tente une synchronisation automatique si les conditions sont remplies
   * @private
   */
  _attemptAutoSync() {
    // Vérifier si les deux modules sont actifs et si aucune synchronisation n'est en cours
    if (this.areBothModulesActive() && this.syncState.value.status !== SyncState.IN_PROGRESS) {
      // Vérifier si nous sommes en ligne
      if (!this.offlineManager.isConnected()) {
        console.log('Synchronisation automatique reportée - Mode hors ligne');
        return;
      }
      
      const nutritionState = this.nutritionState.value;
      const trainingState = this.trainingState.value;
      
      // Vérifier la compatibilité des données
      const startTime = performance.now();
      const compatibility = dataValidator.validateCompatibility(
        nutritionState,
        trainingState
      );
      this.performanceMetrics.trackValidation(performance.now() - startTime);
      
      if (!compatibility.isCompatible) {
        this.syncState.next({
          status: SyncState.ERROR,
          error: {
            message: 'Incompatibilité des données',
            code: 'DATA_INCOMPATIBILITY',
            details: { issues: compatibility.issues }
          }
        });
        this.performanceMetrics.trackError('validation');
        return;
      }
      
      // Simple notification que la synchronisation pourrait être effectuée
      console.log('Les modules nutrition et entraînement sont prêts pour la synchronisation');
    }
  }

  /**
   * Enregistre un changement de module actif
   * @param {string} moduleName - Nom du module ('nutrition', 'training', etc.)
   * @param {boolean} isActive - État d'activité du module
   */
  setModuleActive(moduleName, isActive) {
    if (!Object.keys(this.activeModules.value).includes(moduleName)) {
      console.warn(`Module inconnu: ${moduleName}`);
      return;
    }
    
    this.activeModules.next({
      ...this.activeModules.value,
      [moduleName]: isActive
    });
  }

  /**
   * Obtient une liste des modules actifs
   * @returns {Array<string>} Liste des modules actifs
   */
  getActiveModules() {
    const activeModules = [];
    const currentState = this.activeModules.value;
    
    for (const [module, isActive] of Object.entries(currentState)) {
      if (isActive) {
        activeModules.push(module);
      }
    }
    
    return activeModules;
  }

  /**
   * Vérifie si un module spécifique est actif
   * @param {string} moduleName - Nom du module à vérifier
   * @returns {boolean} Vrai si le module est actif
   */
  isModuleActive(moduleName) {
    return this.activeModules.value[moduleName] || false;
  }

  /**
   * Obtient les métriques de performance
   * @returns {Object} Métriques de performance
   */
  getPerformanceMetrics() {
    return this.performanceMetrics.getAllMetrics();
  }

  /**
   * Met à jour le cache avec des données
   * @param {string} type - Type de données à mettre en cache
   * @param {Object} data - Données à mettre en cache
   * @private
   */
  _updateCache(type, data) {
    try {
      const cache = {
        timestamp: Date.now(),
        version: CacheConfig.VERSION,
        data
      };
      localStorage.setItem(`velo_altitude_${type}_cache`, JSON.stringify(cache));
    } catch (error) {
      console.warn(`Erreur lors de la mise en cache des données ${type}:`, error);
      this.performanceMetrics.trackError('cache');
    }
  }

  /**
   * Charge des données depuis le cache
   * @param {string} type - Type de données à charger
   * @returns {Object|null} Données du cache ou null si non disponibles/expirées
   * @private
   */
  _loadFromCache(type) {
    try {
      const cached = localStorage.getItem(`velo_altitude_${type}_cache`);
      if (!cached) return null;
      
      const { timestamp, version, data } = JSON.parse(cached);
      if (version !== CacheConfig.VERSION) return null;
      if (Date.now() - timestamp > CacheConfig.TTL) {
        this._clearCache(type);
        return null;
      }
      
      return data;
    } catch (error) {
      console.warn(`Erreur lors du chargement du cache ${type}:`, error);
      this.performanceMetrics.trackError('cache');
      return null;
    }
  }

  /**
   * Efface un élément du cache
   * @param {string} type - Type de cache à effacer
   * @private
   */
  _clearCache(type) {
    try {
      localStorage.removeItem(`velo_altitude_${type}_cache`);
    } catch (error) {
      console.warn(`Erreur lors de la suppression du cache ${type}:`, error);
      this.performanceMetrics.trackError('cache');
    }
  }

  /**
   * Récupère des données distantes depuis une URL spécifiée
   * @param {string} url - URL de l'API
   * @returns {Promise<Object>} Données distantes
   * @private
   */
  async _fetchRemoteData(url) {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new StateError('AuthError', 'Token d\'authentification non disponible');
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new StateError('AuthError', `Erreur d'authentification: ${response.status}`);
        }
        throw new StateError('NetworkError', `Erreur réseau: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.warn(`Erreur lors de la récupération des données depuis ${url}:`, error);
      return null;
    }
  }

  /**
   * Traite la file d'attente d'opérations hors ligne
   * @returns {Promise<void>}
   */
  async processOfflineQueue() {
    if (!this.offlineManager.hasQueuedOperations()) {
      return;
    }
    
    const startTime = performance.now();
    console.log('Traitement de la file d\'attente des opérations hors ligne');
    
    const operations = this.offlineManager.getQueuedOperations();
    for (const operation of operations) {
      try {
        switch (operation.type) {
          case 'nutrition':
            if (operation.action === 'update') {
              // Vérifier les conflits potentiels
              const remoteNutritionData = await this._fetchRemoteData('/api/nutrition/profile');
              
              if (remoteNutritionData && conflictResolver.hasConflict(operation.data, remoteNutritionData)) {
                // Résoudre le conflit selon la stratégie configurée
                const resolvedData = await conflictResolver.resolveConflict(
                  'nutrition', 
                  operation.data, 
                  remoteNutritionData
                );
                
                // Mettre à jour avec les données résolues
                await this.updateNutritionState(resolvedData, true);
              } else {
                // Pas de conflit, mettre à jour normalement
                await this.updateNutritionState(operation.data, true);
              }
            }
            break;
            
          case 'training':
            if (operation.action === 'update') {
              // Vérifier les conflits potentiels
              const remoteTrainingData = await this._fetchRemoteData('/api/training/plan');
              
              if (remoteTrainingData && conflictResolver.hasConflict(operation.data, remoteTrainingData)) {
                // Résoudre le conflit selon la stratégie configurée
                const resolvedData = await conflictResolver.resolveConflict(
                  'training', 
                  operation.data, 
                  remoteTrainingData
                );
                
                // Mettre à jour avec les données résolues
                await this.updateTrainingState(resolvedData, true);
              } else {
                // Pas de conflit, mettre à jour normalement
                await this.updateTrainingState(operation.data, true);
              }
            }
            break;
            
          default:
            console.warn(`Type d'opération non pris en charge: ${operation.type}`);
        }
      } catch (error) {
        console.error(`Erreur lors du traitement de l'opération en file d'attente (${operation.type}):`, error);
        this.performanceMetrics.trackError(`offline_${operation.type}`);
      }
    }
    
    // Vider la file d'attente après traitement
    this.offlineManager.clearQueue();
    
    this.performanceMetrics.trackOperationDuration('processOfflineQueue', performance.now() - startTime);
    console.log('Traitement de la file d\'attente terminé');
  }
}

export default new StateManager();
