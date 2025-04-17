/**
 * Composant de gestion des erreurs pour l'application Velo-Altitude
 * Capture les erreurs dans les composants React et affiche une interface de secours
 */

import React from 'react';
import { Button, Typography, Box, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import RefreshIcon from '@mui/icons-material/Refresh';
import BugReportIcon from '@mui/icons-material/BugReport';

// Types pour les props et l'état
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

// Styles pour le conteneur d'erreur
const ErrorContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.error.light,
  color: theme.palette.error.contrastText,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    margin: theme.spacing(1),
  }
}));

const ErrorIcon = styled(BugReportIcon)(({ theme }) => ({
  fontSize: 64,
  color: theme.palette.error.main,
  marginBottom: theme.spacing(2),
}));

const ErrorDetails = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(0, 0, 0, 0.05)',
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  width: '100%',
  maxHeight: '200px',
  overflow: 'auto',
  textAlign: 'left',
  fontFamily: 'monospace',
  fontSize: '0.85rem',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
}));

/**
 * Composant d'affichage de l'erreur
 */
export const ErrorFallback: React.FC<{
  error: Error | null;
  resetErrorBoundary?: () => void;
}> = ({ error, resetErrorBoundary }) => (
  <ErrorContainer elevation={3}>
    <ErrorIcon />
    <Typography variant="h5" component="h2" gutterBottom>
      Oups, quelque chose s'est mal passé !
    </Typography>
    <Typography variant="body1" gutterBottom>
      Une erreur inattendue s'est produite lors du chargement de cette section.
    </Typography>
    
    {error && (
      <ErrorDetails>
        <strong>Message d'erreur :</strong> {error.message || 'Erreur inconnue'}
        {error.stack && (
          <>
            <br /><br />
            <strong>Détails techniques :</strong><br />
            {error.stack.split('\n').slice(0, 3).join('\n')}
          </>
        )}
      </ErrorDetails>
    )}
    
    <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
      <Button
        variant="contained"
        color="primary"
        startIcon={<RefreshIcon />}
        onClick={() => {
          if (resetErrorBoundary) {
            resetErrorBoundary();
          } else {
            window.location.reload();
          }
        }}
      >
        Réessayer
      </Button>
      <Button
        variant="outlined"
        color="primary"
        onClick={() => window.history.back()}
      >
        Retour
      </Button>
    </Box>
  </ErrorContainer>
);

/**
 * Composant de limite d'erreur principal
 * Capture les erreurs dans ses enfants et affiche une interface de secours
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error) {
    // Met à jour l'état pour afficher l'interface de secours
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Capture les détails de l'erreur
    this.setState({ errorInfo });
    
    // Log l'erreur pour le débogage
    console.error('Erreur capturée par ErrorBoundary:', error, errorInfo);
    
    // Appeler le callback onError si fourni
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Possibilité d'envoyer l'erreur à un service de monitoring
    // monitoringService.logError(error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Rendre le fallback personnalisé ou l'ErrorFallback par défaut
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <ErrorFallback
          error={this.state.error}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      );
    }

    // Rendre les enfants normalement s'il n'y a pas d'erreur
    return this.props.children;
  }
}

export default ErrorBoundary;
