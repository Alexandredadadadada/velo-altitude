/**
 * Initialisation des services
 * Ce fichier résout les dépendances circulaires en initialisant tous les services
 * dans le bon ordre, puis en les enregistrant auprès du gestionnaire d'API
 */

const { logger } = require('../utils/logger');
const path = require('path');
const fs = require('fs');

// Liste des services à initialiser dans l'ordre
const serviceInitOrder = [
  'error.service',
  'token-blacklist.service',
  'cache.service',
  'pagination.service',
  'auth.service',
  'notification.service',
  'openroute.service',
  'strava.service',
  'community.service',
  'api-manager.service' // Ajout du gestionnaire d'API à la fin
];

// Graphe de dépendances pour résoudre l'ordre d'initialisation
const serviceDependencies = {
  'auth.service': ['token-blacklist.service', 'error.service'],
  'notification.service': ['error.service'],
  'openroute.service': ['error.service', 'cache.service'],
  'strava.service': ['error.service'],
  'community.service': ['error.service', 'cache.service', 'notification.service'],
  'api-manager.service': ['error.service', 'cache.service', 'pagination.service'],
  'cache.service': ['error.service'],
  'pagination.service': ['error.service']
};

// Dépendances circulaires connues qui seront résolues après l'initialisation
const circularDependencies = [
  { from: 'auth.service', to: 'notification.service', method: 'setNotificationService' },
  { from: 'openroute.service', to: 'api-manager.service', method: 'setApiManager' },
  { from: 'openroute.service', to: 'cache.service', method: 'setCacheService' },
  { from: 'community.service', to: 'api-manager.service', method: 'setApiManager' }
];

// Cache pour les services déjà initialisés
const initializedServices = new Map();

// Statut d'initialisation des services
const serviceStatus = new Map();

/**
 * Détecte automatiquement les services disponibles dans le répertoire des services
 * @returns {Promise<string[]>} Liste des services disponibles
 */
async function discoverServices() {
  const servicesDir = path.join(__dirname);
  
  try {
    const files = fs.readdirSync(servicesDir);
    const serviceFiles = files.filter(file => 
      file.endsWith('.service.js') && 
      fs.statSync(path.join(servicesDir, file)).isFile()
    );
    
    // Extraire les noms de services
    const discoveredServices = serviceFiles.map(file => file);
    logger.debug(`Services découverts automatiquement: ${discoveredServices.join(', ')}`);
    
    return discoveredServices;
  } catch (error) {
    logger.error(`Erreur lors de la découverte des services: ${error.message}`);
    return [];
  }
}

/**
 * Initialise un service et ses dépendances
 * @param {string} serviceName Nom du service à initialiser
 * @param {Set<string>} initStack Pile des services en cours d'initialisation (pour détecter les cycles)
 * @param {boolean} isRetry Indique s'il s'agit d'une tentative de réinitialisation
 * @returns {Promise<Object>} Service initialisé
 */
async function initializeService(serviceName, initStack = new Set(), isRetry = false) {
  // Si le service est déjà initialisé, le retourner
  if (initializedServices.has(serviceName) && serviceStatus.get(serviceName) === 'initialized') {
    return initializedServices.get(serviceName);
  }
  
  // Détecter les cycles de dépendances
  if (initStack.has(serviceName)) {
    // Si c'est une dépendance circulaire connue, on peut continuer
    const isKnownCircular = circularDependencies.some(dep => 
      (dep.from === serviceName && initStack.has(dep.to)) || 
      (dep.to === serviceName && initStack.has(dep.from))
    );
    
    if (isKnownCircular) {
      logger.debug(`Dépendance circulaire connue détectée pour ${serviceName}, sera résolue plus tard`);
      // Retourner un proxy temporaire si le service est déjà dans la pile d'initialisation
      if (initializedServices.has(serviceName)) {
        return initializedServices.get(serviceName);
      }
      
      // Créer un service factice pour éviter les erreurs
      const mockService = createMockService(serviceName);
      initializedServices.set(serviceName, mockService);
      serviceStatus.set(serviceName, 'pending');
      return mockService;
    } else {
      // Cycle de dépendance non géré
      throw new Error(`Cycle de dépendance détecté pour le service: ${serviceName}. Pile d'initialisation: ${Array.from(initStack).join(' -> ')} -> ${serviceName}`);
    }
  }
  
  // Marquer le service comme étant en cours d'initialisation
  initStack.add(serviceName);
  serviceStatus.set(serviceName, 'initializing');
  
  logger.debug(`Initialisation du service: ${serviceName}`);
  
  try {
    // Initialiser d'abord les dépendances
    const dependencies = serviceDependencies[serviceName] || [];
    for (const dependency of dependencies) {
      try {
        await initializeService(dependency, new Set(initStack), false);
      } catch (error) {
        if (error.message.includes('Cycle de dépendance détecté')) {
          logger.warn(`Dépendance circulaire détectée lors de l'initialisation de ${serviceName} -> ${dependency}, sera résolue plus tard`);
          continue;
        }
        throw error;
      }
    }
    
    // Charger et initialiser le service
    let service;
    try {
      // Construire le chemin complet du service
      const servicePath = `./${serviceName}`;
      
      // Vider le cache du module pour s'assurer d'obtenir une instance fraîche
      if (isRetry) {
        delete require.cache[require.resolve(servicePath)];
      }
      
      service = require(servicePath);
      
      // Si le service a une méthode d'initialisation, l'appeler
      if (typeof service.initialize === 'function') {
        await service.initialize();
      }
      
      // Mettre en cache le service initialisé
      initializedServices.set(serviceName, service);
      serviceStatus.set(serviceName, 'initialized');
      
      logger.info(`Service initialisé avec succès: ${serviceName}`);
    } catch (error) {
      // Gérer les erreurs spécifiques à l'initialisation du service
      if (error.code === 'MODULE_NOT_FOUND') {
        logger.warn(`Service non trouvé: ${serviceName}`);
        // Créer un service factice pour éviter les erreurs en cascade
        const mockService = createMockService(serviceName);
        initializedServices.set(serviceName, mockService);
        serviceStatus.set(serviceName, 'mock');
        return mockService;
      }
      
      throw error;
    }
    
    // Retirer le service de la pile d'initialisation
    initStack.delete(serviceName);
    
    return service;
  } catch (error) {
    // Retirer le service de la pile d'initialisation en cas d'erreur
    initStack.delete(serviceName);
    serviceStatus.set(serviceName, 'failed');
    
    // Utiliser le service d'erreur s'il est disponible
    let errorService;
    try {
      errorService = initializedServices.get('error.service') || require('./error.service');
    } catch (e) {
      // Si le service d'erreur n'est pas disponible, logger directement
      logger.error(`Échec de l'initialisation du service: ${serviceName}`, {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
    
    const initError = errorService.createError(
      errorService.ERROR_TYPES.SERVER,
      `Échec de l'initialisation du service: ${serviceName}`,
      {
        service: serviceName,
        originalError: error.message
      },
      error,
      errorService.SEVERITY_LEVELS.ERROR
    );
    
    logger.error(`ERREUR: ${initError.message}`, {
      error: initError,
      stack: error.stack
    });
    
    throw initError;
  }
}

/**
 * Crée un service factice pour éviter les erreurs en cascade
 * @param {string} serviceName Nom du service
 * @returns {Object} Service factice
 */
function createMockService(serviceName) {
  logger.debug(`Création d'un service factice pour: ${serviceName}`);
  
  // Créer un proxy qui journalise les appels de méthodes
  return new Proxy({
    name: serviceName,
    status: 'mock',
    isMock: true,
    _missingMethods: new Set()
  }, {
    get(target, prop) {
      // Retourner les propriétés existantes
      if (prop in target) {
        return target[prop];
      }
      
      // Pour les méthodes manquantes, créer une fonction factice
      if (typeof prop === 'string' && !prop.startsWith('_')) {
        // Ne journaliser chaque méthode manquante qu'une seule fois
        if (!target._missingMethods.has(prop)) {
          logger.warn(`Appel à la méthode non implémentée ${prop} sur le service factice ${serviceName}`);
          target._missingMethods.add(prop);
        }
        
        // Retourner une fonction factice qui ne fait rien
        return (...args) => {
          return Promise.resolve(null);
        };
      }
      
      return undefined;
    }
  });
}

/**
 * Initialise tous les services dans l'ordre défini
 * @returns {Promise<void>}
 */
async function initializeAllServices() {
  logger.info('Démarrage de l\'initialisation des services...');
  
  try {
    // Découvrir les services disponibles
    const discoveredServices = await discoverServices();
    
    // Fusionner avec la liste prédéfinie et dédupliquer
    const allServices = Array.from(new Set([...serviceInitOrder, ...discoveredServices]));
    
    // Initialiser tous les services
    for (const serviceName of allServices) {
      try {
        await initializeService(serviceName);
      } catch (error) {
        logger.error(`Erreur lors de l'initialisation du service ${serviceName}: ${error.message}`);
        // Continuer avec les autres services
      }
    }
    
    // Résoudre les références circulaires après l'initialisation
    await resolveCircularDependencies();
    
    // Enregistrer les services auprès du gestionnaire d'API
    await registerServicesWithApiManager();
    
    logger.info('Tous les services ont été initialisés avec succès');
  } catch (error) {
    logger.error('Échec de l\'initialisation des services', {
      error: error.message,
      stack: error.stack
    });
    
    // Propager l'erreur pour que le serveur puisse décider quoi faire
    throw error;
  }
}

/**
 * Résout les références circulaires entre les services
 */
async function resolveCircularDependencies() {
  logger.debug('Résolution des références circulaires entre services...');
  
  try {
    // Résoudre toutes les dépendances circulaires connues
    for (const { from, to, method } of circularDependencies) {
      const sourceService = initializedServices.get(from);
      const targetService = initializedServices.get(to);
      
      if (sourceService && targetService && typeof sourceService[method] === 'function') {
        sourceService[method](targetService);
        logger.debug(`Service de ${to} injecté dans ${from} via ${method}`);
      } else if (sourceService && targetService) {
        logger.warn(`Impossible de résoudre la dépendance circulaire: ${from} -> ${to}, méthode ${method} non disponible`);
      } else {
        logger.warn(`Impossible de résoudre la dépendance circulaire: ${from} -> ${to}, un ou plusieurs services manquants`);
      }
    }
    
    logger.info('Résolution des références circulaires terminée');
  } catch (error) {
    logger.warn(`Erreur lors de la résolution des références circulaires: ${error.message}`);
  }
}

/**
 * Enregistre les services auprès du gestionnaire d'API
 */
async function registerServicesWithApiManager() {
  logger.debug('Enregistrement des services auprès du gestionnaire d\'API...');
  
  try {
    const apiManager = initializedServices.get('api-manager.service');
    
    if (!apiManager) {
      logger.warn('Gestionnaire d\'API non disponible, impossible d\'enregistrer les services');
      return;
    }
    
    // Parcourir tous les services initialisés
    for (const [name, service] of initializedServices.entries()) {
      // Vérifier si le service a une méthode d'enregistrement
      if (typeof service._registerWithApiManager === 'function') {
        try {
          await service._registerWithApiManager(apiManager);
          logger.debug(`Service ${name} enregistré auprès du gestionnaire d'API`);
        } catch (error) {
          logger.warn(`Erreur lors de l'enregistrement du service ${name}: ${error.message}`);
        }
      }
    }
    
    logger.info('Enregistrement des services auprès du gestionnaire d\'API terminé');
  } catch (error) {
    logger.warn(`Erreur lors de l'enregistrement des services: ${error.message}`);
  }
}

/**
 * Obtient un service initialisé par son nom
 * @param {string} serviceName Nom du service
 * @returns {Object|null} Service ou null si non initialisé
 */
function getService(serviceName) {
  return initializedServices.get(serviceName) || null;
}

/**
 * Obtient la liste de tous les services initialisés
 * @returns {Object} Mapping des services
 */
function getAllServices() {
  const services = {};
  initializedServices.forEach((service, name) => {
    services[name] = service;
  });
  return services;
}

/**
 * Vérifie l'état de santé de tous les services
 * @returns {Promise<Object>} État de santé des services
 */
async function checkServicesHealth() {
  const health = {
    status: 'healthy',
    services: {},
    timestamp: new Date().toISOString()
  };
  
  for (const [name, service] of initializedServices.entries()) {
    try {
      if (typeof service.getHealth === 'function') {
        health.services[name] = await service.getHealth();
      } else if (typeof service.getStatus === 'function') {
        health.services[name] = { status: await service.getStatus() };
      } else {
        health.services[name] = { 
          status: serviceStatus.get(name) || 'unknown',
          isMock: service.isMock || false
        };
      }
      
      // Mettre à jour le statut global en fonction du statut du service
      if (health.services[name].status === 'error' || health.services[name].status === 'critical') {
        health.status = 'degraded';
      }
    } catch (error) {
      health.services[name] = { 
        status: 'error', 
        error: error.message,
        isMock: service.isMock || false
      };
      health.status = 'degraded';
    }
  }
  
  return health;
}

module.exports = {
  initializeService,
  initializeAllServices,
  resolveCircularDependencies,
  registerServicesWithApiManager,
  getService,
  getAllServices,
  checkServicesHealth,
  serviceInitOrder,
  serviceDependencies,
  circularDependencies
};
