/**
 * Configuration MSW pour le navigateur
 * 
 * Ce fichier configure MSW pour intercepter les requêtes dans le navigateur
 * et les rediriger vers nos handlers mockés.
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Configuration du worker MSW
export const worker = setupWorker(...handlers);

// Fonction d'initialisation à appeler depuis index.js
export const setupMSW = () => {
  // Logs supprimés en production
  if (process.env.NODE_ENV === 'development') {
    console.log('[MSW] Initialisation du service worker MSW...');
    
    // Démarrer le worker avec un intervalle de réponse entre 100ms et 400ms
    worker.start({
      onUnhandledRequest: 'bypass', // Ne pas intercepter les requêtes non gérées
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
      // Ajouter un délai réaliste dans les réponses en développement
      responseTransformer: (res) => {
        // Uniquement si on est en développement
        if (process.env.NODE_ENV === 'development') {
          // Retarder toutes les réponses d'un temps aléatoire pour simuler un réseau réel
          return new Promise((resolve) => {
            const delay = Math.random() * 300 + 100; // entre 100ms et 400ms
            setTimeout(() => resolve(res), delay);
          });
        }
        return res;
      },
    });
  }
};

export default setupMSW;
