/**
 * Service météo avec gestion du taux limite et mise en cache
 * Implémente une gestion robuste des erreurs et des stratégies de repli
 */

import axios from 'axios';

// Types pour les entrées et sorties du service météo
export interface WeatherLocation {
  lat: number;
  lng: number;
  name?: string;
  altitude?: number;
}

export interface WeatherOptions {
  units?: 'metric' | 'imperial';
  includeHourly?: boolean;
  includeDaily?: boolean;
  lang?: string;
}

export interface WeatherData {
  temperature: number;
  conditions: string;
  wind: number;
  windDirection?: number;
  humidity: number;
  pressure?: number;
  visibility?: number;
  forecast?: any[];
  isEstimated?: boolean;
}

// Entrée du cache
interface CacheEntry {
  data: WeatherData;
  timestamp: number;
}

/**
 * Service de données météo avec gestion du taux limite et mise en cache
 */
export class WeatherService {
  private cache = new Map<string, CacheEntry>();
  private requestTimestamps: number[] = [];
  private maxRequestsPerMinute: number = 50;
  private apiKey: string;
  private cacheValidityMinutes: number = 30;
  private isRateLimited: boolean = false;
  private rateLimitResetTime: number = 0;
  
  constructor(apiKey: string, options?: {
    maxRequestsPerMinute?: number;
    cacheValidityMinutes?: number;
  }) {
    this.apiKey = apiKey;
    
    if (options?.maxRequestsPerMinute) {
      this.maxRequestsPerMinute = options.maxRequestsPerMinute;
    }
    
    if (options?.cacheValidityMinutes) {
      this.cacheValidityMinutes = options.cacheValidityMinutes;
    }
    
    // Nettoyer le cache périodiquement
    setInterval(() => this.cleanCache(), 15 * 60 * 1000); // Toutes les 15 minutes
  }
  
  /**
   * Obtient les données météo pour un emplacement
   * Implémente mise en cache et gestion du taux limite
   */
  async getWeather(location: WeatherLocation, options: WeatherOptions = {}): Promise<WeatherData> {
    try {
      // Vérifier le cache d'abord
      const cacheKey = this.getCacheKey(location, options);
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        console.log('Weather data retrieved from cache for:', location.name || `${location.lat},${location.lng}`);
        return cachedData;
      }
      
      // Vérifier si on est limité en taux d'appel
      if (this.checkRateLimited()) {
        console.warn('Rate limited, using fallback or aged data');
        return this.handleRateLimiting(location, options);
      }
      
      // Effectuer la requête API réelle
      const response = await this.makeWeatherRequest(location, options);
      
      // Stockage en cache
      this.storeInCache(cacheKey, response.data);
      
      // Suivre le taux d'appels
      this.trackRequest();
      
      return response.data;
    } catch (error) {
      console.error('Weather API error:', error);
      
      // Gérer les erreurs d'API spécifiques
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          // Limite de taux atteinte, marquer comme limité
          this.setRateLimited(60); // Limité pour 1 minute
          return this.handleRateLimiting(location, options);
        }
      }
      
      // Retourner des données de repli en cas d'erreur
      return this.getFallbackData(location);
    }
  }
  
  /**
   * Obtient la clé de cache pour un emplacement et des options
   */
  private getCacheKey(location: WeatherLocation, options: WeatherOptions): string {
    return `${location.lat},${location.lng}:${JSON.stringify(options)}`;
  }
  
  /**
   * Obtient des données depuis le cache si disponibles et valides
   */
  private getFromCache(key: string): WeatherData | null {
    if (!this.cache.has(key)) return null;
    
    const {data, timestamp} = this.cache.get(key)!;
    const now = Date.now();
    
    // Cache valide pour la durée configurée
    if (now - timestamp < this.cacheValidityMinutes * 60 * 1000) {
      return data;
    }
    
    // Cache expiré mais pas supprimé - on le garde pour des cas de repli
    return null;
  }
  
  /**
   * Obtient des données du cache même si expirées (pour la gestion du taux limite)
   */
  private getFromCacheIgnoreAge(key: string): WeatherData | null {
    if (!this.cache.has(key)) return null;
    return this.cache.get(key)!.data;
  }
  
  /**
   * Stocke des données dans le cache
   */
  private storeInCache(key: string, data: WeatherData): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Nettoyer les anciennes entrées si le cache devient trop grand
    if (this.cache.size > 100) {
      this.cleanCache();
    }
  }
  
  /**
   * Nettoie les entrées de cache expirées
   */
  private cleanCache(): void {
    const now = Date.now();
    const expiredTime = now - (this.cacheValidityMinutes * 2 * 60 * 1000); // Double de la validité pour le repli
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < expiredTime) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Vérifie si le service est actuellement limité en taux d'appel
   */
  private checkRateLimited(): boolean {
    const now = Date.now();
    
    // Si on est en état limité explicite
    if (this.isRateLimited && now < this.rateLimitResetTime) {
      return true;
    }
    
    // Réinitialiser si la période est passée
    if (this.isRateLimited && now >= this.rateLimitResetTime) {
      this.isRateLimited = false;
    }
    
    // Vérifier la limite naturelle basée sur les appels récents
    // Supprimer les requêtes plus anciennes que 1 minute
    this.requestTimestamps = this.requestTimestamps.filter(
      time => now - time < 60 * 1000
    );
    
    return this.requestTimestamps.length >= this.maxRequestsPerMinute;
  }
  
  /**
   * Définit le service comme limité en taux pour une durée donnée
   */
  private setRateLimited(durationSeconds: number): void {
    this.isRateLimited = true;
    this.rateLimitResetTime = Date.now() + (durationSeconds * 1000);
    console.warn(`Weather API rate limited for ${durationSeconds} seconds until:`, 
                 new Date(this.rateLimitResetTime).toISOString());
  }
  
  /**
   * Suit les requêtes pour la gestion du taux
   */
  private trackRequest(): void {
    this.requestTimestamps.push(Date.now());
  }
  
  /**
   * Gère le cas où le service est limité en taux
   */
  private handleRateLimiting(location: WeatherLocation, options: WeatherOptions): WeatherData {
    // Stratégie 1: Retourner des données en cache même si expirées
    const cacheKey = this.getCacheKey(location, options);
    const cachedData = this.getFromCacheIgnoreAge(cacheKey);
    if (cachedData) {
      console.log('Returning aged cache data due to rate limiting');
      return {
        ...cachedData,
        isEstimated: true // Marquer comme estimé car les données sont anciennes
      };
    }
    
    // Stratégie 2: Vérifier si des données d'emplacements proches existent en cache
    const nearbyData = this.findNearbyCachedData(location);
    if (nearbyData) {
      console.log('Returning nearby location data due to rate limiting');
      return {
        ...nearbyData,
        isEstimated: true
      };
    }
    
    // Stratégie 3: Données de repli basées sur la saison et la localisation
    console.log('Returning fallback weather data due to rate limiting');
    return this.getFallbackData(location);
  }
  
  /**
   * Recherche des données en cache pour des emplacements proches
   */
  private findNearbyCachedData(location: WeatherLocation): WeatherData | null {
    // Rayon de recherche en degrés lat/lng (~10km)
    const searchRadius = 0.1;
    
    for (const [key, entry] of this.cache.entries()) {
      const [coordPart] = key.split(':');
      const [latStr, lngStr] = coordPart.split(',');
      
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      
      const distance = Math.sqrt(
        Math.pow(lat - location.lat, 2) + 
        Math.pow(lng - location.lng, 2)
      );
      
      if (distance <= searchRadius) {
        return entry.data;
      }
    }
    
    return null;
  }
  
  /**
   * Effectue une requête à l'API météo
   */
  private async makeWeatherRequest(location: WeatherLocation, options: WeatherOptions) {
    // Adapter à l'API météo utilisée
    // Exemple pour OpenWeatherMap:
    const params = {
      lat: location.lat,
      lon: location.lng,
      appid: this.apiKey,
      units: options.units || 'metric',
      lang: options.lang || 'fr'
    };
    
    // Ajouter des options supplémentaires selon les besoins
    if (options.includeHourly || options.includeDaily) {
      return axios.get('https://api.openweathermap.org/data/3.0/onecall', { params });
    } else {
      return axios.get('https://api.openweathermap.org/data/2.5/weather', { params });
    }
  }
  
  /**
   * Génère des données météo de repli basées sur l'emplacement et la saison
   */
  private getFallbackData(location: WeatherLocation): WeatherData {
    // Déterminer la saison actuelle dans l'hémisphère approprié
    const now = new Date();
    const month = now.getMonth();
    const isNorthernHemisphere = location.lat >= 0;
    
    let season;
    // Saisons pour l'hémisphère nord
    if (isNorthernHemisphere) {
      if (month >= 2 && month <= 4) season = 'spring';
      else if (month >= 5 && month <= 7) season = 'summer';
      else if (month >= 8 && month <= 10) season = 'autumn';
      else season = 'winter';
    } 
    // Saisons pour l'hémisphère sud
    else {
      if (month >= 2 && month <= 4) season = 'autumn';
      else if (month >= 5 && month <= 7) season = 'winter';
      else if (month >= 8 && month <= 10) season = 'spring';
      else season = 'summer';
    }
    
    // Estimations basées sur l'altitude (si disponible)
    const altitude = location.altitude || 0;
    let baseTemperature = 15; // Température par défaut
    
    switch (season) {
      case 'winter':
        baseTemperature = 5;
        break;
      case 'spring':
        baseTemperature = 15;
        break;
      case 'summer':
        baseTemperature = 25;
        break;
      case 'autumn':
        baseTemperature = 15;
        break;
    }
    
    // Ajuster en fonction de l'altitude (-6.5°C par 1000m d'altitude)
    const temperature = Math.round(baseTemperature - (altitude / 1000 * 6.5));
    
    // Conditions par défaut basées sur la saison
    let conditions = 'clear';
    switch (season) {
      case 'winter':
        conditions = Math.random() > 0.5 ? 'snow' : 'cloudy';
        break;
      case 'spring':
        conditions = Math.random() > 0.6 ? 'partly cloudy' : 'light rain';
        break;
      case 'summer':
        conditions = Math.random() > 0.7 ? 'clear' : 'partly cloudy';
        break;
      case 'autumn':
        conditions = Math.random() > 0.4 ? 'cloudy' : 'light rain';
        break;
    }
    
    // Estimer la vitesse du vent (plus élevée en altitude)
    const windBaseSpeed = 5;
    const altitudeFactor = Math.min(1 + (altitude / 1000), 3);
    const wind = Math.round(windBaseSpeed * altitudeFactor);
    
    return {
      temperature,
      conditions,
      wind,
      humidity: Math.round(Math.random() * 30 + 50), // 50-80%
      isEstimated: true
    };
  }
}
