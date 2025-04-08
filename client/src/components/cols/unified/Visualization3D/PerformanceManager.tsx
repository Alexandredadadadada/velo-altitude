import React, { useState, useEffect, useMemo } from 'react';
import { Box, Slider, Typography, Switch, FormControlLabel, Chip } from '@mui/material';

interface PerformanceManagerProps {
  onQualityChange?: (quality: QualityLevel) => void;
  defaultQuality?: QualityLevel;
  deviceCapabilities?: DeviceCapabilities;
}

export type QualityLevel = 'low' | 'medium' | 'high' | 'ultra';

interface DeviceCapabilities {
  gpu?: string;
  memory?: number;
  cores?: number;
  mobile?: boolean;
  supportWebGL2?: boolean;
}

/**
 * Détecte les capacités du périphérique
 */
export const useDeviceCapabilities = (): DeviceCapabilities => {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
    mobile: false,
    supportWebGL2: false
  });

  useEffect(() => {
    // Détection mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Détection support WebGL2
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    const hasWebGL2 = !!gl;
    
    // Estimation nombre de cœurs CPU
    const estimatedCores = navigator.hardwareConcurrency || 2;
    
    setCapabilities({
      mobile: isMobile,
      supportWebGL2: hasWebGL2,
      cores: estimatedCores
    });
    
    // Tentative de récupération GPU info via WebGL (limitée)
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        setCapabilities(prev => ({ ...prev, gpu }));
      }
    }
  }, []);

  return capabilities;
};

/**
 * Hook personnalisé pour la gestion automatique de la qualité
 */
export const usePerformanceManager = (options?: {
  defaultQuality?: QualityLevel,
  adaptiveMode?: boolean,
  onQualityChange?: (quality: QualityLevel) => void
}) => {
  const deviceCapabilities = useDeviceCapabilities();
  const [quality, setQuality] = useState<QualityLevel>(options?.defaultQuality || 'medium');
  const [adaptiveMode, setAdaptiveMode] = useState<boolean>(options?.adaptiveMode !== false);
  const [frameRate, setFrameRate] = useState<number>(60);
  const [memoryUsage, setMemoryUsage] = useState<number>(0);
  
  // Détermination automatique de la qualité optimale basée sur les capacités
  const recommendedQuality = useMemo<QualityLevel>(() => {
    if (!deviceCapabilities) return 'medium';
    
    // Mobile avec GPU faible ou inconnu
    if (deviceCapabilities.mobile && (!deviceCapabilities.gpu || !deviceCapabilities.supportWebGL2)) {
      return 'low';
    }
    
    // Mobile avec GPU correct
    if (deviceCapabilities.mobile && deviceCapabilities.supportWebGL2) {
      return 'medium';
    }
    
    // Desktop avec GPU intégré ou faible
    if (deviceCapabilities.gpu && 
        (deviceCapabilities.gpu.includes('Intel') || 
         deviceCapabilities.gpu.includes('AMD') && !deviceCapabilities.gpu.includes('Radeon'))) {
      return 'medium';
    }
    
    // Desktop avec GPU dédié
    if (deviceCapabilities.gpu && 
        (deviceCapabilities.gpu.includes('NVIDIA') || 
         deviceCapabilities.gpu.includes('Radeon') || 
         deviceCapabilities.gpu.includes('AMD') && deviceCapabilities.gpu.includes('Radeon'))) {
      return 'high';
    }
    
    // Desktop avec GPU haut de gamme
    if (deviceCapabilities.gpu && 
        (deviceCapabilities.gpu.includes('RTX') || 
         deviceCapabilities.gpu.includes('Quadro') || 
         deviceCapabilities.gpu.includes('Radeon Pro'))) {
      return 'ultra';
    }
    
    // Fallback
    return 'medium';
  }, [deviceCapabilities]);
  
  // Appliquer la qualité recommandée si en mode adaptatif
  useEffect(() => {
    if (adaptiveMode) {
      setQuality(recommendedQuality);
      if (options?.onQualityChange) {
        options.onQualityChange(recommendedQuality);
      }
    }
  }, [adaptiveMode, recommendedQuality, options]);
  
  // Moniteur de performance (FPS)
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;
    
    const measureFrameRate = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        setFrameRate(frameCount);
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationFrameId = requestAnimationFrame(measureFrameRate);
    };
    
    animationFrameId = requestAnimationFrame(measureFrameRate);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  // Fonction pour ajuster manuellement la qualité
  const setQualityLevel = (newQuality: QualityLevel) => {
    setQuality(newQuality);
    if (options?.onQualityChange) {
      options.onQualityChange(newQuality);
    }
  };
  
  // Simulation de consommation mémoire (à remplacer par une vraie mesure)
  useEffect(() => {
    const memoryByQuality: Record<QualityLevel, number> = {
      'low': 50,
      'medium': 120,
      'high': 250,
      'ultra': 400
    };
    
    setMemoryUsage(memoryByQuality[quality]);
  }, [quality]);
  
  return {
    quality,
    setQuality: setQualityLevel,
    adaptiveMode,
    setAdaptiveMode,
    recommendedQuality,
    frameRate,
    memoryUsage,
    deviceCapabilities
  };
};

/**
 * Composant de gestion de la performance pour les visualisations 3D
 * Ajuste automatiquement la qualité de rendu en fonction des capacités de l'appareil
 */
export const PerformanceManager: React.FC<PerformanceManagerProps> = ({
  onQualityChange,
  defaultQuality = 'medium',
  deviceCapabilities
}) => {
  const performance = usePerformanceManager({
    defaultQuality,
    onQualityChange
  });
  
  const qualityOptions: { value: QualityLevel, label: string }[] = [
    { value: 'low', label: 'Basse' },
    { value: 'medium', label: 'Moyenne' },
    { value: 'high', label: 'Haute' },
    { value: 'ultra', label: 'Ultra' }
  ];
  
  const getQualityIndex = (quality: QualityLevel): number => {
    return qualityOptions.findIndex(opt => opt.value === quality);
  };

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle2" gutterBottom>
          Qualité de rendu
        </Typography>
        <Chip 
          label={`${performance.frameRate} FPS`}
          color={performance.frameRate > 40 ? "success" : performance.frameRate > 25 ? "warning" : "error"}
          size="small"
        />
      </Box>
      
      <Slider
        value={getQualityIndex(performance.quality)}
        min={0}
        max={3}
        step={1}
        marks={qualityOptions.map((opt, i) => ({ value: i, label: opt.label }))}
        onChange={(_, value) => performance.setQuality(qualityOptions[value as number].value)}
      />
      
      <Box display="flex" justifyContent="space-between" mt={2}>
        <FormControlLabel
          control={
            <Switch
              checked={performance.adaptiveMode}
              onChange={(e) => performance.setAdaptiveMode(e.target.checked)}
              size="small"
            />
          }
          label="Mode adaptatif"
        />
        <Typography variant="caption" color="text.secondary">
          Mémoire: ~{performance.memoryUsage} MB
        </Typography>
      </Box>
      
      {performance.deviceCapabilities?.gpu && (
        <Typography variant="caption" color="text.secondary" display="block" mt={1}>
          GPU détecté: {performance.deviceCapabilities.gpu}
        </Typography>
      )}
    </Box>
  );
};

export default PerformanceManager;
