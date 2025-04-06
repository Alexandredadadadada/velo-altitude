/**
 * auth-diagnostic.js
 * Outil de diagnostic pour le système d'authentification Velo-Altitude
 * 
 * Ce script permet de simuler différents scénarios d'authentification
 * pour tester le flux complet et le basculement vers le mode d'urgence.
 */
(function() {
  console.log('[AUTH-DIAGNOSTIC] Initialisation des outils de diagnostic d\'authentification v1.0');
  
  // Objet global pour le diagnostic
  window.VeloAuthDiagnostic = {
    // État du diagnostic
    state: {
      initialized: false,
      testMode: null,
      startTime: Date.now(),
      events: [],
      errors: []
    },
    
    // Initialiser le diagnostic
    init: function() {
      // Détecter le mode de test à partir des paramètres d'URL
      const urlParams = new URLSearchParams(window.location.search);
      const testMode = urlParams.get('auth_test');
      
      if (testMode) {
        this.state.testMode = testMode;
        this.state.initialized = true;
        
        console.log(`[AUTH-DIAGNOSTIC] Mode de test détecté: ${testMode}`);
        this.logEvent('init', `Mode de test: ${testMode}`);
        
        // Appliquer le comportement spécifique au mode de test
        this._applyTestMode(testMode);
      }
      
      // Écouter les erreurs globales
      window.addEventListener('error', (event) => {
        this.logError('global', event.message, event.error);
      });
      
      // Écouter les événements d'authentification
      document.addEventListener('authStateChange', (event) => {
        this.logEvent('authStateChange', event.detail);
      });
      
      return this;
    },
    
    // Appliquer le comportement spécifique au mode de test
    _applyTestMode: function(mode) {
      switch(mode) {
        case 'auth0':
          // Test standard Auth0, ne rien faire de spécial
          this.logEvent('testSetup', 'Mode Auth0 standard activé');
          break;
          
        case 'failure':
          // Simuler un échec d'Auth0
          this.logEvent('testSetup', 'Simulation d\'échec Auth0 activée');
          this._injectAuth0Failure();
          break;
          
        case 'emergency':
          // Forcer le mode d'urgence
          this.logEvent('testSetup', 'Mode d\'urgence forcé');
          localStorage.setItem('emergency_access', 'true');
          break;
          
        default:
          this.logEvent('testSetup', `Mode inconnu: ${mode}, aucune action spécifique`);
      }
    },
    
    // Injecter un comportement d'échec pour Auth0
    _injectAuth0Failure: function() {
      // Marquer Auth0 comme devant échouer
      localStorage.setItem('auth0_simulate_error', 'true');
      
      // Si window.Auth0 existe déjà, le remplacer par une version qui échoue
      if (window.Auth0) {
        const originalAuth0 = window.Auth0;
        window.Auth0 = {
          ...originalAuth0,
          authorize: function() {
            console.error('[AUTH-DIAGNOSTIC] Échec simulé de Auth0.authorize()');
            setTimeout(() => {
              const error = new Error('Auth0 simulated failure');
              if (originalAuth0._events && originalAuth0._events.error) {
                originalAuth0._events.error.forEach(callback => callback(error));
              }
            }, 1000);
          }
        };
      }
      
      // Intercepter les appels futurs à createAuth0Client
      const originalCreateAuth0Client = window.createAuth0Client;
      if (originalCreateAuth0Client) {
        window.createAuth0Client = function() {
          console.error('[AUTH-DIAGNOSTIC] Échec simulé de createAuth0Client');
          return Promise.reject(new Error('Auth0 simulated failure'));
        };
      }
      
      this.logEvent('inject', 'Échec Auth0 injecté');
    },
    
    // Journaliser un événement
    logEvent: function(type, data) {
      const event = {
        time: new Date(),
        elapsed: Date.now() - this.state.startTime,
        type: type,
        data: data
      };
      
      this.state.events.push(event);
      console.log(`[AUTH-DIAGNOSTIC] [${type}] ${JSON.stringify(data)}`);
      
      // Émettre un événement personnalisé
      const customEvent = new CustomEvent('veloAuthDiagnosticEvent', { detail: event });
      document.dispatchEvent(customEvent);
      
      return event;
    },
    
    // Journaliser une erreur
    logError: function(source, message, error) {
      const errorEntry = {
        time: new Date(),
        elapsed: Date.now() - this.state.startTime,
        source: source,
        message: message,
        error: error ? (error.stack || error.toString()) : null
      };
      
      this.state.errors.push(errorEntry);
      console.error(`[AUTH-DIAGNOSTIC] [ERROR] [${source}] ${message}`, error);
      
      // Émettre un événement personnalisé
      const customEvent = new CustomEvent('veloAuthDiagnosticError', { detail: errorEntry });
      document.dispatchEvent(customEvent);
      
      return errorEntry;
    },
    
    // Obtenir un résumé du diagnostic
    getSummary: function() {
      return {
        testMode: this.state.testMode,
        initialized: this.state.initialized,
        duration: Date.now() - this.state.startTime,
        eventCount: this.state.events.length,
        errorCount: this.state.errors.length,
        authState: {
          auth0User: localStorage.getItem('velo_altitude_user') ? JSON.parse(localStorage.getItem('velo_altitude_user')) : null,
          emergencyUser: localStorage.getItem('velo_user') ? JSON.parse(localStorage.getItem('velo_user')) : null,
          emergencyMode: localStorage.getItem('emergency_access') === 'true',
          auth0SimulateError: localStorage.getItem('auth0_simulate_error') === 'true'
        }
      };
    },
    
    // Réinitialiser l'état d'authentification
    resetAuth: function() {
      localStorage.removeItem('velo_user');
      localStorage.removeItem('velo_altitude_user');
      localStorage.removeItem('auth0_simulate_error');
      localStorage.removeItem('emergency_access');
      localStorage.removeItem('velo_token');
      localStorage.removeItem('auth_redirected');
      
      this.logEvent('reset', 'État d\'authentification réinitialisé');
      
      return true;
    }
  };
  
  // Initialiser automatiquement si un mode de test est détecté
  if (window.location.search.includes('auth_test')) {
    window.VeloAuthDiagnostic.init();
  }
  
  // Exposer une fonction pour envoyer des résultats de diagnostic à la fenêtre parente
  window.sendDiagnosticToParent = function() {
    if (window.opener && window.VeloAuthDiagnostic) {
      const summary = window.VeloAuthDiagnostic.getSummary();
      window.opener.postMessage({ type: 'auth-diagnostic', data: summary }, '*');
      return true;
    }
    return false;
  };
  
  console.log('[AUTH-DIAGNOSTIC] Outils de diagnostic chargés et prêts');
})();
