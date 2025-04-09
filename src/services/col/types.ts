/**
 * Types pour le service de cols et la régénération des profils d'élévation
 */

export interface Col {
  _id: string;
  name: string;
  region: string;
  country: string;
  elevation: number;
  length: number;
  avgGradient: number;
  maxGradient: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  description: string;
  coordinates: [number, number];
  image: string;
  climbs: ColClimb[];
  tags: string[];
  elevation_profile?: ElevationProfile;
  createdAt: Date;
  updatedAt: Date;
}

export interface ColClimb {
  side: string;
  startCoordinates: [number, number];
  endCoordinates: [number, number];
  length: number;
  avgGradient: number;
  maxGradient: number;
}

export interface ElevationPoint {
  lat: number;
  lng: number;
  elevation: number;
  distance?: number; // Distance cumulative depuis le début (km)
}

export interface ElevationSegment {
  startIndex: number;
  endIndex: number;
  startDistance: number; // km
  endDistance: number; // km
  avgGradient: number; // %
  classification: 'easy' | 'moderate' | 'challenging' | 'difficult' | 'extreme';
  length: number; // km
}

export interface ElevationProfile {
  points: ElevationPoint[];
  segments: ElevationSegment[];
  totalAscent: number;
  totalDescent: number;
  minElevation: number;
  maxElevation: number;
  length: number; // km
  avgGradient: number; // %
  generatedAt: Date;
}

export interface RegenerationOptions {
  concurrency?: number;
  backup?: boolean;
  validateData?: boolean;
  forceRefresh?: boolean;
  testMode?: boolean;
}

export interface RegenerationResults {
  colsProcessed: number;
  errors: number;
  apiCalls: number;
  cacheHits: number;
  totalTime: number;
  averageTimePerCol: number;
  skipped: number;
  errorDetails: Array<{
    colId: string;
    colName: string;
    error: string;
  }>;
}
