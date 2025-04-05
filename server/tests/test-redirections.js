/**
 * Test des redirections pour Dashboard-Velo
 * Vérifie que les endpoints API fonctionnent correctement avec les règles de redirection nginx
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

// Configuration
const config = {
  // Domaines à tester
  domains: {
    old: 'https://grand-est-cyclisme.fr',
    new: 'https://dashboard-velo.com'
  },
  
  // Endpoints API à tester
  endpoints: [
    '/api/dashboard/status',
    '/api/dashboard/analytics',
    '/api/dashboard/real-time',
    '/api/dashboard/recommendations',
    '/api/dashboard/predictions',
    '/api/route',
    '/api/elevation',
    '/api/geocode',
    '/api/places'
  ],
  
  // Paramètres de pays et région à tester
  geoParams: [
    { country: 'fr', region: null },
    { country: 'de', region: null },
    { country: null, region: 'western' },
    { country: null, region: 'eastern' },
    { country: null, region: null }
  ],
  
  // Timeout pour les requêtes (ms)
  timeout: 5000,
  
  // Nombre de tentatives par requête
  retries: 3
};

// Résultats des tests
const results = {
  total: 0,
  success: 0,
  redirect: 0,
  failed: 0,
  details: []
};

/**
 * Teste une redirection
 * @param {string} from - URL source
 * @param {string} to - URL de destination attendue
 * @param {Object} params - Paramètres de requête
 * @returns {Promise<Object>} Résultat du test
 */
async function testRedirection(from, to, params = {}) {
  const startTime = performance.now();
  let result = {
    from,
    to,
    params,
    success: false,
    redirected: false,
    finalUrl: null,
    error: null,
    responseTime: 0
  };
  
  try {
    // Configurer la requête pour suivre les redirections
    const response = await axios.get(from, {
      params,
      maxRedirects: 5,
      validateStatus: status => status < 500, // Accepter les codes 2xx, 3xx et 4xx
      timeout: config.timeout
    });
    
    const endTime = performance.now();
    result.responseTime = endTime - startTime;
    
    // Vérifier si la requête a été redirigée
    result.redirected = response.request.res.responseUrl !== from;
    result.finalUrl = response.request.res.responseUrl;
    
    // Vérifier si la redirection est correcte
    if (result.redirected) {
      // Vérifier si l'URL finale correspond à la destination attendue
      // Note: Nous vérifions seulement si l'URL finale contient l'URL de destination,
      // car les paramètres de requête peuvent modifier l'URL exacte
      result.success = result.finalUrl.includes(to);
    } else {
      // Si pas de redirection, vérifier si le statut est 200 OK
      result.success = response.status === 200;
    }
    
    // Ajouter des informations supplémentaires
    result.status = response.status;
    result.statusText = response.statusText;
    
  } catch (error) {
    const endTime = performance.now();
    result.responseTime = endTime - startTime;
    
    result.error = error.message;
    
    // Vérifier si l'erreur est due à une redirection
    if (error.response && error.response.status >= 300 && error.response.status < 400) {
      result.redirected = true;
      result.finalUrl = error.response.headers.location;
      result.success = result.finalUrl.includes(to);
      result.status = error.response.status;
      result.statusText = error.response.statusText;
    }
  }
  
  return result;
}

/**
 * Teste un endpoint API avec différents paramètres géographiques
 * @param {string} endpoint - Endpoint API à tester
 * @returns {Promise<Array>} Résultats des tests
 */
async function testEndpoint(endpoint) {
  const results = [];
  
  // Tester la redirection de base
  const oldUrl = `${config.domains.old}${endpoint}`;
  const newUrl = `${config.domains.new}${endpoint}`;
  
  // Tester avec différents paramètres géographiques
  for (const geoParam of config.geoParams) {
    const params = {};
    
    if (geoParam.country) {
      params.country = geoParam.country;
    }
    
    if (geoParam.region) {
      params.region = geoParam.region;
    }
    
    // Effectuer le test avec plusieurs tentatives si nécessaire
    let result = null;
    
    for (let attempt = 0; attempt < config.retries; attempt++) {
      result = await testRedirection(oldUrl, newUrl, params);
      
      if (result.success) {
        break;
      }
      
      // Attendre un peu avant de réessayer
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    results.push(result);
  }
  
  return results;
}

/**
 * Exécute tous les tests de redirection
 */
async function runAllTests() {
  console.log('=== Test des redirections pour Dashboard-Velo ===');
  console.log(`Ancien domaine: ${config.domains.old}`);
  console.log(`Nouveau domaine: ${config.domains.new}`);
  console.log('================================================');
  
  // Tester chaque endpoint
  for (const endpoint of config.endpoints) {
    console.log(`\nTest de l'endpoint: ${endpoint}`);
    
    const endpointResults = await testEndpoint(endpoint);
    
    // Mettre à jour les statistiques
    results.total += endpointResults.length;
    
    for (const result of endpointResults) {
      if (result.success) {
        results.success++;
        
        if (result.redirected) {
          results.redirect++;
          console.log(`✅ ${result.from} -> ${result.finalUrl} (${result.responseTime.toFixed(0)}ms)`);
        } else {
          console.log(`✅ ${result.from} (${result.responseTime.toFixed(0)}ms)`);
        }
      } else {
        results.failed++;
        console.log(`❌ ${result.from} -> ${result.error || 'Échec'} (${result.responseTime.toFixed(0)}ms)`);
      }
      
      // Ajouter aux détails
      results.details.push(result);
    }
  }
  
  // Afficher le résumé
  console.log('\n=== Résumé des tests ===');
  console.log(`Total: ${results.total}`);
  console.log(`Succès: ${results.success} (${((results.success / results.total) * 100).toFixed(1)}%)`);
  console.log(`Redirections: ${results.redirect}`);
  console.log(`Échecs: ${results.failed}`);
  
  // Afficher les échecs en détail
  if (results.failed > 0) {
    console.log('\n=== Détail des échecs ===');
    
    const failures = results.details.filter(result => !result.success);
    
    failures.forEach((failure, index) => {
      console.log(`\nÉchec #${index + 1}:`);
      console.log(`URL: ${failure.from}`);
      console.log(`Paramètres: ${JSON.stringify(failure.params)}`);
      console.log(`Erreur: ${failure.error || 'Inconnue'}`);
      
      if (failure.redirected) {
        console.log(`Redirection vers: ${failure.finalUrl}`);
      }
      
      if (failure.status) {
        console.log(`Statut: ${failure.status} ${failure.statusText}`);
      }
    });
    
    console.log('\nRecommandations:');
    console.log('1. Vérifiez que les règles de redirection nginx sont correctement configurées');
    console.log('2. Assurez-vous que les endpoints API sont accessibles sur le nouveau domaine');
    console.log('3. Vérifiez que les paramètres de pays et région sont correctement transmis lors des redirections');
  }
}

// Exécuter les tests
runAllTests().catch(error => {
  console.error('Erreur lors de l\'exécution des tests:', error);
});
