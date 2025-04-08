# Système d'authentification Velo-Altitude

## Architecture simplifiée

Le système d'authentification de Velo-Altitude utilise **exclusivement** Auth0 comme fournisseur d'identité, avec une architecture simplifiée :

1. **AuthCore.tsx** - Module central fournissant :
   - `AuthProvider` - Wrapper d'authentification principal
   - `useSafeAuth` - Hook React pour accéder à l'état d'authentification
   - `getAuthToken` - Fonction utilitaire sécurisée pour les contextes non-React

2. **authUtils.ts** - Utilitaires d'authentification pour contextes non-React :
   - `isAuthenticated()` - Vérifie si un utilisateur est authentifié
   - `getUserId()` - Récupère l'ID de l'utilisateur
   - `hasRole()` - Vérifie les rôles de l'utilisateur

3. **index.ts** - Point d'entrée exportant tous les éléments nécessaires

## Flux d'authentification

Le flux d'authentification standard est :

1. L'utilisateur accède à l'application
2. L'utilisateur clique sur "Se connecter"
3. Redirection vers Auth0 (OAuth2/OIDC)
4. Authentication sur Auth0
5. Redirection vers l'application avec un token
6. Le SDK Auth0 gère le token et son rafraîchissement
7. Les appels API utilisent automatiquement le token via l'intercepteur

## Gestion des tokens

Les tokens sont gérés **exclusivement** par le SDK Auth0 :

1. Le token est stocké en mémoire par le SDK Auth0 (pas directement dans localStorage)
2. L'intercepteur d'API utilise `getAuthToken()` pour obtenir le token actuel
3. Le rafraîchissement est géré automatiquement par Auth0
4. Aucun accès direct au localStorage n'est utilisé pour les tokens

## Intégration avec les intercepteurs API

L'intercepteur API (dans `apiConfig.js`) récupère le token via `getAuthToken()`, qui :

1. Obtient le token directement depuis le SDK Auth0 via `getAccessTokenSilently()`
2. Renvoie null en cas d'erreur ou si non authentifié
3. Évite tout accès direct à localStorage

## Utilisation dans les composants React

```tsx
import { useSafeAuth } from '../auth';

const MyComponent = () => {
  const { isAuthenticated, user, login, logout } = useSafeAuth();
  
  if (!isAuthenticated) {
    return <button onClick={login}>Se connecter</button>;
  }
  
  return (
    <div>
      <p>Bienvenue, {user?.name}</p>
      <button onClick={logout}>Se déconnecter</button>
    </div>
  );
};
```

## Utilisation dans les services (non-React)

```ts
import { isAuthenticated, getUserId } from '../auth/authUtils';

// Dans un service ou utilitaire
const someFunction = () => {
  if (isAuthenticated()) {
    const userId = getUserId();
    // Faire quelque chose avec l'ID utilisateur
  }
};
```

## Sécurité

Cette implémentation offre plusieurs avantages de sécurité :

1. **Pas de localStorage** pour les tokens sensibles
2. Rafraîchissement automatique des tokens via Auth0
3. Tokens limités en durée de vie
4. Protection XSS grâce à l'encapsulation dans le SDK Auth0
5. Validation des tokens côté serveur

## Variables d'environnement requises

```
REACT_APP_AUTH0_ISSUER_BASE_URL (ou AUTH0_ISSUER_BASE_URL)
REACT_APP_AUTH0_CLIENT_ID (ou AUTH0_CLIENT_ID)
REACT_APP_AUTH0_AUDIENCE (ou AUTH0_AUDIENCE)
REACT_APP_AUTH0_SCOPE (ou AUTH0_SCOPE)
```
