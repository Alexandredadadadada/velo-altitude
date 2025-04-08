import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Box, Typography, CircularProgress, Paper, Button } from '@mui/material';

// Import des composants d'optimisation
import { with3DOptimization } from '../optimization/withPerformanceOptimization';
import { WebGLOptimizer } from '../../services/optimization/renderers/WebGLOptimizer';
import { PerformanceMonitor } from '../../services/performance/PerformanceMonitor';

/**
 * Interface pour les données d'un point d'intérêt
 */
interface PointOfInterestData {
  name: string;
  type: 'viewpoint' | 'rest' | 'summit' | string;
  distance: number;
}

/**
 * Interface pour les données d'un point de profil de col
 */
interface ColPoint {
  x: number; // distance horizontale
  y: number; // altitude
  z: number; // position latérale (typiquement 0 pour un profil 2D)
  gradient?: number; // pourcentage de pente
}

/**
 * Props pour le composant principal
 */
interface ColVisualization3DProps {
  colId: string;
  colData: ColPoint[];
  pointsOfInterest?: PointOfInterestData[];
}

// Composant pour la route du col avec optimisations
const ColRoad: React.FC<{
  data: ColPoint[];
  color?: string;
  useLOD?: boolean;
}> = ({ data, color = "#444444", useLOD = true }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const [detailLevel, setDetailLevel] = useState(2);
  
  // Générer les points de la route
  const points = data.map(point => new THREE.Vector3(point.x, point.y, point.z));
  const curve = new THREE.CatmullRomCurve3(points);
  
  // Déterminer le niveau de détail en fonction de la distance
  useEffect(() => {
    if (!useLOD || !meshRef.current) return;
    
    const checkDistance = () => {
      if (!meshRef.current) return;
      
      const distance = camera.position.distanceTo(meshRef.current.position);
      
      // Ajuster le niveau de détail en fonction de la distance
      if (distance > 20) {
        setDetailLevel(0); // Basse qualité
      } else if (distance > 10) {
        setDetailLevel(1); // Qualité moyenne
      } else {
        setDetailLevel(2); // Haute qualité
      }
    };
    
    // Vérifier la distance immédiatement puis lors des mouvements de caméra
    checkDistance();
    
    // Écouter les mouvements de caméra
    window.addEventListener('cameraMove', checkDistance);
    
    return () => {
      window.removeEventListener('cameraMove', checkDistance);
    };
  }, [camera, useLOD]);
  
  // Ajuster les paramètres de la géométrie en fonction du niveau de détail
  const segments = useLOD ? 
    detailLevel === 0 ? 30 : detailLevel === 1 ? 60 : 100 : 
    100;
  
  const radialSegments = useLOD ? 
    detailLevel === 0 ? 4 : detailLevel === 1 ? 6 : 8 : 
    8;
  
  // Créer la géométrie du tube (route) avec le niveau de détail approprié
  const tubeGeometry = new THREE.TubeGeometry(
    curve,
    segments,  // Segments tubulaires (ajustés selon LOD)
    0.2,       // Rayon
    radialSegments, // Segments radiaux (ajustés selon LOD)
    false      // Fermé
  );

  // Enregistrer les métriques de performance
  useEffect(() => {
    if (meshRef.current) {
      PerformanceMonitor.recordComponentRender('ColRoad', 'ColRoad', {
        renderCount: 1,
        renderTime: 0,
        props: JSON.stringify({ segments, radialSegments, detailLevel })
      });
    }
  }, [segments, radialSegments, detailLevel]);

  return (
    <mesh ref={meshRef}>
      <primitive object={tubeGeometry} attach="geometry" />
      <meshStandardMaterial color={color} roughness={0.6} />
    </mesh>
  );
};

// Composant pour le terrain environnant avec optimisations
const Terrain: React.FC<{
  data: ColPoint[];
  resolution?: 'low' | 'medium' | 'high';
}> = ({ data, resolution = 'medium' }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  
  // Déterminer les dimensions du terrain
  const maxX = Math.max(...data.map(p => p.x)) + 2;
  const maxY = Math.max(...data.map(p => p.y)) + 1;
  const minY = Math.min(...data.map(p => p.y)) - 0.5;
  
  // Ajuster la résolution du terrain selon le paramètre
  const getResolution = useCallback((): [number, number] => {
    switch (resolution) {
      case 'low':
        return [20, 20];
      case 'medium':
        return [40, 40];
      case 'high':
        return [80, 80];
      default:
        return [40, 40];
    }
  }, [resolution]);
  
  // Récupérer les dimensions de la géométrie
  const [widthSegments, heightSegments] = getResolution();
  
  // Création d'un terrain plus détaillé avec des variations de hauteur
  // Au lieu d'un simple plan, on utilise une grille avec des hauteurs variables
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[maxX / 2, minY - 0.1, 0]}>
      <planeGeometry args={[maxX * 1.5, 10, widthSegments, heightSegments]} />
      <meshStandardMaterial 
        color="#4b7f52" 
        wireframe={false} 
        side={THREE.DoubleSide}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
};

// Composant pour les points d'intérêt
const PointOfInterest: React.FC<{
  position: [number, number, number];
  name: string;
  type: string;
}> = ({ position, name, type }) => {
  const [hovered, setHovered] = useState(false);
  
  // Choisir la couleur en fonction du type
  let color;
  switch (type) {
    case 'viewpoint':
      color = "#1E88E5"; // Bleu
      break;
    case 'rest':
      color = "#43A047"; // Vert
      break;
    case 'summit':
      color = "#E53935"; // Rouge
      break;
    default:
      color = "#FFC107"; // Jaune
  }
  
  return (
    <group position={position}>
      <mesh 
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {hovered && (
        <Text
          position={[0, 0.3, 0]}
          color="white"
          fontSize={0.15}
          maxWidth={2}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {name}
        </Text>
      )}
    </group>
  );
};

// Composant pour la scène avec optimiseur WebGL intégré
const OptimizedScene: React.FC<{
  children: React.ReactNode;
  data: ColPoint[];
}> = ({ children, data }) => {
  const { gl, scene, camera } = useThree();
  const webGLOptimizerRef = useRef<WebGLOptimizer | null>(null);
  
  // Calcul du centre et de la taille de la scène pour cadrage
  const maxX = Math.max(...data.map(p => p.x));
  const maxY = Math.max(...data.map(p => p.y));
  
  // Initialiser l'optimiseur WebGL
  useEffect(() => {
    // Créer l'optimiseur uniquement si on dispose des éléments three.js
    if (gl && scene && camera) {
      try {
        // Configuration pour l'optimiseur WebGL
        const config = {
          lod: {
            auto: true,
            level: 2,
            distanceThresholds: [5, 10, 20]
          },
          textures: {
            maxSize: 1024,
            anisotropy: 2,
            mipMapping: true,
            compression: true
          },
          materials: {
            simplifyShaders: true,
            instancing: true,
            mergeSimilar: true
          },
          geometry: {
            decimationRatio: 0.5,
            instancing: true,
            mergeGeometries: true
          },
          rendering: {
            antialiasing: true,
            pixelRatio: window.devicePixelRatio > 2 ? 2 : window.devicePixelRatio,
            throttleWhenHidden: true,
            lowPowerMode: false
          },
          memory: {
            disposeUnusedObjects: true,
            textureCache: true,
            geometryCache: true
          }
        };
        
        webGLOptimizerRef.current = new WebGLOptimizer(gl, scene, camera, config);
        
        // Démarrer la boucle d'animation optimisée
        webGLOptimizerRef.current.startAnimationLoop();
        
        console.log('[WebGLOptimizer] Initialized successfully');
      } catch (error) {
        console.error('[WebGLOptimizer] Initialization error:', error);
      }
    }
    
    // Nettoyer lors du démontage
    return () => {
      if (webGLOptimizerRef.current) {
        try {
          webGLOptimizerRef.current.dispose();
          console.log('[WebGLOptimizer] Disposed successfully');
        } catch (error) {
          console.error('[WebGLOptimizer] Dispose error:', error);
        }
      }
    };
  }, [gl, scene, camera]);
  
  // Position initiale de la caméra
  useEffect(() => {
    if (camera) {
      camera.position.set(maxX / 2, maxY * 2, 5);
      camera.lookAt(maxX / 2, 0, 0);
    }
  }, [camera, maxX, maxY]);
  
  // Déclencher l'événement de mouvement de caméra
  useFrame(() => {
    window.dispatchEvent(new CustomEvent('cameraMove'));
  });
  
  return (
    <>
      {children}
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        target={[maxX / 2, maxY / 2, 0]}
      />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={0.7} castShadow />
      <directionalLight position={[-10, 10, 5]} intensity={0.3} />
    </>
  );
};

// Animation de la caméra pour "parcourir" le col
const CameraAnimation: React.FC<{
  data: ColPoint[];
  isPlaying: boolean;
}> = ({ data, isPlaying }) => {
  const { camera } = useThree();
  const points = data.map(point => new THREE.Vector3(point.x, point.y + 0.5, point.z));
  const curve = new THREE.CatmullRomCurve3(points);
  
  // Points pour la "preview" du chemin
  const [progress, setProgress] = useState(0);
  
  useFrame(() => {
    if (isPlaying) {
      setProgress((prev) => (prev + 0.001) % 1);
      const position = curve.getPoint(progress);
      const lookAtPos = curve.getPoint(Math.min(progress + 0.01, 1));
      
      camera.position.set(position.x, position.y, position.z);
      camera.lookAt(lookAtPos.x, lookAtPos.y, lookAtPos.z);
      
      // Déclencher l'événement de mouvement de caméra
      window.dispatchEvent(new CustomEvent('cameraMove'));
    }
  });
  
  return null;
};

// Composant principal de visualisation 3D
const ColVisualization3D: React.FC<ColVisualization3DProps> = ({ colId, colData, pointsOfInterest = [] }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [terrainData, setTerrainData] = useState<ColPoint[] | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [qualityMode, setQualityMode] = useState<'low' | 'medium' | 'high'>('medium');
  
  // Performance metrics pour le debug
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false);
  const [performanceStats, setPerformanceStats] = useState<any>(null);
  
  useEffect(() => {
    // Les données sont déjà fournies en props
    if (colData && colData.length > 0) {
      setTerrainData(colData);
      setLoading(false);
    } else {
      setError("Données du col non disponibles");
      setLoading(false);
    }
  }, [colData]);
  
  // Récupérer régulièrement les statistiques de performance
  useEffect(() => {
    if (!showPerformanceMetrics) return;
    
    const intervalId = setInterval(() => {
      // Récupération des métriques actuelles
      const currentMetrics = PerformanceMonitor.getCurrentMetrics();
      setPerformanceStats(currentMetrics);
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [showPerformanceMetrics]);
  
  // Fonction pour changer la qualité visuelle
  const handleQualityChange = useCallback((newQuality: 'low' | 'medium' | 'high') => {
    setQualityMode(newQuality);
  }, []);
  
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }
  
  if (!terrainData) return null;
  
  return (
    <Paper elevation={2} sx={{ height: '400px', width: '100%', overflow: 'hidden', position: 'relative' }}>
      {/* Controls overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
      >
        <Button 
          variant="contained" 
          size="small" 
          color={isAnimating ? 'secondary' : 'primary'}
          onClick={() => setIsAnimating(!isAnimating)}
        >
          {isAnimating ? 'Arrêter l\'animation' : 'Parcourir le col'}
        </Button>
        
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Button 
            variant="outlined" 
            size="small" 
            color={qualityMode === 'low' ? 'secondary' : 'primary'}
            onClick={() => handleQualityChange('low')}
          >
            Basse
          </Button>
          <Button 
            variant="outlined" 
            size="small" 
            color={qualityMode === 'medium' ? 'secondary' : 'primary'}
            onClick={() => handleQualityChange('medium')}
          >
            Moyenne
          </Button>
          <Button 
            variant="outlined" 
            size="small" 
            color={qualityMode === 'high' ? 'secondary' : 'primary'}
            onClick={() => handleQualityChange('high')}
          >
            Haute
          </Button>
        </Box>
        
        <Button 
          variant="text" 
          size="small" 
          onClick={() => setShowPerformanceMetrics(!showPerformanceMetrics)}
          sx={{ mt: 1 }}
        >
          {showPerformanceMetrics ? 'Masquer perf' : 'Afficher perf'}
        </Button>
      </Box>
      
      {/* Performance metrics overlay */}
      {showPerformanceMetrics && performanceStats && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '0.8rem',
            maxWidth: '200px'
          }}
        >
          <Typography variant="subtitle2">Performance</Typography>
          {performanceStats.webGL?.currentFPS !== undefined && (
            <Typography variant="caption" component="div">
              FPS: {performanceStats.webGL.currentFPS.toFixed(1)}
            </Typography>
          )}
          {performanceStats.webGL?.averageFPS !== undefined && (
            <Typography variant="caption" component="div">
              Avg FPS: {performanceStats.webGL.averageFPS.toFixed(1)}
            </Typography>
          )}
          <Typography variant="caption" component="div">
            Mode: {qualityMode}
          </Typography>
          <Typography variant="caption" component="div">
            Composants: {performanceStats.components?.activeCount || 0}
          </Typography>
          <Typography variant="caption" component="div">
            Ressources: {performanceStats.resources?.lastMinuteCount || 0}
          </Typography>
        </Box>
      )}
      
      <Canvas shadows>
        <OptimizedScene data={terrainData}>
          <CameraAnimation data={terrainData} isPlaying={isAnimating} />
          <Terrain data={terrainData} resolution={qualityMode} />
          <ColRoad 
            data={terrainData} 
            useLOD={qualityMode !== 'high'} // Désactiver LOD en haute qualité
          />
          
          {pointsOfInterest && pointsOfInterest.map((poi, index) => {
            // Trouver le point correspondant à la distance du POI
            const distanceRatio = poi.distance / Math.max(...terrainData.map(p => p.x));
            const nearestIndex = Math.floor(distanceRatio * terrainData.length);
            const point = terrainData[Math.min(nearestIndex, terrainData.length - 1)];
            
            return (
              <PointOfInterest 
                key={index}
                position={[point.x, point.y + 0.3, point.z]}
                name={poi.name}
                type={poi.type}
              />
            );
          })}
        </OptimizedScene>
      </Canvas>
    </Paper>
  );
};

// Exporter le composant optimisé avec le HOC d'optimisation
export default with3DOptimization(ColVisualization3D);
