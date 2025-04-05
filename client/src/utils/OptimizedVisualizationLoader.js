import React, { lazy, Suspense } from 'react';
import { Box, CircularProgress, Typography, useTheme, alpha } from '@mui/material';

/**
 * Utilitaire pour optimiser le chargement des visualisations complexes
 * Utilise React.lazy et Suspense pour le chargement différé des composants
 * 
 * Usage:
 * const OptimizedChart = OptimizedVisualizationLoader(() => import('./charts/ComplexChart'));
 */

/**
 * Crée un composant à chargement différé avec gestion de la suspense et des erreurs
 * @param {Function} importCallback - Fonction d'import dynamique du composant (ex: () => import('./MyComponent'))
 * @param {Object} options - Options de configuration
 * @param {string} options.fallbackText - Texte à afficher pendant le chargement
 * @param {string} options.errorText - Texte à afficher en cas d'erreur
 * @param {number} options.minLoadingTime - Temps minimal de chargement en ms pour éviter les flashs
 * @returns {React.Component} - Composant optimisé avec Suspense
 */
export const OptimizedVisualizationLoader = (
  importCallback, 
  { 
    fallbackText = "Chargement de la visualisation...", 
    errorText = "Impossible de charger la visualisation",
    minLoadingTime = 500 
  } = {}
) => {
  // Utilisation de lazy pour charger le composant uniquement lorsqu'il est nécessaire
  const LazyComponent = lazy(() => {
    // Simuler un temps de chargement minimal pour éviter les flashs
    return Promise.all([
      importCallback(),
      new Promise(resolve => setTimeout(resolve, minLoadingTime))
    ]).then(([moduleExport]) => moduleExport);
  });

  // Composant wrapper avec gestion de Suspense et ErrorBoundary
  return function OptimizedVisualization(props) {
    const theme = useTheme();

    // Fallback pendant le chargement
    const LoadingFallback = () => (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          height: props.height || 300,
          width: '100%',
          bgcolor: alpha(theme.palette.background.paper, 0.6),
          borderRadius: 2,
          p: 3
        }}
      >
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          {fallbackText}
        </Typography>
      </Box>
    );

    return (
      <ErrorBoundary errorText={errorText}>
        <Suspense fallback={<LoadingFallback />}>
          <LazyComponent {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  };
};

/**
 * Composant pour gérer les erreurs lors du chargement des visualisations
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // On pourrait envoyer l'erreur à un service de logging
    console.error("Erreur dans la visualisation :", error, errorInfo);
  }

  render() {
    const { errorText, children } = this.props;
    const theme = { palette: { error: { main: '#f44336' } } }; // Fallback si useTheme n'est pas disponible

    if (this.state.hasError) {
      return (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            height: 300,
            width: '100%',
            bgcolor: alpha(theme.palette.error.main, 0.05),
            borderRadius: 2,
            p: 3,
            border: `1px dashed ${alpha(theme.palette.error.main, 0.3)}`
          }}
        >
          <Typography variant="body2" color="error" sx={{ textAlign: 'center' }}>
            {errorText}
          </Typography>
        </Box>
      );
    }

    return children;
  }
}

/**
 * Utilitaire pour décharger les calculs intensifs vers un Web Worker
 * @param {Function} workerFunction - Fonction à exécuter dans le worker
 * @returns {Promise} - Promise qui se résout avec le résultat du worker
 */
export const runInWebWorker = (workerFunction, data) => {
  // Convertir la fonction en string pour l'envoyer au worker
  const fnString = `
    self.onmessage = function(e) {
      const result = (${workerFunction.toString()})(e.data);
      self.postMessage(result);
      self.close();
    }
  `;

  // Créer un blob contenant le code du worker
  const blob = new Blob([fnString], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);
  
  return new Promise((resolve, reject) => {
    // Créer un nouveau worker
    const worker = new Worker(workerUrl);
    
    // Configurer les gestionnaires d'événements
    worker.onmessage = (e) => {
      resolve(e.data);
      URL.revokeObjectURL(workerUrl); // Nettoyer l'URL
    };
    
    worker.onerror = (e) => {
      reject(new Error(`Worker error: ${e.message}`));
      URL.revokeObjectURL(workerUrl);
    };
    
    // Démarrer le worker avec les données
    worker.postMessage(data);
  });
};

/**
 * Exemple de fonction pour préparer des données intensives en CPU pour un graphique
 * @param {Object} rawData - Données brutes à traiter
 * @returns {Object} - Données traitées et optimisées pour l'affichage
 */
export const prepareChartDataInWorker = (rawData) => {
  return runInWebWorker((data) => {
    // Exemple de traitement intensif:
    // 1. Agréger les données
    // 2. Calculer des statistiques
    // 3. Formater pour Chart.js
    
    const result = {
      labels: [],
      datasets: []
    };
    
    // Simulation de traitement intensif
    if (data && data.points) {
      // Regrouper par catégories
      const categories = {};
      
      data.points.forEach(point => {
        if (!categories[point.category]) {
          categories[point.category] = [];
        }
        categories[point.category].push(point.value);
        
        if (!result.labels.includes(point.label)) {
          result.labels.push(point.label);
        }
      });
      
      // Créer un dataset pour chaque catégorie
      Object.entries(categories).forEach(([category, values]) => {
        result.datasets.push({
          label: category,
          data: values,
          // D'autres propriétés de configuration seraient ici
        });
      });
    }
    
    return result;
  }, rawData);
};

export default OptimizedVisualizationLoader;
