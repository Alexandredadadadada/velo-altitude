/**
 * Service de résolution des conflits de données pour l'orchestration
 * Utilisé par le StateManager pour résoudre les conflits entre données locales et distantes
 */

/**
 * Stratégies de résolution de conflits
 */
export const ResolutionStrategy = {
  REMOTE_WINS: 'remote_wins',      // La version distante a priorité
  LOCAL_WINS: 'local_wins',        // La version locale a priorité
  LATEST_WINS: 'latest_wins',      // La version la plus récente a priorité
  MERGE: 'merge',                  // Fusion des deux versions
  MANUAL: 'manual'                 // Demande l'intervention de l'utilisateur
};

class ConflictResolver {
  constructor() {
    this.defaultStrategies = {
      nutrition: ResolutionStrategy.LATEST_WINS,
      training: ResolutionStrategy.MERGE
    };
    
    this.manualResolutionCallbacks = new Map();
  }

  /**
   * Définit la stratégie par défaut pour un type de données
   * @param {string} dataType - Type de données ('nutrition', 'training', etc.)
   * @param {string} strategy - Stratégie de résolution (voir ResolutionStrategy)
   */
  setDefaultStrategy(dataType, strategy) {
    if (!Object.values(ResolutionStrategy).includes(strategy)) {
      throw new Error(`Stratégie invalide: ${strategy}`);
    }
    
    this.defaultStrategies[dataType] = strategy;
  }

  /**
   * Résout un conflit de données
   * @param {string} dataType - Type de données ('nutrition', 'training', etc.)
   * @param {Object} localData - Données locales
   * @param {Object} remoteData - Données distantes
   * @param {string} [strategy] - Stratégie de résolution (optionnel, utilise la stratégie par défaut si non spécifié)
   * @returns {Promise<Object>} Données résolues
   */
  async resolveConflict(dataType, localData, remoteData, strategy) {
    if (!localData || !remoteData) {
      return localData || remoteData; // Si l'une des versions est nulle, retourner l'autre
    }
    
    // Utiliser la stratégie spécifiée ou la stratégie par défaut
    const resolutionStrategy = strategy || this.defaultStrategies[dataType] || ResolutionStrategy.LATEST_WINS;
    
    console.log(`Résolution de conflit pour ${dataType} avec stratégie ${resolutionStrategy}`);
    
    switch (resolutionStrategy) {
      case ResolutionStrategy.REMOTE_WINS:
        return remoteData;
        
      case ResolutionStrategy.LOCAL_WINS:
        return localData;
        
      case ResolutionStrategy.LATEST_WINS:
        return this._resolveByTimestamp(localData, remoteData);
        
      case ResolutionStrategy.MERGE:
        return this._mergeData(dataType, localData, remoteData);
        
      case ResolutionStrategy.MANUAL:
        return this._requestManualResolution(dataType, localData, remoteData);
        
      default:
        console.warn(`Stratégie inconnue: ${resolutionStrategy}, utilisation de LATEST_WINS`);
        return this._resolveByTimestamp(localData, remoteData);
    }
  }

  /**
   * Résout un conflit en se basant sur les timestamps
   * @param {Object} localData - Données locales
   * @param {Object} remoteData - Données distantes
   * @returns {Object} Version la plus récente
   * @private
   */
  _resolveByTimestamp(localData, remoteData) {
    const localTimestamp = this._getDataTimestamp(localData);
    const remoteTimestamp = this._getDataTimestamp(remoteData);
    
    if (localTimestamp > remoteTimestamp) {
      return localData;
    } else {
      return remoteData;
    }
  }

  /**
   * Obtient le timestamp d'un objet de données
   * @param {Object} data - Objet de données
   * @returns {number} Timestamp en millisecondes
   * @private
   */
  _getDataTimestamp(data) {
    // Chercher un timestamp dans l'objet (différentes conventions possibles)
    if (data.lastModified) {
      return new Date(data.lastModified).getTime();
    } else if (data.updatedAt) {
      return new Date(data.updatedAt).getTime();
    } else if (data.timestamp) {
      return new Date(data.timestamp).getTime();
    } else if (data.lastUpdated) {
      return new Date(data.lastUpdated).getTime();
    }
    
    // Si aucun timestamp n'est trouvé, retourner 0 (très ancien)
    return 0;
  }

  /**
   * Fusionne deux objets de données en fonction de leur type
   * @param {string} dataType - Type de données
   * @param {Object} localData - Données locales
   * @param {Object} remoteData - Données distantes
   * @returns {Object} Données fusionnées
   * @private
   */
  _mergeData(dataType, localData, remoteData) {
    switch (dataType) {
      case 'nutrition':
        return this._mergeNutritionData(localData, remoteData);
        
      case 'training':
        return this._mergeTrainingData(localData, remoteData);
        
      default:
        // Fusion générique pour les autres types de données
        return {
          ...remoteData,
          ...localData,
          lastMerged: new Date()
        };
    }
  }

  /**
   * Fusionne spécifiquement des données nutritionnelles
   * @param {Object} localData - Données nutritionnelles locales
   * @param {Object} remoteData - Données nutritionnelles distantes
   * @returns {Object} Données nutritionnelles fusionnées
   * @private
   */
  _mergeNutritionData(localData, remoteData) {
    // Fusion intelligente des données nutritionnelles
    const merged = { ...remoteData };
    
    // Préférer les objectifs locaux s'ils sont plus récents
    if (localData.goals && this._getDataTimestamp(localData) > this._getDataTimestamp(remoteData)) {
      merged.goals = localData.goals;
    }
    
    // Fusionner les plans de repas, en préférant les repas locaux modifiés
    if (localData.mealPlan && remoteData.mealPlan) {
      merged.mealPlan = { ...remoteData.mealPlan };
      
      // Parcourir tous les repas de la journée
      for (const mealTime in localData.mealPlan) {
        if (localData.mealPlan[mealTime] && localData.mealPlan[mealTime].modified) {
          merged.mealPlan[mealTime] = localData.mealPlan[mealTime];
        }
      }
    }
    
    // Conserver les préférences utilisateur locales
    if (localData.preferences) {
      merged.preferences = { ...(remoteData.preferences || {}), ...localData.preferences };
    }
    
    // Ajouter un indicateur de fusion
    merged.lastMerged = new Date();
    
    return merged;
  }

  /**
   * Fusionne spécifiquement des données d'entraînement
   * @param {Object} localData - Données d'entraînement locales
   * @param {Object} remoteData - Données d'entraînement distantes
   * @returns {Object} Données d'entraînement fusionnées
   * @private
   */
  _mergeTrainingData(localData, remoteData) {
    // Fusion intelligente des données d'entraînement
    const merged = { ...remoteData };
    
    // Préférer les objectifs locaux s'ils sont plus récents
    if (localData.goal && this._getDataTimestamp(localData) > this._getDataTimestamp(remoteData)) {
      merged.goal = localData.goal;
    }
    
    // Fusionner les entraînements complétés
    if (localData.completedWorkouts && remoteData.completedWorkouts) {
      // Créer un ensemble d'IDs uniques
      const workoutIds = new Set([
        ...(localData.completedWorkouts || []).map(w => w.id),
        ...(remoteData.completedWorkouts || []).map(w => w.id)
      ]);
      
      // Map pour retrouver rapidement un entraînement par ID
      const localWorkoutsMap = new Map(
        (localData.completedWorkouts || []).map(w => [w.id, w])
      );
      const remoteWorkoutsMap = new Map(
        (remoteData.completedWorkouts || []).map(w => [w.id, w])
      );
      
      // Fusionner les entraînements, en préférant la version la plus récente
      const mergedWorkouts = [];
      for (const id of workoutIds) {
        const localWorkout = localWorkoutsMap.get(id);
        const remoteWorkout = remoteWorkoutsMap.get(id);
        
        if (localWorkout && remoteWorkout) {
          // Les deux versions existent, choisir la plus récente
          mergedWorkouts.push(
            this._getDataTimestamp(localWorkout) > this._getDataTimestamp(remoteWorkout)
              ? localWorkout
              : remoteWorkout
          );
        } else {
          // Une seule version existe
          mergedWorkouts.push(localWorkout || remoteWorkout);
        }
      }
      
      merged.completedWorkouts = mergedWorkouts;
    }
    
    // Préserver les notes locales
    if (localData.notes && localData.notes.length) {
      merged.notes = [
        ...(remoteData.notes || []),
        ...(localData.notes || []).filter(n => n.isLocal)
      ];
    }
    
    // Ajouter un indicateur de fusion
    merged.lastMerged = new Date();
    
    return merged;
  }

  /**
   * Demande une résolution manuelle à l'utilisateur
   * @param {string} dataType - Type de données
   * @param {Object} localData - Données locales
   * @param {Object} remoteData - Données distantes
   * @returns {Promise<Object>} Données résolues
   * @private
   */
  async _requestManualResolution(dataType, localData, remoteData) {
    return new Promise((resolve) => {
      const callback = (resolvedData) => {
        resolve(resolvedData);
      };
      
      // Stocker le callback pour la résolution manuelle
      this.manualResolutionCallbacks.set(dataType, callback);
      
      // Émettre un événement pour notifier l'interface utilisateur
      const event = new CustomEvent('conflict-resolution-needed', {
        detail: {
          dataType,
          localData,
          remoteData,
          resolve: callback
        }
      });
      
      window.dispatchEvent(event);
      
      // Si aucune interface ne répond dans les 5 secondes, utiliser la stratégie LATEST_WINS
      setTimeout(() => {
        if (this.manualResolutionCallbacks.has(dataType)) {
          console.warn(`Pas de résolution manuelle reçue pour ${dataType}, utilisation de LATEST_WINS`);
          this.manualResolutionCallbacks.delete(dataType);
          resolve(this._resolveByTimestamp(localData, remoteData));
        }
      }, 5000);
    });
  }

  /**
   * Résout manuellement un conflit
   * @param {string} dataType - Type de données
   * @param {Object} resolvedData - Données résolues
   * @returns {boolean} Vrai si la résolution a réussi
   */
  manuallyResolveConflict(dataType, resolvedData) {
    const callback = this.manualResolutionCallbacks.get(dataType);
    if (callback) {
      callback(resolvedData);
      this.manualResolutionCallbacks.delete(dataType);
      return true;
    }
    return false;
  }

  /**
   * Vérifie s'il y a un conflit entre deux objets de données
   * @param {Object} localData - Données locales
   * @param {Object} remoteData - Données distantes
   * @returns {boolean} Vrai s'il y a un conflit
   */
  hasConflict(localData, remoteData) {
    if (!localData || !remoteData) {
      return false; // Pas de conflit si l'une des versions est manquante
    }
    
    const localTimestamp = this._getDataTimestamp(localData);
    const remoteTimestamp = this._getDataTimestamp(remoteData);
    
    // Si les timestamps sont identiques, il n'y a probablement pas de conflit
    if (localTimestamp === remoteTimestamp) {
      return false;
    }
    
    // Vérifier les attributs modifiés dans les deux objets
    const localModified = this._getModifiedAttributes(localData, remoteTimestamp);
    const remoteModified = this._getModifiedAttributes(remoteData, localTimestamp);
    
    // S'il y a des attributs modifiés des deux côtés, il y a un conflit
    const conflictingKeys = localModified.filter(key => remoteModified.includes(key));
    
    return conflictingKeys.length > 0;
  }

  /**
   * Obtient les attributs modifiés après un certain timestamp
   * @param {Object} data - Objet de données
   * @param {number} compareTimestamp - Timestamp de comparaison
   * @returns {Array<string>} Liste des clés modifiées
   * @private
   */
  _getModifiedAttributes(data, compareTimestamp) {
    const modified = [];
    
    // Vérifier dans les attributs de premier niveau
    for (const key in data) {
      const attrTimestamp = data[key]?.lastModified || data[key]?.updatedAt || 0;
      if (attrTimestamp && new Date(attrTimestamp).getTime() > compareTimestamp) {
        modified.push(key);
      }
    }
    
    return modified;
  }
}

export default new ConflictResolver();
