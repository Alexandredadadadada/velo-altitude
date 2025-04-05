# Guide d'utilisation des Feature Flags

Ce document explique comment utiliser le système de feature flags (drapeaux de fonctionnalités) implémenté dans l'application Dashboard-Velo. Les feature flags permettent d'activer ou désactiver des fonctionnalités sans avoir à redéployer l'application.

## Table des matières

1. [Introduction](#introduction)
2. [Configuration initiale](#configuration-initiale)
3. [Utilisation dans les composants](#utilisation-dans-les-composants)
4. [Utilisation dans les services](#utilisation-dans-les-services)
5. [Création de nouveaux feature flags](#création-de-nouveaux-feature-flags)
6. [Bonnes pratiques](#bonnes-pratiques)
7. [Administration des feature flags](#administration-des-feature-flags)
8. [Utilisation avancée](#utilisation-avancée)

## Introduction

Les feature flags sont un outil puissant qui vous permet de:

- Déployer du code en production qui n'est pas encore prêt à être utilisé
- Faire des tests A/B pour différentes variations de fonctionnalités
- Activer/désactiver des fonctionnalités spécifiques pour certains environnements
- Gérer les fonctionnalités expérimentales ou en bêta
- Contrôler le déploiement progressif de nouvelles fonctionnalités

Notre implémentation offre:
- Persistance des flags côté serveur et dans le localStorage
- Interface d'administration pour la gestion des flags
- Mise à jour en temps réel des composants
- Suivi des modifications (qui a changé quoi et quand)

## Configuration initiale

Pour utiliser les feature flags dans l'application, le `FeatureFlagsProvider` doit être ajouté à la racine de l'application. Cela a déjà été fait dans notre fichier `App.js`:

```jsx
import { FeatureFlagsProvider } from './services/featureFlags';

function App() {
  return (
    <FeatureFlagsProvider>
      <AppRouter />
    </FeatureFlagsProvider>
  );
}
```

## Utilisation dans les composants

Pour utiliser les feature flags dans vos composants React, utilisez le hook `useFeatureFlags`:

```jsx
import React from 'react';
import { useFeatureFlags } from '../../services/featureFlags';

function MyComponent() {
  // Récupérer les flags et l'état de chargement
  const { flags, isLoading } = useFeatureFlags();
  
  // Si les flags sont en cours de chargement, afficher un indicateur de chargement
  if (isLoading) {
    return <div>Chargement...</div>;
  }
  
  return (
    <div>
      {/* Conditionnellement afficher une fonctionnalité basée sur un flag */}
      {flags.enableNewFeature && (
        <div>Cette fonctionnalité est nouvelle et activée!</div>
      )}
      
      {/* Vous pouvez aussi utiliser les flags pour les options de configuration */}
      <button 
        style={{ 
          backgroundColor: flags.enableDarkMode ? 'black' : 'white',
          color: flags.enableDarkMode ? 'white' : 'black'
        }}
      >
        Un bouton stylisé selon le mode
      </button>
    </div>
  );
}
```

## Utilisation dans les services

Pour les services ou les fonctions utilitaires qui ne sont pas des composants React, vous pouvez importer directement le service:

```javascript
import featureFlagsService from '../../services/featureFlags';

// Dans votre service
function myServiceFunction() {
  // Vérifier si un flag est activé
  if (featureFlagsService.isEnabled('enableApiCaching')) {
    // Mettre en œuvre la mise en cache
    return getCachedData();
  } else {
    // Comportement standard sans mise en cache
    return fetchFreshData();
  }
}
```

## Création de nouveaux feature flags

Bien que vous puissiez ajouter des feature flags via l'interface d'administration, il est recommandé de les définir d'abord dans le code pour faciliter le déploiement et la documentation.

Pour créer un nouveau feature flag:

1. Ajoutez-le aux `DEFAULT_FLAGS` dans `featureFlags.js`
2. Ajoutez ses métadonnées dans `FLAG_METADATA` dans `FeatureFlagsManager.js`
3. Documentez son objectif en commentaire

```javascript
// Dans featureFlags.js
const DEFAULT_FLAGS = {
  // Flags existants...
  
  // Nouvelle fonctionnalité de recommandation
  enablePersonalizedRecommendations: false
};

// Dans FeatureFlagsManager.js
const FLAG_METADATA = {
  // Métadonnées existantes...
  
  enablePersonalizedRecommendations: {
    category: 'experimental',
    description: 'Active les recommandations personnalisées basées sur l\'historique de l\'utilisateur',
    impact: 'medium'
  }
};
```

## Bonnes pratiques

1. **Nommage des flags**:
   - Utilisez un préfixe d'action (`enable`, `show`, `use`) suivi d'un nom descriptif en camelCase
   - Exemples: `enableDarkMode`, `showBetaFeatures`, `useNewAlgorithm`

2. **Flags temporaires vs permanents**:
   - Les flags pour déploiement progressif doivent être temporaires (à supprimer une fois la fonctionnalité complètement déployée)
   - Les flags de configuration doivent être permanents (pour permettre des modifications sans redéploiement)

3. **Évitez la multiplication**:
   - Ne créez pas un flag pour chaque petit changement
   - Regroupez les changements liés sous un même flag

4. **Nettoyage**:
   - Supprimez régulièrement les flags obsolètes pour éviter l'accumulation de dette technique

5. **Tests**:
   - Testez votre code avec différentes combinaisons de flags activés/désactivés

## Administration des feature flags

L'administration des feature flags se fait via l'interface dédiée accessible à l'adresse `/admin/feature-flags`. Cette interface permet de:

- Voir tous les feature flags existants
- Activer/désactiver des flags en temps réel
- Filtrer et rechercher des flags
- Voir l'historique des modifications
- Ajouter de nouveaux flags

Seuls les utilisateurs avec des droits d'administration peuvent accéder à cette interface.

## Utilisation avancée

### Mise à jour programmatique des flags

Dans certains cas, vous pourriez vouloir mettre à jour un flag depuis le code:

```javascript
import { useFeatureFlags } from '../../services/featureFlags';

function AdminComponent() {
  const { updateFlag } = useFeatureFlags();
  
  const handleToggleFeature = async () => {
    try {
      // Premier argument: nom du flag
      // Deuxième argument: nouvelle valeur
      // Troisième argument (optionnel): persister sur le serveur (true par défaut)
      await updateFlag('enableBetaFeatures', true);
      
      // Succès
      console.log('Feature flag mis à jour avec succès');
    } catch (error) {
      // Erreur
      console.error('Erreur lors de la mise à jour du feature flag', error);
    }
  };
  
  return (
    <button onClick={handleToggleFeature}>
      Activer les fonctionnalités bêta
    </button>
  );
}
```

### Abonnement aux changements de flags

Si vous avez besoin de réagir aux changements de flags en dehors du cycle de vie des composants React:

```javascript
import featureFlagsService from '../../services/featureFlags';

// Dans une fonction d'initialisation
function initializeService() {
  // S'abonner aux changements
  const unsubscribe = featureFlagsService.subscribe(updatedFlags => {
    console.log('Flags mis à jour:', updatedFlags);
    
    // Votre logique répondant aux changements de flags
    if (updatedFlags.enableRealTimeUpdates) {
      startRealTimeUpdates();
    } else {
      stopRealTimeUpdates();
    }
  });
  
  // N'oubliez pas de vous désabonner quand ce n'est plus nécessaire
  // Par exemple, lors du démontage d'un composant
  return unsubscribe;
}
```

---

Pour toute question ou suggestion concernant le système de feature flags, n'hésitez pas à contacter l'équipe technique.
