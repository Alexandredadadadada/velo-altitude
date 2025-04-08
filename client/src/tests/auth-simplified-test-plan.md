# Plan de tests d'intégration pour le système d'authentification simplifié

## 1. Prérequis

- Environnement de développement local en cours d'exécution
- Serveur API accessible
- MSW désactivé pour les tests d'intégration réels

## 2. Tests d'authentification Auth0

1. **Test de connexion réussie**
   - Accéder à la page de connexion
   - Se connecter via Auth0
   - Vérifier la redirection vers le dashboard
   - Vérifier que l'utilisateur est bien authentifié
   - **Validation**: L'utilisateur est connecté et redirigé correctement

2. **Test d'authentification persistante**
   - Se connecter une première fois
   - Rafraîchir la page
   - **Validation**: L'authentification persiste sans nouvelle connexion

3. **Test d'accès protégé**
   - Essayer d'accéder à une route protégée sans être connecté
   - Vérifier la redirection vers la page de connexion
   - Se connecter
   - **Validation**: Redirection vers la page initialement demandée

4. **Test de déconnexion**
   - Se connecter
   - Se déconnecter
   - **Validation**: L'utilisateur est bien déconnecté et redirigé vers la page d'accueil

## 3. Tests d'intégration API

1. **Test d'en-têtes d'authentification**
   - Se connecter
   - Effectuer une requête API protégée
   - Examiner les requêtes réseau via les outils développeur
   - **Validation**: Le token Auth0 est correctement inclus dans l'en-tête Authorization

2. **Test du refresh token automatique**
   - Se connecter
   - Attendre l'expiration du token ou simuler une erreur 401
   - Effectuer une requête API
   - **Validation**: Le token est automatiquement rafraîchi et la requête réussit

3. **Test d'accès API non authentifié**
   - Se déconnecter
   - Tenter d'accéder à une API protégée
   - **Validation**: Erreur 401 reçue correctement

4. **Test d'accès API authentifié**
   - Se connecter
   - Accéder à une API protégée
   - **Validation**: La requête réussit avec un statut 200

## 4. Tests des utilitaires d'authentification

1. **Test de getAuthToken()**
   - Se connecter
   - Exécuter `getAuthToken()` dans la console
   - **Validation**: Un token valide est retourné

2. **Test des utilitaires authUtils**
   - Se connecter
   - Exécuter `isAuthenticated()` dans la console
   - **Validation**: Retourne true quand connecté, false quand déconnecté

## 5. Tests de gestion d'erreurs

1. **Test de configuration Auth0 manquante**
   - Modifier temporairement les variables d'environnement Auth0
   - Recharger l'application
   - **Validation**: Message d'erreur approprié affiché

2. **Test d'erreur d'API**
   - Se connecter
   - Simuler une erreur d'API (ex: URL invalide)
   - **Validation**: Gestion gracieuse de l'erreur avec message utilisateur approprié

## 6. Procédure de test manuel complet

1. S'assurer que MSW est désactivé
2. Lancer l'application avec `npm start`
3. Exécuter chaque test, en notant les résultats
4. Vérifier l'absence de références au système de secours supprimé

## 7. Critères de succès

- ✅ Authentification réussie avec Auth0
- ✅ Persistence de l'authentification après rafraîchissement
- ✅ Protection des routes fonctionnelle
- ✅ Tokens d'authentification correctement inclus dans les requêtes API
- ✅ Rafraîchissement automatique des tokens fonctionnel
- ✅ Déconnexion fonctionnelle
- ✅ Utilitaires d'authentification (getAuthToken, isAuthenticated) fonctionnels
- ✅ Gestion gracieuse des erreurs
