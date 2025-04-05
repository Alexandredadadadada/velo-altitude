/**
 * Simulation de cluster pour tester la scalabilité horizontale
 * 
 * Ce script simule un environnement de cluster avec plusieurs instances
 * de serveur partageant les mêmes ressources Redis pour la gestion des
 * sessions, la validation des tokens et le cache.
 */

const RedisSessionStore = require('../services/redis-session.service');
const TokenShardManager = require('../services/token-shard-manager.service');
const EnhancedCache = require('../services/enhanced-cache.service');
const OpenAIQueueManager = require('../services/openai-queue.service');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');

// Configuration
const config = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: 0
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'test-secret-key',
    options: {
      expiresIn: '1h',
      issuer: 'dashboard-velo.com'
    }
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || 'sk-test-key'
  },
  simulation: {
    instanceCount: 4, // Nombre d'instances simulées
    usersPerInstance: 250, // Utilisateurs par instance
    requestsPerUser: 10, // Requêtes par utilisateur
    totalDuration: 60000, // Durée totale en ms (1 minute)
    rampUpTime: 10000, // Temps de montée en charge en ms
    reportInterval: 5000 // Intervalle de rapport en ms
  }
};

// Utilitaires
function formatDuration(ms) {
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function generateRandomUser() {
  return {
    id: uuidv4(),
    username: `user_${Math.random().toString(36).substring(2, 8)}`,
    email: `${Math.random().toString(36).substring(2, 10)}@example.com`,
    role: Math.random() > 0.9 ? 'admin' : 'user'
  };
}

function generateToken(user, options = {}) {
  const payload = {
    sub: user.id,
    username: user.username,
    role: user.role,
    jti: uuidv4(),
    type: options.type || 'access',
    v: 1
  };
  
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: options.expiresIn || config.jwt.options.expiresIn,
    issuer: config.jwt.options.issuer
  });
}

// Classe pour simuler une instance de serveur
class ServerInstance {
  constructor(instanceId) {
    this.instanceId = instanceId;
    this.users = [];
    this.stats = {
      sessions: {
        created: 0,
        retrieved: 0,
        updated: 0,
        deleted: 0,
        errors: 0
      },
      tokens: {
        validated: 0,
        rejected: 0,
        revoked: 0,
        errors: 0
      },
      cache: {
        hits: 0,
        misses: 0,
        sets: 0,
        errors: 0
      },
      openai: {
        requests: 0,
        cached: 0,
        errors: 0
      },
      responseTime: {
        total: 0,
        count: 0,
        min: Number.MAX_SAFE_INTEGER,
        max: 0
      }
    };
    
    // Initialiser les services
    this.sessionStore = new RedisSessionStore({
      redisOptions: config.redis,
      prefix: 'cluster:session:',
      ttl: 300, // 5 minutes
      idleTimeout: 60 // 1 minute
    });
    
    this.tokenManager = new TokenShardManager({
      shardCount: 4,
      shardOptions: {
        redisOptions: config.redis,
        jwtSecret: config.jwt.secret,
        jwtOptions: config.jwt.options,
        cacheTTL: 60 // 1 minute
      }
    });
    
    this.cache = new EnhancedCache({
      namespace: `cluster:${instanceId}`,
      redisOptions: config.redis,
      defaultTTL: 300, // 5 minutes
      idleTimeout: 60, // 1 minute
      compressionThreshold: 1024, // 1KB
      limits: {
        default: { maxSize: '10mb', maxItems: 1000 },
        sessions: { maxSize: '5mb', maxItems: 500 },
        routes: { maxSize: '20mb', maxItems: 2000 }
      }
    });
    
    this.openaiQueue = new OpenAIQueueManager({
      redisOptions: config.redis,
      apiKey: config.openai.apiKey,
      highConcurrency: 2,
      mediumConcurrency: 1,
      lowConcurrency: 1,
      cacheEnabled: true,
      cacheTTL: 300 // 5 minutes
    });
    
    // Remplacer la méthode _processJob pour éviter les appels réels à l'API
    this.openaiQueue._processJob = async (job) => {
      const { request } = job.data;
      
      // Simuler un délai de traitement
      const delay = Math.random() * 500 + 100;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Simuler une réponse
      return {
        data: {
          choices: [
            {
              message: {
                role: 'assistant',
                content: `Réponse simulée à: ${request.messages[request.messages.length - 1].content}`
              }
            }
          ],
          usage: {
            prompt_tokens: request.messages.reduce((sum, msg) => sum + msg.content.length / 4, 0),
            completion_tokens: 50,
            total_tokens: request.messages.reduce((sum, msg) => sum + msg.content.length / 4, 0) + 50
          }
        },
        responseTime: delay,
        model: request.model,
        fromCache: false
      };
    };
    
    logger.info(`Instance de serveur ${instanceId} initialisée`);
  }
  
  // Initialiser les utilisateurs
  initUsers(count) {
    this.users = Array.from({ length: count }, () => {
      const user = generateRandomUser();
      const token = generateToken(user);
      return { user, token };
    });
    
    logger.info(`Instance ${this.instanceId}: ${count} utilisateurs initialisés`);
    return this.users;
  }
  
  // Simuler une requête utilisateur
  async simulateUserRequest(userIndex) {
    if (userIndex >= this.users.length) {
      logger.error(`Instance ${this.instanceId}: Utilisateur ${userIndex} non trouvé`);
      return;
    }
    
    const { user, token } = this.users[userIndex];
    const startTime = Date.now();
    
    try {
      // 1. Valider le token
      let tokenPayload;
      try {
        tokenPayload = await this.tokenManager.validateToken(token);
        this.stats.tokens.validated++;
      } catch (err) {
        this.stats.tokens.rejected++;
        this.stats.tokens.errors++;
        logger.error(`Instance ${this.instanceId}: Erreur de validation du token pour l'utilisateur ${user.id}: ${err.message}`);
        return;
      }
      
      // 2. Récupérer ou créer une session
      let sessionId;
      let session;
      
      try {
        // Vérifier si une session existe déjà
        const existingSessions = await this.sessionStore.findByUserId(user.id);
        
        if (existingSessions && existingSessions.length > 0) {
          sessionId = existingSessions[0];
          session = await this.sessionStore.get(sessionId);
          this.stats.sessions.retrieved++;
          
          // Mettre à jour la session
          if (session) {
            session.data.lastActivity = new Date().toISOString();
            await this.sessionStore.update(sessionId, session);
            this.stats.sessions.updated++;
          } else {
            // Session expirée ou supprimée, en créer une nouvelle
            session = {
              userId: user.id,
              username: user.username,
              ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
              userAgent: `Mozilla/5.0 Test ${userIndex}`,
              data: {
                preferences: {
                  theme: Math.random() > 0.5 ? 'dark' : 'light',
                  language: ['fr', 'en', 'de'][Math.floor(Math.random() * 3)]
                },
                lastActivity: new Date().toISOString()
              }
            };
            
            sessionId = await this.sessionStore.set(session);
            this.stats.sessions.created++;
          }
        } else {
          // Créer une nouvelle session
          session = {
            userId: user.id,
            username: user.username,
            ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
            userAgent: `Mozilla/5.0 Test ${userIndex}`,
            data: {
              preferences: {
                theme: Math.random() > 0.5 ? 'dark' : 'light',
                language: ['fr', 'en', 'de'][Math.floor(Math.random() * 3)]
              },
              lastActivity: new Date().toISOString()
            }
          };
          
          sessionId = await this.sessionStore.set(session);
          this.stats.sessions.created++;
        }
      } catch (err) {
        this.stats.sessions.errors++;
        logger.error(`Instance ${this.instanceId}: Erreur de gestion de session pour l'utilisateur ${user.id}: ${err.message}`);
        return;
      }
      
      // 3. Simuler différents types de requêtes
      const requestType = Math.random();
      
      if (requestType < 0.4) {
        // Requête de cache
        await this.simulateCacheRequest(user, sessionId);
      } else if (requestType < 0.7) {
        // Requête OpenAI
        await this.simulateOpenAIRequest(user, sessionId);
      } else {
        // Requête mixte (cache + OpenAI)
        await this.simulateMixedRequest(user, sessionId);
      }
      
      // Mettre à jour les statistiques de temps de réponse
      const responseTime = Date.now() - startTime;
      this.stats.responseTime.total += responseTime;
      this.stats.responseTime.count++;
      this.stats.responseTime.min = Math.min(this.stats.responseTime.min, responseTime);
      this.stats.responseTime.max = Math.max(this.stats.responseTime.max, responseTime);
      
    } catch (err) {
      logger.error(`Instance ${this.instanceId}: Erreur lors de la simulation de requête: ${err.message}`);
    }
  }
  
  // Simuler une requête de cache
  async simulateCacheRequest(user, sessionId) {
    try {
      const cacheKey = `user:${user.id}:data:${Math.floor(Math.random() * 10)}`;
      
      // Vérifier si la donnée est en cache
      const cachedData = await this.cache.get(cacheKey);
      
      if (cachedData) {
        // Hit de cache
        this.stats.cache.hits++;
      } else {
        // Miss de cache, générer et stocker des données
        this.stats.cache.misses++;
        
        const data = {
          userId: user.id,
          sessionId,
          timestamp: Date.now(),
          randomData: Array.from({ length: 10 }, () => Math.random()),
          metadata: {
            source: `instance-${this.instanceId}`,
            generated: new Date().toISOString()
          }
        };
        
        // Stocker dans le cache
        await this.cache.set(cacheKey, data, {
          ttl: 300, // 5 minutes
          importance: 'standard'
        });
        
        this.stats.cache.sets++;
      }
    } catch (err) {
      this.stats.cache.errors++;
      logger.error(`Instance ${this.instanceId}: Erreur de cache: ${err.message}`);
    }
  }
  
  // Simuler une requête OpenAI
  async simulateOpenAIRequest(user, sessionId) {
    try {
      // Générer une requête aléatoire
      const requestId = Math.floor(Math.random() * 20);
      const request = {
        model: ['gpt-4', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k'][Math.floor(Math.random() * 3)],
        messages: [
          { role: 'system', content: 'Vous êtes un assistant pour cyclistes.' },
          { role: 'user', content: `Question ${requestId}: Comment préparer un vélo pour une longue distance?` }
        ],
        temperature: 0.7,
        max_tokens: 150
      };
      
      // Envoyer la requête à la file d'attente
      const result = await this.openaiQueue.enqueueRequest(request, {
        priority: ['high', 'medium', 'low', 'background'][Math.floor(Math.random() * 4)],
        cache: true,
        context: { userId: user.id, sessionId, requestId }
      });
      
      this.stats.openai.requests++;
      
      if (result.data && result.data.fromCache) {
        this.stats.openai.cached++;
      }
    } catch (err) {
      this.stats.openai.errors++;
      logger.error(`Instance ${this.instanceId}: Erreur OpenAI: ${err.message}`);
    }
  }
  
  // Simuler une requête mixte (cache + OpenAI)
  async simulateMixedRequest(user, sessionId) {
    // Simuler une séquence de requêtes qui utilise à la fois le cache et OpenAI
    try {
      // 1. Vérifier les préférences utilisateur dans le cache
      const prefsKey = `user:${user.id}:preferences`;
      let userPrefs = await this.cache.get(prefsKey);
      
      if (!userPrefs) {
        this.stats.cache.misses++;
        
        // Générer des préférences par défaut
        userPrefs = {
          theme: Math.random() > 0.5 ? 'dark' : 'light',
          language: ['fr', 'en', 'de'][Math.floor(Math.random() * 3)],
          difficulty: ['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)],
          units: Math.random() > 0.5 ? 'metric' : 'imperial',
          lastUpdated: new Date().toISOString()
        };
        
        // Stocker dans le cache
        await this.cache.set(prefsKey, userPrefs, {
          ttl: 3600, // 1 heure
          importance: 'important'
        });
        
        this.stats.cache.sets++;
      } else {
        this.stats.cache.hits++;
      }
      
      // 2. Générer une requête OpenAI basée sur les préférences
      const language = userPrefs.language || 'fr';
      const difficulty = userPrefs.difficulty || 'intermediate';
      
      const promptContent = language === 'fr' 
        ? `Donnez des conseils de cyclisme pour un niveau ${difficulty}` 
        : language === 'en'
          ? `Give cycling tips for ${difficulty} level`
          : `Geben Sie Fahrradtipps für ${difficulty} Niveau`;
      
      const request = {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Vous êtes un assistant pour cyclistes.' },
          { role: 'user', content: promptContent }
        ],
        temperature: 0.7,
        max_tokens: 150
      };
      
      // Envoyer la requête à la file d'attente
      const result = await this.openaiQueue.enqueueRequest(request, {
        priority: 'medium',
        cache: true,
        context: { userId: user.id, sessionId, language, difficulty }
      });
      
      this.stats.openai.requests++;
      
      if (result.data && result.data.fromCache) {
        this.stats.openai.cached++;
      }
      
      // 3. Stocker le résultat dans le cache
      if (result.data && !result.data.fromCache) {
        const responseKey = `openai:${language}:${difficulty}:tips`;
        
        await this.cache.set(responseKey, {
          content: result.data.choices[0].message.content,
          model: result.data.model,
          timestamp: new Date().toISOString()
        }, {
          ttl: 86400, // 24 heures
          importance: 'standard'
        });
        
        this.stats.cache.sets++;
      }
      
    } catch (err) {
      this.stats.cache.errors++;
      this.stats.openai.errors++;
      logger.error(`Instance ${this.instanceId}: Erreur de requête mixte: ${err.message}`);
    }
  }
  
  // Obtenir les statistiques
  getStats() {
    // Calculer les moyennes
    const avgResponseTime = this.stats.responseTime.count > 0 
      ? this.stats.responseTime.total / this.stats.responseTime.count 
      : 0;
    
    return {
      instanceId: this.instanceId,
      sessions: { ...this.stats.sessions },
      tokens: { ...this.stats.tokens },
      cache: { ...this.stats.cache },
      openai: { ...this.stats.openai },
      responseTime: {
        ...this.stats.responseTime,
        avg: avgResponseTime
      }
    };
  }
  
  // Fermer les connexions
  async close() {
    await this.sessionStore.close();
    await this.tokenManager.close();
    await this.cache.close();
    await this.openaiQueue.close();
    
    logger.info(`Instance ${this.instanceId} fermée`);
  }
}

// Code pour le thread principal
if (isMainThread) {
  // Fonction principale
  async function runClusterSimulation() {
    logger.info('Démarrage de la simulation de cluster...');
    logger.info(`Configuration: ${config.simulation.instanceCount} instances, ${config.simulation.usersPerInstance} utilisateurs par instance`);
    
    const workers = [];
    const startTime = Date.now();
    let running = true;
    
    // Créer les workers pour chaque instance
    for (let i = 0; i < config.simulation.instanceCount; i++) {
      const worker = new Worker(__filename, {
        workerData: {
          instanceId: i,
          usersPerInstance: config.simulation.usersPerInstance,
          requestsPerUser: config.simulation.requestsPerUser,
          totalDuration: config.simulation.totalDuration,
          rampUpTime: config.simulation.rampUpTime
        }
      });
      
      worker.on('message', (message) => {
        if (message.type === 'stats') {
          displayInstanceStats(message.data);
        } else if (message.type === 'complete') {
          logger.info(`Instance ${message.instanceId} a terminé sa simulation`);
        }
      });
      
      worker.on('error', (err) => {
        logger.error(`Erreur dans l'instance ${i}:`, err);
      });
      
      worker.on('exit', (code) => {
        logger.info(`Instance ${i} terminée avec le code: ${code}`);
        
        // Vérifier si toutes les instances ont terminé
        if (workers.every(w => w.threadId && !w.isRunning)) {
          if (running) {
            running = false;
            const endTime = Date.now();
            logger.info(`Simulation terminée en ${formatDuration(endTime - startTime)}`);
            displayFinalStats();
          }
        }
      });
      
      workers.push(worker);
      logger.info(`Instance ${i} démarrée`);
    }
    
    // Configurer l'intervalle de rapport
    const reportInterval = setInterval(() => {
      logger.info(`Simulation en cours depuis ${formatDuration(Date.now() - startTime)}...`);
      
      // Demander les statistiques à chaque worker
      workers.forEach(worker => {
        worker.postMessage({ type: 'getStats' });
      });
    }, config.simulation.reportInterval);
    
    // Attendre la fin de la simulation
    await new Promise(resolve => {
      setTimeout(() => {
        clearInterval(reportInterval);
        
        // Arrêter toutes les instances
        workers.forEach(worker => {
          worker.postMessage({ type: 'stop' });
        });
        
        // Attendre que tous les workers se terminent
        let checkInterval = setInterval(() => {
          if (workers.every(w => !w.threadId)) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 500);
        
        // Timeout de sécurité
        setTimeout(() => {
          clearInterval(checkInterval);
          workers.forEach(w => {
            if (w.threadId) {
              w.terminate();
            }
          });
          resolve();
        }, 10000);
      }, config.simulation.totalDuration);
    });
    
    logger.info('Simulation terminée');
  }
  
  // Afficher les statistiques d'une instance
  function displayInstanceStats(stats) {
    logger.info(`Instance ${stats.instanceId} - Statistiques:`);
    logger.info(`  Sessions: ${stats.sessions.created} créées, ${stats.sessions.retrieved} récupérées, ${stats.sessions.errors} erreurs`);
    logger.info(`  Tokens: ${stats.tokens.validated} validés, ${stats.tokens.rejected} rejetés, ${stats.tokens.errors} erreurs`);
    logger.info(`  Cache: ${stats.cache.hits} hits, ${stats.cache.misses} misses, ${stats.cache.sets} sets, ${stats.cache.errors} erreurs`);
    logger.info(`  OpenAI: ${stats.openai.requests} requêtes, ${stats.openai.cached} cachées, ${stats.openai.errors} erreurs`);
    logger.info(`  Temps de réponse: ${stats.responseTime.avg.toFixed(2)}ms en moyenne (min: ${stats.responseTime.min}ms, max: ${stats.responseTime.max}ms)`);
  }
  
  // Afficher les statistiques finales
  function displayFinalStats() {
    logger.info('========== RÉSULTATS DE LA SIMULATION ==========');
    logger.info(`${config.simulation.instanceCount} instances, ${config.simulation.usersPerInstance} utilisateurs par instance`);
    logger.info(`Durée totale: ${formatDuration(config.simulation.totalDuration)}`);
    logger.info('===============================================');
  }
  
  // Exécuter la simulation
  runClusterSimulation().catch(err => {
    logger.error('Erreur lors de la simulation:', err);
    process.exit(1);
  });
} 
// Code pour les threads de travail
else {
  const { instanceId, usersPerInstance, requestsPerUser, totalDuration, rampUpTime } = workerData;
  
  // Fonction pour exécuter la simulation d'instance
  async function runInstanceSimulation() {
    // Créer l'instance
    const instance = new ServerInstance(instanceId);
    
    // Initialiser les utilisateurs
    instance.initUsers(usersPerInstance);
    
    // Démarrer les requêtes
    let running = true;
    let requestCount = 0;
    const startTime = Date.now();
    
    // Fonction pour envoyer des statistiques au thread principal
    function sendStats() {
      if (running) {
        parentPort.postMessage({
          type: 'stats',
          data: instance.getStats()
        });
      }
    }
    
    // Configurer l'intervalle de rapport
    const statsInterval = setInterval(sendStats, 5000);
    
    // Gérer les messages du thread principal
    parentPort.on('message', async (message) => {
      if (message.type === 'getStats') {
        sendStats();
      } else if (message.type === 'stop') {
        running = false;
        clearInterval(statsInterval);
        
        // Fermer l'instance
        await instance.close();
        
        // Informer le thread principal que nous avons terminé
        parentPort.postMessage({
          type: 'complete',
          instanceId
        });
        
        // Terminer le worker
        setTimeout(() => {
          process.exit(0);
        }, 1000);
      }
    });
    
    // Simuler les requêtes utilisateur
    while (running && (Date.now() - startTime) < totalDuration) {
      // Calculer le nombre d'utilisateurs actifs en fonction du temps écoulé (montée en charge)
      const elapsed = Date.now() - startTime;
      const rampUpFactor = Math.min(1, elapsed / rampUpTime);
      const activeUsers = Math.floor(usersPerInstance * rampUpFactor);
      
      if (activeUsers > 0) {
        // Sélectionner un utilisateur aléatoire
        const userIndex = Math.floor(Math.random() * activeUsers);
        
        // Simuler une requête
        await instance.simulateUserRequest(userIndex);
        requestCount++;
        
        // Petite pause pour éviter de surcharger le CPU
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    // Envoyer les statistiques finales
    sendStats();
    
    // Informer le thread principal que nous avons terminé
    parentPort.postMessage({
      type: 'complete',
      instanceId
    });
    
    // Fermer l'instance
    await instance.close();
    
    logger.info(`Instance ${instanceId}: Simulation terminée, ${requestCount} requêtes traitées`);
  }
  
  // Exécuter la simulation d'instance
  runInstanceSimulation().catch(err => {
    logger.error(`Instance ${instanceId}: Erreur lors de la simulation:`, err);
    process.exit(1);
  });
}
