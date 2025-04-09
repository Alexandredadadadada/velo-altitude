/**
 * Types et interfaces pour le service des cols
 */

import { WeatherInfo } from './WeatherTypes';

/**
 * Coordonnées géographiques
 */
export interface GeoLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
}

/**
 * Niveau de difficulté d'un col
 */
export enum ColDifficulty {
  EASY = "easy",
  MODERATE = "moderate",
  HARD = "hard",
  VERY_HARD = "very_hard",
  EXTREME = "extreme"
}

/**
 * Critères de recherche pour les cols
 */
export interface SearchCriteria {
  query?: string;
  region?: string;
  minElevation?: number;
  maxElevation?: number;
  minLength?: number;
  maxLength?: number;
  minGrade?: number;
  maxGrade?: number;
  difficulty?: ColDifficulty | ColDifficulty[];
  radius?: number;
  center?: GeoLocation;
  limit?: number;
  offset?: number;
  sort?: "name" | "elevation" | "length" | "grade" | "difficulty";
  order?: "asc" | "desc";
}

/**
 * Points d'intérêt liés à un col
 */
export interface PointOfInterest {
  id: string;
  name: string;
  location: GeoLocation;
  type: string;
  description?: string;
  rating?: number;
  distance?: number; // Distance par rapport au col, en km
  images?: string[];
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  openingHours?: {
    [key: string]: string; // e.g., "monday": "09:00-17:00"
  };
}

/**
 * Données de base d'un col
 */
export interface Col {
  id: string;
  name: string;
  location: GeoLocation;
  elevation: number;
  length: number;
  grade: number;
  difficulty: ColDifficulty;
  region?: string;
  country?: string;
  description?: string;
  images?: string[];
  pointsOfInterest?: PointOfInterest[];
  lastUpdated?: Date;
  source?: string;
  weather?: WeatherInfo;
  elevationProfile?: ElevationProfile;
}

/**
 * Données complètes d'un col, incluant les données météo et 3D
 */
export interface DetailedCol extends Col {
  weatherInfo?: WeatherInfo;
  terrain3D?: TerrainData;
  elevationProfile?: ElevationProfile;
  panoramas?: Panorama[];
}

/**
 * Informations sur un panorama
 */
export interface Panorama {
  id: string;
  url: string;
  location: GeoLocation;
  title?: string;
  description?: string;
  dateTaken?: Date;
  authorName?: string;
  authorUrl?: string;
}

/**
 * Profil d'élévation d'un col
 */
export interface ElevationProfile {
  points: ElevationPoint[];
  maxElevation: number;
  minElevation: number;
  totalAscent: number;
  totalDescent: number;
  startElevation: number;
  endElevation: number;
}

/**
 * Point d'un profil d'élévation
 */
export interface ElevationPoint {
  distance: number; // Distance depuis le début, en km
  elevation: number; // Élévation en mètres
  gradient?: number; // Gradient en pourcentage
  location?: GeoLocation;
}

/**
 * Résultats de validation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Objet Query pour la recherche
 */
export interface Query {
  elevation?: {
    min?: number;
    max?: number;
  };
  difficulty?: ColDifficulty | ColDifficulty[];
  region?: string;
  [key: string]: any;
}

/**
 * Entrée de cache
 */
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Configuration du cache
 */
export interface CacheConfig {
  getTTL(key: string): number;
  defaultTTL: number;
}

/**
 * Données unifiées pour un col
 */
export interface UnifiedColData extends DetailedCol {
  visualization?: any; // Type spécifique à définir selon l'implémentation
}

// Forward declarations d'interfaces qui seront définies dans d'autres fichiers
export interface TerrainData {}

// Erreurs spécifiques
export class ColNotFoundError extends Error {
  constructor(colId: string) {
    super(`Col not found: ${colId}`);
    this.name = 'ColNotFoundError';
  }
}

export class ColValidationError extends Error {
  constructor(errors: string[]) {
    super(`Col validation failed: ${errors.join(", ")}`);
    this.name = 'ColValidationError';
  }
}
