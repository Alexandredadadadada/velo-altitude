import React, { useRef, useEffect, useState, useMemo, Suspense, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Box, Typography, CircularProgress, Paper, useMediaQuery, useTheme } from '@mui/material';
import { useInView } from 'react-intersection-observer';

// Composant pour la route du col avec optimisation de la géométrie
const ColRoad = ({ data, color = "#444444" }) => {
  const meshRef = useRef();
  
  // Utiliser useMemo pour éviter de recréer la géométrie à chaque rendu
  const geometry = useMemo(() => {
    const points = data.map(point => new THREE.Vector3(point.x, point.y, point.z));
    const curve = new THREE.CatmullRomCurve3(points);
    
    // Adapter le niveau de détail en fonction de la complexité des données
    const segments = Math.min(100, Math.max(20, Math.floor(data.length / 2)));
    
    return new THREE.TubeGeometry(
      curve,
      segments,  // Segments tubulaires adaptés
      0.2,       // Rayon
      8,         // Segments radiaux
      false      // Fermé
    );
  }, [data]);

  return (
    <mesh ref={meshRef}>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial color={color} roughness={0.6} />
    </mesh>
  );
};

// Composant pour le terrain environnant avec optimisation
const Terrain = ({ data, quality = 'high' }) => {
  const meshRef = useRef();
  
  // Utiliser useMemo pour les calculs coûteux
  const terrainProps = useMemo(() => {
    const maxX = Math.max(...data.map(p => p.x)) + 2;
    const maxY = Math.max(...data.map(p => p.y)) + 1;
    const minY = Math.min(...data.map(p => p.y)) - 0.5;
    
    return {
      position: [maxX / 2, minY - 0.1, 0],
      dimensions: [maxX * 1.5, 10],
      segments: quality === 'high' ? [32, 32] : [16, 16]
    };
  }, [data, quality]);

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

// Composant pour les points d'intérêt avec optimisation
const PointOfInterest = ({ position, name, type, isMobile }) => {
  const [hovered, setHovered] = useState(false);
  const sphereSize = isMobile ? 0.2 : 0.15;
  const fontSize = isMobile ? 0.18 : 0.15;
  
  // Choisir la couleur en fonction du type
  const color = useMemo(() => {
    switch (type) {
      case 'viewpoint': return "#1E88E5"; // Bleu
      case 'rest': return "#43A047"; // Vert
      case 'summit': return "#E53935"; // Rouge
      default: return "#FFC107"; // Jaune
    }
  }, [type]);
  
  // Gestionnaires d'événements optimisés
  const handlePointerOver = useCallback(() => setHovered(true), []);
  const handlePointerOut = useCallback(() => setHovered(false), []);
  
  return (
    <group position={position}>
      <mesh 
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[sphereSize, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {(hovered || isMobile) && (
        <Text
          position={[0, 0.3, 0]}
          color="white"
          fontSize={fontSize}
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

// Composant pour la caméra et les contrôles avec adaptation mobile
const SceneSetup = ({ data, isMobile }) => {
  const { camera } = useThree();
  
  // Calcul du centre et de la taille de la scène pour cadrage
  const sceneProps = useMemo(() => {
    const maxX = Math.max(...data.map(p => p.x));
    const maxY = Math.max(...data.map(p => p.y));
    return { maxX, maxY };
  }, [data]);
  
  // Position initiale de la caméra
  useEffect(() => {
    camera.position.set(sceneProps.maxX / 2, sceneProps.maxY * 2, 5);
    camera.lookAt(sceneProps.maxX / 2, 0, 0);
  }, [camera, sceneProps]);
  
  return (
    <>
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        target={[sceneProps.maxX / 2, sceneProps.maxY / 2, 0]}
        // Ajuster la sensibilité pour les appareils mobiles
        rotateSpeed={isMobile ? 0.7 : 1}
        zoomSpeed={isMobile ? 0.7 : 1}
        panSpeed={isMobile ? 0.7 : 1}
        // Désactiver le zoom à deux doigts pour éviter les conflits
        enableDamping={true}
        dampingFactor={0.05}
      />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={0.7} />
      <directionalLight position={[-10, 10, 5]} intensity={0.3} />
    </>
  );
};

// Animation de la caméra pour "parcourir" le col avec optimisation
const CameraAnimation = ({ data, isPlaying }) => {
  const { camera } = useThree();
  
  // Utiliser useMemo pour éviter de recalculer la courbe à chaque frame
  const curve = useMemo(() => {
    const points = data.map(point => new THREE.Vector3(point.x, point.y + 0.5, point.z));
    return new THREE.CatmullRomCurve3(points);
  }, [data]);
  
  // Points pour la "preview" du chemin
  const [progress, setProgress] = useState(0);
  
  // Optimiser l'animation avec useCallback
  const animateCamera = useCallback((delta) => {
    if (isPlaying) {
      setProgress((prev) => (prev + 0.0005) % 1); // Vitesse réduite pour une expérience plus fluide
      const position = curve.getPoint(progress);
      const lookAtPos = curve.getPoint(Math.min(progress + 0.01, 1));
      
      camera.position.set(position.x, position.y, position.z);
      camera.lookAt(lookAtPos.x, lookAtPos.y, lookAtPos.z);
    }
  }, [isPlaying, curve, progress, camera]);
  
  useFrame(animateCamera);
  
  return null;
};

// Composant de chargement pour la visualisation 3D
const LoadingPlaceholder = () => (
  <Html center>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress size={40} />
      <Typography variant="body2" style={{ marginTop: 10, color: 'white' }}>
        Chargement de la visualisation 3D...
      </Typography>
    </div>
  </Html>
);

// Composant principal de visualisation 3D avec lazy loading et optimisations
const ColVisualization3D = ({ colId, colData, pointsOfInterest }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [terrainData, setTerrainData] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
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
        <Canvas shadows>
          <Suspense fallback={<LoadingPlaceholder />}>
            <SceneSetup data={terrainData} isMobile={isMobile} />
            <CameraAnimation data={terrainData} isPlaying={isAnimating} />
            <Terrain data={terrainData} quality={renderQuality} />
            <ColRoad data={terrainData} />
            
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
                  isMobile={isMobile}
                />
              );
            })}
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
