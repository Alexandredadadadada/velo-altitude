/**
 * Monitoring Routes for Velo-Altitude API
 * 
 * Provides endpoints for monitoring API performance, errors, and system metrics
 * Protected by authentication and role-based access control
 */

const express = require('express');
const router = express.Router();
const monitoringService = require('../../../utils/monitoringService');
const dbManager = require('../../../utils/dbManager');
const cache = require('../../../utils/cacheService');
const { securityHeaders, validateInput } = require('../../../utils/securityMiddleware');

// Authentication middleware with admin role requirement
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = requireAuth({ requiredRoles: ['admin'] });

// Apply security headers to all routes
router.use(securityHeaders());

/**
 * Get basic metrics
 * GET /api/v1/monitoring/metrics
 */
router.get('/metrics', requireAdmin, (req, res) => {
  const metrics = monitoringService.getMetrics(false);
  res.status(200).json(metrics);
});

/**
 * Get detailed metrics
 * GET /api/v1/monitoring/metrics/detailed
 */
router.get('/metrics/detailed', requireAdmin, (req, res) => {
  const metrics = monitoringService.getMetrics(true);
  res.status(200).json(metrics);
});

/**
 * Reset metrics
 * POST /api/v1/monitoring/metrics/reset
 */
router.post('/metrics/reset', requireAdmin, (req, res) => {
  monitoringService.resetMetrics();
  res.status(200).json({ message: 'Metrics reset successfully' });
});

/**
 * Get database metrics
 * GET /api/v1/monitoring/database
 */
router.get('/database', requireAdmin, async (req, res) => {
  try {
    const dbMetrics = dbManager.getPerformanceMetrics();
    res.status(200).json(dbMetrics);
  } catch (error) {
    console.error('[Monitoring] Error getting database metrics:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to get database metrics',
      requestId: req.requestId
    });
  }
});

/**
 * Get cache metrics
 * GET /api/v1/monitoring/cache
 */
router.get('/cache', requireAdmin, (req, res) => {
  const cacheStats = cache.getStats();
  res.status(200).json(cacheStats);
});

/**
 * Clear cache segment
 * POST /api/v1/monitoring/cache/clear
 */
router.post('/cache/clear', requireAdmin, validateInput({
  body: {
    segment: { type: 'string', required: false }
  }
}), (req, res) => {
  const { segment } = req.body;
  cache.clear(segment);
  
  res.status(200).json({
    message: segment ? `Cache segment '${segment}' cleared` : 'All cache cleared'
  });
});

/**
 * Get slow requests
 * GET /api/v1/monitoring/slow-requests
 */
router.get('/slow-requests', requireAdmin, (req, res) => {
  const metrics = monitoringService.getMetrics(true);
  res.status(200).json(metrics.detailed.performance.slowRequests);
});

/**
 * Get recent errors
 * GET /api/v1/monitoring/errors
 */
router.get('/errors', requireAdmin, (req, res) => {
  const metrics = monitoringService.getMetrics(true);
  res.status(200).json(metrics.detailed.errors.recent);
});

/**
 * Get system metrics history
 * GET /api/v1/monitoring/system
 */
router.get('/system', requireAdmin, (req, res) => {
  const metrics = monitoringService.getMetrics(true);
  
  res.status(200).json({
    memory: metrics.detailed.system.memory,
    cpu: metrics.detailed.system.cpu,
    uptime: metrics.system.uptime
  });
});

/**
 * Get endpoint performance
 * GET /api/v1/monitoring/endpoints
 */
router.get('/endpoints', requireAdmin, (req, res) => {
  const metrics = monitoringService.getMetrics(true);
  
  // Convert to array and sort by average response time
  const endpoints = Object.entries(metrics.detailed.requests.byEndpoint).map(([endpoint, data]) => ({
    endpoint,
    ...data
  })).sort((a, b) => b.avgTime - a.avgTime);
  
  res.status(200).json(endpoints);
});

/**
 * Health check endpoint (public)
 * GET /api/v1/monitoring/health
 */
router.get('/health', (req, res) => {
  const metrics = monitoringService.getMetrics(false);
  
  // Basic health check
  const health = {
    status: 'ok',
    uptime: metrics.system.uptime,
    timestamp: Date.now(),
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };
  
  // Check if there are any critical issues
  if (metrics.errors.count > 100 || 
      metrics.performance.responseTime.avg > 1000 || 
      metrics.system.cpu.current > 90) {
    health.status = 'warning';
  }
  
  res.status(200).json(health);
});

/**
 * Readiness check endpoint (public)
 * GET /api/v1/monitoring/ready
 */
router.get('/ready', async (req, res) => {
  try {
    // Check database connection
    await dbManager.connectMongoose();
    
    res.status(200).json({
      status: 'ready',
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('[Monitoring] Readiness check failed:', error);
    
    res.status(503).json({
      status: 'not_ready',
      reason: 'Database connection failed',
      timestamp: Date.now()
    });
  }
});

module.exports = router;
