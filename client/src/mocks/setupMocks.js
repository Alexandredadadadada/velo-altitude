/**
 * Configuration des mocks pour le développement
 * 
 * Ce script initialise les mocks MSW uniquement en mode développement.
 * Il est importé dans le fichier index.js de l'application.
 */

import { setupWorker } from 'msw';
import handlers from './handlers';

// Configuration du worker MSW si nous sommes en environnement de développement
const isDevEnvironment = process.env.NODE_ENV === 'development';

// Fonction qui initialise et démarre le worker MSW
export const setupMocks = async () => {
  if (isDevEnvironment) {
    // Configuration du worker avec nos handlers
    const worker = setupWorker(...handlers);
    
    // Démarrer le worker avec un message de console
    return worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: `${process.env.PUBLIC_URL}/mockServiceWorker.js`,
      },
    })
    .then(() => {
      console.log('[MSW] Service worker démarré avec succès');
    })
    .catch((error) => {
      console.error('[MSW] Erreur lors du démarrage du service worker:', error);
    });
  }
  
  // Si nous ne sommes pas en environnement de développement, ne rien faire
  return Promise.resolve();
};

export default setupMocks;
