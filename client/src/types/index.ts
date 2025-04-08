/**
 * Types communs utilisés dans l'application
 */

/**
 * Détails d'un col
 */
export interface ColDetails {
  id: string;
  name: string;
  altitude: number;
  length: number;
  gradient: number;
  difficulty: number;
  region: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  description?: string;
  images?: string[];
  popularRoutes?: string[];
}

/**
 * Type pour les données de cyclisme
 */
export interface Cycling {
  id: string;
  name: string;
  type: 'road' | 'gravel' | 'mtb';
  distance: number;
  elevation: number;
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  route?: {
    points: Array<{
      lat: number;
      lng: number;
      elevation?: number;
    }>;
  };
}

/**
 * Prévisions météo pour un lieu
 */
export interface LocationForecast {
  location: {
    name: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    altitude: number;
  };
  current: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    precipitation: number;
    condition: string;
    icon: string;
    timestamp: string;
  };
  hourly: Array<{
    temperature: number;
    precipitation: number;
    windSpeed: number;
    condition: string;
    icon: string;
    timestamp: string;
  }>;
  daily: Array<{
    date: string;
    temperatureMax: number;
    temperatureMin: number;
    precipitation: number;
    windSpeed: number;
    condition: string;
    icon: string;
  }>;
}

/**
 * Type pour les données d'un col
 */
export interface ColData {
  id: string;
  name: string;
  altitude: number;
  length: number;
  gradient: number;
  difficulty: number;
  region: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}
