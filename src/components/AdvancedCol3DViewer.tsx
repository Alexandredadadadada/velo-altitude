import React, { useEffect, useRef, useState } from 'react';
import { AdvancedCol3DVisualizationService, AdvancedCol3DOptions } from '../services/visualization/AdvancedCol3DVisualizationService';
import { Col } from '../services/cols/types/ColTypes';
import { WeatherInfo } from '../services/cols/types/WeatherTypes';
import { detectDeviceCapabilities } from '../config/visualizationConfig';
import './AdvancedCol3DViewer.css';

// Déclaration d'augmentation pour le type Window
declare global {
  interface Window {
    services?: {
      weatherService?: {
        getCurrentWeather: (lat: number, lng: number) => Promise<WeatherInfo>;
      };
    };
  }
}

interface AdvancedCol3DViewerProps {
  col: Col;
  width?: number;
  height?: number;
  className?: string;
  options?: Partial<AdvancedCol3DOptions>;
  onReady?: () => void;
}

/**
 * Composant React pour afficher une visualisation 3D avancée d'un col
 */
export const AdvancedCol3DViewer: React.FC<AdvancedCol3DViewerProps> = ({
  col,
  width = 800,
  height = 600,
  className = '',
  options = {},
  onReady
}) => {
  // Référence au conteneur
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Référence au service de visualisation
  const serviceRef = useRef<AdvancedCol3DVisualizationService | null>(null);
  
  // État pour les contrôles utilisateur GPU et qualité
  const [showWeather, setShowWeather] = useState<boolean>(true);
  const [useGPU, setUseGPU] = useState<boolean>(true);
  const [weatherQuality, setWeatherQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [weatherIntensity, setWeatherIntensity] = useState<number>(1.0);
  const [timeOfDay, setTimeOfDay] = useState<number>(12);
  const [isFlythroughActive, setIsFlythroughActive] = useState<boolean>(false);
  const [flythroughSpeed, setFlythroughSpeed] = useState<number>(0.001);
  const [snowLevel, setSnowLevel] = useState<number>(1800);
  const [showAdvancedControls, setShowAdvancedControls] = useState<boolean>(false);
  
  // Détecter les capacités de l'appareil
  const [deviceCapabilities, setDeviceCapabilities] = useState<any>(null);
  
  // Initialisation du service
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Détecter les capacités de l'appareil
    if (window.navigator) {
      const capabilities = detectDeviceCapabilities(window.navigator);
      setDeviceCapabilities(capabilities);
      
      // Ajuster les paramètres par défaut en fonction des capacités
      if (capabilities) {
        setUseGPU(capabilities.gpuComputation);
        setWeatherQuality(capabilities.recommendedQuality || 'medium');
      }
    }
    
    // Options par défaut
    const defaultOptions: Partial<AdvancedCol3DOptions> = {
      width,
      height,
      exaggeration: 2,
      colors: {
        terrain: '#a5d6a7',
        path: '#3f51b5',
        markers: '#ffd700',
        grid: '#cccccc',
        difficult: '#ff9800',
        extreme: '#f44336'
      },
      renderQuality: weatherQuality,
      shadows: true,
      antialiasing: true,
      weatherEffects: showWeather,
      weatherConfig: {
        quality: weatherQuality,
        useGPUComputation: useGPU,
        intensity: weatherIntensity,
        enableRain: true,
        enableSnow: true,
        enableFog: true,
        enableClouds: true,
        enableWind: true,
        enableLightning: true
      },
      enhancedTerrain: true,
      interactive: true,
      enableFlythrough: true,
      enableTimeOfDay: true
    };
    
    // Fusionner les options
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Créer le service
    serviceRef.current = new AdvancedCol3DVisualizationService(
      containerRef.current,
      mergedOptions
    );
    
    // Visualiser le col
    serviceRef.current.visualizeCol(col).then(() => {
      if (onReady) onReady();
    });
    
    // Nettoyage
    return () => {
      if (serviceRef.current) {
        serviceRef.current.dispose();
        serviceRef.current = null;
      }
    };
  }, [col, options, width, height, onReady, showWeather, useGPU, weatherQuality, weatherIntensity]);
  
  // Gestion du redimensionnement
  useEffect(() => {
    if (!serviceRef.current) return;
    
    const handleResize = () => {
      if (serviceRef.current) {
        serviceRef.current.resize(width, height);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Appliquer le redimensionnement initial
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [width, height]);
  
  // Mettre à jour les contrôles d'affichage météo
  useEffect(() => {
    if (!serviceRef.current) return;
    
    if (showWeather && col.weather) {
      serviceRef.current.updateWeather(col.weather);
    } else {
      serviceRef.current.configureWeather({ intensity: 0 });
    }
  }, [showWeather, col.weather]);
  
  // Mettre à jour les options GPU et qualité
  useEffect(() => {
    if (!serviceRef.current) return;
    
    serviceRef.current.configureWeather({
      useGPUComputation: useGPU,
      quality: weatherQuality,
      intensity: weatherIntensity
    });
    
    // Si les effets météo sont activés, mettre à jour avec les dernières données
    if (showWeather && col.weather) {
      serviceRef.current.updateWeather(col.weather);
    }
  }, [useGPU, weatherQuality, weatherIntensity, showWeather, col.weather]);
  
  // Mettre à jour l'heure du jour
  useEffect(() => {
    if (!serviceRef.current) return;
    
    serviceRef.current.setTimeOfDay(timeOfDay);
  }, [timeOfDay]);
  
  // Gérer le parcours virtuel
  useEffect(() => {
    if (!serviceRef.current) return;
    
    if (isFlythroughActive) {
      serviceRef.current.startFlythrough(flythroughSpeed);
    } else {
      serviceRef.current.stopFlythrough();
    }
  }, [isFlythroughActive, flythroughSpeed]);
  
  // Mettre à jour le niveau de neige
  useEffect(() => {
    if (!serviceRef.current) return;
    
    serviceRef.current.configureTerrain({ snowLevel });
  }, [snowLevel]);
  
  // Gestionnaire pour le changement de qualité
  const handleQualityChange = (quality: 'low' | 'medium' | 'high') => {
    setWeatherQuality(quality);
  };
  
  // Gestionnaire pour le changement d'intensité
  const handleIntensityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWeatherIntensity(parseFloat(e.target.value));
  };
  
  // Gestionnaire pour le changement d'heure
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeOfDay(parseInt(e.target.value, 10));
  };
  
  // Gestionnaire pour la vitesse du parcours
  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFlythroughSpeed(parseFloat(e.target.value));
  };
  
  // Gestionnaire pour le niveau de neige
  const handleSnowLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSnowLevel(parseInt(e.target.value, 10));
  };

  return (
    <div className={`advanced-col-3d-viewer ${className}`}>
      {/* Conteneur pour la visualisation 3D */}
      <div 
        ref={containerRef}
        className="viewer-container"
        style={{ width: `${width}px`, height: `${height}px` }}
      />
      
      {/* Bouton pour afficher/masquer les contrôles avancés */}
      <button
        className="controls-toggle"
        onClick={() => setShowAdvancedControls(!showAdvancedControls)}
      >
        {showAdvancedControls ? 'Masquer les contrôles avancés' : 'Contrôles avancés'}
      </button>
      
      {/* Contrôles principaux */}
      <div className="viewer-controls">
        {/* Contrôles météo */}
        <div className="control-group">
          <label htmlFor="weather-toggle">
            <input
              type="checkbox"
              id="weather-toggle"
              checked={showWeather}
              onChange={() => setShowWeather(!showWeather)}
            />
            Afficher les conditions météo
          </label>
        </div>
        
        {/* Contrôles de l'heure du jour */}
        <div className="control-group">
          <label htmlFor="time-of-day">
            Heure du jour: {timeOfDay}h
            <input
              type="range"
              id="time-of-day"
              min="0"
              max="24"
              step="1"
              value={timeOfDay}
              onChange={handleTimeChange}
            />
          </label>
        </div>
        
        {/* Contrôles de parcours virtuel */}
        <div className="control-group">
          <label htmlFor="flythrough-toggle">
            <input
              type="checkbox"
              id="flythrough-toggle"
              checked={isFlythroughActive}
              onChange={() => setIsFlythroughActive(!isFlythroughActive)}
            />
            Parcours virtuel
          </label>
          
          {isFlythroughActive && (
            <label htmlFor="flythrough-speed">
              Vitesse: 
              <input
                type="range"
                id="flythrough-speed"
                min="0.0001"
                max="0.005"
                step="0.0001"
                value={flythroughSpeed}
                onChange={handleSpeedChange}
              />
            </label>
          )}
        </div>
        
        {/* Contrôles de niveau de neige */}
        <div className="control-group">
          <label htmlFor="snow-level">
            Niveau de neige: {snowLevel}m
            <input
              type="range"
              id="snow-level"
              min="0"
              max="3000"
              step="100"
              value={snowLevel}
              onChange={handleSnowLevelChange}
            />
          </label>
        </div>
      </div>
      
      {/* Panneau de contrôles avancés */}
      {showAdvancedControls && (
        <div className="control-panel">
          <h3>Contrôles avancés</h3>
          
          {/* Section GPU et qualité */}
          <div className="control-section">
            <h4>Qualité des effets météo</h4>
            <div className="quality-controls">
              <button 
                className={weatherQuality === 'low' ? 'active' : ''}
                onClick={() => handleQualityChange('low')}
              >
                Basse
              </button>
              <button 
                className={weatherQuality === 'medium' ? 'active' : ''}
                onClick={() => handleQualityChange('medium')}
              >
                Moyenne
              </button>
              <button 
                className={weatherQuality === 'high' ? 'active' : ''}
                onClick={() => handleQualityChange('high')}
              >
                Haute
              </button>
            </div>
            
            {deviceCapabilities?.gpuComputation && (
              <div className="toggle-control">
                <label>
                  <input
                    type="checkbox"
                    checked={useGPU}
                    onChange={() => setUseGPU(!useGPU)}
                    disabled={!deviceCapabilities?.gpuComputation}
                  />
                  Utiliser accélération GPU
                </label>
              </div>
            )}
            
            <div className="intensity-control">
              <label>
                Intensité des effets météo:
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={weatherIntensity}
                  onChange={handleIntensityChange}
                />
                {weatherIntensity.toFixed(1)}
              </label>
            </div>
          </div>
          
          <div className="control-info">
            <p>
              <strong>Info:</strong> Les hautes qualités d'effets météo peuvent affecter les performances sur certains appareils.
              {deviceCapabilities?.isMobile && " Qualité réduite recommandée pour les appareils mobiles."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Composant pour visualiser un col avec les données météo en direct
 */
export const LiveWeatherCol3DViewer: React.FC<Omit<AdvancedCol3DViewerProps, 'col'> & { 
  col: Omit<Col, 'weather'>;
  lat: number;
  lng: number;
}> = ({ col, lat, lng, ...props }) => {
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Charger les données météo en direct
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        // Utiliser votre service météo existant
        const weatherService = window.services?.weatherService;
        
        if (weatherService) {
          const weatherData = await weatherService.getCurrentWeather(lat, lng);
          setWeather(weatherData);
        } else {
          console.error('Service météo non disponible');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données météo', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWeather();
    
    // Rafraîchir les données toutes les 15 minutes
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [lat, lng]);
  
  // Si les données météo sont en cours de chargement, afficher un indicateur
  if (loading && !weather) {
    return <div className="loading">Chargement des données météo...</div>;
  }
  
  // Une fois les données chargées, afficher le visualiseur 3D
  return (
    <AdvancedCol3DViewer
      {...props}
      col={{ ...col, weather: weather || undefined }}
    />
  );
};

export default AdvancedCol3DViewer;
