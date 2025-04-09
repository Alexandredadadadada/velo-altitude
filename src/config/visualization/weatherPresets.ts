/**
 * Préréglages météorologiques prédéfinis pour la visualisation
 * Fournit des configurations communes pour différentes conditions météo
 */
import { WeatherPreset } from './types';

export const WEATHER_PRESETS: Record<string, WeatherPreset> = {
  clearSky: {
    name: "Ciel clair",
    description: "Conditions ensoleillées parfaites pour le cyclisme",
    conditions: {
      precipitation: 0,
      windSpeed: 5,
      temperature: 22,
      humidity: 45,
      visibility: 1,
      cloudCover: 0.1,
      windDirection: 180
    },
    effects: {
      particles: {
        rainIntensity: 0,
        snowIntensity: 0,
        fogDensity: 0
      },
      atmosphere: {
        scattering: 0.2,
        absorption: 0.1,
        cloudDensity: 0.1
      },
      lighting: {
        ambient: 0.6,
        sunIntensity: 1.0,
        shadowsEnabled: true
      }
    }
  },
  
  lightRain: {
    name: "Pluie légère",
    description: "Légère pluie, visibilité réduite",
    conditions: {
      precipitation: 0.3,
      windSpeed: 10,
      temperature: 16,
      humidity: 75,
      visibility: 0.8,
      cloudCover: 0.7,
      windDirection: 225
    },
    effects: {
      particles: {
        rainIntensity: 0.3,
        snowIntensity: 0,
        fogDensity: 0.1,
        fogColor: '#e6e6e6'
      },
      atmosphere: {
        scattering: 0.4,
        absorption: 0.3,
        cloudDensity: 0.6
      },
      lighting: {
        ambient: 0.7,
        sunIntensity: 0.6,
        shadowsEnabled: true
      }
    }
  },
  
  heavyRain: {
    name: "Forte pluie",
    description: "Fortes précipitations, mauvaise visibilité",
    conditions: {
      precipitation: 0.8,
      windSpeed: 15,
      temperature: 12,
      humidity: 90,
      visibility: 0.4,
      cloudCover: 0.9,
      windDirection: 200
    },
    effects: {
      particles: {
        rainIntensity: 0.8,
        snowIntensity: 0,
        fogDensity: 0.25,
        fogColor: '#d9d9d9'
      },
      atmosphere: {
        scattering: 0.6,
        absorption: 0.5,
        cloudDensity: 0.9
      },
      lighting: {
        ambient: 0.8,
        sunIntensity: 0.3,
        shadowsEnabled: true
      }
    }
  },
  
  lightSnow: {
    name: "Neige légère",
    description: "Légers flocons de neige, atmosphère hivernale",
    conditions: {
      precipitation: 0.3,
      windSpeed: 8,
      temperature: -2,
      humidity: 85,
      visibility: 0.7,
      cloudCover: 0.8,
      windDirection: 315
    },
    effects: {
      particles: {
        rainIntensity: 0,
        snowIntensity: 0.3,
        fogDensity: 0.2,
        fogColor: '#f0f0f0'
      },
      atmosphere: {
        scattering: 0.5,
        absorption: 0.3,
        cloudDensity: 0.7
      },
      lighting: {
        ambient: 0.8,
        sunIntensity: 0.5,
        shadowsEnabled: true
      }
    }
  },
  
  heavySnow: {
    name: "Forte neige",
    description: "Tempête de neige, conditions difficiles",
    conditions: {
      precipitation: 0.7,
      windSpeed: 12,
      temperature: -5,
      humidity: 90,
      visibility: 0.2,
      cloudCover: 0.95,
      windDirection: 290
    },
    effects: {
      particles: {
        rainIntensity: 0,
        snowIntensity: 0.8,
        fogDensity: 0.4,
        fogColor: '#f5f5f5'
      },
      atmosphere: {
        scattering: 0.7,
        absorption: 0.5,
        cloudDensity: 0.9
      },
      lighting: {
        ambient: 0.9,
        sunIntensity: 0.2,
        shadowsEnabled: true
      }
    }
  },
  
  foggy: {
    name: "Brouillard",
    description: "Forte brume, visibilité très réduite",
    conditions: {
      precipitation: 0,
      windSpeed: 5,
      temperature: 8,
      humidity: 95,
      visibility: 0.2,
      cloudCover: 0.4,
      windDirection: 90
    },
    effects: {
      particles: {
        rainIntensity: 0,
        snowIntensity: 0,
        fogDensity: 0.7,
        fogColor: '#e6e6e6'
      },
      atmosphere: {
        scattering: 0.8,
        absorption: 0.6,
        cloudDensity: 0.4
      },
      lighting: {
        ambient: 0.9,
        sunIntensity: 0.3,
        shadowsEnabled: false
      }
    }
  },
  
  thunderstorm: {
    name: "Orage",
    description: "Orage violent avec pluie et éclairs",
    conditions: {
      precipitation: 0.7,
      windSpeed: 20,
      temperature: 18,
      humidity: 85,
      visibility: 0.4,
      cloudCover: 0.95,
      windDirection: 225
    },
    effects: {
      particles: {
        rainIntensity: 0.7,
        snowIntensity: 0,
        fogDensity: 0.3,
        fogColor: '#c9c9c9',
        lightningFrequency: 0.2
      },
      atmosphere: {
        scattering: 0.6,
        absorption: 0.7,
        cloudDensity: 0.95
      },
      lighting: {
        ambient: 0.5,
        sunIntensity: 0.1,
        shadowsEnabled: true,
        lightningEnabled: true
      }
    }
  },
  
  morningMist: {
    name: "Brume matinale",
    description: "Brume légère typique des matins en montagne",
    conditions: {
      precipitation: 0,
      windSpeed: 3,
      temperature: 10,
      humidity: 90,
      visibility: 0.6,
      cloudCover: 0.3,
      windDirection: 45
    },
    effects: {
      particles: {
        rainIntensity: 0,
        snowIntensity: 0,
        fogDensity: 0.3,
        fogColor: '#f2f2f2'
      },
      atmosphere: {
        scattering: 0.5,
        absorption: 0.3,
        cloudDensity: 0.2
      },
      lighting: {
        ambient: 0.7,
        sunIntensity: 0.7,
        shadowsEnabled: true
      }
    }
  },
  
  sunsetGlow: {
    name: "Lueur de coucher de soleil",
    description: "Conditions de fin de journée avec lumière dorée",
    conditions: {
      precipitation: 0,
      windSpeed: 5,
      temperature: 18,
      humidity: 60,
      visibility: 0.9,
      cloudCover: 0.4,
      windDirection: 270
    },
    effects: {
      particles: {
        rainIntensity: 0,
        snowIntensity: 0,
        fogDensity: 0.1,
        fogColor: '#ffd699'
      },
      atmosphere: {
        scattering: 0.7,
        absorption: 0.4,
        cloudDensity: 0.3
      },
      lighting: {
        ambient: 0.5,
        sunIntensity: 0.8,
        shadowsEnabled: true
      }
    }
  },
  
  windyDay: {
    name: "Journée venteuse",
    description: "Forts vents sans précipitations",
    conditions: {
      precipitation: 0,
      windSpeed: 25,
      temperature: 15,
      humidity: 50,
      visibility: 0.9,
      cloudCover: 0.5,
      windDirection: 315
    },
    effects: {
      particles: {
        rainIntensity: 0,
        snowIntensity: 0,
        fogDensity: 0.05
      },
      atmosphere: {
        scattering: 0.3,
        absorption: 0.2,
        cloudDensity: 0.5
      },
      lighting: {
        ambient: 0.6,
        sunIntensity: 0.9,
        shadowsEnabled: true
      }
    }
  }
};

/**
 * Récupère un préréglage météorologique par son identifiant
 */
export function getWeatherPreset(presetId: string): WeatherPreset | null {
  return WEATHER_PRESETS[presetId] || null;
}

/**
 * Récupère le préréglage le plus adapté aux conditions météorologiques données
 */
export function findClosestPreset(weather: {
  precipitation?: number;
  temperature?: number;
  windSpeed?: number;
  visibility?: number;
}): string {
  let bestMatch = 'clearSky';
  let bestScore = Number.MAX_VALUE;
  
  // Parcourir tous les préréglages
  Object.entries(WEATHER_PRESETS).forEach(([id, preset]) => {
    let score = 0;
    
    // Calculer un score de différence pour chaque propriété pertinente
    if (weather.precipitation !== undefined && preset.conditions.precipitation !== undefined) {
      score += Math.abs(weather.precipitation - preset.conditions.precipitation) * 10;
    }
    
    if (weather.temperature !== undefined && preset.conditions.temperature !== undefined) {
      score += Math.abs(weather.temperature - preset.conditions.temperature) * 0.5;
    }
    
    if (weather.windSpeed !== undefined && preset.conditions.windSpeed !== undefined) {
      score += Math.abs(weather.windSpeed - preset.conditions.windSpeed) * 0.2;
    }
    
    if (weather.visibility !== undefined && preset.conditions.visibility !== undefined) {
      score += Math.abs(weather.visibility - preset.conditions.visibility) * 5;
    }
    
    // Mettre à jour le meilleur match si ce préréglage a un meilleur score
    if (score < bestScore) {
      bestScore = score;
      bestMatch = id;
    }
  });
  
  return bestMatch;
}

export default WEATHER_PRESETS;
