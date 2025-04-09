/**
 * WindAlert Component
 * 
 * Displays wind alerts for cycling safety
 * Shows warnings based on wind threshold levels
 */

import React, { useEffect, useState } from 'react';
import { Box, Alert, AlertTitle, Collapse, IconButton, Typography, Chip } from '@mui/material';
import { Warning, Dangerous, Info, Close, Air } from '@mui/icons-material';
import { WindWarning } from '../../services/weather/types/wind-types';
import WindyService from '../../services/weather/windy-service';
import { ENV } from '../../config/environment';

// Default Windy configuration
const DEFAULT_CONFIG = {
  apiKey: ENV.weather?.windy?.apiKey || process.env.WINDY_PLUGINS_API || '',
  cacheDuration: 1800,
  alertThresholds: {
    warning: 30,
    danger: 45
  }
};

interface WindAlertProps {
  colId?: string;
  location?: { lat: number; lon: number; name?: string };
  onWarning?: (warning: WindWarning) => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  variant?: 'standard' | 'compact' | 'minimal';
  position?: 'top' | 'bottom' | 'inline';
}

const WindAlert: React.FC<WindAlertProps> = ({ 
  colId, 
  location,
  onWarning,
  autoClose = true,
  autoCloseDelay = 10000, // 10 seconds
  variant = 'standard',
  position = 'top'
}) => {
  const [warning, setWarning] = useState<WindWarning | null>(null);
  const [open, setOpen] = useState(false);
  const [windyService] = useState<WindyService>(() => new WindyService(DEFAULT_CONFIG));
  const [alertTimeout, setAlertTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let unregister: (() => void) | null = null;

    const initializeAlert = async () => {
      try {
        if (!location && !colId) {
          console.warn('[WindAlert] No location or colId provided');
          return;
        }

        // Register for wind warnings
        unregister = windyService.registerWarningCallback((warning: WindWarning) => {
          // Only process warnings for this col if colId is specified
          if (colId && warning.colId && warning.colId !== colId) {
            return;
          }
          
          setWarning(warning);
          setOpen(true);
          
          // Call external handler if provided
          if (onWarning) {
            onWarning(warning);
          }
          
          // Auto-close after delay if enabled
          if (autoClose) {
            if (alertTimeout) {
              clearTimeout(alertTimeout);
            }
            
            const timeout = setTimeout(() => {
              setOpen(false);
            }, autoCloseDelay);
            
            setAlertTimeout(timeout);
          }
        });
        
        // If we have location data, check conditions immediately
        if (location) {
          await windyService.getDetailedWindData(location);
          
          // For mountain passes, use specialized check
          if (colId) {
            await windyService.checkMountainPassWindConditions(colId, location);
          }
        }
      } catch (error) {
        console.error('[WindAlert] Error initializing wind alert:', error);
      }
    };
    
    initializeAlert();
    
    // Cleanup function
    return () => {
      if (unregister) {
        unregister();
      }
      if (alertTimeout) {
        clearTimeout(alertTimeout);
      }
    };
  }, [colId, location, windyService, onWarning, autoClose, autoCloseDelay]);
  
  // Handle close click
  const handleClose = () => {
    setOpen(false);
    if (alertTimeout) {
      clearTimeout(alertTimeout);
    }
  };
  
  if (!warning || !open) {
    return null;
  }
  
  // Select icon based on warning level
  const getIcon = () => {
    switch (warning.level) {
      case 'danger':
        return <Dangerous color="error" />;
      case 'warning':
        return <Warning color="warning" />;
      default:
        return <Info color="info" />;
    }
  };
  
  // Get severity based on warning level
  const getSeverity = () => {
    switch (warning.level) {
      case 'danger':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };
  
  // Render compact version
  if (variant === 'minimal') {
    return (
      <Collapse in={open} style={{ position: position === 'top' ? 'sticky' : 'static', top: 0, zIndex: 999 }}>
        <Chip
          icon={getIcon()}
          label={`Vent: ${warning.speed} km/h`}
          color={getSeverity() as any}
          size="small"
          onDelete={handleClose}
          sx={{ m: 1 }}
        />
      </Collapse>
    );
  }
  
  // Render compact version
  if (variant === 'compact') {
    return (
      <Collapse in={open} style={{ position: position === 'top' ? 'sticky' : 'static', top: 0, zIndex: 999 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', p: 1, bgcolor: `${getSeverity()}.light`, borderRadius: 1, m: 1 }}>
          {getIcon()}
          <Typography variant="body2" sx={{ ml: 1, flexGrow: 1 }}>
            {warning.message}
          </Typography>
          <IconButton size="small" onClick={handleClose}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </Collapse>
    );
  }
  
  // Render standard version
  return (
    <Collapse in={open} style={{ position: position === 'top' ? 'sticky' : 'static', top: 0, zIndex: 999 }}>
      <Alert 
        severity={getSeverity() as any}
        icon={getIcon()}
        onClose={handleClose}
        sx={{ m: 1 }}
      >
        <AlertTitle>
          Alerte Vent
          <Chip
            icon={<Air />}
            label={`${warning.speed} km/h, rafales ${warning.gust} km/h`}
            size="small"
            color={getSeverity() as any}
            sx={{ ml: 2 }}
          />
        </AlertTitle>
        {warning.message}
        {warning.colId && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {location?.name || `Col ID: ${warning.colId}`}
          </Typography>
        )}
      </Alert>
    </Collapse>
  );
};

export default WindAlert;
