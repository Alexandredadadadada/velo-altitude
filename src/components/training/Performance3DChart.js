import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Button,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  Stack,
  useTheme
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import integrationService from '../../services/integrationService';
import { Scene, PerspectiveCamera, WebGLRenderer, Color, BoxGeometry, 
  MeshBasicMaterial, Mesh, AmbientLight, DirectionalLight, AxesHelper, 
  Vector3, GridHelper, SphereGeometry, Raycaster, Vector2 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { MathUtils } from 'three';
import {
  RotateLeft,
  ZoomIn,
  ZoomOut,
  RestartAlt,
  ChevronLeft,
  ChevronRight
} from '@mui/icons-material';

/**
 * Composant de visualisation 3D des performances d'entraînement
 * Permet de visualiser différentes dimensions de données en 3D
 */
const Performance3DChart = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const frameIdRef = useRef(null);
  const dataPointsRef = useRef([]);
  const raycasterRef = useRef(new Raycaster());
  const mouseRef = useRef(new Vector2());
  
  // États
  const [loading, setLoading] = useState(true);
  const [timeframes, setTimeframes] = useState(['last30days', 'last90days', 'year', 'all']);
  const [selectedTimeframe, setSelectedTimeframe] = useState('last30days');
  const [dimensions, setDimensions] = useState([
    { id: 'power', label: 'Puissance (W)', color: '#84cc16' },
    { id: 'heartRate', label: 'FC (bpm)', color: '#ef4444' },
    { id: 'cadence', label: 'Cadence (rpm)', color: '#3b82f6' },
    { id: 'speed', label: 'Vitesse (km/h)', color: '#f59e0b' },
    { id: 'distance', label: 'Distance (km)', color: '#8b5cf6' },
    { id: 'elevation', label: 'Dénivelé (m)', color: '#14b8a6' },
    { id: 'duration', label: 'Durée (min)', color: '#ec4899' }
  ]);
  const [selectedDimensions, setSelectedDimensions] = useState({
    x: 'distance',
    y: 'power',
    z: 'speed'
  });
  const [tooltipInfo, setTooltipInfo] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  
  // Initialiser la scène 3D
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Configuration de la scène
    const scene = new Scene();
    scene.background = new Color(0xf5f5f5);
    sceneRef.current = scene;
    
    // Configuration de la caméra
    const camera = new PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(20, 15, 20);
    cameraRef.current = camera;
    
    // Configuration du renderer
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Contrôles orbitaux
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controlsRef.current = controls;
    
    // Lumières
    const ambientLight = new AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);
    
    // Axes et grille
    const axesHelper = new AxesHelper(20);
    scene.add(axesHelper);
    
    const gridHelper = new GridHelper(20, 20, 0x888888, 0xcccccc);
    scene.add(gridHelper);
    
    // Animation
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Gestion du redimensionnement
    const handleResize = () => {
      if (containerRef.current && cameraRef.current && rendererRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Gestion des interactions souris
    const handleMouseMove = (event) => {
      event.preventDefault();
      
      // Convertir la position de la souris en coordonnées normalisées (-1 à 1)
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Mettre à jour le raycaster
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      
      // Vérifier l'intersection avec les points
      const meshes = dataPointsRef.current;
      const intersects = raycasterRef.current.intersectObjects(meshes);
      
      if (intersects.length > 0) {
        const dataPoint = intersects[0].object.userData;
        setTooltipInfo({
          x: event.clientX,
          y: event.clientY,
          data: dataPoint
        });
        
        document.body.style.cursor = 'pointer';
      } else {
        setTooltipInfo(null);
        document.body.style.cursor = 'default';
      }
    };
    
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      window.removeEventListener('resize', handleResize);
      
      if (rendererRef.current) {
        rendererRef.current.domElement.removeEventListener('mousemove', handleMouseMove);
        rendererRef.current.dispose();
      }
    };
  }, []);
  
  // Charger les données de performance
  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setLoading(true);
        
        // Vérifier si l'utilisateur est connecté
        if (!user || !user.id) {
          console.error('Erreur: Utilisateur non authentifié');
          setPerformanceData([]);
          return;
        }
        
        // Vérifier la disponibilité du service
        if (!integrationService || typeof integrationService.getPerformanceData !== 'function') {
          throw new Error('Service d\'intégration non disponible');
        }
        
        // Appel API
        const response = await integrationService.getPerformanceData(user.id, selectedTimeframe);
        
        // Validation des données
        if (!response || !Array.isArray(response.data)) {
          throw new Error('Format de réponse invalide ou données manquantes');
        }
        
        // Filtrer les données invalides et normaliser
        const validData = response.data
          .filter(item => 
            item && 
            typeof item === 'object' && 
            item.date && 
            item.title
          )
          .map(item => ({
            ...item,
            // Normalisation des valeurs numériques
            power: typeof item.power === 'number' ? item.power : 0,
            heartRate: typeof item.heartRate === 'number' ? item.heartRate : 0,
            cadence: typeof item.cadence === 'number' ? item.cadence : 0,
            speed: typeof item.speed === 'number' ? item.speed : 0,
            distance: typeof item.distance === 'number' ? item.distance : 0,
            elevation: typeof item.elevation === 'number' ? item.elevation : 0,
            duration: typeof item.duration === 'number' ? item.duration : 0,
            intensity: typeof item.intensity === 'number' ? 
              Math.min(100, Math.max(0, item.intensity)) : 50
          }));
        
        setPerformanceData(validData);
        
        // Mettre à jour la visualisation avec les nouvelles données
        if (validData.length > 0) {
          createVisualization(validData);
        } else {
          // Réinitialiser la scène si aucune donnée n'est disponible
          if (sceneRef.current) {
            // Supprimer les points de données existants
            dataPointsRef.current.forEach(point => {
              if (sceneRef.current.getObjectById(point.id)) {
                sceneRef.current.remove(point);
              }
            });
            dataPointsRef.current = [];
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données de performance:', error);
        setPerformanceData([]);
        
        // Réinitialiser la scène en cas d'erreur
        if (sceneRef.current) {
          dataPointsRef.current.forEach(point => {
            if (sceneRef.current.getObjectById(point.id)) {
              sceneRef.current.remove(point);
            }
          });
          dataPointsRef.current = [];
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchPerformanceData();
  }, [user, selectedTimeframe]);
  
  // Mettre à jour la visualisation lorsque les dimensions sélectionnées changent
  useEffect(() => {
    if (performanceData.length > 0) {
      createVisualization(performanceData);
    }
  }, [selectedDimensions]);
  
  // Créer la visualisation 3D
  const createVisualization = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn('Aucune donnée valide pour la visualisation 3D');
      return;
    }
    
    if (!sceneRef.current) {
      console.error('La scène 3D n\'est pas initialisée');
      return;
    }
    
    // Nettoyer les points de données existants
    dataPointsRef.current.forEach(point => {
      if (sceneRef.current.getObjectById(point.id)) {
        sceneRef.current.remove(point);
      }
    });
    dataPointsRef.current = [];
    
    // Récupérer les dimensions sélectionnées
    const { x: xDimension, y: yDimension, z: zDimension } = selectedDimensions;
    
    // Calculer les valeurs min/max pour chaque dimension pour normalisation
    const minMaxValues = {
      [xDimension]: { min: Infinity, max: -Infinity },
      [yDimension]: { min: Infinity, max: -Infinity },
      [zDimension]: { min: Infinity, max: -Infinity }
    };
    
    // Trouver les valeurs min/max pour chaque dimension
    data.forEach(item => {
      Object.keys(minMaxValues).forEach(dimension => {
        const value = item[dimension];
        if (typeof value === 'number' && !isNaN(value)) {
          minMaxValues[dimension].min = Math.min(minMaxValues[dimension].min, value);
          minMaxValues[dimension].max = Math.max(minMaxValues[dimension].max, value);
        }
      });
    });
    
    // Vérifier que nous avons des valeurs valides pour normaliser
    Object.keys(minMaxValues).forEach(dimension => {
      if (minMaxValues[dimension].min === Infinity || minMaxValues[dimension].max === -Infinity) {
        minMaxValues[dimension].min = 0;
        minMaxValues[dimension].max = 100;
      } else if (minMaxValues[dimension].min === minMaxValues[dimension].max) {
        // Éviter la division par zéro lors de la normalisation
        minMaxValues[dimension].min -= 1;
        minMaxValues[dimension].max += 1;
      }
    });
    
    // Fonction pour normaliser les valeurs entre -10 et 10
    const normalize = (value, min, max) => {
      if (typeof value !== 'number' || isNaN(value)) return 0;
      const normalizedValue = 20 * ((value - min) / (max - min)) - 10;
      return MathUtils.clamp(normalizedValue, -10, 10);
    };
    
    // Créer des points pour chaque élément de données
    data.forEach((item, index) => {
      try {
        // S'assurer que nous avons des valeurs numériques valides
        const xValue = typeof item[xDimension] === 'number' ? item[xDimension] : 0;
        const yValue = typeof item[yDimension] === 'number' ? item[yDimension] : 0;
        const zValue = typeof item[zDimension] === 'number' ? item[zDimension] : 0;
        
        // Normaliser les coordonnées
        const x = normalize(xValue, minMaxValues[xDimension].min, minMaxValues[xDimension].max);
        const y = normalize(yValue, minMaxValues[yDimension].min, minMaxValues[yDimension].max);
        const z = normalize(zValue, minMaxValues[zDimension].min, minMaxValues[zDimension].max);
        
        // Déterminer la taille du point en fonction de l'intensité
        const intensity = typeof item.intensity === 'number' ? 
          Math.min(100, Math.max(0, item.intensity)) : 50;
        const size = 0.1 + (intensity / 100) * 0.3;
        
        // Créer la géométrie et le matériau
        const geometry = new SphereGeometry(size, 16, 16);
        
        // Couleur basée sur l'intensité (gradient de bleu à rouge)
        const colorIntensity = intensity / 100;
        const r = Math.min(1, colorIntensity * 2);
        const g = Math.max(0, 1 - Math.abs(colorIntensity - 0.5) * 2);
        const b = Math.max(0, 1 - colorIntensity * 2);
        
        const material = new MeshBasicMaterial({ 
          color: new Color(r, g, b),
          transparent: true,
          opacity: 0.8
        });
        
        const sphere = new Mesh(geometry, material);
        sphere.position.set(x, y, z);
        sphere.userData = {
          index,
          dataItem: { ...item },
          originalPosition: { x, y, z }
        };
        
        sceneRef.current.add(sphere);
        dataPointsRef.current.push(sphere);
      } catch (error) {
        console.warn(`Erreur lors de la création du point pour l'index ${index}:`, error);
      }
    });
    
    // Réinitialiser la caméra pour une meilleure vue
    resetCamera();
  };
  
  // Réinitialiser la caméra
  const resetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    cameraRef.current.position.set(20, 15, 20);
    cameraRef.current.lookAt(0, 0, 0);
    controlsRef.current.update();
  };
  
  // Gérer le changement de période
  const handleTimeframeChange = (event) => {
    setSelectedTimeframe(event.target.value);
  };
  
  // Gérer le changement de dimension
  const handleDimensionChange = (axis, dimensionId) => {
    setSelectedDimensions(prev => ({
      ...prev,
      [axis]: dimensionId
    }));
  };
  
  // Exporter les données
  const exportDataAsCSV = () => {
    if (!performanceData || performanceData.length === 0) return;
    
    // Créer les en-têtes
    const headers = ['date', 'title', ...dimensions.map(d => d.id)].join(',');
    
    // Créer les lignes de données
    const rows = performanceData.map(item => {
      const values = [
        item.date,
        `"${item.title || 'Activité'}"`,
        ...dimensions.map(d => item[d.id] || '')
      ];
      return values.join(',');
    });
    
    // Combiner tout
    const csvContent = [headers, ...rows].join('\n');
    
    // Créer un blob et un lien de téléchargement
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `performance_data_3d_${selectedTimeframe}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <Paper 
      sx={{ 
        p: 3, 
        borderRadius: 2,
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Visualisation 3D des performances
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Explorez vos données d'entraînement en 3D pour découvrir des corrélations entre différentes métriques
        </Typography>
      </Box>
      
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="timeframe-select-label">Période</InputLabel>
          <Select
            labelId="timeframe-select-label"
            id="timeframe-select"
            value={selectedTimeframe}
            label="Période"
            onChange={handleTimeframeChange}
            disabled={loading}
            size="small"
          >
            <MenuItem value="last30days">30 derniers jours</MenuItem>
            <MenuItem value="last90days">90 derniers jours</MenuItem>
            <MenuItem value="year">Cette année</MenuItem>
            <MenuItem value="all">Toutes les données</MenuItem>
          </Select>
        </FormControl>
        
        <Box sx={{ 
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          flexGrow: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button 
              size="small" 
              variant="outlined" 
              startIcon={<RotateLeft />}
              onClick={resetCamera}
            >
              Réinitialiser vue
            </Button>
            
            <Button 
              size="small" 
              variant="outlined"
              onClick={exportDataAsCSV}
            >
              Exporter CSV
            </Button>
          </Box>
          
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              Faire glisser pour tourner | Molette pour zoomer
            </Typography>
          </Box>
        </Box>
      </Stack>
      
      <Box sx={{ 
        display: 'flex', 
        mb: 2, 
        flexWrap: 'wrap',
        gap: 1
      }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="x-dimension-label">Axe X</InputLabel>
          <Select
            labelId="x-dimension-label"
            id="x-dimension"
            value={selectedDimensions.x}
            label="Axe X"
            onChange={(e) => handleDimensionChange('x', e.target.value)}
            disabled={loading}
          >
            {dimensions.map((dim) => (
              <MenuItem key={`x-${dim.id}`} value={dim.id}>
                {dim.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="y-dimension-label">Axe Y</InputLabel>
          <Select
            labelId="y-dimension-label"
            id="y-dimension"
            value={selectedDimensions.y}
            label="Axe Y"
            onChange={(e) => handleDimensionChange('y', e.target.value)}
            disabled={loading}
          >
            {dimensions.map((dim) => (
              <MenuItem key={`y-${dim.id}`} value={dim.id}>
                {dim.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="z-dimension-label">Axe Z</InputLabel>
          <Select
            labelId="z-dimension-label"
            id="z-dimension"
            value={selectedDimensions.z}
            label="Axe Z"
            onChange={(e) => handleDimensionChange('z', e.target.value)}
            disabled={loading}
          >
            {dimensions.map((dim) => (
              <MenuItem key={`z-${dim.id}`} value={dim.id}>
                {dim.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      <Box 
        sx={{ 
          position: 'relative', 
          flexGrow: 1,
          minHeight: 400,
          bgcolor: '#f5f5f5',
          borderRadius: 1,
          overflow: 'hidden'
        }}
        ref={containerRef}
      >
        {loading && (
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
              zIndex: 10,
              bgcolor: 'rgba(255,255,255,0.7)'
            }}
          >
            <CircularProgress />
          </Box>
        )}
        
        {/* Légende des axes */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            p: 1,
            borderRadius: 1,
            zIndex: 5,
            fontSize: '0.75rem'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: 'red', mr: 1 }} />
            <Typography variant="caption">
              X: {dimensions.find(d => d.id === selectedDimensions.x)?.label}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: 'green', mr: 1 }} />
            <Typography variant="caption">
              Y: {dimensions.find(d => d.id === selectedDimensions.y)?.label}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 12, height: 12, bgcolor: 'blue', mr: 1 }} />
            <Typography variant="caption">
              Z: {dimensions.find(d => d.id === selectedDimensions.z)?.label}
            </Typography>
          </Box>
        </Box>
        
        {/* Tooltip */}
        {tooltipInfo && (
          <Box
            sx={{
              position: 'absolute',
              top: tooltipInfo.y + 10,
              left: tooltipInfo.x + 10,
              zIndex: 20,
              bgcolor: 'background.paper',
              boxShadow: 3,
              p: 1,
              borderRadius: 1,
              minWidth: 200
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {tooltipInfo.data.title}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {tooltipInfo.data.date}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" display="block">
                {dimensions.find(d => d.id === selectedDimensions.x)?.label}: {tooltipInfo.data[selectedDimensions.x]}
              </Typography>
              <Typography variant="caption" display="block">
                {dimensions.find(d => d.id === selectedDimensions.y)?.label}: {tooltipInfo.data[selectedDimensions.y]}
              </Typography>
              <Typography variant="caption" display="block">
                {dimensions.find(d => d.id === selectedDimensions.z)?.label}: {tooltipInfo.data[selectedDimensions.z]}
              </Typography>
              <Typography variant="caption" display="block">
                Intensité: {tooltipInfo.data.intensity}/100
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {performanceData.length === 0 ? (
            "Aucune donnée d'entraînement disponible pour cette période."
          ) : (
            `Visualisation basée sur ${performanceData.length} activité${performanceData.length > 1 ? 's' : ''}.`
          )}
        </Typography>
      </Box>
    </Paper>
  );
};

export default Performance3DChart;
