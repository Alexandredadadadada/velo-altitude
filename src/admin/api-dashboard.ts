/**
 * API Metrics Dashboard
 * 
 * Provides visualization and monitoring capabilities for the Velo-Altitude API metrics.
 * This dashboard shows API usage rates, response times, fallback rates, and error counts
 * for all critical services.
 */

import express, { Request, Response } from 'express';
import monitoringService from '../monitoring';
import apiMetricsService from '../monitoring/api-metrics';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Require authentication with admin role
router.use(authMiddleware(['admin']));

/**
 * Get all API metrics for the dashboard
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    // Get metrics for dashboard
    const dashboard = apiMetricsService.getDashboard();
    
    // Add overall health status
    const healthStatus = monitoringService.getHealthStatus();
    
    res.json({
      metrics: dashboard,
      health: healthStatus,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error fetching API metrics:', error);
    res.status(500).json({ error: 'Failed to fetch API metrics' });
  }
});

/**
 * Get detailed metrics for a specific service
 */
router.get('/metrics/:service', async (req: Request, res: Response) => {
  try {
    const { service } = req.params;
    
    // Get detailed metrics for this service
    const metrics = apiMetricsService.getAPIMetrics(service);
    
    // Get raw monitoring metrics for charts
    const responseTimeHistory = monitoringService.getMetrics('api_call')
      .filter((m: any) => m.tags.service === service)
      .map((m: any) => ({
        value: m.value,
        timestamp: m.timestamp
      }));
    
    // Get fallback events if any
    const fallbackEvents = monitoringService.getMetrics('api_fallback')
      .filter((m: any) => 
        m.tags.primaryService === service || 
        m.tags.fallbackService === service
      )
      .map((m: any) => ({
        primaryService: m.tags.primaryService,
        fallbackService: m.tags.fallbackService,
        reason: m.tags.reason,
        timestamp: m.timestamp
      }));
    
    // Get error events
    const errorEvents = monitoringService.getErrors()
      .filter((e: any) => e.service === service || e.metadata?.service === service)
      .map((e: any) => ({
        message: e.message,
        code: e.code,
        timestamp: e.timestamp,
        metadata: e.metadata
      }));
    
    res.json({
      overview: metrics,
      responseTimeHistory,
      fallbackEvents,
      errorEvents,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error(`Error fetching metrics for service ${req.params.service}:`, error);
    res.status(500).json({ error: `Failed to fetch metrics for service ${req.params.service}` });
  }
});

/**
 * Get alert history
 */
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const rateWarnings = monitoringService.getMetrics('rate_limit_warning');
    const fallbackWarnings = monitoringService.getMetrics('fallback_rate_warning');
    const responseTimeWarnings = monitoringService.getMetrics('response_time_warning');
    const errorRateWarnings = monitoringService.getMetrics('error_rate_warning');
    
    res.json({
      rateWarnings,
      fallbackWarnings,
      responseTimeWarnings,
      errorRateWarnings,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error fetching alert history:', error);
    res.status(500).json({ error: 'Failed to fetch alert history' });
  }
});

/**
 * Get rate limit status for all services
 */
router.get('/rate-limits', async (req: Request, res: Response) => {
  try {
    const rateLimits = monitoringService.getMetrics('rate_limit')
      .reduce((acc: any, curr: any) => {
        if (!acc[curr.tags.service]) {
          acc[curr.tags.service] = {
            service: curr.tags.service,
            history: []
          };
        }
        
        acc[curr.tags.service].history.push({
          remaining: curr.value,
          limit: Number(curr.tags.limit),
          exceeded: curr.tags.exceeded === 'true',
          timestamp: curr.timestamp
        });
        
        return acc;
      }, {});
    
    res.json({
      rateLimits: Object.values(rateLimits),
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error fetching rate limit status:', error);
    res.status(500).json({ error: 'Failed to fetch rate limit status' });
  }
});

/**
 * Reset metrics for development/testing purposes
 * Only available in non-production environments
 */
router.post('/reset', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Cannot reset metrics in production' });
  }
  
  try {
    // Reset metrics storage would be implemented here
    // This is just a placeholder
    
    res.json({ success: true, message: 'Metrics reset successfully' });
  } catch (error) {
    console.error('Error resetting metrics:', error);
    res.status(500).json({ error: 'Failed to reset metrics' });
  }
});

export default router;
