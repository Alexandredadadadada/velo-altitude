/**
 * ApiKeyPermissionManager - Classe pour la gestion des permissions d'accès aux clés API
 * 
 * Cette classe implémente un système de permissions pour limiter l'accès aux clés API
 * selon le contexte d'utilisation, suivant le principe du moindre privilège.
 */

class ApiKeyPermissionManager {
  /**
   * Constructeur
   * @param {Object} options - Options de configuration
   * @param {Object} options.logger - Instance de logger
   */
  constructor(options = {}) {
    this.permissions = new Map();
    this.logger = options.logger || console;
    
    // Initialiser les permissions par défaut
    this.setupDefaultPermissions();
  }

  /**
   * Configurer les permissions par défaut
   */
  setupDefaultPermissions() {
    // Le module de météo n'a accès qu'à l'API météo
    this.setPermissions('weather-module', ['weatherService']);
    
    // Le module de cartographie a accès aux APIs de cartographie
    this.setPermissions('map-module', ['openRouteService', 'mapbox']);
    
    // Le module d'activités a accès à Strava
    this.setPermissions('activity-module', ['strava']);
    
    // Le module IA a accès aux APIs d'IA
    this.setPermissions('ai-module', ['openai']);
    
    // Les administrateurs ont accès à tout
    this.setPermissions('admin', ['openRouteService', 'strava', 'weatherService', 'openai', 'mapbox']);
  }

  /**
   * Définir les permissions pour un module
   * @param {string} moduleId - Identifiant du module
   * @param {Array<string>} allowedServices - Services autorisés pour ce module
   * @returns {boolean} - Succès de l'opération
   */
  setPermissions(moduleId, allowedServices) {
    if (!moduleId || !Array.isArray(allowedServices)) {
      this.logger.error('Paramètres invalides pour setPermissions', { moduleId, allowedServices });
      return false;
    }
    
    this.permissions.set(moduleId, new Set(allowedServices));
    this.logger.debug(`Permissions définies pour ${moduleId}`, { moduleId, allowedServices });
    return true;
  }

  /**
   * Ajouter des permissions à un module existant
   * @param {string} moduleId - Identifiant du module
   * @param {Array<string>} additionalServices - Services supplémentaires à autoriser
   * @returns {boolean} - Succès de l'opération
   */
  addPermissions(moduleId, additionalServices) {
    if (!moduleId || !Array.isArray(additionalServices)) {
      this.logger.error('Paramètres invalides pour addPermissions', { moduleId, additionalServices });
      return false;
    }
    
    if (!this.permissions.has(moduleId)) {
      return this.setPermissions(moduleId, additionalServices);
    }
    
    const currentPermissions = this.permissions.get(moduleId);
    additionalServices.forEach(service => currentPermissions.add(service));
    
    this.logger.debug(`Permissions ajoutées pour ${moduleId}`, { moduleId, additionalServices });
    return true;
  }

  /**
   * Retirer des permissions à un module
   * @param {string} moduleId - Identifiant du module
   * @param {Array<string>} servicesToRemove - Services à retirer
   * @returns {boolean} - Succès de l'opération
   */
  removePermissions(moduleId, servicesToRemove) {
    if (!moduleId || !Array.isArray(servicesToRemove)) {
      this.logger.error('Paramètres invalides pour removePermissions', { moduleId, servicesToRemove });
      return false;
    }
    
    if (!this.permissions.has(moduleId)) {
      this.logger.warn(`Module ${moduleId} non trouvé pour removePermissions`);
      return false;
    }
    
    const currentPermissions = this.permissions.get(moduleId);
    servicesToRemove.forEach(service => currentPermissions.delete(service));
    
    this.logger.debug(`Permissions retirées pour ${moduleId}`, { moduleId, servicesToRemove });
    return true;
  }

  /**
   * Vérifier si un module a accès à un service
   * @param {string} moduleId - Identifiant du module
   * @param {string} service - Service à vérifier
   * @returns {boolean} - True si le module a accès au service
   */
  hasPermission(moduleId, service) {
    if (!moduleId || !service) {
      return false;
    }
    
    const modulePermissions = this.permissions.get(moduleId);
    const hasPermission = modulePermissions && modulePermissions.has(service);
    
    if (!hasPermission) {
      this.logger.warn(`Accès refusé à ${service} pour ${moduleId}`);
    }
    
    return hasPermission;
  }

  /**
   * Obtenir toutes les permissions d'un module
   * @param {string} moduleId - Identifiant du module
   * @returns {Array<string>|null} - Liste des services autorisés ou null si le module n'existe pas
   */
  getPermissions(moduleId) {
    if (!this.permissions.has(moduleId)) {
      return null;
    }
    
    return Array.from(this.permissions.get(moduleId));
  }

  /**
   * Obtenir tous les modules ayant accès à un service
   * @param {string} service - Service à vérifier
   * @returns {Array<string>} - Liste des modules ayant accès au service
   */
  getModulesWithAccess(service) {
    const modules = [];
    
    for (const [moduleId, permissions] of this.permissions.entries()) {
      if (permissions.has(service)) {
        modules.push(moduleId);
      }
    }
    
    return modules;
  }

  /**
   * Supprimer un module et toutes ses permissions
   * @param {string} moduleId - Identifiant du module à supprimer
   * @returns {boolean} - Succès de l'opération
   */
  deleteModule(moduleId) {
    if (!this.permissions.has(moduleId)) {
      this.logger.warn(`Module ${moduleId} non trouvé pour deleteModule`);
      return false;
    }
    
    this.permissions.delete(moduleId);
    this.logger.debug(`Module ${moduleId} supprimé`);
    return true;
  }

  /**
   * Réinitialiser toutes les permissions
   * @param {boolean} setupDefaults - Reconfigurer les permissions par défaut
   * @returns {boolean} - Succès de l'opération
   */
  resetAllPermissions(setupDefaults = true) {
    this.permissions.clear();
    
    if (setupDefaults) {
      this.setupDefaultPermissions();
    }
    
    this.logger.debug('Toutes les permissions ont été réinitialisées');
    return true;
  }

  /**
   * Générer un rapport des permissions
   * @returns {Object} - Rapport détaillé des permissions
   */
  generatePermissionsReport() {
    const report = {
      timestamp: new Date().toISOString(),
      moduleCount: this.permissions.size,
      modules: {},
      serviceAccess: {}
    };
    
    // Collecter les permissions par module
    for (const [moduleId, permissions] of this.permissions.entries()) {
      report.modules[moduleId] = Array.from(permissions);
    }
    
    // Collecter les modules par service
    const allServices = new Set();
    for (const permissions of this.permissions.values()) {
      for (const service of permissions) {
        allServices.add(service);
      }
    }
    
    for (const service of allServices) {
      report.serviceAccess[service] = this.getModulesWithAccess(service);
    }
    
    return report;
  }
}

module.exports = ApiKeyPermissionManager;
