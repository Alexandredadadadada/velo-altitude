import React, { useEffect, useState, useCallback, useRef } from 'react';
import { EnhancedColVisualization3D } from './EnhancedColVisualization3D';
import MobileOptimizationService, { RenderingSettings } from '../../services/optimization/MobileOptimizationService';
import monitoringService from '../../services/monitoring';
import styles from './OptimizedColVisualization.module.css';

interface OptimizedColVisualizationProps {
  passId?: string;
  elevationData: any;
  surfaceTypes?: any;
  pointsOfInterest?: any[];
  width?: number | string;
  height?: number | string;
}

/**
 * OptimizedColVisualization - A wrapper component that integrates the EnhancedColVisualization3D 
 * with the MobileOptimizationService for optimal performance across devices
 */
const OptimizedColVisualization: React.FC<OptimizedColVisualizationProps> = ({
  passId,
  elevationData,
  surfaceTypes,
  pointsOfInterest,
  width = '100%',
  height = 500
}) => {
  // Initialize optimization service
  const optimizationService = MobileOptimizationService.getInstance();
  
  // State for rendering settings
  const [renderSettings, setRenderSettings] = useState<RenderingSettings | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  // References for performance metrics
  const startTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsRef = useRef<number>(0);
  const loadingContainerRef = useRef<HTMLDivElement>(null);
  
  // Initialize optimization service and monitoring
  useEffect(() => {
    const init = async () => {
      try {
        // Initialize with monitoring service
        optimizationService.initialize(monitoringService);
        
        // Get initial rendering settings
        const settings = optimizationService.getSettings();
        setRenderSettings(settings);
        
        // Start performance monitoring
        optimizationService.startMonitoring();
        
        // Record initialization time for metrics
        startTimeRef.current = performance.now();
        
        // Subscribe to settings updates
        optimizationService.on('settingsUpdated', (newSettings: RenderingSettings) => {
          console.log('Rendering settings updated:', newSettings);
          setRenderSettings(newSettings);
          
          // Report settings change to monitoring service
          monitoringService.trackEvent('3D_settings_updated', {
            textureQuality: newSettings.textureQuality,
            meshDetail: newSettings.meshDetail,
            antialiasing: newSettings.enableAntialiasing,
            shadows: newSettings.useShadows
          });
        });
        
        setIsInitialized(true);
        
        // Report successful initialization
        monitoringService.trackEvent('3D_visualization_initialized', {
          deviceType: optimizationService.getConfig().deviceType,
          gpuTier: optimizationService.getConfig().gpuTier,
          connectionSpeed: optimizationService.getConfig().connectionSpeed
        });
      } catch (error) {
        console.error('Failed to initialize 3D optimization:', error);
        monitoringService.trackError('3D_initialization_failed', error);
      }
    };
    
    init();
    
    // Cleanup on unmount
    return () => {
      optimizationService.stopMonitoring();
      optimizationService.removeAllListeners('settingsUpdated');
    };
  }, []);
  
  // Apply dynamic sizing to loading container
  useEffect(() => {
    if (loadingContainerRef.current) {
      // Set width
      if (typeof width === 'number') {
        loadingContainerRef.current.style.width = `${width}px`;
      } else {
        loadingContainerRef.current.style.width = width;
      }
      
      // Set height
      if (typeof height === 'number') {
        loadingContainerRef.current.style.height = `${height}px`;
      } else {
        loadingContainerRef.current.style.height = `${height}px`;
      }
    }
  }, [width, height, loadingContainerRef]);
  
  // Setup frame counting and performance metrics
  useEffect(() => {
    if (!isInitialized) return;
    
    // Start measuring FPS
    const animationFrameId = requestAnimationFrame(function measure() {
      const now = performance.now();
      
      // Calculate and update FPS every second
      frameCountRef.current++;
      const elapsed = now - lastFrameTimeRef.current;
      
      if (elapsed >= 1000) {
        fpsRef.current = Math.round((frameCountRef.current * 1000) / elapsed);
        
        // Report FPS to monitoring service
        monitoringService.trackMetric('3D_fps', fpsRef.current);
        
        // Reset counters
        frameCountRef.current = 0;
        lastFrameTimeRef.current = now;
      }
      
      // Continue measuring
      requestAnimationFrame(measure);
    });
    
    // Cleanup animation frame on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isInitialized]);
  
  // Track render time for the visualization
  const handleRenderComplete = useCallback(() => {
    if (startTimeRef.current > 0) {
      const renderTime = performance.now() - startTimeRef.current;
      monitoringService.trackMetric('3D_initial_render_time', renderTime);
      startTimeRef.current = 0;
    }
  }, []);
  
  // If not yet initialized, show loading state
  if (!isInitialized || !renderSettings) {
    return (
      <div 
        ref={loadingContainerRef}
        className={styles.loadingContainer}
      >
        <p>Optimizing 3D visualization for your device...</p>
      </div>
    );
  }
  
  // Convert dimension values
  const viewportDimensions = {
    width: typeof width === 'number' ? width : parseInt(String(width)) || 800,
    height: typeof height === 'number' ? height : 500
  };
  
  // Apply device-specific interaction mode
  const interactionMode = {
    rotate: true,
    pan: true,
    zoom: true
  };
  
  // For mobile devices, we might want to restrict some interactions
  if (optimizationService.getConfig().deviceType === 'mobile') {
    interactionMode.pan = false;
  }
  
  // Determine render quality based on optimization settings
  const renderQuality = renderSettings.meshDetail === 'high' ? '3d' : '2d';
  
  return (
    <div onLoad={handleRenderComplete}>
      <EnhancedColVisualization3D
        passId={passId}
        elevationData={elevationData}
        surfaceTypes={surfaceTypes}
        pointsOfInterest={pointsOfInterest}
        viewportDimensions={viewportDimensions}
        renderQuality={renderQuality}
        interactionMode={interactionMode}
      />
      
      {/* Optional FPS counter for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className={styles.fpsCounter}>
          {fpsRef.current} FPS
        </div>
      )}
    </div>
  );
};

export default OptimizedColVisualization;
