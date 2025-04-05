import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Box, Typography, Grid, Paper, Slider, Button, IconButton, CircularProgress, Alert, Divider } from '@mui/material';
import { 
  PlayArrow, Pause, Replay, Speed, 
  DirectionsBike, Person, Timeline, 
  Visibility, VisibilityOff, CameraAlt,
  BatteryFull, BatteryAlert
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Imports des nouveaux services d'optimisation
import deviceCapabilityDetector from '../../utils/deviceCapabilityDetector';
import threeDConfigManager from '../../utils/3DConfigManager';
import mobileOptimizer from '../../utils/mobileOptimizer';
import apiCacheService, { CACHE_STRATEGIES } from '../../services/apiCache';
import featureFlagsService from '../../services/featureFlags';

// Composant qui visualise l'entraînement en 3D
const TrainingVisualizer3D = ({ 
  workout, 
  userProfile, 
  onComplete, 
  onPause, 
  embedded = false 
}) => {
  // Références
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const cyclistRef = useRef(null);
  const controlsRef = useRef(null);
  const animationRef = useRef(null);
  const terrainRef = useRef(null);
  
  // États
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [currentPower, setCurrentPower] = useState(0);
  const [currentHeartRate, setCurrentHeartRate] = useState(0);
  const [currentCadence, setCurrentCadence] = useState(0);
  const [showPowerZones, setShowPowerZones] = useState(true);
  const [viewMode, setViewMode] = useState('follow'); // 'follow', 'overhead', 'side'
  
  // Nouvelles variables d'état pour les optimisations
  const [deviceCapabilities, setDeviceCapabilities] = useState(null);
  const [renderConfig, setRenderConfig] = useState(null);
  const [adaptiveQualityEnabled, setAdaptiveQualityEnabled] = useState(true);
  const [batteryMode, setBatteryMode] = useState(false);
  
  // Stats de performance
  const performanceStatsRef = useRef({
    frameRate: 0,
    frameRateHistory: [],
    lastFrameTime: 0,
    frameCount: 0,
    lastPerformanceCheck: performance.now()
  });
  
  // Initialisation de la scène THREE.js
  useEffect(() => {
    if (!containerRef.current || !workout) return;
    
    const initializeScene = async () => {
      try {
        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        // Détection des capacités de l'appareil
        const capabilities = await deviceCapabilityDetector.getCapabilities();
        setDeviceCapabilities(capabilities);
        
        // Obtenir la configuration optimale pour ce composant
        const config = threeDConfigManager.getOptimalConfig('trainingVisualizer', {
          forceBatterySaving: batteryMode
        });
        setRenderConfig(config);
        
        // Créer la scène
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87ceeb); // ciel bleu
        
        // Appliquer le brouillard en fonction de la configuration
        if (config && !config.useSimplifiedGeometry) {
          scene.fog = new THREE.FogExp2(0x87ceeb, 0.002);
        }
        sceneRef.current = scene;
        
        // Caméra avec paramètres adaptés
        const fov = capabilities?.flags.isMobile ? 65 : 75; // FOV plus large sur mobile pour une meilleure vue
        const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 1000);
        camera.position.set(0, 20, 40);
        cameraRef.current = camera;
        
        // Renderer avec optimisations
        const renderer = new THREE.WebGLRenderer({ 
          antialias: config ? !config.useSimplifiedGeometry : true,
          precision: config ? config.renderPrecision || 'highp' : 'highp'
        });
        renderer.setSize(width, height);
        
        // Ajuster la densité de pixels en fonction de l'appareil
        const dpr = Math.min(window.devicePixelRatio, config?.maxPixelRatio || 2);
        renderer.setPixelRatio(dpr);
        
        // Activer les ombres seulement si la configuration le permet
        renderer.shadowMap.enabled = config ? config.shadowsEnabled : true;
        if (renderer.shadowMap.enabled) {
          renderer.shadowMap.type = THREE.PCFSoftShadowMap;
          // Pour les appareils moins puissants, ne mettre à jour les ombres que lors des changements de caméra
          renderer.shadowMap.autoUpdate = !capabilities?.flags.isLowEndDevice;
          renderer.shadowMap.needsUpdate = true;
        }
        
        // Nettoyer tout renderer existant avant d'en ajouter un nouveau
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;
        
        // Appliquer les optimisations mobiles
        if (capabilities && (capabilities.flags.isMobile || capabilities.flags.isLowEndDevice)) {
          mobileOptimizer.optimizeRenderer(renderer);
        }
        
        // Contrôles optimisés
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = config ? !config.useSimplifiedGeometry : true;
        controls.dampingFactor = 0.05;
        controls.enabled = false; // désactivé par défaut pour l'animation automatique
        
        // Optimisations tactiles
        if (capabilities?.flags.isMobile) {
          controls.rotateSpeed = 0.8;
          controls.zoomSpeed = 1.2;
          controls.touches = {
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN
          };
          controls.touchAction = "none"; // Empêcher le comportement de défilement par défaut
        }
        
        controlsRef.current = controls;
        
        // Éclairage avec qualité adaptative
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = renderer.shadowMap.enabled;
        
        // Ajuster la qualité des ombres en fonction de la configuration
        if (directionalLight.castShadow && config) {
          directionalLight.shadow.mapSize.width = config.shadowMapSize || 1024;
          directionalLight.shadow.mapSize.height = config.shadowMapSize || 1024;
          directionalLight.shadow.camera.near = 10;
          directionalLight.shadow.camera.far = 200;
          directionalLight.shadow.bias = -0.001;
        }
        scene.add(directionalLight);
        
        // Créer le terrain et le cycliste
        const terrain = createTrainingTerrain();
        terrainRef.current = terrain;
        scene.add(terrain);
        
        const cyclist = createCyclist();
        cyclistRef.current = cyclist;
        scene.add(cyclist);
        
        // Configurer l'écouteur de redimensionnement
        window.addEventListener('resize', handleResize);
        
        // Configuration de la boucle d'animation adaptative
        if (config && config.maxFrameRate && config.maxFrameRate < 60) {
          // Limiter le framerate pour économiser la batterie
          renderer.setAnimationLoop((time) => {
            const elapsed = time - performanceStatsRef.current.lastFrameTime;
            const targetElapsed = 1000 / config.maxFrameRate;
            
            if (elapsed >= targetElapsed) {
              performanceStatsRef.current.lastFrameTime = time;
              animate();
            }
          });
        } else {
          // Animation standard
          animate();
        }
        
        // Mettre à jour le mode de caméra initialement
        updateCameraView(viewMode);
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors de l\'initialisation de la scène:', err);
        setLoading(false);
      }
    };
    
    initializeScene();
    
    // Nettoyage
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (rendererRef.current && rendererRef.current.setAnimationLoop) {
        rendererRef.current.setAnimationLoop(null);
      }
      
      if (rendererRef.current && rendererRef.current.domElement && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      // Libérer les ressources 3D
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [workout, batteryMode]);

  // Mise à jour de la vue de la caméra en fonction du mode de visualisation
  const updateCameraView = (mode) => {
    if (!cameraRef.current || !cyclistRef.current) return;
    
    const camera = cameraRef.current;
    const cyclist = cyclistRef.current;
    
    switch (mode) {
      case 'follow':
        // Vue à la troisième personne, derrière le cycliste
        camera.position.set(0, 3, 15);
        camera.lookAt(cyclist.position);
        if (controlsRef.current) controlsRef.current.enabled = false;
        break;
      case 'overhead':
        // Vue de dessus
        camera.position.set(0, 20, 0);
        camera.lookAt(cyclist.position);
        if (controlsRef.current) controlsRef.current.enabled = false;
        break;
      case 'side':
        // Vue de côté
        camera.position.set(15, 5, 0);
        camera.lookAt(cyclist.position);
        if (controlsRef.current) controlsRef.current.enabled = false;
        break;
      case 'free':
        // Vue libre, contrôlée par l'utilisateur
        camera.position.set(10, 10, 10);
        camera.lookAt(cyclist.position);
        if (controlsRef.current) controlsRef.current.enabled = true;
        break;
      default:
        break;
    }
  };
  
  // Créer le terrain d'entraînement
  const createTrainingTerrain = useCallback(() => {
    const terrainGroup = new THREE.Group();
    
    // Sol avec qualité adaptative
    const detailFactor = renderConfig?.useSimplifiedGeometry ? 0.5 : 1;
    const groundSegments = Math.floor((deviceCapabilities?.flags.isLowEndDevice ? 50 : 100) * detailFactor);
    
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000, groundSegments, groundSegments);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x267F00, 
      roughness: 0.8, 
      metalness: 0.2,
      flatShading: renderConfig?.useSimplifiedGeometry
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = renderConfig ? renderConfig.shadowsEnabled : true;
    terrainGroup.add(ground);
    
    // Route avec qualité adaptative
    const roadSegments = Math.floor((deviceCapabilities?.flags.isLowEndDevice ? 25 : 50) * detailFactor);
    const roadGeometry = new THREE.PlaneGeometry(8, 1000, 4, roadSegments);
    const roadMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333, 
      roughness: 0.5,
      flatShading: renderConfig?.useSimplifiedGeometry
    });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.01; // légèrement au-dessus du sol
    road.receiveShadow = renderConfig ? renderConfig.shadowsEnabled : true;
    terrainGroup.add(road);
    
    // Lignes de route
    const addRoadLine = (posX) => {
      // Simplifier les lignes de route sur les appareils à faible puissance
      const lineGeometry = new THREE.PlaneGeometry(0.2, 1000);
      const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const line = new THREE.Mesh(lineGeometry, lineMaterial);
      line.rotation.x = -Math.PI / 2;
      line.position.set(posX, 0.02, 0);
      terrainGroup.add(line);
    };
    
    addRoadLine(-3); // ligne gauche
    addRoadLine(3);  // ligne droite
    
    // Marqueurs de distance - limiter leur nombre sur les appareils à faible puissance
    const createDistanceMarkers = () => {
      const totalDuration = workout.duration * 60; // en secondes
      // Ajuster la distance entre les marqueurs selon le niveau de détail
      const distanceStep = deviceCapabilities?.flags.isLowEndDevice ? 200 : 
                          (renderConfig?.useSimplifiedGeometry ? 150 : 100);
      
      // Limiter le nombre total de marqueurs
      const maxMarkers = renderConfig?.maxDistanceMarkers || 20;
      let markersCount = 0;
      
      for (let distance = 0; distance <= 1000; distance += distanceStep) {
        if (markersCount >= maxMarkers) break;
        
        // Panneau de distance - simplifier la géométrie sur les appareils à faible puissance
        const markerGeometry = new THREE.BoxGeometry(1, 1, 0.1);
        const markerMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.set(5, 1, -distance);
        marker.castShadow = renderConfig ? renderConfig.shadowsEnabled : true;
        marker.receiveShadow = marker.castShadow;
        
        // Texte de distance avec résolution adaptative
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        // Réduire la taille du canvas pour les appareils à faible puissance
        const canvasSize = deviceCapabilities?.flags.isLowEndDevice ? 32 : 64;
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        
        context.fillStyle = '#000000';
        context.font = `Bold ${canvasSize/2.5}px Arial`;
        context.textAlign = 'center';
        context.fillText(distance + 'm', canvasSize/2, canvasSize*0.75);
        
        const texture = new THREE.CanvasTexture(canvas);
        // Réduire la qualité des textures pour les appareils à faible puissance
        if (deviceCapabilities?.flags.isLowEndDevice) {
          texture.minFilter = THREE.NearestFilter;
          texture.magFilter = THREE.NearestFilter;
        }
        
        const textMaterial = new THREE.MeshBasicMaterial({ map: texture });
        
        const textPlane = new THREE.Mesh(
          new THREE.PlaneGeometry(1, 1),
          textMaterial
        );
        textPlane.position.set(0, 0, 0.06);
        marker.add(textPlane);
        
        terrainGroup.add(marker);
        markersCount++;
      }
    };
    
    // Ne créer les marqueurs de distance que si la configuration le permet
    if (!renderConfig?.minimizeObjects) {
      createDistanceMarkers();
    }
    
    // Zones de puissance (si activées)
    if (showPowerZones && userProfile && userProfile.ftp) {
      const createPowerZone = (zoneStart, zoneEnd, color, label) => {
        // Ajuster la taille et la complexité selon la configuration
        const zoneWidth = 20;
        const zoneLength = renderConfig?.minimizeObjects ? 50 : 100;
        
        // Simplifier la géométrie pour les appareils à faible puissance
        const segments = deviceCapabilities?.flags.isLowEndDevice ? 1 : 2;
        const zoneGeometry = new THREE.BoxGeometry(zoneWidth, 0.1, zoneLength, segments, 1, segments);
        
        const zoneMaterial = new THREE.MeshStandardMaterial({ 
          color, 
          transparent: true, 
          opacity: renderConfig?.useSimplifiedGeometry ? 0.4 : 0.6,
          flatShading: renderConfig?.useSimplifiedGeometry
        });
        
        const zone = new THREE.Mesh(zoneGeometry, zoneMaterial);
        zone.position.set(15, 0.05, -500);
        
        // Ne pas ajouter de texte pour les configurations minimalistes
        if (!renderConfig?.minimizeObjects) {
          // Texte de la zone avec résolution adaptative
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          // Réduire la taille du canvas pour les appareils à faible puissance
          const canvasWidth = deviceCapabilities?.flags.isLowEndDevice ? 64 : 128;
          const canvasHeight = deviceCapabilities?.flags.isLowEndDevice ? 32 : 64;
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
          
          context.fillStyle = '#ffffff';
          const fontSize = deviceCapabilities?.flags.isLowEndDevice ? 12 : 16;
          context.font = `Bold ${fontSize}px Arial`;
          context.fillText(label, 10, fontSize + 4);
          context.fillText(`${zoneStart}-${zoneEnd}w`, 10, fontSize * 2 + 8);
          
          const texture = new THREE.CanvasTexture(canvas);
          // Réduire la qualité des textures pour les appareils à faible puissance
          if (deviceCapabilities?.flags.isLowEndDevice) {
            texture.minFilter = THREE.NearestFilter;
            texture.magFilter = THREE.NearestFilter;
          }
          
          const textMaterial = new THREE.MeshBasicMaterial({ 
            map: texture, 
            transparent: true 
          });
          
          const textPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(4, 2),
            textMaterial
          );
          textPlane.position.set(0, 2, 0);
          textPlane.rotation.y = Math.PI / 2;
          zone.add(textPlane);
        }
        
        terrainGroup.add(zone);
        return zone;
      };
      
      const ftp = userProfile.ftp;
      
      // Pour les appareils à faible puissance, réduire le nombre de zones
      if (deviceCapabilities?.flags.isLowEndDevice) {
        createPowerZone(0, Math.floor(ftp * 0.75), 0x32CD32, 'Z1-Z2');
        createPowerZone(Math.floor(ftp * 0.75), Math.floor(ftp * 0.90), 0xFFD700, 'Z3');
        createPowerZone(Math.floor(ftp * 0.90), Math.floor(ftp * 1.05), 0xFF4500, 'Z4-Z5');
      } else {
        createPowerZone(0, Math.floor(ftp * 0.55), 0x6495ED, 'Z1 - Récupération');
        createPowerZone(Math.floor(ftp * 0.55), Math.floor(ftp * 0.75), 0x32CD32, 'Z2 - Endurance');
        createPowerZone(Math.floor(ftp * 0.75), Math.floor(ftp * 0.90), 0xFFD700, 'Z3 - Tempo');
        createPowerZone(Math.floor(ftp * 0.90), Math.floor(ftp * 1.05), 0xFFA500, 'Z4 - Seuil');
        createPowerZone(Math.floor(ftp * 1.05), Math.floor(ftp * 1.20), 0xFF4500, 'Z5 - VO2Max');
        createPowerZone(Math.floor(ftp * 1.20), Math.floor(ftp * 1.50), 0xFF0000, 'Z6 - Anaérobie');
      }
    }
    
    return terrainGroup;
  }, [workout, userProfile, showPowerZones, renderConfig, deviceCapabilities]);

  // Créer le cycliste
  const createCyclist = useCallback(() => {
    const cyclistGroup = new THREE.Group();
    
    // Adapter la complexité du modèle du cycliste
    const useSimpleModel = renderConfig?.useSimplifiedGeometry || deviceCapabilities?.flags.isLowEndDevice;
    
    // Corps du vélo avec géométrie adaptative
    const frameSegments = useSimpleModel ? 1 : 2;
    const frameGeometry = new THREE.BoxGeometry(4, 0.5, 1.5, frameSegments, frameSegments, frameSegments);
    const frameMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3333cc,
      flatShading: useSimpleModel
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.y = 1;
    frame.castShadow = renderConfig ? renderConfig.shadowsEnabled : true;
    cyclistGroup.add(frame);
    
    // Roues avec géométrie adaptative
    const wheelRadius = 0.7;
    const wheelTubeRadius = 0.1;
    const wheelRadialSegments = useSimpleModel ? 8 : 16;
    const wheelTubularSegments = useSimpleModel ? 12 : 32;
    
    const wheelGeometry = new THREE.TorusGeometry(
      wheelRadius, 
      wheelTubeRadius, 
      wheelRadialSegments, 
      wheelTubularSegments
    );
    const wheelMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x111111,
      flatShading: useSimpleModel
    });
    
    const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontWheel.position.set(1.5, 0.7, 0);
    frontWheel.rotation.y = Math.PI / 2;
    frontWheel.castShadow = renderConfig ? renderConfig.shadowsEnabled : true;
    cyclistGroup.add(frontWheel);
    
    const rearWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rearWheel.position.set(-1.5, 0.7, 0);
    rearWheel.rotation.y = Math.PI / 2;
    rearWheel.castShadow = renderConfig ? renderConfig.shadowsEnabled : true;
    cyclistGroup.add(rearWheel);
    
    // Cycliste simplifié
    const bodySegments = useSimpleModel ? 1 : 2;
    const bodyGeometry = new THREE.BoxGeometry(1, 1, 0.5, bodySegments, bodySegments, bodySegments);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      flatShading: useSimpleModel
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 2, 0);
    body.castShadow = renderConfig ? renderConfig.shadowsEnabled : true;
    cyclistGroup.add(body);
    
    // Tête avec géométrie adaptative
    const headSegments = useSimpleModel ? 8 : 16;
    const headGeometry = new THREE.SphereGeometry(0.3, headSegments, headSegments);
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffdbac,
      flatShading: useSimpleModel
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0.5, 2.6, 0);
    head.castShadow = renderConfig ? renderConfig.shadowsEnabled : true;
    cyclistGroup.add(head);
    
    // Position initiale
    cyclistGroup.position.set(0, 0, 5);
    cyclistGroup.rotation.y = Math.PI; // face à la route
    
    return cyclistGroup;
  }, [renderConfig, deviceCapabilities]);

  // Redimensionnement de la fenêtre
  const handleResize = useCallback(() => {
    if (!containerRef.current) return;
    
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    if (cameraRef.current) {
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
    }
    
    if (rendererRef.current) {
      rendererRef.current.setSize(width, height);
      
      // Ajuster la densité de pixels lors du redimensionnement
      if (renderConfig) {
        const dpr = Math.min(window.devicePixelRatio, renderConfig.maxPixelRatio || 2);
        rendererRef.current.setPixelRatio(dpr);
      }
    }
  }, [renderConfig]);

  // Animation
  const animate = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
    
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      
      // Suivre les performances
      if (adaptiveQualityEnabled) {
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
          
          // Ajuster la qualité si nécessaire
          const avgFPS = performanceStatsRef.current.frameRateHistory.reduce((a, b) => a + b, 0) 
                        / performanceStatsRef.current.frameRateHistory.length;
          
          // Si le FPS moyen est trop bas, réduire la qualité
          const lastAdjustmentTime = now - performanceStatsRef.current.lastPerformanceAdjustment;
          if (lastAdjustmentTime > 5000) { // Ne pas ajuster trop souvent
            if (avgFPS < 25 && !batteryMode) {
              // Activer le mode économie de batterie
              console.log('FPS bas détecté, activation du mode économie de batterie');
              setBatteryMode(true);
              performanceStatsRef.current.lastPerformanceAdjustment = now;
            } else if (avgFPS > 55 && batteryMode) {
              // Désactiver le mode économie de batterie si les performances sont bonnes
              console.log('Performances suffisantes, désactivation du mode économie de batterie');
              setBatteryMode(false);
              performanceStatsRef.current.lastPerformanceAdjustment = now;
            }
          }
          
          // Réinitialiser les compteurs
          performanceStatsRef.current.frameCount = 0;
          performanceStatsRef.current.lastPerformanceCheck = now;
        }
      }
    }
    
    animationRef.current = requestAnimationFrame(animate);
  }, [adaptiveQualityEnabled, batteryMode]);

  // Démarrer la simulation
  const startWorkout = useCallback(() => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    
    // Durée totale de la simulation en secondes
    const totalDuration = workout.duration * 60;
    
    // Instants de début de chaque segment en secondes
    const segmentStartTimes = workout.segments.map(segment => {
      return segment.timeOffset * 60; // convertir les minutes en secondes
    });
    
    // Déterminer le segment actuel
    const determineSegment = (timeElapsed) => {
      let currentIndex = 0;
      
      for (let i = 0; i < segmentStartTimes.length; i++) {
        if (timeElapsed >= segmentStartTimes[i]) {
          currentIndex = i;
        } else {
          break;
        }
      }
      
      return currentIndex;
    };
    
    // Animation de la simulation
    const updateAnimation = () => {
      if (!isPlaying) return;
      
      // Mettre à jour le temps écoulé
      const now = performance.now();
      const deltaTime = now - (updateAnimation.lastTime || now);
      updateAnimation.lastTime = now;
      
      // Calcul du temps avec la vitesse de simulation
      const simulationSpeed = 1; // Pourrait être ajustable
      const deltaSeconds = (deltaTime / 1000) * simulationSpeed;
      
      const newElapsedTime = Math.min(elapsedTime + deltaSeconds, totalDuration);
      setElapsedTime(newElapsedTime);
      
      // Mise à jour de la progression
      const newProgress = Math.min(newElapsedTime / totalDuration, 1);
      setProgress(newProgress);
      
      // Déterminer le segment actuel
      const newSegmentIndex = determineSegment(newElapsedTime);
      
      if (newSegmentIndex !== currentSegment) {
        setCurrentSegment(newSegmentIndex);
      }
      
      // Mettre à jour les métriques
      const segment = workout.segments[newSegmentIndex];
      
      // Calcul du power en fonction de FTP et de la puissance relative au segment
      const relativePower = segment ? segment.power : 0;
      const newPower = userProfile.ftp * relativePower;
      setCurrentPower(Math.round(newPower));
      
      // Calcul du heart rate
      const baseHeartRate = userProfile.restingHR || 50;
      const maxHeartRate = userProfile.maxHR || 185;
      const hrReserve = maxHeartRate - baseHeartRate;
      // Simplification: le heart rate est proportionnel à la puissance
      const newHeartRate = Math.round(baseHeartRate + hrReserve * (relativePower * 0.8));
      setCurrentHeartRate(newHeartRate);
      
      // Calcul de la cadence
      const newCadence = Math.round(80 + (segment ? segment.cadenceModifier * 10 : 0));
      setCurrentCadence(newCadence);
      
      // Mise à jour de la position du cycliste
      if (cyclistRef.current) {
        // Distance parcourue en fonction de la progression
        const maxDistance = 1000; // en unités 3D
        const distanceTravelled = maxDistance * newProgress;
        
        // Mettre à jour la position du cycliste
        cyclistRef.current.position.z = -distanceTravelled;
        
        // Animation des roues - optimiser pour les performances
        const rotationSpeed = 1.5; // plus la cadence est élevée, plus les roues tournent vite
        const wheelRotation = (now / 200) * (newCadence / 90) * rotationSpeed;
        
        // Ne mettre à jour les roues que si nous sommes à plus de 30 FPS
        if (!deviceCapabilities?.flags.isLowEndDevice || performanceStatsRef.current.frameRate > 30) {
          const wheels = cyclistRef.current.children.filter(child => 
            child.geometry && child.geometry.type === 'TorusGeometry'
          );
          
          wheels.forEach(wheel => {
            wheel.rotation.x = wheelRotation;
          });
        }
        
        // Mettre à jour la position de la caméra en fonction du mode de vue
        updateCameraView(viewMode);
      }
      
      // Terminer si on a atteint la fin
      if (newElapsedTime >= totalDuration) {
        setIsPlaying(false);
        if (onComplete) onComplete();
      } else {
        // Programmation des mises à jour avec optimisation pour les appareils à faible puissance
        if (deviceCapabilities?.flags.isLowEndDevice) {
          // Mettre à jour moins fréquemment sur les appareils à faible puissance
          setTimeout(updateAnimation, 50); // 20 fois par seconde
        } else {
          requestAnimationFrame(updateAnimation);
        }
      }
    };
    
    updateAnimation();
  }, [isPlaying, elapsedTime, currentSegment, workout, userProfile, viewMode, updateCameraView, onComplete, deviceCapabilities]);

  // Gestion du mode économie de batterie
  const handleBatteryModeToggle = useCallback(() => {
    const newBatteryMode = !batteryMode;
    setBatteryMode(newBatteryMode);
    
    // Mettre à jour la configuration
    const config = threeDConfigManager.getOptimalConfig('trainingVisualizer', {
      forceBatterySaving: newBatteryMode
    });
    setRenderConfig(config);
    
    console.log(`Mode économie de batterie ${newBatteryMode ? 'activé' : 'désactivé'}`);
  }, [batteryMode]);

  // Afficher le chargement
  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height={embedded ? '100%' : '500px'}
        sx={{ backgroundColor: '#f0f0f0' }}
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Préparation de la visualisation...
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: embedded ? '100%' : '500px', position: 'relative' }}>
      {/* Conteneur de visualisation 3D */}
      <Box 
        ref={containerRef} 
        sx={{ 
          height: '100%', 
          width: '100%',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: 3
        }} 
      />
      
      {/* Overlay avec les métriques */}
      <MetricsOverlay>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <MetricCard title="Puissance" value={`${currentPower} W`} color="#ff5722" />
          </Grid>
          <Grid item xs={4}>
            <MetricCard title="FC" value={`${currentHeartRate} bpm`} color="#f44336" />
          </Grid>
          <Grid item xs={4}>
            <MetricCard title="Cadence" value={`${currentCadence} rpm`} color="#2196f3" />
          </Grid>
        </Grid>
      </MetricsOverlay>
      
      {/* Contrôles d'entraînement */}
      <ControlsOverlay>
        <Grid container alignItems="center" spacing={1}>
          <Grid item>
            <IconButton 
              color="primary" 
              onClick={isPlaying ? pauseWorkout : startWorkout}
            >
              {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>
          </Grid>
          <Grid item>
            <IconButton color="primary" onClick={resetWorkout}>
              <Replay />
            </IconButton>
          </Grid>
          <Grid item xs>
            <Slider
              value={progress}
              onChange={handleProgressChange}
              min={0}
              max={1}
              step={0.001}
              aria-label="Progression"
            />
          </Grid>
          <Grid item>
            <Typography variant="body2">
              {formatTime(elapsedTime)} / {formatTime(workout?.duration * 60 || 0)}
            </Typography>
          </Grid>
        </Grid>
        
        {/* Contrôles de visualisation */}
        <Grid container justifyContent="space-between" sx={{ mt: 1 }}>
          <Grid item>
            <Grid container spacing={1}>
              <Grid item>
                <IconButton 
                  size="small" 
                  color={viewMode === 'follow' ? 'primary' : 'default'}
                  onClick={() => handleViewModeChange('follow')}
                >
                  <DirectionsBike />
                </IconButton>
              </Grid>
              <Grid item>
                <IconButton 
                  size="small" 
                  color={viewMode === 'overhead' ? 'primary' : 'default'}
                  onClick={() => handleViewModeChange('overhead')}
                >
                  <Person />
                </IconButton>
              </Grid>
              <Grid item>
                <IconButton 
                  size="small" 
                  color={viewMode === 'side' ? 'primary' : 'default'}
                  onClick={() => handleViewModeChange('side')}
                >
                  <Timeline />
                </IconButton>
              </Grid>
              <Grid item>
                <IconButton 
                  size="small" 
                  color={viewMode === 'free' ? 'primary' : 'default'}
                  onClick={() => handleViewModeChange('free')}
                >
                  <CameraAlt />
                </IconButton>
              </Grid>
            </Grid>
          </Grid>
          
          <Grid item>
            <Grid container spacing={1}>
              <Grid item>
                <IconButton 
                  size="small" 
                  color={showPowerZones ? 'primary' : 'default'}
                  onClick={() => setShowPowerZones(!showPowerZones)}
                >
                  {showPowerZones ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </Grid>
              <Grid item>
                <IconButton 
                  size="small" 
                  color={batteryMode ? 'primary' : 'default'}
                  onClick={handleBatteryModeToggle}
                  title={batteryMode ? "Désactiver le mode économie de batterie" : "Activer le mode économie de batterie"}
                >
                  {batteryMode ? <BatteryAlert /> : <BatteryFull />}
                </IconButton>
              </Grid>
              {/* Afficher les FPS si le mode débogage est activé */}
              {featureFlagsService.isEnabled('showPerformanceMetrics') && (
                <Grid item sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ ml: 1 }}>
                    {performanceStatsRef.current.frameRate} FPS
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </ControlsOverlay>
    </Box>
  );
};

// Composant de carte métrique
const MetricCard = ({ title, value, color }) => (
  <Paper sx={{ padding: 1, bgcolor: 'rgba(255, 255, 255, 0.9)' }}>
    <Typography variant="caption" display="block">
      {title}
    </Typography>
    <Typography variant="h6" sx={{ color, fontWeight: 'bold' }}>
      {value}
    </Typography>
  </Paper>
);

// Formatage du temps au format mm:ss
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Composants stylisés
const MetricsOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  left: theme.spacing(2),
  right: theme.spacing(2),
  zIndex: 10
}));

const ControlsOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  padding: theme.spacing(2),
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  borderTopLeftRadius: theme.spacing(1),
  borderTopRightRadius: theme.spacing(1),
  zIndex: 10
}));

export default TrainingVisualizer3D;
