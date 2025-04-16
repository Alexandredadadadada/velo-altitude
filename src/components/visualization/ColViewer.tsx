/**
 * Composant de visualisation 3D des cols avec effets météorologiques adaptatifs
 * Utilise RealApiOrchestrator pour la récupération des données
 */

import React, { useEffect, useRef, useState } from 'react';
import { WeatherVisualizationService } from '../../services/visualization/WeatherVisualizationService';
import { GeoLocation } from '../../config/visualizationConfig';
import { DeviceCapabilities } from '../../utils/device';
import { RealApiOrchestrator } from '../../api/orchestration/RealApiOrchestrator';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// Hook personnalisé pour les capacités de l'appareil
const useDeviceCapabilities = (): DeviceCapabilities => {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
    isMobile: false,
    isTouchDevice: false,
    hasWebGL2: false,
    devicePixelRatio: 1,
    performanceLevel: 'medium'
  });

  useEffect(() => {
    // Détection des caractéristiques de l'appareil
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const canvas = document.createElement('canvas');
    const hasWebGL2 = !!canvas.getContext('webgl2');
    const devicePixelRatio = window.devicePixelRatio || 1;

    // Performance test simple
    const start = performance.now();
    const iterations = 10000;
    for (let i = 0; i < iterations; i++) {
      Math.sqrt(i);
    }
    const duration = performance.now() - start;

    let performanceLevel: 'low' | 'medium' | 'high' = 'medium';
    if (duration < 5) performanceLevel = 'high';
    else if (duration > 15) performanceLevel = 'low';

    // Ajustement du niveau de performance pour les appareils mobiles
    if (isMobile && performanceLevel === 'high') {
      performanceLevel = 'medium'; // Limitation pour l'autonomie de la batterie
    }

    setCapabilities({
      isMobile,
      isTouchDevice,
      hasWebGL2,
      devicePixelRatio,
      performanceLevel
    });
  }, []);

  return capabilities;
};

// Hook personnalisé pour le niveau de batterie
const useBatteryStatus = (): number | undefined => {
  const [batteryLevel, setBatteryLevel] = useState<number | undefined>(undefined);

  useEffect(() => {
    const getBatteryInfo = async () => {
      try {
        if ('getBattery' in navigator) {
          const batteryManager = await (navigator as any).getBattery();
          setBatteryLevel(batteryManager.level);

          // Mettre à jour lorsque le niveau de batterie change
          batteryManager.addEventListener('levelchange', () => {
            setBatteryLevel(batteryManager.level);
          });
        }
      } catch (error) {
        console.warn('Battery status API not supported or permission denied:', error);
      }
    };

    getBatteryInfo();
  }, []);

  return batteryLevel;
};

// Props du composant
interface ColViewerProps {
  colId: string;
  location: GeoLocation;
  onWeatherUpdate?: (conditions: any) => void;
  showWeatherInfo?: boolean;
  width?: string | number;
  height?: string | number;
  quality?: 'auto' | 'low' | 'medium' | 'high';
}

/**
 * Composant de visualisation 3D des cols avec intégration météo
 */
const ColViewer: React.FC<ColViewerProps> = ({
  colId,
  location,
  onWeatherUpdate,
  showWeatherInfo = true,
  width = '100%',
  height = '500px',
  quality = 'auto'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const visualizationService = useRef<WeatherVisualizationService | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // État du composant
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [weatherConditions, setWeatherConditions] = useState<any>(null);
  const [isEstimated, setIsEstimated] = useState<boolean>(false);
  
  // Hooks pour les capacités de l'appareil et le niveau de batterie
  const deviceCapabilities = useDeviceCapabilities();
  const batteryLevel = useBatteryStatus();
  
  // Initialisation du service et de la scène 3D
  useEffect(() => {
    if (!containerRef.current) return;
    
    const initializeVisualization = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obtenir le service météo via l'orchestrateur d'API
        // Au lieu d'une importation directe de mock ou d'API
        const apiOrchestrator = RealApiOrchestrator.getInstance();
        const weatherService = await apiOrchestrator.getWeatherService();
        
        if (!weatherService) {
          throw new Error("Service météo non disponible");
        }
        
        // Création de la scène 3D et du service de visualisation
        const scene = await initializeScene();
        
        // Création du service de visualisation météo
        visualizationService.current = new WeatherVisualizationService(
          weatherService,
          deviceCapabilities,
          scene,
          batteryLevel
        );
        
        // Première mise à jour de la visualisation
        await updateVisualization();
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors de l\'initialisation de la visualisation 3D:', err);
        setError('Impossible de charger la visualisation 3D du col. Veuillez réessayer ultérieurement.');
        setLoading(false);
      }
    };
    
    // Fonction pour initialiser la scène 3D
    const initializeScene = async () => {
      // Cette fonction dépend de votre implémentation Three.js
      // Elle devrait créer et configurer la scène 3D dans le conteneur
      console.log('Initializing 3D scene in container');
      
      return {}; // Retourner l'objet scène
    };
    
    initializeVisualization();
    
    // Nettoyage des ressources
    return () => {
      if (visualizationService.current) {
        visualizationService.current.destroy();
        visualizationService.current = null;
      }
    };
  }, [deviceCapabilities]); // Recréer uniquement si les capacités de l'appareil changent
  
  // Mettre à jour la visualisation lorsque le col ou la localisation change
  useEffect(() => {
    updateVisualization();
  }, [colId, location]);
  
  // Mettre à jour la qualité selon le paramètre et les capacités de l'appareil
  useEffect(() => {
    if (!visualizationService.current) return;
    
    let qualityLevel: 'low' | 'medium' | 'high';
    
    if (quality === 'auto') {
      qualityLevel = deviceCapabilities.performanceLevel;
    } else {
      qualityLevel = quality;
    }
    
    // Surcharge pour les appareils mobiles avec batterie faible
    if (deviceCapabilities.isMobile && batteryLevel !== undefined && batteryLevel < 0.2) {
      qualityLevel = 'low';
    }
    
    visualizationService.current.setQualityLevel(qualityLevel);
  }, [quality, deviceCapabilities.performanceLevel, batteryLevel]);
  
  // Fonction pour mettre à jour la visualisation
  const updateVisualization = async () => {
    if (!visualizationService.current || !colId || !location) return;
    
    try {
      // Intégration avec RealApiOrchestrator pour les données
      const apiOrchestrator = RealApiOrchestrator.getInstance();
      const weatherConditions = await apiOrchestrator.getColWeatherConditions(colId, location);
      
      // Mise à jour de la visualisation météo
      await visualizationService.current.updateVisualization(colId, location);
      
      // Mise à jour des états
      setWeatherConditions(weatherConditions);
      setIsEstimated(weatherConditions.isEstimated || false);
      
      // Callback pour informer le parent
      if (onWeatherUpdate) {
        onWeatherUpdate(weatherConditions);
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la visualisation:', err);
      // Ne pas afficher d'erreur pour ne pas perturber l'expérience utilisateur
      // La visualisation continuera d'utiliser les dernières données valides
    }
  };
  
  return (
    <Box
      sx={{
        position: 'relative',
        width,
        height,
        backgroundColor: theme.palette.background.paper,
        borderRadius: 1,
        overflow: 'hidden',
        boxShadow: 3
      }}
    >
      {/* Conteneur pour la visualisation 3D */}
      <Box
        ref={containerRef}
        sx={{
          width: '100%',
          height: '100%',
          position: 'relative'
        }}
      />
      
      {/* Indicateur de chargement */}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 10
          }}
        >
          <CircularProgress color="primary" />
          <Typography variant="body1" color="white" sx={{ mt: 2 }}>
            Chargement de la visualisation...
          </Typography>
        </Box>
      )}
      
      {/* Message d'erreur */}
      {error && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '80%',
            zIndex: 10
          }}
        >
          <Alert severity="error">{error}</Alert>
        </Box>
      )}
      
      {/* Informations météo */}
      {showWeatherInfo && weatherConditions && !loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            backgroundColor: 'rgba(255,255,255,0.8)',
            padding: 1,
            borderRadius: 1,
            boxShadow: 1,
            maxWidth: isMobile ? '100%' : '300px',
            zIndex: 5
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            Conditions météo
          </Typography>
          <Typography variant="body2">
            Température: {weatherConditions.temperature}°C
          </Typography>
          <Typography variant="body2">
            Vent: {weatherConditions.windSpeed} km/h
          </Typography>
          {weatherConditions.precipitation > 0 && (
            <Typography variant="body2">
              Précipitations: {weatherConditions.precipitation} mm
            </Typography>
          )}
          {isEstimated && (
            <Typography variant="caption" color="text.secondary">
              Données estimées
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ColViewer;
