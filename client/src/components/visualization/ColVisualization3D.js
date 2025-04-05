import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, Text, useProgress } from '@react-three/drei';
import { TextureLoader } from 'three/src/loaders/TextureLoader';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  ButtonGroup, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  CircularProgress, 
  Alert,
  Divider,
  IconButton,
  Slider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  PlayArrow as PlayArrowIcon, 
  Pause as PauseIcon, 
  Speed as SpeedIcon,
  DirectionsBike as DirectionsBikeIcon 
} from '@mui/icons-material';
import progressive3DLoader, { DETAIL_LEVELS } from '../../services/progressive3DLoader';
import timeoutConfigService from '../../services/timeoutConfig';
import featureFlagsService from '../../services/featureFlags';
import apiCacheService, { CACHE_STRATEGIES } from '../../services/apiCache';
import deviceCapabilityDetector from '../../utils/deviceCapabilityDetector';
import threeDConfigManager from '../../utils/3DConfigManager';
import mobileOptimizer from '../../utils/mobileOptimizer';
import batteryOptimizer from '../../utils/batteryOptimizer'; // Importer le service batteryOptimizer

// Composant principal
const ColVisualization3D = ({ passId, elevationData, surfaceTypes, pointsOfInterest }) => {
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPOI, setSelectedPOI] = useState(null);
  const [filteredPointsOfInterest, setFilteredPointsOfInterest] = useState([]);
  const [qualityLevel, setQualityLevel] = useState(DETAIL_LEVELS.MEDIUM);
  const [viewType, setViewType] = useState('free');
  const [poiFilters, setPoiFilters] = useState({
    viewpoint: true,
    restaurant: true,
    landmark: true,
    parking: true,
    danger: true
  });
  
  // Nouvelles variables d'état pour les optimisations
  const [deviceCapabilities, setDeviceCapabilities] = useState(null);
  const [renderConfig, setRenderConfig] = useState(null);
  const [adaptiveQualityEnabled, setAdaptiveQualityEnabled] = useState(true);
  const [batteryMode, setBatteryMode] = useState(false);
  
  // Référence aux contrôleurs et renderers pour l'optimisation
  const controlsRef = useRef(null);
  const rendererRef = useRef(null);
  const textureLoaderRef = useRef(null);
  
  // Stats de performance
  const performanceStatsRef = useRef({
    frameRate: 0,
    frameRateHistory: [],
    lastFrameTime: 0,
    frameCount: 0,
    lastPerformanceAdjustment: 0
  });

  const [trailInfo, setTrailInfo] = useState({
    difficulty: 'Difficile',
    length: '12.5 km',
    elevationGain: '850 m'
  });
  
  // Initialisation de la visualisation
  useEffect(() => {
    const initializeVisualization = async () => {
      try {
        // Réinitialiser les états
        setIsLoading(true);
        setError(null);
        setSelectedPOI(null);
        
        // Charger le pass depuis l'API si nécessaire
        if (!elevationData || !surfaceTypes) {
          const passData = await apiCacheService.get(`/api/cols/${passId}`, {
            strategy: CACHE_STRATEGIES.CACHE_FIRST
          });
          
          if (!passData) {
            setError('Impossible de charger les données du col');
            setIsLoading(false);
            return;
          }
          
          // Mettre à jour les états avec les données chargées
          // Dans un cas réel, vous adapteriez cette partie à votre structure de données
        }
        
        // Détection des capacités de l'appareil
        const capabilities = await deviceCapabilityDetector.getCapabilities();
        setDeviceCapabilities(capabilities);
        
        // Obtenir la configuration optimale pour ce composant
        const config = threeDConfigManager.getOptimalConfig('colVisualization', {
          forceBatterySaving: batteryMode
        });
        setRenderConfig(config);
        
        // Mettre à jour le niveau de qualité en fonction de la configuration
        setQualityLevel(progressive3DLoader.getDetailLevelFromString(config.modelDetailLevel));
        
        // Créer et optimiser le loader de textures pour le chargement progressif
        if (!textureLoaderRef.current) {
          textureLoaderRef.current = mobileOptimizer.setupProgressiveTextureLoading(new THREE.TextureLoader());
        }
        
        // Initialiser le chemin de fly-through si les données sont disponibles
        if (elevationData && elevationData.path) {
          initializeFlyThroughPath();
        }
        
        // Configurer les listeners pour les ajustements de qualité adaptatifs
        if (adaptiveQualityEnabled) {
          setupAdaptiveQualityListeners();
        }
        
        // Initialiser le service batteryOptimizer
        await batteryOptimizer.initialize();
        setBatteryMode(batteryOptimizer.isBatteryModeActive());
        
        setIsLoading(false);
      } catch (err) {
        console.error('Erreur lors de l\'initialisation de la visualisation:', err);
        setError('Une erreur est survenue lors du chargement de la visualisation 3D');
        setIsLoading(false);
      }
    };
    
    initializeVisualization();
    
    // Nettoyage lors du démontage du composant
    return () => {
      // Arrêter les animations et les workers
      if (flyThroughAnimationRef.current) {
        cancelAnimationFrame(flyThroughAnimationRef.current);
      }
      
      // Libérer les ressources
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [passId, elevationData, pointsOfInterest, batteryMode, adaptiveQualityEnabled]);
  
  // Filtrer les points d'intérêt
  useEffect(() => {
    if (!pointsOfInterest || !Array.isArray(pointsOfInterest)) {
      setFilteredPointsOfInterest([]);
      return;
    }
    
    // Appliquer les filtres sélectionnés
    const filtered = Object.values(poiFilters).every(v => v === false)
      ? pointsOfInterest 
      : pointsOfInterest.filter(poi => poi && poi.type && poiFilters[poi.type]);
    
    setFilteredPointsOfInterest(filtered);
  }, [poiFilters, pointsOfInterest]);
  
  // Gérer les changements de qualité
  const handleQualityChange = useCallback((level) => {
    setQualityLevel(level);
    
    // Mettre à jour la configuration 3D
    const newConfig = { ...renderConfig };
    newConfig.modelDetailLevel = progressive3DLoader.getStringFromDetailLevel(level);
    setRenderConfig(newConfig);
    
    // Désactiver l'ajustement adaptatif si changement manuel
    setAdaptiveQualityEnabled(false);
  }, [renderConfig]);
  
  // Nouvelle fonction pour configurer les listeners d'ajustement adaptatif de qualité
  const setupAdaptiveQualityListeners = useCallback(() => {
    // Écouter les événements d'ajustement de qualité
    const handleQualityAdjustment = (event) => {
      const { qualityMultiplier, reason } = event.detail;
      
      if (!renderConfig) return;
      
      // Ajuster le niveau de qualité en fonction du multiplicateur
      let newLevel = qualityLevel;
      if (qualityMultiplier <= 0.5) {
        newLevel = DETAIL_LEVELS.LOW;
      } else if (qualityMultiplier <= 0.8) {
        newLevel = DETAIL_LEVELS.MEDIUM;
      } else {
        newLevel = DETAIL_LEVELS.HIGH;
      }
      
      // Ne mettre à jour que si le niveau change
      if (newLevel !== qualityLevel) {
        setQualityLevel(newLevel);
        
        // Mettre à jour la configuration
        const newConfig = { ...renderConfig };
        newConfig.modelDetailLevel = progressive3DLoader.getStringFromDetailLevel(newLevel);
        setRenderConfig(newConfig);
        
        console.log(`Ajustement automatique de la qualité: ${progressive3DLoader.getStringFromDetailLevel(newLevel)} (${reason})`);
      }
    };
    
    // Écouter les événements d'optimisation
    window.addEventListener('quality-adjustment', handleQualityAdjustment);
    
    // Nettoyage
    return () => {
      window.removeEventListener('quality-adjustment', handleQualityAdjustment);
    };
  }, [qualityLevel, renderConfig]);
  
  // Nouvelle fonction pour gérer le mode économie de batterie
  const handleBatteryModeToggle = useCallback(() => {
    const newBatteryMode = !batteryMode;
    setBatteryMode(newBatteryMode);
    
    // Mettre à jour la configuration
    const config = threeDConfigManager.getOptimalConfig('colVisualization', {
      forceBatterySaving: newBatteryMode
    });
    setRenderConfig(config);
    
    // Mettre à jour le niveau de qualité
    setQualityLevel(progressive3DLoader.getDetailLevelFromString(config.modelDetailLevel));
    
    console.log(`Mode économie de batterie ${newBatteryMode ? 'activé' : 'désactivé'}`);
    
    // Initialiser le service batteryOptimizer
    batteryOptimizer.setBatteryMode(newBatteryMode);
  }, [batteryMode]);

  // Composant interne pour optimiser le renderer THREE.js
  const SceneManager = () => {
    const { gl, camera } = useThree();
    
    // Stocker la référence au renderer
    useEffect(() => {
      rendererRef.current = gl;
      
      // Appliquer les optimisations mobiles
      if (deviceCapabilities && (deviceCapabilities.flags.isMobile || deviceCapabilities.flags.isLowEndDevice)) {
        mobileOptimizer.optimizeRenderer(gl);
      }
      
      // Configurer le rendu en fonction de la configuration
      if (renderConfig) {
        // Paramètres de shadow map
        if (renderConfig.shadowsEnabled) {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          gl.shadowMap.autoUpdate = false;
          gl.shadowMap.needsUpdate = true;
        } else {
          gl.shadowMap.enabled = false;
        }
        
        // Paramètres de clearing
        gl.setClearColor(new THREE.Color('#87CEEB'), 1); 
        
        // Limiter le framerate si nécessaire
        if (renderConfig.maxFrameRate && renderConfig.maxFrameRate < 60) {
          gl.setAnimationLoop((time) => {
            const elapsed = time - performanceStatsRef.current.lastFrameTime;
            const targetElapsed = 1000 / renderConfig.maxFrameRate;
            
            if (elapsed >= targetElapsed) {
              performanceStatsRef.current.lastFrameTime = time;
              gl.render(gl.scene, camera);
            }
          });
        }
      }
      
      // Nettoyer lors du démontage
      return () => {
        if (gl.setAnimationLoop) {
          gl.setAnimationLoop(null);
        }
      };
    }, [gl, camera, deviceCapabilities, renderConfig]);
    
    // Suivre le FPS pour les ajustements adaptatifs
    useFrame((state, delta) => {
      if (!adaptiveQualityEnabled) return;
      
      // Calculer le FPS
      performanceStatsRef.current.frameCount++;
      const now = performance.now();
      const elapsed = now - performanceStatsRef.current.lastPerformanceCheck;
      
      // Mettre à jour les statistiques toutes les secondes
      if (elapsed > 1000) {
        const currentFPS = Math.round(performanceStatsRef.current.frameCount * 1000 / elapsed);
        performanceStatsRef.current.frameRate = currentFPS;
        
        // Ajouter à l'historique
        performanceStatsRef.current.frameRateHistory.push(currentFPS);
        if (performanceStatsRef.current.frameRateHistory.length > 10) {
          performanceStatsRef.current.frameRateHistory.shift();
        }
        
        // Réinitialiser les compteurs
        performanceStatsRef.current.frameCount = 0;
        performanceStatsRef.current.lastPerformanceCheck = now;
      }
    });
    
    return null;
  };

  return (
    <Paper elevation={3} sx={{ mb: 4, overflow: 'hidden', position: 'relative' }}>
      <VisualizationContainer>
        {error ? (
          <StyledAlert severity="error">{error}</StyledAlert>
        ) : isLoading ? (
          <LoadingOverlay>
            <LoadingIndicator />
          </LoadingOverlay>
        ) : (
          <>
            <Canvas 
              ref={canvasRef} 
              camera={{ position: [0, 10, 20], fov: 60 }}
              shadows={renderConfig ? renderConfig.shadowsEnabled : false}
              dpr={window.devicePixelRatio > 2 ? 2 : window.devicePixelRatio} // Limiter le DPR à 2 pour les performances
              performance={{ min: 0.5 }} // Réduire la résolution si nécessaire pour maintenir les performances
            >
              {/* Ajouter le gestionnaire de scène pour les optimisations */}
              <SceneManager />
              
              {/* Reste du contenu */}
              <ambientLight intensity={0.5} />
              <directionalLight 
                position={[10, 20, 10]} 
                intensity={0.8} 
                castShadow={renderConfig ? renderConfig.shadowsEnabled : false}
                shadow-mapSize-width={renderConfig ? renderConfig.shadowMapSize || 1024 : 1024}
                shadow-mapSize-height={renderConfig ? renderConfig.shadowMapSize || 1024 : 1024}
              />
              
              {/* Terrain */}
              <Terrain 
                elevationData={elevationData} 
                surfaceTypes={surfaceTypes} 
                detailLevel={qualityLevel}
                renderConfig={renderConfig}
              />
              
              {/* Points d'intérêt - limités selon les capacités de l'appareil */}
              {filteredPointsOfInterest.slice(0, renderConfig ? renderConfig.maxPointsOfInterest : 25).map((poi, index) => (
                <PointOfInterest 
                  key={`poi-${index}`}
                  position={[poi.x, (poi.elevation || 0) * 0.1 + 1, poi.z]} 
                  label={poi.name}
                  type={poi.type}
                  isSelected={selectedPOI === poi}
                  onClick={() => handleSelectPOI(poi)}
                  detailLevel={qualityLevel}
                />
              ))}
              
              {/* Contrôles optimisés pour différents appareils */}
              <OrbitControls 
                ref={controlsRef}
                enableDamping={renderConfig ? !renderConfig.useSimplifiedGeometry : true}
                dampingFactor={0.1}
                minDistance={5}
                maxDistance={100}
                target={selectedPOI ? [selectedPOI.x, (selectedPOI.elevation || 0) * 0.1, selectedPOI.z] : [0, 0, 0]}
                // Support tactile amélioré
                touchAction="none" // Empêcher le comportement de défilement par défaut sur tactile
                touches={{
                  ONE: THREE.TOUCH.ROTATE,
                  TWO: THREE.TOUCH.DOLLY_PAN
                }}
                // Optimisations tactiles via mobileOptimizer
                {...(deviceCapabilities?.flags.isMobile ? {
                  rotateSpeed: 0.8,
                  zoomSpeed: 1.2,
                  panSpeed: 0.8
                } : {})}
              />
              
              {/* Ajouter la caméra de fly-through lorsqu'elle est active */}
              {viewType === 'flythrough' && <FlyThroughCamera />}
            </Canvas>
            
            {/* Contrôles de qualité et informations */}
            <OverlayContainer>
              <Box sx={{ p: 1.5 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Visualisation 3D</Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ mr: 1 }}>Qualité:</Typography>
                  <ButtonGroup size="small">
                    <Button 
                      variant={qualityLevel === DETAIL_LEVELS.LOW ? "contained" : "outlined"}
                      onClick={() => handleQualityChange(DETAIL_LEVELS.LOW)}
                    >
                      Basse
                    </Button>
                    <Button 
                      variant={qualityLevel === DETAIL_LEVELS.MEDIUM ? "contained" : "outlined"}
                      onClick={() => handleQualityChange(DETAIL_LEVELS.MEDIUM)}
                    >
                      Moyenne
                    </Button>
                    <Button 
                      variant={qualityLevel === DETAIL_LEVELS.HIGH ? "contained" : "outlined"}
                      onClick={() => handleQualityChange(DETAIL_LEVELS.HIGH)}
                      // Désactiver le niveau élevé sur les appareils faibles
                      disabled={deviceCapabilities?.flags.isLowEndDevice}
                    >
                      Haute
                    </Button>
                  </ButtonGroup>
                </Box>
                
                {/* Bouton pour activer/désactiver l'ajustement adaptatif de qualité */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AdaptiveQualityFlag active={adaptiveQualityEnabled} onClick={() => setAdaptiveQualityEnabled(!adaptiveQualityEnabled)}>
                    Auto
                  </AdaptiveQualityFlag>
                  
                  {/* Bouton pour activer/désactiver le mode économie de batterie */}
                  <AdaptiveQualityFlag active={batteryMode} onClick={handleBatteryModeToggle}>
                    Éco
                  </AdaptiveQualityFlag>
                  
                  {/* Afficher le FPS pour le débogage */}
                  {featureFlagsService.isEnabled('showPerformanceMetrics') && (
                    <Typography variant="caption" sx={{ ml: 1 }}>
                      {performanceStatsRef.current.frameRate} FPS
                    </Typography>
                  )}
                </Box>
                
                <Divider sx={{ my: 1 }} />
                
                <Typography variant="body2" sx={{ mb: 1 }}>Caméra:</Typography>
                <ButtonGroup size="small" sx={{ mb: 1 }}>
                  <Button 
                    variant={viewType === 'free' ? "contained" : "outlined"}
                    onClick={() => handleViewChange('free')}
                  >
                    Libre
                  </Button>
                  <Button 
                    variant={viewType === 'overview' ? "contained" : "outlined"}
                    onClick={() => handleViewChange('overview')}
                  >
                    Vue d'ensemble
                  </Button>
                  <Button 
                    variant={viewType === 'flythrough' ? "contained" : "outlined"}
                    onClick={() => handleViewChange('flythrough')}
                    startIcon={<DirectionsBikeIcon />}
                    // Désactiver sur les appareils faibles si la configuration recommande de le faire
                    disabled={deviceCapabilities?.flags.isLowEndDevice && renderConfig?.useSimplifiedGeometry}
                  >
                    Parcours
                  </Button>
                </ButtonGroup>
                
                <Divider sx={{ my: 1 }} />
                
                <Typography variant="body2" sx={{ mb: 1 }}>Filtre des points d'intérêt:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  <PoiFilterChip 
                    active={poiFilters.viewpoint} 
                    onClick={() => handlePOIFilterChange('viewpoint')}
                  >
                    Panoramas
                  </PoiFilterChip>
                  <PoiFilterChip 
                    active={poiFilters.restaurant} 
                    onClick={() => handlePOIFilterChange('restaurant')}
                  >
                    Restaurants
                  </PoiFilterChip>
                  <PoiFilterChip 
                    active={poiFilters.landmark} 
                    onClick={() => handlePOIFilterChange('landmark')}
                  >
                    Points remarquables
                  </PoiFilterChip>
                  <PoiFilterChip 
                    active={poiFilters.parking} 
                    onClick={() => handlePOIFilterChange('parking')}
                  >
                    Parkings
                  </PoiFilterChip>
                  <PoiFilterChip 
                    active={poiFilters.danger} 
                    onClick={() => handlePOIFilterChange('danger')}
                  >
                    Zones dangereuses
                  </PoiFilterChip>
                </Box>
              </Box>
              
              {/* Afficher les informations sur l'appareil et la qualité si le flag est activé */}
              {featureFlagsService.isEnabled('showDeviceCapabilities') && deviceCapabilities && (
                <Box sx={{ p: 1.5, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                  <Typography variant="caption" component="div">
                    Appareil: {deviceCapabilities.flags.isMobile ? 'Mobile' : deviceCapabilities.flags.isTablet ? 'Tablette' : 'Desktop'}
                  </Typography>
                  <Typography variant="caption" component="div">
                    GPU: {deviceCapabilities.gpu.vendor ? deviceCapabilities.gpu.vendor.split(' ')[0] : 'Non détecté'} ({Math.round(deviceCapabilities.gpu.estimatedMemory)}MB)
                  </Typography>
                  <Typography variant="caption" component="div">
                    CPU: {deviceCapabilities.cpu.cores} cœurs
                  </Typography>
                  <Typography variant="caption" component="div">
                    Réseau: {deviceCapabilities.network.effectiveType}
                  </Typography>
                </Box>
              )}
            </OverlayContainer>
            
            {/* Info trail */}
            <TrailInfoContainer>
              <TrailInfoItem>
                <Typography variant="caption">Difficulté</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{trailInfo.difficulty}</Typography>
              </TrailInfoItem>
              <TrailInfoItem>
                <Typography variant="caption">Distance</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{trailInfo.length}</Typography>
              </TrailInfoItem>
              <TrailInfoItem>
                <Typography variant="caption">Dénivelé</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{trailInfo.elevationGain}</Typography>
              </TrailInfoItem>
            </TrailInfoContainer>
          </>
        )}
      </VisualizationContainer>
    </Paper>
  );
};

export default ColVisualization3D;
