/**
 * Strava API Routes for Velo-Altitude
 * 
 * Provides optimized endpoints for Strava integration:
 * - Authentication flow
 * - Activity synchronization
 * - Route conversion
 * - Athlete data
 */

const express = require('express');
const router = express.Router();
const { validateInput } = require('../../../utils/securityMiddleware');
const dbManager = require('../../../utils/dbManager');
const cache = require('../../../utils/cacheService');
const axios = require('axios');

// Authentication middleware
const requireAuth = require('../middleware/requireAuth');

// Validation schemas
const schemas = {
  tokenExchange: {
    body: {
      code: { type: 'string', required: true },
      state: { type: 'string', required: false }
    }
  },
  tokenRefresh: {
    body: {
      refresh_token: { type: 'string', required: true }
    }
  },
  activities: {
    query: {
      page: { type: 'number', min: 1, required: false },
      per_page: { type: 'number', min: 1, max: 100, required: false },
      before: { type: 'number', required: false },
      after: { type: 'number', required: false }
    }
  },
  activityById: {
    params: {
      id: { type: 'string', required: true }
    }
  },
  convertActivity: {
    params: {
      id: { type: 'string', required: true }
    },
    body: {
      name: { type: 'string', required: false, maxLength: 100 },
      description: { type: 'string', required: false, maxLength: 500 }
    }
  }
};

// Constants
const STRAVA_API_BASE = 'https://www.strava.com/api/v3';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';

/**
 * Exchange authorization code for access token
 * POST /api/v1/strava/token
 */
router.post('/token', validateInput(schemas.tokenExchange), async (req, res) => {
  try {
    const { code } = req.body;
    
    // Exchange code for token
    const tokenResponse = await axios.post(STRAVA_TOKEN_URL, {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code'
    });
    
    // Return token data to client
    res.status(200).json(tokenResponse.data);
  } catch (error) {
    console.error('[Strava API] Token exchange error:', error.response?.data || error.message);
    
    res.status(error.response?.status || 500).json({
      error: 'Token Exchange Failed',
      message: error.response?.data?.message || 'Failed to exchange authorization code for token',
      requestId: req.requestId
    });
  }
});

/**
 * Refresh access token
 * POST /api/v1/strava/refresh
 */
router.post('/refresh', validateInput(schemas.tokenRefresh), async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    // Refresh token
    const tokenResponse = await axios.post(STRAVA_TOKEN_URL, {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token,
      grant_type: 'refresh_token'
    });
    
    // Return refreshed token data to client
    res.status(200).json(tokenResponse.data);
  } catch (error) {
    console.error('[Strava API] Token refresh error:', error.response?.data || error.message);
    
    res.status(error.response?.status || 500).json({
      error: 'Token Refresh Failed',
      message: error.response?.data?.message || 'Failed to refresh access token',
      requestId: req.requestId
    });
  }
});

/**
 * Disconnect/revoke Strava token
 * POST /api/v1/strava/disconnect
 */
router.post('/disconnect', requireAuth, async (req, res) => {
  try {
    const { access_token } = req.body;
    
    if (!access_token) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Access token is required',
        requestId: req.requestId
      });
    }
    
    // Revoke token
    await axios.post(`https://www.strava.com/oauth/deauthorize`, {}, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Strava API] Disconnect error:', error.response?.data || error.message);
    
    // Even if there's an error, we'll consider the disconnection successful from the client's perspective
    res.status(200).json({ success: true });
  }
});

/**
 * Get athlete profile
 * GET /api/v1/strava/athlete
 */
router.get('/athlete', requireAuth, async (req, res) => {
  try {
    const { access_token } = req.query;
    
    if (!access_token) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Access token is required',
        requestId: req.requestId
      });
    }
    
    // Check cache first
    const cacheKey = `strava:athlete:${access_token.substring(0, 10)}`;
    const cachedAthlete = cache.get(cacheKey, 'strava');
    
    if (cachedAthlete) {
      return res.status(200).json(cachedAthlete);
    }
    
    // Fetch athlete from Strava
    const response = await axios.get(`${STRAVA_API_BASE}/athlete`, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    
    // Cache the result
    cache.set(cacheKey, response.data, { ttl: 60 * 60 * 1000, segment: 'strava' }); // 1 hour
    
    res.status(200).json(response.data);
  } catch (error) {
    console.error('[Strava API] Get athlete error:', error.response?.data || error.message);
    
    res.status(error.response?.status || 500).json({
      error: 'Strava API Error',
      message: error.response?.data?.message || 'Failed to fetch athlete profile',
      requestId: req.requestId
    });
  }
});

/**
 * Get athlete activities
 * GET /api/v1/strava/activities
 */
router.get('/activities', requireAuth, validateInput(schemas.activities), async (req, res) => {
  try {
    const { access_token } = req.query;
    const { page = 1, per_page = 30, before, after } = req.query;
    
    if (!access_token) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Access token is required',
        requestId: req.requestId
      });
    }
    
    // Build query params
    const params = new URLSearchParams({
      page,
      per_page
    });
    
    if (before) params.append('before', before);
    if (after) params.append('after', after);
    
    // Generate cache key based on query params
    const cacheKey = `strava:activities:${access_token.substring(0, 10)}:${params.toString()}`;
    const cachedActivities = cache.get(cacheKey, 'strava');
    
    if (cachedActivities) {
      return res.status(200).json(cachedActivities);
    }
    
    // Fetch activities from Strava
    const response = await axios.get(`${STRAVA_API_BASE}/athlete/activities?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    
    // Cache the result
    cache.set(cacheKey, response.data, { ttl: 15 * 60 * 1000, segment: 'strava' }); // 15 minutes
    
    res.status(200).json(response.data);
  } catch (error) {
    console.error('[Strava API] Get activities error:', error.response?.data || error.message);
    
    res.status(error.response?.status || 500).json({
      error: 'Strava API Error',
      message: error.response?.data?.message || 'Failed to fetch activities',
      requestId: req.requestId
    });
  }
});

/**
 * Get activity by ID
 * GET /api/v1/strava/activities/:id
 */
router.get('/activities/:id', requireAuth, validateInput(schemas.activityById), async (req, res) => {
  try {
    const { access_token } = req.query;
    const { id } = req.params;
    
    if (!access_token) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Access token is required',
        requestId: req.requestId
      });
    }
    
    // Check cache first
    const cacheKey = `strava:activity:${id}`;
    const cachedActivity = cache.get(cacheKey, 'strava');
    
    if (cachedActivity) {
      return res.status(200).json(cachedActivity);
    }
    
    // Fetch activity from Strava
    const response = await axios.get(`${STRAVA_API_BASE}/activities/${id}`, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    
    // Cache the result
    cache.set(cacheKey, response.data, { ttl: 30 * 60 * 1000, segment: 'strava' }); // 30 minutes
    
    res.status(200).json(response.data);
  } catch (error) {
    console.error(`[Strava API] Get activity ${req.params.id} error:`, error.response?.data || error.message);
    
    res.status(error.response?.status || 500).json({
      error: 'Strava API Error',
      message: error.response?.data?.message || 'Failed to fetch activity',
      requestId: req.requestId
    });
  }
});

/**
 * Convert Strava activity to Velo-Altitude route
 * POST /api/v1/strava/activities/:id/convert
 */
router.post('/activities/:id/convert', requireAuth, validateInput(schemas.convertActivity), async (req, res) => {
  try {
    const { access_token } = req.query;
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user.id;
    
    if (!access_token) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Access token is required',
        requestId: req.requestId
      });
    }
    
    // Fetch activity if not in cache
    const cacheKey = `strava:activity:${id}`;
    let activity = cache.get(cacheKey, 'strava');
    
    if (!activity) {
      const response = await axios.get(`${STRAVA_API_BASE}/activities/${id}`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });
      
      activity = response.data;
      cache.set(cacheKey, activity, { ttl: 30 * 60 * 1000, segment: 'strava' });
    }
    
    // Convert activity to route format
    const route = {
      name: name || activity.name,
      description: description || activity.description || '',
      distance: activity.distance,
      elevation_gain: activity.total_elevation_gain,
      start_latlng: activity.start_latlng,
      end_latlng: activity.end_latlng,
      polyline: activity.map?.summary_polyline || '',
      type: 'strava_activity',
      source: 'strava',
      source_id: activity.id,
      user_id: userId,
      created_at: new Date(),
      metadata: {
        moving_time: activity.moving_time,
        elapsed_time: activity.elapsed_time,
        average_speed: activity.average_speed,
        max_speed: activity.max_speed,
        average_watts: activity.average_watts,
        kilojoules: activity.kilojoules,
        device_watts: activity.device_watts,
        has_heartrate: activity.has_heartrate,
        average_heartrate: activity.average_heartrate,
        max_heartrate: activity.max_heartrate
      }
    };
    
    // Save route to database using optimized connection
    const result = await dbManager.executeQuery(
      async () => {
        const db = await dbManager.connectMongoose();
        const Routes = db.model('Route');
        const newRoute = new Routes(route);
        return await newRoute.save();
      },
      'saveStravaRoute',
      { cacheKey: `route:strava:${id}:${userId}`, cacheTTL: 24 * 60 * 60 * 1000 }
    );
    
    res.status(201).json({
      success: true,
      route: {
        id: result._id,
        name: result.name,
        source: result.source,
        created_at: result.created_at
      }
    });
  } catch (error) {
    console.error(`[Strava API] Convert activity ${req.params.id} error:`, error);
    
    res.status(500).json({
      error: 'Conversion Failed',
      message: 'Failed to convert Strava activity to route',
      requestId: req.requestId
    });
  }
});

/**
 * Sync all Strava activities for user
 * POST /api/v1/strava/sync
 */
router.post('/sync', requireAuth, async (req, res) => {
  try {
    const { access_token } = req.query;
    const userId = req.user.id;
    
    if (!access_token) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Access token is required',
        requestId: req.requestId
      });
    }
    
    // Start background sync process
    // In a real implementation, this would be a background job
    // For now, we'll just return a success message
    
    res.status(202).json({
      success: true,
      message: 'Sync started',
      syncId: `sync-${Date.now()}`
    });
    
    // Background process would continue here
    // This is just a placeholder for the actual implementation
    console.log(`[Strava API] Starting sync for user ${userId}`);
    
    // The actual implementation would:
    // 1. Fetch all activities since last sync
    // 2. Process them in batches
    // 3. Update sync status in database
    // 4. Notify user when complete
    
  } catch (error) {
    console.error('[Strava API] Sync error:', error);
    
    // Since we've already responded to the client, we just log the error
  }
});

/**
 * Get sync status
 * GET /api/v1/strava/sync/:syncId
 */
router.get('/sync/:syncId', requireAuth, async (req, res) => {
  try {
    const { syncId } = req.params;
    
    // In a real implementation, we would check the status of the sync job
    // For now, we'll just return a mock status
    
    res.status(200).json({
      syncId,
      status: 'in_progress',
      progress: 65,
      started_at: new Date(parseInt(syncId.split('-')[1])),
      activities_processed: 32,
      activities_total: 50
    });
  } catch (error) {
    console.error(`[Strava API] Get sync status error:`, error);
    
    res.status(500).json({
      error: 'Sync Status Error',
      message: 'Failed to get sync status',
      requestId: req.requestId
    });
  }
});

/**
 * Get Strava integration stats
 * GET /api/v1/strava/stats
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get stats from database
    const stats = await dbManager.executeQuery(
      async () => {
        const db = await dbManager.connectMongoose();
        const Routes = db.model('Route');
        
        const totalRoutes = await Routes.countDocuments({ 
          user_id: userId, 
          source: 'strava' 
        });
        
        const totalDistance = await Routes.aggregate([
          { $match: { user_id: userId, source: 'strava' } },
          { $group: { _id: null, total: { $sum: '$distance' } } }
        ]);
        
        const totalElevation = await Routes.aggregate([
          { $match: { user_id: userId, source: 'strava' } },
          { $group: { _id: null, total: { $sum: '$elevation_gain' } } }
        ]);
        
        return {
          total_routes: totalRoutes,
          total_distance: totalDistance[0]?.total || 0,
          total_elevation: totalElevation[0]?.total || 0
        };
      },
      'stravaStats',
      { cacheKey: `strava:stats:${userId}`, cacheTTL: 60 * 60 * 1000 }
    );
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('[Strava API] Get stats error:', error);
    
    res.status(500).json({
      error: 'Stats Error',
      message: 'Failed to get Strava integration stats',
      requestId: req.requestId
    });
  }
});

module.exports = router;
