import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { TextureLoader } from 'three/src/loaders/TextureLoader';
import EnhancedMetaTags from '../common/EnhancedMetaTags';
import { ErrorBoundary } from 'react-error-boundary';
import styles from './EnhancedColVisualization3D.module.css';

// Type definitions as specified
interface ViewportSize {
  width: number;
  height: number;
}

interface InteractionMode {
  rotate: boolean;
  pan: boolean;
  zoom: boolean;
}

interface ElevationPoint {
  lat: number;
  lng: number;
  elevation: number;
  gradient?: number;
}

interface SurfaceTypes {
  dominant: string;
  secondary?: string;
  percentages?: {
    [key: string]: number;
  };
}

interface PointOfInterestData {
  x: number;
  z: number;
  elevation?: number;
  name?: string;
  type?: string;
}

interface ElevationData {
  heights: number[][];
  width: number;
  length?: number;
  scale?: number;
}

interface Col3DVisualizationProps {
  elevationData: ElevationData;
  viewportDimensions: ViewportSize;
  renderQuality: '3d' | '2d';
  interactionMode: InteractionMode;
  passId?: string;
  surfaceTypes?: SurfaceTypes;
  pointsOfInterest?: PointOfInterestData[];
}

interface TerrainProps {
  elevationData: ElevationData;
  surfaceTypes?: SurfaceTypes;
  renderQuality: '3d' | '2d';
}

interface PointOfInterestProps {
  position: [number, number, number];
  label: string;
  type: string;
}

// FallbackComponent for Error Boundary
const ErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({ 
  error, 
  resetErrorBoundary 
}) => {
  return (
    <div className={styles.colVisualizationError}>
      <h3>Something went wrong with the 3D visualization:</h3>
      <pre>{error.message}</pre>
      <button
        onClick={resetErrorBoundary}
        className={styles.errorButton}
      >
        Try again
      </button>
    </div>
  );
};

// Optimization for large elevation datasets
const useVirtualizedData = (data: ElevationData, quality: '3d' | '2d'): ElevationData => {
  return React.useMemo(() => {
    if (!data || !data.heights || !data.width) return data;
    
    // For 2D rendering, reduce the data resolution
    if (quality === '2d') {
      const samplingRate = Math.max(1, Math.floor(data.heights.length / 50));
      const sampledHeights = data.heights.filter((_, i) => i % samplingRate === 0)
        .map(row => row.filter((_, j) => j % samplingRate === 0));
      
      return {
        ...data,
        heights: sampledHeights,
        width: Math.ceil(data.width / samplingRate)
      };
    }
    
    return data;
  }, [data, quality]);
};

// Terrain component with WebGL optimization
const Terrain: React.FC<TerrainProps> = React.memo(({ elevationData, surfaceTypes, renderQuality }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { gl } = useThree();
  
  // WebGL context management
  useEffect(() => {
    // Ensure proper disposal of WebGL contexts
    return () => {
      if (meshRef.current) {
        const geometry = meshRef.current.geometry;
        geometry.dispose();
      }
    };
  }, []);
  
  // Optimize geometry creation based on renderQuality
  useEffect(() => {
    if (!meshRef.current || !elevationData) return;
    
    try {
      // Validation of elevation data
      if (!elevationData.heights || !Array.isArray(elevationData.heights) || 
          !elevationData.width || !elevationData.heights.length) {
        setError('Invalid or missing elevation data');
        return;
      }
      
      const geometry = meshRef.current.geometry;
      const positionAttribute = geometry.getAttribute('position');
      
      // Apply elevation data to geometry
      for (let i = 0; i < positionAttribute.count; i++) {
        const x = Math.floor(i % elevationData.width);
        const z = Math.floor(i / elevationData.width);
        
        if (elevationData.heights[z] && typeof elevationData.heights[z][x] === 'number') {
          positionAttribute.setY(i, elevationData.heights[z][x] * 0.1); // Adjustable scale
        }
      }
      
      positionAttribute.needsUpdate = true;
      geometry.computeVertexNormals();
      setIsLoading(false);
    } catch (err) {
      console.error('Error creating 3D terrain:', err);
      setError('Error generating terrain');
    }
  }, [elevationData]);
  
  // Safe texture loading with error handling
  const textureUrls = [
    '/textures/asphalt.jpg',
    '/textures/gravel.jpg',
    '/textures/dirt.jpg'
  ];
  
  const textures = useLoader(TextureLoader, textureUrls, 
    undefined,
    (error) => {
      console.error('Error loading textures:', error);
      setError('Error loading textures');
    }
  );
  
  // Destructure textures
  const [asphaltTexture, gravelTexture, dirtTexture] = textures;
  
  // Configure textures
  useEffect(() => {
    textures.forEach(texture => {
      if (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);
      }
    });
    
    // Clean up textures on unmount
    return () => {
      textures.forEach(texture => {
        if (texture) texture.dispose();
      });
    };
  }, [textures]);
  
  // Determine texture based on surface type, with fallback
  const texture = !surfaceTypes ? dirtTexture :
                 surfaceTypes.dominant === 'asphalt' ? asphaltTexture :
                 surfaceTypes.dominant === 'gravel' ? gravelTexture : 
                 dirtTexture;
  
  // Display error if loading failed
  if (error) {
    return (
      <>
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "SportsActivity",
              "name": "Col Visualization",
              "description": "Interactive 3D visualization of cycling cols",
              "url": "https://velo-altitude.com/colvisualization3d"
            }
          `}
        </script>
        <Text position={[0, 0, 0]} fontSize={0.5} color="red">
          {error}
        </Text>
      </>
    );
  }
  
  // Quality-based geometry parameters
  const detailLevel = renderQuality === '3d' ? [100, 100] : [50, 50];
  
  return (
    <mesh 
      ref={meshRef} 
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry 
        args={[
          elevationData.width || 10,
          elevationData.length || 10,
          (elevationData.heights[0]?.length || 50) - 1,
          (elevationData.heights.length || 50) - 1
        ]} 
      />
      <meshStandardMaterial 
        map={texture}
        displacementMap={renderQuality === '3d' ? texture : undefined}
        displacementScale={renderQuality === '3d' ? 0.1 : 0}
        displacementBias={0}
        roughness={0.8}
        metalness={0.2}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for React.memo optimization
  if (!prevProps.elevationData || !nextProps.elevationData) return false;
  
  // Check if surface types changed
  if (
    (prevProps.surfaceTypes?.dominant !== nextProps.surfaceTypes?.dominant) ||
    (prevProps.renderQuality !== nextProps.renderQuality)
  ) {
    return false;
  }
  
  // If data dimensions changed, re-render
  if (
    prevProps.elevationData.width !== nextProps.elevationData.width ||
    prevProps.elevationData.heights.length !== nextProps.elevationData.heights.length
  ) {
    return false;
  }
  
  // Deep comparison would be too expensive for large datasets
  // Instead, we assume if dimensions are the same, we can skip render
  // This is a trade-off between accuracy and performance
  return true;
});

// Point of Interest component
const PointOfInterest: React.FC<PointOfInterestProps> = React.memo(({ position, label, type }) => {
  const color = 
    type === 'restaurant' ? 'orange' :
    type === 'viewpoint' ? 'lightblue' :
    type === 'monument' ? 'gold' :
    'white';
  
  return (
    <group position={position}>
      <mesh position={[0, 0.25, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text
        position={[0, 0.5, 0]}
        fontSize={0.15}
        color="#ffffff"
        // Move background and padding to material props
        material={
          new THREE.MeshBasicMaterial({
            color: '#000000',
            transparent: true,
            opacity: 0.7,
          })
        }
        outlineWidth={0.01}
        outlineColor="#000000"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}, (prevProps, nextProps) => {
  // Only re-render if position or label changed
  return (
    prevProps.position[0] === nextProps.position[0] &&
    prevProps.position[1] === nextProps.position[1] &&
    prevProps.position[2] === nextProps.position[2] &&
    prevProps.label === nextProps.label &&
    prevProps.type === nextProps.type
  );
});

// Main component with performance optimizations
export const EnhancedColVisualization3D: React.FC<Col3DVisualizationProps> = React.memo(
  ({ elevationData, viewportDimensions, renderQuality, interactionMode, passId, surfaceTypes, pointsOfInterest }) => {
    // States
    const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([0, 5, 10]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    // Optimize data for rendering
    const optimizedData = useVirtualizedData(elevationData, renderQuality);
    
    // Validate input data
    useEffect(() => {
      setIsLoading(true);
      
      try {
        // Check elevation data
        if (!elevationData || !elevationData.heights || !elevationData.width) {
          setError('Missing or invalid elevation data');
          setIsLoading(false);
          return;
        }
        
        // Check points of interest
        if (pointsOfInterest && (!Array.isArray(pointsOfInterest) || 
            pointsOfInterest.some(poi => typeof poi.x !== 'number' || typeof poi.z !== 'number'))) {
          console.warn('Some points of interest have invalid format');
        }
        
        setError(null);
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing 3D visualization:', err);
        setError('Visualization initialization error');
        setIsLoading(false);
      }
    }, [elevationData, pointsOfInterest]);
    
    // Memoized view change handler
    const handleViewChange = useCallback((view: string) => {
      switch(view) {
        case 'top':
          setCameraPosition([0, 10, 0]);
          break;
        case 'side':
          setCameraPosition([10, 5, 0]);
          break;
        case 'front':
          setCameraPosition([0, 5, 10]);
          break;
        case 'default':
        default:
          setCameraPosition([5, 5, 5]);
      }
    }, []);
    
    // Handle errors
    if (error) {
      return (
        <div className={styles.colVisualizationError}>
          <p>{error}</p>
        </div>
      );
    }
    
    return (
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => {
          // Reset any state that might have caused the error
          setIsLoading(true);
          setError(null);
        }}
      >
        <main 
          className={styles.colVisualizationContainer} 
        >
          <div className={styles.visualizationControls}>
            <button onClick={() => handleViewChange('top')}>Top View</button>
            <button onClick={() => handleViewChange('side')}>Side View</button>
            <button onClick={() => handleViewChange('front')}>Front View</button>
            <button onClick={() => handleViewChange('default')}>Default View</button>
          </div>
          
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <p>Loading 3D visualization...</p>
            </div>
          ) : (
            <Canvas 
              camera={{ position: cameraPosition, fov: 45 }}
              className={styles.canvasContainer} 
              dpr={renderQuality === '3d' ? [1, 2] : [1, 1]} // Optimize pixel ratio based on quality
            >
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
              <directionalLight position={[-10, 10, -5]} intensity={0.5} color="#b9d5ff" />
              
              {/* 3D Terrain */}
              <Terrain 
                elevationData={optimizedData} 
                surfaceTypes={surfaceTypes} 
                renderQuality={renderQuality}
              />
              
              {/* Points of Interest */}
              {pointsOfInterest?.filter(poi => 
                poi && typeof poi.x === 'number' && typeof poi.z === 'number'
              ).map((poi, index) => (
                <PointOfInterest 
                  key={`poi-${index}`}
                  position={[
                    poi.x, 
                    (poi.elevation || 0) * 0.1 + 0.2, 
                    poi.z
                  ]} 
                  label={poi.name || `Point ${index + 1}`}
                  type={poi.type || 'default'}
                />
              ))}
              
              {/* Camera Controls */}
              <OrbitControls 
                enableZoom={interactionMode.zoom} 
                enablePan={interactionMode.pan} 
                enableRotate={interactionMode.rotate}
                minDistance={1}
                maxDistance={20}
              />
            </Canvas>
          )}
        </main>
      </ErrorBoundary>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for React.memo
    // Only re-render if critical props change
    if (
      prevProps.renderQuality !== nextProps.renderQuality ||
      prevProps.viewportDimensions.width !== nextProps.viewportDimensions.width ||
      prevProps.viewportDimensions.height !== nextProps.viewportDimensions.height ||
      prevProps.interactionMode.rotate !== nextProps.interactionMode.rotate ||
      prevProps.interactionMode.pan !== nextProps.interactionMode.pan ||
      prevProps.interactionMode.zoom !== nextProps.interactionMode.zoom
    ) {
      return false;
    }
    
    // For complex data structures, we employ a shallow comparison strategy
    // to balance performance and correctness
    if (prevProps.elevationData !== nextProps.elevationData) {
      return false;
    }
    
    // Don't re-render for minor changes in points of interest
    // unless they are completely different arrays
    if (prevProps.pointsOfInterest !== nextProps.pointsOfInterest) {
      // If length changed, definitely re-render
      if (
        !prevProps.pointsOfInterest || 
        !nextProps.pointsOfInterest ||
        prevProps.pointsOfInterest.length !== nextProps.pointsOfInterest.length
      ) {
        return false;
      }
    }
    
    return true;
  }
);

export default EnhancedColVisualization3D;
