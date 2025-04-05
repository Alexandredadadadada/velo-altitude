/**
 * Service de file d'attente pour les requêtes OpenAI
 * 
 * Ce service implémente un système de file d'attente avec priorités pour les requêtes OpenAI,
 * permettant une meilleure gestion des ressources et une optimisation des performances.
 * 
 * @module services/openai-queue
 */

const { Queue, Worker, QueueScheduler } = require('bullmq');
const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const config = require('../config');
const { OpenAIApi, Configuration } = require('openai');

/**
 * Classe gérant la file d'attente des requêtes OpenAI
 */
class OpenAIQueueManager {
  /**
   * Crée une nouvelle instance du gestionnaire de file d'attente
   * @param {Object} options - Options de configuration
   * @param {Object} options.redisOptions - Options de connexion Redis
   * @param {number} options.highConcurrency - Concurrence pour la file haute priorité (défaut: 5)
   * @param {number} options.mediumConcurrency - Concurrence pour la file priorité moyenne (défaut: 3)
   * @param {number} options.lowConcurrency - Concurrence pour la file basse priorité (défaut: 1)
   * @param {string} options.apiKey - Clé API OpenAI (défaut: depuis config)
   */
  constructor(options = {}) {
    this.options = {
      redisOptions: options.redisOptions || {
        host: config.redis.host || 'localhost',
        port: config.redis.port || 6379,
        password: config.redis.password,
        db: config.redis.db || 0,
        maxRetriesPerRequest: 3
      },
      highConcurrency: options.highConcurrency || 5,
      mediumConcurrency: options.mediumConcurrency || 3,
      lowConcurrency: options.lowConcurrency || 1,
      apiKey: options.apiKey || config.openai.apiKey,
      organization: options.organization || config.openai.organization,
      modelSelectionStrategy: options.modelSelectionStrategy || this._defaultModelSelection,
      cacheEnabled: options.cacheEnabled !== false,
      cacheTTL: options.cacheTTL || 3600, // 1 heure par défaut
      defaultTimeout: options.defaultTimeout || 60000, // 60 secondes par défaut
      maxRetries: options.maxRetries || 3
    };

    // Connexion Redis pour les files d'attente
    this.connection = new Redis(this.options.redisOptions);
    
    // Connexion Redis pour le cache
    this.cacheConnection = new Redis({
      ...this.options.redisOptions,
      keyPrefix: 'openai:cache:'
    });

    // Initialiser les files d'attente avec différentes priorités
    this.queues = {
      high: new Queue('openai-high', { connection: this.connection }),
      medium: new Queue('openai-medium', { connection: this.connection }),
      low: new Queue('openai-low', { connection: this.connection }),
      background: new Queue('openai-background', { connection: this.connection })
    };
    
    // Initialiser les schedulers pour la gestion des délais et retries
    this.schedulers = {
      high: new QueueScheduler('openai-high', { connection: this.connection }),
      medium: new QueueScheduler('openai-medium', { connection: this.connection }),
      low: new QueueScheduler('openai-low', { connection: this.connection }),
      background: new QueueScheduler('openai-background', { connection: this.connection })
    };
    
    // Initialiser l'API OpenAI
    const configuration = new Configuration({
      apiKey: this.options.apiKey,
      organization: this.options.organization
    });
    this.openai = new OpenAIApi(configuration);
    
    // Initialiser les workers avec concurrence limitée
    this._initializeWorkers();

    // Statistiques
    this.stats = {
      enqueued: { high: 0, medium: 0, low: 0, background: 0 },
      completed: { high: 0, medium: 0, low: 0, background: 0 },
      failed: { high: 0, medium: 0, low: 0, background: 0 },
      retried: { high: 0, medium: 0, low: 0, background: 0 },
      cacheHits: 0,
      cacheMisses: 0,
      tokensUsed: { prompt: 0, completion: 0, total: 0 },
      responseTime: { sum: 0, count: 0 }
    };

    logger.info(`OpenAIQueueManager initialisé avec concurrences H:${this.options.highConcurrency}/M:${this.options.mediumConcurrency}/L:${this.options.lowConcurrency}`);
  }

  /**
   * Initialise les workers pour chaque file d'attente
   * @private
   */
  _initializeWorkers() {
    this.workers = {
      high: new Worker('openai-high', this._processJob.bind(this), { 
        connection: this.connection,
        concurrency: this.options.highConcurrency,
        lockDuration: 90000 // 90 secondes
      }),
      
      medium: new Worker('openai-medium', this._processJob.bind(this), { 
        connection: this.connection,
        concurrency: this.options.mediumConcurrency,
        lockDuration: 120000 // 120 secondes
      }),
      
      low: new Worker('openai-low', this._processJob.bind(this), { 
        connection: this.connection,
        concurrency: this.options.lowConcurrency,
        lockDuration: 180000 // 180 secondes
      }),
      
      background: new Worker('openai-background', this._processJob.bind(this), { 
        connection: this.connection,
        concurrency: this.options.lowConcurrency,
        lockDuration: 300000 // 300 secondes
      })
    };

    // Configurer les écouteurs d'événements pour chaque worker
    Object.entries(this.workers).forEach(([priority, worker]) => {
      worker.on('completed', (job) => {
        this.stats.completed[priority]++;
        logger.debug(`Job OpenAI ${job.id} (${priority}) complété`);
      });

      worker.on('failed', (job, err) => {
        this.stats.failed[priority]++;
        logger.error(`Job OpenAI ${job?.id} (${priority}) échoué: ${err.message}`, err);
      });

      worker.on('error', (err) => {
        logger.error(`Erreur dans le worker OpenAI (${priority}): ${err.message}`, err);
      });

      worker.on('stalled', (jobId) => {
        logger.warn(`Job OpenAI ${jobId} (${priority}) bloqué, repris par un autre worker`);
      });
    });
  }

  /**
   * Sélection de modèle par défaut basée sur la complexité
   * @param {Object} request - Requête OpenAI
   * @returns {string} Nom du modèle à utiliser
   * @private
   */
  _defaultModelSelection(request) {
    // Si un modèle est explicitement spécifié, l'utiliser
    if (request.model) return request.model;

    // Estimer la complexité de la requête
    let complexity = 'medium';
    
    // Analyser le type de requête
    if (request.messages) {
      // Pour les requêtes de chat
      const totalTokens = request.messages.reduce((sum, msg) => {
        // Estimation grossière: 1 token ≈ 4 caractères
        return sum + (msg.content?.length || 0) / 4;
      }, 0);
      
      if (totalTokens > 2000) {
        complexity = 'high';
      } else if (totalTokens < 500) {
        complexity = 'low';
      }
    } else if (request.prompt) {
      // Pour les requêtes de completion
      const promptLength = typeof request.prompt === 'string' 
        ? request.prompt.length 
        : request.prompt.reduce((sum, p) => sum + p.length, 0);
      
      if (promptLength > 2000) {
        complexity = 'high';
      } else if (promptLength < 500) {
        complexity = 'low';
      }
    }
    
    // Sélectionner le modèle en fonction de la complexité
    switch (complexity) {
      case 'high':
        return 'gpt-4';
      case 'medium':
        return 'gpt-3.5-turbo-16k';
      case 'low':
        return 'gpt-3.5-turbo';
      default:
        return 'gpt-3.5-turbo';
    }
  }

  /**
   * Génère une clé de cache pour une requête OpenAI
   * @param {Object} request - Requête OpenAI
   * @returns {string} Clé de cache
   * @private
   */
  _generateCacheKey(request) {
    // Créer une version normalisée de la requête pour le hachage
    const normalizedRequest = {
      ...request,
      // Exclure les paramètres qui ne devraient pas affecter le résultat
      stream: undefined,
      user: undefined
    };
    
    // Générer un hash SHA-256 de la requête normalisée
    const requestString = JSON.stringify(normalizedRequest);
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(requestString).digest('hex');
  }

  /**
   * Vérifie si une réponse est en cache pour une requête donnée
   * @param {Object} request - Requête OpenAI
   * @returns {Promise<Object|null>} Réponse en cache ou null si non trouvée
   * @private
   */
  async _checkCache(request) {
    if (!this.options.cacheEnabled) return null;
    
    try {
      const cacheKey = this._generateCacheKey(request);
      const cachedData = await this.cacheConnection.get(cacheKey);
      
      if (cachedData) {
        this.stats.cacheHits++;
        return JSON.parse(cachedData);
      }
      
      this.stats.cacheMisses++;
      return null;
    } catch (err) {
      logger.error(`Erreur lors de la vérification du cache: ${err.message}`, err);
      return null;
    }
  }

  /**
   * Stocke une réponse dans le cache
   * @param {Object} request - Requête OpenAI
   * @param {Object} response - Réponse OpenAI
   * @param {number} ttl - Durée de vie en secondes (défaut: options.cacheTTL)
   * @returns {Promise<boolean>} true si mise en cache réussie
   * @private
   */
  async _storeInCache(request, response, ttl) {
    if (!this.options.cacheEnabled) return false;
    
    try {
      const cacheKey = this._generateCacheKey(request);
      const ttlValue = ttl || this.options.cacheTTL;
      
      await this.cacheConnection.set(
        cacheKey,
        JSON.stringify(response),
        'EX',
        ttlValue
      );
      
      return true;
    } catch (err) {
      logger.error(`Erreur lors du stockage dans le cache: ${err.message}`, err);
      return false;
    }
  }

  /**
   * Traite un job de la file d'attente
   * @param {Object} job - Job BullMQ
   * @returns {Promise<Object>} Résultat du traitement
   * @private
   */
  async _processJob(job) {
    const { request, options } = job.data;
    const startTime = Date.now();
    
    try {
      // Vérifier si la réponse est en cache
      const cachedResponse = await this._checkCache(request);
      if (cachedResponse) {
        logger.debug(`Réponse trouvée en cache pour le job ${job.id}`);
        return {
          ...cachedResponse,
          fromCache: true
        };
      }
      
      // Sélectionner le modèle approprié si non spécifié
      if (!request.model) {
        request.model = this.options.modelSelectionStrategy(request);
      }
      
      // Traiter la requête OpenAI en fonction de son type
      let response;
      if (request.messages) {
        // Requête de chat
        response = await this.openai.createChatCompletion(request);
      } else if (request.prompt) {
        // Requête de completion
        response = await this.openai.createCompletion(request);
      } else if (request.input) {
        // Requête d'embedding
        response = await this.openai.createEmbedding(request);
      } else {
        throw new Error('Type de requête OpenAI non supporté');
      }
      
      // Mettre à jour les statistiques
      const responseTime = Date.now() - startTime;
      this.stats.responseTime.sum += responseTime;
      this.stats.responseTime.count++;
      
      // Mettre à jour les statistiques de tokens si disponibles
      if (response.data.usage) {
        this.stats.tokensUsed.prompt += response.data.usage.prompt_tokens || 0;
        this.stats.tokensUsed.completion += response.data.usage.completion_tokens || 0;
        this.stats.tokensUsed.total += response.data.usage.total_tokens || 0;
      }
      
      // Stocker la réponse dans le cache si applicable
      if (!request.stream && options.cache !== false) {
        await this._storeInCache(request, response.data, options.cacheTTL);
      }
      
      return {
        data: response.data,
        responseTime,
        model: request.model,
        fromCache: false
      };
    } catch (err) {
      // Enrichir l'erreur avec des informations contextuelles
      const enhancedError = {
        message: err.message,
        code: err.response?.status,
        data: err.response?.data,
        request: {
          model: request.model,
          type: request.messages ? 'chat' : request.prompt ? 'completion' : 'other'
        }
      };
      
      logger.error(`Erreur OpenAI pour le job ${job.id}: ${err.message}`, enhancedError);
      throw enhancedError;
    }
  }

  /**
   * Ajoute une requête OpenAI à la file d'attente
   * @param {Object} request - Requête OpenAI (format API OpenAI)
   * @param {Object} options - Options de file d'attente
   * @param {string} options.priority - Priorité ('high', 'medium', 'low', 'background')
   * @param {boolean} options.cache - Activer/désactiver le cache pour cette requête
   * @param {number} options.cacheTTL - Durée de vie spécifique pour le cache
   * @param {Object} options.context - Informations contextuelles pour le logging
   * @returns {Promise<Object>} Job ajouté à la file d'attente
   */
  async enqueueRequest(request, options = {}) {
    const priority = options.priority || 'medium';
    
    if (!this.queues[priority]) {
      throw new Error(`Priorité invalide: ${priority}`);
    }
    
    // Générer un ID unique pour le job
    const jobId = options.jobId || `openai-${uuidv4()}`;
    
    // Vérifier si la réponse est en cache (si le cache est activé)
    if (this.options.cacheEnabled && options.cache !== false && !request.stream) {
      const cachedResponse = await this._checkCache(request);
      if (cachedResponse) {
        logger.debug(`Réponse trouvée en cache pour la requête ${jobId}`);
        return {
          id: jobId,
          data: {
            ...cachedResponse,
            fromCache: true
          }
        };
      }
    }
    
    // Déterminer le timeout en fonction de la priorité
    const timeout = options.timeout || this._getTimeoutForPriority(priority);
    
    // Ajouter à la file d'attente
    const job = await this.queues[priority].add('openai-request', {
      request,
      options: {
        cache: options.cache,
        cacheTTL: options.cacheTTL,
        context: options.context
      }
    }, {
      jobId,
      attempts: options.attempts || this.options.maxRetries,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      timeout,
      removeOnComplete: true,
      removeOnFail: false
    });
    
    // Mettre à jour les statistiques
    this.stats.enqueued[priority]++;
    
    logger.debug(`Requête OpenAI ${jobId} ajoutée à la file ${priority}`);
    
    return job;
  }

  /**
   * Obtient le timeout approprié pour une priorité
   * @param {string} priority - Priorité
   * @returns {number} Timeout en millisecondes
   * @private
   */
  _getTimeoutForPriority(priority) {
    switch (priority) {
      case 'high': return 30000; // 30 secondes
      case 'medium': return 60000; // 60 secondes
      case 'low': return 120000; // 120 secondes
      case 'background': return 300000; // 5 minutes
      default: return this.options.defaultTimeout;
    }
  }

  /**
   * Attend la fin d'un job
   * @param {string} jobId - ID du job
   * @param {string} priority - Priorité du job
   * @param {number} timeout - Timeout en millisecondes
   * @returns {Promise<Object>} Résultat du job
   */
  async waitForCompletion(jobId, priority = 'medium', timeout = 60000) {
    if (!this.queues[priority]) {
      throw new Error(`Priorité invalide: ${priority}`);
    }
    
    // Récupérer le job
    const job = await this.queues[priority].getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} non trouvé dans la file ${priority}`);
    }
    
    // Attendre la fin du job avec timeout
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout en attendant le job ${jobId}`));
      }, timeout);
      
      job.waitUntilFinished(this.queues[priority].events).then(result => {
        clearTimeout(timeoutId);
        resolve(result);
      }).catch(err => {
        clearTimeout(timeoutId);
        reject(err);
      });
    });
  }

  /**
   * Optimise un prompt avant envoi à OpenAI
   * @param {string|Array<string>} prompt - Prompt à optimiser
   * @returns {string|Array<string>} Prompt optimisé
   */
  optimizePrompt(prompt) {
    // Si c'est un tableau, optimiser chaque élément
    if (Array.isArray(prompt)) {
      return prompt.map(p => this.optimizePrompt(p));
    }
    
    // Si c'est une chaîne, appliquer les optimisations
    if (typeof prompt === 'string') {
      let optimized = prompt;
      
      // Supprimer les espaces et lignes vides excessifs
      optimized = optimized.replace(/\n{3,}/g, '\n\n');
      optimized = optimized.replace(/[ \t]+\n/g, '\n');
      
      // Supprimer les répétitions d'instructions
      // (Implémentation simplifiée, une version plus avancée utiliserait NLP)
      
      return optimized;
    }
    
    // Si ce n'est ni un tableau ni une chaîne, retourner tel quel
    return prompt;
  }

  /**
   * Optimise les messages de chat avant envoi à OpenAI
   * @param {Array<Object>} messages - Messages à optimiser
   * @returns {Array<Object>} Messages optimisés
   */
  optimizeChatMessages(messages) {
    if (!Array.isArray(messages)) return messages;
    
    return messages.map(msg => {
      if (msg.content && typeof msg.content === 'string') {
        return {
          ...msg,
          content: this.optimizePrompt(msg.content)
        };
      }
      return msg;
    });
  }

  /**
   * Récupère les statistiques du gestionnaire de file d'attente
   * @returns {Promise<Object>} Statistiques détaillées
   */
  async getStats() {
    // Récupérer les statistiques des files d'attente
    const queueStats = await Promise.all(
      Object.entries(this.queues).map(async ([priority, queue]) => {
        const counts = await queue.getJobCounts();
        return {
          priority,
          waiting: counts.waiting,
          active: counts.active,
          completed: counts.completed,
          failed: counts.failed,
          delayed: counts.delayed,
          total: Object.values(counts).reduce((sum, count) => sum + count, 0)
        };
      })
    );
    
    // Calculer le temps de réponse moyen
    const avgResponseTime = this.stats.responseTime.count > 0
      ? this.stats.responseTime.sum / this.stats.responseTime.count
      : 0;
    
    // Calculer le taux de hit du cache
    const totalCacheRequests = this.stats.cacheHits + this.stats.cacheMisses;
    const cacheHitRatio = totalCacheRequests > 0
      ? this.stats.cacheHits / totalCacheRequests
      : 0;
    
    return {
      queues: queueStats,
      enqueued: this.stats.enqueued,
      completed: this.stats.completed,
      failed: this.stats.failed,
      retried: this.stats.retried,
      cache: {
        hits: this.stats.cacheHits,
        misses: this.stats.cacheMisses,
        hitRatio: cacheHitRatio
      },
      tokens: this.stats.tokensUsed,
      performance: {
        avgResponseTime,
        totalRequests: this.stats.responseTime.count
      }
    };
  }

  /**
   * Vérifie la santé du service
   * @returns {Promise<Object>} État de santé
   */
  async healthCheck() {
    try {
      // Vérifier la connexion Redis
      const isRedisConnected = this.connection.status === 'ready';
      
      // Vérifier la connexion OpenAI avec une requête minimale
      let openaiStatus = 'unknown';
      try {
        await this.openai.listModels();
        openaiStatus = 'ready';
      } catch (err) {
        openaiStatus = 'error';
      }
      
      // Vérifier l'état des workers
      const workersStatus = Object.entries(this.workers).map(([priority, worker]) => ({
        priority,
        running: worker.isRunning()
      }));
      
      const allWorkersRunning = workersStatus.every(w => w.running);
      
      return {
        healthy: isRedisConnected && openaiStatus === 'ready' && allWorkersRunning,
        redis: isRedisConnected ? 'ready' : 'error',
        openai: openaiStatus,
        workers: workersStatus,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      logger.error(`Erreur lors du health check: ${err.message}`, err);
      return {
        healthy: false,
        error: err.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Ferme les connexions et nettoie les ressources
   */
  async close() {
    // Arrêter les workers
    await Promise.all(Object.values(this.workers).map(worker => worker.close()));
    
    // Fermer les schedulers
    await Promise.all(Object.values(this.schedulers).map(scheduler => scheduler.close()));
    
    // Fermer les connexions Redis
    await this.connection.quit();
    await this.cacheConnection.quit();
    
    logger.info('OpenAIQueueManager fermé');
  }
}

module.exports = OpenAIQueueManager;
