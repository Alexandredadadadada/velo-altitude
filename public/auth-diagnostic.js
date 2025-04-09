/**
 * Diagnostic du système d'authentification
 * Cet outil permet de diagnostiquer les problèmes d'authentification
 * et de fournir des solutions pour les résoudre
 */

(function() {
  window.AuthDiagnosticTool = {
    version: '1.0.0',
    
    // Démarre le diagnostic complet
    runDiagnostic: function() {
      console.log('🔍 Démarrage du diagnostic d\'authentification...');
      
      const results = {
        timestamp: new Date().toISOString(),
        environment: this.detectEnvironment(),
        auth0Configured: this.checkAuth0Config(),
        tokenPresent: this.checkTokenPresence(),
        tokenValid: this.validateToken(),
        apiReachable: this.checkApiReachability(),
        browserCompatibility: this.checkBrowserCompatibility(),
        cookiesEnabled: this.checkCookiesEnabled(),
        localStorageAvailable: this.checkLocalStorage()
      };
      
      console.log('📊 Résultats du diagnostic:', results);
      
      // Suggérer des solutions basées sur les résultats
      this.suggestSolutions(results);
      
      return results;
    },
    
    // Détecte l'environnement d'exécution
    detectEnvironment: function() {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'development';
      } else if (hostname.includes('netlify.app')) {
        return 'staging';
      } else {
        return 'production';
      }
    },
    
    // Vérifie si Auth0 est correctement configuré
    checkAuth0Config: function() {
      const config = window.VELO_ALTITUDE_CONFIG?.auth0;
      return {
        configured: !!config,
        clientId: !!config?.clientId,
        domain: !!config?.domain,
        audience: !!config?.audience
      };
    },
    
    // Vérifie la présence d'un token
    checkTokenPresence: function() {
      const token = localStorage.getItem('auth_token') || 
                   localStorage.getItem('id_token') || 
                   sessionStorage.getItem('auth_token');
      return !!token;
    },
    
    // Valide basiquement la structure du token
    validateToken: function() {
      let token = localStorage.getItem('auth_token') || 
                 localStorage.getItem('id_token') || 
                 sessionStorage.getItem('auth_token');
      
      if (!token) return false;
      
      try {
        // Vérifier que le token a 3 parties
        const parts = token.split('.');
        return parts.length === 3;
      } catch (error) {
        return false;
      }
    },
    
    // Vérifie si l'API est accessible
    checkApiReachability: function() {
      // Simuler la vérification - dans une vraie implémentation,
      // cela ferait un fetch vers un endpoint de santé
      return navigator.onLine;
    },
    
    // Vérifie la compatibilité du navigateur
    checkBrowserCompatibility: function() {
      const features = {
        fetch: typeof fetch !== 'undefined',
        promises: typeof Promise !== 'undefined',
        localStorage: typeof localStorage !== 'undefined',
        sessionStorage: typeof sessionStorage !== 'undefined'
      };
      
      return features;
    },
    
    // Vérifie si les cookies sont activés
    checkCookiesEnabled: function() {
      try {
        document.cookie = "testcookie=1";
        const cookieEnabled = document.cookie.indexOf("testcookie") !== -1;
        document.cookie = "testcookie=1; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        return cookieEnabled;
      } catch (e) {
        return false;
      }
    },
    
    // Vérifie si localStorage est disponible
    checkLocalStorage: function() {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
      } catch (e) {
        return false;
      }
    },
    
    // Suggère des solutions basées sur les résultats du diagnostic
    suggestSolutions: function(results) {
      console.log('💡 Suggestions de solutions:');
      
      if (!results.auth0Configured.configured) {
        console.log('- Configuration Auth0 manquante. Vérifiez les variables d\'environnement ou activez le mode d\'authentification d\'urgence.');
      }
      
      if (!results.tokenPresent) {
        console.log('- Aucun token d\'authentification trouvé. Essayez de vous reconnecter ou utilisez le système d\'authentification d\'urgence.');
      }
      
      if (!results.tokenValid && results.tokenPresent) {
        console.log('- Token présent mais invalide. Le token pourrait être expiré ou corrompu. Essayez de vous déconnecter puis de vous reconnecter.');
      }
      
      if (!results.cookiesEnabled) {
        console.log('- Les cookies sont désactivés. Activez les cookies dans votre navigateur pour permettre l\'authentification.');
      }
      
      if (!results.localStorageAvailable) {
        console.log('- localStorage n\'est pas disponible. Vérifiez les paramètres de confidentialité de votre navigateur.');
      }
      
      // Si tout semble correct mais que l'authentification échoue quand même
      if (results.auth0Configured.configured && results.tokenPresent && results.tokenValid && 
          results.cookiesEnabled && results.localStorageAvailable) {
        console.log('- Tous les prérequis semblent corrects. Le problème pourrait être lié au serveur d\'authentification. Essayez d\'activer le mode d\'authentification d\'urgence.');
      }
    },
    
    // Active le mode d'authentification d'urgence
    enableEmergencyAuth: function() {
      if (window.EmergencyAuthSystem && typeof window.EmergencyAuthSystem.enable === 'function') {
        window.EmergencyAuthSystem.enable();
        return true;
      }
      return false;
    }
  };
})();
