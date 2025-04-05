import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import PerformanceOptimizer from '../../services/PerformanceOptimizer';
import SkeletonLoader from '../common/SkeletonLoader';
import ErrorDisplay from '../common/ErrorDisplay';
import AnimatedTransition from '../common/AnimatedTransition';

/**
 * Col3DVisualization Component
 * Renders a 3D visualization of a cycling col with dynamic level of detail
 * based on device performance and progressive texture loading
 */
const Col3DVisualization = ({ 
  colId, 
  colData,
  width = '100%', 
  height = '400px',
  className = '' 
}) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const frameIdRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quality, setQuality] = useState('medium');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isHighDetail, setIsHighDetail] = useState(false);
  
  // Effect for setup
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Detect device performance and set initial quality
    const devicePerformance = PerformanceOptimizer.devicePerformance;
    setQuality(devicePerformance);
    
    try {
      initScene();
      setLoading(false);
    } catch (err) {
      console.error('Error initializing 3D scene:', err);
      setError(err);
      setLoading(false);
    }
    
    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Texture update handler for progressive loading
    const handleTextureUpdate = (event) => {
      const { url, texture } = event.detail;
      updateTexture(url, texture);
    };
    
    window.addEventListener('texture-updated', handleTextureUpdate);
    
    return () => {
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "SportsActivity",
          "name": "{col.name}",
          "description": "{col.description}",
          "url": "https://velo-altitude.com/col3dvisualization"
        }
      </script>
      <EnhancedMetaTags
        title="Détail du Col | Velo-Altitude"
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="article"
        imageUrl="/images/og-image.jpg"
      />
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('texture-updated', handleTextureUpdate);
      
      // Clean up resources
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
        
        if (rendererRef.current.forceContextLoss) {
          rendererRef.current.forceContextLoss();
        }
      }
      
      // Clean up scene resources
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object.geometry) {
            object.geometry.dispose();
          }
          
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => disposeMaterial(material));
            } else {
              disposeMaterial(object.material);
            }
          }
        });
      }
    };
  }, [colId]);
  
  // Effect to load col data and create terrain
  useEffect(() => {
    if (!colData || !sceneRef.current || loading || error) return;
    
    // Load terrain data and create mesh
    loadColTerrain(colData);
    
  }, [colData, loading, error]);
  
  // Helper to dispose material resources
  const disposeMaterial = (material) => {
    if (material.map) material.map.dispose();
    if (material.normalMap) material.normalMap.dispose();
    if (material.aoMap) material.aoMap.dispose();
    if (material.roughnessMap) material.roughnessMap.dispose();
    if (material.metalnessMap) material.metalnessMap.dispose();
    if (material.alphaMap) material.alphaMap.dispose();
    if (material.emissiveMap) material.emissiveMap.dispose();
    if (material.envMap) material.envMap.dispose();
    material.dispose();
  };
  
  // Scene initialization
  const initScene = () => {
    if (!containerRef.current) return;
    
    // Calculate container dimensions
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xE9ECEF);
    scene.fog = new THREE.Fog(0xE9ECEF, 500, 10000);
    sceneRef.current = scene;
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
    camera.position.set(0, 100, 500);
    cameraRef.current = camera;
    
    // Create renderer with appropriate settings for device
    const renderer = new THREE.WebGLRenderer({
      antialias: quality !== 'low',
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio > 2 ? 2 : window.devicePixelRatio);
    renderer.shadowMap.enabled = quality !== 'low';
    
    if (quality !== 'low') {
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputEncoding = THREE.sRGBEncoding;
    }
    
    // Clear existing canvas if any
    if (containerRef.current.childNodes.length > 0) {
      containerRef.current.removeChild(containerRef.current.childNodes[0]);
    }
    
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1000, 1000, 500);
    
    if (quality !== 'low') {
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = quality === 'high' ? 2048 : 1024;
      directionalLight.shadow.mapSize.height = quality === 'high' ? 2048 : 1024;
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 3000;
      
      const d = 1000;
      directionalLight.shadow.camera.left = -d;
      directionalLight.shadow.camera.right = d;
      directionalLight.shadow.camera.top = d;
      directionalLight.shadow.camera.bottom = -d;
    }
    
    scene.add(directionalLight);
    
    // Add OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 100;
    controls.maxDistance = 3000;
    controls.maxPolarAngle = Math.PI / 2;
    controlsRef.current = controls;
    
    // Start animation loop
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Add a temporary loading indicator grid
    const gridHelper = new THREE.GridHelper(1000, 20, 0x666666, 0x444444);
    scene.add(gridHelper);
    
    // Add a simple placeholder for the col
    const geometry = new THREE.BoxGeometry(200, 50, 200);
    const material = new THREE.MeshStandardMaterial({ color: 0x3A6EA5 });
    const placeholder = new THREE.Mesh(geometry, material);
    placeholder.position.y = 25;
    scene.add(placeholder);
  };
  
  // Load col terrain data and create 3D mesh
  const loadColTerrain = async (colData) => {
    if (!sceneRef.current) return;
    
    try {
      setLoadingProgress(10);
      
      // Get optimal detail level based on device performance
      const detailLevel = PerformanceOptimizer.get3DDetailLevel({ 
        viewDistance: colData.length * 10 
      });
      
      // Create geometry based on elevation data
      setLoadingProgress(30);
      
      // In a real implementation, you would use the actual elevation data
      // For this example, we'll create a simple heightmap
      const segmentsX = detailLevel.segments;
      const segmentsY = Math.floor(segmentsX * (colData.length / colData.width));
      
      const geometry = new THREE.PlaneGeometry(
        colData.width,
        colData.length,
        segmentsX,
        segmentsY
      );
      
      // Apply height modifications (in a real app, use actual elevation data)
      const vertices = geometry.attributes.position;
      
      for (let i = 0; i < vertices.count; i++) {
        const x = vertices.getX(i);
        const y = vertices.getY(i);
        
        // Create a simple mountain-like shape
        // In a real app, use actual elevation data from colData
        const distance = Math.sqrt(x * x + y * y);
        const height = Math.sin(distance * 0.01) * 50 + Math.cos(x * 0.02) * 30 + Math.sin(y * 0.02) * 30;
        
        vertices.setZ(i, height);
      }
      
      geometry.computeVertexNormals();
      
      // Load textures progressively
      setLoadingProgress(50);
      const basePath = `/assets/cols/${colId}`;
      
      // Load low-res texture first
      const textureUrl = `${basePath}_terrain`;
      const texture = await PerformanceOptimizer.loadTexture(`${textureUrl}_low.jpg`, 10);
      
      // Load high-res texture in background if on medium/high perf devices
      if (quality !== 'low') {
        PerformanceOptimizer.loadTexture(`${textureUrl}.jpg`, 5);
      }
      
      // Create material
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.FrontSide
      });
      
      // Create mesh
      const terrain = new THREE.Mesh(geometry, material);
      terrain.rotation.x = -Math.PI / 2;
      terrain.receiveShadow = quality !== 'low';
      terrain.castShadow = quality === 'high';
      
      // Remove placeholder objects
      sceneRef.current.children.forEach(child => {
        if (child instanceof THREE.GridHelper || child instanceof THREE.Mesh) {
          sceneRef.current.remove(child);
        }
      });
      
      sceneRef.current.add(terrain);
      
      // Add route markers
      addRouteMarkers(colData, terrain);
      
      // Position camera for a good view of the col
      if (cameraRef.current) {
        cameraRef.current.position.set(
          colData.width / 2, 
          Math.max(colData.maxElevation, 100) * 2, 
          colData.length / 2
        );
        
        cameraRef.current.lookAt(
          colData.width / 2,
          0,
          colData.length / 2
        );
        
        if (controlsRef.current) {
          controlsRef.current.target.set(
            colData.width / 2,
            0,
            colData.length / 2
          );
        }
      }
      
      setLoadingProgress(100);
      setIsHighDetail(quality !== 'low');
      
    } catch (err) {
      console.error('Error loading col terrain data:', err);
      setError(err);
    }
  };
  
  // Add markers for important points along the route
import EnhancedMetaTags from '../common/EnhancedMetaTags';
  const addRouteMarkers = (colData, terrain) => {
    if (!sceneRef.current) return;
    
    // Add start marker
    const startMarker = createMarker(0x4CAF50);
    startMarker.position.set(0, 5, 0);
    sceneRef.current.add(startMarker);
    
    // Add summit marker
    const summitMarker = createMarker(0xFF6B35);
    summitMarker.position.set(colData.width, colData.maxElevation + 5, colData.length / 2);
    sceneRef.current.add(summitMarker);
    
    // Add distance markers every km
    for (let i = 1; i < colData.length; i++) {
      if (i % 1000 === 0) {
        const kmMarker = createMarker(0x1F497D, 0.5);
        kmMarker.position.set(i / colData.length * colData.width, 3, colData.length / 2);
        sceneRef.current.add(kmMarker);
      }
    }
  };
  
  // Helper to create marker objects
  const createMarker = (color, scale = 1) => {
    const geometry = new THREE.CylinderGeometry(0, 5 * scale, 10 * scale, 4);
    const material = new THREE.MeshStandardMaterial({ color });
    const marker = new THREE.Mesh(geometry, material);
    marker.castShadow = quality !== 'low';
    return marker;
  };
  
  // Update texture when high-res version is loaded
  const updateTexture = (url, texture) => {
    if (!sceneRef.current) return;
    
    sceneRef.current.traverse((object) => {
      if (object.material && object.material.map) {
        if (object.material.map.url === url.replace('_low', '')) {
          object.material.map = texture;
          object.material.needsUpdate = true;
          setIsHighDetail(true);
        }
      }
    });
  };
  
  // Handle quality toggle
  const toggleQuality = () => {
    // Only allow toggling on medium/high devices
    if (PerformanceOptimizer.devicePerformance === 'low') return;
    
    const newQuality = quality === 'high' ? 'medium' : 'high';
    setQuality(newQuality);
    
    // Update renderer settings
    if (rendererRef.current) {
      if (newQuality === 'high') {
        rendererRef.current.shadowMap.type = THREE.PCFSoftShadowMap;
        rendererRef.current.outputEncoding = THREE.sRGBEncoding;
      } else {
        rendererRef.current.shadowMap.type = THREE.BasicShadowMap;
      }
    }
    
    // Reload scene with new quality settings
    if (colData) {
      loadColTerrain(colData);
    }
  };
  
  // Handle retry on error
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    
    try {
      initScene();
      if (colData) {
        loadColTerrain(colData);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error during retry:', err);
      setError(err);
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className={`col-3d-visualization-container ${className}`} style={{ width, height }}>
        <SkeletonLoader type="col-detail" height={height} />
        {loadingProgress > 0 && (
          <div className="loading-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <div className="progress-text">
              Chargement {loadingProgress}%
            </div>
          </div>
        )}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`col-3d-visualization-container ${className}`} style={{ width, height }}>
        <ErrorDisplay
          message="Erreur lors du chargement de la visualisation 3D"
          error={error}
          retry={handleRetry}
        />
      </div>
    );
  }
  
  return (
    <AnimatedTransition type="fade-up">
      <div 
        className={`col-3d-visualization-container ${className}`} 
        style={{ width, height, position: 'relative' }}
      >
        <div 
          ref={containerRef} 
          className="col-3d-visualization" 
          style={{ width: '100%', height: '100%' }}
        />
        
        {PerformanceOptimizer.devicePerformance !== 'low' && (
          <div 
            className="quality-toggle" 
            style={{ 
              position: 'absolute', 
              bottom: '10px', 
              right: '10px',
              background: 'rgba(255,255,255,0.7)',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10
            }}
            onClick={toggleQuality}
          >
            <span style={{ 
              width: '10px', 
              height: '10px', 
              borderRadius: '50%', 
              backgroundColor: isHighDetail ? '#4CAF50' : '#ADB5BD',
              display: 'inline-block',
              marginRight: '6px'
            }} />
            Qualité: {isHighDetail ? 'Haute' : 'Normale'}
          </div>
        )}
      </div>
    </AnimatedTransition>
  );
};

Col3DVisualization.propTypes = {
  colId: PropTypes.string.isRequired,
  colData: PropTypes.shape({
    width: PropTypes.number.isRequired,
    length: PropTypes.number.isRequired,
    maxElevation: PropTypes.number.isRequired,
    // Other col properties
  }),
  width: PropTypes.string,
  height: PropTypes.string,
  className: PropTypes.string
};

export default Col3DVisualization;
