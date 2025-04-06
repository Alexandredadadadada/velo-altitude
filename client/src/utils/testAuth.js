/**
 * Script de test pour le système d'authentification
 * Exécuter dans la console du navigateur pour vérifier l'état de l'authentification
 */

// Fonction pour tester le mode normal vs mode d'urgence
function testAuthSystem() {
  console.group('🔒 TEST DU SYSTÈME D\'AUTHENTIFICATION VELO-ALTITUDE');
  
  // Vérifier si Auth0 est disponible
  const hasAuth0 = typeof window.Auth0Provider !== 'undefined';
  console.log(`Auth0 disponible: ${hasAuth0 ? '✅' : '❌'}`);
  
  // Vérifier les hooks d'authentification
  const hasAuthHook = typeof window.useAuth === 'function';
  const hasSafeAuthHook = typeof window.useSafeAuth === 'function';
  console.log(`Hook useAuth disponible: ${hasAuthHook ? '✅' : '❌'}`);
  console.log(`Hook useSafeAuth disponible: ${hasSafeAuthHook ? '✅' : '❌'}`);
  
  // Vérifier la présence des données utilisateur
  const hasStandardUser = !!localStorage.getItem('velo_altitude_user');
  const hasEmergencyUser = !!localStorage.getItem('velo_user');
  console.log(`Utilisateur standard trouvé: ${hasStandardUser ? '✅' : '❌'}`);
  console.log(`Utilisateur d'urgence trouvé: ${hasEmergencyUser ? '✅' : '❌'}`);
  
  // Tenter d'accéder à l'état d'authentification
  try {
    const authState = window.__VELO_AUTH_DEBUG__ = {
      auth0Available: hasAuth0,
      userHooks: {
        useAuth: hasAuthHook,
        useSafeAuth: hasSafeAuthHook
      },
      userData: {
        standard: hasStandardUser ? JSON.parse(localStorage.getItem('velo_altitude_user')) : null,
        emergency: hasEmergencyUser ? JSON.parse(localStorage.getItem('velo_user')) : null
      },
      authOverrideActive: typeof window.authOverrideInitialized !== 'undefined'
    };
    
    console.log('État global de l\'authentification:', authState);
    console.log(`Mode d'authentification actif: ${hasAuth0 ? 'Auth0' : 'Mode d\'urgence'}`);
    
    // Afficher un message résumant l'état
    if (hasStandardUser || hasEmergencyUser) {
      console.log('✅ SUCCÈS: Un utilisateur est authentifié, le système fonctionne.');
    } else if (hasAuth0) {
      console.log('ℹ️ INFO: Aucun utilisateur n\'est authentifié, mais Auth0 est disponible.');
    } else if (hasAuthHook || hasSafeAuthHook) {
      console.log('⚠️ ATTENTION: Aucun utilisateur n\'est authentifié et le système fonctionne en mode dégradé.');
    } else {
      console.log('❌ ERREUR: Le système d\'authentification ne fonctionne pas correctement.');
    }
  } catch (error) {
    console.error('Erreur lors du test d\'authentification:', error);
  }
  
  console.groupEnd();
  
  return 'Test d\'authentification terminé. Consultez la console pour les détails.';
}

// Exporter pour utilisation dans les tests
export default testAuthSystem;

// Auto-exécution pour faciliter les tests en console
if (typeof window !== 'undefined') {
  window.testVeloAuth = testAuthSystem;
  console.log('Fonction de test d\'authentification disponible via window.testVeloAuth()');
}
