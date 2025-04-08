# Documentation React Query - Velo-Altitude

## Table des Matières

1. [Introduction et Principes](#introduction-et-principes)
2. [Architecture et Flux de Données](#architecture-et-flux-de-données)
3. [Guide d'Utilisation des Hooks](#guide-dutilisation-des-hooks)
   - [Requêtes Simples (useQuery)](#requêtes-simples-usequery)
   - [Mutations (useMutation)](#mutations-usemutation)
   - [Mises à Jour Optimistes](#mises-à-jour-optimistes)
   - [Préchargement (Prefetching)](#préchargement-prefetching)
4. [Optimisations de Performance](#optimisations-de-performance)
   - [Configuration staleTime/cacheTime](#configuration-staletimecachetime)
   - [Invalidation Sélective](#invalidation-sélective)
   - [Gestion des Dépendances](#gestion-des-dépendances)
5. [Étendre le Système](#étendre-le-système)
   - [Ajouter de Nouveaux Hooks](#ajouter-de-nouveaux-hooks)
   - [Patterns Recommandés](#patterns-recommandés)
   - [Tests](#tests)

## Introduction et Principes

React Query est une bibliothèque de gestion d'état côté serveur qui simplifie considérablement la récupération, la mise en cache, la synchronisation et la mise à jour des données dans les applications React. Dans Velo-Altitude, React Query est utilisé comme solution centrale pour toutes les interactions avec l'API.

### Avantages clés :

- **Gestion automatique du cache** : React Query garde les données en mémoire et les rafraîchit automatiquement.
- **Mise à jour optimiste** : Les interfaces utilisateur peuvent être mises à jour immédiatement avant la confirmation du serveur.
- **Gestion de l'état de chargement et d'erreur** : Fournit des indicateurs `isLoading`, `isError`, etc.
- **Dédoublonnage des requêtes** : Évite les appels redondants à l'API.
- **Refetch automatique** : Rafraîchit les données lorsque l'utilisateur revient sur un onglet ou se reconnecte.

### Concepts fondamentaux :

1. **Queries** : Requêtes pour récupérer des données (lecture)
2. **Mutations** : Opérations qui modifient des données (écriture)
3. **Query Keys** : Identifiants uniques pour chaque requête
4. **Query Cache** : Stockage en mémoire des données
5. **Invalidation** : Mécanisme pour marquer les données comme obsolètes

## Architecture et Flux de Données

### Structure globale

```
client/src/
├── lib/
│   ├── react-query.js            # Configuration globale et queryKeys
│   └── optimistic-updates.js     # Utilitaires pour les mises à jour optimistes
├── hooks/api/
│   ├── useColsApi.js             # Hooks pour les cols
│   ├── useActivitiesApi.js       # Hooks pour les activités
│   └── ...                       # Autres domaines
└── contexts/
    └── RealApiOrchestratorProvider.js  # Fournit l'accès à l'orchestrateur API
```

### Flux de données

1. Le composant React utilise un hook spécifique (ex: `useGetColById`)
2. Le hook utilise `useQuery` ou `useMutation` de React Query
3. React Query vérifie d'abord son cache
4. Si les données sont fraîches (< staleTime), elles sont retournées immédiatement
5. Si les données sont périmées ou absentes, une requête est effectuée via l'orchestrateur API
6. Les données récupérées sont mises en cache pour les requêtes futures
7. Les données sont retournées au composant

### Integration avec RealApiOrchestrator

Tous les hooks d'API utilisent l'orchestrateur API via le hook `useApiOrchestrator`. Cette approche garantit une cohérence dans la façon dont les données sont récupérées et permet de centraliser la logique de communication avec le backend.

```javascript
// Exemple d'intégration
export const useGetColById = (id) => {
  const apiOrchestrator = useApiOrchestrator();
  
  return useQuery(
    queryKeys.cols.byId(id),
    () => apiOrchestrator.getColById(id),
    {
      // Options...
    }
  );
};
```

## Guide d'Utilisation des Hooks

### Requêtes Simples (useQuery)

Les hooks de requête sont utilisés pour récupérer des données en lecture seule. Ils retournent un objet contenant les données, l'état de chargement, les erreurs et des fonctions utilitaires.

#### Exemple d'utilisation :

```javascript
import { useGetColById } from 'hooks/api/useColsApi';

function ColDetails({ colId }) {
  const { 
    data: col,
    isLoading,
    isError,
    error,
    refetch
  } = useGetColById(colId);

  if (isLoading) return <Loader />;
  if (isError) return <ErrorMessage error={error} />;

  return (
    <div>
      <h1>{col.name}</h1>
      <p>Altitude: {col.elevation}m</p>
      <button onClick={refetch}>Rafraîchir</button>
    </div>
  );
}
```

#### Options courantes :

- `enabled`: Active/désactive la requête
- `staleTime`: Durée pendant laquelle les données sont considérées fraîches
- `cacheTime`: Durée de conservation des données inactives en cache
- `retry`: Stratégie de retry en cas d'échec
- `onSuccess`, `onError`: Callbacks pour gérer les états de succès/erreur
- `select`: Transforme ou filtre les données retournées

### Mutations (useMutation)

Les mutations sont utilisées pour créer, mettre à jour ou supprimer des données. Elles retournent une fonction de mutation et des informations sur l'état.

#### Exemple d'utilisation :

```javascript
import { useUpdateColFavorite } from 'hooks/api/useColsApi';

function FavoriteButton({ colId, isFavorite }) {
  const { 
    mutate: toggleFavorite,
    isLoading
  } = useUpdateColFavorite();

  return (
    <button 
      onClick={() => toggleFavorite({ colId, favorite: !isFavorite })}
      disabled={isLoading}
    >
      {isLoading ? 'En cours...' : (isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris')}
    </button>
  );
}
```

### Mises à Jour Optimistes

Les mises à jour optimistes permettent d'actualiser l'interface utilisateur immédiatement, avant que le serveur ne confirme l'opération, ce qui améliore l'expérience utilisateur.

Dans Velo-Altitude, nous utilisons un utilitaire `optimisticMutation` qui simplifie ce processus :

```javascript
// Dans un hook d'API
const useUpdateActivity = (id) => {
  const queryClient = useQueryClient();
  const apiOrchestrator = useApiOrchestrator();

  return useMutation(
    (activityData) => apiOrchestrator.updateActivity(id, activityData),
    optimisticMutation(queryClient, {
      // Clés à invalider après succès
      invalidateQueries: queryKeys.activities.byId(id),
      
      // Mise à jour optimiste du cache
      updateCache: {
        [queryKeys.activities.byId(id)]: (oldData) => ({
          ...oldData,
          ...activityData
        })
      },
      
      // Messages de notification
      successMessage: 'Activité mise à jour avec succès',
      errorMessage: 'Échec de la mise à jour de l\'activité'
    })
  );
};
```

#### Utilitaires disponibles :

Dans `optimistic-updates.js`, plusieurs helpers sont disponibles :

- `listUpdater`: Pour les opérations sur des listes (ajout, mise à jour, suppression)
- `objectUpdater`: Pour les opérations sur des objets
- `toggleUpdater`: Pour les opérations de toggle (comme ajouter/retirer des favoris)

### Préchargement (Prefetching)

Le préchargement permet de récupérer des données avant qu'elles ne soient nécessaires, ce qui améliore l'expérience utilisateur en éliminant les temps de chargement perçus.

#### Exemple d'utilisation :

```javascript
import { usePrefetchColById } from 'hooks/api/useColsApi';

function ColListItem({ col }) {
  const { prefetchCol } = usePrefetchColById(col.id);

  return (
    <Link 
      to={`/cols/${col.id}`}
      onMouseEnter={prefetchCol} // Précharge les données au survol
    >
      {col.name}
    </Link>
  );
}
```

## Optimisations de Performance

### Configuration staleTime/cacheTime

Dans Velo-Altitude, les valeurs de `staleTime` et `cacheTime` sont définies en fonction de la volatilité des données :

| Type de Données | staleTime | cacheTime | Justification |
|-----------------|-----------|-----------|---------------|
| Configuration globale | 5 min | 30 min | Valeurs par défaut équilibrées |
| Cols (liste) | 10 min | 30 min | Données statiques, mises à jour peu fréquentes |
| Col (détail) | 15 min | 30 min | Données très statiques |
| Météo | 30 min | 30 min | Actualisation moins fréquente nécessaire |
| Recherche | 5 min | 30 min | Résultats peuvent changer |
| Activités | 5 min | 30 min | Données fréquemment mises à jour |
| Profil utilisateur | 20 min | 30 min | Données personnelles relativement stables |

#### Définitions :

- **staleTime** : Durée pendant laquelle les données sont considérées fraîches. Pendant cette période, React Query n'effectuera pas de nouvelle requête.
- **cacheTime** : Durée pendant laquelle les données inactives (non utilisées) restent en cache avant d'être supprimées.

### Invalidation Sélective

L'invalidation sélective permet de rafraîchir uniquement les données affectées par une opération, sans avoir à recharger toutes les données.

#### Exemple :

```javascript
// Après la création d'une nouvelle activité, invalider seulement les listes d'activités
queryClient.invalidateQueries(queryKeys.activities.recent);

// Après une mise à jour de profil, invalider seulement le profil
queryClient.invalidateQueries(queryKeys.users.profile(userId));
```

### Gestion des Dépendances

Certaines requêtes dépendent des résultats d'autres requêtes. React Query offre plusieurs façons de gérer ces dépendances :

1. **Option `enabled`** : Activer une requête seulement lorsque certaines conditions sont remplies

```javascript
// N'exécuter la requête de météo que si l'ID du col est disponible
const { data: weather } = useGetColWeather(colId, {
  enabled: !!colId
});
```

2. **useQueries** : Pour les requêtes multiples dynamiques

```javascript
// Récupérer plusieurs cols en parallèle
const colResults = useQueries(
  colIds.map(id => ({
    queryKey: queryKeys.cols.byId(id),
    queryFn: () => apiOrchestrator.getColById(id)
  }))
);
```

## Étendre le Système

### Ajouter de Nouveaux Hooks

Pour ajouter un nouveau hook API, suivez ce modèle :

1. Identifiez le fichier approprié dans `hooks/api/` ou créez-en un nouveau
2. Ajoutez les clés de requête appropriées dans `react-query.js` si nécessaire
3. Implémentez le hook selon ce modèle :

```javascript
export const useGetSomething = (id) => {
  const apiOrchestrator = useApiOrchestrator();
  
  return useQuery(
    queryKeys.domain.specific(id),
    () => apiOrchestrator.getSomething(id),
    {
      // Personnalisez ces valeurs selon les besoins
      staleTime: 10 * 60 * 1000, // 10 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      onError: (error) => {
        console.error(`Erreur lors de la récupération:`, error);
        notificationService.showError(
          `Message d'erreur approprié`,
          { title: 'Erreur API' }
        );
      }
    }
  );
};
```

### Patterns Recommandés

#### 1. Colocalisez les hooks connexes

Regroupez les hooks liés au même domaine dans le même fichier (ex: toutes les opérations sur les cols dans `useColsApi.js`).

#### 2. Standardisez la gestion des erreurs

Utilisez systématiquement le service de notification pour les erreurs :

```javascript
onError: (error) => {
  console.error(`Message de log détaillé:`, error);
  notificationService.showError(
    `Message utilisateur clair et concis`,
    { title: 'Titre approprié' }
  );
}
```

#### 3. Utilisez les mises à jour optimistes pour une UX réactive

Pour toutes les mutations qui modifient des données déjà affichées, utilisez les helpers de mise à jour optimiste.

#### 4. Priorisez le préchargement pour les navigations fréquentes

Implémentez le préchargement pour les chemins de navigation courants pour éliminer les temps de chargement perçus.

### Tests

Pour tester les hooks React Query, nous utilisons une combinaison de :

1. **Tests unitaires** : Tester le comportement des hooks individuellement
2. **Tests d'intégration** : Tester l'interaction des hooks avec l'orchestrateur API
3. **Tests de rendu** : Tester comment les composants utilisent les hooks

#### Exemple de test unitaire :

```javascript
// __tests__/hooks/api/useColsApi.test.js
import { renderHook } from '@testing-library/react-hooks';
import { useGetColById } from 'hooks/api/useColsApi';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from 'lib/react-query';

// Mock de l'orchestrateur API
jest.mock('contexts/RealApiOrchestratorProvider', () => ({
  useApiOrchestrator: () => ({
    getColById: jest.fn().mockResolvedValue({ id: '123', name: 'Test Col' })
  })
}));

describe('useGetColById', () => {
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
});
```

---

## Résumé

L'implémentation de React Query dans Velo-Altitude fournit une solution robuste et performante pour la gestion des données côté serveur. En suivant les patterns et recommandations de cette documentation, vous pouvez maintenir et étendre cette architecture de manière cohérente.

N'hésitez pas à contribuer à cette documentation ou à suggérer des améliorations au système React Query existant.
