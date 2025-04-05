/**
 * Bibliothèque de composants d'erreur réutilisables
 * Fournit différents types de composants d'erreur avec différents niveaux de sévérité
 */

import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  AlertTitle,
  Button,
  Box,
  Typography,
  Paper,
  Slide,
  Fade,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';

// Niveaux de sévérité
export const SeverityLevel = {
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  FATAL: 'error' // Utilisé pour les erreurs critiques, mappé à 'error' pour MUI
};

// Icônes par niveau de sévérité
const severityIcons = {
  [SeverityLevel.SUCCESS]: <SuccessIcon />,
  [SeverityLevel.INFO]: <InfoIcon />,
  [SeverityLevel.WARNING]: <WarningIcon />,
  [SeverityLevel.ERROR]: <ErrorIcon />,
  [SeverityLevel.FATAL]: <ErrorIcon />
};

/**
 * Composant Toast pour les notifications éphémères
 * @param {Object} props Propriétés du composant
 */
export const Toast = ({
  open = false,
  message = '',
  severity = SeverityLevel.INFO,
  duration = 6000,
  onClose,
  action,
  position = { vertical: 'bottom', horizontal: 'left' },
  variant = 'filled'
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={position}
      TransitionComponent={Slide}
    >
      <Alert
        elevation={6}
        variant={variant}
        onClose={onClose}
        severity={severity}
        sx={{ 
          width: '100%',
          alignItems: 'center',
          '& .MuiAlert-icon': {
            display: 'flex',
            alignItems: 'center',
            fontSize: '1.5rem'
          }
        }}
        action={action}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

/**
 * Composant Modal pour les erreurs importantes nécessitant une action utilisateur
 * @param {Object} props Propriétés du composant
 */
export const ErrorModal = ({
  open = false,
  title = 'Erreur',
  message = '',
  severity = SeverityLevel.ERROR,
  onClose,
  actions = [],
  maxWidth = 'sm',
  fullWidth = true,
  disableBackdropClick = false,
  disableEscapeKeyDown = false
}) => {
  // Couleur de bordure selon la sévérité
  const getBorderColor = () => {
    switch (severity) {
      case SeverityLevel.SUCCESS:
        return 'success.main';
      case SeverityLevel.INFO:
        return 'info.main';
      case SeverityLevel.WARNING:
        return 'warning.main';
      case SeverityLevel.ERROR:
      case SeverityLevel.FATAL:
        return 'error.main';
      default:
        return 'grey.300';
    }
  };

  const handleClose = (event, reason) => {
    if (disableBackdropClick && reason === 'backdropClick') {
      return;
    }
    if (disableEscapeKeyDown && reason === 'escapeKeyDown') {
      return;
    }
    if (onClose) onClose(event, reason);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      aria-labelledby="error-dialog-title"
      aria-describedby="error-dialog-description"
      PaperProps={{
        elevation: 8,
        sx: {
          borderTop: `4px solid ${getBorderColor()}`,
          borderRadius: '8px'
        }
      }}
    >
      <DialogTitle id="error-dialog-title">
        <Box display="flex" alignItems="center" gap={1}>
          {severityIcons[severity]}
          <Typography variant="h6" component="span">
            {title}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="error-dialog-description" component="div">
          {typeof message === 'string' ? (
            <Typography>{message}</Typography>
          ) : (
            message
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {actions.length > 0 ? (
          // Actions personnalisées
          actions.map((action, index) => (
            <Button
              key={index}
              onClick={() => {
                if (action.onClick) action.onClick();
                if (!action.keepOpen && onClose) onClose();
              }}
              color={action.color || 'primary'}
              variant={action.variant || (index === 0 ? 'contained' : 'outlined')}
              size={action.size || 'medium'}
              disabled={action.disabled}
            >
              {action.label}
            </Button>
          ))
        ) : (
          // Action par défaut (fermer)
          <Button 
            onClick={onClose} 
            color="primary" 
            variant="contained"
            autoFocus
          >
            Fermer
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

/**
 * Composant Banner pour les notifications persistantes en haut de page
 * @param {Object} props Propriétés du composant
 */
export const ErrorBanner = ({
  open = true,
  message = '',
  severity = SeverityLevel.WARNING,
  onClose,
  actions = [],
  dismissible = true
}) => {
  return (
    <Fade in={open}>
      <Box
        sx={{
          width: '100%',
          position: 'sticky',
          top: 0,
          zIndex: 1000
        }}
      >
        <Alert
          severity={severity}
          variant="filled"
          icon={severityIcons[severity]}
          action={
            dismissible ? (
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={onClose}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            ) : null
          }
          sx={{
            borderRadius: 0,
            justifyContent: 'center',
            px: 2,
            py: 1
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
            <Typography variant="body1">{message}</Typography>
            {actions.length > 0 && (
              <Box ml={2} display="flex" gap={1}>
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    size="small"
                    variant={action.variant || 'text'}
                    color={action.color || 'inherit'}
                    onClick={action.onClick}
                  >
                    {action.label}
                  </Button>
                ))}
              </Box>
            )}
          </Box>
        </Alert>
      </Box>
    </Fade>
  );
};

/**
 * Composant InlineError pour les erreurs de validation de formulaire
 * @param {Object} props Propriétés du composant
 */
export const InlineError = ({
  message = '',
  severity = SeverityLevel.ERROR,
  icon = true,
  component = 'div',
  marginTop = 0.5,
  marginBottom = 0
}) => {
  if (!message) return null;

  return (
    <Box
      component={component}
      sx={{
        display: 'flex',
        alignItems: 'center',
        mt: marginTop,
        mb: marginBottom,
        color: `${severity}.main`
      }}
    >
      {icon && (
        <Box 
          component="span" 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mr: 0.5,
            '& svg': {
              fontSize: '0.875rem'
            }
          }}
        >
          {React.cloneElement(severityIcons[severity], { fontSize: 'inherit' })}
        </Box>
      )}
      <Typography variant="caption" color="inherit">
        {message}
      </Typography>
    </Box>
  );
};

/**
 * Composant ErrorCard pour afficher des erreurs à l'intérieur du contenu principal
 * @param {Object} props Propriétés du composant
 */
export const ErrorCard = ({
  title = 'Erreur',
  message = '',
  severity = SeverityLevel.ERROR,
  onClose,
  onRetry,
  expanded = true,
  collapsible = false
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);

  useEffect(() => {
    setIsExpanded(expanded);
  }, [expanded]);

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        mb: 3,
        borderLeft: `4px solid ${
          severity === SeverityLevel.SUCCESS ? 'success.main' :
          severity === SeverityLevel.INFO ? 'info.main' :
          severity === SeverityLevel.WARNING ? 'warning.main' :
          'error.main'
        }`
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap={1}>
          {severityIcons[severity]}
          <Typography variant="subtitle1" component="h3" fontWeight="500">
            {title}
          </Typography>
        </Box>
        <Box>
          {collapsible && (
            <IconButton 
              size="small" 
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Réduire" : "Développer"}
            >
              {isExpanded ? 
                <CloseIcon fontSize="small" /> : 
                severityIcons[severity]
              }
            </IconButton>
          )}
        </Box>
      </Box>

      {isExpanded && (
        <>
          <Box mt={1}>
            {typeof message === 'string' ? (
              <Typography variant="body2">{message}</Typography>
            ) : (
              message
            )}
          </Box>

          {(onRetry || onClose) && (
            <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
              {onRetry && (
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={onRetry}
                  startIcon={<RefreshIcon />}
                >
                  Réessayer
                </Button>
              )}
              {onClose && (
                <Button 
                  size="small" 
                  variant="text" 
                  onClick={onClose}
                >
                  Fermer
                </Button>
              )}
            </Box>
          )}
        </>
      )}
    </Paper>
  );
};

/**
 * Composant NotificationDot pour indiquer une erreur sur une icône ou un bouton
 * @param {Object} props Propriétés du composant
 */
export const NotificationDot = ({
  active = true,
  severity = SeverityLevel.ERROR,
  size = 8,
  position = { top: 0, right: 0 },
  children
}) => {
  if (!active) return children;

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      {children}
      <Box
        sx={{
          position: 'absolute',
          top: position.top,
          right: position.right,
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: `${severity}.main`,
          border: '1px solid #fff',
          zIndex: 1
        }}
      />
    </Box>
  );
};

// Composant pour la récupération des imports dynamiques
export const ErrorBoundary = ({ children, fallback }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (event) => {
      event.preventDefault();
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  if (hasError) {
    return fallback || (
      <ErrorCard
        title="Erreur inattendue"
        message="Une erreur s'est produite lors du chargement de ce composant."
        severity={SeverityLevel.ERROR}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return children;
};

// Exporter tous les composants
export default {
  Toast,
  ErrorModal,
  ErrorBanner,
  InlineError,
  ErrorCard,
  NotificationDot,
  ErrorBoundary,
  SeverityLevel
};
