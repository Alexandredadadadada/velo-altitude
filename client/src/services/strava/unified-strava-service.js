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
 */

import { ApiService } from '../api/api.service';
import { StorageService } from '../storage/storage.service';

class UnifiedStravaService {
  constructor(config = {}) {
    this.config = {
      clientId: process.env.REACT_APP_STRAVA_CLIENT_ID,
      // clientSecret: process.env.REACT_APP_STRAVA_CLIENT_SECRET, // REMOVED FOR SECURITY
      // Updated redirectUri to point to the backend Netlify Function handler
      redirectUri: `${window.location.origin}/.netlify/functions/strava-callback`, 
      scopes: ['read', 'activity:read', 'profile:read_all'],
      tokenStorageKey: 'velo_altitude_strava_token', // Might be managed by central auth now
      authUrl: 'https://www.strava.com/oauth/authorize',
      tokenUrl: 'https://www.strava.com/oauth/token', // Handled by backend
      athleteUrl: 'https://www.strava.com/api/v3/athlete' // Handled by backend?
    };
    this.apiService = ApiService.getInstance();
    this.storageService = StorageService.getInstance();
    this.authState = { // This state management might need review based on central auth
      isAuthenticated: false,
      athlete: null,
      tokenData: null
    };
    
    // Initialize state from storage?
    // this.loadAuthState(); 
  }

  // ... (other methods like getInstance, loadAuthState, _storeToken, logout might remain)

  /**
   * Initiates the Strava OAuth authentication flow by redirecting the user.
   */
  authenticate() {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(','),
      approval_prompt: 'auto' // or 'force'
    });

    const authUrl = `${this.config.authUrl}?${params.toString()}`;
    
    // Redirect the user's browser to Strava
    window.location.href = authUrl;
    // No return value needed, the browser navigates away.
  }

  /**
   * Handles the callback from Strava after user authorization.
   * This is now primarily handled by the backend Netlify Function.
   * The frontend might just need to check authentication status after redirect.
   */
  async handleCallback() {
    // The actual code exchange happens in netlify/functions/strava-callback.js
    // This function might be called on the page the user lands on after the backend callback redirect.
    // It could potentially check if the user is now authenticated via the main auth system.
    console.log("Returned from Strava callback flow. Checking authentication status.");
    // Example: Trigger a check with the main auth service
    // await authService.checkSession(); 
    // return authService.isAuthenticated;
    return true; // Placeholder
  }


  /**
   * Exchanges the authorization code for access and refresh tokens.
   * --- THIS IS NOW HANDLED BY THE BACKEND NETLIFY FUNCTION --- 
   * This method should no longer be called directly from the frontend.
   */
  async exchangeCodeForToken(code) {
     console.error("[UnifiedStravaService] exchangeCodeForToken should not be called from the frontend.");
     throw new Error("Strava code exchange must be handled by the backend for security."); 
  }

  /**
   * Refreshes the Strava access token using the refresh token.
   * --- THIS SHOULD BE HANDLED BY THE BACKEND --- 
   * Potentially via a dedicated Netlify function like auth-refresh.js or similar.
   */
  async _refreshToken(refreshToken) {
    console.error("[UnifiedStravaService] _refreshToken should be handled by the backend.");
    throw new Error("Strava token refresh must be handled by the backend for security."); 
  }

  /**
   * Fetches athlete information from Strava.
   * TODO: Determine if this should call Strava directly (needs token) or go via your backend.
   * Going via the backend is generally more secure and robust.
   */
  async _fetchAthleteInfo() {
    // Placeholder - Requires valid token management first
    console.warn("[UnifiedStravaService] _fetchAthleteInfo needs implementation based on backend strategy.");
    // const token = this.authState.tokenData?.access_token;
    // if (!token) throw new Error('Not authenticated');
    // const athleteData = await this.apiService.get('strava', '/athlete', { /* headers with token */ });
    // this.authState.athlete = athleteData;
    // return athleteData;
    return null;
  }

  /**
   * Obtient les activités récentes
   */
  async getActivities(params = {}) {
    const defaultParams = {
      per_page: 30,
      page: 1
    };
    
    const queryParams = { ...defaultParams, ...params };
    
    // TODO: Determine if this should call Strava directly (needs token) or go via your backend.
    // Going via the backend is generally more secure and robust.
    // For now, it's left as is, assuming the token is handled correctly elsewhere.
    return this._makeStravaApiRequest('/athlete/activities', {
      method: 'GET',
      params: queryParams
    });
  }

  /**
   * Obtient une activité spécifique par ID
   */
  async getActivity(activityId, includeEfforts = false) {
    // TODO: Determine if this should call Strava directly (needs token) or go via your backend.
    // Going via the backend is generally more secure and robust.
    // For now, it's left as is, assuming the token is handled correctly elsewhere.
    return this._makeStravaApiRequest(`/activities/${activityId}`, {
      method: 'GET',
      params: {
        include_all_efforts: includeEfforts
      }
    });
  }

  /**
   * Obtient les itinéraires de l'athlète
   */
  async getRoutes() {
    if (!this.isAuthenticated() || !this.authState.athlete) {
      throw new Error('Not authenticated');
    }
    
    const athleteId = this.authState.athlete.id;
    
    // TODO: Determine if this should call Strava directly (needs token) or go via your backend.
    // Going via the backend is generally more secure and robust.
    // For now, it's left as is, assuming the token is handled correctly elsewhere.
    return this._makeStravaApiRequest(`/athletes/${athleteId}/routes`, {
      method: 'GET'
    });
  }

  /**
   * Télécharge un itinéraire au format GPX
   */
  async getRouteGpx(routeId) {
    // TODO: Determine if this should call Strava directly (needs token) or go via your backend.
    // Going via the backend is generally more secure and robust.
    // For now, it's left as is, assuming the token is handled correctly elsewhere.
    return this._makeStravaApiRequest(`/routes/${routeId}/export_gpx`, {
      method: 'GET',
      responseType: 'text'
    });
  }

  /**
   * Crée un nouvel itinéraire basé sur une activité
   */
  async createRoute(name, description, activityId) {
    // TODO: Determine if this should call Strava directly (needs token) or go via your backend.
    // Going via the backend is generally more secure and robust.
    // For now, it's left as is, assuming the token is handled correctly elsewhere.
    return this._makeStravaApiRequest('/routes', {
      method: 'POST',
      body: {
        name,
        description,
        activity_id: activityId
      }
    });
  }

  /**
   * Effectue une demande à l'API Strava
   */
  async _makeStravaApiRequest(endpoint, options = {}) {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Strava');
    }
    
    const url = `https://www.strava.com/api/v3${endpoint}`;
    
    // Préparer les options avec le token d'authentification
    const requestOptions = {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${this.authState.tokenData?.access_token}`
      }
    };
    
    try {
      return await this.apiService.executeRequest('strava', url, requestOptions);
    } catch (error) {
      // Si l'erreur est due à un token expiré, essayer de le rafraîchir
      if (error.message.includes('401') && this.config.refreshTokenAutomatically) {
        console.log('[UnifiedStravaService] Token expired during request, refreshing...');
        
        await this._refreshToken(this.authState.tokenData?.refresh_token);
        
        // Retenter avec le nouveau token
        requestOptions.headers.Authorization = `Bearer ${this.authState.tokenData?.access_token}`;
        return await this.apiService.executeRequest('strava', url, requestOptions);
      }
      
      throw error;
    }
  }

  /**
   * Convertit les données Strava en format compatible avec Velo-Altitude
   */
  formatActivityForVeloAltitude(activity) {
    if (!activity) return null;
    
    return {
      id: activity.id,
      externalId: `strava-${activity.id}`,
      name: activity.name,
      type: activity.type,
      startDate: activity.start_date,
      description: activity.description || '',
      distance: activity.distance / 1000, // Convertir en km
      duration: activity.moving_time,
      elevationGain: activity.total_elevation_gain,
      averageSpeed: activity.average_speed * 3.6, // Convertir en km/h
      maxSpeed: activity.max_speed * 3.6, // Convertir en km/h
      calories: activity.calories || 0,
      location: {
        startLatitude: activity.start_latitude,
        startLongitude: activity.start_longitude,
        endLatitude: activity.end_latitude,
        endLongitude: activity.end_longitude,
      },
      polyline: activity.map?.polyline || activity.map?.summary_polyline || '',
      isRace: activity.workout_type === 1,
      kudosCount: activity.kudos_count,
      source: 'strava'
    };
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  isAuthenticated() {
    if (!this.authState.isAuthenticated || !this.authState.tokenData) {
      return false;
    }
    
    // Vérifier si le token est expiré
    if (this.authState.tokenData.expires_at * 1000 <= Date.now()) {
      if (this.config.refreshTokenAutomatically && this.authState.tokenData.refresh_token) {
        // Token expiré mais on peut le rafraîchir
        console.log('[UnifiedStravaService] Token expired, refreshing...');
        this._refreshToken(this.authState.tokenData.refresh_token)
          .catch(() => {
            // Échec silencieux, l'erreur est déjà journalisée dans _refreshToken
          });
      }
      
      return false;
    }
    
    return true;
  }

  /**
   * Déconnecte l'utilisateur
   */
  logout() {
    this.authState = { 
      isAuthenticated: false,
      athlete: null,
      tokenData: null
    };
    
    localStorage.removeItem(this.config.tokenStorageKey);
    
    console.log('[UnifiedStravaService] Logged out');
    
    return true;
  }

}

// Singleton pattern implementation (if used)
let instance = null;

export const UnifiedStravaServiceFactory = {
  getInstance: (config) => {
    if (!instance) {
      instance = new UnifiedStravaService(config);
    }
    return instance;
  }
};
