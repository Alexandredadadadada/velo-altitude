/**
 * Service d'intégration Strava
 * 
 * Fonctionnalités:
 * - Authentification et gestion des tokens
 * - Récupération des activités avec mise en cache
 * - Synchronisation bidirectionnelle
 * - Gestion des webhooks pour les mises à jour en temps réel
 * - Conversion et normalisation des données
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosHeaders } from 'axios';
import tokenManager from './StravaTokenManager';
import { default as cacheService } from '../cache';
import { monitoringService } from '../monitoring';
import {
  StravaActivity,
  StravaActivityDetail,
  StravaAthlete,
  StravaRoute,
  StravaSegment,
  StravaTokens,
  ActivityOptions,
  ActivityType,
  StoredActivity,
  SyncStatus,
  SyncResult,
  SyncConfig
} from './types';

// Étendre le type AxiosRequestConfig pour inclure metadata
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      userId: string;
      [key: string]: any;
    };
  }
}

// Configuration par défaut
const DEFAULT_CONFIG = {
  apiBaseUrl: 'https://www.strava.com/api/v3',
  cacheTTL: {
    activities: 3600,       // 1 heure
    activityDetail: 86400,  // 24 heures
    athlete: 86400,         // 24 heures
    routes: 86400,          // 24 heures
    stats: 3600,            // 1 heure
  },
  rateLimiting: {
    maxRequestsPerMinute: 180,   // Limite Strava par 15 minutes: 100 + 1000/jour
    maxRequestsPerDay: 1000,
  },
  sync: {
    initialSyncDays: 90,              // Synchroniser les 90 derniers jours
    autoSyncEnabled: true,            // Activer la synchronisation automatique
    autoSyncInterval: 60,             // En minutes
    forceResyncAfterDays: 30,         // Forcer une resynchronisation complète après 30 jours
    maxActivitiesPerSync: 100,        // Limite par synchronisation
  } as SyncConfig
};

/**
 * Service principal d'intégration Strava
 */
export class StravaService {
  private apiClient: AxiosInstance;
  private syncConfig: SyncConfig;
  private syncStatus: Map<string, SyncStatus> = new Map();
  private rateLimitRemaining: number = DEFAULT_CONFIG.rateLimiting.maxRequestsPerMinute;
  private rateLimitReset: number = 0;
  
  /**
   * Constructeur
   * @param syncConfig Configuration de synchronisation (optionnel)
   */
  constructor(syncConfig: Partial<SyncConfig> = {}) {
    // Configurer la synchronisation
    this.syncConfig = { ...DEFAULT_CONFIG.sync, ...syncConfig };
    
    // Initialiser le client API
    this.apiClient = axios.create({
      baseURL: DEFAULT_CONFIG.apiBaseUrl,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    // Intercepteur pour la gestion des tokens
    this.apiClient.interceptors.request.use(async (config) => {
      // Vérifier si l'utilisateur est présent dans les métadonnées
      const userId = config.metadata?.userId;
      if (!userId) {
        throw new Error('StravaService: userId manquant dans les métadonnées de la requête');
      }
      
      // Récupérer un token valide
      const tokens = await tokenManager.getValidTokens(userId as string);
      if (!tokens) {
        throw new Error('StravaService: utilisateur non connecté à Strava');
      }
      
      // Ajouter le token à la requête
      if (!config.headers) {
        config.headers = new AxiosHeaders();
      }
      config.headers.set('Authorization', `Bearer ${tokens.accessToken}`);
      
      return config;
    });
    
    // Intercepteur pour la gestion des limites de débit et des erreurs
    this.apiClient.interceptors.response.use(
      (response) => {
        // Mettre à jour les informations de limite de débit
        this.updateRateLimitInfo(response.headers);
        return response;
      },
      async (error) => {
        if (axios.isAxiosError(error) && error.response) {
          // Mettre à jour les informations de limite de débit
          this.updateRateLimitInfo(error.response.headers);
          
          // Gérer les erreurs spécifiques
          const status = error.response.status;
          const data = error.response.data;
          
          if (status === 401) {
            // Token expiré ou invalide
            const userId = error.config.metadata?.userId as string;
            if (userId) {
              // Tentative de rafraîchissement du token
              const tokens = await tokenManager.getTokens(userId);
              if (tokens) {
                await tokenManager.refreshTokens(userId, tokens);
                
                // Réessayer la requête
                const newConfig = { ...error.config };
                delete newConfig.headers['Authorization'];
                return this.apiClient(newConfig);
              }
            }
          } else if (status === 429) {
            // Limite de débit atteinte
            const resetTime = parseInt(error.response.headers['x-ratelimit-reset'] as string || '0', 10);
            const waitTime = resetTime - Math.floor(Date.now() / 1000) + 2; // +2 secondes de marge
            
            console.warn(`StravaService: Limite de débit atteinte, attente de ${waitTime}s`);
            
            // Attendre et réessayer
            if (waitTime > 0 && waitTime < 60) {
              await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
              return this.apiClient(error.config);
            }
          }
          
          // Journaliser l'erreur
          console.error(`StravaService: Erreur API ${status}`, {
            status,
            message: data.message,
            errors: data.errors,
            endpoint: error.config?.url,
          });
          
          // Construire un message d'erreur convivial
          let errorMessage = 'Erreur lors de la communication avec Strava';
          if (data.message) {
            errorMessage = `Strava: ${data.message}`;
          } else if (status === 401) {
            errorMessage = 'Authentification Strava expirée. Veuillez vous reconnecter.';
          } else if (status === 403) {
            errorMessage = 'Accès refusé par Strava. Vérifiez vos autorisations.';
          } else if (status === 404) {
            errorMessage = 'Ressource non trouvée sur Strava.';
          } else if (status === 429) {
            errorMessage = 'Limite de requêtes Strava atteinte. Veuillez réessayer plus tard.';
          } else if (status >= 500) {
            errorMessage = 'Service Strava temporairement indisponible. Veuillez réessayer plus tard.';
          }
          
          monitoringService.trackError('strava_api_error', new Error(errorMessage), {
            status,
            stravaMessage: data.message,
            endpoint: error.config?.url,
          });
          
          const enhancedError = new Error(errorMessage);
          (enhancedError as any).status = status;
          (enhancedError as any).stravaErrors = data.errors;
          
          throw enhancedError;
        }
        
        // Erreur non liée à Axios (réseau, etc.)
        console.error('StravaService: Erreur non-API', error);
        monitoringService.trackError('strava_network_error', error as Error);
        
        throw error;
      }
    );
    
    console.info('StravaService: Initialisé avec succès');
  }
  
  /**
   * Met à jour les informations de limite de débit
   * @param headers En-têtes de réponse HTTP
   * @private
   */
  private updateRateLimitInfo(headers: any): void {
    const remaining = headers['x-ratelimit-limit'] as string;
    const reset = headers['x-ratelimit-reset'] as string;
    
    if (remaining !== undefined) {
      this.rateLimitRemaining = parseInt(remaining, 10);
    }
    
    if (reset !== undefined) {
      this.rateLimitReset = parseInt(reset, 10);
    }
  }
  
  /**
   * Vérifie si un utilisateur est connecté à Strava
   * @param userId ID de l'utilisateur
   * @returns true si connecté, false sinon
   */
  async isConnected(userId: string): Promise<boolean> {
    return tokenManager.isConnected(userId);
  }
  
  /**
   * Crée une URL d'autorisation pour l'authentification OAuth
   * @param redirectUri URI de redirection après autorisation
   * @param state État pour la validation CSRF
   * @returns URL d'autorisation
   */
  createAuthorizationUrl(redirectUri: string, state?: string): string {
    return tokenManager.createAuthorizationUrl(
      redirectUri,
      ['read', 'activity:read_all', 'profile:read_all', 'read_all'],
      state
    );
  }
  
  /**
   * Traite le code d'autorisation après l'authentification OAuth
   * @param code Code d'autorisation
   * @param userId ID de l'utilisateur
   * @returns true si succès, false sinon
   */
  async handleAuthorizationCode(code: string, userId: string): Promise<boolean> {
    const tokens = await tokenManager.handleAuthorizationCode(code, userId);
    return tokens !== null;
  }
  
  /**
   * Révoque l'accès Strava d'un utilisateur
   * @param userId ID de l'utilisateur
   * @returns true si succès, false sinon
   */
  async disconnect(userId: string): Promise<boolean> {
    return tokenManager.revokeAccess(userId);
  }
  
  /**
   * Récupère le profil de l'athlète
   * @param userId ID de l'utilisateur
   * @returns Données du profil athlète
   */
  async getAthleteProfile(userId: string): Promise<StravaAthlete> {
    const cacheKey = `strava:athlete:${userId}`;
    
    try {
      // Vérifier le cache d'abord
      const cachedProfile = await cacheService.get(cacheKey);
      if (cachedProfile) {
        return cachedProfile as unknown as StravaAthlete;
      }
      
      // Récupérer depuis l'API
      const response = await this.apiClient.get('/athlete', {
        metadata: { userId } as any
      });
      
      const profile = response.data as StravaAthlete;
      
      // Mettre en cache
      await cacheService.set(cacheKey, profile, {
        ttl: 24 * 60 * 60 // 24 heures
      });
      
      return profile;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil athlète', error);
      throw error;
    }
  }
  
  /**
   * Récupère les activités de l'utilisateur
   * @param userId ID de l'utilisateur
   * @param options Options de filtrage et pagination
   * @returns Liste des activités
   */
  async getActivities(userId: string, options: ActivityOptions = {}): Promise<StravaActivity[]> {
    const {
      page = 1,
      perPage = 30,
      before,
      after,
      types,
    } = options;
    
    // Paramètres de requête
    const params: Record<string, any> = {
      page,
      per_page: perPage,
    };
    
    if (before) {
      params.before = typeof before === 'number' ? before : Math.floor(before.getTime() / 1000);
    }
    
    if (after) {
      params.after = typeof after === 'number' ? after : Math.floor(after.getTime() / 1000);
    }
    
    const cacheKey = `strava:activities:${userId}:${JSON.stringify(params)}`;
    
    try {
      // Vérifier le cache d'abord
      const cachedActivities = await cacheService.get(cacheKey);
      if (cachedActivities) {
        // Filtrer par type si spécifié
        const activities = cachedActivities as unknown as StravaActivity[];
        if (types && types.length > 0) {
          return activities.filter(activity => 
            types.includes(activity.sport_type as ActivityType)
          );
        }
        return activities;
      }
      
      // Récupérer depuis l'API
      const response = await this.apiClient.get('/athlete/activities', {
        params,
        metadata: { userId } as any
      });
      
      let activities = response.data as StravaActivity[];
      
      // Filtrer par type si spécifié
      if (types && types.length > 0) {
        activities = activities.filter(activity => 
          types.includes(activity.sport_type as ActivityType)
        );
      }
      
      console.info(`StravaService: Récupéré ${activities.length} activités pour l'utilisateur ${userId}`);
      
      // Mettre en cache
      await cacheService.set(cacheKey, activities, {
        ttl: 60 * 60 // 1 heure
      });
      
      return activities;
    } catch (error) {
      console.error('Erreur lors de la récupération des activités', error);
      throw error;
    }
  }
  
  /**
   * Récupère les détails d'une activité spécifique
   * @param userId ID de l'utilisateur
   * @param activityId ID de l'activité Strava
   * @returns Détails de l'activité
   */
  async getDetailedActivity(userId: string, activityId: number): Promise<StravaActivityDetail> {
    const cacheKey = `strava:activity:${activityId}`;
    
    try {
      // Vérifier le cache d'abord
      const cachedActivity = await cacheService.get(cacheKey);
      if (cachedActivity) {
        return cachedActivity as unknown as StravaActivityDetail;
      }
      
      // Récupérer depuis l'API
      const response = await this.apiClient.get(`/activities/${activityId}`, {
        params: { include_all_efforts: true },
        metadata: { userId } as any
      });
      
      const activityDetail = response.data as StravaActivityDetail;
      
      // Mettre en cache
      await cacheService.set(cacheKey, activityDetail, {
        ttl: 24 * 60 * 60 // 24 heures
      });
      
      return activityDetail;
    } catch (error) {
      console.error(`Erreur lors de la récupération des détails de l'activité ${activityId}`, error);
      throw error;
    }
  }
  
  /**
   * Récupère les routes de l'utilisateur
   * @param userId ID de l'utilisateur
   * @returns Liste des routes
   */
  async getRoutes(userId: string): Promise<StravaRoute[]> {
    const cacheKey = `strava:routes:${userId}`;
    
    try {
      // Vérifier le cache d'abord
      const cachedRoutes = await cacheService.get(cacheKey);
      if (cachedRoutes) {
        return cachedRoutes as unknown as StravaRoute[];
      }
      
      // Récupérer depuis l'API
      const response = await this.apiClient.get(`/athletes/${userId}/routes`, {
        metadata: { userId } as any
      });
      
      const routes = response.data as StravaRoute[];
      
      // Mettre en cache
      await cacheService.set(cacheKey, routes, {
        ttl: 24 * 60 * 60 // 24 heures
      });
      
      return routes;
    } catch (error) {
      console.error(`Erreur lors de la récupération des routes pour ${userId}`, error);
      throw error;
    }
  }
  
  /**
   * Récupère le détail d'une route
   * @param userId ID de l'utilisateur
   * @param routeId ID de la route
   * @returns Détail de la route
   */
  async getRouteDetail(userId: string, routeId: number): Promise<StravaRoute> {
    const cacheKey = `strava:route:${routeId}`;
    
    try {
      // Vérifier le cache d'abord
      const cachedRoute = await cacheService.get(cacheKey);
      if (cachedRoute) {
        return cachedRoute as unknown as StravaRoute;
      }
      
      // Récupérer depuis l'API
      const response = await this.apiClient.get(`/routes/${routeId}`, {
        metadata: { userId } as any
      });
      
      const route = response.data as StravaRoute;
      
      // Mettre en cache
      await cacheService.set(cacheKey, route, {
        ttl: 24 * 60 * 60 // 24 heures
      });
      
      return route;
    } catch (error) {
      console.error(`Erreur lors de la récupération du détail de la route ${routeId}`, error);
      throw error;
    }
  }
  
  /**
   * Synchronise les activités Strava pour un utilisateur
   * @param userId ID de l'utilisateur
   * @param config Configuration de synchronisation (options)
   * @returns Résultat de la synchronisation
   */
  async syncActivities(userId: string, config: Partial<SyncConfig> = {}): Promise<SyncResult> {
    const startTime = Date.now();
    
    // Fusionner avec la configuration par défaut
    const mergedConfig: SyncConfig = {
      ...this.syncConfig,
      ...config
    };
    
    try {
      // Récupérer la dernière date de synchronisation
      let lastSyncDate = await this.getLastSyncDate(userId);
      const isInitialSync = !lastSyncDate;
      
      // Pour une synchronisation initiale, utiliser la période configurée
      // Sinon, synchroniser à partir de la dernière synchronisation
      const syncFromDate = isInitialSync
        ? new Date(Date.now() - mergedConfig.initialSyncDays * 24 * 60 * 60 * 1000)
        : lastSyncDate;
      
      // Vérifier si une resynchronisation complète est nécessaire
      const forceResync = mergedConfig.forceResyncAfterDays > 0 && lastSyncDate && 
        (Date.now() - lastSyncDate.getTime() > mergedConfig.forceResyncAfterDays * 24 * 60 * 60 * 1000);
      
      // Options de récupération
      const options: ActivityOptions = {
        after: forceResync ? syncFromDate : lastSyncDate,
        perPage: 100
      };
      
      console.info(`StravaService: Démarrage de la synchronisation pour ${userId} depuis ${options.after}`);
      
      let activitiesCount = 0;
      let page = 1;
      let allActivities: StravaActivity[] = [];
      let hasMoreActivities = true;
      
      // Récupérer toutes les activités par pages
      while (hasMoreActivities && activitiesCount < mergedConfig.maxActivitiesPerSync) {
        options.page = page;
        const activities = await this.getActivities(userId, options);
        
        if (activities.length === 0) {
          hasMoreActivities = false;
        } else {
          allActivities = [...allActivities, ...activities];
          activitiesCount += activities.length;
          page++;
        }
      }
      
      console.info(`StravaService: Récupéré ${activitiesCount} activités pour ${userId}`);
      
      // Traiter les activités
      const processedActivities = await Promise.all(
        allActivities.map(async (activity) => {
          try {
            // Récupérer les détails complets de l'activité
            const detailedActivity = await this.getDetailedActivity(userId, activity.id);
            
            // Convertir en format StoredActivity
            const storedActivity: StoredActivity = this.convertToStoredActivity(detailedActivity);
            
            // Sauvegarder dans la base de données (à implémenter selon le backend)
            // await this.saveActivity(userId, storedActivity);
            
            return storedActivity;
          } catch (error) {
            console.error(`Erreur lors du traitement de l'activité ${activity.id}`, error);
            return null;
          }
        })
      );
      
      // Filtrer les traitements échoués
      const successfulActivities = processedActivities.filter(a => a !== null) as StoredActivity[];
      
      // Mettre à jour la date de dernière synchronisation
      await this.updateLastSyncDate(userId);
      
      // Calculer les statistiques
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const result: SyncResult = {
        userId,
        status: SyncStatus.SUCCESS,
        syncedActivitiesCount: successfulActivities.length,
        totalActivitiesCount: activitiesCount,
        failedActivitiesCount: activitiesCount - successfulActivities.length,
        duration,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        isInitialSync
      };
      
      console.info(`StravaService: Synchronisation terminée pour ${userId}`, result);
      return result;
    } catch (error) {
      const endTime = Date.now();
      console.error(`Erreur lors de la synchronisation pour ${userId}`, error);
      
      return {
        userId,
        status: SyncStatus.ERROR,
        syncedActivitiesCount: 0,
        totalActivitiesCount: 0,
        failedActivitiesCount: 0,
        error: error instanceof Error ? error.message : String(error),
        duration: endTime - startTime,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        isInitialSync: false
      };
    }
  }
  
  /**
   * Récupère la date de dernière synchronisation
   * @param userId ID de l'utilisateur
   * @private
   */
  private async getLastSyncDate(userId: string): Promise<Date | null> {
    // À implémenter selon le stockage utilisé (base de données, cache, etc.)
    // Par exemple, depuis le cache :
    const lastSync = await cacheService.get(`strava:last_sync:${userId}`);
    if (lastSync) {
      return new Date(lastSync as unknown as number);
    }
    return null;
  }
  
  /**
   * Met à jour la date de dernière synchronisation
   * @param userId ID de l'utilisateur
   * @private
   */
  private async updateLastSyncDate(userId: string): Promise<void> {
    // À implémenter selon le stockage utilisé
    // Par exemple, avec le cache :
    await cacheService.set(`strava:last_sync:${userId}`, Date.now(), {
      ttl: 365 * 24 * 60 * 60 // 1 an
    });
  }
  
  /**
   * Convertit une activité Strava en format StoredActivity
   * @param activity Activité Strava complète
   * @private
   */
  private convertToStoredActivity(activity: StravaActivityDetail): StoredActivity {
    return {
      id: activity.id.toString(),
      stravaId: activity.id,
      name: activity.name,
      description: activity.description || '',
      type: activity.sport_type as ActivityType,
      distance: activity.distance,
      movingTime: activity.moving_time,
      elapsedTime: activity.elapsed_time,
      totalElevationGain: activity.total_elevation_gain,
      startDate: new Date(activity.start_date),
      startDateLocal: new Date(activity.start_date_local),
      timezone: activity.timezone,
      startCoordinates: activity.start_latlng || [0, 0],
      endCoordinates: activity.end_latlng || [0, 0],
      achievementCount: activity.achievement_count || 0,
      kudosCount: activity.kudos_count || 0,
      commentCount: activity.comment_count || 0,
      athleteCount: activity.athlete_count || 0,
      photoCount: activity.total_photo_count || 0,
      map: activity.map ? {
        id: activity.map.id,
        summaryPolyline: activity.map.summary_polyline || '',
        polyline: activity.map.polyline || ''
      } : null,
      trainer: activity.trainer,
      commute: activity.commute,
      manual: activity.manual,
      private: activity.private,
      flagged: activity.flagged,
      averageSpeed: activity.average_speed,
      maxSpeed: activity.max_speed,
      averageWatts: activity.average_watts,
      maxWatts: activity.max_watts,
      weightedAverageWatts: activity.weighted_average_watts,
      kilojoules: activity.kilojoules,
      deviceWatts: activity.device_watts,
      hasHeartrate: activity.has_heartrate,
      averageHeartrate: activity.average_heartrate,
      maxHeartrate: activity.max_heartrate,
      segmentEfforts: activity.segment_efforts ? activity.segment_efforts.map(effort => ({
        id: effort.id,
        name: effort.name,
        elapsedTime: effort.elapsed_time,
        distance: effort.distance,
        startDate: new Date(effort.start_date),
        averageWatts: effort.average_watts,
        segmentId: effort.segment.id
      })) : [],
      splitsMetric: activity.splits_metric ? activity.splits_metric.map(split => ({
        distance: split.distance,
        elapsedTime: split.elapsed_time,
        elevationDifference: split.elevation_difference,
        movingTime: split.moving_time,
        split: split.split,
        averageSpeed: split.average_speed,
        averageHeartrate: split.average_heartrate,
        paceZone: split.pace_zone
      })) : [],
      bestEfforts: activity.best_efforts ? activity.best_efforts.map(effort => ({
        id: effort.id,
        name: effort.name,
        elapsedTime: effort.elapsed_time,
        distance: effort.distance,
        startDate: new Date(effort.start_date)
      })) : [],
      laps: activity.laps ? activity.laps.map(lap => ({
        id: lap.id,
        name: lap.name || `Lap ${lap.lap_index}`,
        elapsedTime: lap.elapsed_time,
        movingTime: lap.moving_time,
        distance: lap.distance,
        startDate: new Date(lap.start_date),
        averageSpeed: lap.average_speed,
        maxSpeed: lap.max_speed,
        averageWatts: lap.average_watts,
        averageHeartrate: lap.average_heartrate,
        maxHeartrate: lap.max_heartrate
      })) : [],
      gearId: activity.gear_id,
      deviceName: activity.device_name || '',
      embedToken: activity.embed_token || '',
      calories: activity.calories || 0,
      source: 'strava',
      syncDate: new Date(),
      rawData: JSON.stringify(activity)
    };
  }
}
