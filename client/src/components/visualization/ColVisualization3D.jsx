import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Stats, 
  PerspectiveCamera, 
  Environment, 
  Html
} from '@react-three/drei';
import * as THREE from 'three';
import { Box, Typography, CircularProgress, useTheme, Chip, Paper } from '@mui/material';
import { useBatteryStatus } from '../../hooks/useBatteryStatus';
import { threeDConfigManager } from '../../utils/threeDConfigManager';
import { markPerformanceEvent } from '../../performance/setupMonitoring';

// Composant qui génère le terrain à partir des données d'élévation
const Terrain = ({ data, color, wireframe, segments, position, rotation, scale }) => {
  const meshRef = useRef();
  const theme = useTheme();
  
  // Générer la géométrie du terrain à partir des données d'élévation
  const geometry = useMemo(() => {
    if (!data || !data.elevationProfile) return null;
    
    const profile = data.elevationProfile;
    const width = profile.length;
    const depth = 20;
    
    const geometry = new THREE.PlaneGeometry(
      width / 10, 
      depth, 
      segments, 
      Math.max(5, Math.floor(segments / 4))
    );
    
    // Modifier les vertices pour créer le profil d'élévation
    const vertices = geometry.attributes.position.array;
    
    for (let i = 0; i < width; i++) {
      const elevationValue = profile[i].elevation / 20; // Mise à l'échelle
      
      for (let j = 0; j <= Math.max(5, Math.floor(segments / 4)); j++) {
        const index = (i * (Math.max(5, Math.floor(segments / 4)) + 1) + j) * 3 + 2;
        if (vertices[index] !== undefined) {
          vertices[index] = elevationValue;
        }
      }
    }
    
    geometry.computeVertexNormals();
    
    return geometry;
  }, [data, segments]);
  
  // Appliquer un matériau au terrain
  const material = useMemo(() => {
    const primaryColor = color || theme.palette.primary.main;
    
    return new THREE.MeshStandardMaterial({
      color: primaryColor,
      wireframe: wireframe,
      flatShading: true,
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.2,
    });
  }, [color, wireframe, theme]);
  
  // Animer le terrain si nécessaire
  useFrame((state) => {
    if (meshRef.current) {
      // Animation subtile du terrain
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.05) * 0.005;
    }
  });
  
  if (!geometry) return null;
  
  return (
    <mesh 
      ref={meshRef} 
      geometry={geometry} 
      material={material}
      position={position}
      rotation={rotation}
      scale={scale}
      receiveShadow
      castShadow
    />
  );
};

// Marqueurs d'altitude sur le terrain
const ElevationMarkers = ({ data, position, rotation, scale }) => {
  useThree();
  const theme = useTheme();
  
  // Créer des marqueurs pour les points clés du profil d'élévation
  const markers = useMemo(() => {
    if (!data || !data.elevationProfile) return [];
    
    const profile = data.elevationProfile;
    const width = profile.length;
    
    // Sélectionner quelques points clés pour les marqueurs
    const keyPoints = [];
    
    // Point le plus haut
    let highestPoint = { elevation: -Infinity, index: 0 };
    
    for (let i = 0; i < width; i++) {
      if (profile[i].elevation > highestPoint.elevation) {
        highestPoint = { elevation: profile[i].elevation, index: i };
      }
      
      // Ajouter d'autres points significatifs (changements de pente, etc.)
      if (i > 0 && i < width - 1) {
        const prevSlope = profile[i].elevation - profile[i-1].elevation;
        const nextSlope = profile[i+1].elevation - profile[i].elevation;
        
        // Changement significatif de pente
        if ((prevSlope > 0 && nextSlope < 0) || (prevSlope < 0 && nextSlope > 0)) {
          if (keyPoints.length === 0 || i - keyPoints[keyPoints.length - 1].index > width / 10) {
            keyPoints.push({ 
              elevation: profile[i].elevation, 
              index: i,
              distance: profile[i].distance,
              isInflection: true
            });
          }
        }
      }
      
      // Ajouter le début et la fin
      if (i === 0 || i === width - 1) {
        keyPoints.push({ 
          elevation: profile[i].elevation, 
          index: i,
          distance: profile[i].distance,
          isEndpoint: true
        });
      }
    }
    
    // Ajouter le point le plus haut s'il n'est pas déjà inclus
    if (!keyPoints.some(p => p.index === highestPoint.index)) {
      keyPoints.push({ 
        ...highestPoint, 
        distance: profile[highestPoint.index].distance,
        isHighest: true 
      });
    }
    
    return keyPoints;
  }, [data]);
  
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {markers.map((marker, idx) => {
        const x = (marker.index / (data.elevationProfile.length - 1)) * (data.elevationProfile.length / 10) - (data.elevationProfile.length / 20);
        const y = 0;
        const z = marker.elevation / 20 + 0.5; // Légèrement au-dessus du terrain
        
        return (
          <group key={idx} position={[x, y, z]}>
            <Html
              position={[0, 0, 0.5]}
              occlude
              transform
              sprite
              center
              distanceFactor={40}
              zIndexRange={[0, 1]}
            >
              <Paper 
                elevation={3} 
                sx={{
                  p: 0.5,
                  backgroundColor: marker.isHighest 
                    ? theme.palette.error.light 
                    : marker.isInflection 
                      ? theme.palette.secondary.light 
                      : theme.palette.primary.light,
                  opacity: 0.9,
                  borderRadius: 1,
                  maxWidth: 100,
                  textAlign: 'center'
                }}
              >
                <Typography variant="caption" fontWeight="bold">
                  {marker.elevation}m
                </Typography>
                {marker.isEndpoint && (
                  <Typography variant="caption" display="block">
                    {marker.distance}km
                  </Typography>
                )}
              </Paper>
            </Html>
            
            <mesh position={[0, 0, -0.3]}>
              <cylinderGeometry args={[0.05, 0.05, 0.6, 8]} />
              <meshStandardMaterial 
                color={marker.isHighest 
                  ? theme.palette.error.main 
                  : marker.isInflection 
                    ? theme.palette.secondary.main 
                    : theme.palette.primary.main} 
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

// Composant principal de visualisation 3D des cols
const ColVisualization3D = ({ 
  colData, 
  height = 400, 
  width = '100%', 
  showStats = false,
  enableRotation = true,
  backgroundColor = null,
  wireframe = false
}) => {
  const theme = useTheme();
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(!colData);
  const [error, setError] = useState(null);
  const batteryStatus = useBatteryStatus();
  const initialRenderTimeRef = useRef(null);
  
  // Récupérer la configuration 3D adaptée au dispositif
  const config = useMemo(() => {
    // Marquer le début de la configuration
    markPerformanceEvent('3d_config_start');
    
    let quality = 'medium';
    
    // Adapter la qualité en fonction de la batterie et du dispositif
    if (batteryStatus) {
      if (batteryStatus.level < 0.2 && !batteryStatus.charging) {
        quality = 'low';
      } else if (batteryStatus.level > 0.6 || batteryStatus.charging) {
        quality = 'high';
      }
    }
    
    // Obtenir la configuration basée sur la qualité
    const config = threeDConfigManager.getConfig(quality);
    
    // Marquer la fin de la configuration
    markPerformanceEvent('3d_config_end');
    
    return config;
  }, [batteryStatus]);
  
  // Définir le nombre de segments en fonction de la configuration
  const segments = useMemo(() => {
    return config.segmentsCount || 50;
  }, [config]);
  
  // Définir la couleur d'arrière-plan
  const bgColor = useMemo(() => {
    return backgroundColor || (theme.palette.mode === 'dark' ? '#1A1A2E' : '#E6F2FF');
  }, [backgroundColor, theme]);
  
  // Mesurer les performances d'initialisation
  useEffect(() => {
    if (colData && !initialRenderTimeRef.current) {
      // Marquer le début du rendu initial
      markPerformanceEvent('3d_render_init_start', { 
        colId: colData.id, 
        complexity: segments 
      });
      
      const startTime = performance.now();
      initialRenderTimeRef.current = startTime;
      
      // Simuler la détection de la fin du rendu initial
      const checkRendered = () => {
        if (canvasRef.current) {
          const endTime = performance.now();
          const renderTime = endTime - startTime;
          
          // Marquer la fin du rendu initial
          markPerformanceEvent('3d_render_init_complete', { 
            colId: colData.id, 
            renderTimeMs: renderTime,
            quality: config.quality
          });
          
          console.log(`[Performance] Initial 3D render completed in ${renderTime.toFixed(2)}ms (quality: ${config.quality})`);
        } else {
          // Réessayer si le canvas n'est pas encore disponible
          setTimeout(checkRendered, 100);
        }
      };
      
      // Attendre que le canvas soit rendu
      setTimeout(checkRendered, 300);
    }
    
    // Nettoyage lors du démontage du composant
    return () => {
      if (initialRenderTimeRef.current) {
        // Marquer la fin de vie du composant
        markPerformanceEvent('3d_component_unmount', { 
          colId: colData?.id
        });
      }
    };
  }, [colData, segments, config.quality]);
  
  // Mettre à jour l'état de chargement lorsque les données du col changent
  useEffect(() => {
    if (colData) {
      markPerformanceEvent('3d_data_received', { colId: colData.id });
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [colData]);
  
  // Gérer les erreurs
  useEffect(() => {
    if (!colData?.elevationProfile) {
      setError('Les données d\'élévation ne sont pas disponibles.');
    } else {
      setError(null);
    }
  }, [colData]);
  
  // Si les données ne sont pas disponibles
  if (error) {
    markPerformanceEvent('3d_render_error', { error });
    return (
      <Box
        sx={{
          height,
          width,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: bgColor,
          borderRadius: 2,
          p: 2,
        }}
      >
        <Typography variant="h6" color="error">
          {error}
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box
      sx={{
        height,
        width,
        position: 'relative',
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: theme.shadows[4],
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
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 10,
          }}
        >
          <CircularProgress color="primary" />
        </Box>
      )}
      
      <Canvas 
        ref={canvasRef} 
        shadows
        frameloop={colData ? 'demand' : 'never'} // Optimisation: utiliser 'demand' pour économiser les ressources
        onCreated={({ gl }) => {
          markPerformanceEvent('3d_canvas_created');
          // Force l'utilisation de WebGL2 quand possible pour de meilleures performances
          if (gl.capabilities.isWebGL2) {
            markPerformanceEvent('3d_using_webgl2', { supported: true });
          } else {
            markPerformanceEvent('3d_using_webgl2', { supported: false });
          }
        }}
      >
        <color attach="background" args={[bgColor]} />
        
        <PerspectiveCamera
          makeDefault
          position={[0, -20, 15]}
          fov={50}
          near={0.1}
          far={1000}
        />
        
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 10, 10]} 
          intensity={1} 
          castShadow 
          shadow-mapSize={[1024, 1024]} 
        />
        
        <Environment preset="sunset" />
        
        <group>
          <Terrain 
            data={colData} 
            color={theme.palette.primary.main}
            wireframe={wireframe}
            segments={segments}
            position={[0, 0, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={1}
          />
          
          <ElevationMarkers 
            data={colData}
            position={[0, 0, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={1}
          />
        </group>
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={enableRotation}
          maxPolarAngle={Math.PI / 2}
          minDistance={5}
          maxDistance={50}
          onChange={() => {
            // Marquer les interactions utilisateur pour le suivi des performances
            markPerformanceEvent('3d_user_interaction');
          }}
        />
        
        {showStats && config.performance === 'high' && <Stats />}
      </Canvas>
      
      {colData && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 5,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            p: 1,
            borderRadius: 1,
            backdropFilter: 'blur(4px)',
            maxWidth: '60%',
          }}
        >
          <Typography variant="h6" color="white">
            {colData.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <Chip 
              label={`${colData.altitude || 0}m`} 
              size="small"
              color="primary"
            />
            <Chip 
              label={`${colData.distance || 0}km`} 
              size="small" 
              color="secondary"
            />
            <Chip 
              label={`${colData.avgGradient || 0}%`} 
              size="small"
              color="warning" 
            />
          </Box>
        </Box>
      )}
      
      {/* Info sur la qualité de rendu */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          zIndex: 5,
        }}
      >
        <Chip 
          size="small"
          variant="outlined"
          label={`Mode: ${config.qualityLabel}`}
          sx={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            '& .MuiChip-label': { fontSize: '0.7rem' }
          }}
        />
      </Box>
    </Box>
  );
};

export default ColVisualization3D;
