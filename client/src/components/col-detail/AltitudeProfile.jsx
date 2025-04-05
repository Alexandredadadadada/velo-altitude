import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useBatteryStatus } from '../../hooks/useBatteryStatus';

/**
 * Composant AltitudeProfile amélioré
 * Visualisation 3D interactive du profil d'élévation d'un col
 * Supporte:
 * - Rendu 3D optimisé selon batterie/performances
 * - Points d'intérêt interactifs
 * - Mode comparaison avec d'autres cols
 * - Segmentation colorimétrique selon difficulté
 */
const AltitudeProfile = ({ 
  colData,
  compareWith = [], 
  highlightSegments = [],
  showPOIs = true,
  interactive = true 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  // État du modèle 3D
  const [isLoaded, setIsLoaded] = useState(false);
  const [activePoint, setActivePoint] = useState(null);
  
  // Optimisation batterie
  const { batteryLevel, isCharging } = useBatteryStatus();
  const [renderQuality, setRenderQuality] = useState('high');
  
  // Déterminer la qualité de rendu en fonction du niveau de batterie
  useEffect(() => {
    const { batteryOptimizer } = theme.veloAltitude;
    
    if (isCharging) {
      setRenderQuality('high');
    } else if (batteryLevel <= batteryOptimizer.thresholds.critical) {
      setRenderQuality('critical');
    } else if (batteryLevel <= batteryOptimizer.thresholds.low) {
      setRenderQuality('low');
    } else if (batteryLevel <= batteryOptimizer.thresholds.medium) {
      setRenderQuality('medium');
    } else {
      setRenderQuality('high');
    }
  }, [batteryLevel, isCharging, theme]);
  
  // Initialisation de la scène 3D
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Nettoyage de l'animation précédente si elle existe
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Dimensions du conteneur
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 400;
    
    // Initialiser la scène
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(theme.palette.background.default);
    sceneRef.current = scene;
    
    // Initialiser la caméra
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 2000);
    camera.position.set(0, 10, 20);
    cameraRef.current = camera;
    
    // Initialiser le renderer
    const renderer = new THREE.WebGLRenderer({ antialias: renderQuality !== 'critical' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio * (renderQuality === 'high' ? 1 : 0.75));
    renderer.shadowMap.enabled = renderQuality !== 'critical' && renderQuality !== 'low';
    
    // Nettoyer l'élément existant s'il y en a un
    if (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Ajouter les contrôles pour l'interaction
    if (interactive) {
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.maxPolarAngle = Math.PI / 2;
      
      // Restreindre les contrôles sur mobile
      if (isMobile) {
        controls.enableZoom = false;
        controls.rotateSpeed = 0.5;
      }
      
      controlsRef.current = controls;
    }
    
    // Ajouter l'éclairage
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    if (renderQuality !== 'critical') {
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(50, 200, 100);
      directionalLight.castShadow = renderQuality === 'high';
      scene.add(directionalLight);
    }
    
    // Fonction d'animation
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      renderer.render(scene, camera);
    };
    
    // Construction du profil d'élévation 3D
    buildAltitudeProfile(colData, renderQuality).then(() => {
      // Ajouter les modèles de comparaison si présents
      if (compareWith && compareWith.length > 0) {
        Promise.all(compareWith.map(col => 
          buildComparisonProfile(col, renderQuality)
        )).then(() => {
          setIsLoaded(true);
          animate();
        });
      } else {
        setIsLoaded(true);
        animate();
      }
    });
    
    // Ajouter les points d'intérêt si demandés
    if (showPOIs && colData.pointsOfInterest) {
      addPointsOfInterest(colData.pointsOfInterest, renderQuality);
    }
    
    // Nettoyage lors du démontage
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      
      // Vider la scène
      if (sceneRef.current) {
        sceneRef.current.clear();
      }
    };
  }, [colData, compareWith, highlightSegments, renderQuality, interactive, showPOIs, theme, isMobile]);
  
  // Redimensionnement de la visualisation lors du changement de taille de fenêtre
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight || 400;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Fonction pour construire le profil d'élévation 3D
  const buildAltitudeProfile = async (col, quality) => {
    if (!sceneRef.current) return;
    
    const { elevationData, length, maxGradient } = col;
    if (!elevationData || !elevationData.length) return;
    
    // Créer la géométrie du profil
    const shape = new THREE.Shape();
    
    // Facteurs d'échelle pour la visualisation
    const scaleX = 20 / length; // Normaliser la longueur
    const scaleY = 10 / col.altitude; // Normaliser la hauteur
    
    // Déterminer le niveau de détail selon la qualité de rendu
    const detailLevel = quality === 'high' ? 1 : 
                       quality === 'medium' ? 2 :
                       quality === 'low' ? 3 : 4;
    
    // Tracer le profil (simplifier les points selon le niveau de détail)
    shape.moveTo(0, 0);
    
    for (let i = 0; i < elevationData.length; i += detailLevel) {
      const point = elevationData[i];
      shape.lineTo(point.distance * scaleX, point.altitude * scaleY);
    }
    
    // Fermer la forme
    shape.lineTo(elevationData[elevationData.length - 1].distance * scaleX, 0);
    shape.lineTo(0, 0);
    
    // Création de l'extrusion
    const extrudeSettings = {
      steps: quality === 'high' ? 100 : quality === 'medium' ? 50 : 20,
      depth: 1.5,
      bevelEnabled: quality !== 'critical',
      bevelThickness: 0.2,
      bevelSize: 0.1,
      bevelOffset: 0,
      bevelSegments: quality === 'high' ? 8 : 3
    };
    
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    
    // Créer le matériau avec une texture qui varie selon la pente
    const texture = generateGradientTexture(maxGradient, quality);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      metalness: 0.2,
      roughness: 0.7,
      side: THREE.DoubleSide
    });
    
    // Créer le maillage
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = quality === 'high';
    mesh.receiveShadow = quality === 'high' || quality === 'medium';
    
    // Centrer le profil
    mesh.position.set(-10, 0, 0);
    
    // Ajouter le profil à la scène
    sceneRef.current.add(mesh);
    
    // Colorier les segments en surbrillance si présents
    if (highlightSegments && highlightSegments.length > 0) {
      highlightProfileSegments(mesh, elevationData, highlightSegments, scaleX, scaleY, quality);
    }
    
    return mesh;
  };
  
  // Fonction pour ajouter un profil de comparaison
  const buildComparisonProfile = async (col, quality) => {
    if (!sceneRef.current) return;
    
    // Construire le profil avec une opacité réduite et un décalage
    const comparisonMesh = await buildAltitudeProfile(col, quality === 'high' ? 'medium' : 'low');
    if (comparisonMesh) {
      comparisonMesh.material.transparent = true;
      comparisonMesh.material.opacity = 0.5;
      comparisonMesh.position.z = 2; // Décaler le profil de comparaison
    }
    
    return comparisonMesh;
  };
  
  // Fonction pour générer une texture de dégradé selon la pente
  const generateGradientTexture = (maxGradient, quality) => {
    const canvas = document.createElement('canvas');
    const size = quality === 'high' ? 512 : quality === 'medium' ? 256 : 128;
    canvas.width = size;
    canvas.height = 1;
    
    const context = canvas.getContext('2d');
    
    // Créer un dégradé basé sur la difficulté de la pente
    const gradient = context.createLinearGradient(0, 0, size, 0);
    
    // Couleurs pour différentes pentes, utilisant le thème
    gradient.addColorStop(0, theme.veloAltitude.difficulty.easy);
    gradient.addColorStop(0.3, theme.veloAltitude.difficulty.medium);
    gradient.addColorStop(0.6, theme.veloAltitude.difficulty.hard);
    gradient.addColorStop(0.8, theme.veloAltitude.difficulty.veryHard);
    gradient.addColorStop(1.0, theme.veloAltitude.difficulty.extreme);
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, 1);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    
    return texture;
  };
  
  // Fonction pour mettre en évidence des segments spécifiques
  const highlightProfileSegments = (mesh, elevationData, segments, scaleX, scaleY, quality) => {
    if (!sceneRef.current) return;
    
    segments.forEach(segment => {
      const { startDistance, endDistance, type } = segment;
      
      // Trouver les indices correspondants dans les données d'élévation
      const startIndex = elevationData.findIndex(p => p.distance >= startDistance);
      const endIndex = elevationData.findIndex(p => p.distance >= endDistance);
      
      if (startIndex === -1 || endIndex === -1) return;
      
      // Créer une géométrie pour le segment
      const segmentShape = new THREE.Shape();
      
      segmentShape.moveTo(elevationData[startIndex].distance * scaleX, elevationData[startIndex].altitude * scaleY);
      
      for (let i = startIndex + 1; i <= endIndex; i++) {
        const point = elevationData[i];
        segmentShape.lineTo(point.distance * scaleX, point.altitude * scaleY);
      }
      
      // Créer un matériau selon le type de segment
      let segmentColor;
      
      switch (type) {
        case 'steep':
          segmentColor = theme.veloAltitude.difficulty.veryHard;
          break;
        case 'technical':
          segmentColor = theme.veloAltitude.difficulty.extreme;
          break;
        case 'scenic':
          segmentColor = theme.palette.secondary.main;
          break;
        default:
          segmentColor = theme.veloAltitude.difficulty.medium;
      }
      
      const segmentMaterial = new THREE.LineBasicMaterial({ 
        color: new THREE.Color(segmentColor),
        linewidth: 3
      });
      
      // Créer la ligne
      const segmentPoints = [];
      for (let i = startIndex; i <= endIndex; i++) {
        const point = elevationData[i];
        segmentPoints.push(new THREE.Vector3(
          point.distance * scaleX - 10, // Ajuster pour correspondre à la position du mesh
          point.altitude * scaleY + 0.1, // Légèrement au-dessus du profil
          0.1
        ));
      }
      
      const segmentGeometry = new THREE.BufferGeometry().setFromPoints(segmentPoints);
      const segmentLine = new THREE.Line(segmentGeometry, segmentMaterial);
      
      sceneRef.current.add(segmentLine);
    });
  };
  
  // Fonction pour ajouter les points d'intérêt
  const addPointsOfInterest = (pois, quality) => {
    if (!sceneRef.current || !pois || !pois.length) return;
    
    pois.forEach(poi => {
      const { distance, altitude, name, type } = poi;
      
      // Déterminer la taille et la couleur selon le type de POI
      let poiColor, poiSize;
      
      switch (type) {
        case 'summit':
          poiColor = theme.veloAltitude.cols.bonette;
          poiSize = 0.4;
          break;
        case 'viewpoint':
          poiColor = theme.palette.secondary.main;
          poiSize = 0.3;
          break;
        case 'service':
          poiColor = theme.palette.info.main;
          poiSize = 0.25;
          break;
        case 'warning':
          poiColor = theme.palette.warning.main;
          poiSize = 0.3;
          break;
        default:
          poiColor = theme.palette.primary.main;
          poiSize = 0.2;
      }
      
      // Créer la géométrie du POI
      const poiGeometry = new THREE.SphereGeometry(
        poiSize,
        quality === 'high' ? 16 : quality === 'medium' ? 12 : 8,
        quality === 'high' ? 16 : quality === 'medium' ? 12 : 8
      );
      
      const poiMaterial = new THREE.MeshBasicMaterial({ color: poiColor });
      const poiMesh = new THREE.Mesh(poiGeometry, poiMaterial);
      
      // Positionner le POI
      const scaleX = 20 / colData.length;
      const scaleY = 10 / colData.altitude;
      
      poiMesh.position.set(
        distance * scaleX - 10,
        altitude * scaleY + poiSize + 0.1,
        0
      );
      
      // Ajouter des données pour l'interaction
      poiMesh.userData = { poi, name };
      
      sceneRef.current.add(poiMesh);
      
      // Ajouter un texte si haute qualité
      if (quality === 'high' || quality === 'medium') {
        // On pourrait ajouter des sprites pour les labels ici
      }
    });
  };
  
  // Afficher un message de chargement si nécessaire
  if (!isLoaded) {
    return (
      <Box sx={{ 
        height: 400, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: theme.palette.background.default 
      }}>
        <Typography variant="body1">
          Chargement de la visualisation 3D...
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ position: 'relative' }}>
      {/* Indicateur de qualité de rendu (utile pour debug) */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ 
          position: 'absolute', 
          top: 8, 
          right: 8, 
          zIndex: 10,
          backgroundColor: 'rgba(0,0,0,0.5)',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.7rem'
        }}>
          {renderQuality} ({batteryLevel}%)
        </Box>
      )}
      
      {/* Conteneur de la visualisation 3D */}
      <Box 
        ref={containerRef} 
        sx={{ 
          height: { xs: 300, md: 400, lg: 500 },
          width: '100%',
          borderRadius: 1,
          overflow: 'hidden'
        }} 
      />
      
      {/* Affichage des informations du point actif */}
      {activePoint && (
        <Box sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          backgroundColor: 'rgba(255,255,255,0.9)',
          padding: 2,
          borderRadius: 1,
          boxShadow: 2,
          maxWidth: '70%'
        }}>
          <Typography variant="h6">{activePoint.name}</Typography>
          <Typography variant="body2">
            {activePoint.description}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default AltitudeProfile;
