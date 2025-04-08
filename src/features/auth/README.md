# Authentification Auth0 - Velo-Altitude

Ce document décrit l'implémentation de l'authentification Auth0 dans l'application Velo-Altitude.

## Architecture

L'authentification est structurée en plusieurs couches :

1. **Frontend** : Utilise le SDK Auth0 React
2. **API** : Fonctions Netlify sécurisées avec JWT
3. **Middleware** : Validation des tokens et vérification des permissions
4. **Redis** : Blacklist de tokens pour la révocation

## Composants

### Frontend
- `Auth0ProviderWithHistory` : Wrapper Auth0 qui gère les redirections et l'état
- `authContext` : Contexte React qui expose les fonctionnalités d'authentification
- `ProtectedRoute` : HOC pour sécuriser les routes avec Auth0 et vérifier les rôles
- `LoginPage` & `ProfilePage` : Pages d'authentification et de profil utilisateur
- `LoginButton` & `LogoutButton` : Composants réutilisables pour l'authentification
- `UnauthorizedPage` : Page affichée lors d'un accès non autorisé

### Backend (Netlify Functions)
- `auth.ts` : Middleware de validation JWT et vérification des permissions/rôles
- `api.ts` : Point d'entrée principal pour toutes les fonctions d'API
- `user.ts` : Routes API pour les opérations liées aux utilisateurs

## Configuration

### Variables d'environnement requises

```
# Auth0
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_AUDIENCE=https://api.velo-altitude.com
AUTH0_SCOPE=openid profile email offline_access
AUTH0_BASE_URL=http://localhost:3000
AUTH0_SECRET=a-long-secret-value

# Redis (pour le blacklisting de tokens)
REDIS_URL=redis://localhost:6379
```

## Flux d'authentification

1. L'utilisateur clique sur "Se connecter"
2. Redirection vers Auth0 pour l'authentification
3. Une fois authentifié, Auth0 redirige vers l'application
4. Le SDK Auth0 récupère les tokens et met à jour le contexte d'authentification
5. Les requêtes API incluent le token JWT dans l'en-tête Authorization
6. Les fonctions Netlify valident le token avant de traiter les requêtes

## Permissions et rôles

Les permissions et rôles sont stockés dans le token JWT sous les namespaces :
- `https://velo-altitude.com/roles` : Tableau des rôles de l'utilisateur
- `https://velo-altitude.com/permissions` : Tableau des permissions

### Rôles intégrés
- `user` : Utilisateur standard
- `premium` : Utilisateur avec accès Premium
- `admin` : Administrateur avec accès complet

### Vérification côté client
```typescript
// Vérifier un rôle
const { hasRole } = useAuth();
if (hasRole('premium')) {
  // Accès aux fonctionnalités premium
}

// Vérifier une permission
const { hasPermission } = useAuth();
if (hasPermission('read:data')) {
  // Afficher les données
}
```

### Vérification côté serveur
```typescript
// Dans les routes API
import { checkPermissions, checkRole } from '../middleware/auth';

// Route protégée par permission
router.get('/data', checkPermissions('read:data'), (req, res) => {
  // Traitement
});

// Route protégée par rôle
router.post('/admin', checkRole('admin'), (req, res) => {
  // Traitement admin
});
```

## Tests

Les tests unitaires pour l'authentification se trouvent dans `src/tests/auth/auth.test.ts`.

## Liste de vérification

- [x] Configuration Auth0 complète
- [x] Intégration Frontend avec Auth0 SDK
- [x] Protection des routes avec vérification des rôles
- [x] API sécurisée avec validation JWT
- [x] Gestion de blacklist de tokens
- [x] Tests unitaires pour l'authentification
- [x] Documentation complète

## Dépannage

### Le token est rejeté par l'API

Vérifiez que :
- L'audience du token correspond à `AUTH0_AUDIENCE`
- Le token n'est pas expiré
- Le token n'est pas dans la blacklist
- Les en-têtes CORS sont correctement configurés

### L'utilisateur est redirigé en boucle

Vérifiez :
- La configuration des URL de callback dans Auth0
- La variable `AUTH0_BASE_URL`
- La gestion des erreurs dans le callback

## Ressources

- [Documentation Auth0](https://auth0.com/docs)
- [SDK Auth0 React](https://github.com/auth0/auth0-react)
- [Fonctions Netlify](https://docs.netlify.com/functions/overview/)
