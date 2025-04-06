import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, useTexture, Stats, Environment, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { Box, CircularProgress, Paper, Typography, FormControlLabel, Switch, Slider, Select, MenuItem, FormControl, InputLabel, IconButton, Tooltip } from '@mui/material';
import { Col, RoutePoint, PointOfInterest } from '../../types';
import { APIOrchestrator } from '../../api/orchestration';
import { TextureManager, TextureQuality } from '../../utils/textures/TextureManager';
import { getDevicePerformanceLevel, getOptimalRenderingSettings, DevicePerformanceLevel } from '../../utils/deviceDetection';
import SettingsIcon from '@mui/icons-material/Settings';
import SpeedIcon from '@mui/icons-material/Speed';
import CloseIcon from '@mui/icons-material/Close';

interface ElevationViewer3DProps {
  colId: string;
  height?: number;
}

const ElevationViewer3D: React.FC<ElevationViewer3DProps> = ({ 
  colId,
  height = 500
}) => {
  const [col, setCol] = useState<Col | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [devicePerformance, setDevicePerformance] = useState<DevicePerformanceLevel>('medium');
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [quality, setQuality] = useState<TextureQuality>('medium');
  const [renderSettings, setRenderSettings] = useState({
    enableShadows: true,
    enableEffects: true,
    enableSky: true,
    terrainDetail: 1,
    pointsDetail: 1
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Détecter les performances de l'appareil
  useEffect(() => {
    const detectDeviceCapabilities = async () => {
      try {
        const performanceLevel = await getDevicePerformanceLevel();
        setDevicePerformance(performanceLevel);
        
        // Définir les paramètres de qualité par défaut en fonction des performances
        const settings = await getOptimalRenderingSettings();
        setQuality(settings.textureQuality);
        
        setRenderSettings({
          enableShadows: performanceLevel !== 'low',
          enableEffects: settings.useEffects,
          enableSky: performanceLevel !== 'low',
          terrainDetail: performanceLevel === 'high' ? 1 : 0.7,
          pointsDetail: performanceLevel === 'high' ? 1 : 0.5
        });
        
        console.log(`Performance de l'appareil détectée: ${performanceLevel}`);
      } catch (error) {
        console.error("Erreur lors de la détection des capacités de l'appareil:", error);
      }
    };

    detectDeviceCapabilities();
  }, []);

  // Initialiser le gestionnaire de textures
  useEffect(() => {
    const textureManager = TextureManager.getInstance();
    
    // Précharger les textures nécessaires
    const preloadTextures = async () => {
      try {
        await textureManager.preloadTextures(['terrain', 'rock', 'snow', 'grass'], quality);
        console.log('Textures préchargées avec succès');
      } catch (error) {
        console.error('Erreur lors du préchargement des textures:', error);
      }
    };
    
    preloadTextures();
    
    // Nettoyage lors du démontage
    return () => {
      // Optionnel: libérer les textures si elles ne sont plus nécessaires
      // textureManager.disposeAllTextures();
    };
  }, [quality]);

  useEffect(() => {
    const fetchColData = async () => {
      setLoading(true);
      try {
        const apiOrchestrator = new APIOrchestrator();
        const colData = await apiOrchestrator.getColById(colId);
        setCol(colData);
      } catch (err) {
        setError(err as Error);
        console.error('Erreur lors du chargement des données du col:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchColData();
  }, [colId]);

  // Optimisation: sample les points du profil en fonction des performances de l'appareil
  const optimizedRouteProfile = useMemo(() => {
    if (!col || !col.routeProfile) return [];
    
    const profile = [...col.routeProfile];
    
    // Adapter le nombre de points en fonction des performances
    const targetPoints = devicePerformance === 'high' 
      ? profile.length 
      : devicePerformance === 'medium' 
        ? Math.floor(profile.length * 0.7) 
        : Math.floor(profile.length * 0.4);
    
    // Si on a déjà moins de points que la cible, pas besoin de réduire
    if (profile.length <= targetPoints) return profile;
    
    // Calculer l'intervalle d'échantillonnage
    const samplingInterval = Math.max(1, Math.floor(profile.length / targetPoints));
    
    // Échantillonner les points
    return profile.filter((_, index) => index % samplingInterval === 0);
  }, [col, devicePerformance]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={height}>
        <CircularProgress />
        <Typography variant="body1" ml={2}>
          Chargement de la visualisation 3D...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height={height}
        color="error.main"
      >
        <Typography variant="body1">
          Erreur lors du chargement des données: {error.message}
        </Typography>
      </Box>
    );
  }

  if (!col || !col.routeProfile) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height={height}
      >
        <Typography variant="body1">
          Aucune donnée de profil disponible pour ce col.
        </Typography>
      </Box>
    );
  }

  const handleQualityChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setQuality(event.target.value as TextureQuality);
  };

  return (
    <Paper elevation={2} sx={{ height, width: '100%', overflow: 'hidden', position: 'relative' }}>
      {/* Panneau des paramètres de visualisation */}
      {showSettings && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 300,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            zIndex: 10,
            p: 2,
            borderRadius: 2,
            boxShadow: 3
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Paramètres d'affichage</Typography>
            <IconButton size="small" onClick={() => setShowSettings(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <FormControl fullWidth margin="normal" size="small">
            <InputLabel>Qualité des textures</InputLabel>
            <Select
              value={quality}
              onChange={handleQualityChange}
              label="Qualité des textures"
            >
              <MenuItem value="low">Basse</MenuItem>
              <MenuItem value="medium">Moyenne</MenuItem>
              <MenuItem value="high">Haute</MenuItem>
            </Select>
          </FormControl>
          
          <Typography variant="body2" gutterBottom>Détail du terrain</Typography>
          <Slider
            value={renderSettings.terrainDetail}
            min={0.2}
            max={1}
            step={0.1}
            onChange={(_, value) => setRenderSettings(prev => ({ ...prev, terrainDetail: value as number }))}
            valueLabelDisplay="auto"
            valueLabelFormat={value => `${Math.round(value * 100)}%`}
            size="small"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={renderSettings.enableShadows}
                onChange={(e) => setRenderSettings(prev => ({ ...prev, enableShadows: e.target.checked }))}
                size="small"
              />
            }
            label="Ombres"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={renderSettings.enableEffects}
                onChange={(e) => setRenderSettings(prev => ({ ...prev, enableEffects: e.target.checked }))}
                size="small"
              />
            }
            label="Effets visuels"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={renderSettings.enableSky}
                onChange={(e) => setRenderSettings(prev => ({ ...prev, enableSky: e.target.checked }))}
                size="small"
              />
            }
            label="Ciel"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={showStats}
                onChange={(e) => setShowStats(e.target.checked)}
                size="small"
              />
            }
            label="Statistiques de performance"
          />
          
          <Box mt={2} p={1} bgcolor="primary.main" color="white" borderRadius={1}>
            <Typography variant="body2">
              Performance détectée: {devicePerformance === 'high' ? 'Élevée' : devicePerformance === 'medium' ? 'Moyenne' : 'Basse'}
            </Typography>
            <Typography variant="caption">
              Points affichés: {optimizedRouteProfile.length} / {col.routeProfile.length}
            </Typography>
          </Box>
        </Box>
      )}
      
      {/* Boutons de contrôle */}
      <Box position="absolute" top={10} right={10} zIndex={5}>
        <Tooltip title="Paramètres d'affichage">
          <IconButton 
            onClick={() => setShowSettings(!showSettings)}
            sx={{ 
              bgcolor: 'rgba(255, 255, 255, 0.7)',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' }
            }}
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      {/* Canvas Three.js */}
      <Canvas 
        ref={canvasRef} 
        shadows={renderSettings.enableShadows}
        gl={{ 
          antialias: devicePerformance !== 'low',
          powerPreference: 'high-performance',
          alpha: false,
          stencil: false,
          depth: true
        }}
        onCreated={({ gl }) => {
          // Initialiser TextureManager avec le renderer
          TextureManager.getInstance().initialize(gl);
        }}
      >
        {showStats && <Stats />}
        
        <ambientLight intensity={0.6} />
        <directionalLight
          castShadow={renderSettings.enableShadows}
          position={[10, 10, 5]}
          intensity={1.2}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        
        {renderSettings.enableSky && (
          <Sky 
            sunPosition={[100, 10, 100]} 
            distance={450000} 
            rayleigh={3} 
            turbidity={8}
          />
        )}
        
        <PerspectiveCamera makeDefault position={[0, 5, 15]} fov={50} />
        <OrbitControls 
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={50}
          target={[0, 2, 0]}
          maxPolarAngle={Math.PI / 2 - 0.1} // Empêche de passer sous le terrain
        />
        
        <ElevationModel 
          routeProfile={optimizedRouteProfile} 
          pointsOfInterest={col.pointsOfInterest || []}
          name={col.name}
          length={col.length}
          maxElevation={col.elevation}
          devicePerformance={devicePerformance}
          quality={quality}
          terrainDetail={renderSettings.terrainDetail}
          enableShadows={renderSettings.enableShadows}
          enableEffects={renderSettings.enableEffects}
        />
        
        <gridHelper args={[100, 20]} visible={renderSettings.enableEffects} />
        
        {renderSettings.enableEffects && (
          <Environment preset="sunset" background={false} />
        )}
      </Canvas>
      
      {/* Légende et instructions */}
      <Box
        position="absolute"
        bottom={10}
        left={10}
        bgcolor="rgba(0, 0, 0, 0.6)"
        color="white"
        p={1}
        borderRadius={1}
        fontSize="0.8rem"
      >
        <Typography variant="caption" display="block">
          Utiliser la souris pour faire pivoter | Molette pour zoomer | Clic droit pour déplacer
        </Typography>
      </Box>
    </Paper>
  );
};

interface ElevationModelProps {
  routeProfile: RoutePoint[];
  pointsOfInterest: PointOfInterest[];
  name: string;
  length: number;
  maxElevation: number;
  devicePerformance: DevicePerformanceLevel;
  quality: TextureQuality;
  terrainDetail: number;
  enableShadows: boolean;
  enableEffects: boolean;
}

const ElevationModel: React.FC<ElevationModelProps> = ({ 
  routeProfile, 
  pointsOfInterest,
  name,
  length,
  maxElevation,
  devicePerformance,
  quality,
  terrainDetail,
  enableShadows,
  enableEffects
}) => {
  const terrainRef = useRef<THREE.Mesh>(null);
  const poiRefs = useRef<(THREE.Mesh | null)[]>([]);
  const { viewport } = useThree();
  
  // Référence au TextureManager
  const textureManager = useMemo(() => TextureManager.getInstance(), []);
  
  // Charger les textures via le TextureManager
  const terrainTexture = useMemo(() => 
    textureManager.getTexture('terrain', quality, { repeat: [5, 5] }),
    [quality]
  );
  
  const rockTexture = useMemo(() => 
    textureManager.getTexture('rock', quality, { repeat: [3, 3] }),
    [quality]
  );
  
  const snowTexture = useMemo(() => 
    textureManager.getTexture('snow', quality, { repeat: [2, 2] }),
    [quality]
  );
  
  // Normaliser les données pour créer une représentation 3D
  const normalizeData = () => {
    // Trouver les valeurs min et max pour chaque dimension
    const minElevation = Math.min(...routeProfile.map(point => point.elevation));
    const maxDistance = Math.max(...routeProfile.map(point => point.distance));
    
    // Créer les points 3D pour la géométrie
    return routeProfile.map((point, index) => {
      // Normaliser la distance sur l'axe X (-10 à 10)
      const x = (point.distance / length) * 20 - 10;
      
      // Normaliser l'élévation sur l'axe Y (0 à 5)
      const y = ((point.elevation - minElevation) / (maxElevation - minElevation)) * 5;
      
      // Ajouter un peu de variation aléatoire pour l'axe Z
      const z = Math.sin(index * 0.2) * 0.5;
      
      return new THREE.Vector3(x, y, z);
    });
  };
  
  // Créer la courbe du profil d'élévation
  const createElevationPath = () => {
    const points = normalizeData();
    return new THREE.CatmullRomCurve3(points);
  };
  
  // Animation du temps pour les effets visuels
  const [time, setTime] = useState(0);
  useFrame((_, delta) => {
    if (enableEffects) {
      setTime(time => time + delta * 0.2);
      
      // Animation légère des points d'intérêt
      poiRefs.current.forEach((ref, i) => {
        if (ref) {
          ref.position.y += Math.sin(time + i) * 0.002;
          ref.rotation.y += 0.01;
        }
      });
    }
  });
  
  // Créer la géométrie du terrain
  const createTerrainGeometry = () => {
    // Adapter la complexité du terrain en fonction de la performance de l'appareil
    const widthSegments = Math.floor(32 * terrainDetail);
    const heightSegments = Math.floor(32 * terrainDetail);
    
    const geometry = new THREE.PlaneGeometry(40, 20, widthSegments, heightSegments);
    geometry.rotateX(-Math.PI / 2); // Rotation pour que le plan soit horizontal
    
    const { position } = geometry.attributes;
    const normalizedPoints = normalizeData();
    
    // Créer un tableau pour stocker la hauteur en chaque point
    const heightMap = new Array(position.count).fill(0);
    
    // Pour chaque point normalisé de la route
    for (let i = 0; i < normalizedPoints.length; i++) {
      const point = normalizedPoints[i];
      
      // Pour chaque vertex de la géométrie
      for (let j = 0; j < position.count; j++) {
        const x = position.getX(j);
        const z = position.getZ(j);
        
        // Calculer la distance entre le vertex et le point de route
        const dx = point.x - x;
        const dz = point.z - z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // Appliquer une influence basée sur la distance
        const influence = Math.max(0, 1 - distance / 5);
        
        // Ajouter l'influence à la hauteur actuelle
        if (influence > 0) {
          heightMap[j] = Math.max(heightMap[j], point.y * influence);
        }
      }
    }
    
    // Appliquer les hauteurs à la géométrie
    for (let i = 0; i < position.count; i++) {
      position.setY(i, heightMap[i]);
      
      // Ajouter des détails de terrain aléatoires pour plus de réalisme
      const x = position.getX(i);
      const z = position.getZ(i);
      
      // Variation de hauteur plus ou moins importante selon la qualité
      const detailLevel = terrainDetail;
      position.setY(
        i, 
        position.getY(i) + 
        Math.sin(x * 5) * 0.1 * detailLevel + 
        Math.cos(z * 5) * 0.1 * detailLevel
      );
    }
    
    geometry.computeVertexNormals();
    return geometry;
  };
  
  // Convertir les points d'intérêt en positions 3D
  const poiPositions = pointsOfInterest.map(poi => {
    const normalizedDistance = (poi.distance! / length) * 20 - 10;
    
    // Trouver la hauteur du terrain à cette position
    const closestRoutePoint = routeProfile.reduce((prev, curr) => {
      const prevDist = Math.abs(prev.distance - poi.distance!);
      const currDist = Math.abs(curr.distance - poi.distance!);
      return prevDist < currDist ? prev : curr;
    });
    
    const normalizedElevation = ((closestRoutePoint.elevation - Math.min(...routeProfile.map(p => p.elevation))) / 
      (maxElevation - Math.min(...routeProfile.map(p => p.elevation)))) * 5;
    
    return {
      ...poi,
      position: [normalizedDistance, normalizedElevation + 0.5, 0]
    };
  });
  
  // Couleurs pour les types de points d'intérêt
  const poiColors = {
    restaurant: '#FF5252',
    viewpoint: '#2196F3',
    landmark: '#FFC107',
    water: '#4CAF50',
    parking: '#9C27B0',
    other: '#607D8B'
  };
  
  // Obtenir la couleur en fonction du type de point d'intérêt
  const getPoiColor = (type: PointOfInterest['type']) => {
    return poiColors[type] || poiColors.other;
  };
  
  // Créer des étiquettes pour les altitudes importantes
  const elevationLabels = useMemo(() => {
    // Réduire le nombre d'étiquettes sur les appareils bas de gamme
    const step = devicePerformance === 'low' ? 4 : devicePerformance === 'medium' ? 2 : 1;
    
    return routeProfile
      .filter((_, index) => index % (5 * step) === 0) // Prendre un point tous les 5*step points
      .map(point => {
        const normalizedDistance = (point.distance / length) * 20 - 10;
        const normalizedElevation = ((point.elevation - Math.min(...routeProfile.map(p => p.elevation))) / 
          (maxElevation - Math.min(...routeProfile.map(p => p.elevation)))) * 5;
        
        return {
          position: [normalizedDistance, normalizedElevation + 0.3, 0],
          elevation: Math.round(point.elevation)
        };
      });
  }, [routeProfile, length, maxElevation, devicePerformance]);
  
  return (
    <>
      {/* Titre du col */}
      <Text
        position={[0, 8, 0]}
        fontSize={1.5}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.9}
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {name}
      </Text>
      
      {/* Terrain */}
      <mesh ref={terrainRef} receiveShadow={enableShadows}>
        <primitive object={createTerrainGeometry()} attach="geometry" />
        <meshStandardMaterial 
          map={terrainTexture}
          normalMap={rockTexture}
          normalScale={[0.1, 0.1]}
          displacementMap={devicePerformance !== 'low' ? snowTexture : undefined}
          displacementScale={0.3}
          roughness={0.8}
          metalness={0.2}
          envMapIntensity={0.8}
        />
      </mesh>
      
      {/* Route */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={new Float32Array(normalizeData().flatMap(p => [p.x, p.y + 0.05, p.z]))}
            count={normalizeData().length}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#FF4500" linewidth={5} />
      </line>
      
      {/* Points d'intérêt */}
      {poiPositions.map((poi, index) => (
        <group key={poi.id} position={poi.position as [number, number, number]}>
          <mesh 
            ref={el => (poiRefs.current[index] = el)} 
            castShadow={enableShadows}
          >
            <boxGeometry args={[0.4, 0.4, 0.4]} />
            <meshStandardMaterial 
              color={getPoiColor(poi.type)} 
              emissive={getPoiColor(poi.type)} 
              emissiveIntensity={0.5}
              roughness={0.3}
              metalness={0.7}
            />
          </mesh>
          <Text
            position={[0, 0.8, 0]}
            fontSize={0.35}
            color="#FFFFFF"
            anchorX="center"
            anchorY="middle"
            backgroundColor="#00000080"
            padding={0.1}
            maxWidth={3}
          >
            {poi.name}
          </Text>
        </group>
      ))}
      
      {/* Marqueurs de début et fin */}
      <mesh 
        position={[-10, normalizeData()[0]?.y || 0, 0]} 
        castShadow={enableShadows}
      >
        <cylinderGeometry args={[0.2, 0.2, 1, 16]} />
        <meshStandardMaterial color="#4CAF50" emissive="#4CAF50" emissiveIntensity={0.3} />
      </mesh>
      <Text
        position={[-10, (normalizeData()[0]?.y || 0) + 1, 0]}
        fontSize={0.4}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        Départ
      </Text>
      
      <mesh 
        position={[10, normalizeData()[normalizeData().length - 1]?.y || 0, 0]} 
        castShadow={enableShadows}
      >
        <cylinderGeometry args={[0.2, 0.2, 1, 16]} />
        <meshStandardMaterial color="#F44336" emissive="#F44336" emissiveIntensity={0.3} />
      </mesh>
      <Text
        position={[10, (normalizeData()[normalizeData().length - 1]?.y || 0) + 1, 0]}
        fontSize={0.4}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        Arrivée ({Math.round(length * 10) / 10} km)
      </Text>
      
      {/* Étiquettes d'altitude */}
      {devicePerformance !== 'low' && elevationLabels.map((label, index) => (
        <Text
          key={index}
          position={label.position as [number, number, number]}
          fontSize={0.3}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
          backgroundColor="#00000080"
          padding={0.05}
        >
          {label.elevation}m
        </Text>
      ))}
    </>
  );
};

export default ElevationViewer3D;
