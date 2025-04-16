/**
 * Intégration des API météo dans RealApiOrchestrator
 * Remplace les appels directs aux API et le mocking intrusif
 */

import { GeoLocation } from '../../../config/visualizationConfig';
import { RealApiClient } from '../RealApiClient';
import { ApiEndpoints } from '../ApiEndpoints';
import { ApiCacheManager } from '../ApiCacheManager';

// Types partagés
export interface WeatherConditions {
  temperature: number;
  precipitation: number;
  windSpeed: number;
  windDirection: number;
  gustiness?: number;
  visibility: number;
  isEstimated?: boolean;
  updatedAt: Date;
  source: string;
}

export interface WindWarning {
  colId: string;
  location: GeoLocation;
  speed: number;
  direction: number;
  gustiness?: number;
  severity: 'low' | 'medium' | 'high';
  message: string;
  validUntil: Date;
}

export interface EnhancedWeatherService {
  getColWindConditions(colId: string, location: GeoLocation): Promise<WeatherConditions>;
  registerWindWarningCallback(callback: (warning: WindWarning) => void): void;
  getForecast(colId: string, location: GeoLocation): Promise<any>;
}

/**
 * Implémentation du service météo utilisant RealApiClient
 */
export class WeatherApiService implements EnhancedWeatherService {
  private apiClient: RealApiClient;
  private cacheManager: ApiCacheManager;
  private windWarningCallbacks: Array<(warning: WindWarning) => void> = [];
  private warningCheckInterval: any;
  private lastCheckedWarnings: { [colId: string]: Date } = {};
  private readonly CACHE_KEY_PREFIX = 'weather_';
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes
  private readonly WARNING_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  constructor(apiClient: RealApiClient, cacheManager: ApiCacheManager) {
    this.apiClient = apiClient;
    this.cacheManager = cacheManager;
    
    // Démarrer la vérification périodique des alertes
    this.startWarningCheck();
  }

  /**
   * Obtient les conditions météo pour un col
   */
  public async getColWindConditions(colId: string, location: GeoLocation): Promise<WeatherConditions> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}conditions_${colId}`;
    
    // Vérifier le cache
    const cachedData = this.cacheManager.get<WeatherConditions>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    try {
      // Appel API avec gestion d'erreur et retry
      const response = await this.apiClient.get(
        ApiEndpoints.WEATHER_CONDITIONS,
        {
          colId,
          lat: location.latitude,
          lng: location.longitude,
          alt: location.altitude
        },
        { retry: true, timeout: 5000 }
      );
      
      const weatherData: WeatherConditions = {
        temperature: response.temperature,
        precipitation: response.precipitation,
        windSpeed: response.windSpeed,
        windDirection: response.windDirection,
        gustiness: response.gustiness,
        visibility: response.visibility,
        isEstimated: response.isEstimated || false,
        updatedAt: new Date(response.updatedAt),
        source: response.source || 'api'
      };
      
      // Mettre en cache
      this.cacheManager.set(cacheKey, weatherData, this.CACHE_TTL);
      
      // Vérifier si des alertes sont présentes
      if (response.warnings && response.warnings.length > 0) {
        this.processWarnings(colId, location, response.warnings);
      }
      
      return weatherData;
    } catch (error) {
      console.error(`Erreur lors de la récupération des conditions météo pour ${colId}:`, error);
      
      // Générer des données estimées en cas d'erreur
      return this.generateEstimatedWeatherData(colId, location);
    }
  }

  /**
   * Récupère les prévisions météo pour un col
   */
  public async getForecast(colId: string, location: GeoLocation): Promise<any> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}forecast_${colId}`;
    
    // Vérifier le cache
    const cachedData = this.cacheManager.get<any>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const response = await this.apiClient.get(
        ApiEndpoints.WEATHER_FORECAST,
        {
          colId,
          lat: location.latitude,
          lng: location.longitude,
          alt: location.altitude,
          hours: 24
        }
      );
      
      // Mettre en cache
      this.cacheManager.set(cacheKey, response, this.CACHE_TTL);
      
      return response;
    } catch (error) {
      console.error(`Erreur lors de la récupération des prévisions pour ${colId}:`, error);
      throw error;
    }
  }

  /**
   * Enregistre un callback pour les alertes de vent
   */
  public registerWindWarningCallback(callback: (warning: WindWarning) => void): void {
    this.windWarningCallbacks.push(callback);
  }

  /**
   * Traite les alertes reçues de l'API
   */
  private processWarnings(colId: string, location: GeoLocation, warnings: any[]): void {
    warnings.forEach(warning => {
      const windWarning: WindWarning = {
        colId,
        location,
        speed: warning.windSpeed,
        direction: warning.windDirection,
        gustiness: warning.gustiness,
        severity: warning.severity || 'medium',
        message: warning.message || 'Conditions de vent potentiellement dangereuses',
        validUntil: new Date(warning.validUntil || Date.now() + 3600000)
      };
      
      // Notifier tous les abonnés
      this.notifyWarningCallbacks(windWarning);
    });
  }

  /**
   * Notifie tous les callbacks enregistrés d'une alerte
   */
  private notifyWarningCallbacks(warning: WindWarning): void {
    this.windWarningCallbacks.forEach(callback => {
      try {
        callback(warning);
      } catch (error) {
        console.error('Erreur lors de la notification d\'alerte de vent:', error);
      }
    });
  }

  /**
   * Démarre la vérification périodique des alertes
   */
  private startWarningCheck(): void {
    this.warningCheckInterval = setInterval(() => {
      this.checkActiveWarnings();
    }, this.WARNING_CHECK_INTERVAL);
  }

  /**
   * Vérifie périodiquement les alertes actives
   */
  private async checkActiveWarnings(): Promise<void> {
    try {
      const response = await this.apiClient.get(
        ApiEndpoints.ACTIVE_WARNINGS,
        {},
        { retry: false, timeout: 3000 }
      );
      
      if (response && Array.isArray(response.warnings)) {
        response.warnings.forEach((warning: any) => {
          const colId = warning.colId;
          
          // Ne traiter que les nouvelles alertes
          if (!this.lastCheckedWarnings[colId] || 
              new Date(warning.createdAt) > this.lastCheckedWarnings[colId]) {
            
            const location: GeoLocation = {
              latitude: warning.latitude,
              longitude: warning.longitude,
              altitude: warning.altitude
            };
            
            const windWarning: WindWarning = {
              colId,
              location,
              speed: warning.windSpeed,
              direction: warning.windDirection,
              gustiness: warning.gustiness,
              severity: warning.severity,
              message: warning.message,
              validUntil: new Date(warning.validUntil)
            };
            
            // Notifier tous les abonnés
            this.notifyWarningCallbacks(windWarning);
            
            // Mettre à jour la dernière vérification
            this.lastCheckedWarnings[colId] = new Date();
          }
        });
      }
    } catch (error) {
      console.warn('Échec de la vérification des alertes actives:', error);
    }
  }

  /**
   * Génère des données météo estimées en cas d'erreur
   */
  private generateEstimatedWeatherData(colId: string, location: GeoLocation): WeatherConditions {
    // Générer des valeurs approximatives basées sur la localisation
    // En pratique, cela pourrait utiliser l'historique ou des modèles plus complexes
    
    // Ajustement de la température en fonction de l'altitude
    // Environ -0.6°C pour 100m d'élévation
    const baseTemperature = 20; // Température de base au niveau de la mer
    const temperatureAdjustment = -0.6 * (location.altitude / 100);
    const temperature = baseTemperature + temperatureAdjustment;
    
    // Vent approximatif basé sur l'altitude
    // Les cols plus élevés ont tendance à être plus venteux
    const windSpeed = Math.min(5 + (location.altitude / 200), 40);
    
    // Direction du vent aléatoire mais cohérente pour le même col
    const colIdSum = colId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const windDirection = (colIdSum % 360);
    
    return {
      temperature,
      precipitation: 0, // Pas de précipitations par défaut en mode estimé
      windSpeed,
      windDirection,
      gustiness: windSpeed * 1.3,
      visibility: 10000, // Bonne visibilité par défaut
      isEstimated: true, // Marquer comme estimé
      updatedAt: new Date(),
      source: 'fallback'
    };
  }

  /**
   * Nettoie les ressources lors de la destruction
   */
  public dispose(): void {
    if (this.warningCheckInterval) {
      clearInterval(this.warningCheckInterval);
    }
    this.windWarningCallbacks = [];
  }
}

/**
 * Fonction factory pour créer le service météo
 */
export function createWeatherService(apiClient: RealApiClient, cacheManager: ApiCacheManager): EnhancedWeatherService {
  return new WeatherApiService(apiClient, cacheManager);
}
