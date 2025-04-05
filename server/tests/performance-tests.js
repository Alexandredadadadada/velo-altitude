/**
 * Tests de performance pour les services optimisés
 * 
 * Ce script permet de tester les performances des services implémentés
 * pour la scalabilité horizontale, l'optimisation des requêtes OpenAI
 * et la gestion de la mémoire.
 */

const RedisSessionStore = require('../services/redis-session.service');
const TokenShardManager = require('../services/token-shard-manager.service');
const OpenAIQueueManager = require('../services/openai-queue.service');
const EnhancedCache = require('../services/enhanced-cache.service');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

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
  }
};

// Utilitaires
function formatDuration(ms) {
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function generateRandomString(length = 10) {
  return Math.random().toString(36).substring(2, 2 + length);
}

function generateRandomUser() {
  return {
    id: uuidv4(),
    username: `user_${generateRandomString(5)}`,
    email: `${generateRandomString(8)}@example.com`,
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

// Tests
async function runTests() {
  logger.info('Démarrage des tests de performance...');
  
  // Initialiser les services
  const sessionStore = new RedisSessionStore({
    redisOptions: config.redis,
    prefix: 'test:session:',
    ttl: 300, // 5 minutes
    idleTimeout: 60 // 1 minute
  });
  
  const tokenManager = new TokenShardManager({
    shardCount: 4,
    shardOptions: {
      redisOptions: config.redis,
      jwtSecret: config.jwt.secret,
      jwtOptions: config.jwt.options,
      cacheTTL: 60 // 1 minute
    }
  });
  
  const openaiQueue = new OpenAIQueueManager({
    redisOptions: config.redis,
    apiKey: config.openai.apiKey,
    highConcurrency: 2,
    mediumConcurrency: 1,
    lowConcurrency: 1,
    cacheEnabled: true,
    cacheTTL: 300 // 5 minutes
  });
  
  const cache = new EnhancedCache({
    namespace: 'test',
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
  
  try {
    // Test 1: Sessions Redis
    logger.info('Test 1: Sessions Redis');
    await testSessionStore(sessionStore);
    
    // Test 2: Validation de tokens avec sharding
    logger.info('Test 2: Validation de tokens avec sharding');
    await testTokenSharding(tokenManager);
    
    // Test 3: File d'attente OpenAI
    logger.info('Test 3: File d\'attente OpenAI');
    await testOpenAIQueue(openaiQueue);
    
    // Test 4: Cache amélioré
    logger.info('Test 4: Cache amélioré');
    await testEnhancedCache(cache);
    
    // Afficher les statistiques
    logger.info('Tests terminés. Affichage des statistiques...');
    
    const sessionStats = sessionStore.getStats();
    logger.info('Statistiques des sessions:', sessionStats);
    
    const tokenStats = tokenManager.getStats();
    logger.info('Statistiques des tokens:', tokenStats);
    
    const openaiStats = await openaiQueue.getStats();
    logger.info('Statistiques OpenAI:', openaiStats);
    
    const cacheStats = cache.getStats();
    logger.info('Statistiques du cache:', cacheStats);
    
  } catch (err) {
    logger.error('Erreur lors des tests:', err);
  } finally {
    // Fermer les connexions
    await sessionStore.close();
    await tokenManager.close();
    await openaiQueue.close();
    await cache.close();
    
    logger.info('Tests terminés et connexions fermées.');
  }
}

async function testSessionStore(sessionStore) {
  const iterations = 1000;
  const users = Array.from({ length: 100 }, () => generateRandomUser());
  
  logger.info(`Test de création de ${iterations} sessions...`);
  
  const startCreate = Date.now();
  const sessions = [];
  
  for (let i = 0; i < iterations; i++) {
    const user = users[i % users.length];
    const session = {
      userId: user.id,
      username: user.username,
      ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
      userAgent: `Mozilla/5.0 Test ${i}`,
      data: {
        preferences: {
          theme: Math.random() > 0.5 ? 'dark' : 'light',
          language: ['fr', 'en', 'de'][Math.floor(Math.random() * 3)]
        },
        lastActivity: new Date().toISOString()
      }
    };
    
    const sessionId = await sessionStore.set(session);
    sessions.push(sessionId);
  }
  
  const createDuration = Date.now() - startCreate;
  logger.info(`Création de ${iterations} sessions terminée en ${formatDuration(createDuration)} (${(iterations / (createDuration / 1000)).toFixed(2)} sessions/s)`);
  
  // Test de récupération
  logger.info(`Test de récupération de ${iterations} sessions...`);
  
  const startGet = Date.now();
  let hitCount = 0;
  
  for (let i = 0; i < iterations; i++) {
    const sessionId = sessions[i % sessions.length];
    const session = await sessionStore.get(sessionId);
    if (session) hitCount++;
  }
  
  const getDuration = Date.now() - startGet;
  logger.info(`Récupération de ${iterations} sessions terminée en ${formatDuration(getDuration)} (${(iterations / (getDuration / 1000)).toFixed(2)} sessions/s)`);
  logger.info(`Taux de hit: ${((hitCount / iterations) * 100).toFixed(2)}%`);
  
  // Test de suppression
  logger.info(`Test de suppression de ${Math.floor(iterations / 2)} sessions...`);
  
  const startDelete = Date.now();
  let deleteCount = 0;
  
  for (let i = 0; i < Math.floor(iterations / 2); i++) {
    const sessionId = sessions[i];
    const deleted = await sessionStore.delete(sessionId);
    if (deleted) deleteCount++;
  }
  
  const deleteDuration = Date.now() - startDelete;
  logger.info(`Suppression de ${deleteCount} sessions terminée en ${formatDuration(deleteDuration)} (${(deleteCount / (deleteDuration / 1000)).toFixed(2)} sessions/s)`);
}

async function testTokenSharding(tokenManager) {
  const iterations = 1000;
  const users = Array.from({ length: 100 }, () => generateRandomUser());
  const tokens = users.map(user => generateToken(user));
  
  logger.info(`Test de validation de ${iterations} tokens...`);
  
  const startValidate = Date.now();
  let validCount = 0;
  
  for (let i = 0; i < iterations; i++) {
    const token = tokens[i % tokens.length];
    try {
      const payload = await tokenManager.validateToken(token);
      if (payload) validCount++;
    } catch (err) {
      // Ignorer les erreurs
    }
  }
  
  const validateDuration = Date.now() - startValidate;
  logger.info(`Validation de ${iterations} tokens terminée en ${formatDuration(validateDuration)} (${(iterations / (validateDuration / 1000)).toFixed(2)} tokens/s)`);
  logger.info(`Taux de validation: ${((validCount / iterations) * 100).toFixed(2)}%`);
  
  // Test de révocation
  logger.info(`Test de révocation de ${Math.floor(tokens.length / 2)} tokens...`);
  
  const startRevoke = Date.now();
  let revokeCount = 0;
  
  for (let i = 0; i < Math.floor(tokens.length / 2); i++) {
    const token = tokens[i];
    const revoked = await tokenManager.revokeToken(token);
    if (revoked) revokeCount++;
  }
  
  const revokeDuration = Date.now() - startRevoke;
  logger.info(`Révocation de ${revokeCount} tokens terminée en ${formatDuration(revokeDuration)} (${(revokeCount / (revokeDuration / 1000)).toFixed(2)} tokens/s)`);
  
  // Test de validation après révocation
  logger.info(`Test de validation après révocation...`);
  
  const startValidateRevoked = Date.now();
  let invalidCount = 0;
  
  for (let i = 0; i < Math.floor(tokens.length / 2); i++) {
    const token = tokens[i];
    try {
      await tokenManager.validateToken(token);
    } catch (err) {
      invalidCount++;
    }
  }
  
  const validateRevokedDuration = Date.now() - startValidateRevoked;
  logger.info(`Validation après révocation terminée en ${formatDuration(validateRevokedDuration)}`);
  logger.info(`Taux de détection de révocation: ${((invalidCount / Math.floor(tokens.length / 2)) * 100).toFixed(2)}%`);
}

async function testOpenAIQueue(openaiQueue) {
  // Simuler des requêtes OpenAI (sans appel réel à l'API)
  const iterations = 100;
  const priorities = ['high', 'medium', 'low', 'background'];
  
  logger.info(`Test d'ajout de ${iterations} requêtes OpenAI à la file d'attente...`);
  
  const mockOpenAIRequests = Array.from({ length: iterations }, (_, i) => ({
    model: ['gpt-4', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k'][i % 3],
    messages: [
      { role: 'system', content: 'Vous êtes un assistant pour cyclistes.' },
      { role: 'user', content: `Question de test ${i}: ${generateRandomString(20)}` }
    ],
    temperature: 0.7,
    max_tokens: 150
  }));
  
  // Remplacer la méthode _processJob pour éviter les appels réels à l'API
  const originalProcessJob = openaiQueue._processJob;
  openaiQueue._processJob = async (job) => {
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
  
  const startEnqueue = Date.now();
  const jobs = [];
  
  for (let i = 0; i < iterations; i++) {
    const priority = priorities[i % priorities.length];
    const request = mockOpenAIRequests[i];
    
    const job = await openaiQueue.enqueueRequest(request, {
      priority,
      cache: true,
      context: { test: true, iteration: i }
    });
    
    jobs.push({ job, priority });
  }
  
  const enqueueDuration = Date.now() - startEnqueue;
  logger.info(`Ajout de ${iterations} requêtes terminé en ${formatDuration(enqueueDuration)} (${(iterations / (enqueueDuration / 1000)).toFixed(2)} requêtes/s)`);
  
  // Attendre que toutes les requêtes soient traitées
  logger.info('Attente du traitement de toutes les requêtes...');
  
  const startProcessing = Date.now();
  const results = [];
  
  for (const { job, priority } of jobs) {
    try {
      const result = await openaiQueue.waitForCompletion(job.id, priority, 10000);
      results.push(result);
    } catch (err) {
      logger.error(`Erreur lors de l'attente du job ${job.id}:`, err);
    }
  }
  
  const processingDuration = Date.now() - startProcessing;
  logger.info(`Traitement de ${results.length} requêtes terminé en ${formatDuration(processingDuration)} (${(results.length / (processingDuration / 1000)).toFixed(2)} requêtes/s)`);
  
  // Test du cache
  logger.info('Test du cache OpenAI...');
  
  const startCache = Date.now();
  let cacheHits = 0;
  
  for (let i = 0; i < iterations; i++) {
    const priority = priorities[i % priorities.length];
    const request = mockOpenAIRequests[i];
    
    const result = await openaiQueue.enqueueRequest(request, {
      priority,
      cache: true,
      context: { test: true, iteration: i }
    });
    
    if (result.data && result.data.fromCache) {
      cacheHits++;
    }
  }
  
  const cacheDuration = Date.now() - startCache;
  logger.info(`Test du cache terminé en ${formatDuration(cacheDuration)} (${(iterations / (cacheDuration / 1000)).toFixed(2)} requêtes/s)`);
  logger.info(`Taux de hit du cache: ${((cacheHits / iterations) * 100).toFixed(2)}%`);
  
  // Restaurer la méthode originale
  openaiQueue._processJob = originalProcessJob;
}

async function testEnhancedCache(cache) {
  const iterations = 5000;
  const keys = Array.from({ length: 1000 }, (_, i) => `test-key-${i}`);
  const types = ['default', 'sessions', 'routes'];
  
  logger.info(`Test de stockage de ${iterations} éléments dans le cache...`);
  
  const startSet = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    const key = keys[i % keys.length];
    const type = types[i % types.length];
    const size = Math.floor(Math.random() * 3) + 1; // 1, 2 ou 3
    
    // Générer des données de différentes tailles
    let value;
    if (size === 1) {
      // Petit objet
      value = {
        id: i,
        name: `Item ${i}`,
        created: new Date().toISOString()
      };
    } else if (size === 2) {
      // Objet moyen
      value = {
        id: i,
        name: `Item ${i}`,
        description: generateRandomString(100),
        tags: Array.from({ length: 5 }, () => generateRandomString(8)),
        created: new Date().toISOString(),
        metadata: {
          source: 'test',
          version: '1.0',
          attributes: Array.from({ length: 10 }, (_, j) => ({ key: `attr-${j}`, value: generateRandomString(10) }))
        }
      };
    } else {
      // Grand objet (qui sera probablement compressé)
      value = {
        id: i,
        name: `Item ${i}`,
        description: generateRandomString(500),
        content: generateRandomString(2000),
        tags: Array.from({ length: 20 }, () => generateRandomString(8)),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        metadata: {
          source: 'test',
          version: '1.0',
          attributes: Array.from({ length: 50 }, (_, j) => ({ key: `attr-${j}`, value: generateRandomString(20) }))
        },
        sections: Array.from({ length: 5 }, (_, j) => ({
          title: `Section ${j}`,
          content: generateRandomString(500),
          subsections: Array.from({ length: 3 }, (_, k) => ({
            title: `Subsection ${j}-${k}`,
            content: generateRandomString(200)
          }))
        }))
      };
    }
    
    await cache.set(key, value, {
      type,
      ttl: 300, // 5 minutes
      importance: size === 3 ? 'important' : (size === 2 ? 'standard' : 'optional')
    });
  }
  
  const setDuration = Date.now() - startSet;
  logger.info(`Stockage de ${iterations} éléments terminé en ${formatDuration(setDuration)} (${(iterations / (setDuration / 1000)).toFixed(2)} éléments/s)`);
  
  // Test de récupération
  logger.info(`Test de récupération de ${iterations} éléments du cache...`);
  
  const startGet = Date.now();
  let hitCount = 0;
  
  for (let i = 0; i < iterations; i++) {
    const key = keys[i % keys.length];
    const type = types[i % types.length];
    
    const value = await cache.get(key, { type });
    if (value) hitCount++;
  }
  
  const getDuration = Date.now() - startGet;
  logger.info(`Récupération de ${iterations} éléments terminée en ${formatDuration(getDuration)} (${(iterations / (getDuration / 1000)).toFixed(2)} éléments/s)`);
  logger.info(`Taux de hit: ${((hitCount / iterations) * 100).toFixed(2)}%`);
  
  // Test d'éviction
  logger.info('Test d\'éviction proactive...');
  
  // Forcer une éviction proactive
  await cache._runProactiveEviction('aggressive');
  
  // Vérifier combien d'éléments restent
  let remainingCount = 0;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    for (const type of types) {
      const exists = await cache.has(key, { type });
      if (exists) remainingCount++;
    }
  }
  
  logger.info(`Après éviction, ${remainingCount} éléments restent dans le cache`);
  
  // Test de suppression
  logger.info(`Test de suppression de ${Math.floor(keys.length / 2)} éléments...`);
  
  const startDelete = Date.now();
  let deleteCount = 0;
  
  for (let i = 0; i < Math.floor(keys.length / 2); i++) {
    const key = keys[i];
    for (const type of types) {
      const deleted = await cache.delete(key, { type });
      if (deleted) deleteCount++;
    }
  }
  
  const deleteDuration = Date.now() - startDelete;
  logger.info(`Suppression de ${deleteCount} éléments terminée en ${formatDuration(deleteDuration)} (${(deleteCount / (deleteDuration / 1000)).toFixed(2)} éléments/s)`);
}

// Exécuter les tests
runTests().catch(err => {
  logger.error('Erreur lors de l\'exécution des tests:', err);
  process.exit(1);
});
