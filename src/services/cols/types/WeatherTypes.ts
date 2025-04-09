/**
 * Types et interfaces pour les données météorologiques liées aux cols
 */

/**
 * Conditions météorologiques actuelles
 */
export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  windGust?: number;
  precipitation: number;
  cloudCover: number;
  visibility: number;
  pressure: number;
  uvIndex: number;
  weatherCode: number;
  weatherDescription: string;
  weatherIcon: string;
  lastUpdated: Date;
}

/**
 * Prévision météorologique
 */
export interface Forecast {
  date: Date;
  timePoint: Date;
  temperature: number;
  feelsLike: number;
  minTemperature?: number;
  maxTemperature?: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  windGust?: number;
  precipitation: number;
  precipitationProbability: number;
  cloudCover: number;
  visibility: number;
  pressure: number;
  uvIndex: number;
  weatherCode: number;
  weatherDescription: string;
  weatherIcon: string;
}

/**
 * Alerte météorologique
 */
export interface WeatherAlert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  type: AlertType;
  startTime: Date;
  endTime: Date;
  source: string;
  affectedAreas?: string[];
}

/**
 * Niveau de sévérité d'une alerte
 */
export enum AlertSeverity {
  MINOR = "minor",
  MODERATE = "moderate",
  SEVERE = "severe",
  EXTREME = "extreme"
}

/**
 * Type d'alerte météorologique
 */
export enum AlertType {
  WIND = "wind",
  RAIN = "rain",
  SNOW = "snow",
  ICE = "ice",
  STORM = "storm",
  THUNDERSTORM = "thunderstorm",
  FLOOD = "flood",
  TORNADO = "tornado",
  HEAT = "heat",
  COLD = "cold",
  FOG = "fog",
  OTHER = "other"
}

/**
 * Recommandation cycliste basée sur la météo
 */
export interface CyclingRecommendation {
  recommendation: RecommendationLevel;
  description: string;
  risks: string[];
  tips: string[];
}

/**
 * Niveau de recommandation
 */
export enum RecommendationLevel {
  IDEAL = "ideal",
  GOOD = "good",
  FAIR = "fair",
  POOR = "poor",
  DANGEROUS = "dangerous"
}

/**
 * Historique météorologique
 */
export interface WeatherHistory {
  date: Date;
  temperature: number;
  precipitation: number;
  windSpeed: number;
  conditions: string;
}

/**
 * Informations météorologiques complètes pour un col
 */
export interface WeatherInfo {
  current: CurrentWeather;
  hourlyForecast: Forecast[];
  dailyForecast: Forecast[];
  alerts: WeatherAlert[];
  cyclingRecommendation: CyclingRecommendation;
  history?: WeatherHistory[];
  dataSource: string;
  lastUpdated: Date;
}

/**
 * Configuration météo pour l'affichage
 */
export interface WeatherDisplayConfig {
  units: 'metric' | 'imperial';
  showWindDirection: boolean;
  showPrecipitationProbability: boolean;
  showUvIndex: boolean;
  colorCoding: boolean;
  alertNotifications: boolean;
}
