/**
 * Middleware d'intégration du système de monitoring de performance
 */

const performanceMonitoringService = require('../services/performance-monitoring.service');

/**
 * Middleware pour Express qui active le monitoring des performances HTTP
 */
const setupPerformanceMonitoring = (app) => {
  // Ajouter le middleware de monitoring sur toutes les routes
  app.use(performanceMonitoringService.httpMonitoringMiddleware);
  
  // Exposer l'endpoint Prometheus pour scraping des métriques
  app.get('/metrics', async (req, res) => {
    // Cette route devrait être protégée en production
    // Vérifier si la requête vient d'une source autorisée
    const allowedIps = process.env.METRICS_ALLOWED_IPS 
      ? process.env.METRICS_ALLOWED_IPS.split(',') 
      : ['127.0.0.1', 'localhost'];
      
    const clientIp = req.ip || req.connection.remoteAddress;
    
    if (!allowedIps.includes(clientIp) && process.env.NODE_ENV === 'production') {
      return res.status(403).send('Forbidden');
    }
    
    try {
      res.set('Content-Type', performanceMonitoringService.register.contentType);
      const metrics = await performanceMonitoringService.register.metrics();
      res.send(metrics);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });
  
  // Exposer un endpoint pour le dashboard de performance (pour admin)
  app.get('/api/admin/performance', async (req, res) => {
    try {
      // Vérifier si l'utilisateur est un admin (middleware auth requis avant)
      if (req.user && req.user.role !== 'admin') {
        return res.status(403).send({ message: 'Forbidden: Administrator access required' });
      }
      
      const report = await performanceMonitoringService.generateDailyPerformanceReport();
      res.json(report);
    } catch (error) {
      res.status(500).send({ 
        message: 'Error generating performance report',
        error: error.message
      });
    }
  });
  
  // Initialiser le système de monitoring
  performanceMonitoringService.initMonitoring();
  
  return app;
};

module.exports = setupPerformanceMonitoring;
