/**
 * Configuration avancée pour Redis Cluster
 * Implémente le sharding des données pour Dashboard-Velo
 * Optimisé pour les environnements de production à haute charge
 */

const Redis = require('ioredis');
const logger = require('../utils/logger');
const baseConfig = require('./redis');

// Configuration de connexion pour les différents nœuds du cluster
const clusterNodes = process.env.REDIS_CLUSTER_NODES 
  ? process.env.REDIS_CLUSTER_NODES.split(',').map(node => {
      const [host, port] = node.split(':');
      return { host, port: parseInt(port) };
    })
  : [
      { host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT || '6379') },
      { host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT || '6380') },
      { host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT || '6381') }
    ];

// Configuration optimisée de l'algorithme de hashing pour le sharding
const clusterOptions = {
  // Redirection max des requêtes dans le cluster
  maxRedirections: 16,
  
  // Options de retry spécifiques au cluster
  retryDelayOnFailover: 100,
  retryDelayOnClusterDown: 100,
  retryDelayOnTryAgain: 100,
  
  // Activer la mise en cache des emplacements de slots pour des performances optimales
  enableOfflineQueue: true,
  enableReadyCheck: true,
  scaleReads: 'slave', // Lire depuis les réplicas si disponibles
  
  // Stratégie de distribution des clés avancée
  // Utilise un algorithme de hachage cohérent pour minimiser les redistributions lors des changements de topologie
  natMap: baseConfig.cluster.natMap,
  
  // Option pour le connection pool
  poolSize: 20,
  
  // Logs spécifiques pour le cluster
  showFriendlyErrorStack: process.env.NODE_ENV !== 'production'
};

/**
 * Création d'une instance de Redis Cluster avec gestion avancée des erreurs
 * @param {Object} options Options additionnelles de configuration
 * @returns {Redis.Cluster} Instance de cluster Redis
 */
function createCluster(options = {}) {
  const combinedOptions = { ...clusterOptions, ...options };
  
  // Créer le client cluster
  const cluster = new Redis.Cluster(clusterNodes, combinedOptions);
  
  // Logs pour le monitoring
  cluster.on('connect', () => {
    logger.info('Redis Cluster connected successfully', { service: 'redisCluster' });
  });
  
  cluster.on('error', (err) => {
    logger.error(`Redis Cluster error: ${err.message}`, { 
      service: 'redisCluster',
      stack: err.stack
    });
  });
  
  cluster.on('node error', (err, node) => {
    logger.error(`Redis Cluster node error on ${node.options.host}:${node.options.port}: ${err.message}`, {
      service: 'redisCluster',
      nodeHost: node.options.host,
      nodePort: node.options.port,
      stack: err.stack
    });
  });
  
  // Détecter les changements de topologie du cluster pour le monitoring
  cluster.on('+node', (node) => {
    logger.info(`Redis Cluster: New node added ${node.options.host}:${node.options.port}`, {
      service: 'redisCluster',
      nodeHost: node.options.host,
      nodePort: node.options.port
    });
  });
  
  cluster.on('-node', (node) => {
    logger.info(`Redis Cluster: Node removed ${node.options.host}:${node.options.port}`, {
      service: 'redisCluster',
      nodeHost: node.options.host,
      nodePort: node.options.port
    });
  });
  
  return cluster;
}

// Configurer les clients de cluster spécialisés par domaine fonctionnel
// Cette approche permet un sharding optimisé par type de données
const nutritionCluster = createCluster({
  keyPrefix: 'nutrition:',
  // Configuration spécifique pour les données nutritionnelles - priorité à la cohérence
  // Ces options favorisent la cohérence des données lors des calculs nutritionnels
  readOnly: false,
  retryStrategy: (times) => Math.min(times * 100, 3000)
});

const weatherCluster = createCluster({
  keyPrefix: 'weather:',
  // Configuration spécifique pour les données météo - priorité à la disponibilité
  // Ces options favorisent la disponibilité des données météo, même si légèrement obsolètes
  readOnly: true, // Mode lecture seule pour la météo (données souvent en lecture)
  scaleReads: 'all', // Distribuer les lectures sur tous les nœuds
  retryStrategy: (times) => Math.min(times * 50, 1000)
});

const explorerCluster = createCluster({
  keyPrefix: 'explorer:',
  // Configuration pour l'explorateur de cols - priorité aux performances
  // Ces options optimisent la vitesse de réponse pour l'explorateur
  readOnly: false,
  scaleReads: 'master', // Lectures depuis le master pour données cohérentes
  retryStrategy: (times) => Math.min(times * 150, 2000)
});

const authCluster = createCluster({
  keyPrefix: 'auth:', 
  // Configuration pour l'authentification - priorité à la sécurité
  // Ces options assurent la haute disponibilité des données d'authentification
  readOnly: false, // Écriture nécessaire pour les sessions
  retryStrategy: (times) => Math.min(times * 20, 500) // Retry rapide
});

// Stratégie de distribution des clés pour optimiser le sharding
const shardingStrategies = {
  // Stratégie pour les données utilisateur - par ID utilisateur
  userDataStrategy: (userId) => {
    // Utiliser l'ID utilisateur comme base pour le sharding
    // Garantit que toutes les données d'un même utilisateur sont sur le même shard
    return `user:${userId}`;
  },
  
  // Stratégie pour les données météo - par localisation géographique
  weatherDataStrategy: (latitude, longitude, precision = 1) => {
    // Utiliser le quadrant géographique pour distribuer les données météo
    // Regroupe les données par proximité géographique pour un meilleur caching
    const lat = parseFloat(latitude).toFixed(precision);
    const lng = parseFloat(longitude).toFixed(precision);
    return `geo:${lat}:${lng}`;
  },
  
  // Stratégie pour les données nutritionnelles - par type et catégorie
  nutritionDataStrategy: (type, category) => {
    // Distribution par type et catégorie pour optimiser les lookups
    return `nutrition:${type}:${category}`;
  }
};

module.exports = {
  nutritionCluster,
  weatherCluster,
  explorerCluster,
  authCluster,
  shardingStrategies,
  createCluster
};
