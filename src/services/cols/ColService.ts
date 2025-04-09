/**
 * Service principal pour les cols
 * Gère l'accès aux données, la validation et la mise en cache
 */

import { ENV } from '../../config/environment';
import { monitoring } from '../monitoring';
import { 
  Col, 
  DetailedCol, 
  SearchCriteria, 
  ElevationProfile,
  PointOfInterest,
  TerrainData,
  RouteData,
  WeatherInfo,
  ColNotFoundError,
  UnifiedColData,
  Panorama
} from './types/ColTypes';
import { ColDataValidator } from './ColDataValidator';
import { ColErrorHandler } from './ColErrorHandler';

/**
 * Configuration de base du service
 */
const API_BASE_URL = ENV.app.apiUrl || '';
const MAPBOX_TOKEN = ENV.maps.mapboxToken;
const OPENROUTE_KEY = ENV.apiKeys.openroute;

/**
 * Interface pour le service de cache
 */
interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, data: T, ttl?: number): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Service principal pour la gestion des cols
 */
export class ColService {
  private validator: ColDataValidator;
  private errorHandler: ColErrorHandler;
  private cache: CacheService | null = null;

  /**
   * Constructeur du service des cols
   * @param cache Service de cache optionnel
   */
  constructor(cache?: CacheService) {
    this.validator = new ColDataValidator();
    this.errorHandler = new ColErrorHandler();
    this.cache = cache || null;
  }

  /**
   * Récupère les détails d'un col par son ID
   * @param colId ID du col
   * @returns Détails du col
   */
  async getColById(colId: string): Promise<Col> {
    try {
      // Vérifier le cache si disponible
      if (this.cache) {
        const cacheKey = `col:${colId}`;
        const cachedData = await this.cache.get<Col>(cacheKey);
        if (cachedData) {
          console.log(`Utilisation des données en cache pour le col ${colId}`);
          return cachedData;
        }
      }

      // Récupérer les données depuis l'API
      const response = await fetch(`${API_BASE_URL}/api/cols/${colId}`, {
        headers: {
          Authorization: `Bearer ${MAPBOX_TOKEN}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new ColNotFoundError(colId);
        }
        throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      monitoring.logApiCall('colService', `getColById/${colId}`, response.status);

      // Valider les données
      const validation = this.validator.validateColData(data);
      if (!validation.isValid) {
        throw new Error(`Données invalides: ${validation.errors.join(', ')}`);
      }

      // Mettre en cache si disponible
      if (this.cache) {
        await this.cache.set(`col:${colId}`, data, 24 * 60 * 60 * 1000); // 24h TTL
      }

      return data;
    } catch (error) {
      return this.errorHandler.handleAsync(error);
    }
  }

  /**
   * Récupère les détails complets d'un col incluant météo, terrain 3D, etc.
   * @param colId ID du col
   * @returns Détails complets du col
   */
  async getDetailedColById(colId: string): Promise<DetailedCol> {
    try {
      // Vérifier le cache si disponible
      if (this.cache) {
        const cacheKey = `col:detailed:${colId}`;
        const cachedData = await this.cache.get<DetailedCol>(cacheKey);
        if (cachedData) {
          console.log(`Utilisation des données détaillées en cache pour le col ${colId}`);
          return cachedData;
        }
      }

      // Récupérer les données de base du col
      const baseCol = await this.getColById(colId);

      // Récupérer les données complémentaires en parallèle
      const [weatherInfo, elevationProfile, terrain3D, panoramas] = await Promise.all([
        this.getColWeatherStatus(colId).catch(error => {
          this.errorHandler.logOnly(error, 'getColWeatherStatus');
          return undefined;
        }),
        this.getColElevationProfile(colId).catch(error => {
          this.errorHandler.logOnly(error, 'getColElevationProfile');
          return undefined;
        }),
        this.get3DTerrainData(colId).catch(error => {
          this.errorHandler.logOnly(error, 'get3DTerrainData');
          return undefined;
        }),
        this.getColPanoramas(colId).catch(error => {
          this.errorHandler.logOnly(error, 'getColPanoramas');
          return undefined;
        })
      ]);

      const detailedCol: DetailedCol = {
        ...baseCol,
        weatherInfo,
        elevationProfile,
        terrain3D,
        panoramas
      };

      // Valider les données détaillées
      const validation = this.validator.validateDetailedColData(detailedCol);
      if (!validation.isValid) {
        console.warn(`Validation des données détaillées: ${validation.errors.join(', ')}`);
      }

      // Mettre en cache si disponible
      if (this.cache) {
        await this.cache.set(`col:detailed:${colId}`, detailedCol, 30 * 60 * 1000); // 30min TTL
      }

      return detailedCol;
    } catch (error) {
      return this.errorHandler.handleAsync(error);
    }
  }

  /**
   * Recherche des cols selon des critères
   * @param criteria Critères de recherche
   * @returns Liste des cols correspondants
   */
  async searchCols(criteria: SearchCriteria): Promise<Col[]> {
    try {
      // Construire la query string à partir des critères
      const queryParams = new URLSearchParams();
      
      if (criteria.query) queryParams.append('q', criteria.query);
      if (criteria.region) queryParams.append('region', criteria.region);
      if (criteria.minElevation !== undefined) queryParams.append('minElevation', criteria.minElevation.toString());
      if (criteria.maxElevation !== undefined) queryParams.append('maxElevation', criteria.maxElevation.toString());
      if (criteria.minLength !== undefined) queryParams.append('minLength', criteria.minLength.toString());
      if (criteria.maxLength !== undefined) queryParams.append('maxLength', criteria.maxLength.toString());
      if (criteria.minGrade !== undefined) queryParams.append('minGrade', criteria.minGrade.toString());
      if (criteria.maxGrade !== undefined) queryParams.append('maxGrade', criteria.maxGrade.toString());
      
      if (criteria.difficulty) {
        if (Array.isArray(criteria.difficulty)) {
          criteria.difficulty.forEach(diff => queryParams.append('difficulty', diff));
        } else {
          queryParams.append('difficulty', criteria.difficulty);
        }
      }
      
      if (criteria.center) {
        queryParams.append('lat', criteria.center.latitude.toString());
        queryParams.append('lon', criteria.center.longitude.toString());
        
        if (criteria.radius) {
          queryParams.append('radius', criteria.radius.toString());
        }
      }
      
      if (criteria.limit) queryParams.append('limit', criteria.limit.toString());
      if (criteria.offset) queryParams.append('offset', criteria.offset.toString());
      if (criteria.sort) queryParams.append('sort', criteria.sort);
      if (criteria.order) queryParams.append('order', criteria.order);

      // Construire l'URL complète
      const url = `${API_BASE_URL}/api/cols/search?${queryParams.toString()}`;

      // Vérifier le cache si disponible
      if (this.cache) {
        const cacheKey = `search:${url}`;
        const cachedData = await this.cache.get<Col[]>(cacheKey);
        if (cachedData) {
          console.log(`Utilisation des résultats de recherche en cache pour ${url}`);
          return cachedData;
        }
      }

      // Récupérer les données depuis l'API
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${MAPBOX_TOKEN}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      monitoring.logApiCall('colService', 'searchCols', response.status);

      // Mettre en cache si disponible
      if (this.cache) {
        await this.cache.set(`search:${url}`, data, 10 * 60 * 1000); // 10min TTL
      }

      return data;
    } catch (error) {
      return this.errorHandler.handleAsync(error, []);
    }
  }

  /**
   * Récupère le profil d'élévation d'un col
   * @param colId ID du col
   * @returns Profil d'élévation
   */
  async getColElevationProfile(colId: string): Promise<ElevationProfile> {
    try {
      // Vérifier le cache si disponible
      if (this.cache) {
        const cacheKey = `elevation:${colId}`;
        const cachedData = await this.cache.get<ElevationProfile>(cacheKey);
        if (cachedData) {
          console.log(`Utilisation du profil d'élévation en cache pour le col ${colId}`);
          return cachedData;
        }
      }

      // Récupérer les données depuis l'API
      const response = await fetch(`${API_BASE_URL}/api/cols/${colId}/elevation`, {
        headers: {
          Authorization: `Bearer ${MAPBOX_TOKEN}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      monitoring.logApiCall('colService', `getColElevationProfile/${colId}`, response.status);

      // Valider les données
      const validation = this.validator.validateElevationData(data);
      if (!validation.isValid) {
        throw new Error(`Données d'élévation invalides: ${validation.errors.join(', ')}`);
      }

      // Mettre en cache si disponible
      if (this.cache) {
        await this.cache.set(`elevation:${colId}`, data, 7 * 24 * 60 * 60 * 1000); // 7 jours TTL
      }

      return data;
    } catch (error) {
      return this.errorHandler.handleAsync(error);
    }
  }

  /**
   * Récupère les données de terrain 3D d'un col
   * @param colId ID du col
   * @returns Données de terrain 3D
   */
  async get3DTerrainData(colId: string): Promise<TerrainData> {
    try {
      // Vérifier le cache si disponible
      if (this.cache) {
        const cacheKey = `terrain3d:${colId}`;
        const cachedData = await this.cache.get<TerrainData>(cacheKey);
        if (cachedData) {
          console.log(`Utilisation des données de terrain 3D en cache pour le col ${colId}`);
          return cachedData;
        }
      }

      // Récupérer les données depuis l'API
      const response = await fetch(`${API_BASE_URL}/api/cols/${colId}/terrain3d`, {
        headers: {
          Authorization: `Bearer ${MAPBOX_TOKEN}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      monitoring.logApiCall('colService', `get3DTerrainData/${colId}`, response.status);

      // Mettre en cache si disponible
      if (this.cache) {
        await this.cache.set(`terrain3d:${colId}`, data, 30 * 24 * 60 * 60 * 1000); // 30 jours TTL
      }

      return data;
    } catch (error) {
      return this.errorHandler.handleAsync(error);
    }
  }

  /**
   * Récupère les données de visualisation de route
   * @param colId ID du col
   * @returns Données de route
   */
  async getRouteVisualization(colId: string): Promise<RouteData> {
    try {
      // Vérifier le cache si disponible
      if (this.cache) {
        const cacheKey = `route:${colId}`;
        const cachedData = await this.cache.get<RouteData>(cacheKey);
        if (cachedData) {
          console.log(`Utilisation des données de route en cache pour le col ${colId}`);
          return cachedData;
        }
      }

      // Récupérer les données depuis l'API
      const response = await fetch(`${API_BASE_URL}/api/cols/${colId}/route`, {
        headers: {
          Authorization: `Bearer ${MAPBOX_TOKEN}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      monitoring.logApiCall('colService', `getRouteVisualization/${colId}`, response.status);

      // Mettre en cache si disponible
      if (this.cache) {
        await this.cache.set(`route:${colId}`, data, 7 * 24 * 60 * 60 * 1000); // 7 jours TTL
      }

      return data;
    } catch (error) {
      return this.errorHandler.handleAsync(error);
    }
  }

  /**
   * Récupère le statut météo d'un col
   * @param colId ID du col
   * @returns Données météo
   */
  async getColWeatherStatus(colId: string): Promise<WeatherInfo> {
    try {
      // Vérifier le cache si disponible
      if (this.cache) {
        const cacheKey = `weather:${colId}`;
        const cachedData = await this.cache.get<WeatherInfo>(cacheKey);
        if (cachedData) {
          console.log(`Utilisation des données météo en cache pour le col ${colId}`);
          
          // Vérifier si les données sont toujours fraîches (moins de 1h)
          const lastUpdated = new Date(cachedData.lastUpdated);
          const now = new Date();
          if ((now.getTime() - lastUpdated.getTime()) < 60 * 60 * 1000) {
            return cachedData;
          }
          console.log('Données météo en cache expirées, récupération de nouvelles données');
        }
      }

      // Récupérer d'abord les coordonnées du col
      const col = await this.getColById(colId);
      
      // Utiliser le service météo (qui sera remplacé par une référence au weatherService de l'application)
      // Pour l'instant, simuler un appel API
      const response = await fetch(`${API_BASE_URL}/api/weather`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${MAPBOX_TOKEN}`
        },
        body: JSON.stringify({
          latitude: col.location.latitude,
          longitude: col.location.longitude,
          elevation: col.elevation
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      monitoring.logApiCall('colService', `getColWeatherStatus/${colId}`, response.status);

      // Valider les données
      const validation = this.validator.validateWeatherData(data);
      if (!validation.isValid) {
        throw new Error(`Données météo invalides: ${validation.errors.join(', ')}`);
      }

      // Mettre en cache si disponible
      if (this.cache) {
        await this.cache.set(`weather:${colId}`, data, 60 * 60 * 1000); // 1h TTL
      }

      return data;
    } catch (error) {
      return this.errorHandler.handleAsync(error);
    }
  }

  /**
   * Récupère les prévisions météo d'un col
   * @param colId ID du col
   * @returns Prévisions météo
   */
  async getWeatherForecast(colId: string): Promise<any> {
    try {
      // Utiliser la méthode getColWeatherStatus qui contient déjà les prévisions
      const weatherData = await this.getColWeatherStatus(colId);
      
      // Extraire les prévisions
      return {
        hourly: weatherData.hourlyForecast,
        daily: weatherData.dailyForecast
      };
    } catch (error) {
      return this.errorHandler.handleAsync(error);
    }
  }

  /**
   * Récupère les points d'intérêt d'un col
   * @param colId ID du col
   * @returns Liste des points d'intérêt
   */
  async getColPOIs(colId: string): Promise<PointOfInterest[]> {
    try {
      // Vérifier le cache si disponible
      if (this.cache) {
        const cacheKey = `pois:${colId}`;
        const cachedData = await this.cache.get<PointOfInterest[]>(cacheKey);
        if (cachedData) {
          console.log(`Utilisation des points d'intérêt en cache pour le col ${colId}`);
          return cachedData;
        }
      }

      // Récupérer les données depuis l'API
      const response = await fetch(`${API_BASE_URL}/api/cols/${colId}/pois`, {
        headers: {
          Authorization: `Bearer ${MAPBOX_TOKEN}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      monitoring.logApiCall('colService', `getColPOIs/${colId}`, response.status);

      // Mettre en cache si disponible
      if (this.cache) {
        await this.cache.set(`pois:${colId}`, data, 24 * 60 * 60 * 1000); // 24h TTL
      }

      return data;
    } catch (error) {
      return this.errorHandler.handleAsync(error, []);
    }
  }

  /**
   * Ajoute un point d'intérêt pour un col
   * @param colId ID du col
   * @param poi Point d'intérêt à ajouter
   */
  async addPOI(colId: string, poi: PointOfInterest): Promise<void> {
    try {
      // Appel à l'API pour ajouter le POI
      const response = await fetch(`${API_BASE_URL}/api/cols/${colId}/pois`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${MAPBOX_TOKEN}`
        },
        body: JSON.stringify(poi)
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
      }

      monitoring.logApiCall('colService', `addPOI/${colId}`, response.status);

      // Invalider le cache des POIs pour ce col
      if (this.cache) {
        await this.cache.remove(`pois:${colId}`);
      }
    } catch (error) {
      return this.errorHandler.handleAsync(error);
    }
  }

  /**
   * Récupère les panoramas d'un col
   * @param colId ID du col
   * @returns Liste des panoramas
   */
  async getColPanoramas(colId: string): Promise<Panorama[]> {
    try {
      // Vérifier le cache si disponible
      if (this.cache) {
        const cacheKey = `panoramas:${colId}`;
        const cachedData = await this.cache.get<Panorama[]>(cacheKey);
        if (cachedData) {
          console.log(`Utilisation des panoramas en cache pour le col ${colId}`);
          return cachedData;
        }
      }

      // Récupérer les données depuis l'API
      const response = await fetch(`${API_BASE_URL}/api/cols/${colId}/panoramas`, {
        headers: {
          Authorization: `Bearer ${MAPBOX_TOKEN}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      monitoring.logApiCall('colService', `getColPanoramas/${colId}`, response.status);

      // Mettre en cache si disponible
      if (this.cache) {
        await this.cache.set(`panoramas:${colId}`, data, 7 * 24 * 60 * 60 * 1000); // 7 jours TTL
      }

      return data;
    } catch (error) {
      return this.errorHandler.handleAsync(error, []);
    }
  }

  /**
   * Récupère une optimisation de route basée sur des points fournis
   * @param points Points pour calculer l'itinéraire optimisé
   * @returns Données de l'itinéraire optimisé
   */
  async getRouteOptimization(points: { lat: number, lon: number }[]): Promise<any> {
    try {
      const response = await fetch(`https://api.openrouteservice.org/v2/directions/cycling-road`, {
        method: 'POST',
        headers: {
          'Authorization': OPENROUTE_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          coordinates: points.map(p => [p.lon, p.lat]),
          preference: 'recommended',
          units: 'km',
          language: 'fr'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur API OpenRoute: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      monitoring.logApiCall('openroute', 'getRouteOptimization', response.status);
      
      return data;
    } catch (error) {
      return this.errorHandler.handleAsync(error);
    }
  }

  /**
   * Met à jour l'ensemble des données des cols
   * @returns Statut de l'opération de mise à jour
   */
  async updateColsData(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cols/update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MAPBOX_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      monitoring.logApiCall('colService', 'updateColsData', response.status);
      
      // Vider le cache si disponible
      if (this.cache) {
        await this.cache.clear();
      }
      
      return data;
    } catch (error) {
      return this.errorHandler.handleAsync(error);
    }
  }

  /**
   * Récupère des données unifiées pour un col, intégrant toutes les informations
   * @param colId ID du col
   * @returns Données unifiées du col
   */
  async getUnifiedColData(colId: string): Promise<UnifiedColData> {
    try {
      // Vérifier le cache si disponible
      if (this.cache) {
        const cacheKey = `unified:${colId}`;
        const cachedData = await this.cache.get<UnifiedColData>(cacheKey);
        if (cachedData) {
          console.log(`Utilisation des données unifiées en cache pour le col ${colId}`);
          return cachedData;
        }
      }

      // Récupérer toutes les données en parallèle
      const detailedCol = await this.getDetailedColById(colId);
      const pois = await this.getColPOIs(colId);

      // Combiner les données
      const unifiedData: UnifiedColData = {
        ...detailedCol,
        pointsOfInterest: pois
      };

      // Mettre en cache si disponible
      if (this.cache) {
        await this.cache.set(`unified:${colId}`, unifiedData, 30 * 60 * 1000); // 30min TTL
      }

      return unifiedData;
    } catch (error) {
      return this.errorHandler.handleAsync(error);
    }
  }
}
