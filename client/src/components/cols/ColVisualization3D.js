import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';

// Composant pour la route du col
const ColRoad = ({ data, color = "#444444" }) => {
  const meshRef = useRef();
  const points = data.map(point => new THREE.Vector3(point.x, point.y, point.z));
  const curve = new THREE.CatmullRomCurve3(points);
  
  // Créer la géométrie du tube (route)
  const tubeGeometry = new THREE.TubeGeometry(
    curve,
    100,  // Segments tubulaires
    0.2,  // Rayon
    8,    // Segments radiaux
    false // Fermé
  );

  return (
    <mesh ref={meshRef}>
      <primitive object={tubeGeometry} attach="geometry" />
      <meshStandardMaterial color={color} roughness={0.6} />
    </mesh>
  );
};

// Composant pour le terrain environnant
const Terrain = ({ data }) => {
  const meshRef = useRef();
  
  // Déterminer les dimensions du terrain
  const maxX = Math.max(...data.map(p => p.x)) + 2;
  const maxY = Math.max(...data.map(p => p.y)) + 1;
  const minY = Math.min(...data.map(p => p.y)) - 0.5;
  
  // Créer une simple géométrie de plan pour le terrain
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[maxX / 2, minY - 0.1, 0]}>
      <planeGeometry args={[maxX * 1.5, 10]} />
      <meshStandardMaterial color="#4b7f52" wireframe={false} />
    </mesh>
  );
};

// Composant pour les points d'intérêt
const PointOfInterest = ({ position, name, type }) => {
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

// Composant pour la caméra et les contrôles
const SceneSetup = ({ data }) => {
  const { camera } = useThree();
  
  // Calcul du centre et de la taille de la scène pour cadrage
  const maxX = Math.max(...data.map(p => p.x));
  const maxY = Math.max(...data.map(p => p.y));
  
  // Position initiale de la caméra
  useEffect(() => {
    camera.position.set(maxX / 2, maxY * 2, 5);
    camera.lookAt(maxX / 2, 0, 0);
  }, [camera, maxX, maxY]);
  
  return (
    <>
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        target={[maxX / 2, maxY / 2, 0]}
      />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={0.7} />
      <directionalLight position={[-10, 10, 5]} intensity={0.3} />
    </>
  );
};

// Animation de la caméra pour "parcourir" le col
const CameraAnimation = ({ data, isPlaying }) => {
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
    }
  });
  
  return null;
};

// Composant principal de visualisation 3D
const ColVisualization3D = ({ colId, colData, pointsOfInterest }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [terrainData, setTerrainData] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
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
    <Paper elevation={2} sx={{ height: '400px', width: '100%', overflow: 'hidden', position: 'relative' }}>
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
        }}
        onClick={() => setIsAnimating(!isAnimating)}
      >
        {isAnimating ? 'Arrêter l\'animation' : 'Parcourir le col'}
      </Typography>
      
      <Canvas shadows>
        <SceneSetup data={terrainData} />
        <CameraAnimation data={terrainData} isPlaying={isAnimating} />
        <Terrain data={terrainData} />
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
            />
          );
        })}
      </Canvas>
    </Paper>
  );
};

export default ColVisualization3D;
