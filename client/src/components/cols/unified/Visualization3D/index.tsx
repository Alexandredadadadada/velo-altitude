import React, { useState, useCallback, useRef, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, Environment, Sky } from '@react-three/drei';
import { 
  Box, 
  Paper, 
  Typography, 
  CircularProgress, 
  useTheme, 
  useMediaQuery, 
  Fade,
  Snackbar,
  Alert
} from '@mui/material';

// Import subcomponents
import { PerformanceManager, usePerformanceManager, QualityLevel } from './PerformanceManager';
import { TerrainSystem, useTerrainSystem, TerrainData } from './TerrainSystem';
import { Controls } from './Controls';

// Import optimization HOC
import withPerformanceOptimization from '../../../optimization/withPerformanceOptimization';

export interface Visualization3DProps {
  colId: string;
  initialData?: TerrainData;
  config?: {
    showControls?: boolean;
    quality?: QualityLevel;
    flySpeed?: number;
    showLabels?: boolean;
    showPOI?: boolean;
    nightMode?: boolean;
    maxFlySpeed?: number;
    minFlySpeed?: number;
    allowScreenshots?: boolean;
    allowFlythrough?: boolean;
    allowPanorama?: boolean;
    showQualitySettings?: boolean;
    cameraPosition?: [number, number, number];
    cameraTarget?: [number, number, number];
    cameraFOV?: number;
    cameraNear?: number;
    cameraFar?: number;
    backgroundColor?: string;
    enableAnimation?: boolean;
    enableShadows?: boolean;
    enableHDRI?: boolean;
    adaptiveLoading?: boolean;
  };
}

/**
 * Hook personnalisé pour charger les données de terrain
 */
export const useVisualization3DData = (colId: string, initialData?: TerrainData) => {
  const [terrainData, setTerrainData] = useState<TerrainData | null>(initialData || null);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchTerrainData = async () => {
      if (initialData) {
        setTerrainData(initialData);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Service API pour récupérer les données du terrain 3D
        const colService = await import('../../../services/colService').then(module => module.default);
        
        // Charger les données du terrain 3D
        const terrain3DData = await colService.getCol3DTerrainData(colId);
        
        // Transformation des données en format attendu par TerrainSystem
        const formattedData: TerrainData = {
          points: terrain3DData.map((point: any) => ({
            x: point.x || 0,
            y: point.y || 0,
            z: point.z || 0,
            gradient: point.gradient
          })),
          width: 10,
          length: Math.max(...terrain3DData.map((p: any) => p.x)) + 2,
          maxElevation: Math.max(...terrain3DData.map((p: any) => p.y)) + 1,
          pointsOfInterest: terrain3DData.pointsOfInterest || []
        };
        
        setTerrainData(formattedData);
        setLoading(false);
      } catch (err: any) {
        console.error('[Visualization3D] Erreur lors du chargement des données:', err);
        setError(err.message || 'Erreur lors du chargement des données 3D');
        setLoading(false);
      }
    };
    
    if (colId) {
      fetchTerrainData();
    }
  }, [colId, initialData]);
  
  return {
    terrainData,
    loading,
    error
  };
};

/**
 * Composant principal pour la visualisation 3D des cols
 * Intègre le terrain, les contrôles et la gestion des performances
 */
export const UnifiedVisualization3D: React.FC<Visualization3DProps> = ({
  colId,
  initialData,
  config = {
    showControls: true,
    quality: 'medium',
    flySpeed: 1,
    showLabels: true,
    showPOI: true,
    nightMode: false,
    maxFlySpeed: 3,
    minFlySpeed: 0.5,
    allowScreenshots: true,
    allowFlythrough: true,
    allowPanorama: true,
    showQualitySettings: true,
    cameraPosition: [5, 2, 5],
    cameraTarget: [0, 0, 0],
    cameraFOV: 75,
    cameraNear: 0.1,
    cameraFar: 1000,
    backgroundColor: '#87CEEB',
    enableAnimation: true,
    enableShadows: true,
    enableHDRI: false,
    adaptiveLoading: true
  }
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  // Référence à l'élément Canvas pour les captures d'écran
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // État pour la visualisation
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState<boolean>(config.showLabels || true);
  const [showPOI, setShowPOI] = useState<boolean>(config.showPOI || true);
  const [nightMode, setNightMode] = useState<boolean>(config.nightMode || false);
  const [flySpeed, setFlySpeed] = useState<number>(config.flySpeed || 1);
  const [showInfos, setShowInfos] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ open: boolean, message: string, severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Système de gestion des performances
  const performance = usePerformanceManager({
    defaultQuality: config.quality,
    adaptiveMode: config.adaptiveLoading
  });
  
  // Chargement des données du terrain
  const { terrainData, loading, error } = useVisualization3DData(colId, initialData);
  
  // Callbacks pour les contrôles
  const handlePlayAnimation = useCallback(() => setIsPlaying(true), []);
  const handlePauseAnimation = useCallback(() => setIsPlaying(false), []);
  
  const handleReset = useCallback(() => {
    // Reset camera position and target
    if (canvasRef.current) {
      // Réinitialiser la caméra via drei's OrbitControls (sera implémenté)
    }
  }, [canvasRef]);
  
  const handleZoomIn = useCallback(() => {
    // Zoom in (sera implémenté)
  }, []);
  
  const handleZoomOut = useCallback(() => {
    // Zoom out (sera implémenté)
  }, []);
  
  const handleFullscreen = useCallback(() => {
    const container = canvasRef.current?.parentElement;
    if (!container) return;
    
    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        setNotification({
          open: true,
          message: `Erreur: ${err.message}`,
          severity: 'error'
        });
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        setNotification({
          open: true,
          message: `Erreur: ${err.message}`,
          severity: 'error'
        });
      });
    }
  }, [canvasRef]);
  
  const handleScreenshot = useCallback(() => {
    if (!canvasRef.current) return;
    
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      
      // Créer un lien de téléchargement
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `col-${colId}-screenshot.png`;
      link.click();
      
      setNotification({
        open: true,
        message: 'Capture d\'écran enregistrée',
        severity: 'success'
      });
    } catch (err) {
      setNotification({
        open: true,
        message: 'Erreur lors de la capture d\'écran',
        severity: 'error'
      });
    }
  }, [canvasRef, colId]);
  
  const handleFlythrough = useCallback(() => {
    setIsPlaying(true);
    setNotification({
      open: true,
      message: 'Parcours du col en cours...',
      severity: 'info'
    });
  }, []);
  
  const handlePanorama = useCallback(() => {
    // Enable panoramic view (sera implémenté)
    setNotification({
      open: true,
      message: 'Vue panoramique activée',
      severity: 'info'
    });
  }, []);
  
  const handleToggleInfos = useCallback(() => {
    setShowInfos(prev => !prev);
  }, []);
  
  const handleCloseNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);
  
  // Si en cours de chargement
  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: isMobile ? 250 : isTablet ? 350 : 450,
          bgcolor: 'background.default',
          borderRadius: 1,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Chargement de la visualisation 3D...
        </Typography>
      </Paper>
    );
  }
  
  // En cas d'erreur
  if (error) {
    return (
      <Paper 
        elevation={0}
        sx={{
          p: 3,
          border: 1,
          borderColor: 'error.light',
          borderRadius: 1,
          minHeight: isMobile ? 150 : 250,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography color="error" variant="subtitle1" gutterBottom>
          Erreur lors du chargement de la visualisation 3D
        </Typography>
        <Typography variant="body2">
          {error}
        </Typography>
      </Paper>
    );
  }
  
  // Si pas de données
  if (!terrainData) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          bgcolor: 'grey.100',
          borderRadius: 1,
          minHeight: isMobile ? 150 : 250,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography variant="subtitle1" align="center">
          Aucune donnée de visualisation 3D disponible pour ce col
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{
        width: '100%',
        height: isMobile ? 300 : isTablet ? 400 : 500,
        borderRadius: 1,
        overflow: 'hidden',
        position: 'relative',
        '&:hover': {
          '& .visualization-controls': {
            opacity: 1,
          }
        }
      }}
    >
      {/* Informations superposées */}
      <Fade in={showInfos}>
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            maxWidth: '60%',
            zIndex: 20,
            pointerEvents: 'none'
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 1.5,
              bgcolor: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(5px)',
              borderRadius: 1
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Informations sur le col
            </Typography>
            <Typography variant="body2">
              Longueur: {terrainData.length?.toFixed(1)} km
            </Typography>
            <Typography variant="body2">
              Dénivelé: {terrainData.maxElevation?.toFixed(0)} m
            </Typography>
            <Typography variant="body2">
              Points d'intérêt: {terrainData.pointsOfInterest?.length || 0}
            </Typography>
          </Paper>
        </Box>
      </Fade>
      
      {/* Canvas Three.js */}
      <Canvas
        ref={canvasRef}
        shadows={config.enableShadows}
        camera={{ position: config.cameraPosition, fov: config.cameraFOV, near: config.cameraNear, far: config.cameraFar }}
        style={{ background: nightMode ? '#111122' : config.backgroundColor }}
      >
        <Suspense fallback={null}>
          {/* Éclairage */}
          <ambientLight intensity={nightMode ? 0.2 : 0.5} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={nightMode ? 0.5 : 1}
            castShadow={config.enableShadows}
          />
          
          {/* Environnement */}
          {config.enableHDRI ? (
            <Environment preset="sunset" background={false} />
          ) : (
            <Sky
              distance={450000}
              sunPosition={nightMode ? [0, -1, 0] : [1, 0.5, 0]}
              inclination={nightMode ? 0 : 0.5}
              azimuth={nightMode ? 0 : 0.25}
            />
          )}
          
          {/* Système de terrain */}
          <TerrainSystem
            data={terrainData}
            quality={performance.quality}
            highlighted={isPlaying}
            color={{
              road: '#444444',
              terrain: nightMode ? '#2b4f32' : '#4b7f52',
              accent: '#ff6b6b'
            }}
          />
          
          {/* Contrôles de caméra */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            target={config.cameraTarget}
          />
        </Suspense>
      </Canvas>
      
      {/* Contrôles d'interface */}
      {config.showControls && (
        <Controls
          onPlayAnimation={handlePlayAnimation}
          onPauseAnimation={handlePauseAnimation}
          onReset={handleReset}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFullscreen={handleFullscreen}
          onScreenshot={handleScreenshot}
          onFlythrough={handleFlythrough}
          onPanorama={handlePanorama}
          onToggleInfos={handleToggleInfos}
          onSetFlySpeed={setFlySpeed}
          onSetQuality={performance.setQuality}
          onSetShowLabels={setShowLabels}
          onSetShowPOI={setShowPOI}
          onSetNightMode={setNightMode}
          config={{
            isPlaying,
            quality: performance.quality,
            flySpeed,
            showLabels,
            showPOI,
            nightMode,
            maxFlySpeed: config.maxFlySpeed,
            minFlySpeed: config.minFlySpeed,
            isFullscreen,
            allowScreenshots: config.allowScreenshots,
            allowFlythrough: config.allowFlythrough,
            allowPanorama: config.allowPanorama,
            showQualitySettings: config.showQualitySettings
          }}
          performance={performance}
        />
      )}
      
      {/* Gestionnaire de performance */}
      {config.showControls && config.showQualitySettings && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            zIndex: 10,
            width: '100%',
            display: 'none', // Masqué par défaut, contrôlé via Controls
          }}
          className="quality-settings"
        >
          <PerformanceManager
            onQualityChange={performance.setQuality}
            defaultQuality={performance.quality}
          />
        </Box>
      )}
      
      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

// Export avec optimisation des performances
export default withPerformanceOptimization(UnifiedVisualization3D);
