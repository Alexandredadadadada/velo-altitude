/**
 * Système d'authentification d'urgence
 * Ce fichier permet de contourner l'authentification Auth0 en cas de problème
 * Il est chargé uniquement si le mode d'urgence est activé
 */

(function() {
  window.EmergencyAuthSystem = {
    enabled: false,
    version: '1.0.0',
    
    // Active le système d'authentification d'urgence
    enable: function() {
      this.enabled = true;
      console.log('Système d\'authentification d\'urgence activé');
      
      // Stocke l'état dans le localStorage
      localStorage.setItem('emergency_auth_enabled', 'true');
      
      // Déclenche un événement pour notifier l'application
      window.dispatchEvent(new CustomEvent('emergency-auth-enabled'));
    },
    
    // Désactive le système d'authentification d'urgence
    disable: function() {
      this.enabled = false;
      console.log('Système d\'authentification d\'urgence désactivé');
      
      // Supprime l'état du localStorage
      localStorage.removeItem('emergency_auth_enabled');
      
      // Déclenche un événement pour notifier l'application
      window.dispatchEvent(new CustomEvent('emergency-auth-disabled'));
    },
    
    // Vérifie si le système d'authentification d'urgence est activé
    isEnabled: function() {
      return this.enabled || localStorage.getItem('emergency_auth_enabled') === 'true';
    },
    
    // Fournit un token JWT factice pour les tests
    getEmergencyToken: function() {
      return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlbWVyZ2VuY3ktdXNlciIsIm5hbWUiOiJVdGlsaXNhdGV1ciBkXCd1cmdlbmNlIiwiaWF0IjoxNTE2MjM5MDIyLCJlbWFpbCI6ImVtZXJnZW5jeUB2ZWxvLWFsdGl0dWRlLmNvbSIsInJvbGUiOiJhZG1pbiJ9.KVoaCEystA9jsAl0ZkLzfQJWwr3oxPjGu2JGFuIQKeg';
    }
  };
  
  // Initialisation automatique
  document.addEventListener('DOMContentLoaded', function() {
    // Vérifie si le mode d'urgence est activé au démarrage
    if (window.EmergencyAuthSystem.isEnabled()) {
      window.EmergencyAuthSystem.enable();
    }
  });
})();
