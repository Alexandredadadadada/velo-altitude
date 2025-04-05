/**
 * Configuration Redis pour le système de cache Dashboard-Velo
 * Utilisé par les services de cache pour optimiser les performances
 */

const config = {
  // Paramètres de connexion Redis
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || '',
  
  // Timeout en ms pour les connexions Redis
  connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000'),
  
  // Bases de données Redis pour différents contextes
  // Utilisation de bases distinctes pour isoler les données
  nutritionDb: 0,
  weatherDb: 1,
  authDb: 2,
  generalDb: 3,
  explorerDb: 4,
  
  // Options d'expiration des clés par défaut (en secondes)
  defaultTTL: {
    short: 60, // 1 minute
    medium: 60 * 15, // 15 minutes
    long: 60 * 60 * 3, // 3 heures
    day: 60 * 60 * 24, // 1 jour
    week: 60 * 60 * 24 * 7, // 7 jours
  },
  
  // Options de reconnexion
  retryStrategy: {
    maxAttempts: 10,
    initialDelay: 100, // ms
    maxDelay: 3000, // ms
  },
  
  // Taille maximale du cache pour éviter les problèmes de mémoire
  maxMemoryPolicy: 'allkeys-lru', // Least Recently Used
  maxMemoryMB: 256, // Limite de 256 MB
  
  // Options avancées de performance
  enableReadyCheck: true,
  enableOfflineQueue: true,
  
  // Options de cluster - à activer en production
  cluster: {
    enabled: process.env.REDIS_CLUSTER_ENABLED === 'true',
    nodes: process.env.REDIS_CLUSTER_NODES 
      ? process.env.REDIS_CLUSTER_NODES.split(',').map(node => {
          const [host, port] = node.split(':');
          return { host, port: parseInt(port) };
        })
      : [{ host: 'localhost', port: 6379 }]
  }
};

module.exports = config;
