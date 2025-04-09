/**
 * Types pour la configuration de visualisation avancée
 * Définit les interfaces pour les effets météorologiques, les performances et l'adaptation
 */
import { WeatherInfo as ExistingWeatherInfo } from '../../services/cols/types/WeatherTypes';

// Réutiliser le type existant pour garantir la compatibilité
export type WeatherInfo = ExistingWeatherInfo;

// Types météorologiques simplifiés pour la visualisation
export interface SimpleWeatherConditions {
  precipitation: number;
  windSpeed: number;
  temperature: number;
  humidity: number;
  visibility: number;
  cloudCover: number;
  windDirection: number;
}

export interface WeatherForecast {
  timestamp: number;
  conditions: Partial<SimpleWeatherConditions>;
}

export interface WeatherHistorical {
  timestamp: number;
  conditions: Partial<SimpleWeatherConditions>;
}

// Paramètres des particules et effets
export interface ParticleSettings {
  rainIntensity?: number;
  snowIntensity?: number;
  fogDensity?: number;
  fogColor?: string;
  lightningFrequency?: number;
}

export interface AtmosphereSettings {
  scattering?: number;
  absorption?: number;
  cloudDensity?: number;
  fogDensity?: number;
}

export interface LightingSettings {
  ambient?: number;
  sunIntensity?: number;
  lightningEnabled?: boolean;
  shadowsEnabled?: boolean;
  shadowResolution?: number;
}

// Préréglages météorologiques
export interface WeatherPreset {
  name: string;
  description: string;
  conditions: Partial<SimpleWeatherConditions>;
  effects: {
    particles: ParticleSettings;
    atmosphere: AtmosphereSettings;
    lighting: LightingSettings;
  };
}

// Capacités de l'appareil
export interface DeviceCapabilities {
  isMobile: boolean;
  isHighEnd: boolean;
  hasGPU: boolean;
  gpuTier?: number;
  batteryLevel?: number;
  isLowPowerMode?: boolean;
  browserSupport: {
    webGL2: boolean;
    computeShaders: boolean;
    floatTextures: boolean;
  };
}

// Paramètres de visualisation
export interface VisualizationSettings {
  quality: 'low' | 'medium' | 'high';
  useGPU: boolean;
  useGPUComputation?: boolean; // Pour les calculs physiques spécifiques
  particleMultiplier: number;
  shadowsEnabled: boolean;
  postProcessingEnabled: boolean;
  terrainDetail: number;
  textureResolution: number;
  adaptiveQuality: boolean;
}

// Configuration des transitions
export interface TransitionSettings {
  duration: number;
  easing: 'linear' | 'easeInOut' | 'easeInOutCubic';
  staggered: boolean;
  staggerDelay?: number;
}

// Interface pour l'utilisation par les classes
export interface VisualizationConfigAccess {
  getParticleSettings(quality: string, type: string): any;
  getDeviceOptimizedSettings(capabilities: DeviceCapabilities): VisualizationSettings;
  getWeatherPreset(presetName: string): WeatherPreset | null;
}
