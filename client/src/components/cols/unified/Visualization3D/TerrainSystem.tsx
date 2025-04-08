import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { QualityLevel } from './PerformanceManager';

interface TerrainSystemProps {
  data: TerrainData;
  quality: QualityLevel;
  highlighted?: boolean;
  color?: {
    road?: string;
    terrain?: string;
    accent?: string;
  };
}

export interface TerrainData {
  points: TerrainPoint[];
  width?: number;
  length?: number;
  maxElevation?: number;
  pointsOfInterest?: PointOfInterest[];
}

export interface TerrainPoint {
  x: number;
  y: number;
  z: number;
  gradient?: number;
}

export interface PointOfInterest {
  name: string;
  type: 'viewpoint' | 'rest' | 'summit' | 'other';
  position: TerrainPoint;
  description?: string;
}

/**
 * Hook pour générer un terrain 3D à partir des données de points
 */
export const useTerrainSystem = (terrainData: TerrainData, quality: QualityLevel = 'medium') => {
  // Configuration de qualité
  const qualitySettings = useMemo(() => {
    const settings = {
      low: {
        segmentCount: 64,
        detailLevel: 1,
        textureSize: 512,
        shadows: false,
        reflections: false
      },
      medium: {
        segmentCount: 128,
        detailLevel: 2,
        textureSize: 1024,
        shadows: true,
        reflections: false
      },
      high: {
        segmentCount: 256,
        detailLevel: 4,
        textureSize: 2048,
        shadows: true,
        reflections: true
      },
      ultra: {
        segmentCount: 512,
        detailLevel: 8,
        textureSize: 4096,
        shadows: true,
        reflections: true
      }
    };
    
    return settings[quality];
  }, [quality]);
  
  // Génération de la géométrie du terrain
  const terrainGeometry = useMemo(() => {
    if (!terrainData || !terrainData.points || terrainData.points.length === 0) {
      return null;
    }
    
    // Dimensions du terrain
    const width = terrainData.width || 10;
    const length = terrainData.length || Math.max(...terrainData.points.map(p => p.x)) + 2;
    const maxHeight = terrainData.maxElevation || Math.max(...terrainData.points.map(p => p.y)) + 1;
    
    // Création du PlaneGeometry pour le terrain
    const geometry = new THREE.PlaneGeometry(
      width,
      length,
      qualitySettings.segmentCount / 4,
      qualitySettings.segmentCount
    );
    
    // On transforme le plan pour qu'il soit horizontal
    geometry.rotateX(-Math.PI / 2);
    
    // On déplace le centre du terrain pour l'alignement
    geometry.translate(width / 2, 0, length / 2);
    
    // On crée un heightmap à partir des points
    const vertices = geometry.attributes.position;
    const heightMap = new Float32Array(vertices.count);
    
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i);
      const z = vertices.getZ(i);
      
      // Recherche des points les plus proches dans les données du terrain
      const nearestPoints = terrainData.points
        .map(p => ({
          point: p,
          distance: Math.sqrt(Math.pow(p.x - z, 2) + Math.pow(p.z - x, 2))
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 4);
      
      // Interpolation de la hauteur en fonction des points les plus proches
      let height = 0;
      let totalWeight = 0;
      
      for (const { point, distance } of nearestPoints) {
        const weight = 1 / (distance + 0.001);
        height += point.y * weight;
        totalWeight += weight;
      }
      
      height = height / totalWeight;
      
      // Mise à jour de la hauteur du vertex
      vertices.setY(i, height);
      heightMap[i] = height / maxHeight; // Normalisation pour la texture
    }
    
    // Recalcul des normales pour un meilleur éclairage
    geometry.computeVertexNormals();
    
    return {
      geometry,
      heightMap,
      dimensions: { width, length, maxHeight }
    };
  }, [terrainData, qualitySettings]);
  
  // Génération de la route
  const roadGeometry = useMemo(() => {
    if (!terrainData || !terrainData.points || terrainData.points.length === 0) {
      return null;
    }
    
    // Création d'une courbe pour la route
    const points = terrainData.points.map(point => 
      new THREE.Vector3(point.z || 0, point.y + 0.05, point.x)
    );
    const curve = new THREE.CatmullRomCurve3(points);
    
    // Création de la géométrie de tube pour la route
    const tubeGeometry = new THREE.TubeGeometry(
      curve,
      Math.min(terrainData.points.length * 2, qualitySettings.segmentCount),
      0.15,  // rayon du tube
      8,     // segments radiaux
      false  // fermé
    );
    
    return tubeGeometry;
  }, [terrainData, qualitySettings]);
  
  return {
    terrainGeometry,
    roadGeometry,
    settings: qualitySettings
  };
};

/**
 * Composant pour le rendu du terrain 3D
 */
export const TerrainSystem: React.FC<TerrainSystemProps> = ({
  data,
  quality = 'medium',
  highlighted = false,
  color = {
    road: '#444444',
    terrain: '#4b7f52',
    accent: '#ff6b6b'
  }
}) => {
  const terrainMeshRef = useRef<THREE.Mesh>(null);
  const roadMeshRef = useRef<THREE.Mesh>(null);
  
  // Utilisation du hook pour générer les géométries
  const { terrainGeometry, roadGeometry, settings } = useTerrainSystem(data, quality);
  
  // Animation d'effet de mise en évidence
  useEffect(() => {
    if (highlighted && roadMeshRef.current) {
      const material = roadMeshRef.current.material as THREE.MeshStandardMaterial;
      material.color.set(color.accent || '#ff6b6b');
      material.emissive.set('#441111');
      material.emissiveIntensity = 0.3;
    } else if (roadMeshRef.current) {
      const material = roadMeshRef.current.material as THREE.MeshStandardMaterial;
      material.color.set(color.road || '#444444');
      material.emissive.set('#000000');
      material.emissiveIntensity = 0;
    }
  }, [highlighted, color]);
  
  // Animation subtile du terrain
  useFrame(({ clock }) => {
    if (terrainMeshRef.current && highlighted) {
      const time = clock.getElapsedTime();
      terrainMeshRef.current.rotation.z = Math.sin(time * 0.2) * 0.01;
    } else if (terrainMeshRef.current) {
      terrainMeshRef.current.rotation.z = 0;
    }
  });
  
  if (!terrainGeometry || !roadGeometry) {
    return null;
  }

  return (
    <group>
      {/* Terrain */}
      <mesh 
        ref={terrainMeshRef}
        geometry={terrainGeometry.geometry}
        receiveShadow={settings.shadows}
      >
        <meshStandardMaterial 
          color={color.terrain || '#4b7f52'}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Route */}
      <mesh 
        ref={roadMeshRef}
        geometry={roadGeometry}
        position={[0, 0.01, 0]} 
        castShadow={settings.shadows}
        receiveShadow={settings.shadows}
      >
        <meshStandardMaterial 
          color={highlighted ? color.accent || '#ff6b6b' : color.road || '#444444'} 
          roughness={0.6}
          metalness={0.2}
          emissive={highlighted ? '#441111' : '#000000'}
          emissiveIntensity={highlighted ? 0.3 : 0}
        />
      </mesh>
      
      {/* Points d'intérêt */}
      {data.pointsOfInterest && data.pointsOfInterest.map((poi, index) => (
        <group 
          key={index}
          position={[poi.position.z || 0, poi.position.y + 0.3, poi.position.x]}
        >
          <mesh>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial 
              color={poi.type === 'summit' ? '#E53935' : poi.type === 'viewpoint' ? '#1E88E5' : '#43A047'} 
              emissive={poi.type === 'summit' ? '#441111' : poi.type === 'viewpoint' ? '#112244' : '#114411'}
              emissiveIntensity={0.3}
            />
          </mesh>
          
          {/* Étiquette du point d'intérêt - sera remplacé par un composant Text de drei */}
          <group position={[0, 0.3, 0]}>
            {/* Text sera implémenté par le composant Text de @react-three/drei */}
          </group>
        </group>
      ))}
    </group>
  );
};

export default TerrainSystem;
