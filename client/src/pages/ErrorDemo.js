/**
 * Page de démonstration du système de gestion d'erreurs
 * Cette page montre comment utiliser les différents composants
 * et hooks liés à la gestion d'erreurs
 */

import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Divider,
  Breadcrumbs as MuiBreadcrumbs,
  Link,
  Alert,
  AlertTitle
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { 
  BugReport as BugIcon,
  Home as HomeIcon,
  ArrowRight as ArrowRightIcon
} from '@mui/icons-material';

// Composants
import ErrorBoundary from '../components/common/ErrorBoundary';
import ErrorHandlingDemo from '../components/demo/ErrorHandlingDemo';
import Breadcrumbs from '../components/common/Breadcrumbs';

// Hooks
import useErrorHandler from '../hooks/useErrorHandler';

const ErrorDemo = () => {
  const { handleError } = useErrorHandler();
  
  // Fonction appelée lorsque l'ErrorBoundary capture une erreur
  const handleBoundaryError = (error, errorInfo) => {
    // Enregistrer l'erreur dans notre service centralisé
    handleError(
      error.message || 'Erreur non gérée dans le composant',
      'component_error',
      {
        details: errorInfo?.componentStack,
        severity: 'error',
        showNotification: true
      }
    );
    
    // Vous pourriez également envoyer l'erreur à un service de suivi comme Sentry
    console.error('Erreur capturée par ErrorBoundary:', error);
    console.error('Informations sur le composant:', errorInfo);
  };
  
  return (
    <Box>
      <Breadcrumbs 
        items={[
          { label: 'Accueil', path: '/' },
          { label: 'Démo Gestion d\'Erreurs', path: '/error-demo' }
        ]} 
      />
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            <BugIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 'inherit' }} />
            Démonstration du Système de Gestion d'Erreurs
          </Typography>
          
          <Typography variant="subtitle1" color="text.secondary" paragraph>
            Cette page présente les différentes fonctionnalités du système centralisé de gestion d'erreurs
            et montre comment les erreurs sont capturées, traitées et affichées à l'utilisateur.
          </Typography>
          
          <Divider sx={{ my: 3 }} />
        </Box>
        
        <Alert severity="info" sx={{ mb: 4 }}>
          <AlertTitle>Guide d'utilisation</AlertTitle>
          <Typography variant="body2">
            Cette page de démonstration vous permet de tester différents scénarios d'erreurs et de voir comment ils sont gérés.
            Vous pouvez déclencher des erreurs API, des erreurs synchrones, des erreurs de rendu et voir comment le système
            les capture et les affiche à l'utilisateur.
          </Typography>
        </Alert>
        
        {/* Wrapper avec ErrorBoundary pour capturer les erreurs */}
        <ErrorBoundary onError={handleBoundaryError}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <ErrorHandlingDemo />
          </Paper>
        </ErrorBoundary>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Comment ça fonctionne ?
          </Typography>
          
          <Typography variant="body1" paragraph>
            Le système de gestion d'erreurs est composé de plusieurs éléments :
          </Typography>
          
          <Box component="ul" sx={{ pl: 4 }}>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1">
                <strong>ErrorService</strong> : Service centralisé qui gère toutes les erreurs de l'application
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1">
                <strong>useErrorHandler</strong> : Hook React qui expose les fonctionnalités du service d'erreurs
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1">
                <strong>ErrorBoundary</strong> : Composant qui capture les erreurs dans l'arbre de composants enfants
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1">
                <strong>NotificationSystem</strong> : Système d'affichage des notifications pour informer l'utilisateur
              </Typography>
            </Box>
          </Box>
          
          <Typography variant="body1" paragraph>
            Ensemble, ces éléments forment un système robuste qui permet de gérer les erreurs de manière cohérente
            et d'offrir une expérience utilisateur optimale même en cas de problème.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default ErrorDemo;
