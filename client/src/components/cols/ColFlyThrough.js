import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Typography, Slider, Paper, Grid, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { 
  PlayArrow, Pause, ReplayOutlined, 
  SlowMotionVideo, Speed, FlightTakeoff,
  FlightLand, CameraAlt, VolumeUp, VolumeOff,
  ZoomIn, ZoomOut, Fullscreen, FullscreenExit,
  TouchApp
} from '@mui/icons-material';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer';
import styled from 'styled-components';

// Composant pour la fonctionnalité Fly-through des cols cyclistes
const ColFlyThrough = ({ 
  colId, 
  colData, 
  pointsOfInterest, 
  elevationData, 
  isMobile 
}) => {
  // Références
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const pathRef = useRef(null);
  const flyThroughRef = useRef(null);
  const statsRef = useRef(null);
  
  // État
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentElevation, setCurrentElevation] = useState(0);
  const [currentGradient, setCurrentGradient] = useState(0);
  const [currentDistance, setCurrentDistance] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [cameraMode, setCameraMode] = useState('follow'); // 'follow', 'orbit', 'cinematic'
  const [totalDistance, setTotalDistance] = useState(0);
  
  // Initialisation de la scène Three.js
  useEffect(() => {
    if (!containerRef.current || !colData || colData.length === 0) return;
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Initialiser la scène
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Ciel bleu
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.002);
    sceneRef.current = scene;
    
    // Initialiser la caméra
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
    camera.position.set(0, 50, 200);
    cameraRef.current = camera;
    
    // Initialiser le renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Contrôles pour la visualisation interactive
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2;
    controls.enabled = false; // Désactivé par défaut, activé en mode 'orbit'
    controlsRef.current = controls;
    
    // Éclairage
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);
    
    // Créer le terrain basé sur les données du col
    const createTerrain = () => {
      // Créer le groupe pour le terrain
      const terrainGroup = new THREE.Group();
      scene.add(terrainGroup);
      
      // Créer la route
      const createPath = () => {
        // Convertir les coordonnées du col en points 3D
        const points = colData.map(point => {
          return new THREE.Vector3(
            point.x * 10, // Échelle pour visualisation
            point.elevation,
            point.y * 10
          );
        });
        
        // Calculer la distance totale
        let distance = 0;
        for (let i = 1; i < points.length; i++) {
          distance += points[i].distanceTo(points[i - 1]);
        }
        setTotalDistance(distance / 10); // En kilomètres
        
        // Créer la courbe du chemin
        const curve = new THREE.CatmullRomCurve3(points);
        pathRef.current = curve;
        
        // Créer la géométrie de la route
        const pathGeometry = new THREE.TubeGeometry(curve, 200, 2, 8, false);
        const pathMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x333333,
          roughness: 0.8,
          metalness: 0.2
        });
        const pathMesh = new THREE.Mesh(pathGeometry, pathMaterial);
        pathMesh.receiveShadow = true;
        terrainGroup.add(pathMesh);
        
        return curve;
      };
      
      // Créer le terrain autour de la route
      const createTerrainMesh = (path) => {
        // Créer une géométrie de terrain plus large
        const terrainWidth = 1000;
        const terrainDepth = 1000;
        const terrainSegments = 100;
        
        const terrainGeometry = new THREE.PlaneGeometry(
          terrainWidth, 
          terrainDepth, 
          terrainSegments,
          terrainSegments
        );
        
        // Déformer le terrain en fonction du chemin
        const vertices = terrainGeometry.attributes.position.array;
        
        for (let i = 0; i < vertices.length; i += 3) {
          const x = vertices[i];
          const z = vertices[i + 2];
          
          // Trouver le point le plus proche sur le chemin
          let minDistance = Infinity;
          let elevation = 0;
          
          // Échantillonner le chemin
          for (let t = 0; t <= 1; t += 0.01) {
            const pathPoint = path.getPoint(t);
            const distance = new THREE.Vector2(x - pathPoint.x, z - pathPoint.z).length();
            
            if (distance < minDistance) {
              minDistance = distance;
              elevation = pathPoint.y;
            }
          }
          
          // Appliquer l'élévation avec un facteur de lissage basé sur la distance
          const smoothFactor = Math.min(1, minDistance / 50);
          vertices[i + 1] = elevation * (1 - smoothFactor) + (elevation - 50) * smoothFactor;
        }
        
        // Recalculer les normales pour un éclairage correct
        terrainGeometry.computeVertexNormals();
        
        // Rotation pour orienter le terrain correctement
        terrainGeometry.rotateX(-Math.PI / 2);
        
        // Matériau du terrain avec dégradé en fonction de l'élévation
        const terrainMaterial = new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.8,
          metalness: 0.2
        });
        
        // Ajouter des couleurs en fonction de l'élévation
        const colors = [];
        const color = new THREE.Color();
        
        for (let i = 0; i < vertices.length; i += 3) {
          const elevation = vertices[i + 1];
          
          // Palette de couleurs pour le terrain
          if (elevation < 200) {
            color.setRGB(0.2, 0.5, 0.2); // Vert foncé
          } else if (elevation < 500) {
            color.setRGB(0.4, 0.6, 0.3); // Vert
          } else if (elevation < 1000) {
            color.setRGB(0.6, 0.6, 0.4); // Vert-brun
          } else if (elevation < 1500) {
            color.setRGB(0.7, 0.7, 0.6); // Brun clair
          } else if (elevation < 2000) {
            color.setRGB(0.8, 0.8, 0.8); // Gris
          } else {
            color.setRGB(1, 1, 1); // Blanc (neige)
          }
          
          colors.push(color.r, color.g, color.b);
        }
        
        const colorAttribute = new THREE.Float32BufferAttribute(colors, 3);
        terrainGeometry.setAttribute('color', colorAttribute);
        
        const terrainMesh = new THREE.Mesh(terrainGeometry, terrainMaterial);
        terrainMesh.receiveShadow = true;
        terrainGroup.add(terrainMesh);
      };
      
      // Ajouter les points d'intérêt
      const addPointsOfInterest = (path) => {
        if (!pointsOfInterest || pointsOfInterest.length === 0) return;
        
        pointsOfInterest.forEach(poi => {
          // Trouver la position sur le chemin
          const position = path.getPoint(poi.position / totalDistance);
          
          // Créer un marqueur
          const markerGeometry = new THREE.SphereGeometry(3, 16, 16);
          
          // Couleur en fonction du type de POI
          let markerColor = 0xff0000;
          
          if (poi.type === 'viewpoint') {
            markerColor = 0x00ff00;
          } else if (poi.type === 'rest') {
            markerColor = 0x0000ff;
          } else if (poi.type === 'summit') {
            markerColor = 0xff9900;
          }
          
          const markerMaterial = new THREE.MeshStandardMaterial({ 
            color: markerColor,
            emissive: markerColor,
            emissiveIntensity: 0.3
          });
          
          const marker = new THREE.Mesh(markerGeometry, markerMaterial);
          marker.position.copy(position);
          marker.position.y += 5; // Légèrement au-dessus du terrain
          marker.castShadow = true;
          
          // Ajouter un texte flottant
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = 256;
          canvas.height = 128;
          
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.fillStyle = '#000000';
          context.font = 'Bold 20px Arial';
          context.fillText(poi.name, 10, 64);
          
          const texture = new THREE.CanvasTexture(canvas);
          const labelMaterial = new THREE.SpriteMaterial({ map: texture });
          const label = new THREE.Sprite(labelMaterial);
          label.position.copy(marker.position);
          label.position.y += 10;
          label.scale.set(20, 10, 1);
          
          terrainGroup.add(marker);
          terrainGroup.add(label);
        });
      };
      
      // Créer les éléments du terrain
      const path = createPath();
      createTerrainMesh(path);
      addPointsOfInterest(path);
      
      return { path, terrainGroup };
    };
    
    // Initialiser les éléments du terrain
    const { path } = createTerrain();
    
    // Fonction d'animation
    const flyThroughAnimation = {
      animationId: null,
      isPlaying: false,
      progress: 0,
      speed: 1,
      
      start: function() {
        this.isPlaying = true;
        setIsPlaying(true);
        this.animate();
      },
      
      pause: function() {
        this.isPlaying = false;
        setIsPlaying(false);
        if (this.animationId) {
          cancelAnimationFrame(this.animationId);
        }
      },
      
      reset: function() {
        this.progress = 0;
        setProgress(0);
        this.updateCamera();
      },
      
      setProgress: function(value) {
        this.progress = Math.max(0, Math.min(1, value));
        setProgress(value);
        this.updateCamera();
      },
      
      setSpeed: function(value) {
        this.speed = value;
        setSpeed(value);
      },
      
      updateCamera: function() {
        if (!path) return;
        
        // Obtenir la position actuelle sur le chemin
        const pathPoint = path.getPoint(this.progress);
        
        // Calculer la direction (tangente)
        const tangent = path.getTangent(this.progress);
        
        // Position de la caméra en fonction du mode
        if (cameraMode === 'follow') {
          // Mode suivi : caméra derrière le point actuel
          camera.position.set(
            pathPoint.x - tangent.x * 10,
            pathPoint.y + 5, // Un peu au-dessus du chemin
            pathPoint.z - tangent.z * 10
          );
          
          // Regarder vers l'avant sur le chemin
          const lookAtPoint = new THREE.Vector3(
            pathPoint.x + tangent.x * 20,
            pathPoint.y + 1,
            pathPoint.z + tangent.z * 20
          );
          camera.lookAt(lookAtPoint);
        } else if (cameraMode === 'cinematic') {
          // Mode cinématique : caméra qui suit avec un angle
          const angle = this.progress * Math.PI * 4; // Rotation autour du chemin
          const radius = 20;
          
          camera.position.set(
            pathPoint.x + Math.cos(angle) * radius,
            pathPoint.y + 10,
            pathPoint.z + Math.sin(angle) * radius
          );
          
          camera.lookAt(pathPoint);
        }
        
        // Mettre à jour les statistiques
        if (elevationData && elevationData.length > 0) {
          const index = Math.floor(this.progress * (elevationData.length - 1));
          const data = elevationData[index];
          
          if (data) {
            setCurrentElevation(data.elevation);
            setCurrentGradient(data.gradient);
            setCurrentDistance(data.distance);
          }
        }
      },
      
      animate: function() {
        if (!this.isPlaying) return;
        
        // Mettre à jour la progression
        const progressIncrement = 0.0001 * this.speed;
        this.progress += progressIncrement;
        
        // Boucler ou arrêter à la fin
        if (this.progress >= 1) {
          this.progress = 0;
        }
        
        setProgress(this.progress);
        this.updateCamera();
        
        // Continuer l'animation
        this.animationId = requestAnimationFrame(() => this.animate());
      }
    };
    
    flyThroughRef.current = flyThroughAnimation;
    
    // Initialiser la position de la caméra
    flyThroughAnimation.updateCamera();
    
    // Gestionnaire de redimensionnement
    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Fonction d'animation générale (incluant OrbitControls)
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Signal que le chargement est terminé
    setLoading(false);
    
    // Nettoyage
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (flyThroughRef.current && flyThroughRef.current.animationId) {
        cancelAnimationFrame(flyThroughRef.current.animationId);
      }
      
      if (rendererRef.current && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
      
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
    };
  }, [colData, pointsOfInterest, cameraMode, elevationData]);
  
  // Gestion des interactions utilisateur
  const handlePlayPause = () => {
    if (flyThroughRef.current) {
      if (isPlaying) {
        flyThroughRef.current.pause();
      } else {
        flyThroughRef.current.start();
      }
    }
  };
  
  const handleReset = () => {
    if (flyThroughRef.current) {
      flyThroughRef.current.reset();
    }
  };
  
  const handleProgressChange = (event, newValue) => {
    if (flyThroughRef.current) {
      flyThroughRef.current.setProgress(newValue);
    }
  };
  
  const handleSpeedChange = (event, newValue) => {
    if (flyThroughRef.current) {
      flyThroughRef.current.setSpeed(newValue);
    }
  };
  
  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };
  
  const handleFullscreenToggle = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    
    setIsFullscreen(!isFullscreen);
  };
  
  const handleCameraModeChange = (mode) => {
    setCameraMode(mode);
    
    if (controlsRef.current) {
      controlsRef.current.enabled = mode === 'orbit';
    }
  };
  
  // Écouteur pour les changements de plein écran
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Afficher un indicateur de chargement
  if (loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        height="100%"
        sx={{ backgroundColor: 'rgba(0, 0, 0, 0.03)' }}
      >
        <CircularProgress size={40} />
        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          Préparation du Fly-through...
        </Typography>
      </Box>
    );
  }
  
  // Afficher un message d'erreur
  if (error) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100%"
        sx={{ backgroundColor: 'rgba(0, 0, 0, 0.03)' }}
      >
        <Typography color="error" role="alert">{error}</Typography>
      </Box>
    );
  }
  
  return (
    <Box 
      sx={{ 
        position: 'relative', 
        height: '100%', 
        overflow: 'hidden',
        borderRadius: '8px',
        boxShadow: 3
      }}
      ref={containerRef}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => setTimeout(() => setShowControls(false), 3000)}
      onTouchStart={() => setShowControls(true)}
      onTouchEnd={() => setTimeout(() => setShowControls(false), 3000)}
    >
      {/* Statistiques en temps réel */}
      <StatsOverlay 
        show={showControls || isMobile} 
        ref={statsRef}
        isMobile={isMobile}
      >
        <Typography variant={isMobile ? 'caption' : 'body2'}>
          Altitude: <strong>{currentElevation.toFixed(0)} m</strong>
        </Typography>
        <Typography variant={isMobile ? 'caption' : 'body2'}>
          Pente: <strong>{currentGradient.toFixed(1)}%</strong>
        </Typography>
        <Typography variant={isMobile ? 'caption' : 'body2'}>
          Distance: <strong>{currentDistance.toFixed(1)} / {totalDistance.toFixed(1)} km</strong>
        </Typography>
      </StatsOverlay>
      
      {/* Contrôles de la visualisation */}
      <ControlsOverlay 
        show={showControls || isMobile}
        isMobile={isMobile}
      >
        {/* Contrôles principaux */}
        <ControlButtonsGroup>
          <Tooltip title={isPlaying ? "Pause" : "Lecture"}>
            <IconButton 
              onClick={handlePlayPause} 
              color="primary"
              size={isMobile ? "small" : "medium"}
            >
              {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Recommencer">
            <IconButton 
              onClick={handleReset} 
              color="primary"
              size={isMobile ? "small" : "medium"}
            >
              <ReplayOutlined />
            </IconButton>
          </Tooltip>
          
          <Box sx={{ width: isMobile ? 100 : 150, mx: 1 }}>
            <Slider
              value={progress}
              onChange={handleProgressChange}
              min={0}
              max={1}
              step={0.001}
              aria-label="Progression"
              size={isMobile ? "small" : "medium"}
            />
          </Box>
          
          <Tooltip title={isMuted ? "Activer le son" : "Couper le son"}>
            <IconButton 
              onClick={handleMuteToggle} 
              color="primary"
              size={isMobile ? "small" : "medium"}
            >
              {isMuted ? <VolumeOff /> : <VolumeUp />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}>
            <IconButton 
              onClick={handleFullscreenToggle} 
              color="primary"
              size={isMobile ? "small" : "medium"}
            >
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Tooltip>
        </ControlButtonsGroup>
        
        {/* Contrôles avancés */}
        <AdvancedControlsGroup>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <Typography variant={isMobile ? 'caption' : 'body2'} sx={{ mr: 1 }}>
              Vitesse:
            </Typography>
            <Box sx={{ width: isMobile ? 80 : 100 }}>
              <Slider
                value={speed}
                onChange={handleSpeedChange}
                min={0.5}
                max={3}
                step={0.5}
                marks={[
                  { value: 0.5, label: isMobile ? '' : '0.5x' },
                  { value: 1, label: isMobile ? '' : '1x' },
                  { value: 2, label: isMobile ? '' : '2x' },
                  { value: 3, label: isMobile ? '' : '3x' }
                ]}
                aria-label="Vitesse"
                size="small"
              />
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant={isMobile ? 'caption' : 'body2'} sx={{ mr: 1 }}>
              Caméra:
            </Typography>
            <Box sx={{ display: 'flex' }}>
              <Tooltip title="Suivre le parcours">
                <IconButton 
                  onClick={() => handleCameraModeChange('follow')} 
                  color={cameraMode === 'follow' ? "primary" : "default"}
                  size="small"
                >
                  <FlightTakeoff />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Caméra libre">
                <IconButton 
                  onClick={() => handleCameraModeChange('orbit')} 
                  color={cameraMode === 'orbit' ? "primary" : "default"}
                  size="small"
                >
                  <CameraAlt />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Vue cinématique">
                <IconButton 
                  onClick={() => handleCameraModeChange('cinematic')} 
                  color={cameraMode === 'cinematic' ? "primary" : "default"}
                  size="small"
                >
                  <SlowMotionVideo />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </AdvancedControlsGroup>
      </ControlsOverlay>
      
      {/* Indicateur de contrôle tactile */}
      {isMobile && (
        <TouchIndicator>
          <TouchApp />
          <Typography variant="caption">
            Touchez pour afficher les contrôles
          </Typography>
        </TouchIndicator>
      )}
    </Box>
  );
};

// Composants stylisés
const StatsOverlay = styled(Box)`
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 8px 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: opacity 0.3s ease-in-out;
  opacity: ${props => props.show ? 1 : 0};
  pointer-events: ${props => props.show ? 'auto' : 'none'};
  z-index: 10;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  font-size: ${props => props.isMobile ? '0.75rem' : '0.875rem'};
`;

const ControlsOverlay = styled(Box)`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(255, 255, 255, 0.9);
  padding: ${props => props.isMobile ? '8px' : '12px'};
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
  opacity: ${props => props.show ? 1 : 0};
  transform: translateY(${props => props.show ? '0' : '100%'});
  pointer-events: ${props => props.show ? 'auto' : 'none'};
  z-index: 10;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
`;

const ControlButtonsGroup = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AdvancedControlsGroup = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  padding-top: 4px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
`;

const TouchIndicator = styled(Box)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  color: rgba(255, 255, 255, 0.8);
  opacity: 0.7;
  pointer-events: none;
  
  & > .MuiSvgIcon-root {
    font-size: 3rem;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% {
      opacity: 0.7;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.1);
    }
    100% {
      opacity: 0.7;
      transform: scale(1);
    }
  }
`;

export default React.memo(ColFlyThrough);
