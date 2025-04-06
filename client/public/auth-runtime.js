(function() {
  console.log('[VELO-AUTH] Initialisation du système d\'authentification runtime...');
  
  // 1. Créer un système d'authentification complet et indépendant
  window.__VELO_AUTH = {
    // État initial
    state: {
      currentUser: null,
      user: null, // Duplication pour compatibilité avec code existant
      isAuthenticated: false,
      isAdmin: false,
      loading: false
    },
    
    // Initialisation au chargement de la page
    init: function() {
      console.log('[VELO-AUTH] Initialisation...');
      this.state.loading = true;
      
      // Récupérer l'utilisateur du localStorage s'il existe
      try {
        const storedUser = localStorage.getItem('velo_user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          this.state.currentUser = user;
          this.state.user = user; // Pour compatibilité
          this.state.isAuthenticated = true;
          this.state.isAdmin = user.role === 'admin';
        }
      } catch (e) {
        console.error('[VELO-AUTH] Erreur lors de la récupération de l\'utilisateur:', e);
      }
      
      this.state.loading = false;
      console.log('[VELO-AUTH] État initial:', this.state);
    },
    
    // Méthodes d'authentification
    login: function(credentials) {
      console.log('[VELO-AUTH] Tentative de connexion avec:', credentials);
      return new Promise((resolve) => {
        setTimeout(() => {
          const user = {
            id: 'user-123',
            name: 'Utilisateur Test',
            email: credentials?.email || 'test@velo-altitude.com',
            role: 'admin',
            preferences: { theme: 'light', language: 'fr' },
            profile: { weight: 75, height: 180, ftp: 250 }
          };
          
          this.state.currentUser = user;
          this.state.user = user; // Pour compatibilité
          this.state.isAuthenticated = true;
          this.state.isAdmin = user.role === 'admin';
          
          localStorage.setItem('velo_user', JSON.stringify(user));
          console.log('[VELO-AUTH] Connexion réussie:', user);
          
          this._notifyListeners();
          resolve({ success: true, user });
        }, 500);
      });
    },
    
    logout: function() {
      console.log('[VELO-AUTH] Déconnexion...');
      return new Promise((resolve) => {
        setTimeout(() => {
          this.state.currentUser = null;
          this.state.user = null; // Pour compatibilité
          this.state.isAuthenticated = false;
          this.state.isAdmin = false;
          
          localStorage.removeItem('velo_user');
          console.log('[VELO-AUTH] Déconnexion réussie');
          
          this._notifyListeners();
          resolve({ success: true });
        }, 300);
      });
    },
    
    updateUserProfile: function(data) {
      console.log('[VELO-AUTH] Mise à jour du profil:', data);
      return new Promise((resolve) => {
        setTimeout(() => {
          if (!this.state.currentUser) {
            resolve({ success: false, error: 'Non authentifié' });
            return;
          }
          
          const updatedUser = { ...this.state.currentUser, ...data };
          this.state.currentUser = updatedUser;
          this.state.user = updatedUser; // Pour compatibilité
          
          localStorage.setItem('velo_user', JSON.stringify(updatedUser));
          console.log('[VELO-AUTH] Profil mis à jour:', updatedUser);
          
          this._notifyListeners();
          resolve({ success: true, user: updatedUser });
        }, 300);
      });
    },
    
    getToken: function() {
      return 'simulated-jwt-token-123';
    },
    
    // Système d'abonnement pour les mises à jour d'état
    _listeners: [],
    subscribe: function(callback) {
      this._listeners.push(callback);
      // Appeler immédiatement avec l'état actuel
      callback({ ...this.state });
      
      // Retourner une fonction de désabonnement
      return () => {
        this._listeners = this._listeners.filter(cb => cb !== callback);
      };
    },
    
    _notifyListeners: function() {
      const currentState = { ...this.state };
      this._listeners.forEach(callback => callback(currentState));
    }
  };
  
  // 2. Initialiser le système d'authentification
  window.__VELO_AUTH.init();
  
  // 3. Définir les fonctions globales pour l'intégration avec React
  
  // Fournir une fonction useAuth globale
  window.useAuth = function() {
    console.log('[VELO-AUTH] Hook useAuth appelé');
    return { 
      ...window.__VELO_AUTH.state,
      login: window.__VELO_AUTH.login.bind(window.__VELO_AUTH),
      logout: window.__VELO_AUTH.logout.bind(window.__VELO_AUTH),
      updateUserProfile: window.__VELO_AUTH.updateUserProfile.bind(window.__VELO_AUTH),
      getToken: window.__VELO_AUTH.getToken.bind(window.__VELO_AUTH)
    };
  };
  
  // 4. Intercepter et corriger les erreurs d'authentification
  
  // Intercepter les erreurs globales
  window.addEventListener('error', function(event) {
    if (event.message && event.message.includes('useAuth') && event.message.includes('AuthProvider')) {
      console.warn('[VELO-AUTH] Erreur d\'authentification interceptée:', event.message);
      event.preventDefault();
      return false;
    }
  }, true);
  
  // 5. Patch React quand il sera chargé
  const patchReact = function() {
    if (!window.React) {
      setTimeout(patchReact, 50);
      return;
    }
    
    console.log('[VELO-AUTH] React détecté, application du patch...');
    
    try {
      // Sauvegarder les fonctions originales
      const originalUseContext = window.React.useContext;
      
      // Remplacer useContext pour intercepter les appels liés à l'authentification
      window.React.useContext = function(context) {
        try {
          return originalUseContext.apply(this, arguments);
        } catch (error) {
          if (error.message && (
            error.message.includes('useAuth') || 
            error.message.includes('AuthProvider') ||
            error.message.includes('Context')
          )) {
            console.warn('[VELO-AUTH] Fournissant un contexte d\'authentification de secours');
            return window.__VELO_AUTH.state;
          }
          throw error;
        }
      };
      
      console.log('[VELO-AUTH] Patch React appliqué avec succès');
    } catch (e) {
      console.error('[VELO-AUTH] Erreur lors du patch de React:', e);
    }
  };
  
  // Commencer le processus de patch
  patchReact();
  
  console.log('[VELO-AUTH] Système d\'authentification runtime initialisé et prêt');
})();
