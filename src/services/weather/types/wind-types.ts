/**
 * Wind data types for Velo-Altitude
 * Defines interfaces for wind data fetched from Windy API
 */

export interface GeoLocation {
  lat: number;
  lon: number;
  name?: string;
}

export interface WindData {
  speed: number;        // Wind speed in km/h
  direction: number;    // Wind direction in degrees
  gust: number;         // Wind gust speed in km/h
  timestamp: number;    // Unix timestamp
  provider: string;     // Data provider (e.g., 'windy')
}

export interface WindForecastItem extends WindData {
  dateTime: string;     // ISO date string
  probability: number;  // Probability of wind conditions (0-100)
  feelsLike: number;    // Wind chill temperature in Celsius
}

export interface WindForecast {
  location: GeoLocation;
  current: WindData;
  hourly: WindForecastItem[];
  daily: {
    date: string;       // ISO date string for the day
    min: number;        // Min wind speed in km/h
    max: number;        // Max wind speed in km/h
    avgDirection: number; // Average direction in degrees
    maxGust: number;    // Max gust speed in km/h
  }[];
  updateTime: number;   // Last update timestamp
  source: string;       // Data source
}

export interface WindWarning {
  level: 'info' | 'warning' | 'danger';
  message: string;
  speed: number;
  gust: number;
  colId: string;
  location: GeoLocation;
  timestamp: number;
  expiresAt: number;    // Expiration timestamp
}

export interface WindyConfig {
  apiKey: string;
  cacheDuration: number;
  alertThresholds: {
    warning: number;    // Wind speed threshold for warning in km/h
    danger: number;     // Wind speed threshold for danger alerts in km/h
  };
  debounce?: number;    // Debounce time for API calls in ms
  refreshInterval?: number; // Refresh interval for data in ms
  units?: 'metric' | 'imperial';
}

export interface WindyApiOptions {
  units?: 'metric' | 'imperial';
  lang?: string;
  includeGust?: boolean;
  includeFeelsLike?: boolean;
  includeUV?: boolean;
  includePrecipitation?: boolean;
}
