import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Polyfills de base
import 'core-js/stable';
import 'regenerator-runtime/runtime';

// Gestionnaire d'erreurs global pour diagnostiquer l'écran blanc
window.addEventListener('error', (event) => {
  console.error('Erreur globale capturée:', event.error);
  
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

// Log d'initialisation pour débogage
console.log('Initialisation de l'application React Velo-Altitude...');
console.log('Mode d'environnement:', process.env.NODE_ENV);
console.log('URL de base:', process.env.PUBLIC_URL || '/');

// Rendu de base sans wrapper complexe
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Mesure des performances
reportWebVitals();
