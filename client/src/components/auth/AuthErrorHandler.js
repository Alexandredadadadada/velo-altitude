/**
 * Gestionnaire d'erreurs d'authentification
 * Affiche différentes interfaces utilisateur selon le type d'erreur d'authentification
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Snackbar,
  Alert,
  Typography,
  Box
} from '@mui/material';
import {
  ErrorOutline as ErrorIcon,
  LockOutlined as LockIcon,
  RefreshOutlined as RefreshIcon,
  DevicesOutlined as DevicesIcon,
  WarningAmberOutlined as WarningIcon
} from '@mui/icons-material';

// Mapping des codes d'erreur vers des configurations d'affichage
const errorConfig = {
  // Erreurs de session
  'token_expired': {
    title: 'Session expirée',
    message: 'Votre session a expiré. Veuillez vous reconnecter.',
    icon: <RefreshIcon color="warning" />,
    severity: 'warning',
    buttons: [
      { label: 'Se reconnecter', action: 'login', color: 'primary' }
    ]
  },
  'session_expired': {
    title: 'Session expirée',
    message: 'Votre session a expiré. Veuillez vous reconnecter.',
    icon: <RefreshIcon color="warning" />,
    severity: 'warning',
    buttons: [
      { label: 'Se reconnecter', action: 'login', color: 'primary' }
    ]
  },
  'token_revoked': {
    title: 'Session révoquée',
    message: 'Votre session a été révoquée. Veuillez vous reconnecter.',
    icon: <LockIcon color="error" />,
    severity: 'error',
    buttons: [
      { label: 'Se reconnecter', action: 'login', color: 'primary' }
    ]
  },
  
  // Erreurs d'appareil
  'device_changed': {
    title: 'Nouvel appareil détecté',
    message: 'Nous avons détecté une connexion depuis un nouvel appareil. Pour votre sécurité, veuillez vous reconnecter.',
    icon: <DevicesIcon color="warning" />,
    severity: 'warning',
    buttons: [
      { label: 'Se reconnecter', action: 'login', color: 'primary' }
    ]
  },
  'too_many_devices': {
    title: 'Trop d\'appareils',
    message: 'Vous êtes connecté sur trop d\'appareils différents. Veuillez vous déconnecter de l\'un d\'entre eux et réessayer.',
    icon: <DevicesIcon color="error" />,
    severity: 'error',
    buttons: [
      { label: 'Gérer mes appareils', action: 'manage_devices', color: 'primary' },
      { label: 'Se reconnecter', action: 'login', color: 'secondary' }
    ]
  },
  
  // Erreurs de sécurité
  'account_locked': {
    title: 'Compte verrouillé',
    message: 'Votre compte a été temporairement verrouillé pour des raisons de sécurité. Veuillez réessayer dans quelques minutes ou contacter le support.',
    icon: <LockIcon color="error" />,
    severity: 'error',
    buttons: [
      { label: 'Contacter le support', action: 'support', color: 'primary' },
      { label: 'Réessayer', action: 'login', color: 'secondary' }
    ]
  },
  
  // Erreur par défaut
  'default': {
    title: 'Erreur d\'authentification',
    message: 'Une erreur d\'authentification s\'est produite. Veuillez vous reconnecter.',
    icon: <ErrorIcon color="error" />,
    severity: 'error',
    buttons: [
      { label: 'Se reconnecter', action: 'login', color: 'primary' }
    ]
  }
};

/**
 * Composant pour gérer les erreurs d'authentification
 * @param {Object} props Propriétés du composant
 * @param {string} props.errorCode Code d'erreur d'authentification
 * @param {string} props.errorMessage Message d'erreur personnalisé (optionnel)
 * @param {boolean} props.open Si le dialogue est ouvert
 * @param {Function} props.onClose Fonction à appeler lors de la fermeture
 * @param {Function} props.onAction Fonction à appeler lors d'une action (login, manage_devices, support)
 * @param {boolean} props.useSnackbar Utiliser une snackbar au lieu d'un dialogue pour les erreurs moins critiques
 */
const AuthErrorHandler = ({
  errorCode = 'default',
  errorMessage,
  open = false,
  onClose,
  onAction,
  useSnackbar = false
}) => {
  const navigate = useNavigate();
  const [showError, setShowError] = useState(open);
  
  // Récupérer la configuration pour ce code d'erreur
  const config = errorConfig[errorCode] || errorConfig.default;
  
  useEffect(() => {
    setShowError(open);
  }, [open, errorCode]);
  
  // Gestionnaire de fermeture
  const handleClose = () => {
    setShowError(false);
    if (onClose) onClose();
  };
  
  // Gestionnaire d'action
  const handleAction = (action) => {
    handleClose();
    
    if (onAction) {
      onAction(action);
      return;
    }
    
    // Actions par défaut si aucun gestionnaire personnalisé n'est fourni
    switch (action) {
      case 'login':
        navigate('/login');
        break;
      case 'manage_devices':
        navigate('/account/devices');
        break;
      case 'support':
        navigate('/support');
        break;
      default:
        console.warn(`Action non gérée: ${action}`);
    }
  };
  
  // Utiliser une snackbar pour les erreurs moins critiques si demandé
  if (useSnackbar && (config.severity === 'info' || config.severity === 'warning')) {
    return (
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleClose}
          severity={config.severity}
          variant="filled"
          sx={{ width: '100%' }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => handleAction(config.buttons[0].action)}
            >
              {config.buttons[0].label}
            </Button>
          }
        >
          {errorMessage || config.message}
        </Alert>
      </Snackbar>
    );
  }
  
  // Utiliser un dialogue pour les erreurs critiques
  return (
    <Dialog
      open={showError}
      onClose={handleClose}
      aria-labelledby="auth-error-title"
      aria-describedby="auth-error-description"
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: 500,
          borderTop: `4px solid ${
            config.severity === 'error' ? 'error.main' :
            config.severity === 'warning' ? 'warning.main' : 'primary.main'
          }`
        }
      }}
    >
      <DialogTitle id="auth-error-title" sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          {config.icon}
          <Typography variant="h6" component="span">
            {config.title}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="auth-error-description">
          {errorMessage || config.message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {config.buttons.map((button, index) => (
          <Button
            key={index}
            onClick={() => handleAction(button.action)}
            color={button.color}
            variant={index === 0 ? 'contained' : 'outlined'}
          >
            {button.label}
          </Button>
        ))}
      </DialogActions>
    </Dialog>
  );
};

export default AuthErrorHandler;
