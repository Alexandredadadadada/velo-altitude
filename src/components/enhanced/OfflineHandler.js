import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Snackbar, 
  Alert, 
  CircularProgress,
  useTheme
} from '@mui/material';
import { WifiOff, Refresh, CloudOff } from '@mui/icons-material';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

/**
 * OfflineHandler
 * Composant pour gérer les états hors ligne et les erreurs de réseau
 * Utilisé principalement dans l'Explorateur de Cols pour la gestion des données météo
 */
const OfflineHandler = ({ 
  isOffline = false, 
  hasCache = false, 
  lastUpdated = null,
  onRetry = () => {},
  onUseCache = () => {},
  children 
}) => {
  const theme = useTheme();
  const [showNotification, setShowNotification] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [networkStatus, setNetworkStatus] = useState({
    online: navigator.onLine,
    wasOffline: false
  });

  // Écouter les changements de connectivité
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(prev => ({ 
        online: true, 
        wasOffline: !prev.online 
      }));
      
      if (!isOffline) {
        setShowNotification(true);
      }
    };

    const handleOffline = () => {
      setNetworkStatus({ online: false, wasOffline: false });
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/offlinehandler"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOffline]);

  // Gérer la tentative de reconnexion
  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } catch (error) {
      console.error('Erreur lors de la tentative de reconnexion:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  // Utiliser les données en cache
  const handleUseCache = () => {
    onUseCache();
  };

  // Formater la date de dernière mise à jour
  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return 'Date inconnue';
    
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} à ${date.toLocaleTimeString()}`;
  };

  // Si tout va bien, afficher le contenu normal
  if (!isOffline) {
    return (
      <>
        {children}
        <Snackbar
          open={showNotification && networkStatus.wasOffline}
          autoHideDuration={5000}
          onClose={() => setShowNotification(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="success" onClose={() => setShowNotification(false)}>
            Connexion rétablie. Les données sont à jour.
          </Alert>
        </Snackbar>
        <Snackbar
          open={showNotification && !networkStatus.online}
          autoHideDuration={5000}
          onClose={() => setShowNotification(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="warning" onClose={() => setShowNotification(false)}>
            Vous êtes hors ligne. Certaines fonctionnalités peuvent être limitées.
          </Alert>
        </Snackbar>
      </>
    );
  }

  // Afficher un message d'erreur si hors ligne
  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        minHeight: 300,
        backgroundColor: theme.palette.background.default,
        borderRadius: 2
      }}
    >
      <WifiOff sx={{ fontSize: 60, color: theme.palette.warning.main, mb: 2 }} />
      
      <Typography variant="h5" gutterBottom>
        Problème de connexion
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500 }}>
        Impossible de récupérer les données météo actuelles. Vérifiez votre connexion internet et réessayez.
      </Typography>
      
      {hasCache && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, width: '100%', maxWidth: 450 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            <CloudOff fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
            Données en cache disponibles
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 1 }}>
            Dernière mise à jour: {formatLastUpdated(lastUpdated)}
          </Typography>
          
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={handleUseCache}
            fullWidth
            sx={{ mt: 1 }}
          >
            Utiliser les données en cache
          </Button>
        </Box>
      )}
      
      <Button
        variant="contained"
        color="primary"
        startIcon={isRetrying ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
        onClick={handleRetry}
        disabled={isRetrying}
      >
        {isRetrying ? 'Tentative en cours...' : 'Réessayer'}
      </Button>
    </Paper>
  );
};

export default OfflineHandler;
