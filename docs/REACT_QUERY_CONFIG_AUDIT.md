# Audit des Configurations React Query

## Objectif

Ce document présente un audit complet des configurations staleTime/cacheTime utilisées dans les différents hooks React Query du projet Velo-Altitude. L'objectif est d'harmoniser ces configurations selon la nature des données et d'optimiser les performances.

## Configuration Globale (Default)

*Définie dans `client/src/lib/react-query.js`*

| Paramètre | Valeur | Commentaire |
|-----------|--------|-------------|
| staleTime | 5 minutes | Valeur par défaut pour toutes les requêtes |
| cacheTime | 30 minutes | Durée de rétention des données inactives |
| retry | 3 | Nombre de tentatives en cas d'échec |
| retryDelay | Exponentiel | Délai entre les tentatives (max 30s) |
| refetchOnWindowFocus | true | Rafraîchit lors du focus sur la fenêtre |
| refetchOnReconnect | true | Rafraîchit lors de la reconnexion réseau |

## Configurations Spécifiques par Domaine

### Cols (`useColsApi.js`)

| Hook | staleTime | cacheTime | Justification | Recommandation |
|------|-----------|-----------|---------------|----------------|
| useGetAllCols | 10 min | 30 min (défaut) | Données géographiques statiques | ✅ Maintenir |
| useGetColById | 15 min | 30 min (défaut) | Données détaillées très stables | ✅ Maintenir |
| useGetColsByRegion | 10 min | 30 min (défaut) | Données filtrées statiques | ✅ Maintenir |
| useGetColsByDifficulty | 10 min | 30 min (défaut) | Données filtrées statiques | ✅ Maintenir |
| useSearchCols | 5 min | 30 min (défaut) | Résultats de recherche | ✅ Maintenir |
| usePrefetchColById | 15 min | Non spécifié | Cohérent avec useGetColById | ✅ Maintenir |
| usePrefetchColWeather | 30 min | Non spécifié | Données météo peu volatiles | ✅ Maintenir |

### Activités (`useActivitiesApi.js`)

| Hook | staleTime | cacheTime | Justification | Recommandation |
|------|-----------|-----------|---------------|----------------|
| useGetActivity | Non spécifié | 30 min (défaut) | Utilise la valeur par défaut | ⚠️ Définir à 5 min |
| useGetRecentActivities | Non spécifié | 30 min (défaut) | Utilise la valeur par défaut | ⚠️ Définir à 5 min |

### Challenge 7 Majeurs (`use7MajeursApi.js`)

| Hook | staleTime | cacheTime | Justification | Recommandation |
|------|-----------|-----------|---------------|----------------|
| useGetAllMajeurs7Challenges | Non spécifié | 30 min (défaut) | Utilise la valeur par défaut | ⚠️ Définir à 10 min |
| useGetMajeurs7ChallengeById | Non spécifié | 30 min (défaut) | Utilise la valeur par défaut | ⚠️ Définir à 10 min |
| useGetMajeurs7Progress | Non spécifié | 30 min (défaut) | Utilise la valeur par défaut | ⚠️ Définir à 5 min |

### Profil Utilisateur (différents hooks)

| Hook | staleTime | cacheTime | Justification | Recommandation |
|------|-----------|-----------|---------------|----------------|
| useGetUserProfile | Non spécifié | 30 min (défaut) | Utilise la valeur par défaut | ⚠️ Définir à 20 min |
| useUpdateUserProfile | N/A | N/A | Mutation | ✅ Maintenir |

## Incohérences et Recommandations

### Incohérences Identifiées

1. **Valeurs par défaut non explicites** : Plusieurs hooks ne spécifient pas explicitement leur staleTime, utilisant la valeur globale par défaut de 5 minutes.
2. **Manque d'uniformité par domaine** : Les hooks liés aux mêmes types de données devraient avoir des configurations cohérentes.
3. **Commentaires explicatifs manquants** : Les valeurs personnalisées manquent parfois de commentaires explicatifs.

### Recommandations d'Harmonisation

1. **Expliciter toutes les valeurs** : Même lorsque la valeur par défaut est utilisée, l'expliciter pour plus de clarté.
2. **Standardiser par domaine** :
   - Données géographiques (cols) : 10-15 minutes
   - Données utilisateur (profil) : 15-20 minutes
   - Données d'activité : 5 minutes
   - Données météo : 30 minutes
   - Données de recherche : 5 minutes

3. **Ajouter des commentaires** : Expliquer la raison des valeurs choisies.

## Plan d'Action pour l'Harmonisation

1. Mettre à jour les hooks d'API activités pour définir explicitement un staleTime de 5 minutes
2. Mettre à jour les hooks de profil utilisateur pour définir un staleTime de 20 minutes
3. Mettre à jour les hooks 7 Majeurs pour définir un staleTime de 10 minutes
4. Ajouter des commentaires explicatifs pour toutes les valeurs personnalisées

## Impact sur les Performances

Ces ajustements permettront d'optimiser l'équilibre entre :
- La fraîcheur des données (utilisateur voit des données à jour)
- Les performances réseau (minimiser les requêtes inutiles)
- L'expérience utilisateur (minimiser les temps de chargement)

## Conclusion

L'harmonisation des configurations React Query permettra une gestion plus cohérente et plus efficace du cache de données, améliorant ainsi les performances globales de l'application Velo-Altitude.
