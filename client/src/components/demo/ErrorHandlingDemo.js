/**
 * Composant de démonstration du système de gestion d'erreurs
 * Ce composant permet de tester différents scénarios d'erreurs
 * et de voir comment ils sont gérés par notre système
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Divider,
  Card,
  CardContent,
  CardActions,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress
} from '@mui/material';
import {
  ErrorOutline as ErrorIcon,
  WarningAmber as WarningIcon,
  Info as InfoIcon,
  BugReport as BugIcon,
  NetworkCheck as NetworkIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Code as CodeIcon
} from '@mui/icons-material';

// Hooks personnalisés
import useErrorHandler from '../../hooks/useErrorHandler';
import { useNotification } from '../common/NotificationSystem';

// Composant qui génère une erreur lors du rendu
const BuggyComponent = () => {
  // Cette ligne va générer une erreur
  const causeError = undefined.toString();
  return <div>{causeError}</div>;
};

// Composant qui génère une erreur après un délai
const DelayedErrorComponent = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      // Générer une erreur après 2 secondes
      throw new Error('Erreur générée après un délai');
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return <Typography>Ce composant va générer une erreur après 2 secondes...</Typography>;
};

// Composant principal de démonstration
const ErrorHandlingDemo = () => {
  const { handleApiRequest, tryCatch, handleError } = useErrorHandler();
  const { notify } = useNotification();
  
  const [errorType, setErrorType] = useState('validation_error');
  const [errorMessage, setErrorMessage] = useState('Erreur de validation des données');
  const [showBuggyComponent, setShowBuggyComponent] = useState(false);
  const [showDelayedError, setShowDelayedError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Types d'erreurs disponibles
  const errorTypes = [
    { value: 'validation_error', label: 'Erreur de validation', icon: <CodeIcon /> },
    { value: 'auth_error', label: 'Erreur d\'authentification', icon: <SecurityIcon /> },
    { value: 'network_error', label: 'Erreur réseau', icon: <NetworkIcon /> },
    { value: 'server_error', label: 'Erreur serveur', icon: <StorageIcon /> },
    { value: 'unknown_error', label: 'Erreur inconnue', icon: <BugIcon /> }
  ];
  
  // Simuler une requête API qui échoue
  const simulateApiError = async () => {
    setIsLoading(true);
    
    try {
      await handleApiRequest(
        new Promise((_, reject) => {
          setTimeout(() => {
            reject({
              response: {
                data: {
                  error: {
                    type: errorType,
                    message: errorMessage,
                    severity: errorType.includes('auth') || errorType.includes('server') ? 'error' : 'warning',
                    details: `Détails supplémentaires sur l'erreur de type ${errorType}`
                  }
                }
              }
            });
          }, 1500);
        }),
        {
          loadingMessage: 'Simulation d\'une requête API en cours...',
          errorMessage: 'La requête API a échoué',
          showLoading: true
        }
      );
    } catch (error) {
      // L'erreur est déjà gérée par handleApiRequest
      console.log('Erreur capturée dans le composant:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Simuler une erreur synchrone avec try/catch
  const simulateSyncError = () => {
    tryCatch(
      () => {
        // Code qui génère une erreur
        throw new Error(`Erreur synchrone: ${errorMessage}`);
      },
      {
        errorMessage: `Une erreur s'est produite lors de l'exécution: ${errorMessage}`,
        showError: true
      }
    );
  };
  
  // Simuler différents types de notifications
  const showNotification = (type) => {
    const messages = {
      success: 'Opération réussie avec succès !',
      error: 'Une erreur s\'est produite lors de l\'opération.',
      warning: 'Attention, cette action pourrait avoir des conséquences.',
      info: 'Information importante à prendre en compte.'
    };
    
    notify[type](messages[type], {
      title: type.charAt(0).toUpperCase() + type.slice(1),
      duration: 5000
    });
  };
  
  // Simuler une erreur manuelle
  const triggerManualError = () => {
    handleError(
      errorMessage,
      errorType,
      {
        severity: errorType.includes('auth') || errorType.includes('server') ? 'error' : 'warning',
        details: `Erreur déclenchée manuellement de type ${errorType}`,
        showNotification: true
      }
    );
  };
  
  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        <BugIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Démonstration du système de gestion d'erreurs
      </Typography>
      
      <Typography variant="body1" paragraph>
        Cette page permet de tester différents scénarios d'erreurs et de voir comment ils sont gérés par notre système centralisé.
      </Typography>
      
      <Divider sx={{ my: 3 }} />
      
      {/* Configuration des erreurs */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Configuration de l'erreur
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="error-type-label">Type d'erreur</InputLabel>
              <Select
                labelId="error-type-label"
                value={errorType}
                label="Type d'erreur"
                onChange={(e) => setErrorType(e.target.value)}
              >
                {errorTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {React.cloneElement(type.icon, { fontSize: 'small', sx: { mr: 1 } })}
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Message d'erreur"
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Démonstrations */}
      <Grid container spacing={3}>
        {/* Erreurs API */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <NetworkIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Erreurs API
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Simule une erreur lors d'une requête API asynchrone. L'erreur sera interceptée et gérée par notre hook useErrorHandler.
              </Typography>
              
              {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <CircularProgress />
                </Box>
              )}
            </CardContent>
            
            <CardActions>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={simulateApiError}
                disabled={isLoading}
              >
                Simuler une erreur API
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Erreurs synchrones */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <CodeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Erreurs synchrones
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Simule une erreur synchrone dans un bloc try/catch. L'erreur sera capturée et gérée par notre fonction tryCatch.
              </Typography>
            </CardContent>
            
            <CardActions>
              <Button 
                variant="contained" 
                color="secondary" 
                onClick={simulateSyncError}
              >
                Simuler une erreur synchrone
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Erreurs de rendu */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <BugIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Erreurs de rendu
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Simule une erreur lors du rendu d'un composant. L'erreur sera capturée par le composant ErrorBoundary.
              </Typography>
              
              {showBuggyComponent && <BuggyComponent />}
            </CardContent>
            
            <CardActions>
              <Button 
                variant="contained" 
                color="error" 
                onClick={() => setShowBuggyComponent(true)}
                disabled={showBuggyComponent}
              >
                Afficher composant avec erreur
              </Button>
              
              <Button 
                variant="outlined" 
                onClick={() => setShowBuggyComponent(false)}
                disabled={!showBuggyComponent}
              >
                Masquer composant
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Erreurs différées */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Erreurs différées
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Simule une erreur qui se produit après un délai. Utile pour tester la gestion des erreurs asynchrones.
              </Typography>
              
              {showDelayedError && <DelayedErrorComponent />}
            </CardContent>
            
            <CardActions>
              <Button 
                variant="contained" 
                color="warning" 
                onClick={() => setShowDelayedError(true)}
                disabled={showDelayedError}
              >
                Déclencher erreur différée
              </Button>
              
              <Button 
                variant="outlined" 
                onClick={() => setShowDelayedError(false)}
                disabled={!showDelayedError}
              >
                Annuler
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Notifications */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Notifications
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Teste différents types de notifications qui peuvent être affichées par le système.
              </Typography>
            </CardContent>
            
            <CardActions>
              <Button 
                variant="outlined" 
                color="success" 
                onClick={() => showNotification('success')}
              >
                Succès
              </Button>
              
              <Button 
                variant="outlined" 
                color="error" 
                onClick={() => showNotification('error')}
              >
                Erreur
              </Button>
              
              <Button 
                variant="outlined" 
                color="warning" 
                onClick={() => showNotification('warning')}
              >
                Avertissement
              </Button>
              
              <Button 
                variant="outlined" 
                color="info" 
                onClick={() => showNotification('info')}
              >
                Info
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Erreur manuelle */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <ErrorIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Erreur manuelle
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Déclenche manuellement une erreur via le service de gestion d'erreurs. Utile pour les erreurs détectées par la logique métier.
              </Typography>
            </CardContent>
            
            <CardActions>
              <Button 
                variant="contained" 
                color="error" 
                onClick={triggerManualError}
              >
                Déclencher erreur manuelle
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 4 }}>
        <Alert severity="info">
          <Typography variant="body2">
            <strong>Note:</strong> Toutes les erreurs sont enregistrées dans la console et peuvent être envoyées à un service de suivi des erreurs comme Sentry si configuré.
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default ErrorHandlingDemo;
