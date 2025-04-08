import React, { useState, useCallback } from 'react';
import { 
  Box, 
  IconButton, 
  Tooltip, 
  Fade, 
  Paper, 
  Typography,
  ButtonGroup,
  Grid,
  Slider,
  FormControlLabel,
  Switch,
  Collapse
} from '@mui/material';
import {
  CameraOutlined as CameraIcon,
  PlayCircleOutline as PlayIcon,
  PauseCircleOutline as PauseIcon,
  Adjust as AdjustIcon,
  RestartAlt as ResetIcon,
  SettingsOutlined as SettingsIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  FullscreenOutlined as FullscreenIcon,
  Visibility as VisibilityIcon,
  Flight as FlyThroughIcon,
  VrpanoOutlined as PanoramaIcon,
  InfoOutlined as InfoIcon,
  CameraEnhance as CameraEnhanceIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { QualityLevel } from './PerformanceManager';

interface ControlsProps {
  onPlayAnimation?: () => void;
  onPauseAnimation?: () => void;
  onReset?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFullscreen?: () => void;
  onScreenshot?: () => void;
  onFlythrough?: () => void;
  onPanorama?: () => void;
  onToggleInfos?: () => void;
  onSetFlySpeed?: (speed: number) => void;
  onSetQuality?: (quality: QualityLevel) => void;
  onSetShowLabels?: (show: boolean) => void;
  onSetShowPOI?: (show: boolean) => void;
  onSetNightMode?: (enabled: boolean) => void;
  config?: {
    isPlaying?: boolean;
    quality?: QualityLevel;
    flySpeed?: number;
    showLabels?: boolean;
    showPOI?: boolean;
    nightMode?: boolean;
    maxFlySpeed?: number;
    minFlySpeed?: number;
    isFullscreen?: boolean;
    allowScreenshots?: boolean;
    allowFlythrough?: boolean;
    allowPanorama?: boolean;
    showQualitySettings?: boolean;
  };
  performance?: {
    quality: QualityLevel;
  };
}

/**
 * Contrôles pour la visualisation 3D des cols
 * Fournit toutes les fonctionnalités d'interaction avec le terrain 3D
 */
export const Controls: React.FC<ControlsProps> = ({
  onPlayAnimation,
  onPauseAnimation,
  onReset,
  onZoomIn,
  onZoomOut,
  onFullscreen,
  onScreenshot,
  onFlythrough,
  onPanorama,
  onToggleInfos,
  onSetFlySpeed,
  onSetQuality,
  onSetShowLabels,
  onSetShowPOI,
  onSetNightMode,
  config = {
    isPlaying: false,
    quality: 'medium',
    flySpeed: 1,
    showLabels: true,
    showPOI: true,
    nightMode: false,
    maxFlySpeed: 3,
    minFlySpeed: 0.5,
    isFullscreen: false,
    allowScreenshots: true,
    allowFlythrough: true,
    allowPanorama: true,
    showQualitySettings: true
  },
  performance
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'quality' | 'camera'>('general');
  
  // Callbacks pour les actions
  const handlePlayPause = useCallback(() => {
    if (config.isPlaying) {
      onPauseAnimation?.();
    } else {
      onPlayAnimation?.();
    }
  }, [config.isPlaying, onPauseAnimation, onPlayAnimation]);
  
  const handleFlySpeedChange = useCallback((_: Event, value: number | number[]) => {
    onSetFlySpeed?.(value as number);
  }, [onSetFlySpeed]);
  
  const handleQualityChange = useCallback((quality: QualityLevel) => {
    onSetQuality?.(quality);
  }, [onSetQuality]);
  
  const handleShowLabelsChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    onSetShowLabels?.(event.target.checked);
  }, [onSetShowLabels]);
  
  const handleShowPOIChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    onSetShowPOI?.(event.target.checked);
  }, [onSetShowPOI]);
  
  const handleNightModeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    onSetNightMode?.(event.target.checked);
  }, [onSetNightMode]);
  
  // Qualité sélectionnée (provient soit des props, soit des réglages)
  const currentQuality = performance?.quality || config.quality || 'medium';
  
  return (
    <Box
      sx={{
        position: 'absolute',
        zIndex: 10,
        bottom: 16,
        left: 16,
        right: 16,
        display: 'flex',
        justifyContent: 'space-between',
        pointerEvents: 'none'
      }}
    >
      {/* Contrôles principaux (gauche) */}
      <Paper
        elevation={3}
        sx={{
          px: 1,
          py: 0.5,
          borderRadius: 4,
          bgcolor: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(5px)',
          pointerEvents: 'auto'
        }}
      >
        <ButtonGroup size="small" variant="text">
          {config.allowFlythrough && (
            <Tooltip title="Parcourir le col" arrow>
              <IconButton onClick={onFlythrough} color="primary">
                <FlyThroughIcon />
              </IconButton>
            </Tooltip>
          )}
          
          <Tooltip title={config.isPlaying ? "Pause" : "Démarrer l'animation"} arrow>
            <IconButton onClick={handlePlayPause} color="primary">
              {config.isPlaying ? <PauseIcon /> : <PlayIcon />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Réinitialiser la vue" arrow>
            <IconButton onClick={onReset} color="primary">
              <ResetIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Zoom avant" arrow>
            <IconButton onClick={onZoomIn} color="primary">
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Zoom arrière" arrow>
            <IconButton onClick={onZoomOut} color="primary">
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      </Paper>
      
      {/* Contrôles secondaires (droite) */}
      <Paper
        elevation={3}
        sx={{
          px: 1,
          py: 0.5,
          borderRadius: 4,
          bgcolor: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(5px)',
          pointerEvents: 'auto'
        }}
      >
        <ButtonGroup size="small" variant="text">
          {config.allowScreenshots && (
            <Tooltip title="Prendre une capture d'écran" arrow>
              <IconButton onClick={onScreenshot} color="primary">
                <CameraIcon />
              </IconButton>
            </Tooltip>
          )}
          
          {config.allowPanorama && (
            <Tooltip title="Vue panoramique" arrow>
              <IconButton onClick={onPanorama} color="primary">
                <PanoramaIcon />
              </IconButton>
            </Tooltip>
          )}
          
          <Tooltip title="Afficher/masquer les informations" arrow>
            <IconButton onClick={onToggleInfos} color="primary">
              <InfoIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Plein écran" arrow>
            <IconButton onClick={onFullscreen} color="primary">
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={showSettings ? "Fermer les paramètres" : "Paramètres"} arrow>
            <IconButton 
              onClick={() => setShowSettings(!showSettings)} 
              color={showSettings ? "secondary" : "primary"}
            >
              {showSettings ? <CloseIcon /> : <SettingsIcon />}
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      </Paper>
      
      {/* Panneau de paramètres */}
      <Collapse 
        in={showSettings} 
        timeout={300}
        sx={{
          position: 'absolute',
          bottom: 70,
          right: 0,
          width: 300,
          maxWidth: 'calc(100% - 32px)',
          zIndex: 20,
          pointerEvents: 'auto'
        }}
      >
        <Paper
          elevation={4}
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" fontWeight="medium">
              Paramètres
            </Typography>
            <Box>
              <Tooltip title="Paramètres généraux">
                <IconButton 
                  size="small"
                  color={settingsTab === 'general' ? 'primary' : 'default'}
                  onClick={() => setSettingsTab('general')}
                >
                  <SettingsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {config.showQualitySettings && (
                <Tooltip title="Qualité">
                  <IconButton 
                    size="small"
                    color={settingsTab === 'quality' ? 'primary' : 'default'}
                    onClick={() => setSettingsTab('quality')}
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Caméra">
                <IconButton 
                  size="small"
                  color={settingsTab === 'camera' ? 'primary' : 'default'}
                  onClick={() => setSettingsTab('camera')}
                >
                  <CameraEnhanceIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          {/* Onglet Paramètres généraux */}
          {settingsTab === 'general' && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={!!config.showLabels} 
                      onChange={handleShowLabelsChange}
                      size="small"
                    />
                  }
                  label="Afficher les étiquettes"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={!!config.showPOI} 
                      onChange={handleShowPOIChange}
                      size="small"
                    />
                  }
                  label="Afficher les points d'intérêt"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={!!config.nightMode} 
                      onChange={handleNightModeChange}
                      size="small"
                    />
                  }
                  label="Mode nuit"
                />
              </Grid>
            </Grid>
          )}
          
          {/* Onglet Qualité */}
          {settingsTab === 'quality' && config.showQualitySettings && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body2" gutterBottom>
                  Qualité de rendu
                </Typography>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <ButtonGroup size="small" fullWidth>
                    {(['low', 'medium', 'high', 'ultra'] as QualityLevel[]).map(quality => (
                      <Tooltip key={quality} title={`Qualité ${quality}`} arrow>
                        <IconButton 
                          onClick={() => handleQualityChange(quality)}
                          color={currentQuality === quality ? 'primary' : 'default'}
                          size="small"
                          sx={{ 
                            borderRadius: 0,
                            border: '1px solid',
                            borderColor: 'divider'
                          }}
                        >
                          <AdjustIcon 
                            fontSize="small" 
                            sx={{ 
                              opacity: quality === 'low' ? 0.4 : 
                                      quality === 'medium' ? 0.6 : 
                                      quality === 'high' ? 0.8 : 1
                            }} 
                          />
                        </IconButton>
                      </Tooltip>
                    ))}
                  </ButtonGroup>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Actuel: {currentQuality === 'low' ? 'Basse' : 
                            currentQuality === 'medium' ? 'Moyenne' : 
                            currentQuality === 'high' ? 'Haute' : 'Ultra'}
                </Typography>
              </Grid>
            </Grid>
          )}
          
          {/* Onglet Caméra */}
          {settingsTab === 'camera' && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body2" gutterBottom>
                  Vitesse de parcours
                </Typography>
                <Slider
                  value={config.flySpeed}
                  min={config.minFlySpeed}
                  max={config.maxFlySpeed}
                  step={0.1}
                  onChange={handleFlySpeedChange}
                  marks={[
                    { value: config.minFlySpeed || 0.5, label: 'Lent' },
                    { value: (config.maxFlySpeed || 3) / 2, label: '' },
                    { value: config.maxFlySpeed || 3, label: 'Rapide' }
                  ]}
                />
              </Grid>
            </Grid>
          )}
          
          <Typography variant="caption" color="text.secondary" display="block" mt={1} align="right">
            Velo-Altitude © 2025
          </Typography>
        </Paper>
      </Collapse>
    </Box>
  );
};

export default Controls;
