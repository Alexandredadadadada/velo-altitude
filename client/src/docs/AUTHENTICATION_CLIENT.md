# Documentation du Client d'Authentification Amélioré

## Introduction

Le client d'authentification amélioré (`EnhancedAuthClient`) est conçu pour gérer de manière robuste l'authentification des utilisateurs dans l'application Dashboard-Velo. Il assure la gestion des tokens JWT, y compris leur rotation, les périodes de grâce pour les tokens expirés, et la révocation sélective.

## Fonctionnalités principales

- **Rotation automatique des tokens** : Rafraîchit les tokens avant leur expiration
- **Gestion des périodes de grâce** : Permet l'utilisation temporaire d'un token expiré pendant la récupération d'un nouveau token
- **Empreinte client** : Identifie de manière unique les appareils pour renforcer la sécurité
- **Révocation sélective des tokens** : Permet de déconnecter un appareil spécifique sans affecter les autres
- **Gestion standardisée des erreurs** : Traite uniformément les différentes erreurs d'authentification
- **Événements d'authentification** : Émet des événements pour les changements d'état d'authentification

## Architecture

Le système d'authentification se compose de plusieurs modules complémentaires :

1. **EnhancedAuthClient** : Le coeur du système qui gère les tokens et les requêtes authentifiées
2. **ClientFingerprintService** : Génère des identifiants uniques pour chaque appareil
3. **ApiErrorInterceptor** : Intercepte et normalise les erreurs d'API, y compris les erreurs d'authentification
4. **AuthErrorHandler** : Composant React pour afficher des messages d'erreur appropriés aux utilisateurs

## Utilisation

### Initialisation

```javascript
import enhancedAuthClient from './services/enhancedAuthClient';

// Par défaut, une instance singleton est exportée et prête à l'emploi
// Pour une configuration personnalisée :
const customClient = new EnhancedAuthClient({
  baseUrl: '/api/v2/auth',
  refreshThreshold: 600, // 10 minutes
  graceEnabled: true
});
```

### Connexion

```javascript
try {
  const user = await enhancedAuthClient.login({
    email: 'utilisateur@exemple.com',
    password: 'mot_de_passe'
  });
  console.log('Connecté avec succès :', user);
} catch (error) {
  console.error('Erreur de connexion :', error.message);
}
```

### Requêtes authentifiées

```javascript
// Obtenir une fonction fetch authentifiée
const authFetch = await enhancedAuthClient.getAuthenticatedFetch();

// Utiliser cette fonction pour les requêtes API
const response = await authFetch('/api/profil', {
  method: 'GET'
});
const profile = await response.json();
```

### Vérification de l'authentification

```javascript
const isLoggedIn = await enhancedAuthClient.isAuthenticated();
if (isLoggedIn) {
  const userInfo = await enhancedAuthClient.getUserInfo();
  console.log('Utilisateur actuel :', userInfo);
}
```

### Déconnexion

```javascript
// Déconnexion simple (appareil actuel uniquement)
await enhancedAuthClient.logout();

// Déconnexion de tous les appareils
await enhancedAuthClient.logout(true);
```

## Gestion des erreurs

Le client gère automatiquement plusieurs scénarios d'erreur :

- **Token expiré** : Tente de rafraîchir automatiquement
- **Token révoqué** : Déconnecte l'utilisateur
- **Session expirée** : Déconnecte l'utilisateur et émet un événement
- **Changement d'appareil** : Détecte les tentatives d'utilisation de tokens sur des appareils différents

### Écoute des événements d'authentification

```javascript
window.addEventListener('auth:session-expired', () => {
  console.log('La session a expiré');
  // Rediriger vers la page de connexion
});

window.addEventListener('auth:token-revoked', () => {
  console.log('Le token a été révoqué');
  // Afficher une notification
});
```

## Intégration avec le composant AuthErrorHandler

```jsx
import AuthErrorHandler from '../components/auth/AuthErrorHandler';

function MyComponent() {
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const handleAuthError = (event) => {
      setAuthError(event.detail);
    };
    
    window.addEventListener('auth:error', handleAuthError);
    return () => {
      window.removeEventListener('auth:error', handleAuthError);
    };
  }, []);

  return (
    <div>
      {/* Contenu normal */}
      
      {authError && (
        <AuthErrorHandler
          errorCode={authError.code}
          errorMessage={authError.message}
          open={!!authError}
          onClose={() => setAuthError(null)}
        />
      )}
    </div>
  );
}
```

## Stockage des tokens

Par défaut, les tokens sont stockés dans le localStorage. Une classe personnalisée peut être fournie pour utiliser un stockage différent :

```javascript
class CustomTokenStore {
  async getAccessToken() { /* ... */ }
  async getRefreshToken() { /* ... */ }
  async setTokens(accessToken, refreshToken) { /* ... */ }
  async clearTokens() { /* ... */ }
}

const client = new EnhancedAuthClient({
  tokenStorage: new CustomTokenStore()
});
```

## Sécurité

Le client implémente plusieurs mesures de sécurité :

- **Empreintes client** : Vérifie que les tokens sont utilisés sur l'appareil d'origine
- **Rotations de token** : Minimise la durée de vie des tokens valides
- **Révocation des tokens** : Permet la déconnexion à distance des appareils
- **Validation de token côté client** : Vérifie l'expiration avant utilisation

## Bonnes pratiques

1. Toujours utiliser `getAuthenticatedFetch()` pour les requêtes API
2. Implémenter des gestionnaires pour les événements d'authentification
3. Utiliser le composant `AuthErrorHandler` pour une expérience utilisateur cohérente
4. Considérer l'utilisation de stockages sécurisés (cookies httpOnly) en production

## Dépannage

### Le rafraîchissement de token échoue constamment

Vérifiez que le backend est correctement configuré pour accepter les tokens de rafraîchissement et les empreintes client.

### Les sessions expirent trop rapidement

Ajustez le paramètre `refreshThreshold` pour commencer le rafraîchissement plus tôt avant l'expiration.

### Déconnexions inattendues

Vérifiez les journaux côté serveur pour les erreurs liées à la validation des empreintes client ou à la révocation des tokens.
