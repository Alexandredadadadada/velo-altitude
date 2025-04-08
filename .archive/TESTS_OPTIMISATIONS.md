# Document de test des optimisations - Grand Est Cyclisme

## Introduction

Ce document définit les procédures de test pour vérifier l'efficacité des optimisations récemment implémentées dans l'application Grand Est Cyclisme. Les tests couvrent :

1. Système de Feature Flags
2. Cache API
3. Optimisations des visualisations 3D
4. Configuration des timeouts
5. Performances globales
6. Accessibilité

## Prérequis

- Navigateur moderne (Chrome v100+, Firefox v95+, Safari v15+)
- Chrome DevTools ou équivalent pour l'inspection
- Accès aux comptes utilisateurs de différents niveaux (standard, premium, admin)
- Dispositifs de test variés (desktop, tablette, smartphone)

## 1. Tests du système de Feature Flags

### 1.1 Vérification de l'API de base

| Test | Procédure | Résultat attendu | Résultat obtenu |
|------|-----------|------------------|-----------------|
| Vérification des flags actifs | Dans la console, exécuter `featureFlagsService.getAll()` | Retourne un objet avec tous les feature flags et leur état | |
| Activation/désactivation d'un flag | Exécuter `featureFlagsService.override('progressiveLoading', false)` puis vérifier `featureFlagsService.isEnabled('progressiveLoading')` | La méthode `isEnabled` doit retourner `false` | |
| Persistance des overrides | Rafraîchir la page après avoir défini un override, puis vérifier son état | L'override doit persister après le rafraîchissement | |
| Reset des overrides | Exécuter `featureFlagsService.resetOverrides()` puis vérifier l'état | Les flags doivent revenir à leur valeur par défaut | |

### 1.2 Segmentation des utilisateurs

| Test | Procédure | Résultat attendu | Résultat obtenu |
|------|-----------|------------------|-----------------|
| Segmentation par rôle | Se connecter avec des comptes de différents rôles puis exécuter `featureFlagsService.getEligibleFlags()` | Les flags éligibles doivent varier selon le rôle utilisateur | |
| Flags basés sur la date | Vérifier un flag avec contrainte de date (ex: `featureFlagsService.isEnabled('seasonalFeature')`) | Activation/désactivation basée sur la date actuelle | |
| Préférences utilisateur | Changer une préférence utilisateur et vérifier l'impact sur les flags | Les flags doivent s'adapter aux préférences utilisateur | |

### 1.3 Test des variantes

| Test | Procédure | Résultat attendu | Résultat obtenu |
|------|-----------|------------------|-----------------|
| Obtention de variante | Exécuter `featureFlagsService.getVariant('qualityLevel')` | Retourne une variante valide parmi celles définies | |
| Changement de variante | Exécuter `featureFlagsService.overrideVariant('qualityLevel', 'high')` puis vérifier | La variante doit être mise à jour | |
| Impact sur l'UI | Changer la variante du flag `qualityLevel` et observer l'UI | L'interface doit s'adapter à la nouvelle variante | |

## 2. Tests du système de Cache API

### 2.1 Vérification du cache de base

| Test | Procédure | Résultat attendu | Résultat obtenu |
|------|-----------|------------------|-----------------|
| Premier chargement | Ouvrir Network panel, charger la page des cols | Tous les appels API sont exécutés | |
| Second chargement | Rafraîchir la page | Certains appels utilisent le cache (statut 304 ou absence d'appels) | |
| Vérification localStorage | Inspecter Application > Storage > Local Storage | Entrées commençant par `api_cache_` avec timestamps | |

### 2.2 Stratégies de cache

| Test | Procédure | Résultat attendu | Résultat obtenu |
|------|-----------|------------------|-----------------|
| Cache-first | Visiter une page qui utilise `apiCacheService.get(url, { strategy: 'cache-first' })` | Les données sont chargées depuis le cache si disponibles | |
| Stale-while-revalidate | Visiter une page avec `apiCacheService.get(url, { strategy: 'stale-while-revalidate' })` | Données du cache affichées immédiatement, puis mises à jour si changées | |
| Network-only | Visiter une page avec `apiCacheService.get(url, { strategy: 'network-only' })` | Toujours requête réseau, jamais de cache | |

### 2.3 Invalidation et contrôle du cache

| Test | Procédure | Résultat attendu | Résultat obtenu |
|------|-----------|------------------|-----------------|
| Invalidation par TTL | Définir un TTL court (1min) et attendre l'expiration | Après expiration, nouvelle requête réseau effectuée | |
| Invalidation manuelle | Exécuter `apiCacheService.invalidate('/api/cols')` puis recharger | Le cache pour cette URL est ignoré, nouvelle requête effectuée | |
| Invalidation par tag | Exécuter `apiCacheService.invalidateByTag('cols')` | Toutes les entrées avec ce tag sont invalidées | |
| Forcer le rafraîchissement | Utiliser le paramètre `{ forceRefresh: true }` | Le cache est ignoré pour cette requête spécifique | |

## 3. Tests des optimisations des visualisations 3D

### 3.1 Détection des capacités du dispositif

| Test | Procédure | Résultat attendu | Résultat obtenu |
|------|-----------|------------------|-----------------|
| Détection de GPU | Visiter la page de visualisation d'un col et vérifier la console | Logs détaillant les capacités GPU détectées | |
| Détection de mémoire | Observer les logs dans la console | Information sur la mémoire disponible | |
| Adaptation au dispositif | Tester sur dispositifs variés (puissant/faible) | Niveau de qualité adapté à chaque dispositif | |

### 3.2 Chargement progressif et niveaux de détail

| Test | Procédure | Résultat attendu | Résultat obtenu |
|------|-----------|------------------|-----------------|
| Progression visible | Ouvrir la visualisation d'un col et observer | Chargement progressif visible (low → high) | |
| Niveau initial rapide | Chronométrer le temps jusqu'au premier rendu | Rendu initial en moins de 2 secondes | |
| Qualité finale | Observer la visualisation après chargement complet | Qualité adaptée aux capacités du dispositif | |
| Changement manuel | Exécuter `setQualityLevel('ultra')` dans console | Visualisation mise à jour avec nouvelle qualité | |

### 3.3 Optimisations de performance 3D

| Test | Procédure | Résultat attendu | Résultat obtenu |
|------|-----------|------------------|-----------------|
| Frustum culling | Zoomer/dézoomer et observer la console | Logs indiquant les objets culled/unculled | |
| Mise en cache des textures | Changer de col puis revenir au précédent | Chargement plus rapide au second affichage | |
| Déchargement ressources | Laisser une visualisation inactive pendant 5min | Ressources libérées de la mémoire | |
| Performance FPS | Observer le compteur FPS pendant la navigation 3D | FPS stable (>30 sur mobile, >60 sur desktop) | |

## 4. Tests de la configuration des timeouts

### 4.1 Configuration centralisée

| Test | Procédure | Résultat attendu | Résultat obtenu |
|------|-----------|------------------|-----------------|
| Valeurs configurées | Exécuter `timeoutConfig.getAllTimeouts()` | Liste des timeouts configurés par catégorie | |
| Obtention timeout | Exécuter `timeoutConfig.getTimeout('api.default')` | Valeur correcte retournée (ex: 10000ms) | |
| Modification timeout | Exécuter `timeoutConfig.setTimeout('api.default', 5000)` | Timeout mis à jour pour les prochains appels | |

### 4.2 Stratégie de retry

| Test | Procédure | Résultat attendu | Résultat obtenu |
|------|-----------|------------------|-----------------|
| Retry automatique | Provoquer une erreur réseau temporaire | Retries automatiques avec intervalles croissants | |
| Backoff exponentiel | Observer les logs pendant les retries | Intervalles suivant un pattern exponentiel | |
| Limite de retries | Provoquer des erreurs continues | Abandon après le nombre max de retries configuré | |

### 4.3 Utilitaires de timing

| Test | Procédure | Résultat attendu | Résultat obtenu |
|------|-----------|------------------|-----------------|
| Debounce | Exécuter une fonction debounced plusieurs fois rapidement | Fonction exécutée une seule fois après délai | |
| Throttle | Appeler une fonction throttled en continu | Fonction exécutée à intervalles réguliers | |
| Nettoyage | Vérifier les timeouts après navigation | Pas de fuites mémoire, tous les timeouts nettoyés | |

## 5. Tests de performance globale

### 5.1 Métriques de chargement

| Test | Procédure | Résultat attendu | Résultat obtenu |
|------|-----------|------------------|-----------------|
| Temps de chargement | Mesurer avec Performance panel Chrome | Réduction de 2-3s par rapport à la version précédente | |
| First Contentful Paint | Mesurer FCP avec Lighthouse | FCP < 1.8s sur connexion 4G | |
| Time To Interactive | Mesurer TTI avec Lighthouse | TTI < 3.8s sur connexion 4G | |

### 5.2 Utilisation des ressources

| Test | Procédure | Résultat attendu | Résultat obtenu |
|------|-----------|------------------|-----------------|
| Utilisation mémoire | Observer dans Task Manager du navigateur | Réduction de 40% pour visualisations 3D complexes | |
| Consommation CPU | Surveiller pendant navigation intensive | Pics CPU réduits, utilisation plus constante | |
| Requêtes réseau | Compter les requêtes dans Network panel | Réduction du nombre de requêtes grâce au cache | |

### 5.3 Performance sur différents appareils

| Test | Procédure | Résultat attendu | Résultat obtenu |
|------|-----------|------------------|-----------------|
| Desktop haut de gamme | Tester sur PC performant | Performance excellente (60+ FPS, chargement < 2s) | |
| Ordinateur portable moyen | Tester sur laptop standard | Performance bonne (45-60 FPS, chargement < 3s) | |
| Tablette | Tester sur tablette | Performance acceptable (30-45 FPS, chargement < 4s) | |
| Smartphone | Tester sur mobile moyen de gamme | Performance utilisable (25-30 FPS, chargement < 5s) | |

## 6. Tests d'accessibilité

### 6.1 Navigation au clavier

| Test | Procédure | Résultat attendu | Résultat obtenu |
|------|-----------|------------------|-----------------|
| Focus visible | Naviguer avec Tab entre les éléments | Indicateur de focus clairement visible | |
| Séquence logique | Vérifier l'ordre de tabulation | Ordre logique suivant la structure visuelle | |
| Contrôles 3D | Tester les contrôles de visualisation 3D | Toutes les fonctions accessibles au clavier | |

### 6.2 Lecteurs d'écran

| Test | Procédure | Résultat attendu | Résultat obtenu |
|------|-----------|------------------|-----------------|
| États de chargement | Tester avec lecteur d'écran pendant chargement | États annoncés clairement | |
| Descriptions alternatives | Vérifier descriptions pour visualisations | Alternatives textuelles informatives | |
| Messages d'erreur | Provoquer des erreurs et vérifier avec lecteur d'écran | Messages d'erreur clairement annoncés | |

### 6.3 Adaptabilité

| Test | Procédure | Résultat attendu | Résultat obtenu |
|------|-----------|------------------|-----------------|
| Zoom texte | Zoomer à 200% | Interface reste utilisable sans perte d'information | |
| Contraste | Vérifier avec l'outil Contrast Analyzer | Ratio de contraste conforme WCAG AA (4.5:1) | |
| Mode sombre | Activer le mode sombre s'il existe | Interface correctement adaptée | |

## Résumé et conclusion

| Catégorie | Nombre de tests | Tests réussis | Tests partiellement réussis | Tests échoués |
|-----------|-----------------|---------------|----------------------------|--------------|
| Feature Flags | | | | |
| Cache API | | | | |
| Visualisations 3D | | | | |
| Configuration Timeouts | | | | |
| Performance | | | | |
| Accessibilité | | | | |
| **TOTAL** | | | | |

### Problèmes identifiés

1. 
2. 
3. 

### Recommandations

1. 
2. 
3. 

### Date de test

Tester: ________________  
Date: _________________  
Version testée: __________

---

## Annexe : Scripts de test utiles

### Script de test de performance API

```javascript
// Mesure les performances du cache API
(async function testApiCache() {
  console.log("Test de performance API - Début");
  
  // Premier appel - depuis le réseau
  console.time("Premier appel");
  const result1 = await apiCacheService.get('/api/cols/featured', { strategy: 'network-only' });
  console.timeEnd("Premier appel");
  
  // Deuxième appel - depuis le cache
  console.time("Deuxième appel (cache)");
  const result2 = await apiCacheService.get('/api/cols/featured', { strategy: 'cache-first' });
  console.timeEnd("Deuxième appel (cache)");
  
  // Comparaison
  console.log("Amélioration: " + 
    (1 - (performance.timing[2] / performance.timing[1])) * 100 + "%");
  
  console.log("Test de performance API - Fin");
})();
```

### Script de test des feature flags

```javascript
// Vérifie la cohérence du système de feature flags
(function testFeatureFlags() {
  console.log("Test des feature flags - Début");
  
  const allFlags = featureFlagsService.getAll();
  console.table(allFlags);
  
  // Test d'override
  featureFlagsService.override('progressiveLoading', false);
  console.log("Override appliqué:", 
    featureFlagsService.isEnabled('progressiveLoading') === false);
  
  // Test de variante
  const variant = featureFlagsService.getVariant('qualityLevel');
  console.log("Variante actuelle:", variant);
  
  // Test de segmentation
  console.log("Flags éligibles:", featureFlagsService.getEligibleFlags());
  
  console.log("Test des feature flags - Fin");
})();
```

### Script de test de performance 3D

```javascript
// Mesure les performances des visualisations 3D
(function test3DPerformance() {
  console.log("Test de performance 3D - Début");
  
  let fps = 0;
  let frameCount = 0;
  let startTime = performance.now();
  
  // Moniteur FPS
  function checkFPS() {
    frameCount++;
    const elapsed = performance.now() - startTime;
    
    if (elapsed >= 1000) {
      fps = frameCount / (elapsed / 1000);
      console.log(`FPS actuel: ${fps.toFixed(1)}`);
      frameCount = 0;
      startTime = performance.now();
    }
    
    requestAnimationFrame(checkFPS);
  }
  
  // Démarrer la mesure
  checkFPS();
  
  // Test de différents niveaux de qualité
  setTimeout(() => progressive3DLoader.setQualityLevel('low'), 5000);
  setTimeout(() => progressive3DLoader.setQualityLevel('medium'), 10000);
  setTimeout(() => progressive3DLoader.setQualityLevel('high'), 15000);
  
  console.log("Test de performance 3D - Les résultats s'afficheront toutes les secondes");
})();
```
