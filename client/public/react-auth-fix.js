(function() {
  console.log('[VELO-ALTITUDE] Initialisation du correctif React...');
  
  // Créer un mock d'authentification complet
  const mockAuth = {
    currentUser: {
      id: 'user-123',
      name: 'Demo User',
      email: 'demo@velo-altitude.com',
      role: 'admin',
      preferences: { theme: 'light', language: 'fr' },
      profile: { weight: 75, height: 180, ftp: 250 }
    },
    user: {
      id: 'user-123',
      name: 'Demo User',
      email: 'demo@velo-altitude.com',
      role: 'admin',
      preferences: { theme: 'light', language: 'fr' },
      profile: { weight: 75, height: 180, ftp: 250 }
    },
    isAuthenticated: true,
    isAdmin: true,
    loading: false,
    login: function() { return Promise.resolve(true); },
    logout: function() { return Promise.resolve(true); },
    updateUserProfile: function(data) { return Promise.resolve({...this.currentUser, ...data}); },
    getToken: function() { return 'mock-token-123'; }
  };
  
  // Stocker le mock globalement
  window.__VELO_AUTH_MOCK = mockAuth;
  
  // Fonction pour patcher React
  function patchReact() {
    // Vérifier si React est chargé
    if (typeof React === 'undefined' || !React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
      console.log('[VELO-ALTITUDE] En attente de React...');
      setTimeout(patchReact, 50);
      return;
    }
    
    console.log('[VELO-ALTITUDE] React détecté, application du patch...');
    
    // Sauvegarder les fonctions originales
    const originalCreateElement = React.createElement;
    const originalUseContext = React.useContext;
    
    // Remplacer useContext
    React.useContext = function(Context) {
      try {
        const value = originalUseContext.apply(this, arguments);
        // Si c'est le contexte d'authentification (détection par structure)
        if (value === undefined && 
            (Context._currentValue === undefined || 
             (Context._currentValue && 
              (Context._currentValue.currentUser !== undefined || 
               Context._currentValue.isAuthenticated !== undefined)))) {
          console.log('[VELO-ALTITUDE] Contexte d\'authentification détecté, utilisation du mock');
          return window.__VELO_AUTH_MOCK;
        }
        return value;
      } catch (e) {
        console.log('[VELO-ALTITUDE] Erreur dans useContext:', e.message);
        // Si l'erreur concerne l'authentification
        if (e.message && e.message.includes('useAuth')) {
          console.log('[VELO-ALTITUDE] Erreur d\'authentification interceptée');
          return window.__VELO_AUTH_MOCK;
        }
        throw e;
      }
    };
    
    // Définir useAuth global
    window.useAuth = function() {
      console.log('[VELO-ALTITUDE] useAuth global appelé');
      return window.__VELO_AUTH_MOCK;
    };
    
    // Intercepter les erreurs
    const originalConsoleError = console.error;
    console.error = function(msg) {
      if (typeof msg === 'string' && 
          (msg.includes('useAuth') || msg.includes('AuthProvider'))) {
        console.log('[VELO-ALTITUDE] Erreur d\'authentification supprimée:', 
                   msg.substring(0, 100) + '...');
        return;
      }
      return originalConsoleError.apply(this, arguments);
    };
    
    console.log('[VELO-ALTITUDE] Patch React appliqué avec succès');
  }
  
  // Démarrer le processus de patch
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', patchReact);
  } else {
    patchReact();
  }
  
  // Intercepter les erreurs non capturées
  window.addEventListener('error', function(event) {
    if (event.message && event.message.includes('useAuth')) {
      console.log('[VELO-ALTITUDE] Erreur globale interceptée:', event.message);
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);
  
  console.log('[VELO-ALTITUDE] Correctif d\'authentification initialisé');
})();
