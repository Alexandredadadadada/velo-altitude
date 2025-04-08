# Guide de Tests React Query

## Introduction

Ce document fournit un guide complet pour tester les hooks React Query dans le projet Velo-Altitude. Il couvre les stratégies de test, les patterns à suivre et des exemples concrets pour assurer que nos hooks API fonctionnent correctement.

## Stratégies de Test

### 1. Tests Unitaires

Les tests unitaires se concentrent sur le comportement individuel des hooks React Query sans dépendances externes.

#### Objectifs:
- Vérifier que les hooks appellent les bonnes fonctions de l'orchestrateur API
- Tester les options (staleTime, cacheTime, etc.)
- Vérifier le comportement en cas de succès/erreur

#### Approche:
- Mocking de l'orchestrateur API
- Utilisation de `renderHook` de @testing-library/react-hooks
- Wrapper des composants avec QueryClientProvider

### 2. Tests d'Intégration

Les tests d'intégration vérifient l'interaction entre les hooks React Query et d'autres composants du système.

#### Objectifs:
- Vérifier l'intégration avec l'orchestrateur API réel
- Tester les réponses de mises en cache
- S'assurer que les invalidations fonctionnent correctement

#### Approche:
- Utilisation de MSW (Mock Service Worker) pour simuler les réponses du serveur
- Tests de bout en bout des flux de données

### 3. Tests de Performance

Les tests de performance vérifient que nos hooks React Query respectent les exigences de performance.

#### Objectifs:
- Vérifier que les données sont correctement mises en cache
- S'assurer que les requêtes redondantes sont évitées
- Tester les stratégies de refetch

## Configuration du Test Environment

```javascript
// jest.setup.js
import '@testing-library/jest-dom';
import { setLogger } from '@tanstack/react-query';
import { server } from './mocks/server';

// Désactiver les logs React Query pendant les tests
setLogger({
  log: console.log,
  warn: console.warn,
  error: () => {}, // Suppression des erreurs attendues pendant les tests
});

// Configurer MSW
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Exemples de Tests

### Test Unitaire d'un Hook useQuery

```javascript
// __tests__/hooks/api/useColsApi.test.js
import { renderHook } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGetColById } from '../../../hooks/api/useColsApi';

// Mock de l'orchestrateur API
jest.mock('../../../contexts/RealApiOrchestratorProvider', () => ({
  useApiOrchestrator: () => ({
    getColById: jest.fn().mockResolvedValue({ id: '123', name: 'Test Col' })
  })
}));

describe('useGetColById', () => {
  let queryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Désactiver les retry pour les tests
          cacheTime: Infinity // Conserver le cache pendant toute la durée du test
        }
      }
    });
  });
  
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  
  it('should fetch and return col data', async () => {
    const { result, waitFor } = renderHook(() => useGetColById('123'), { wrapper });
    
    // Initialement en chargement
    expect(result.current.isLoading).toBe(true);
    
    // Attendre que les données soient chargées
    await waitFor(() => result.current.isSuccess);
    
    // Vérifier que les données sont correctes
    expect(result.current.data).toEqual({ id: '123', name: 'Test Col' });
  });
  
  it('should use correct staleTime configuration', () => {
    const { result } = renderHook(() => useGetColById('123'), { wrapper });
    
    // Vérifier que l'option staleTime est correctement définie
    // Cette vérification n'est pas directe, mais on peut utiliser une approche comme:
    expect(queryClient.getQueryState(['cols', 'byId', '123'])?.options?.staleTime).toBe(15 * 60 * 1000);
  });
});
```

### Test de Mutation avec Mise à Jour Optimiste

```javascript
// __tests__/hooks/api/useColsApi.test.js
import { renderHook, act } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdateColFavorite } from '../../../hooks/api/useColsApi';

// Mock l'API orchestrator et le service de notification
jest.mock('../../../contexts/RealApiOrchestratorProvider');
jest.mock('../../../services/notification/notificationService');

describe('useUpdateColFavorite', () => {
  let queryClient;
  const mockData = { id: '123', name: 'Test Col', isFavorite: false };
  
  beforeEach(() => {
    queryClient = new QueryClient();
    // Pré-remplir le cache avec des données
    queryClient.setQueryData(['cols', 'byId', '123'], mockData);
  });
  
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  
  it('should update cache optimistically and handle successful mutation', async () => {
    // Setup du mock
    const apiOrchestratorMock = { updateColFavorite: jest.fn().mockResolvedValue({ ...mockData, isFavorite: true }) };
    require('../../../contexts/RealApiOrchestratorProvider').useApiOrchestrator.mockReturnValue(apiOrchestratorMock);
    
    const { result, waitFor } = renderHook(() => useUpdateColFavorite(), { wrapper });
    
    // Exécuter la mutation
    act(() => {
      result.current.mutate({ colId: '123', isFavorite: true });
    });
    
    // Vérifier que le cache a été mis à jour de manière optimiste
    expect(queryClient.getQueryData(['cols', 'byId', '123']).isFavorite).toBe(true);
    
    // Attendre que la mutation se termine
    await waitFor(() => !result.current.isLoading);
    
    // Vérifier que l'orchestrateur a été appelé correctement
    expect(apiOrchestratorMock.updateColFavorite).toHaveBeenCalledWith('123', { isFavorite: true });
    
    // Le cache devrait toujours avoir les données à jour
    expect(queryClient.getQueryData(['cols', 'byId', '123']).isFavorite).toBe(true);
  });
  
  it('should revert optimistic update on error', async () => {
    // Setup du mock avec une erreur
    const apiOrchestratorMock = { updateColFavorite: jest.fn().mockRejectedValue(new Error('Test error')) };
    require('../../../contexts/RealApiOrchestratorProvider').useApiOrchestrator.mockReturnValue(apiOrchestratorMock);
    
    const { result, waitFor } = renderHook(() => useUpdateColFavorite(), { wrapper });
    
    // Exécuter la mutation
    act(() => {
      result.current.mutate({ colId: '123', isFavorite: true });
    });
    
    // Vérifier que le cache a été mis à jour de manière optimiste
    expect(queryClient.getQueryData(['cols', 'byId', '123']).isFavorite).toBe(true);
    
    // Attendre que la mutation se termine (avec erreur)
    await waitFor(() => result.current.isError);
    
    // Vérifier que le cache a été restauré à son état d'origine
    expect(queryClient.getQueryData(['cols', 'byId', '123']).isFavorite).toBe(false);
  });
});
```

### Test d'Intégration avec MSW

```javascript
// __tests__/hooks/api/integration/useActivitiesApi.test.js
import { renderHook, act } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { useGetRecentActivities } from '../../../../hooks/api/useActivitiesApi';

// Configuration de MSW
const server = setupServer(
  rest.get(`${process.env.REACT_APP_API_URL}/activities/recent`, (req, res, ctx) => {
    return res(
      ctx.json([
        { id: '1', name: 'Morning Ride', date: '2025-01-01' },
        { id: '2', name: 'Afternoon Climb', date: '2025-01-02' }
      ])
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('useGetRecentActivities Integration', () => {
  let queryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false
        }
      }
    });
  });
  
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  
  it('should fetch activities from API and handle stale time correctly', async () => {
    const { result, waitFor } = renderHook(() => useGetRecentActivities(), { wrapper });
    
    // Attendre que les données soient chargées
    await waitFor(() => result.current.isSuccess);
    
    // Vérifier les données
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0].name).toBe('Morning Ride');
    
    // Vérifier le stale time
    const queryState = queryClient.getQueryState(['activities', 'recent']);
    expect(queryState.isStale).toBe(false); // Les données sont fraîches
    
    // Avancer le temps pour dépasser le staleTime
    jest.advanceTimersByTime(60 * 1000 + 100); // 1 minute + 100ms
    
    // Les données devraient maintenant être périmées
    expect(queryClient.getQueryState(['activities', 'recent']).isStale).toBe(true);
  });
});
```

## Bonnes Pratiques pour les Tests React Query

1. **Isolation** : Toujours réinitialiser le QueryClient entre les tests pour éviter les interférences

2. **Mocks Réalistes** : Les mocks doivent refléter le comportement réel de l'API, y compris les formats de données et les erreurs

3. **Test des Scénarios Critiques** :
   - Mise en cache et expiration des données
   - Invalidation du cache
   - Comportement en cas d'erreur réseau
   - Mises à jour optimistes et rollback

4. **Éviter les Tests Fragiles** :
   - Ne pas se fier aux timings exacts de React Query
   - Utiliser des attentes pour les transitions d'état

5. **Approche Component-First** :
   - Commencer par tester comment les composants utilisent les hooks
   - Ensuite, tester les hooks isolément

## Conseils pour le Débogage des Tests

- Utilisez `console.log(queryClient.getQueryCache().getAll())` pour afficher toutes les requêtes en cache
- Ajoutez des attentes plus longues pour les tests asynchrones: `await waitFor(() => result.current.isSuccess, { timeout: 5000 })`
- Vérifiez les appels de mock avec `expect(mockFn).toHaveBeenCalledTimes(1)`

## Intégration avec le CI/CD

Les tests React Query doivent être intégrés dans notre pipeline CI/CD pour assurer que chaque changement maintient l'intégrité du système de gestion d'état.

```yaml
# Extrait de .github/workflows/ci.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm ci
      - run: npm test -- --coverage
      # Tests spécifiques pour React Query
      - run: npm test -- --testPathPattern=hooks/api
```

## Conclusion

Les tests sont une partie essentielle de l'implémentation React Query. Ils garantissent que notre système de gestion d'état fonctionne correctement et continue de répondre aux exigences de performance au fil du temps. En suivant ce guide, vous pouvez vous assurer que tous les hooks API sont testés de manière complète et efficace.
