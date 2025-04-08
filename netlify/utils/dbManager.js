/**
 * MongoDB Connection Manager for Velo-Altitude
 * Provides optimized connection handling, query monitoring, and performance optimization
 */

const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const cache = require('./cacheService');

// Performance monitoring
const performanceMetrics = {
  queries: [],
  connectionEvents: [],
  slowQueries: [],
  errors: []
};

// Configuration
const config = {
  connectionPoolSize: process.env.MONGODB_POOL_SIZE || 10,
  connectionTimeout: process.env.MONGODB_TIMEOUT || 30000,
  retryWrites: true,
  maxIdleTimeMS: 120000, // 2 minutes
  maxQueueSize: 500,
  monitoringEnabled: process.env.NODE_ENV !== 'test',
  slowQueryThreshold: process.env.SLOW_QUERY_THRESHOLD || 100, // ms
  logLevel: process.env.DB_LOG_LEVEL || 'info'
};

// Connection state
let mongoClient = null;
let mongooseConnection = null;
let isConnecting = false;
let connectionPromise = null;

/**
 * Connect to MongoDB using Mongoose
 * @returns {Promise<mongoose.Connection>} Mongoose connection
 */
async function connectMongoose() {
  if (mongooseConnection && mongoose.connection.readyState === 1) {
    return mongooseConnection;
  }

  if (isConnecting) {
    return connectionPromise;
  }

  isConnecting = true;
  connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: config.connectionPoolSize,
    serverSelectionTimeoutMS: config.connectionTimeout,
    socketTimeoutMS: config.connectionTimeout,
    retryWrites: config.retryWrites,
    maxIdleTimeMS: config.maxIdleTimeMS
  });

  try {
    await connectionPromise;
    mongooseConnection = mongoose.connection;
    
    // Set up connection event listeners
    setupConnectionMonitoring(mongooseConnection);
    
    isConnecting = false;
    logEvent('connection', 'Mongoose connection established');
    return mongooseConnection;
  } catch (error) {
    isConnecting = false;
    logError('connection', 'Failed to connect to MongoDB', error);
    throw error;
  }
}

/**
 * Connect to MongoDB using native driver
 * @returns {Promise<MongoClient>} MongoDB client
 */
async function connectNative() {
  if (mongoClient && mongoClient.isConnected()) {
    return mongoClient;
  }

  if (isConnecting) {
    return connectionPromise;
  }

  isConnecting = true;
  
  try {
    mongoClient = new MongoClient(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: config.connectionPoolSize,
      serverSelectionTimeoutMS: config.connectionTimeout,
      socketTimeoutMS: config.connectionTimeout,
      retryWrites: config.retryWrites,
      maxIdleTimeMS: config.maxIdleTimeMS
    });

    connectionPromise = mongoClient.connect();
    await connectionPromise;
    
    isConnecting = false;
    logEvent('connection', 'Native MongoDB connection established');
    return mongoClient;
  } catch (error) {
    isConnecting = false;
    logError('connection', 'Failed to connect to MongoDB', error);
    throw error;
  }
}

/**
 * Execute a MongoDB query with performance monitoring
 * @param {Function} queryFn - Function that executes the query
 * @param {string} queryName - Name of the query for monitoring
 * @param {Object} options - Query options
 * @returns {Promise<*>} Query result
 */
async function executeQuery(queryFn, queryName, options = {}) {
  const startTime = Date.now();
  const cacheKey = options.cacheKey;
  const cacheTTL = options.cacheTTL || 300000; // 5 minutes default
  const cacheSegment = options.cacheSegment || 'queries';
  
  // Try to get from cache if caching is enabled
  if (cacheKey) {
    const cachedResult = cache.get(cacheKey, cacheSegment);
    if (cachedResult !== undefined) {
      logEvent('query', `Cache hit for ${queryName}:${cacheKey}`);
      return cachedResult;
    }
  }
  
  try {
    // Ensure connection is established
    await connectMongoose();
    
    // Execute the query
    const result = await queryFn();
    
    // Calculate execution time
    const executionTime = Date.now() - startTime;
    
    // Log performance metrics
    logQueryPerformance(queryName, executionTime, options);
    
    // Cache the result if caching is enabled
    if (cacheKey && result) {
      cache.set(cacheKey, result, { ttl: cacheTTL, segment: cacheSegment });
    }
    
    return result;
  } catch (error) {
    logError('query', `Error executing query ${queryName}`, error);
    throw error;
  }
}

/**
 * Log query performance metrics
 * @param {string} queryName - Name of the query
 * @param {number} executionTime - Execution time in ms
 * @param {Object} options - Query options
 */
function logQueryPerformance(queryName, executionTime, options) {
  if (!config.monitoringEnabled) return;
  
  const queryInfo = {
    name: queryName,
    executionTime,
    timestamp: new Date(),
    options: { ...options, cacheKey: undefined } // Don't log potentially sensitive cache keys
  };
  
  performanceMetrics.queries.push(queryInfo);
  
  // Keep metrics array at a reasonable size
  if (performanceMetrics.queries.length > 1000) {
    performanceMetrics.queries.shift();
  }
  
  // Track slow queries
  if (executionTime > config.slowQueryThreshold) {
    performanceMetrics.slowQueries.push(queryInfo);
    logEvent('performance', `Slow query detected: ${queryName} (${executionTime}ms)`);
    
    // Keep slow queries array at a reasonable size
    if (performanceMetrics.slowQueries.length > 100) {
      performanceMetrics.slowQueries.shift();
    }
  }
}

/**
 * Set up connection monitoring
 * @param {mongoose.Connection} connection - Mongoose connection
 */
function setupConnectionMonitoring(connection) {
  if (!config.monitoringEnabled) return;
  
  connection.on('connected', () => logEvent('connection', 'Connected to MongoDB'));
  connection.on('disconnected', () => logEvent('connection', 'Disconnected from MongoDB'));
  connection.on('reconnected', () => logEvent('connection', 'Reconnected to MongoDB'));
  connection.on('error', (err) => logError('connection', 'MongoDB connection error', err));
}

/**
 * Log an event
 * @param {string} type - Event type
 * @param {string} message - Event message
 */
function logEvent(type, message) {
  if (!config.monitoringEnabled) return;
  
  const event = {
    type,
    message,
    timestamp: new Date()
  };
  
  performanceMetrics.connectionEvents.push(event);
  
  // Keep events array at a reasonable size
  if (performanceMetrics.connectionEvents.length > 1000) {
    performanceMetrics.connectionEvents.shift();
  }
  
  // Log based on configured level
  if (config.logLevel === 'debug' || type === 'error') {
    console.log(`[DB:${type}] ${message}`);
  }
}

/**
 * Log an error
 * @param {string} type - Error type
 * @param {string} message - Error message
 * @param {Error} error - Error object
 */
function logError(type, message, error) {
  if (!config.monitoringEnabled) return;
  
  const errorInfo = {
    type,
    message,
    error: error.message,
    stack: error.stack,
    timestamp: new Date()
  };
  
  performanceMetrics.errors.push(errorInfo);
  
  // Keep errors array at a reasonable size
  if (performanceMetrics.errors.length > 100) {
    performanceMetrics.errors.shift();
  }
  
  console.error(`[DB:${type}] ${message}:`, error);
}

/**
 * Get performance metrics
 * @returns {Object} Performance metrics
 */
function getPerformanceMetrics() {
  return {
    ...performanceMetrics,
    summary: {
      totalQueries: performanceMetrics.queries.length,
      slowQueries: performanceMetrics.slowQueries.length,
      errors: performanceMetrics.errors.length,
      averageQueryTime: calculateAverageQueryTime()
    }
  };
}

/**
 * Calculate average query execution time
 * @returns {number} Average query time in ms
 */
function calculateAverageQueryTime() {
  if (performanceMetrics.queries.length === 0) return 0;
  
  const total = performanceMetrics.queries.reduce((sum, query) => sum + query.executionTime, 0);
  return Math.round(total / performanceMetrics.queries.length);
}

/**
 * Close database connections
 */
async function closeConnections() {
  if (mongooseConnection) {
    await mongoose.disconnect();
    mongooseConnection = null;
  }
  
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
  }
  
  isConnecting = false;
  connectionPromise = null;
  logEvent('connection', 'All database connections closed');
}

module.exports = {
  connectMongoose,
  connectNative,
  executeQuery,
  getPerformanceMetrics,
  closeConnections
};
