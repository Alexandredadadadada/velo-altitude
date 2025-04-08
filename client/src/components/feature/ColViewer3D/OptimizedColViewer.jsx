/**
 * Composant optimisé de visualisation 3D des cols pour Velo-Altitude
 * Utilise les optimisations avancées pour garantir de bonnes performances
 */

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  useTexture,
  ContactShadows,
  Stats
} from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Box, Paper, Typography, Slider, FormControlLabel, Switch, CircularProgress } from '@mui/material';
import { 
  PerformanceAdaptiveRenderer, 
  useIntelligentCulling,
  useDynamicLOD
} from '../../../services/rendering/ThreePerformanceOptimizer';
import { useMediaQuery, useTheme } from '@mui/material';

// Composant pour le terrain du col
const TerrainMesh = ({ 
  terrainData, 
  textureUrl, 
  heightScale = 0.5,
  resolution = 128,
  position = [0, 0, 0]
}) => {
  const meshRef = useRef();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // Optimisation LOD
  const lod = useDynamicLOD({
    distanceLevels: [100, 500, 1000],
    geometryDetail: [1.0, 0.7, 0.4, 0.2]
  });
  
  // Intelligent Culling
  const { registerObject } = useIntelligentCulling();
  
  // Chargement de la texture
  const texture = useTexture(textureUrl);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  
  // Géométrie du terrain générée à partir des données d'élévation
  const geometry = useMemo(() => {
    // Utiliser une résolution différente selon le niveau de détail
    const actualResolution = Math.round(resolution * lod.geometryDetail);
    
    const geometry = new THREE.PlaneGeometry(
      100, 
      100, 
      actualResolution - 1, 
      actualResolution - 1
    );
    
    // Mettre à jour les vertices selon les données d'élévation
    if (terrainData && terrainData.elevation) {
      const vertices = geometry.attributes.position.array;
      
      for (let i = 0; i < vertices.length; i += 3) {
        // Index x et y dans la grille
        const x = Math.floor((i / 3) % actualResolution);
        const y = Math.floor((i / 3) / actualResolution);
        
        // Normaliser entre 0 et 1
        const normalizedX = x / (actualResolution - 1);
        const normalizedY = y / (actualResolution - 1);
        
        // Trouver l'index dans les données d'élévation 
        const dataX = Math.floor(normalizedX * (terrainData.resolution - 1));
        const dataY = Math.floor(normalizedY * (terrainData.resolution - 1));
        const elevationIndex = dataY * terrainData.resolution + dataX;
        
        // Appliquer l'élévation
        if (elevationIndex < terrainData.elevation.length) {
          vertices[i + 2] = terrainData.elevation[elevationIndex] * heightScale;
        }
      }
      
      geometry.computeVertexNormals();
    }
    
    return geometry;
  }, [terrainData, lod.geometryDetail, resolution, heightScale]);
  
  // Effet pour enregistrer l'objet pour le culling
  useEffect(() => {
    if (meshRef.current) {
      registerObject(meshRef.current);
    }
  }, [registerObject]);

  return (
    <mesh 
      ref={meshRef}
      geometry={geometry}
      position={position}
      receiveShadow
      castShadow
      rotation={[-Math.PI / 2, 0, 0]}
      ref={lod.ref}
    >
      <meshStandardMaterial 
        map={texture}
        displacementMap={texture}
        displacementScale={0.5}
        roughness={0.8}
        metalness={0.1}
        color={isDarkMode ? '#606060' : '#ffffff'}
      />
    </mesh>
  );
};

// Modèle 3D du col avec optimisations
const ColModel = ({ modelUrl, scale = 1, position = [0, 0, 0] }) => {
  const gltf = useLoader(GLTFLoader, modelUrl);
  const modelRef = useRef();
  
  // LOD pour le modèle
  const lod = useDynamicLOD();
  
  // Culling
  const { registerObject } = useIntelligentCulling();
  
  // Copier la référence LOD vers le modèle
  useEffect(() => {
    if (modelRef.current) {
      lod.ref.current = modelRef.current;
      registerObject(modelRef.current);
    }
  }, [lod, registerObject]);
  
  // Animation subtile
  useFrame((state) => {
    if (modelRef.current) {
      modelRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.02;
    }
  });
  
  // Cloner le modèle pour éviter les mutations
  const model = useMemo(() => gltf.scene.clone(), [gltf]);
  
  // Optimiser les matériaux selon le LOD
  useEffect(() => {
    model.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        
        // Optimiser les matériaux selon le LOD
        if (node.material) {
          if (lod.detailLevel > 1) {
            node.material.flatShading = true;
            node.material.roughness = 0.9;
            node.material.metalness = 0.1;
          }
        }
      }
    });
  }, [model, lod.detailLevel]);

  return (
    <primitive 
      ref={modelRef}
      object={model} 
      position={position}
      scale={[scale, scale, scale]}
    />
  );
};

/**
 * Composant principal de visualisation 3D des cols
 */
const OptimizedColViewer = ({ 
  colData, 
  height = 500, 
  width = '100%',
  showControls = true,
  showStats = false,
  onRenderComplete = null
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isLoading, setIsLoading] = useState(true);
  const [qualitySettings, setQualitySettings] = useState({
    resolution: isMobile ? 64 : 128,
    heightScale: 0.5,
    enableLOD: true
  });
  
  // Terrain et modèle 3D
  const terrainData = useMemo(() => colData?.terrain || null, [colData]);
  const modelUrl = useMemo(() => colData?.modelUrl || '/models/default_mountain.glb', [colData]);
  const textureUrl = useMemo(() => colData?.textureUrl || '/textures/terrain_default.jpg', [colData]);
  
  // Chargement terminé
  useEffect(() => {
    if (colData) {
      const timer = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [colData]);
  
  // Notifier que le rendu est terminé
  useEffect(() => {
    if (!isLoading && onRenderComplete) {
      onRenderComplete();
    }
  }, [isLoading, onRenderComplete]);

  // Formulaire de contrôle de qualité
  const renderControls = () => {
    if (!showControls) return null;
    
    return (
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          position: 'absolute', 
          bottom: 16, 
          right: 16, 
          maxWidth: 300,
          zIndex: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          Résolution du terrain
        </Typography>
        <Slider
          value={qualitySettings.resolution}
          onChange={(_, value) => setQualitySettings({...qualitySettings, resolution: value})}
          min={32}
          max={256}
          step={16}
          valueLabelDisplay="auto"
          disabled={isLoading}
          sx={{ mb: 2 }}
        />
        
        <Typography variant="subtitle2" gutterBottom>
          Échelle verticale
        </Typography>
        <Slider
          value={qualitySettings.heightScale}
          onChange={(_, value) => setQualitySettings({...qualitySettings, heightScale: value})}
          min={0.1}
          max={1.0}
          step={0.1}
          valueLabelDisplay="auto"
          disabled={isLoading}
          sx={{ mb: 2 }}
        />
        
        <FormControlLabel
          control={
            <Switch 
              checked={qualitySettings.enableLOD}
              onChange={(e) => setQualitySettings({
                ...qualitySettings, 
                enableLOD: e.target.checked
              })}
              disabled={isLoading}
            />
          }
          label="Optimisation dynamique"
        />
      </Paper>
    );
  };

  return (
    <Box 
      sx={{ 
        height, 
        width, 
        position: 'relative',
        borderRadius: 1,
        overflow: 'hidden',
        boxShadow: 3
      }}
    >
      {isLoading && (
        <Box 
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5,
            backgroundColor: theme.palette.background.paper
          }}
        >
          <CircularProgress />
        </Box>
      )}
      
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
        <PerformanceAdaptiveRenderer targetFPS={isMobile ? 30 : 45}>
          <PerspectiveCamera 
            makeDefault 
            position={[0, 20, 50]} 
            fov={45}
          />
          
          <hemisphereLight 
            intensity={0.5} 
            color={theme.palette.mode === 'dark' ? '#556' : '#ddeeff'} 
            groundColor={theme.palette.mode === 'dark' ? '#333' : '#8a7f58'} 
          />
          
          <spotLight 
            position={[50, 50, 50]} 
            angle={0.25} 
            penumbra={0.5} 
            castShadow 
            intensity={1.5}
            shadow-bias={-0.0001}
          />
          
          <directionalLight 
            position={[-10, 10, 5]} 
            intensity={0.7}
            castShadow
          />
          
          {terrainData && (
            <TerrainMesh 
              terrainData={terrainData}
              textureUrl={textureUrl}
              heightScale={qualitySettings.heightScale}
              resolution={qualitySettings.resolution}
            />
          )}
          
          <ColModel 
            modelUrl={modelUrl}
            scale={1.5}
            position={[0, 0, 0]}
          />
          
          <ContactShadows 
            position={[0, -0.5, 0]}
            opacity={0.5}
            scale={100}
            blur={1.5}
            far={10}
          />
          
          <Environment preset="sunset" />
          
          <OrbitControls 
            enableDamping={true} 
            dampingFactor={0.05}
            minDistance={10}
            maxDistance={100}
            maxPolarAngle={Math.PI / 2 - 0.1}
          />
          
          {showStats && <Stats />}
        </PerformanceAdaptiveRenderer>
      </Canvas>
      
      {renderControls()}
    </Box>
  );
};

export default OptimizedColViewer;
