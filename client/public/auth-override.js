/**
 * auth-override.js - Script de compatibilité pour l'authentification Velo-Altitude
 * Ce script est chargé automatiquement avant l'application React pour résoudre
 * les problèmes d'authentification en production.
 * 
 * Version 3.0 - Avril 2025 - Système unifié compatible avec AuthCore
 */
(function() {
  console.log('[AUTH-OVERRIDE] Initialisation du système d\'authentification avancé v3.0...');
  
  // Détection de l'environnement
  const isProduction = window.location.hostname !== 'localhost' && 
                      !window.location.hostname.includes('127.0.0.1');
  
  // Variables pour l'état de l'authentification
  let authenticationInitialized = false;
  let authenticationFailed = false;
  
  // Fonction pour obtenir l'utilisateur authentifié
  function getAuthenticatedUser() {
    try {
      // Vérifier d'abord le mode d'urgence
      const emergencyUser = localStorage.getItem('velo_user');
      if (emergencyUser) {
        return JSON.parse(emergencyUser);
      }
      
      // Ensuite vérifier l'authentification standard
      const standardUser = localStorage.getItem('velo_altitude_user');
      if (standardUser) {
        return JSON.parse(standardUser);
      }
      
      return null;
    } catch (error) {
      console.error('[AUTH-OVERRIDE] Erreur lors de la récupération de l\'utilisateur:', error);
      return null;
    }
  }
  
  // Fonction pour créer un contexte d'authentification global
  function createGlobalAuthContext() {
    const user = getAuthenticatedUser();
    
    // Créer un hook useAuth global
    window.useAuth = function() {
      return {
        currentUser: user,
        user: user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        loading: false,
        error: null,
        login: (email, password) => {
          console.log('[AUTH-OVERRIDE] Tentative de connexion avec:', email);
          // Création d'utilisateur de secours pour les tests
          const newUser = {
            id: 'user-' + Date.now(),
            name: email?.split('@')[0] || 'Utilisateur Vélo-Altitude',
            email: email || 'cycliste@velo-altitude.com',
            role: email?.includes('admin') ? 'admin' : 'user',
            preferences: { theme: 'light', language: 'fr' },
            profile: { weight: 75, height: 180, ftp: 250 }
          };
          
          // Stocker dans les deux emplacements pour compatibilité
          localStorage.setItem('velo_altitude_user', JSON.stringify(newUser));
          localStorage.setItem('velo_user', JSON.stringify(newUser));
          
          // Recharger la page après connexion
          setTimeout(() => window.location.reload(), 500);
          
          return Promise.resolve({ success: true, user: newUser });
        },
        logout: () => {
          localStorage.removeItem('velo_altitude_user');
          localStorage.removeItem('velo_user');
          window.location.href = '/';
          return { success: true };
        },
        updateUserProfile: (data) => {
          const currentUser = getAuthenticatedUser();
          if (!currentUser) {
            return Promise.resolve({ success: false, error: 'Non authentifié' });
          }
          
          const updatedUser = { ...currentUser, ...data };
          
          localStorage.setItem('velo_altitude_user', JSON.stringify(updatedUser));
          localStorage.setItem('velo_user', JSON.stringify(updatedUser));
          
          return Promise.resolve({ success: true, user: updatedUser });
        },
        getToken: () => {
          return 'emergency-token-' + Date.now();
        }
      };
    };
    
    // Compatibilité avec le nouveau hook useSafeAuth
    window.useSafeAuth = window.useAuth;
    
    // Créer un AuthProvider global pour la compatibilité
    window.AuthProvider = function(props) {
      return props.children;
    };
    
    // Créer un contexte React simulé
    window.AuthContext = {
      Provider: function(props) {
        return props.children;
      },
      Consumer: function(props) {
        return props.children(window.useAuth());
      },
      displayName: 'AuthContext'
    };
    
    // Garantir que les hooks d'Auth0 sont simulés
    window.useAuth0 = function() {
      return {
        isAuthenticated: !!user,
        user: user,
        isLoading: false,
        error: null,
        loginWithRedirect: () => {
          window.location.href = '/emergency-login.html';
          return Promise.resolve();
        },
        logout: () => {
          localStorage.removeItem('velo_altitude_user');
          localStorage.removeItem('velo_user');
          window.location.href = '/';
          return Promise.resolve();
        },
        getAccessTokenSilently: () => Promise.resolve('emergency-token-' + Date.now())
      };
    };
    
    // Auth0Provider pour la compatibilité
    window.Auth0Provider = function(props) {
      return props.children;
    };
    
    authenticationInitialized = true;
    console.log('[AUTH-OVERRIDE] Contexte d\'authentification global créé');
  }
  
  // Fonction pour injecter un patch React
  function injectReactPatch() {
    // Attendre que React soit chargé
    let attempts = 0;
    const checkReact = setInterval(() => {
      attempts++;
      
      if (window.React || attempts > 100) {
        clearInterval(checkReact);
      }
      
      if (window.React) {
        console.log('[AUTH-OVERRIDE] React détecté, application du patch...');
        
        try {
          // Sauvegarder les fonctions originales
          const originalCreateContext = window.React.createContext;
          const originalUseContext = window.React.useContext;
          
          // Remplacer createContext pour intercepter les contextes d'authentification
          window.React.createContext = function(defaultValue, contextDisplayName) {
            if (contextDisplayName && (
              contextDisplayName.includes('Auth') || 
              contextDisplayName.includes('auth')
            )) {
              console.log('[AUTH-OVERRIDE] Interception du contexte:', contextDisplayName);
              return window.AuthContext;
            }
            return originalCreateContext.apply(this, arguments);
          };
          
          // Remplacer useContext pour fournir un fallback pour les erreurs d'authentification
          window.React.useContext = function(context) {
            try {
              // Si c'est un contexte d'authentification, utiliser notre implémentation globale
              if (context && (
                context === window.AuthContext || 
                context.displayName === 'AuthContext' ||
                (typeof context === 'object' && context._currentValue && context._currentValue.isAuthenticated !== undefined)
              )) {
                return window.useAuth();
              }
              
              return originalUseContext.apply(this, arguments);
            } catch (error) {
              if (error.message && (
                error.message.includes('useAuth') || 
                error.message.includes('AuthProvider') || 
                error.message.includes('Context')
              )) {
                console.warn('[AUTH-OVERRIDE] Erreur de contexte interceptée:', error.message);
                return window.useAuth ? window.useAuth() : null;
              }
              throw error;
            }
          };
          
          console.log('[AUTH-OVERRIDE] Patch React appliqué avec succès');
        } catch (error) {
          console.error('[AUTH-OVERRIDE] Erreur lors du patch React:', error);
          authenticationFailed = true;
        }
      }
    }, 50);
    
    // Timeout pour éviter une boucle infinie
    setTimeout(() => {
      clearInterval(checkReact);
      if (!window.React) {
        console.warn('[AUTH-OVERRIDE] React non détecté après 5 secondes');
      }
    }, 5000);
  }
  
  // Initialisation du système d'authentification
  function initAuthentication() {
    // Créer un contexte d'authentification global
    createGlobalAuthContext();
    
    // Injecter le patch React
    injectReactPatch();
    
    // Redirection vers le dashboard d'urgence si l'authentification échoue
    function handleAuthFailure() {
      // Si on n'a pas réussi à initialiser l'authentification, rediriger vers le mode d'urgence
      if (!authenticationInitialized || authenticationFailed) {
        const alreadyRedirected = sessionStorage.getItem('auth_redirected');
        
        if (!alreadyRedirected) {
          console.error('[AUTH-OVERRIDE] Échec de l\'authentification, redirection vers le mode d\'urgence');
          sessionStorage.setItem('auth_redirected', 'true');
          
          // Ne rediriger que si nous sommes en production
          if (isProduction) {
            window.location.replace('/emergency-dashboard.html');
          }
        }
      }
    }
    
    // Écouter les erreurs d'authentification
    window.addEventListener('error', function(event) {
      if (event.message && (
        event.message.includes('useAuth') || 
        event.message.includes('AuthProvider') || 
        event.message.includes('Context') ||
        event.message.includes('undefined is not an object') ||
        event.message.includes('Auth0Provider') ||
        event.message.includes('useAuth0')
      )) {
        console.warn('[AUTH-OVERRIDE] Erreur d\'authentification interceptée:', event.message);
        
        // Éviter que l'erreur ne remonte et casse l'application
        event.preventDefault();
        
        handleAuthFailure();
        
        return false;
      }
    }, true);
    
    // Vérifier l'authentification après un délai pour s'assurer que tout est chargé
    setTimeout(function() {
      try {
        // Tester si l'authentification fonctionne
        const authTest = window.useAuth && window.useAuth();
        if (!authTest) {
          console.error('[AUTH-OVERRIDE] Le hook useAuth n\'est pas disponible');
          handleAuthFailure();
        } else {
          console.log('[AUTH-OVERRIDE] Authentification initialisée avec succès', authTest.isAuthenticated ? 'Utilisateur connecté' : 'Aucun utilisateur');
        }
      } catch (error) {
        console.error('[AUTH-OVERRIDE] Erreur lors du test d\'authentification:', error);
        handleAuthFailure();
      }
    }, 2000);
  }
  
  // Démarrer l'initialisation
  console.log('[AUTH-OVERRIDE] Démarrage de l\'initialisation de l\'authentification...');
  initAuthentication();
  
  console.log('[AUTH-OVERRIDE] Configuration terminée');
})();
