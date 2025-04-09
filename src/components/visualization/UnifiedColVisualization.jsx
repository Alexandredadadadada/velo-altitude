import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { UnifiedColVisualization } from '../../services/visualization/UnifiedColVisualization';
import { 
  VISUALIZATION_TYPES, 
  QUALITY_LEVELS,
  DEFAULT_DEVICE_CONFIG,
  VISUALIZATION_STYLE 
} from '../../config/visualizationConfig';
import DeviceCapabilitiesDetector from '../../utils/DeviceCapabilitiesDetector';
import './UnifiedColVisualization.css';

// Importation conditionnelle de Three.js pour la visualisation 3D
// Chargé uniquement si nécessaire pour éviter d'alourdir le bundle
const ThreeModules = {
  THREE: null,
  OrbitControls: null
};

/**
 * Composant de visualisation unifié pour les cols
 * Combine les capacités 2D et 3D dans un seul composant avec adaptation automatique
 */
const ColVisualization = ({ 
  col, 
  visualizationType = 'auto',
  quality = 'auto',
  width = '100%',
  height = '400px',
  className = '',
  interactive = true,
  showStats = true,
  onVisualizationReady = () => {}
}) => {
  // Références et états
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deviceConfig, setDeviceConfig] = useState(null);
  const [activeVisualization, setActiveVisualization] = useState(null);
  const [visualData, setVisualData] = useState(null);
  const [is3DLoaded, setIs3DLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Service de visualisation
  const visualizationService = useRef(new UnifiedColVisualization());

  // Détection du type d'appareil et configuration initiale
  useEffect(() => {
    // Détecter les capacités de l'appareil et sa configuration
    const deviceCapabilities = DeviceCapabilitiesDetector.detect();
    const deviceType = deviceCapabilities.deviceType;
    
    console.log('Capacités de l\'appareil détectées:', deviceCapabilities);
    
    // Appliquer la configuration adaptée à l'appareil
    const config = DEFAULT_DEVICE_CONFIG[deviceType];
    setDeviceConfig(config);

    // Détermine le type de visualisation à utiliser
    const resolveVisualizationType = () => {
      // Si défini explicitement, utiliser ce type
      if (visualizationType !== 'auto') return visualizationType;
      
      // Si l'appareil a des capacités WebGL limitées, forcer la 2D
      if (!deviceCapabilities.webgl.supported || 
          (deviceCapabilities.gpu && deviceCapabilities.gpu.quality === QUALITY_LEVELS.LOW)) {
        return VISUALIZATION_TYPES.PROFILE_2D;
      }
      
      // Sinon, utiliser la configuration par défaut pour cet appareil
      return config.defaultVisualization;
    };

    setActiveVisualization(resolveVisualizationType());

    // Lancer un benchmark léger en arrière-plan si la qualité est en auto
    if (quality === 'auto' && deviceCapabilities.webgl.supported) {
      DeviceCapabilitiesDetector.runBenchmark(progress => {
        if (progress.status === 'complete') {
          console.log('Résultats du benchmark:', progress.results);
          // Ajuster la qualité si nécessaire
          if (progress.results.recommendedQuality !== config.quality) {
            const updatedConfig = {...config, quality: progress.results.recommendedQuality};
            setDeviceConfig(updatedConfig);
          }
          
          // Passer au type de visualisation recommandé si plus performant
          if (progress.results.recommendedVisualization !== activeVisualization) {
            setActiveVisualization(progress.results.recommendedVisualization);
          }
        }
      });
    }

    // Événement de redimensionnement
    const handleResize = () => {
      // Mettre à jour l'orientation dans le détecteur
      DeviceCapabilitiesDetector.reset();
      const newCapabilities = DeviceCapabilitiesDetector.detect();
      const newDeviceType = newCapabilities.deviceType;
      
      if (newDeviceType !== deviceType) {
        console.log('Type d\'appareil changé:', newDeviceType);
        setDeviceConfig(DEFAULT_DEVICE_CONFIG[newDeviceType]);
        setActiveVisualization(DEFAULT_DEVICE_CONFIG[newDeviceType].defaultVisualization);
      }
      
      if (activeVisualization === VISUALIZATION_TYPES.TERRAIN_3D && rendererRef.current && cameraRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        
        rendererRef.current.setSize(width, height);
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Nettoyer les ressources 3D
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [visualizationType, quality, activeVisualization]);

  // Charger les modules Three.js si nécessaire
  useEffect(() => {
    if (activeVisualization === VISUALIZATION_TYPES.TERRAIN_3D && !ThreeModules.THREE) {
      setLoadingProgress(10);
      
      const loadThreeModules = async () => {
        try {
          const THREE = await import('three');
          setLoadingProgress(50);
          
          const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls');
          setLoadingProgress(80);
          
          ThreeModules.THREE = THREE;
          ThreeModules.OrbitControls = OrbitControls;
          setLoadingProgress(100);
          
          setIs3DLoaded(true);
        } catch (err) {
          console.error('Erreur lors du chargement des modules Three.js:', err);
          setError('Impossible de charger les modules 3D');
          setActiveVisualization(deviceConfig?.fallbackVisualization || VISUALIZATION_TYPES.PROFILE_2D);
        }
      };
      
      loadThreeModules();
    }
  }, [activeVisualization, deviceConfig]);

  // Traiter les données du col
  useEffect(() => {
    if (!col) return;
    
    try {
      let data;
      if (activeVisualization === VISUALIZATION_TYPES.TERRAIN_3D) {
        data = visualizationService.current.transformColTo3D(col);
      } else {
        data = visualizationService.current.transformColTo2D(col);
      }
      
      setVisualData(data);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de la transformation des données:', err);
      setError('Erreur de traitement des données');
      setLoading(false);
    }
  }, [col, activeVisualization]);

  // Mise en place de la visualisation 2D (Canvas)
  useEffect(() => {
    if (!visualData || 
        loading || 
        !canvasRef.current || 
        activeVisualization === VISUALIZATION_TYPES.TERRAIN_3D) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    
    // Configuration du dessin
    const render2DVisualization = () => {
      // Effacer le canvas
      ctx.clearRect(0, 0, width, height);
      
      // Paramètres du graphique
      const margin = { top: 20, right: 20, bottom: 30, left: 40 };
      const graphWidth = width - margin.left - margin.right;
      const graphHeight = height - margin.top - margin.bottom;
      
      // Tracer le fond
      ctx.fillStyle = VISUALIZATION_STYLE.colors.background;
      ctx.fillRect(0, 0, width, height);
      
      if (visualData.points.length === 0) return;
      
      // Calculer les échelles
      const maxDistance = visualData.elevationProfile.distance;
      const minElevation = visualData.elevationProfile.start;
      const maxElevation = visualData.elevationProfile.summit;
      const elevationRange = maxElevation - minElevation;
      
      // Fonctions de mise à l'échelle
      const scaleX = (distance) => margin.left + (distance / maxDistance) * graphWidth;
      const scaleY = (elevation) => height - margin.bottom - ((elevation - minElevation) / elevationRange) * graphHeight;
      
      // Tracer le profil (aire)
      ctx.beginPath();
      ctx.moveTo(scaleX(0), scaleY(visualData.points[0].elevation));
      
      visualData.points.forEach((point) => {
        ctx.lineTo(scaleX(point.distance), scaleY(point.elevation));
      });
      
      ctx.lineTo(scaleX(maxDistance), scaleY(minElevation));
      ctx.lineTo(scaleX(0), scaleY(minElevation));
      ctx.closePath();
      
      // Remplir avec un dégradé
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(65, 105, 225, 0.7)');
      gradient.addColorStop(1, 'rgba(65, 105, 225, 0.1)');
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Tracer la ligne du profil
      ctx.beginPath();
      ctx.moveTo(scaleX(0), scaleY(visualData.points[0].elevation));
      
      visualData.points.forEach((point) => {
        ctx.lineTo(scaleX(point.distance), scaleY(point.elevation));
      });
      
      ctx.strokeStyle = VISUALIZATION_STYLE.colors.primary;
      ctx.lineWidth = VISUALIZATION_STYLE.lineWidth.medium;
      ctx.stroke();
      
      // Tracer les zones de pente différente
      if (visualData.points.some(p => p.gradient)) {
        let currentGradient = null;
        let startIdx = 0;
        
        for (let i = 0; i < visualData.points.length; i++) {
          const point = visualData.points[i];
          const gradient = Math.round(point.gradient);
          
          if (gradient !== currentGradient) {
            // Tracer la section précédente
            if (currentGradient !== null && i - startIdx > 1) {
              const gradientColor = getGradientColor(currentGradient);
              
              ctx.beginPath();
              ctx.moveTo(scaleX(visualData.points[startIdx].distance), scaleY(visualData.points[startIdx].elevation));
              
              for (let j = startIdx + 1; j <= i; j++) {
                ctx.lineTo(scaleX(visualData.points[j].distance), scaleY(visualData.points[j].elevation));
              }
              
              ctx.strokeStyle = gradientColor;
              ctx.lineWidth = VISUALIZATION_STYLE.lineWidth.thick;
              ctx.stroke();
            }
            
            currentGradient = gradient;
            startIdx = i;
          }
        }
        
        // Tracer la dernière section
        if (currentGradient !== null) {
          const gradientColor = getGradientColor(currentGradient);
          
          ctx.beginPath();
          ctx.moveTo(scaleX(visualData.points[startIdx].distance), scaleY(visualData.points[startIdx].elevation));
          
          for (let j = startIdx + 1; j < visualData.points.length; j++) {
            ctx.lineTo(scaleX(visualData.points[j].distance), scaleY(visualData.points[j].elevation));
          }
          
          ctx.strokeStyle = gradientColor;
          ctx.lineWidth = VISUALIZATION_STYLE.lineWidth.thick;
          ctx.stroke();
        }
      }
      
      // Tracer les axes
      ctx.beginPath();
      ctx.moveTo(margin.left, height - margin.bottom);
      ctx.lineTo(width - margin.right, height - margin.bottom);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = VISUALIZATION_STYLE.lineWidth.thin;
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(margin.left, margin.top);
      ctx.lineTo(margin.left, height - margin.bottom);
      ctx.stroke();
      
      // Ajouter des labels d'axe
      ctx.fillStyle = '#333';
      ctx.font = VISUALIZATION_STYLE.fonts.normal;
      ctx.fillText('Distance (km)', width / 2, height - 5);
      
      ctx.save();
      ctx.translate(10, height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('Élévation (m)', 0, 0);
      ctx.restore();
      
      // Repères d'élévation
      for (let i = 0; i <= 4; i++) {
        const elevation = minElevation + (i / 4) * elevationRange;
        const y = scaleY(elevation);
        
        ctx.beginPath();
        ctx.moveTo(margin.left - 5, y);
        ctx.lineTo(margin.left, y);
        ctx.stroke();
        
        ctx.fillText(Math.round(elevation) + 'm', margin.left - 35, y + 4);
      }
      
      // Repères de distance
      for (let i = 0; i <= 5; i++) {
        const distance = (i / 5) * maxDistance;
        const x = scaleX(distance);
        
        ctx.beginPath();
        ctx.moveTo(x, height - margin.bottom);
        ctx.lineTo(x, height - margin.bottom + 5);
        ctx.stroke();
        
        ctx.fillText(distance.toFixed(1) + 'km', x - 10, height - margin.bottom + 20);
      }
      
      // Points d'intérêt
      const sections = [
        { distance: 0, label: 'Départ', color: VISUALIZATION_STYLE.colors.elevation.start },
        { distance: maxDistance, label: 'Sommet', color: VISUALIZATION_STYLE.colors.elevation.summit }
      ];
      
      // Ajouter les sections de col si disponibles
      if (col.climbs) {
        col.climbs.forEach(climb => {
          if (climb.startDistance) {
            sections.push({
              distance: climb.startDistance,
              label: climb.name || 'Section',
              color: VISUALIZATION_STYLE.colors.elevation.middle
            });
          }
        });
      }
      
      // Dessiner les points d'intérêt
      sections.forEach(section => {
        const x = scaleX(section.distance);
        
        // Trouver l'élévation à cette distance
        let elevationAtDistance = minElevation;
        for (const point of visualData.points) {
          if (point.distance >= section.distance) {
            elevationAtDistance = point.elevation;
            break;
          }
        }
        
        // Cercle pour le point d'intérêt
        ctx.beginPath();
        ctx.arc(x, scaleY(elevationAtDistance), VISUALIZATION_STYLE.poiMarkers.size.normal, 0, 2 * Math.PI);
        ctx.fillStyle = section.color;
        ctx.fill();
        
        // Label pour le point d'intérêt
        ctx.fillStyle = '#333';
        ctx.font = VISUALIZATION_STYLE.fonts.normal;
        ctx.fillText(
          section.label, 
          x - 15, 
          scaleY(elevationAtDistance) - 10
        );
      });
    };
    
    // Détermine la couleur en fonction de la pente
    const getGradientColor = (gradient) => {
      if (gradient < 4) return VISUALIZATION_STYLE.colors.gradient.easy;
      if (gradient < 7) return VISUALIZATION_STYLE.colors.gradient.moderate;
      if (gradient < 10) return VISUALIZATION_STYLE.colors.gradient.challenging;
      if (gradient < 15) return VISUALIZATION_STYLE.colors.gradient.difficult;
      return VISUALIZATION_STYLE.colors.gradient.extreme;
    };
    
    // Exécuter le rendu
    render2DVisualization();
    
    // Signaler que la visualisation est prête
    onVisualizationReady({ type: activeVisualization, data: visualData });
    
  }, [visualData, col, activeVisualization, loading]);

  // Configuration et rendu 3D 
  useEffect(() => {
    if (!visualData || 
        loading || 
        activeVisualization !== VISUALIZATION_TYPES.TERRAIN_3D || 
        !is3DLoaded ||
        !containerRef.current) return;
    
    const THREE = ThreeModules.THREE;
    const OrbitControls = ThreeModules.OrbitControls;
    
    if (!THREE || !OrbitControls) return;
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Initialisation Three.js
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    sceneRef.current = scene;
    
    // Caméra
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 10, -15);
    cameraRef.current = camera;
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Contrôles
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 2;
    controlsRef.current = controls;
    
    // Lumières
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Créer le terrain
    if (visualData.terrainData) {
      const { vertices, indices, normals, uvs } = visualData.terrainData;
      
      const geometry = new THREE.BufferGeometry();
      
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      
      // Matériau de base
      const material = new THREE.MeshStandardMaterial({
        color: 0xA9C6DE,
        roughness: 0.8,
        metalness: 0.1,
      });
      
      const terrain = new THREE.Mesh(geometry, material);
      terrain.receiveShadow = true;
      terrain.castShadow = true;
      scene.add(terrain);
      
      // Créer la route
      const roadMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.9,
        metalness: 0.1,
      });
      
      // Extraire les coordonnées du centre de la route
      const roadPoints = [];
      for (let i = 0; i <= visualData.points.length - 1; i++) {
        const point = visualData.points[i];
        const x = 0; // Centre
        const y = point.elevation / 1000; // Hauteur
        const z = point.distance; // Distance
        roadPoints.push(new THREE.Vector3(x, y, z));
      }
      
      // Créer une courbe à partir des points
      const roadCurve = new THREE.CatmullRomCurve3(roadPoints);
      const roadGeometry = new THREE.TubeGeometry(roadCurve, 100, 0.1, 8, false);
      const road = new THREE.Mesh(roadGeometry, roadMaterial);
      scene.add(road);
      
      // Ajouter des marqueurs
      const startMarker = createMarker(0x4CAF50, 0.2);
      const endMarker = createMarker(0xF44336, 0.2);
      
      startMarker.position.copy(roadPoints[0]);
      startMarker.position.y += 0.2;
      scene.add(startMarker);
      
      endMarker.position.copy(roadPoints[roadPoints.length - 1]);
      endMarker.position.y += 0.2;
      scene.add(endMarker);
      
      // Fonction pour créer un marqueur
      function createMarker(color, scale = 1) {
        const geometry = new THREE.SphereGeometry(scale, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color });
        return new THREE.Mesh(geometry, material);
      }
      
      // Positionner la caméra pour voir l'ensemble du col
      const center = new THREE.Vector3(0, 0, visualData.elevationProfile.distance / 2);
      controls.target.copy(center);
      
      camera.position.set(0, visualData.elevationProfile.summit / 500, -visualData.elevationProfile.distance);
      camera.lookAt(center);
    }
    
    // Animation
    const animate = () => {
      if (!controlsRef.current) return;
      
      controlsRef.current.update();
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Nettoyage
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
    };
  }, [visualData, col, activeVisualization, loading, is3DLoaded]);

  // Fonctions de basculement
  const switchTo2D = () => {
    setActiveVisualization(VISUALIZATION_TYPES.PROFILE_2D);
  };
  
  const switchTo3D = () => {
    setActiveVisualization(VISUALIZATION_TYPES.TERRAIN_3D);
  };

  // Gestion des erreurs et du chargement
  if (loading) {
    return (
      <div className={`col-visualization loading ${className}`} style={{ width, height }}>
        <div className="loading-spinner"></div>
        <p>Chargement du profil d'élévation...</p>
        {loadingProgress > 0 && (
          <div className="progress-bar">
            <div className="progress-value" style={{ width: `${loadingProgress}%` }}></div>
            <span>{loadingProgress}%</span>
          </div>
        )}
      </div>
    );
  }

  if (error || !col || !visualData) {
    return (
      <div className={`col-visualization error ${className}`} style={{ width, height }}>
        <p>{error || "Impossible de charger les données du col"}</p>
      </div>
    );
  }

  return (
    <div className={`col-visualization ${className}`} style={{ width, height }}>
      <h3 className="visualization-title">Profil du {col.name}</h3>
      
      {/* Boutons de basculement 2D/3D */}
      {deviceConfig && deviceConfig.quality !== QUALITY_LEVELS.LOW && (
        <div className="visualization-controls">
          <button 
            className={`viz-control-btn ${activeVisualization === VISUALIZATION_TYPES.PROFILE_2D ? 'active' : ''}`}
            onClick={switchTo2D}
          >
            2D
          </button>
          <button 
            className={`viz-control-btn ${activeVisualization === VISUALIZATION_TYPES.TERRAIN_3D ? 'active' : ''}`}
            onClick={switchTo3D}
            disabled={deviceConfig.quality === QUALITY_LEVELS.LOW}
          >
            3D
          </button>
        </div>
      )}
      
      {/* Conteneur de visualisation */}
      <div className="visualization-container">
        {activeVisualization === VISUALIZATION_TYPES.PROFILE_2D ? (
          <canvas 
            ref={canvasRef} 
            width={600} 
            height={300} 
            className="elevation-canvas"
          />
        ) : (
          <div 
            ref={containerRef} 
            className="terrain-container"
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </div>
      
      {/* Statistiques d'élévation */}
      {showStats && (
        <div className="elevation-stats">
          <div className="stat-box">
            <span className="stat-label">Départ</span>
            <span className="stat-value">{Math.round(visualData.elevationProfile.start)}m</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Sommet</span>
            <span className="stat-value">{visualData.elevationProfile.summit}m</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Distance</span>
            <span className="stat-value">{visualData.elevationProfile.distance}km</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Pente moyenne</span>
            <span className="stat-value">{visualData.elevationProfile.gradient}%</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Dénivelé</span>
            <span className="stat-value">
              {Math.round(visualData.elevationProfile.summit - visualData.elevationProfile.start)}m
            </span>
          </div>
        </div>
      )}
      
      {/* Points d'intérêt */}
      {col.climbs && col.climbs.length > 0 && (
        <div className="climbs-info">
          <h4>Points d'intérêt</h4>
          <ul>
            {col.climbs.map((climb, index) => (
              <li key={index}>
                {climb.name || `Section ${index + 1}`}: 
                {climb.gradient && ` ${climb.gradient}%`}
                {climb.length && ` sur ${climb.length}km`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

ColVisualization.propTypes = {
  col: PropTypes.shape({
    name: PropTypes.string.isRequired,
    elevation: PropTypes.number.isRequired,
    length: PropTypes.number.isRequired,
    avgGradient: PropTypes.number.isRequired,
    startElevation: PropTypes.number,
    maxGradient: PropTypes.number,
    climbs: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      gradient: PropTypes.number,
      length: PropTypes.number,
      startDistance: PropTypes.number
    }))
  }).isRequired,
  visualizationType: PropTypes.oneOf(['auto', ...Object.values(VISUALIZATION_TYPES)]),
  quality: PropTypes.oneOf(['auto', ...Object.values(QUALITY_LEVELS)]),
  width: PropTypes.string,
  height: PropTypes.string,
  className: PropTypes.string,
  interactive: PropTypes.bool,
  showStats: PropTypes.bool,
  onVisualizationReady: PropTypes.func
};

export default ColVisualization;
