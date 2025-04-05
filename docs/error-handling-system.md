# Système de Gestion d'Erreurs - Documentation

## Vue d'ensemble

Le système de gestion d'erreurs de Grand Est Cyclisme est conçu pour fournir une approche centralisée et cohérente pour gérer les erreurs dans toute l'application. Il permet de capturer, traiter et afficher les erreurs de manière élégante, améliorant ainsi l'expérience utilisateur et facilitant le débogage.

## Architecture

Le système est composé de plusieurs éléments clés qui travaillent ensemble :

1. **Hook useErrorHandler** : Un hook React personnalisé qui expose les fonctionnalités du service d'erreurs.
2. **Composant ErrorBoundary** : Un composant qui capture les erreurs dans l'arbre de composants enfants.
3. **Système de Notification** : Intégré au système d'erreurs pour afficher des messages à l'utilisateur.
4. **Service API** : Configuré avec des intercepteurs pour capturer et traiter les erreurs réseau.

## Fonctionnalités principales

### 1. Gestion des erreurs API

Le système intercepte automatiquement les erreurs de requêtes API et les traite de manière appropriée :

- Erreurs d'authentification (401, 403)
- Erreurs de validation (400)
- Erreurs serveur (500+)
- Erreurs réseau (timeout, pas de connexion)

### 2. Gestion des erreurs de rendu

Le composant `ErrorBoundary` capture les erreurs qui se produisent pendant le rendu des composants React et affiche une interface de secours élégante.

### 3. Gestion des erreurs synchrones

La fonction `tryCatch` permet de capturer et de traiter les erreurs dans le code synchrone.

### 4. Notifications utilisateur

Les erreurs peuvent être affichées à l'utilisateur via le système de notification, avec différents niveaux de sévérité.

### 5. Journalisation et suivi

Les erreurs sont enregistrées dans la console et peuvent être envoyées à un service de suivi des erreurs comme Sentry.

## Utilisation

### Hook useErrorHandler

```javascript
import useErrorHandler from '../hooks/useErrorHandler';

const MyComponent = () => {
  const { handleApiRequest, tryCatch, handleError } = useErrorHandler();
  
  // Utilisation avec une requête API
  const fetchData = async () => {
    try {
      const data = await handleApiRequest(
        api.get('/endpoint'),
        {
          loadingMessage: 'Chargement des données...',
          errorMessage: 'Erreur lors du chargement des données',
          showLoading: true
        }
      );
      return data;
    } catch (error) {
      // L'erreur est déjà gérée par handleApiRequest
      return null;
    }
  };
  
  // Utilisation avec du code synchrone
  const processData = () => {
    tryCatch(
      () => {
        // Code qui pourrait générer une erreur
        const result = someRiskyOperation();
        return result;
      },
      {
        errorMessage: 'Erreur lors du traitement des données',
        showError: true
      }
    );
  };
  
  // Déclenchement manuel d'une erreur
  const triggerError = () => {
    handleError(
      'Message d\'erreur personnalisé',
      'validation_error',
      {
        severity: 'warning',
        details: 'Détails supplémentaires sur l\'erreur',
        showNotification: true
      }
    );
  };
  
  return (
    // ...
  );
};
```

### Composant ErrorBoundary

```jsx
import ErrorBoundary from '../components/common/ErrorBoundary';

const MyPage = () => {
  const handleBoundaryError = (error, errorInfo) => {
    // Traitement personnalisé de l'erreur
    console.error('Erreur capturée :', error);
  };
  
  return (
    <ErrorBoundary onError={handleBoundaryError}>
      {/* Composants qui pourraient générer des erreurs */}
      <MyComponent />
    </ErrorBoundary>
  );
};
```

## Stratégies de fallback

Le système prend en charge plusieurs stratégies de fallback pour améliorer la résilience de l'application :

1. **Données de secours** : Utiliser des données par défaut lorsqu'une requête API échoue.
2. **Réessais automatiques** : Configurer des réessais pour les erreurs réseau temporaires.
3. **Mise en cache** : Utiliser des données en cache lorsque les nouvelles données ne peuvent pas être récupérées.

## Bonnes pratiques

1. **Envelopper les composants complexes** avec `ErrorBoundary` pour éviter que les erreurs ne se propagent.
2. **Utiliser handleApiRequest** pour toutes les requêtes API afin de bénéficier de la gestion d'erreurs intégrée.
3. **Fournir des messages d'erreur clairs et utiles** pour aider l'utilisateur à comprendre et résoudre le problème.
4. **Implémenter des stratégies de fallback** pour améliorer la résilience de l'application.
5. **Enregistrer les erreurs critiques** pour faciliter le débogage et l'amélioration continue.

## Types d'erreurs courants

| Type d'erreur | Description | Stratégie de gestion |
|---------------|-------------|----------------------|
| `auth_error` | Erreurs d'authentification | Redirection vers la page de connexion |
| `validation_error` | Erreurs de validation des données | Affichage des messages d'erreur spécifiques |
| `network_error` | Problèmes de connexion réseau | Réessais automatiques et mode hors ligne |
| `server_error` | Erreurs côté serveur | Notification à l'utilisateur et journalisation |
| `component_error` | Erreurs de rendu des composants | Affichage d'une interface de secours |

## Sécurité

Le système de gestion d'erreurs est conçu pour éviter de divulguer des informations sensibles :

1. Les messages d'erreur techniques détaillés ne sont affichés qu'en mode développement.
2. Les erreurs serveur sont présentées à l'utilisateur avec des messages génériques.
3. Les informations d'authentification ne sont jamais exposées dans les messages d'erreur.

## Intégration avec d'autres systèmes

Le système de gestion d'erreurs s'intègre avec d'autres parties de l'application :

1. **Système d'authentification** : Pour gérer les erreurs d'authentification et de session.
2. **Système de cache** : Pour utiliser des données en cache en cas d'erreur réseau.
3. **Système de journalisation** : Pour enregistrer les erreurs à des fins d'analyse.

## Exemple complet

Voici un exemple complet d'utilisation du système de gestion d'erreurs dans un composant :

```jsx
import React, { useState, useEffect } from 'react';
import useErrorHandler from '../hooks/useErrorHandler';
import ErrorBoundary from '../components/common/ErrorBoundary';
import api from '../services/api';

const UserProfile = () => {
  const { handleApiRequest } = useErrorHandler();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await handleApiRequest(
          api.get('/user/profile'),
          {
            loadingMessage: 'Chargement du profil...',
            errorMessage: 'Impossible de charger le profil utilisateur',
            showLoading: true,
            // Données de secours en cas d'erreur
            fallbackData: { 
              name: 'Utilisateur', 
              email: 'utilisateur@exemple.com',
              role: 'guest'
            }
          }
        );
        
        if (data) {
          setUser(data);
        }
      } catch (error) {
        // L'erreur est déjà gérée par handleApiRequest
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [handleApiRequest]);
  
  // Composant de secours personnalisé pour ErrorBoundary
  const errorFallback = (error, errorInfo, resetError) => (
    <div className="error-container">
      <h2>Oups ! Quelque chose s'est mal passé</h2>
      <p>Nous n'avons pas pu afficher votre profil.</p>
      <button onClick={resetError}>Réessayer</button>
    </div>
  );
  
  return (
    <ErrorBoundary fallback={errorFallback}>
      {loading ? (
        <div>Chargement...</div>
      ) : (
        <div className="profile-container">
          <h1>Profil de {user.name}</h1>
          {/* Contenu du profil */}
        </div>
      )}
    </ErrorBoundary>
  );
};

export default UserProfile;
```

## Conclusion

Le système de gestion d'erreurs de Grand Est Cyclisme offre une approche robuste et cohérente pour gérer les erreurs dans toute l'application. En suivant les bonnes pratiques et en utilisant les outils fournis, vous pouvez améliorer la résilience de l'application et offrir une meilleure expérience utilisateur, même en cas de problème.
