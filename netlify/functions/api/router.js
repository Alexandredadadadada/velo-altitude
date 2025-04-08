/**
 * API Router for Velo-Altitude
 * 
 * Provides centralized routing for all API endpoints with:
 * - Advanced security features
 * - Performance optimization
 * - Monitoring
 * - Structured error handling
 */

const express = require('express');
const serverless = require('serverless-http');
const compression = require('compression');
const helmet = require('helmet');

// Import utility services
const cache = require('../../utils/cacheService');
const dbManager = require('../../utils/dbManager');
const { 
  rateLimiter, 
  securityHeaders, 
  validateInput, 
  sanitizeRequest, 
  corsHandler, 
  validateRequest, 
  errorHandler 
} = require('../../utils/securityMiddleware');

// Import Auth0 middleware
const { checkJwt } = require('../middleware/auth');

// Import monitoring service
const monitoringService = require('../../utils/monitoringService');

// Import route modules
const authRoutes = require('./routes/auth');
const colsRoutes = require('./routes/cols');
const routesRoutes = require('./routes/routes');
const userRoutes = require('./routes/user');
const weatherRoutes = require('./routes/weather');
const stravaRoutes = require('./routes/strava');
const trainingRoutes = require('./routes/training');
const nutritionRoutes = require('./routes/nutrition');
const analyticsRoutes = require('./routes/analytics');
const monitoringRoutes = require('./routes/monitoring');

// Create Express app
const app = express();

// Configure middleware
app.use(compression()); // Compress responses
app.use(helmet()); // Security headers
app.use(express.json({ limit: '1mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '1mb' })); // Parse URL-encoded bodies

// Apply security middleware
app.use(corsHandler());
app.use(securityHeaders());
app.use(validateRequest());
app.use(sanitizeRequest());
app.use(rateLimiter());

// Start monitoring service
monitoringService.start();

// Add monitoring middleware
app.use(monitoringService.createMiddleware());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  
  // Log response time on completion
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    
    // Track slow responses
    if (duration > 1000) {
      console.warn(`[SLOW] ${req.method} ${req.path} took ${duration}ms`);
    }
  });
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION || '1.0.0'
  });
});

// API version prefix
const apiPrefix = '/api/v1';

// Public routes (no authentication required)
app.use(`${apiPrefix}/auth`, authRoutes);

// Protect API routes that require authentication
app.use('/api/protected/*', checkJwt);

// Protected routes (authentication required)
app.use(`${apiPrefix}/cols`, checkJwt, colsRoutes);
app.use(`${apiPrefix}/routes`, checkJwt, routesRoutes);
app.use(`${apiPrefix}/user`, checkJwt, userRoutes);
app.use(`${apiPrefix}/weather`, checkJwt, weatherRoutes);
app.use(`${apiPrefix}/strava`, checkJwt, stravaRoutes);
app.use(`${apiPrefix}/training`, checkJwt, trainingRoutes);
app.use(`${apiPrefix}/nutrition`, checkJwt, nutritionRoutes);
app.use(`${apiPrefix}/analytics`, checkJwt, analyticsRoutes);
app.use(`${apiPrefix}/monitoring`, checkJwt, monitoringRoutes);

// API documentation
app.get(`${apiPrefix}/docs`, (req, res) => {
  res.status(200).json({
    name: 'Velo-Altitude API',
    version: process.env.APP_VERSION || '1.0.0',
    description: 'API for Velo-Altitude cycling platform',
    endpoints: [
      { path: '/auth', description: 'Authentication endpoints' },
      { path: '/cols', description: 'Mountain pass information' },
      { path: '/routes', description: 'Cycling routes and challenges' },
      { path: '/user', description: 'User profile and preferences' },
      { path: '/weather', description: 'Weather forecasts for routes' },
      { path: '/strava', description: 'Strava integration' },
      { path: '/training', description: 'Training programs and workouts' },
      { path: '/nutrition', description: 'Nutrition plans and recipes' },
      { path: '/analytics', description: 'User activity analytics' },
      { path: '/monitoring', description: 'Monitoring and logging endpoints' }
    ],
    documentation: 'https://velo-altitude.com/api-docs'
  });
});

// Cache stats endpoint (protected with Auth0)
app.get(`${apiPrefix}/cache/stats`, checkJwt, (req, res) => {
  res.status(200).json(cache.getStats());
});

// Cache clear endpoint (protected with Auth0)
app.post(`${apiPrefix}/cache/clear`, checkJwt, (req, res) => {
  const segment = req.body.segment;
  cache.clear(segment);
  res.status(200).json({ 
    message: segment ? `Cache segment ${segment} cleared` : 'All cache cleared' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.path} not found`,
    requestId: req.requestId
  });
});

// Error handler
app.use(errorHandler());

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  try {
    // Close database connections
    await dbManager.closeConnections();
    console.log('Database connections closed');
    
    // Stop monitoring service
    monitoringService.stop();
    
    // Exit process
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
});

// Export handler for serverless
const handler = serverless(app);

module.exports = { handler, app };
