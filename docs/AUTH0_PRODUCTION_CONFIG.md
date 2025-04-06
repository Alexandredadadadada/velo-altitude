# Configuration Auth0 pour l'environnement de production Netlify

Ce document détaille la configuration Auth0 requise pour le déploiement de Velo-Altitude sur Netlify.

## Prérequis

- Une application Auth0 déjà créée
- Accès au tableau de bord Auth0
- Accès au tableau de bord Netlify

## Configuration des URLs de callback

Pour que l'authentification fonctionne correctement en production, configurez les URLs suivantes dans les paramètres de l'application Auth0 :

### 1. URLs de callback autorisées

```
https://velo-altitude.netlify.app/callback
https://velo-altitude.netlify.app/api/auth/callback
https://*.netlify.app/callback
https://*.netlify.app/api/auth/callback
http://localhost:3000/callback
```

### 2. URLs de déconnexion autorisées

```
https://velo-altitude.netlify.app
https://*.netlify.app
http://localhost:3000
```

### 3. Origines Web autorisées (CORS)

```
https://velo-altitude.netlify.app
https://*.netlify.app
http://localhost:3000
```

## Configuration des règles Auth0

### 1. Règle pour ajouter les rôles utilisateur au token ID

Créez une nouvelle règle avec le code suivant :

```javascript
function addRolesToIdToken(user, context, callback) {
  const namespace = 'https://velo-altitude.netlify.app';
  const assignedRoles = (context.authorization || {}).roles || [];

  const idTokenClaims = context.idToken || {};
  idTokenClaims[`${namespace}/roles`] = assignedRoles;
  
  context.idToken = idTokenClaims;
  callback(null, user, context);
}
```

### 2. Règle pour l'authentification silencieuse

```javascript
function enhanceSilentAuth(user, context, callback) {
  // Si l'origine de la requête est notre application
  if (context.request.query && context.request.query.prompt === 'none') {
    // Configurer le contexte pour permettre l'authentification silencieuse
    context.sessionManager = {
      updateLastLogin: false
    };
  }
  
  callback(null, user, context);
}
```

## Variables d'environnement à configurer sur Netlify

Assurez-vous que les variables suivantes sont définies dans les paramètres de déploiement Netlify :

```
AUTH0_AUDIENCE=https://velo-altitude.netlify.app/api
AUTH0_BASE_URL=https://velo-altitude.netlify.app
AUTH0_CLIENT_ID=votre_client_id
AUTH0_CLIENT_SECRET=votre_client_secret
AUTH0_ISSUER_BASE_URL=https://votre-domaine.auth0.com
AUTH0_SCOPE=openid profile email offline_access
AUTH0_SECRET=une_valeur_secrete_aleatoire_generee
```

## Test de l'authentification en production

Après le déploiement, testez les scénarios suivants :

1. **Authentification standard Auth0**
   - Connectez-vous via la page de connexion normale
   - Vérifiez que vous êtes correctement redirigé après la connexion
   - Vérifiez que le token est correctement stocké

2. **Authentification avec le mode d'urgence**
   - Ajoutez `?emergency=true` à l'URL pour forcer le mode d'urgence
   - Vérifiez que vous pouvez vous connecter avec les identifiants de secours
   - Vérifiez l'accès aux fonctionnalités de base

3. **Déconnexion et actualisation de session**
   - Déconnectez-vous et reconnectez-vous
   - Restez inactif pendant un moment puis essayez d'accéder à une section protégée
   - Vérifiez que la session est rafraîchie automatiquement

## Résolution des problèmes courants

### Erreur "Login required"
- Vérifiez que les URLs de callback sont correctement configurées
- Assurez-vous que le client ID et le domaine Auth0 sont corrects

### Erreur CORS
- Vérifiez que toutes les origines web sont autorisées dans Auth0
- Assurez-vous que la Content Security Policy dans netlify.toml est correcte

### Redirection en boucle
- Vérifiez la configuration des règles Auth0
- Assurez-vous que le script auth-override.js est correctement déployé
