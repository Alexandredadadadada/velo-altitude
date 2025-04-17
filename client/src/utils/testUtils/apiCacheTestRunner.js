/**
 * Utilitaire pour tester le système de cache API
 * Permet de vérifier les stratégies de cache et les mécanismes d'invalidation
 */

// Configuration des tests
const TEST_CONFIG = {
  endpoints: [
    '/api/cols/featured',
    '/api/cols/all',
    '/api/cols/7-majors',
    '/api/routes/featured',
    '/api/weather/current'
  ],
  strategies: ['cache-first', 'network-only', 'stale-while-revalidate'],
  ttlValues: [0, 30, 300, 3600],
  tags: ['cols', 'routes', 'weather', '7-majors', 'global']
};

// Résultats des tests
let testResults = {
  strategies: {},
  invalidation: {},
  persistence: {},
  tags: {},
  ttl: {},
  performance: {},
  timestamp: new Date().toISOString()
};

/**
 * Exécute les tests des stratégies de cache
 * @returns {Promise<Object>} Résultats des tests
 */
export async function runCacheStrategiesTests() {
  console.log('🔍 Exécution des tests des stratégies de cache API...');
  
  const results = {};
  
  // Vérifier l'accès au service
  if (!window.apiCacheService) {
    console.error('❌ Service de cache API non disponible');
    return { error: 'Service non disponible' };
  }
  
  // Tester chaque endpoint avec chaque stratégie
  for (const endpoint of TEST_CONFIG.endpoints) {
    results[endpoint] = {};
    
    // Effacer le cache pour cet endpoint pour commencer avec un état propre
    try {
      window.apiCacheService.invalidate(endpoint);
    } catch (error) {
      console.warn(`⚠️ Impossible d'invalider le cache pour ${endpoint}:`, error);
    }
    
    // Tester chaque stratégie
    for (const strategy of TEST_CONFIG.strategies) {
      results[endpoint][strategy] = {};
      
      try {
        // Premier appel (toujours depuis le réseau)
        console.log(`⏱️ Premier appel à ${endpoint} avec stratégie ${strategy}...`);
        const startFirst = performance.now();
        const resultFirst = await window.apiCacheService.get(endpoint, { strategy });
        const durationFirst = performance.now() - startFirst;
        
        results[endpoint][strategy].firstCall = {
          duration: durationFirst,
          fromCache: false,
          success: !!resultFirst
        };
        
        // Deuxième appel (potentiellement depuis le cache)
        console.log(`⏱️ Deuxième appel à ${endpoint} avec stratégie ${strategy}...`);
        const startSecond = performance.now();
        const resultSecond = await window.apiCacheService.get(endpoint, { strategy });
        const durationSecond = performance.now() - startSecond;
        
        results[endpoint][strategy].secondCall = {
          duration: durationSecond,
          speedup: durationFirst / durationSecond,
          fromCache: durationSecond < durationFirst * 0.5, // Heuristique: si 2x plus rapide, probablement du cache
          success: !!resultSecond
        };
        
        // Pour stale-while-revalidate, vérifier le comportement spécifique
        if (strategy === 'stale-while-revalidate') {
          // Troisième appel après courte attente
          await new Promise(resolve => setTimeout(resolve, 100));
          console.log(`⏱️ Troisième appel à ${endpoint} avec stratégie ${strategy} (après mise à jour)...`);
          const startThird = performance.now();
          const resultThird = await window.apiCacheService.get(endpoint, { strategy });
          const durationThird = performance.now() - startThird;
          
          results[endpoint][strategy].thirdCall = {
            duration: durationThird,
            speedup: durationFirst / durationThird,
            // Pour stale-while-revalidate, le 3ème appel devrait être rapide car données déjà mises à jour
            fromCache: true,
            success: !!resultThird
          };
        }
        
      } catch (error) {
        console.error(`❌ Erreur lors du test de ${endpoint} avec stratégie ${strategy}:`, error);
        results[endpoint][strategy].error = error.message;
      }
    }
  }
  
  testResults.strategies = results;
  console.log('✅ Tests des stratégies de cache terminés');
  
  return results;
}

/**
 * Exécute les tests d'invalidation du cache
 * @returns {Promise<Object>} Résultats des tests
 */
export async function runCacheInvalidationTests() {
  console.log('🔍 Exécution des tests d\'invalidation du cache API...');
  
  const results = {
    manual: {},
    ttl: {},
    tags: {}
  };
  
  // Tester l'invalidation manuelle
  for (const endpoint of TEST_CONFIG.endpoints.slice(0, 2)) {
    results.manual[endpoint] = {};
    
    try {
      // Effacer le cache existant
      window.apiCacheService.invalidate(endpoint);
      
      // Premier appel pour remplir le cache
      await window.apiCacheService.get(endpoint, { strategy: 'cache-first' });
      
      // Vérifier que le cache existe
      const cacheExists = window.apiCacheService.has(endpoint);
      results.manual[endpoint].cacheExists = cacheExists;
      
      if (cacheExists) {
        // Invalider manuellement
        window.apiCacheService.invalidate(endpoint);
        
        // Vérifier que le cache est invalidé
        const cacheAfterInvalidation = window.apiCacheService.has(endpoint);
        results.manual[endpoint].cacheInvalidated = !cacheAfterInvalidation;
        
        console.log(`🗑️ Invalidation manuelle pour ${endpoint}: ${!cacheAfterInvalidation ? '✅ Réussie' : '❌ Échouée'}`);
      } else {
        console.warn(`⚠️ Le cache n'a pas été créé pour ${endpoint}`);
        results.manual[endpoint].error = 'Cache non créé';
      }
    } catch (error) {
      console.error(`❌ Erreur lors du test d'invalidation manuelle pour ${endpoint}:`, error);
      results.manual[endpoint].error = error.message;
    }
  }
  
  // Tester l'invalidation par TTL
  for (const ttl of TEST_CONFIG.ttlValues.slice(0, 2)) {
    results.ttl[`ttl_${ttl}`] = {};
    const testEndpoint = TEST_CONFIG.endpoints[0];
    
    try {
      // Effacer le cache existant
      window.apiCacheService.invalidate(testEndpoint);
      
      // Définir un TTL court pour ce test
      console.log(`⏱️ Test TTL de ${ttl}s pour ${testEndpoint}...`);
      
      // Premier appel avec TTL spécifique
      await window.apiCacheService.get(testEndpoint, { 
        strategy: 'cache-first',
        ttl: ttl * 1000 // Convertir en ms
      });
      
      // Vérifier que le cache existe
      const cacheExistsBeforeTTL = window.apiCacheService.has(testEndpoint);
      results.ttl[`ttl_${ttl}`].cacheExistsBeforeTTL = cacheExistsBeforeTTL;
      
      if (ttl > 0) {
        // Attendre que le TTL expire (si pas trop long)
        if (ttl <= 30) { // Limiter à 30s max pour les tests
          console.log(`⏳ Attente de ${ttl}s pour expiration du TTL...`);
          await new Promise(resolve => setTimeout(resolve, ttl * 1000 + 500)); // +500ms pour être sûr
          
          // Pour les TTL courts, on peut vérifier l'expiration
          // Pour les longs, on simule en regardant les métadonnées
          const cacheExistsAfterTTL = window.apiCacheService.has(testEndpoint);
          results.ttl[`ttl_${ttl}`].cacheExistsAfterTTL = cacheExistsAfterTTL;
          results.ttl[`ttl_${ttl}`].ttlExpired = !cacheExistsAfterTTL;
          
          console.log(`🕒 Expiration TTL pour ${testEndpoint}: ${!cacheExistsAfterTTL ? '✅ Réussie' : '❌ Échouée'}`);
        } else {
          // Pour les TTL longs, vérifier les métadonnées
          try {
            const metadata = JSON.parse(localStorage.getItem('api_cache_metadata')) || {};
            const entryMetadata = metadata[testEndpoint];
            
            if (entryMetadata && entryMetadata.expiresAt) {
              const expiresAt = new Date(entryMetadata.expiresAt);
              const now = new Date();
              const ttlSet = expiresAt > now;
              const remainingTime = (expiresAt - now) / 1000;
              
              results.ttl[`ttl_${ttl}`].ttlSet = ttlSet;
              results.ttl[`ttl_${ttl}`].remainingTime = remainingTime;
              
              console.log(`🕒 TTL configuré pour ${testEndpoint}: ${ttlSet ? '✅ Réussi' : '❌ Échoué'}, expire dans ${remainingTime.toFixed(1)}s`);
            } else {
              console.warn(`⚠️ Métadonnées TTL non trouvées pour ${testEndpoint}`);
              results.ttl[`ttl_${ttl}`].ttlSet = false;
            }
          } catch (error) {
            console.error(`❌ Erreur lors de la vérification des métadonnées TTL:`, error);
            results.ttl[`ttl_${ttl}`].error = error.message;
          }
        }
      } else {
        // TTL de 0 devrait signifier "pas de mise en cache"
        results.ttl[`ttl_${ttl}`].noCaching = !cacheExistsBeforeTTL;
        console.log(`🕒 Pas de mise en cache avec TTL=0: ${!cacheExistsBeforeTTL ? '✅ Réussie' : '❌ Échouée'}`);
      }
    } catch (error) {
      console.error(`❌ Erreur lors du test TTL de ${ttl}s:`, error);
      results.ttl[`ttl_${ttl}`].error = error.message;
    }
  }
  
  // Tester l'invalidation par tags
  for (const tag of TEST_CONFIG.tags.slice(0, 3)) {
    results.tags[tag] = { endpoints: {} };
    
    try {
      // Identifier les endpoints qui devraient avoir ce tag
      const relevantEndpoints = TEST_CONFIG.endpoints.filter(e => 
        e.includes(tag) || (tag === 'global'));
      
      if (relevantEndpoints.length === 0) {
        console.warn(`⚠️ Aucun endpoint pertinent trouvé pour le tag ${tag}`);
        results.tags[tag].error = 'Aucun endpoint pertinent';
        continue;
      }
      
      // Effacer le cache existant pour ces endpoints
      relevantEndpoints.forEach(e => window.apiCacheService.invalidate(e));
      
      // Remplir le cache pour ces endpoints avec le tag spécifié
      for (const endpoint of relevantEndpoints) {
        await window.apiCacheService.get(endpoint, { 
          strategy: 'cache-first',
          tags: [tag]
        });
        results.tags[tag].endpoints[endpoint] = { cached: true };
      }
      
      // Vérifier que les caches existent
      let allCachesExist = true;
      for (const endpoint of relevantEndpoints) {
        const cacheExists = window.apiCacheService.has(endpoint);
        results.tags[tag].endpoints[endpoint].cacheExists = cacheExists;
        allCachesExist = allCachesExist && cacheExists;
      }
      
      results.tags[tag].allCachesExist = allCachesExist;
      
      if (allCachesExist) {
        // Invalider par tag
        console.log(`🏷️ Invalidation par tag ${tag}...`);
        window.apiCacheService.invalidateByTag(tag);
        
        // Vérifier que tous les caches sont invalidés
        let allCachesInvalidated = true;
        for (const endpoint of relevantEndpoints) {
          const cacheExists = window.apiCacheService.has(endpoint);
          results.tags[tag].endpoints[endpoint].cacheInvalidated = !cacheExists;
          allCachesInvalidated = allCachesInvalidated && !cacheExists;
        }
        
        results.tags[tag].allCachesInvalidated = allCachesInvalidated;
        console.log(`🏷️ Invalidation par tag ${tag}: ${allCachesInvalidated ? '✅ Réussie' : '❌ Partiellement échouée'}`);
      } else {
        console.warn(`⚠️ Tous les caches n'ont pas été créés pour le tag ${tag}`);
        results.tags[tag].error = 'Création de cache incomplète';
      }
    } catch (error) {
      console.error(`❌ Erreur lors du test d'invalidation par tag ${tag}:`, error);
      results.tags[tag].error = error.message;
    }
  }
  
  testResults.invalidation = results;
  console.log('✅ Tests d\'invalidation du cache terminés');
  
  return results;
}

/**
 * Exécute les tests de persistance du cache
 * @returns {Object} Résultats des tests
 */
export function runCachePersistenceTests() {
  console.log('🔍 Exécution des tests de persistance du cache API...');
  
  const results = {
    localStorage: {},
    size: {},
    structure: {}
  };
  
  // Vérifier la persistance dans localStorage
  try {
    const cacheKeys = Object.keys(localStorage).filter(k => k.startsWith('api_cache_'));
    results.localStorage.cacheKeysCount = cacheKeys.length;
    results.localStorage.cacheKeysPresent = cacheKeys.length > 0;
    
    console.log(`💾 ${cacheKeys.length} entrées de cache trouvées dans localStorage`);
    
    // Vérifier la présence des métadonnées
    const metadataKey = 'api_cache_metadata';
    const hasMetadata = localStorage.getItem(metadataKey) !== null;
    results.localStorage.hasMetadata = hasMetadata;
    
    if (hasMetadata) {
      // Analyser la structure des métadonnées
      const metadata = JSON.parse(localStorage.getItem(metadataKey)) || {};
      const metadataEntries = Object.keys(metadata).length;
      results.localStorage.metadataEntries = metadataEntries;
      
      console.log(`📋 Métadonnées de cache trouvées avec ${metadataEntries} entrées`);
      
      // Vérifier des champs clés dans les métadonnées
      if (metadataEntries > 0) {
        const sampleEntry = Object.values(metadata)[0];
        results.structure.hasCreatedAt = 'createdAt' in sampleEntry;
        results.structure.hasExpiresAt = 'expiresAt' in sampleEntry;
        results.structure.hasTags = 'tags' in sampleEntry;
        
        console.log(`🔍 Structure des métadonnées: ${
          results.structure.hasCreatedAt ? '✓createdAt ' : '✗createdAt '
        }${
          results.structure.hasExpiresAt ? '✓expiresAt ' : '✗expiresAt '
        }${
          results.structure.hasTags ? '✓tags' : '✗tags'
        }`);
      }
    } else {
      console.warn('⚠️ Aucune métadonnée de cache trouvée');
    }
    
    // Estimer la taille utilisée
    let totalSize = 0;
    for (const key of cacheKeys) {
      const item = localStorage.getItem(key);
      totalSize += (key.length + (item ? item.length : 0)) * 2; // Approximation: 2 octets par caractère
    }
    
    results.size.totalBytes = totalSize;
    results.size.totalKB = totalSize / 1024;
    results.size.averageEntryBytes = cacheKeys.length > 0 ? totalSize / cacheKeys.length : 0;
    
    console.log(`📊 Taille estimée du cache: ${(totalSize / 1024).toFixed(1)} KB (${cacheKeys.length} entrées)`);
    
  } catch (error) {
    console.error('❌ Erreur lors des tests de persistance:', error);
    results.error = error.message;
  }
  
  testResults.persistence = results;
  console.log('✅ Tests de persistance du cache terminés');
  
  return results;
}

/**
 * Exécute des tests de performance pour le cache API
 * @returns {Promise<Object>} Résultats des tests
 */
export async function runApiCachePerformanceTests() {
  console.log('🔍 Exécution des tests de performance du cache API...');
  
  const results = {
    endpoints: {},
    summary: {}
  };
  
  // Tester la performance pour quelques endpoints
  for (const endpoint of TEST_CONFIG.endpoints.slice(0, 3)) {
    results.endpoints[endpoint] = {};
    
    try {
      // Effacer le cache existant
      window.apiCacheService.invalidate(endpoint);
      
      // Test network-only (référence)
      console.log(`⏱️ Test de performance network-only pour ${endpoint}...`);
      const networkTimes = [];
      for (let i = 0; i < 3; i++) {
        const start = performance.now();
        await window.apiCacheService.get(endpoint, { strategy: 'network-only' });
        const duration = performance.now() - start;
        networkTimes.push(duration);
        await new Promise(resolve => setTimeout(resolve, 300)); // Pause entre les appels
      }
      
      // Calculer la moyenne des temps réseau
      const avgNetworkTime = networkTimes.reduce((a, b) => a + b, 0) / networkTimes.length;
      results.endpoints[endpoint].networkOnly = {
        times: networkTimes,
        average: avgNetworkTime
      };
      
      // Test cache-first
      console.log(`⏱️ Test de performance cache-first pour ${endpoint}...`);
      
      // Premier appel (remplissage du cache)
      const cacheStartFirst = performance.now();
      await window.apiCacheService.get(endpoint, { strategy: 'cache-first' });
      const cacheDurationFirst = performance.now() - cacheStartFirst;
      
      // Appels suivants (depuis le cache)
      const cacheTimes = [];
      for (let i = 0; i < 3; i++) {
        const start = performance.now();
        await window.apiCacheService.get(endpoint, { strategy: 'cache-first' });
        const duration = performance.now() - start;
        cacheTimes.push(duration);
        await new Promise(resolve => setTimeout(resolve, 100)); // Pause courte entre les appels
      }
      
      // Calculer la moyenne des temps cache
      const avgCacheTime = cacheTimes.reduce((a, b) => a + b, 0) / cacheTimes.length;
      results.endpoints[endpoint].cacheFirst = {
        firstTime: cacheDurationFirst,
        times: cacheTimes,
        average: avgCacheTime
      };
      
      // Calculer l'amélioration
      const improvement = ((avgNetworkTime - avgCacheTime) / avgNetworkTime) * 100;
      results.endpoints[endpoint].improvement = improvement;
      
      console.log(`📈 Amélioration pour ${endpoint}: ${improvement.toFixed(1)}% (${avgNetworkTime.toFixed(1)}ms → ${avgCacheTime.toFixed(1)}ms)`);
      
    } catch (error) {
      console.error(`❌ Erreur lors des tests de performance pour ${endpoint}:`, error);
      results.endpoints[endpoint].error = error.message;
    }
  }
  
  // Calculer des statistiques globales
  try {
    const validResults = Object.values(results.endpoints).filter(r => !r.error);
    
    if (validResults.length > 0) {
      const avgImprovement = validResults.reduce((sum, r) => sum + r.improvement, 0) / validResults.length;
      const maxImprovement = Math.max(...validResults.map(r => r.improvement));
      const minImprovement = Math.min(...validResults.map(r => r.improvement));
      
      results.summary = {
        averageImprovement: avgImprovement,
        minImprovement,
        maxImprovement,
        endpointsTested: validResults.length
      };
      
      console.log(`📊 Amélioration moyenne: ${avgImprovement.toFixed(1)}% (min: ${minImprovement.toFixed(1)}%, max: ${maxImprovement.toFixed(1)}%)`);
    } else {
      console.warn('⚠️ Aucun résultat valide pour calculer des statistiques');
      results.summary.error = 'Données insuffisantes';
    }
  } catch (error) {
    console.error('❌ Erreur lors du calcul des statistiques:', error);
    results.summary.error = error.message;
  }
  
  testResults.performance = results;
  console.log('✅ Tests de performance du cache API terminés');
  
  return results;
}

/**
 * Génère un rapport des tests du cache API
 * @returns {Object} Rapport de tests
 */
export function generateApiCacheReport() {
  console.log('📊 Génération du rapport de tests du cache API...');
  
  const report = {
    summary: {
      strategies: {},
      invalidation: {
        manual: {
          tested: Object.keys(testResults.invalidation.manual).length,
          successful: Object.values(testResults.invalidation.manual)
            .filter(r => r.cacheInvalidated).length
        },
        ttl: {
          tested: Object.keys(testResults.invalidation.ttl).length,
          successful: Object.values(testResults.invalidation.ttl)
            .filter(r => r.ttlExpired || r.ttlSet).length
        },
        tags: {
          tested: Object.keys(testResults.invalidation.tags).length,
          successful: Object.values(testResults.invalidation.tags)
            .filter(r => r.allCachesInvalidated).length
        }
      },
      persistence: {
        entriesStored: testResults.persistence.localStorage?.cacheKeysCount || 0,
        metadataPresent: testResults.persistence.localStorage?.hasMetadata || false,
        sizeKB: testResults.persistence.size?.totalKB?.toFixed(1) || 0
      },
      performance: testResults.performance.summary || {}
    },
    details: testResults,
    timestamp: testResults.timestamp
  };
  
  // Résumer les résultats des stratégies
  for (const strategy of TEST_CONFIG.strategies) {
    const results = Object.values(testResults.strategies)
      .map(e => e[strategy])
      .filter(s => s && !s.error);
    
    const successfulCalls = results
      .filter(s => s.secondCall && s.secondCall.success)
      .length;
    
    const cachedCalls = results
      .filter(s => s.secondCall && s.secondCall.fromCache)
      .length;
    
    report.summary.strategies[strategy] = {
      tested: results.length,
      successful: successfulCalls,
      cachedCalls: strategy !== 'network-only' ? cachedCalls : 0,
      cachingRate: strategy !== 'network-only' && results.length > 0 ? 
        (cachedCalls / results.length * 100).toFixed(1) + '%' : 'N/A'
    };
  }
  
  console.log('✅ Rapport de tests du cache API généré');
  console.table(report.summary.strategies);
  console.table(report.summary.invalidation);
  console.table(report.summary.performance);
  
  return report;
}

/**
 * Exporte les résultats des tests au format JSON
 */
export function exportTestResults() {
  const jsonStr = JSON.stringify(testResults, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `api-cache-test-results-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  console.log('💾 Résultats des tests exportés');
}

/**
 * Exécute tous les tests du cache API
 */
export async function runAllApiCacheTests() {
  console.log('🚀 Démarrage de la suite de tests du cache API...');
  
  await runCacheStrategiesTests();
  await runCacheInvalidationTests();
  runCachePersistenceTests(); // Synchrone
  await runApiCachePerformanceTests();
  
  const report = generateApiCacheReport();
  
  console.log('🏁 Suite de tests terminée');
  
  return report;
}

// Assign object to a variable before exporting as module default
const apiCacheTestRunner = {
  runCacheStrategiesTests,
  runCacheInvalidationTests,
  runCachePersistenceTests,
  runApiCachePerformanceTests,
  generateApiCacheReport,
  exportTestResults,
  runAllApiCacheTests
};

export default apiCacheTestRunner;
