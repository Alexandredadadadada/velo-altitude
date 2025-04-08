import 'core-js/stable';
import 'regenerator-runtime/runtime';

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.tsx';
// import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './auth';
import { BrowserRouter as Router } from 'react-router-dom';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import ReactQueryProvider from './contexts/ReactQueryProvider';
import { RealApiOrchestratorProvider } from './contexts/RealApiOrchestratorProvider';
import { setupPerformanceMonitoring } from './performance/setupMonitoring';

// Initialisation de MSW en développement uniquement
if (process.env.NODE_ENV === 'development') {
  console.log('[MSW] Préparation du service worker...');
  const { setupMSW } = require('./mocks/browser');
  setupMSW();
  
  // Exposer l'API RealApiOrchestrator dans window pour le débogage
  import('./contexts/RealApiOrchestratorProvider')
    .then(module => {
      window.apiOrchestrator = module.getRealApiOrchestrator();
      console.log('[DEBUG] RealApiOrchestrator disponible via window.apiOrchestrator');
    })
    .catch(err => console.error('[DEBUG] Erreur lors de l\'exposition de RealApiOrchestrator:', err));
}

// Import pour le checker MSW (uniquement en développement)
if (process.env.NODE_ENV === 'development') {
  import('./mocks/msw-completeness-checker')
    .then(() => console.log('MSW Completeness Checker chargé'))
    .catch(err => console.error('Erreur lors du chargement du MSW Checker:', err));
}

// Gestionnaire d'erreurs global pour diagnostiquer l'écran blanc
window.addEventListener('error', (event) => {
  // Afficher un message d'erreur visible sur la page
  if (document.getElementById('root')) {
    document.getElementById('root').innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; max-width: 800px; margin: 0 auto; line-height: 1.5;">
        <h1 style="color: #d32f2f;">Une erreur est survenue</h1>
        <p>Détails de l'erreur pour le diagnostic :</p>
        <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px; overflow: auto; font-size: 14px;">${event.error?.stack || event.message || 'Erreur non identifiée'}</pre>
        <p>Veuillez contacter l'équipe technique avec ces informations.</p>
        <button onclick="window.location.reload()" style="background: #1976d2; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer;">Recharger la page</button>
      </div>
    `;
  }
});

// Création de la racine React de manière simple et fiable
const root = ReactDOM.createRoot(document.getElementById('root'));

// Rendu avec la hiérarchie de composants correcte
root.render(
  <React.StrictMode>
    <ReactQueryProvider>
      <AuthProvider>
        <RealApiOrchestratorProvider>
          <Router basename={process.env.PUBLIC_URL || '/'}>
            <App />
          </Router>
        </RealApiOrchestratorProvider>
      </AuthProvider>
    </ReactQueryProvider>
  </React.StrictMode>
);

// Initialisation du système de monitoring de performance
const performanceMonitor = setupPerformanceMonitoring({
  enableWebVitals: true,
  enableDevPanel: process.env.NODE_ENV === 'development',
  debug: process.env.NODE_ENV === 'development'
});

// Exposer l'API de monitoring dans window pour le débogage en développement
if (process.env.NODE_ENV === 'development') {
  window.perfMonitor = performanceMonitor;
}

// Enregistrer le service worker pour les fonctionnalités PWA
serviceWorkerRegistration.register();
