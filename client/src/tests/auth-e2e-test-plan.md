# Plan de tests d'intégration pour RealApiOrchestrator et authentification

## 1. Prérequis

- Environnement de développement local en cours d'exécution
- Serveur API accessible
- MSW temporairement désactivé pour les tests d'intégration réels

## 2. Tests d'authentification

### 2.1 Authentification principale (Auth0)

1. **Test de connexion réussie**
   - Accéder à la page de connexion
   - Saisir des identifiants valides
   - Vérifier la redirection vers le dashboard
   - Vérifier que le token est correctement stocké

2. **Test d'authentification persistante**
   - Se connecter une première fois
   - Rafraîchir la page
   - Vérifier que l'authentification persiste
   - Vérifier que le jeton est automatiquement rafraîchi au besoin

3. **Test d'accès protégé**
   - Essayer d'accéder à une route protégée sans être connecté
   - Vérifier la redirection vers la page de connexion
   - Se connecter
   - Vérifier la redirection vers la page initialement demandée

### 2.2 Système de secours (fallback)

1. **Test de basculement automatique**
   - Simuler une erreur de connexion Auth0
   - Vérifier l'activation du système de secours (auth-override.js)
   - Vérifier que l'authentification fonctionne malgré l'échec d'Auth0

2. **Test d'emergency-login**
   - Accéder directement à la page emergency-login.html
   - Se connecter avec les identifiants de secours
   - Vérifier la redirection et l'état authentifié

## 3. Tests du RealApiOrchestrator

### 3.1 Intégration avec l'authentification

1. **Test d'en-têtes d'authentification**
   - Examiner les requêtes réseau via les outils développeur
   - Vérifier que le token est correctement inclus dans l'en-tête Authorization
   - Vérifier que le token est automatiquement renouvelé si nécessaire

### 3.2 Tests des méthodes API principales

1. **Test getUserProfile**
   - Se connecter
   - Appeler `getUserProfile` via la console
   - Vérifier la réception des données utilisateur correctes

2. **Test getAllCols**
   - Appeler `getAllCols` via la console
   - Vérifier la réception de la liste complète des cols

3. **Test endpoint protégé**
   - Se déconnecter
   - Essayer d'appeler un endpoint protégé
   - Vérifier l'erreur 401
   - Se reconnecter
   - Vérifier que le même appel fonctionne désormais

## 4. Tests de gestion d'erreurs

1. **Test de timeout**
   - Simuler une connexion lente
   - Vérifier le comportement de l'application
   - Vérifier l'affichage des messages d'erreur appropriés

2. **Test serveur indisponible**
   - Couper la connexion du serveur API
   - Effectuer une requête
   - Vérifier la gestion gracieuse de l'erreur
   - Vérifier les messages utilisateur appropriés

## 5. Procédure de test manuel complet

1. Désactiver MSW temporairement (commenter `setupMSW()` dans index.js)
2. Lancer l'application avec `npm start`
3. Exécuter chaque test, en notant les résultats
4. Réactiver MSW une fois les tests terminés

## 6. Critères de succès

- ✅ Authentification réussie avec Auth0
- ✅ Basculement vers le système de secours fonctionnel
- ✅ Tous les appels API via RealApiOrchestrator fonctionnent
- ✅ Gestion cohérente des erreurs
- ✅ Tokens d'authentification correctement gérés
