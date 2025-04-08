/**
 * Monitoring Service for Velo-Altitude API
 * 
 * Provides performance tracking, error logging, and analytics for API endpoints
 * Implements real-time metrics collection and reporting
 */

const os = require('os');
const cache = require('./cacheService');

// Configuration
const config = {
  metricsRetention: 24 * 60 * 60 * 1000, // 24 hours
  samplingRate: process.env.METRICS_SAMPLING_RATE || 1.0, // 1.0 = 100% of requests
  slowRequestThreshold: process.env.SLOW_REQUEST_THRESHOLD || 500, // ms
  errorSamplingRate: 1.0, // Always collect error metrics
  cpuSamplingInterval: 60 * 1000, // 1 minute
  memoryWarningThreshold: 0.85, // 85% of max memory
  enableDetailedMetrics: process.env.NODE_ENV !== 'production' || process.env.ENABLE_DETAILED_METRICS === 'true'
};

// Metrics storage
const metrics = {
  requests: {
    total: 0,
    success: 0,
    error: 0,
    byEndpoint: {},
    byMethod: {},
    byStatusCode: {}
  },
  performance: {
    responseTime: {
      avg: 0,
      min: Number.MAX_SAFE_INTEGER,
      max: 0,
      p50: 0,
      p90: 0,
      p95: 0,
      p99: 0
    },
    slowRequests: [],
    requestTimes: []
  },
  errors: {
    count: 0,
    byType: {},
    recent: []
  },
  system: {
    memory: {
      current: 0,
      max: 0,
      history: []
    },
    cpu: {
      current: 0,
      history: []
    },
    uptime: 0
  },
  cache: {
    hits: 0,
    misses: 0,
    ratio: 0
  },
  database: {
    queries: 0,
    errors: 0,
    avgQueryTime: 0
  },
  startTime: Date.now()
};

// Initialize system monitoring
let cpuMonitoringInterval = null;

/**
 * Start monitoring service
 */
function start() {
  if (cpuMonitoringInterval) {
    return;
  }
  
  // Start CPU and memory monitoring
  cpuMonitoringInterval = setInterval(collectSystemMetrics, config.cpuSamplingInterval);
  
  // Collect initial system metrics
  collectSystemMetrics();
  
  console.log('[MonitoringService] Started');
}

/**
 * Stop monitoring service
 */
function stop() {
  if (cpuMonitoringInterval) {
    clearInterval(cpuMonitoringInterval);
    cpuMonitoringInterval = null;
  }
  
  console.log('[MonitoringService] Stopped');
}

/**
 * Collect system metrics (CPU, memory)
 */
function collectSystemMetrics() {
  // Memory usage
  const memoryUsage = process.memoryUsage();
  const usedMemory = memoryUsage.heapUsed / 1024 / 1024; // MB
  const totalMemory = memoryUsage.heapTotal / 1024 / 1024; // MB
  
  metrics.system.memory.current = usedMemory;
  metrics.system.memory.max = Math.max(metrics.system.memory.max, usedMemory);
  
  // Add to history, keeping last 60 samples
  metrics.system.memory.history.push({
    timestamp: Date.now(),
    used: usedMemory,
    total: totalMemory
  });
  
  if (metrics.system.memory.history.length > 60) {
    metrics.system.memory.history.shift();
  }
  
  // Check memory warning threshold
  const memoryRatio = usedMemory / totalMemory;
  if (memoryRatio > config.memoryWarningThreshold) {
    console.warn(`[MonitoringService] High memory usage: ${Math.round(memoryRatio * 100)}% (${Math.round(usedMemory)}MB / ${Math.round(totalMemory)}MB)`);
  }
  
  // CPU usage (average across all cores)
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;
  
  for (const cpu of cpus) {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  }
  
  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const usage = 100 - (idle / total * 100);
  
  metrics.system.cpu.current = usage;
  
  // Add to history, keeping last 60 samples
  metrics.system.cpu.history.push({
    timestamp: Date.now(),
    usage
  });
  
  if (metrics.system.cpu.history.length > 60) {
    metrics.system.cpu.history.shift();
  }
  
  // Update uptime
  metrics.system.uptime = Math.floor((Date.now() - metrics.startTime) / 1000);
  
  // Update cache metrics
  const cacheStats = cache.getStats();
  metrics.cache.hits = cacheStats.hits;
  metrics.cache.misses = cacheStats.misses;
  metrics.cache.ratio = cacheStats.hitRatio;
}

/**
 * Record request metrics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {number} startTime - Request start time
 */
function recordRequest(req, res, startTime) {
  // Check sampling rate
  if (Math.random() > config.samplingRate && res.statusCode < 400) {
    return;
  }
  
  // Always record errors
  const isError = res.statusCode >= 400;
  if (isError && Math.random() > config.errorSamplingRate) {
    return;
  }
  
  // Calculate response time
  const responseTime = Date.now() - startTime;
  
  // Update request counts
  metrics.requests.total++;
  
  if (isError) {
    metrics.requests.error++;
  } else {
    metrics.requests.success++;
  }
  
  // Update endpoint metrics
  const endpoint = req.route ? req.baseUrl + req.route.path : req.path;
  if (!metrics.requests.byEndpoint[endpoint]) {
    metrics.requests.byEndpoint[endpoint] = {
      count: 0,
      errors: 0,
      totalTime: 0,
      avgTime: 0
    };
  }
  
  metrics.requests.byEndpoint[endpoint].count++;
  metrics.requests.byEndpoint[endpoint].totalTime += responseTime;
  metrics.requests.byEndpoint[endpoint].avgTime = 
    metrics.requests.byEndpoint[endpoint].totalTime / metrics.requests.byEndpoint[endpoint].count;
  
  if (isError) {
    metrics.requests.byEndpoint[endpoint].errors++;
  }
  
  // Update method metrics
  const method = req.method;
  if (!metrics.requests.byMethod[method]) {
    metrics.requests.byMethod[method] = {
      count: 0,
      errors: 0
    };
  }
  
  metrics.requests.byMethod[method].count++;
  
  if (isError) {
    metrics.requests.byMethod[method].errors++;
  }
  
  // Update status code metrics
  const statusCode = res.statusCode;
  if (!metrics.requests.byStatusCode[statusCode]) {
    metrics.requests.byStatusCode[statusCode] = 0;
  }
  
  metrics.requests.byStatusCode[statusCode]++;
  
  // Update performance metrics
  metrics.performance.responseTime.min = Math.min(metrics.performance.responseTime.min, responseTime);
  metrics.performance.responseTime.max = Math.max(metrics.performance.responseTime.max, responseTime);
  
  // Add to request times array for percentile calculation
  metrics.performance.requestTimes.push(responseTime);
  
  // Keep array at a reasonable size
  if (metrics.performance.requestTimes.length > 1000) {
    metrics.performance.requestTimes.shift();
  }
  
  // Calculate average
  const totalTime = metrics.performance.requestTimes.reduce((sum, time) => sum + time, 0);
  metrics.performance.responseTime.avg = totalTime / metrics.performance.requestTimes.length;
  
  // Calculate percentiles
  const sortedTimes = [...metrics.performance.requestTimes].sort((a, b) => a - b);
  metrics.performance.responseTime.p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
  metrics.performance.responseTime.p90 = sortedTimes[Math.floor(sortedTimes.length * 0.9)];
  metrics.performance.responseTime.p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
  metrics.performance.responseTime.p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
  
  // Record slow requests
  if (responseTime > config.slowRequestThreshold) {
    metrics.performance.slowRequests.push({
      timestamp: Date.now(),
      method,
      endpoint,
      responseTime,
      statusCode,
      userId: req.user ? req.user.id : null,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });
    
    // Keep array at a reasonable size
    if (metrics.performance.slowRequests.length > 100) {
      metrics.performance.slowRequests.shift();
    }
    
    // Log slow request
    console.warn(`[MonitoringService] Slow request: ${method} ${endpoint} (${responseTime}ms)`);
  }
  
  // Record errors
  if (isError) {
    recordError({
      timestamp: Date.now(),
      method,
      endpoint,
      statusCode,
      message: res.statusMessage,
      userId: req.user ? req.user.id : null,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      requestId: req.requestId
    });
  }
}

/**
 * Record error
 * @param {Object} error - Error details
 */
function recordError(error) {
  metrics.errors.count++;
  
  // Update error type metrics
  const errorType = error.statusCode ? `HTTP ${error.statusCode}` : (error.name || 'Unknown');
  if (!metrics.errors.byType[errorType]) {
    metrics.errors.byType[errorType] = 0;
  }
  
  metrics.errors.byType[errorType]++;
  
  // Add to recent errors
  metrics.errors.recent.push(error);
  
  // Keep array at a reasonable size
  if (metrics.errors.recent.length > 100) {
    metrics.errors.recent.shift();
  }
}

/**
 * Record database metrics
 * @param {Object} dbMetrics - Database metrics
 */
function recordDatabaseMetrics(dbMetrics) {
  metrics.database.queries = dbMetrics.totalQueries || 0;
  metrics.database.errors = dbMetrics.errors || 0;
  metrics.database.avgQueryTime = dbMetrics.averageQueryTime || 0;
}

/**
 * Get monitoring metrics
 * @param {boolean} detailed - Whether to include detailed metrics
 * @returns {Object} Monitoring metrics
 */
function getMetrics(detailed = false) {
  // Update system metrics before returning
  collectSystemMetrics();
  
  const baseMetrics = {
    requests: {
      total: metrics.requests.total,
      success: metrics.requests.success,
      error: metrics.requests.error,
      successRate: metrics.requests.total > 0 ? 
        (metrics.requests.success / metrics.requests.total * 100).toFixed(2) + '%' : '0%'
    },
    performance: {
      responseTime: {
        avg: Math.round(metrics.performance.responseTime.avg),
        min: metrics.performance.responseTime.min === Number.MAX_SAFE_INTEGER ? 0 : metrics.performance.responseTime.min,
        max: metrics.performance.responseTime.max,
        p50: metrics.performance.responseTime.p50 || 0,
        p90: metrics.performance.responseTime.p90 || 0,
        p95: metrics.performance.responseTime.p95 || 0,
        p99: metrics.performance.responseTime.p99 || 0
      },
      slowRequests: metrics.performance.slowRequests.length
    },
    errors: {
      count: metrics.errors.count,
      rate: metrics.requests.total > 0 ? 
        (metrics.errors.count / metrics.requests.total * 100).toFixed(2) + '%' : '0%'
    },
    system: {
      memory: {
        current: Math.round(metrics.system.memory.current),
        max: Math.round(metrics.system.memory.max),
        unit: 'MB'
      },
      cpu: {
        current: Math.round(metrics.system.cpu.current * 100) / 100,
        unit: '%'
      },
      uptime: metrics.system.uptime
    },
    cache: {
      hits: metrics.cache.hits,
      misses: metrics.cache.misses,
      ratio: metrics.cache.ratio
    },
    database: {
      queries: metrics.database.queries,
      errors: metrics.database.errors,
      avgQueryTime: metrics.database.avgQueryTime
    },
    timestamp: Date.now()
  };
  
  // Return basic metrics if detailed is false
  if (!detailed && !config.enableDetailedMetrics) {
    return baseMetrics;
  }
  
  // Add detailed metrics
  return {
    ...baseMetrics,
    detailed: {
      requests: {
        byEndpoint: metrics.requests.byEndpoint,
        byMethod: metrics.requests.byMethod,
        byStatusCode: metrics.requests.byStatusCode
      },
      performance: {
        slowRequests: metrics.performance.slowRequests.slice(-10)
      },
      errors: {
        byType: metrics.errors.byType,
        recent: metrics.errors.recent.slice(-10)
      },
      system: {
        memory: {
          history: metrics.system.memory.history.slice(-20)
        },
        cpu: {
          history: metrics.system.cpu.history.slice(-20)
        }
      }
    }
  };
}

/**
 * Reset metrics
 */
function resetMetrics() {
  metrics.requests = {
    total: 0,
    success: 0,
    error: 0,
    byEndpoint: {},
    byMethod: {},
    byStatusCode: {}
  };
  
  metrics.performance = {
    responseTime: {
      avg: 0,
      min: Number.MAX_SAFE_INTEGER,
      max: 0,
      p50: 0,
      p90: 0,
      p95: 0,
      p99: 0
    },
    slowRequests: [],
    requestTimes: []
  };
  
  metrics.errors = {
    count: 0,
    byType: {},
    recent: []
  };
  
  // Keep system metrics history
  metrics.startTime = Date.now();
  
  console.log('[MonitoringService] Metrics reset');
}

/**
 * Create Express middleware for request monitoring
 * @returns {Function} Express middleware
 */
function createMiddleware() {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Record metrics on response finish
    res.on('finish', () => {
      recordRequest(req, res, startTime);
    });
    
    next();
  };
}

module.exports = {
  start,
  stop,
  recordRequest,
  recordError,
  recordDatabaseMetrics,
  getMetrics,
  resetMetrics,
  createMiddleware
};
