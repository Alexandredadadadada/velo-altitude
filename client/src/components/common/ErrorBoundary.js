/**
 * Composant de gestion des erreurs (Error Boundary)
 * Ce composant capture les erreurs JavaScript dans l'arbre de composants enfants
 * et affiche une interface de secours élégante
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Divider,
  Stack,
  Collapse
} from '@mui/material';
import { 
  ErrorOutline as ErrorIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  Code as CodeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    // Mettre à jour l'état pour afficher l'UI de secours
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Capturer les détails de l'erreur pour l'affichage
    this.setState({ errorInfo });
    
    // Enregistrer l'erreur dans le service de gestion d'erreurs
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Envoyer l'erreur à un service de suivi comme Sentry
    // si configuré dans l'application
    if (window.ErrorTrackingService) {
      window.ErrorTrackingService.captureException(error, { extra: errorInfo });
    }
  }

  handleRefresh = () => {
    // Recharger la page actuelle
    window.location.reload();
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  render() {
    const { hasError, error, errorInfo, showDetails } = this.state;
    const { fallback, children } = this.props;
    
    // Si un fallback personnalisé est fourni, l'utiliser
    if (hasError && fallback) {
      return fallback(error, errorInfo, this.handleRefresh);
    }
    
    // Sinon, afficher l'UI de secours par défaut
    if (hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh',
            p: 3
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 800,
              width: '100%',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'error.light'
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom>
                Oups ! Quelque chose s'est mal passé
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Nous sommes désolés pour ce désagrément. L'erreur a été enregistrée et notre équipe technique a été informée.
              </Typography>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={this.handleRefresh}
              >
                Actualiser la page
              </Button>
              <Button
                variant="outlined"
                startIcon={<HomeIcon />}
                component={RouterLink}
                to="/"
              >
                Retour à l'accueil
              </Button>
            </Stack>
            
            <Box sx={{ mt: 3 }}>
              <Button
                variant="text"
                color="inherit"
                startIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={this.toggleDetails}
                sx={{ mb: 1 }}
              >
                {showDetails ? 'Masquer les détails techniques' : 'Afficher les détails techniques'}
              </Button>
              
              <Collapse in={showDetails}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    bgcolor: 'grey.100',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    overflow: 'auto',
                    maxHeight: 300
                  }}
                >
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="error" gutterBottom>
                      <CodeIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Erreur:
                    </Typography>
                    <Typography variant="body2">{error && error.toString()}</Typography>
                  </Box>
                  
                  {errorInfo && (
                    <Box>
                      <Typography variant="subtitle2" color="error" gutterBottom>
                        <CodeIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Stack Trace:
                      </Typography>
                      <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                        {errorInfo.componentStack}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Collapse>
            </Box>
          </Paper>
        </Box>
      );
    }
    
    // Si tout va bien, afficher les enfants normalement
    return children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.func,
  onError: PropTypes.func
};

export default ErrorBoundary;
