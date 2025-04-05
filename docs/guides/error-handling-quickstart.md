# Guide Rapide : Gestion d'Erreurs

Ce guide explique comment utiliser le système de gestion d'erreurs de Grand Est Cyclisme dans vos composants.

## 1. Utilisation du hook useErrorHandler

Le hook `useErrorHandler` est le point d'entrée principal pour la gestion des erreurs dans vos composants React.

### Installation rapide

```jsx
import useErrorHandler from '../hooks/useErrorHandler';

function MonComposant() {
  const { handleApiRequest, tryCatch, handleError } = useErrorHandler();
  
  // Votre code ici...
}
```

### Gestion des requêtes API

```jsx
const fetchData = async () => {
  try {
    const data = await handleApiRequest(
      api.get('/endpoint'),
      {
        loadingMessage: 'Chargement...',
        errorMessage: 'Erreur lors du chargement',
        showLoading: true,
        // Données de secours en cas d'erreur
        fallbackData: { /* données par défaut */ }
      }
    );
    
    // Utiliser les données
    return data;
  } catch (error) {
    // L'erreur est déjà gérée par handleApiRequest
    return null;
  }
};
```

### Gestion des erreurs synchrones

```jsx
const processData = () => {
  return tryCatch(
    () => {
      // Code qui pourrait générer une erreur
      return someRiskyOperation();
    },
    {
      errorMessage: 'Erreur lors du traitement',
      showError: true
    }
  );
};
```

### Gestion manuelle des erreurs

```jsx
const validateForm = (formData) => {
  if (!formData.email) {
    handleError(
      'Email requis',
      'validation/required-fields',
      {
        severity: 'warning',
        showNotification: true
      }
    );
    return false;
  }
  return true;
};
```

## 2. Utilisation du composant ErrorBoundary

Le composant `ErrorBoundary` capture les erreurs de rendu dans ses composants enfants.

### Utilisation de base

```jsx
import ErrorBoundary from '../components/common/ErrorBoundary';

function MaPage() {
  return (
    <ErrorBoundary>
      <MonComposantComplexe />
    </ErrorBoundary>
  );
}
```

### Avec un gestionnaire d'erreurs personnalisé

```jsx
import ErrorBoundary from '../components/common/ErrorBoundary';
import useErrorHandler from '../hooks/useErrorHandler';

function MaPage() {
  const { handleError } = useErrorHandler();
  
  const onError = (error, errorInfo) => {
    handleError(
      error.message,
      'component_error',
      {
        details: errorInfo.componentStack,
        severity: 'error'
      }
    );
  };
  
  return (
    <ErrorBoundary onError={onError}>
      <MonComposantComplexe />
    </ErrorBoundary>
  );
}
```

### Avec une interface de secours personnalisée

```jsx
import ErrorBoundary from '../components/common/ErrorBoundary';

function MaPage() {
  const errorFallback = (error, errorInfo, resetError) => (
    <div className="error-container">
      <h2>Oups ! Une erreur s'est produite</h2>
      <p>{error.message}</p>
      <button onClick={resetError}>Réessayer</button>
    </div>
  );
  
  return (
    <ErrorBoundary fallback={errorFallback}>
      <MonComposantComplexe />
    </ErrorBoundary>
  );
}
```

## 3. Intégration avec Material UI

Pour les composants Material UI, utilisez l'adaptateur fourni :

```jsx
import { withMUIErrorHandling } from '../adapters/MaterialUIErrorAdapter';
import { DataGrid } from '@mui/x-data-grid';

// Créer une version avec gestion d'erreurs du composant
const SafeDataGrid = withMUIErrorHandling(DataGrid, 'DataGrid');

function MonTableau() {
  return (
    <SafeDataGrid
      rows={rows}
      columns={columns}
      // ...autres props
    />
  );
}
```

## 4. Stratégies de retry pour les erreurs réseau

Pour les opérations qui peuvent bénéficier de tentatives automatiques :

```jsx
import { withRetry } from '../utils/RetryStrategy';

// Créer une version avec retry de la fonction
const fetchWithRetry = withRetry(api.get, {
  maxRetries: 3,
  baseDelay: 1000
});

// Utiliser la fonction avec retry
const data = await fetchWithRetry('/endpoint');
```

## 5. Exemples par module

### Module Authentification

```jsx
function Login() {
  const { handleApiRequest } = useErrorHandler();
  
  const handleSubmit = async (credentials) => {
    try {
      const user = await handleApiRequest(
        () => authService.login(credentials),
        {
          loadingMessage: 'Connexion en cours...',
          errorMessage: 'Échec de la connexion',
          showLoading: true
        }
      );
      
      if (user) {
        // Redirection après connexion réussie
      }
    } catch (error) {
      // Déjà géré par handleApiRequest
    }
  };
  
  // ...
}
```

### Module Parcours

```jsx
function RouteDetails({ routeId }) {
  const { handleApiRequest } = useErrorHandler();
  const [route, setRoute] = useState(null);
  
  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const data = await handleApiRequest(
          () => api.get(`/routes/${routeId}`),
          {
            loadingMessage: 'Chargement du parcours...',
            errorMessage: 'Impossible de charger les détails du parcours',
            showLoading: true,
            // Données de secours
            fallbackData: {
              id: routeId,
              name: 'Parcours indisponible',
              distance: 0,
              elevation: 0,
              // ...autres propriétés par défaut
            }
          }
        );
        
        if (data) {
          setRoute(data);
        }
      } catch (error) {
        // Déjà géré
      }
    };
    
    fetchRoute();
  }, [routeId, handleApiRequest]);
  
  // ...
}
```

### Module Météo

```jsx
function WeatherWidget({ location }) {
  const { handleApiRequest, tryCatch } = useErrorHandler();
  const [weather, setWeather] = useState(null);
  
  const fetchWeather = async () => {
    try {
      const data = await handleApiRequest(
        () => weatherService.getWeather(location),
        {
          // Sans message de chargement pour une expérience fluide
          showLoading: false,
          // Message d'erreur discret
          errorMessage: 'Données météo indisponibles',
          severity: 'info',
          // Données de secours
          fallbackData: {
            temperature: '--',
            conditions: 'Indisponible',
            icon: 'default'
          }
        }
      );
      
      if (data) {
        // Traitement des données météo
        const processedData = tryCatch(
          () => processWeatherData(data),
          {
            errorMessage: 'Erreur lors du traitement des données météo',
            // Utiliser les données brutes en cas d'erreur
            fallback: data
          }
        );
        
        setWeather(processedData);
      }
    } catch (error) {
      // Déjà géré
    }
  };
  
  // ...
}
```

## Bonnes pratiques

1. **Toujours fournir des données de secours** pour les requêtes API critiques
2. **Utiliser des niveaux de sévérité appropriés** pour les erreurs (error, warning, info)
3. **Envelopper les composants complexes** avec ErrorBoundary
4. **Personnaliser les messages d'erreur** pour qu'ils soient utiles aux utilisateurs
5. **Utiliser la stratégie de retry** pour les opérations réseau non-idempotentes

## Ressources supplémentaires

- [Documentation complète du système d'erreurs](../error-handling-system.md)
- [Exemples de composants](../examples/error-handling-examples.md)
- [Page de démonstration](/error-demo) (accessible en développement)
