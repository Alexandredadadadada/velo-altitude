/**
 * Exemple d'utilisation du système avancé de visualisation météo avec GPU
 * Ce composant montre comment intégrer les effets météorologiques dans une visualisation 3D
 */
import React, { useState } from 'react';
import { AdvancedCol3DViewer } from '../components/AdvancedCol3DViewer';
import { Col, ColDifficulty } from '../services/cols/types/ColTypes';
import { WeatherInfo, RecommendationLevel } from '../services/cols/types/WeatherTypes';

// Col d'exemple avec profil d'élévation
const sampleCol: Col = {
  id: 'col-001',
  name: 'Col du Galibier',
  location: { latitude: 45.0647, longitude: 6.4088, altitude: 2642 },
  elevation: 2642,
  length: 17.5,
  grade: 7.1,
  difficulty: ColDifficulty.HARD,
  region: 'Hautes-Alpes',
  country: 'France',
  description: "L'un des cols les plus emblématiques des Alpes, souvent présent dans le Tour de France.",
  images: ['/assets/images/cols/galibier.jpg'],
  elevationProfile: {
    points: Array(100).fill(0).map((_, i) => ({
      distance: i * 0.175,
      elevation: 1200 + (i * 14.42),
      gradient: 5 + Math.sin(i / 5) * 3
    })),
    maxElevation: 2642,
    minElevation: 1200,
    totalAscent: 1442,
    totalDescent: 0,
    startElevation: 1200,
    endElevation: 2642
  }
};

// Données météo d'exemple
const weatherSamples: Record<string, WeatherInfo> = {
  sunny: {
    current: {
      temperature: 22,
      feelsLike: 22,
      humidity: 45,
      windSpeed: 10,
      windDirection: 180,
      precipitation: 0,
      cloudCover: 15,
      visibility: 20000,
      pressure: 1013,
      uvIndex: 7,
      weatherCode: 800,
      weatherDescription: 'Ensoleillé',
      weatherIcon: 'clear-day',
      lastUpdated: new Date()
    },
    hourlyForecast: [],
    dailyForecast: [],
    alerts: [],
    cyclingRecommendation: {
      recommendation: RecommendationLevel.IDEAL,
      description: 'Conditions idéales pour le cyclisme',
      risks: [],
      tips: ['Apportez beaucoup d\'eau', 'Utilisez de la crème solaire']
    },
    dataSource: 'OpenWeatherMap',
    lastUpdated: new Date()
  },
  rainy: {
    current: {
      temperature: 14,
      feelsLike: 12,
      humidity: 85,
      windSpeed: 15,
      windDirection: 225,
      precipitation: 3.5,
      cloudCover: 95,
      visibility: 5000,
      pressure: 1005,
      uvIndex: 2,
      weatherCode: 501,
      weatherDescription: 'Pluie modérée',
      weatherIcon: 'rain',
      lastUpdated: new Date()
    },
    hourlyForecast: [],
    dailyForecast: [],
    alerts: [],
    cyclingRecommendation: {
      recommendation: RecommendationLevel.POOR,
      description: 'Risque de routes glissantes et visibilité réduite',
      risks: ['Visibilité réduite', 'Routes glissantes'],
      tips: ['Utilisez des vêtements imperméables', 'Allumez vos feux']
    },
    dataSource: 'OpenWeatherMap',
    lastUpdated: new Date()
  },
  snowy: {
    current: {
      temperature: -3,
      feelsLike: -7,
      humidity: 92,
      windSpeed: 8,
      windDirection: 315,
      precipitation: 2,
      cloudCover: 90,
      visibility: 1000,
      pressure: 1020,
      uvIndex: 1,
      weatherCode: 601,
      weatherDescription: 'Neige',
      weatherIcon: 'snow',
      lastUpdated: new Date()
    },
    hourlyForecast: [],
    dailyForecast: [],
    alerts: [],
    cyclingRecommendation: {
      recommendation: RecommendationLevel.POOR,
      description: 'Conditions hivernales difficiles',
      risks: ['Routes glissantes', 'Hypothermie'],
      tips: ['Utilisez des pneus adaptés à la neige si nécessaire', 'Portez plusieurs couches de vêtements']
    },
    dataSource: 'OpenWeatherMap',
    lastUpdated: new Date()
  },
  foggy: {
    current: {
      temperature: 8,
      feelsLike: 6,
      humidity: 95,
      windSpeed: 5,
      windDirection: 90,
      precipitation: 0,
      cloudCover: 30,
      visibility: 200,
      pressure: 1018,
      uvIndex: 0,
      weatherCode: 741,
      weatherDescription: 'Brouillard',
      weatherIcon: 'fog',
      lastUpdated: new Date()
    },
    hourlyForecast: [],
    dailyForecast: [],
    alerts: [],
    cyclingRecommendation: {
      recommendation: RecommendationLevel.DANGEROUS,
      description: 'Visibilité très réduite',
      risks: ['Visibilité réduite', 'Condensation'],
      tips: ['Utilisez des feux puissants', 'Portez des vêtements réfléchissants']
    },
    dataSource: 'OpenWeatherMap',
    lastUpdated: new Date()
  },
  stormy: {
    current: {
      temperature: 18,
      feelsLike: 17,
      humidity: 80,
      windSpeed: 25,
      windDirection: 200,
      precipitation: 5,
      cloudCover: 100,
      visibility: 3000,
      pressure: 995,
      uvIndex: 3,
      weatherCode: 211,
      weatherDescription: 'Orage',
      weatherIcon: 'thunderstorm',
      lastUpdated: new Date()
    },
    hourlyForecast: [],
    dailyForecast: [],
    alerts: [],
    cyclingRecommendation: {
      recommendation: RecommendationLevel.DANGEROUS,
      description: 'Risque de foudre et vents violents',
      risks: ['Foudre', 'Vents violents', 'Routes inondées'],
      tips: ['Cherchez un abri', 'Évitez les zones exposées']
    },
    dataSource: 'OpenWeatherMap',
    lastUpdated: new Date()
  }
};

/**
 * Composant de démonstration de la visualisation météo
 */
const WeatherVisualizationExample: React.FC = () => {
  // État pour les sélections
  const [selectedWeather, setSelectedWeather] = useState<string>('sunny');
  const [useGPU, setUseGPU] = useState<boolean>(true);
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');
  
  // Créer une copie du col avec les données météo sélectionnées
  const colWithWeather: Col = {
    ...sampleCol,
    weather: weatherSamples[selectedWeather]
  };
  
  return (
    <div className="weather-visualization-example">
      <div className="control-panel">
        <h2>Démo de visualisation météo avec GPU</h2>
        
        <div className="selector-group">
          <label htmlFor="weather-condition">Conditions météo:</label>
          <select 
            id="weather-condition"
            aria-label="Sélectionner les conditions météorologiques"
            title="Conditions météorologiques"
            value={selectedWeather} 
            onChange={(e) => setSelectedWeather(e.target.value)}
          >
            <option value="sunny">Ensoleillé</option>
            <option value="rainy">Pluvieux</option>
            <option value="snowy">Neigeux</option>
            <option value="foggy">Brouillard</option>
            <option value="stormy">Orageux</option>
          </select>
        </div>
        
        <div className="selector-group">
          <label htmlFor="use-gpu">Utiliser le GPU:</label>
          <input 
            id="use-gpu"
            type="checkbox" 
            aria-label="Activer l'accélération GPU"
            title="Activer l'accélération GPU"
            checked={useGPU} 
            onChange={(e) => setUseGPU(e.target.checked)} 
          />
        </div>
        
        <div className="selector-group">
          <label htmlFor="quality-level">Qualité:</label>
          <select 
            id="quality-level"
            aria-label="Sélectionner le niveau de qualité"
            title="Niveau de qualité des effets"
            value={quality} 
            onChange={(e) => setQuality(e.target.value as 'low' | 'medium' | 'high')}
          >
            <option value="low">Basse</option>
            <option value="medium">Moyenne</option>
            <option value="high">Haute</option>
          </select>
        </div>
        
        <div className="weather-info">
          <h3>Conditions actuelles:</h3>
          <p>
            Température: {weatherSamples[selectedWeather].current.temperature}°C<br />
            Vent: {weatherSamples[selectedWeather].current.windSpeed} km/h<br />
            Description: {weatherSamples[selectedWeather].current.weatherDescription}<br />
            Recommandation: {weatherSamples[selectedWeather].cyclingRecommendation.description}
          </p>
        </div>
      </div>
      
      <div className="visualization">
        <AdvancedCol3DViewer
          col={colWithWeather}
          width={800}
          height={600}
          options={{
            weatherEffects: true,
            weatherConfig: {
              useGPUComputation: useGPU,
              quality: quality
            }
          }}
        />
      </div>
      
      <div className="performance-note">
        <p>
          <strong>Note sur les performances:</strong> L'utilisation du GPU pour les calculs météorologiques permet une gestion fluide 
          de milliers de particules pour les effets de pluie et de neige. Sur les appareils qui ne prennent pas en charge 
          les calculs GPU, le système bascule automatiquement vers le mode CPU avec des paramètres optimisés.
        </p>
        <p>
          <strong>Capacités adaptatives:</strong> Le système détecte automatiquement les caractéristiques de l'appareil 
          et ajuste les paramètres visuels pour maintenir une expérience fluide tout en conservant des effets visuels 
          impressionnants.
        </p>
      </div>
    </div>
  );
};

export default WeatherVisualizationExample;
