// ColDetail types
export interface ColDetailProps {
  colId: string;
  initialData?: ColData;
  config?: ColDetailConfig;
}

export interface ColData {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    region: string;
    country: string;
  };
  stats: {
    length: number;
    elevation: number;
    avgGradient: number;
    maxGradient: number;
    difficulty: number;
  };
  terrainData?: {
    pointsOfInterest: PointOfInterest[];
  };
  sides?: ColSide[];
  images?: string[];
  description?: string;
}

export interface ColDetailConfig {
  showWeather?: boolean;
  show3D?: boolean;
  showDetails?: boolean;
  showMap?: boolean;
  defaultTab?: string;
  animationEnabled?: boolean;
  terrainQuality?: 'low' | 'medium' | 'high';
  language?: string;
  unitSystem?: 'metric' | 'imperial';
}

export interface PointOfInterest {
  name: string;
  type: 'viewpoint' | 'rest' | 'summit' | 'other';
  distance: number;
  elevation?: number;
  description?: string;
  images?: string[];
}

export interface ColSide {
  name: string;
  startLocation: string;
  length: number;
  elevation: number;
  avgGradient: number;
  maxGradient: number;
  difficulty: number;
}

export interface WeatherData {
  current: {
    temp: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    precipitation: number;
    condition: string;
    icon: string;
  };
  forecast: WeatherForecastItem[];
}

export interface WeatherForecastItem {
  date: string;
  time: string;
  temp: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  condition: string;
  icon: string;
}

export interface ElevationPoint {
  distance: number;
  elevation: number;
  gradient?: number;
  lat?: number;
  lng?: number;
}

export interface TerrainPoint {
  x: number;
  y: number;
  z: number;
}
