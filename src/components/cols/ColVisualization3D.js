import React, { useRef, useEffect, useState, useMemo, Suspense, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Box, Typography, CircularProgress, Paper, useMediaQuery, useTheme } from '@mui/material';
import { useInView } from 'react-intersection-observer';
import { createWebGLOptimizer, createAdaptiveWebGLOptimizer } from './WebGLOptimizerFactory';

// Composant pour la route du col avec optimisation de la géométrie
const ColRoad = ({ data, color = "#444444", optimizer }) => {
  const meshRef = useRef();
  
  // Utiliser useMemo pour éviter de recréer la géométrie à chaque rendu
  const geometry = useMemo(() => {
    const points = data.map(point => new THREE.Vector3(point.x, point.y, point.z));
    const curve = new THREE.CatmullRomCurve3(points);
    
    // Adapter le niveau de détail en fonction de la complexité des données
    const segments = Math.min(100, Math.max(20, Math.floor(data.length / 2)));
    
    const tubeGeometry = new THREE.TubeGeometry(
      curve,
      segments,  // Segments tubulaires adaptés
      0.2,       // Rayon
      8,         // Segments radiaux
      false      // Fermé
    );
    
    // Si l'optimiseur est disponible, simplifier la géométrie
    if (optimizer) {
      // Utiliser un ratio de simplification adapté à la complexité
      const simplificationRatio = segments > 50 ? 0.5 : 0.8;
      const simplifiedGeometry = optimizer.simplifyGeometry(tubeGeometry, simplificationRatio, true);
      return simplifiedGeometry || tubeGeometry;
    }
    
    return tubeGeometry;
  }, [data, optimizer]);

  useEffect(() => {
    // Optimiser le matériau si l'optimiseur est disponible
    if (optimizer && meshRef.current) {
      optimizer.optimizeMaterial(meshRef.current);
    }
  }, [optimizer]);

  return (
    <mesh ref={meshRef}>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial color={color} roughness={0.6} />
    </mesh>
  );
};

// Composant pour le terrain environnant avec optimisation
const Terrain = ({ data, quality = 'high', optimizer }) => {
  const meshRef = useRef();
  
  // Utiliser useMemo pour les calculs coûteux
  const terrainProps = useMemo(() => {
    const maxX = Math.max(...data.map(p => p.x)) + 2;
    const maxY = Math.max(...data.map(p => p.y)) + 1;
    const minY = Math.min(...data.map(p => p.y)) - 0.5;
    
    // Ajuster les segments en fonction de la qualité
    let segments;
    switch (quality) {
      case 'low':
        segments = [8, 8];
        break;
      case 'medium':
        segments = [16, 16];
        break;
      case 'high':
      default:
        segments = [32, 32];
        break;
    }
    
    return {
      position: [maxX / 2, minY - 0.1, 0],
      dimensions: [maxX * 1.5, 10],
      segments
    };
  }, [data, quality]);

  useEffect(() => {
    // Optimiser le matériau si l'optimiseur est disponible
    if (optimizer && meshRef.current) {
      optimizer.optimizeMaterial(meshRef.current);
    }
  }, [optimizer]);

  return (
    <mesh 
      ref={meshRef} 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={terrainProps.position}
    >
      <planeGeometry args={[...terrainProps.dimensions, ...terrainProps.segments]} />
      <meshStandardMaterial color="#4b7f52" wireframe={false} />
    </mesh>
  );
};

// Composant pour les points d'intérêt avec rendu instancié via WebGLOptimizer
const PointsOfInterestInstanced = ({ pointsData, isMobile, optimizer }) => {
  const { scene } = useThree();
  const labelRefs = useRef([]);

  // Types de points d'intérêt avec leurs couleurs
  const poiColors = useMemo(() => ({
    viewpoint: "#1E88E5", // Bleu
    rest: "#43A047",      // Vert
    summit: "#E53935",    // Rouge
    default: "#FFC107"    // Jaune par défaut
  }), []);

  useEffect(() => {
    if (!optimizer || !pointsData || pointsData.length === 0) return;

    // Créer une géométrie de base pour tous les POIs (sphère)
    const sphereSize = isMobile ? 0.2 : 0.15;
    const sphereGeometry = new THREE.SphereGeometry(sphereSize, 16, 16);

    // Grouper par type pour optimiser le rendu
    const poiByType = pointsData.reduce((acc, poi) => {
      if (!acc[poi.type]) acc[poi.type] = [];
      acc[poi.type].push(poi);
      return acc;
    }, {});

    // Créer un maillage instancié pour chaque type
    Object.entries(poiByType).forEach(([type, pois]) => {
      const color = poiColors[type] || poiColors.default;
      const material = new THREE.MeshStandardMaterial({ color });
      
      // Utiliser l'optimizer pour créer un maillage instancié
      const instancedMesh = optimizer.getInstancedMesh(
        sphereGeometry, 
        material, 
        pois.length, 
        `poi-${type}`
      );

      // Configurer chaque instance
      pois.forEach((poi, index) => {
        optimizer.setInstanceMatrix(
          instancedMesh,
          index,
          new THREE.Vector3(poi.position[0], poi.position[1], poi.position[2])
        );
      });
    });

    // Nettoyage
    return () => {
      // Nettoyage des ressources non utilisées
      optimizer.disposeUnusedResources();
    };
  }, [pointsData, optimizer, isMobile, poiColors]);

  // Rendu des étiquettes (non instanciées car textes différents)
  return (
    <>
      {pointsData && pointsData.map((poi, index) => (
        <Html
          key={index}
          position={[poi.position[0], poi.position[1] + 0.35, poi.position[2]]}
          center
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'none',
            opacity: isMobile ? 1 : 0.8
          }}
        >
          <div
            ref={el => {
              if (labelRefs.current.length <= index) {
                labelRefs.current.push(el);
              } else {
                labelRefs.current[index] = el;
              }
            }}
            style={{
              padding: '3px 6px',
              borderRadius: '4px',
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
              fontSize: isMobile ? '10px' : '8px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              transform: 'scale(0.5)',
              transformOrigin: 'center center'
            }}
          >
            {poi.name}
          </div>
        </Html>
      ))}
    </>
  );
};

// Composant pour la caméra et les contrôles avec WebGLOptimizer
const SceneSetup = ({ data, isMobile, setOptimizer }) => {
  const { camera, scene, gl } = useThree();
  const controlsRef = useRef();
  
  // Calcul du centre et de la taille de la scène pour cadrage
  const sceneProps = useMemo(() => {
    const maxX = Math.max(...data.map(p => p.x));
    const maxY = Math.max(...data.map(p => p.y));
    return { maxX, maxY };
  }, [data]);
  
  useEffect(() => {
    // Configurer la caméra
    camera.position.set(sceneProps.maxX / 2, sceneProps.maxY + 2, 5);
    camera.lookAt(sceneProps.maxX / 2, sceneProps.maxY / 2, 0);
    
    // Adaptations mobiles
    if (isMobile) {
      // Position et contrôles adaptés pour mobile
      camera.position.z = 7; // Plus reculé sur mobile
      
      if (controlsRef.current) {
        controlsRef.current.rotateSpeed = 0.5;
        controlsRef.current.zoomSpeed = 0.5;
      }
    }
    
    // Créer l'optimiseur WebGL adaptatif
    const optimizer = createAdaptiveWebGLOptimizer(gl, scene, camera);
    
    // Appliquer les optimisations de base
    optimizer.optimizeRenderer();
    
    // Partager l'optimiseur avec le composant parent
    setOptimizer(optimizer);
    
    // Nettoyage
    return () => {
      // Optimiser la libération de mémoire lors du démontage
      optimizer.disposeUnusedResources();
    };
  }, [camera, scene, gl, sceneProps, isMobile, setOptimizer]);
  
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={1} 
        castShadow={!isMobile} 
      />
      <OrbitControls 
        ref={controlsRef}
        enableDamping={true}
        dampingFactor={0.05}
        minDistance={1}
        maxDistance={50}
        enablePan={!isMobile}
        maxPolarAngle={Math.PI / 2 - 0.1}
      />
    </>
  );
};

// Animation de la caméra pour "parcourir" le col avec optimisation
const CameraAnimation = ({ data, isPlaying }) => {
  const { camera } = useThree();
  const currentPointRef = useRef(0);
  const speedFactor = useRef(0.2); // Facteur de vitesse
  
  // Créer le chemin de caméra une seule fois
  const cameraPath = useMemo(() => {
    if (!data || data.length < 2) return null;
    
    const points = data.map(point => 
      new THREE.Vector3(point.x, point.y + 1.5, 0.5)
    );
    
    return new THREE.CatmullRomCurve3(points);
  }, [data]);
  
  // Animer la caméra le long du chemin
  useFrame(() => {
    if (!isPlaying || !cameraPath) return;
    
    // Calculer la nouvelle position sur le chemin
    const progress = currentPointRef.current / 100;
    if (progress >= 1) {
      currentPointRef.current = 0;
      return;
    }
    
    // Position et orientation sur le chemin
    const position = cameraPath.getPointAt(progress);
    const lookAtPoint = cameraPath.getPointAt(Math.min(progress + 0.05, 1));
    
    // Appliquer les transformations
    camera.position.copy(position);
    camera.lookAt(lookAtPoint);
    
    // Avancer
    currentPointRef.current += speedFactor.current;
  });
  
  // Réinitialiser l'animation quand elle est activée
  useEffect(() => {
    if (isPlaying) {
      currentPointRef.current = 0;
    }
  }, [isPlaying]);
  
  return null;
};

// Composant de chargement pour la visualisation 3D
const LoadingPlaceholder = () => {
  return (
    <Html center>
      <Box display="flex" alignItems="center" flexDirection="column">
        <CircularProgress size={30} />
        <Typography variant="caption" sx={{ mt: 1 }}>
          Chargement 3D...
        </Typography>
      </Box>
    </Html>
  );
};

// Composant principal de visualisation 3D avec lazy loading et optimisations
const ColVisualization3D = ({ colId, colData, pointsOfInterest }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [terrainData, setTerrainData] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [optimizer, setOptimizer] = useState(null);
  const [preparedPOIs, setPreparedPOIs] = useState([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Utiliser react-intersection-observer pour le lazy loading
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });
  
  // Déterminer la qualité du rendu en fonction de l'appareil
  const renderQuality = useMemo(() => {
    if (isMobile) {
      // Vérifier si c'est un appareil mobile haut de gamme ou bas de gamme
      const isLowEndDevice = 
        !window.devicePixelRatio || 
        window.devicePixelRatio < 2 || 
        navigator.hardwareConcurrency < 4;
      
      return isLowEndDevice ? 'low' : 'medium';
    }
    return 'high';
  }, [isMobile]);
  
  useEffect(() => {
    // Les données sont déjà fournies en props
    if (colData) {
      setTerrainData(colData);
      setLoading(false);
    } else {
      setError("Données du col non disponibles");
      setLoading(false);
    }
  }, [colData]);
  
  // Préparer les points d'intérêt pour le rendu instancié
  useEffect(() => {
    if (!terrainData || !pointsOfInterest) return;
    
    const prepared = pointsOfInterest.map(poi => {
      // Trouver le point correspondant à la distance du POI
      const distanceRatio = poi.distance / Math.max(...terrainData.map(p => p.x));
      const nearestIndex = Math.floor(distanceRatio * terrainData.length);
      const point = terrainData[Math.min(nearestIndex, terrainData.length - 1)];
      
      return {
        ...poi,
        position: [point.x, point.y + 0.3, point.z]
      };
    });
    
    setPreparedPOIs(prepared);
  }, [terrainData, pointsOfInterest]);
  
  // Fonction pour gérer le clic sur le bouton d'animation
  const toggleAnimation = useCallback(() => {
    setIsAnimating(prev => !prev);
  }, []);
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }
  
  if (!terrainData) return null;
  
  return (
    <Paper 
      elevation={2} 
      sx={{ 
        height: isMobile ? '300px' : '400px', 
        width: '100%', 
        overflow: 'hidden', 
        position: 'relative' 
      }}
      ref={ref}
    >
      <Typography
        variant="button"
        sx={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: isMobile ? '0.7rem' : '0.8rem',
        }}
        onClick={toggleAnimation}
      >
        {isAnimating ? 'Arrêter l\'animation' : 'Parcourir le col'}
      </Typography>
      
      {inView ? (
        <Canvas shadows dpr={[1, isMobile ? 1.5 : 2]}>
          <Suspense fallback={<LoadingPlaceholder />}>
            <SceneSetup data={terrainData} isMobile={isMobile} setOptimizer={setOptimizer} />
            <CameraAnimation data={terrainData} isPlaying={isAnimating} />
            <Terrain data={terrainData} quality={renderQuality} optimizer={optimizer} />
            <ColRoad data={terrainData} optimizer={optimizer} />
            
            {preparedPOIs.length > 0 && optimizer && (
              <PointsOfInterestInstanced 
                pointsData={preparedPOIs} 
                isMobile={isMobile} 
                optimizer={optimizer}
              />
            )}
          </Suspense>
        </Canvas>
      ) : (
        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
          <CircularProgress size={isMobile ? 30 : 40} />
          <Typography variant="body2" sx={{ ml: 2 }}>
            Chargement de la visualisation 3D...
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default ColVisualization3D;
