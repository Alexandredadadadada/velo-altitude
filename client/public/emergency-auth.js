// Script d'authentification d'urgence - Solution de transition vers l'application React
(function() {
  console.log("[EMERGENCY-AUTH] Initialisation du mode d'authentification d'urgence...");
  
  // Constantes pour les routes
  const HOME_ROUTE = '/';
  const DASHBOARD_EMERGENCY = 'emergency-dashboard.html';
  const LOGIN_EMERGENCY = 'emergency-login.html';
  
  // Extraction des paramètres d'URL pour la détection de mode
  const urlParams = new URLSearchParams(window.location.search);
  const fromEmergency = urlParams.has('fromEmergency') || localStorage.getItem('emergency_access') === 'true';
  const targetModule = urlParams.get('module') || localStorage.getItem('last_module');
  
  // Première étape: vérifier si nous sommes sur une page d'authentification ou la page principale
  if (window.location.pathname === '/' || 
      window.location.pathname === '' || 
      window.location.pathname.includes('login') || 
      window.location.pathname.includes('auth')) {
    
    // Vérifier si l'utilisateur est déjà connecté
    const storedUser = localStorage.getItem('velo_user');
    
    // Si l'utilisateur vient d'une redirection d'urgence, essayer l'interface React
    if (storedUser && (fromEmergency || localStorage.getItem('try_standard_interface') === 'true')) {
      console.log("[EMERGENCY-AUTH] Tentative d'accès à l'interface React standard");
      // Nettoyer les drapeaux de redirection pour éviter les boucles
      localStorage.removeItem('try_standard_interface');
      
      // Permettre à l'application React de se charger normalement
      setupReactAuthContext(storedUser);
      return;
    }
    
    // Si l'utilisateur est connecté mais pas de redirection, aller au dashboard d'urgence
    if (storedUser && !fromEmergency) {
      console.log("[EMERGENCY-AUTH] Utilisateur déjà connecté, redirection vers le dashboard d'urgence");
      window.location.replace(DASHBOARD_EMERGENCY);
      return;
    }
    
    // Si non connecté, redirection vers le login d'urgence
    if (!storedUser) {
      console.log("[EMERGENCY-AUTH] Redirection vers la page d'authentification d'urgence");
      window.location.replace(LOGIN_EMERGENCY);
      return;
    }
  }
  
  // Si nous sommes sur le tableau de bord, vérifier l'authentification
  if (window.location.pathname.includes('dashboard')) {
    const storedUser = localStorage.getItem('velo_user');
    if (!storedUser) {
      console.log("[EMERGENCY-AUTH] Accès non autorisé au dashboard, redirection vers login");
      window.location.replace(LOGIN_EMERGENCY);
      return;
    }
  }
  
  // Pour les routes spécifiques des modules React, injecter le contexte d'authentification
  if (window.location.pathname.match(/\/(mountain|cols|training|nutrition|weather|community|profile|visualization)/)) {
    console.log("[EMERGENCY-AUTH] Module React détecté, injection du contexte d'authentification");
    
    // Vérifier si l'utilisateur est authentifié
    const storedUser = localStorage.getItem('velo_user');
    if (!storedUser) {
      console.log("[EMERGENCY-AUTH] Utilisateur non authentifié, redirection vers la page de login d'urgence");
      window.location.replace(LOGIN_EMERGENCY);
      return;
    }
    
    // Injecter le contexte d'authentification pour les modules React
    setupReactAuthContext(storedUser);
    return;
  }
  
  // Pour les autres pages, fournir un contexte d'authentification global
  console.log("[EMERGENCY-AUTH] Page non-auth détectée, injection du contexte d'authentification global");
  
  // Vérifier si l'utilisateur est authentifié
  const storedUser = localStorage.getItem('velo_user');
  if (!storedUser) {
    console.log("[EMERGENCY-AUTH] Utilisateur non authentifié, redirection vers la page de login d'urgence");
    window.location.replace(LOGIN_EMERGENCY);
    return;
  }
  
  // Fonction pour configurer le contexte d'authentification React
  function setupReactAuthContext(storedUserData) {
    try {
      const userData = JSON.parse(storedUserData);
      
      // Injecter un useAuth global pour les pages React
      window.useAuth = function() {
        return {
          currentUser: userData,
          user: userData,
          isAuthenticated: !!userData.id,
          isAdmin: userData.role === 'admin',
          loading: false,
          login: (email, password) => {
            console.log("[EMERGENCY-AUTH] Tentative de connexion:", email);
            return Promise.resolve(userData);
          },
          logout: () => { 
            localStorage.removeItem('velo_user'); 
            localStorage.removeItem('velo_token');
            window.location.replace(LOGIN_EMERGENCY);
          },
          updateUserProfile: (data) => {
            console.log("[EMERGENCY-AUTH] Mise à jour du profil:", data);
            const updatedUser = { ...userData, ...data };
            localStorage.setItem('velo_user', JSON.stringify(updatedUser));
            return Promise.resolve(updatedUser);
          }
        };
      };
      
      // Créer une fonction AuthProvider globale
      window.AuthProvider = function(props) {
        return props.children;
      };
      
    } catch (error) {
      console.error("[EMERGENCY-AUTH] Erreur lors de la configuration du contexte React:", error);
    }
  }
  
  // Intercepter toutes les erreurs d'authentification
  window.addEventListener('error', function(event) {
    if (event.message && (
      event.message.includes('useAuth') || 
      event.message.includes('AuthProvider') ||
      event.message.includes('Context')
    )) {
      console.warn("[EMERGENCY-AUTH] Erreur d'authentification interceptée:", event.message);
      event.preventDefault();
      
      // Si l'erreur persiste malgré notre intervention, rediriger vers la page de login d'urgence
      const errorCount = parseInt(sessionStorage.getItem('auth_error_count') || '0') + 1;
      sessionStorage.setItem('auth_error_count', errorCount);
      
      if (errorCount > 2) {
        console.error("[EMERGENCY-AUTH] Trop d'erreurs d'authentification, redirection vers le dashboard d'urgence");
        window.location.replace(DASHBOARD_EMERGENCY);
      }
      
      return false;
    }
  }, true);
  
  // Patcher React quand il sera chargé
  const patchReact = function() {
    if (!window.React) {
      setTimeout(patchReact, 50);
      return;
    }
    
    try {
      console.log("[EMERGENCY-AUTH] Patch React avancé en cours...");
      
      // Sauvegarder les fonctions originales
      const originalCreateContext = window.React.createContext;
      const originalUseContext = window.React.useContext;
      
      // Mock pour tous les contextes d'authentification
      const mockAuthContext = {
        Provider: function(props) { return props.children; },
        Consumer: function(props) { return props.children(window.useAuth()); }
      };
      
      // Remplacer createContext
      window.React.createContext = function(defaultValue, name) {
        if (name && (name.includes('Auth') || name.includes('auth'))) {
          console.log("[EMERGENCY-AUTH] Contexte d'authentification intercepté:", name);
          return mockAuthContext;
        }
        return originalCreateContext.apply(this, arguments);
      };
      
      // Remplacer useContext pour intercepter les appels liés à l'authentification
      window.React.useContext = function(context) {
        try {
          return originalUseContext.apply(this, arguments);
        } catch (error) {
          console.warn("[EMERGENCY-AUTH] Erreur useContext interceptée:", error.message);
          if (error.message && (
            error.message.includes('useAuth') || 
            error.message.includes('AuthProvider') ||
            error.message.includes('Context')
          )) {
            return window.useAuth();
          }
          throw error;
        }
      };
      
      // Si nous venons du mode d'urgence, signaler que nous sommes prêts à utiliser les modules React
      if (fromEmergency && targetModule) {
        console.log("[EMERGENCY-AUTH] Transition du mode d'urgence vers le module React:", targetModule);
        // Nettoyer les drapeaux de transition
        localStorage.removeItem('emergency_access');
        localStorage.removeItem('last_module');
      }
      
      console.log("[EMERGENCY-AUTH] Patch React appliqué avec succès");
    } catch (e) {
      console.error("[EMERGENCY-AUTH] Erreur lors du patch de React:", e);
    }
  };
  
  // Démarrer le processus de patch
  patchReact();
  
  console.log("[EMERGENCY-AUTH] Système d'authentification d'urgence activé");
})();
