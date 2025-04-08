/**
 * API Validation Script - Public Endpoints
 * 
 * Ce script valide les endpoints publics du RealApiOrchestrator contre le backend réel.
 * Il teste spécifiquement les endpoints pour les cols et la météo.
 */

import RealApiOrchestrator from '../services/api/RealApiOrchestrator';
import RealApiOrchestratorPart2 from '../services/api/RealApiOrchestratorPart2';
import { saveValidationReport } from './validation-utils';

// Format des résultats de validation
const formatResult = (endpoint, success, response, error) => ({
  endpoint,
  success,
  timestamp: new Date().toISOString(),
  response: success ? response : null,
  error: !success ? (error?.response?.data || error?.message || String(error)) : null,
  statusCode: error?.response?.status,
  responseFormat: success ? describeResponseFormat(response) : null,
});

// Décrit le format d'une réponse pour la documentation
const describeResponseFormat = (response) => {
  if (!response) return 'Pas de réponse';
  
  if (Array.isArray(response)) {
    return `Array[${response.length}] avec clés: ${response.length > 0 ? Object.keys(response[0]).join(', ') : 'aucune'}`;
  } else if (typeof response === 'object') {
    return `Object avec clés: ${Object.keys(response).join(', ')}`;
  }
  
  return typeof response;
};

// Journalise les résultats
const logResult = (result) => {
  const status = result.success ? '✅ PASSED' : '❌ FAILED';
  console.log(`[${status}] ${result.endpoint}`);
  
  if (result.success) {
    console.log('  Response:', typeof result.response === 'object' ? 'Object with keys: ' + Object.keys(result.response).join(', ') : result.response);
    console.log('  Format:', result.responseFormat);
  } else {
    console.log('  Error:', result.error);
    if (result.statusCode) console.log('  Status:', result.statusCode);
  }
  console.log('\n');
};

// Fonction principale de validation
const validatePublicEndpoints = async () => {
  const results = [];
  
  console.log('API Validation - Endpoints Publics');
  console.log('-----------------------------------\n');
  
  // Test des endpoints pour les cols
  console.log('TESTING COLS ENDPOINTS\n');
  
  try {
    console.log('Testing getAllCols()...');
    const cols = await RealApiOrchestrator.getAllCols();
    results.push(formatResult('getAllCols', true, cols));
    logResult(results[results.length - 1]);
    
    if (cols && cols.length > 0) {
      // Test d'un col individuel avec un ID réel
      try {
        const colId = cols[0].id;
        console.log(`Testing getColById('${colId}')...`);
        const col = await RealApiOrchestrator.getColById(colId);
        results.push(formatResult(`getColById('${colId}')`, true, col));
        logResult(results[results.length - 1]);
      } catch (error) {
        results.push(formatResult(`getColById avec ID du premier col`, false, null, error));
        logResult(results[results.length - 1]);
      }
      
      // Test de recherche de cols avec un terme d'un col réel
      if (cols[0].name) {
        try {
          const searchTerm = cols[0].name.split(' ')[0]; // Utiliser le premier mot du nom
          console.log(`Testing searchCols('${searchTerm}')...`);
          const searchResults = await RealApiOrchestrator.searchCols(searchTerm);
          results.push(formatResult(`searchCols('${searchTerm}')`, true, searchResults));
          logResult(results[results.length - 1]);
        } catch (error) {
          results.push(formatResult(`searchCols avec terme d'un col réel`, false, null, error));
          logResult(results[results.length - 1]);
        }
      }
      
      // Test du filtrage par région si les données de région sont disponibles
      if (cols[0].region) {
        try {
          const region = cols[0].region;
          console.log(`Testing getColsByRegion('${region}')...`);
          const regionCols = await RealApiOrchestrator.getColsByRegion(region);
          results.push(formatResult(`getColsByRegion('${region}')`, true, regionCols));
          logResult(results[results.length - 1]);
        } catch (error) {
          results.push(formatResult(`getColsByRegion avec région d'un col réel`, false, null, error));
          logResult(results[results.length - 1]);
        }
      }
      
      // Test du filtrage par difficulté si les données de difficulté sont disponibles
      if (cols[0].difficulty) {
        try {
          const difficulty = cols[0].difficulty;
          console.log(`Testing getColsByDifficulty('${difficulty}')...`);
          const difficultyCols = await RealApiOrchestrator.getColsByDifficulty(difficulty);
          results.push(formatResult(`getColsByDifficulty('${difficulty}')`, true, difficultyCols));
          logResult(results[results.length - 1]);
        } catch (error) {
          results.push(formatResult(`getColsByDifficulty avec difficulté d'un col réel`, false, null, error));
          logResult(results[results.length - 1]);
        }
      }
      
      // Test des endpoints météo en utilisant l'ID d'un col réel
      console.log('\nTESTING WEATHER ENDPOINTS\n');
      
      try {
        console.log(`Testing getColWeather('${cols[0].id}')...`);
        const weather = await RealApiOrchestratorPart2.getColWeather(cols[0].id);
        results.push(formatResult(`getColWeather('${cols[0].id}')`, true, weather));
        logResult(results[results.length - 1]);
      } catch (error) {
        results.push(formatResult(`getColWeather avec ID d'un col réel`, false, null, error));
        logResult(results[results.length - 1]);
      }
      
      try {
        console.log(`Testing getWeatherForecast('${cols[0].id}', 3)...`);
        const forecast = await RealApiOrchestratorPart2.getWeatherForecast(cols[0].id, 3);
        results.push(formatResult(`getWeatherForecast('${cols[0].id}', 3)`, true, forecast));
        logResult(results[results.length - 1]);
      } catch (error) {
        results.push(formatResult(`getWeatherForecast avec ID d'un col réel`, false, null, error));
        logResult(results[results.length - 1]);
      }
      
      // Test de l'endpoint météo par coordonnées si disponibles
      if (cols[0].latitude && cols[0].longitude) {
        try {
          console.log(`Testing getLocationWeather(${cols[0].latitude}, ${cols[0].longitude})...`);
          const locationWeather = await RealApiOrchestratorPart2.getLocationWeather(cols[0].latitude, cols[0].longitude);
          results.push(formatResult(`getLocationWeather(${cols[0].latitude}, ${cols[0].longitude})`, true, locationWeather));
          logResult(results[results.length - 1]);
        } catch (error) {
          results.push(formatResult(`getLocationWeather avec coordonnées d'un col réel`, false, null, error));
          logResult(results[results.length - 1]);
        }
      }
    }
  } catch (error) {
    console.error('Erreur initiale lors de la récupération des cols:', error);
    results.push(formatResult('getAllCols', false, null, error));
    logResult(results[results.length - 1]);
  }
  
  // Test de l'endpoint de recherche globale
  console.log('\nTESTING GLOBAL SEARCH\n');
  
  try {
    const searchQuery = 'alpe';
    console.log(`Testing searchGlobal('${searchQuery}')...`);
    const searchResults = await RealApiOrchestratorPart3.searchGlobal(searchQuery);
    results.push(formatResult(`searchGlobal('${searchQuery}')`, true, searchResults));
    logResult(results[results.length - 1]);
  } catch (error) {
    results.push(formatResult(`searchGlobal avec terme de recherche commun`, false, null, error));
    logResult(results[results.length - 1]);
  }
  
  // Générer le résumé
  console.log('\n\n-----------------------------------');
  console.log('RÉSUMÉ DE LA VALIDATION DES ENDPOINTS PUBLICS');
  console.log('-----------------------------------');
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  
  console.log(`Total des Tests: ${totalTests}`);
  console.log(`Réussis: ${passedTests} (${Math.round(passedTests/totalTests*100)}%)`);
  console.log(`Échoués: ${failedTests} (${Math.round(failedTests/totalTests*100)}%)`);
  
  if (failedTests > 0) {
    console.log('\nEndpoints en échec:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`- ${result.endpoint}: ${result.error} (Status: ${result.statusCode || 'N/A'})`);
    });
  }
  
  // Générer un rapport de validation au format markdown
  const validationReport = generateValidationReport(results);
  saveValidationReport('public-endpoints', validationReport);
  
  return {
    results,
    summary: {
      totalTests,
      passedTests,
      failedTests,
      date: new Date().toISOString(),
    }
  };
};

// Génère un rapport de validation au format markdown
const generateValidationReport = (results) => {
  const date = new Date().toLocaleString();
  const passedTests = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  let report = `# Rapport de Validation API - Endpoints Publics\n\n`;
  report += `## Informations Générales\n\n`;
  report += `- **Date de validation:** ${date}\n`;
  report += `- **Endpoints testés:** ${totalTests}\n`;
  report += `- **Taux de réussite:** ${Math.round(passedTests/totalTests*100)}% (${passedTests}/${totalTests})\n\n`;
  
  report += `## Résultats Détaillés\n\n`;
  report += `### Endpoints Cols\n\n`;
  report += `| Endpoint | Statut | Format de Réponse | Notes |\n`;
  report += `|----------|--------|-------------------|-------|\n`;
  
  // Filtrer et ajouter les résultats des endpoints cols
  results.filter(r => r.endpoint.includes('Col') && !r.endpoint.includes('Weather'))
    .forEach(result => {
      const status = result.success ? '✅ Réussi' : '❌ Échoué';
      const format = result.responseFormat || 'N/A';
      const notes = result.success ? '' : `Erreur: ${result.error} (${result.statusCode || 'N/A'})`;
      
      report += `| ${result.endpoint} | ${status} | ${format} | ${notes} |\n`;
    });
  
  report += `\n### Endpoints Météo\n\n`;
  report += `| Endpoint | Statut | Format de Réponse | Notes |\n`;
  report += `|----------|--------|-------------------|-------|\n`;
  
  // Filtrer et ajouter les résultats des endpoints météo
  results.filter(r => r.endpoint.includes('Weather') || r.endpoint.includes('Forecast'))
    .forEach(result => {
      const status = result.success ? '✅ Réussi' : '❌ Échoué';
      const format = result.responseFormat || 'N/A';
      const notes = result.success ? '' : `Erreur: ${result.error} (${result.statusCode || 'N/A'})`;
      
      report += `| ${result.endpoint} | ${status} | ${format} | ${notes} |\n`;
    });
  
  report += `\n### Autres Endpoints Publics\n\n`;
  report += `| Endpoint | Statut | Format de Réponse | Notes |\n`;
  report += `|----------|--------|-------------------|-------|\n`;
  
  // Filtrer et ajouter les résultats des autres endpoints
  results.filter(r => !r.endpoint.includes('Col') && !r.endpoint.includes('Weather'))
    .forEach(result => {
      const status = result.success ? '✅ Réussi' : '❌ Échoué';
      const format = result.responseFormat || 'N/A';
      const notes = result.success ? '' : `Erreur: ${result.error} (${result.statusCode || 'N/A'})`;
      
      report += `| ${result.endpoint} | ${status} | ${format} | ${notes} |\n`;
    });
  
  report += `\n## Problèmes Identifiés\n\n`;
  
  if (results.some(r => !r.success)) {
    results.filter(r => !r.success).forEach(result => {
      report += `### ${result.endpoint}\n\n`;
      report += `- **Statut d'erreur:** ${result.statusCode || 'N/A'}\n`;
      report += `- **Message d'erreur:** ${result.error}\n`;
      report += `- **Cause possible:** `;
      
      // Suggérer des causes possibles basées sur le code d'erreur
      if (result.statusCode === 404) {
        report += `L'endpoint n'existe pas ou l'URL est incorrecte. Vérifier la cohérence entre la documentation et l'implémentation.\n`;
      } else if (result.statusCode === 401 || result.statusCode === 403) {
        report += `Problème d'authentification ou d'autorisation. Cet endpoint pourrait nécessiter une authentification.\n`;
      } else if (result.statusCode >= 500) {
        report += `Erreur serveur. Le backend pourrait avoir un problème interne ou une erreur de configuration.\n`;
      } else {
        report += `Cause non déterminée. Vérifier la configuration de l'API et les paramètres de requête.\n`;
      }
      
      report += `\n`;
    });
  } else {
    report += `Aucun problème identifié lors des tests des endpoints publics.\n`;
  }
  
  report += `\n## Recommandations\n\n`;
  
  // Générer des recommandations basées sur les résultats
  if (results.some(r => !r.success)) {
    report += `1. Vérifier la configuration de base de l'API (URL de base, endpoints)\n`;
    report += `2. S'assurer que les paramètres de requête correspondent aux attentes du backend\n`;
    report += `3. Confirmer que les schemas de réponse sont correctement gérés côté client\n`;
  } else {
    report += `1. Maintenir la structure actuelle qui fonctionne correctement\n`;
    report += `2. Considérer l'ajout de validation de schéma pour les réponses API\n`;
    report += `3. Implémenter une stratégie de cache côté client pour optimiser les performances\n`;
  }
  
  return report;
};

// Exécution autonome du script en environnement Node.js
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
  validatePublicEndpoints().then(() => {
    console.log('Validation des endpoints publics terminée');
    process.exit(0);
  }).catch(err => {
    console.error('Erreur lors de la validation:', err);
    process.exit(1);
  });
}

// Bouton d'exécution pour l'environnement navigateur
if (typeof window !== 'undefined' && window.document) {
  console.log('Exécutez ce script en appuyant sur le bouton ci-dessous pour les meilleurs résultats');
  
  const button = document.createElement('button');
  button.innerText = 'Valider les Endpoints Publics';
  button.style.padding = '10px';
  button.style.margin = '20px';
  button.style.backgroundColor = '#4CAF50';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '4px';
  button.style.cursor = 'pointer';
  
  button.onclick = async () => {
    const resultsContainer = document.createElement('pre');
    resultsContainer.style.padding = '20px';
    resultsContainer.style.backgroundColor = '#f5f5f5';
    resultsContainer.style.border = '1px solid #ddd';
    resultsContainer.style.borderRadius = '4px';
    resultsContainer.style.overflow = 'auto';
    resultsContainer.style.maxHeight = '80vh';
    
    document.body.appendChild(resultsContainer);
    
    resultsContainer.innerText = 'Validation des endpoints publics en cours...\n\n';
    
    try {
      const oldLog = console.log;
      console.log = (...args) => {
        oldLog(...args);
        resultsContainer.innerText += args.join(' ') + '\n';
      };
      
      await validatePublicEndpoints();
      
      console.log = oldLog;
    } catch (error) {
      resultsContainer.innerText += `\n\nErreur lors de la validation: ${error.message}`;
    }
  };
  
  document.body.appendChild(button);
}

export default validatePublicEndpoints;
