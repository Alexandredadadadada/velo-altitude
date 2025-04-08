/**
 * Service Strava Unifié
 * 
 * Ce service consolide toutes les fonctionnalités d'intégration Strava
 * précédemment dispersées dans plusieurs fichiers.
 * 
 * Fonctionnalités:
 * - Authentification OAuth avec Strava
 * - Gestion des activités et des itinéraires
 * - Synchronisation des défis
 * - Gestion du cache pour optimiser les requêtes API
 * - Analyse et conversion des données
 * - Optimisation des performances et de la sécurité
 */

import { UnifiedAPIService } from '../api/unified-api-service';

class UnifiedStravaService {
  constructor(config = {}) {
    this.config = {
      clientId: process.env.REACT_APP_STRAVA_CLIENT_ID,
      redirectUri: process.env.REACT_APP_STRAVA_REDIRECT_URI || window.location.origin + '/.netlify/functions/strava-callback',
      scopes: ['read', 'activity:read', 'profile:read_all'],
      tokenStorageKey: 'velo_altitude_strava_token',
      cacheEnabled: true,
      cacheTtl: 15 * 60 * 1000, // 15 minutes
      activityCacheTtl: 30 * 60 * 1000, // 30 minutes
      profileCacheTtl: 60 * 60 * 1000, // 60 minutes
      retryAttempts: 3,
      retryDelay: 1000,
      tokenRefreshThreshold: 600, // Refresh token if less than 10 minutes until expiry
      ...config
    };
    
    this.apiService = new UnifiedAPIService({
      cacheEnabled: this.config.cacheEnabled,
      monitoringEnabled: true,
      retryConfig: {
        maxRetries: this.config.retryAttempts,
        baseDelay: this.config.retryDelay,
        retryableStatusCodes: [408, 429, 500, 502, 503, 504]
      }
    });
    
    this.apiService.registerAPI('strava', {
      quota: {
        daily: 1000,
        fifteenMinutes: 100
      },
      baseURL: 'https://www.strava.com/api/v3',
      defaultHeaders: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    this.authState = {
      authenticated: false,
      token: null,
      athlete: null,
      lastTokenRefresh: null
    };
    
    this.metrics = {
      apiCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      tokenRefreshes: 0
    };
    
    this._loadStoredToken();
    console.log('[UnifiedStravaService] Initialized');
  }
  
  /**
   * Load stored authentication token from localStorage
   * @private
   */
  _loadStoredToken() {
    try {
      const storedTokenData = localStorage.getItem(this.config.tokenStorageKey);
      if (!storedTokenData) return;
      
      const tokenInfo = JSON.parse(storedTokenData);
      
      // Validate token structure
      if (!tokenInfo.access_token || !tokenInfo.refresh_token || !tokenInfo.expires_at) {
        this._clearTokenData();
        return;
      }
      
      // Check if token is expired
      const expiresAt = tokenInfo.expires_at * 1000; // Convert to milliseconds
      const now = Date.now();
      
      if (expiresAt <= now) {
        // Token is expired, will be refreshed on next API call
        this.authState.token = tokenInfo;
        this.authState.authenticated = false;
        console.log('[UnifiedStravaService] Stored token is expired, will refresh on next API call');
      } else {
        this.authState.token = tokenInfo;
        this.authState.authenticated = true;
        console.log('[UnifiedStravaService] Loaded valid token from storage');
      }
    } catch (error) {
      console.error('[UnifiedStravaService] Error loading stored token:', error);
      this._clearTokenData();
    }
  }
  
  /**
   * Clear token data from localStorage and reset auth state
   * @private
   */
  _clearTokenData() {
    localStorage.removeItem(this.config.tokenStorageKey);
    this.authState.token = null;
    this.authState.authenticated = false;
    this.authState.athlete = null;
  }
  
  /**
   * Get Strava OAuth authorization URL
   * @returns {string} Authorization URL
   */
  getAuthUrl() {
    // Generate a random state for CSRF protection
    const state = this._generateRandomState();
    localStorage.setItem('strava_auth_state', state);
    
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      approval_prompt: 'auto',
      scope: this.config.scopes.join(','),
      state: state
    });
    
    return `https://www.strava.com/oauth/authorize?${params.toString()}`;
  }
  
  /**
   * Generate random state string for CSRF protection
   * @private
   * @returns {string} Random state string
   */
  _generateRandomState() {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  /**
   * Initiate Strava authentication flow
   */
  authenticate() {
    window.location.href = this.getAuthUrl();
  }
  
  /**
   * Handle authentication callback from Strava
   * @param {string} code - Authorization code
   * @param {string} state - State parameter for CSRF validation
   * @returns {Promise<Object>} Authentication result
   */
  async handleCallback(code, state) {
    // Verify state parameter to prevent CSRF attacks
    const storedState = localStorage.getItem('strava_auth_state');
    localStorage.removeItem('strava_auth_state');
    
    if (!storedState || storedState !== state) {
      throw new Error('Invalid state parameter, possible CSRF attack');
    }
    
    try {
      // Exchange code for token via backend endpoint
      const response = await fetch('/.netlify/functions/strava-token-exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      });
      
      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
      }
      
      const tokenData = await response.json();
      return this._handleTokenResponse(tokenData);
    } catch (error) {
      this.metrics.errors++;
      console.error('[UnifiedStravaService] Authentication error:', error);
      throw error;
    }
  }
  
  /**
   * Process token response and update auth state
   * @private
   * @param {Object} tokenData - Token response from Strava
   * @returns {Object} Processed token data
   */
  _handleTokenResponse(tokenData) {
    if (!tokenData || !tokenData.access_token) {
      throw new Error('Invalid token response');
    }
    
    this.authState.token = tokenData;
    this.authState.authenticated = true;
    this.authState.lastTokenRefresh = Date.now();
    
    // Store token securely
    localStorage.setItem(this.config.tokenStorageKey, JSON.stringify(tokenData));
    
    return tokenData;
  }
  
  /**
   * Check if user is authenticated with Strava
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    if (!this.authState.token) return false;
    
    const expiresAt = this.authState.token.expires_at * 1000;
    const now = Date.now();
    
    return expiresAt > now;
  }
  
  /**
   * Check if token needs refresh
   * @private
   * @returns {boolean} True if token needs refresh
   */
  _needsTokenRefresh() {
    if (!this.authState.token) return false;
    
    const expiresAt = this.authState.token.expires_at * 1000;
    const refreshThreshold = this.config.tokenRefreshThreshold * 1000;
    const now = Date.now();
    
    return expiresAt - now < refreshThreshold;
  }
  
  /**
   * Refresh authentication token
   * @private
   * @returns {Promise<Object>} Refreshed token
   */
  async _refreshToken() {
    if (!this.authState.token || !this.authState.token.refresh_token) {
      throw new Error('No refresh token available');
    }
    
    try {
      const response = await fetch('/.netlify/functions/strava-token-refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          refresh_token: this.authState.token.refresh_token 
        })
      });
      
      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
      }
      
      const tokenData = await response.json();
      this.metrics.tokenRefreshes++;
      
      return this._handleTokenResponse(tokenData);
    } catch (error) {
      this.metrics.errors++;
      console.error('[UnifiedStravaService] Token refresh error:', error);
      
      // If refresh fails, clear token data
      if (error.response && error.response.status === 401) {
        this._clearTokenData();
      }
      
      throw error;
    }
  }
  
  /**
   * Ensure valid token before making API requests
   * @private
   * @returns {Promise<string>} Valid access token
   */
  async _ensureValidToken() {
    if (!this.authState.token) {
      throw new Error('User not authenticated with Strava');
    }
    
    if (this._needsTokenRefresh()) {
      await this._refreshToken();
    }
    
    return this.authState.token.access_token;
  }
  
  /**
   * Get athlete activities from Strava
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} Athlete activities
   */
  async getAthleteActivities(params = {}) {
    try {
      const accessToken = await this._ensureValidToken();
      
      // Generate cache key based on params
      const cacheKey = `activities:${JSON.stringify(params)}`;
      
      this.metrics.apiCalls++;
      
      return this.apiService.request('strava', {
        method: 'GET',
        endpoint: '/athlete/activities',
        headers: { Authorization: `Bearer ${accessToken}` },
        params: params,
        cache: {
          enabled: this.config.cacheEnabled,
          key: cacheKey,
          ttl: this.config.activityCacheTtl
        },
        onSuccess: (data) => {
          // Process activities if needed
          return data;
        },
        onError: (error) => {
          this.metrics.errors++;
          
          if (error.response && error.response.status === 401) {
            this._clearTokenData();
          }
          
          throw error;
        }
      });
    } catch (error) {
      this.metrics.errors++;
      console.error('[UnifiedStravaService] Error fetching activities:', error);
      throw error;
    }
  }
  
  /**
   * Get activity details by ID
   * @param {string|number} activityId - Activity ID
   * @returns {Promise<Object>} Activity details
   */
  async getActivityById(activityId) {
    try {
      const accessToken = await this._ensureValidToken();
      
      this.metrics.apiCalls++;
      
      return this.apiService.request('strava', {
        method: 'GET',
        endpoint: `/activities/${activityId}`,
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: {
          enabled: this.config.cacheEnabled,
          key: `activity:${activityId}`,
          ttl: this.config.activityCacheTtl
        }
      });
    } catch (error) {
      this.metrics.errors++;
      console.error(`[UnifiedStravaService] Error fetching activity ${activityId}:`, error);
      throw error;
    }
  }

  /**
   * Disconnect from Strava
   */
  disconnectStrava() {
    this._clearTokenData();
    console.log('[UnifiedStravaService] Disconnected from Strava');
    
    // Optionally call backend to revoke token
    if (this.authState.token && this.authState.token.access_token) {
      fetch('/.netlify/functions/strava-disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          access_token: this.authState.token.access_token 
        })
      }).catch(error => {
        console.error('[UnifiedStravaService] Error revoking token:', error);
      });
    }
  }

  /**
   * Fetch athlete profile from Strava
   * @returns {Promise<Object>} Athlete profile
   */
  async fetchAthleteProfile() {
    if (this.authState.athlete && !this._isProfileExpired()) {
      return this.authState.athlete;
    }
    
    try {
      const accessToken = await this._ensureValidToken();
      
      this.metrics.apiCalls++;
      
      const profile = await this.apiService.request('strava', {
        method: 'GET',
        endpoint: '/athlete',
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: {
          enabled: this.config.cacheEnabled,
          key: 'athlete:profile',
          ttl: this.config.profileCacheTtl
        }
      });
      
      this.authState.athlete = {
        ...profile,
        _cachedAt: Date.now()
      };
      
      return profile;
    } catch (error) {
      this.metrics.errors++;
      console.error('[UnifiedStravaService] Error fetching athlete profile:', error);
      
      if (error.response && error.response.status === 401) {
        this._clearTokenData();
      }
      
      throw error;
    }
  }
  
  /**
   * Check if cached profile is expired
   * @private
   * @returns {boolean} True if profile is expired
   */
  _isProfileExpired() {
    if (!this.authState.athlete || !this.authState.athlete._cachedAt) {
      return true;
    }
    
    const now = Date.now();
    return now - this.authState.athlete._cachedAt > this.config.profileCacheTtl;
  }

  /**
   * Get current authentication token
   * @returns {Object|null} Authentication token
   */
  getToken() {
    return this.authState.token;
  }

  /**
   * Get athlete profile
   * @returns {Object|null} Athlete profile
   */
  getAthlete() {
    return this.authState.athlete;
  }
  
  /**
   * Get service metrics
   * @returns {Object} Service metrics
   */
  getMetrics() {
    const apiMetrics = this.apiService.getMetrics('strava');
    
    return {
      ...this.metrics,
      apiMetrics,
      cacheHitRatio: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0,
      authenticated: this.isAuthenticated(),
      tokenExpiresIn: this.authState.token ? 
        Math.max(0, Math.floor((this.authState.token.expires_at * 1000 - Date.now()) / 1000)) : 
        0
    };
  }
  
  /**
   * Convert Strava activity to route format
   * @param {Object} activity - Strava activity
   * @returns {Object} Route object
   */
  convertActivityToRoute(activity) {
    if (!activity) return null;
    
    return {
      id: `strava-${activity.id}`,
      name: activity.name,
      description: activity.description || '',
      distance: activity.distance,
      elevation_gain: activity.total_elevation_gain,
      start_latlng: activity.start_latlng,
      end_latlng: activity.end_latlng,
      map: activity.map,
      type: 'strava_activity',
      source: 'strava',
      source_id: activity.id,
      created_at: new Date(activity.start_date).toISOString(),
      athlete_id: activity.athlete.id,
      polyline: activity.map?.summary_polyline || '',
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
  }
}

export default UnifiedStravaService;
