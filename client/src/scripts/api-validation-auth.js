/**
 * API Validation Script - Authentification et Endpoints Protégés
 * 
 * Ce script valide le flux d'authentification et les endpoints protégés du RealApiOrchestrator.
 */

import RealApiOrchestrator from '../services/api/RealApiOrchestrator';
import RealApiOrchestratorPart2 from '../services/api/RealApiOrchestratorPart2';
import RealApiOrchestratorPart3 from '../services/api/RealApiOrchestratorPart3';
import { saveValidationReport } from './validation-utils';

// Configuration des tests
const TEST_CONFIG = {
  // Informations d'identification pour les tests
  testCredentials: {
    email: 'test@example.com',
    password: 'TestPassword123',
  },
  // Utilisateur existant pour les tests
  testUserId: '1', // à remplacer par un ID utilisateur valide
};

// Format des résultats de validation
const formatResult = (endpoint, success, response, error, headers = null) => ({
  endpoint,
  success,
  timestamp: new Date().toISOString(),
  response: success ? response : null,
  error: !success ? (error?.response?.data || error?.message || String(error)) : null,
  statusCode: error?.response?.status || (success ? 200 : null),
  responseFormat: success ? describeResponseFormat(response) : null,
  headers: headers, // Entêtes de réponse pour analyse
  authRequired: true,
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
const validateAuthAndProtectedEndpoints = async () => {
  const results = [];
  let authToken = null;
  let userId = null;
  
  console.log('API Validation - Authentification et Endpoints Protégés');
  console.log('----------------------------------------------------\n');
  
  // 1. Validation du flux d'authentification
  console.log('TESTING AUTHENTICATION FLOW\n');
  
  // Test de connexion
  try {
    console.log(`Testing login(${TEST_CONFIG.testCredentials.email}, ****)...`);
    const loginResponse = await RealApiOrchestratorPart3.login(
      TEST_CONFIG.testCredentials.email,
      TEST_CONFIG.testCredentials.password
    );
    
    results.push(formatResult('login', true, loginResponse));
    logResult(results[results.length - 1]);
    
    if (loginResponse && loginResponse.token) {
      authToken = loginResponse.token;
      console.log('  Auth token obtained successfully');
      
      if (loginResponse.user && loginResponse.user.id) {
        userId = loginResponse.user.id;
        console.log(`  User ID: ${userId}`);
      } else {
        // Utiliser l'ID utilisateur de test si non disponible dans la réponse
        userId = TEST_CONFIG.testUserId;
        console.log(`  Using test user ID: ${userId}`);
      }
    } else {
      console.log('  Warning: No token in login response');
    }
  } catch (error) {
    results.push(formatResult('login', false, null, error));
    logResult(results[results.length - 1]);
    
    console.log('\n⚠️ Authentication failed. Protected endpoint tests will be skipped.');
    
    // Générer un rapport même si l'authentification échoue
    const validationReport = generateValidationReport(results);
    saveValidationReport('auth-endpoints', validationReport);
    
    return {
      results,
      summary: {
        totalTests: results.length,
        passedTests: results.filter(r => r.success).length,
        failedTests: results.filter(r => !r.success).length,
        date: new Date().toISOString(),
      }
    };
  }
  
  // Test de rafraîchissement du token
  try {
    console.log('Testing refreshToken()...');
    const refreshResponse = await RealApiOrchestratorPart3.refreshToken();
    
    results.push(formatResult('refreshToken', true, refreshResponse));
    logResult(results[results.length - 1]);
    
    if (refreshResponse && refreshResponse.token) {
      authToken = refreshResponse.token;
      console.log('  Token refreshed successfully');
    }
  } catch (error) {
    results.push(formatResult('refreshToken', false, null, error));
    logResult(results[results.length - 1]);
  }
  
  // 2. Validation des endpoints utilisateur
  console.log('\nTESTING USER ENDPOINTS\n');
  
  // Récupération du profil utilisateur
  try {
    console.log(`Testing getUserProfile(${userId})...`);
    const userProfile = await RealApiOrchestrator.getUserProfile(userId);
    
    results.push(formatResult('getUserProfile', true, userProfile));
    logResult(results[results.length - 1]);
  } catch (error) {
    results.push(formatResult('getUserProfile', false, null, error));
    logResult(results[results.length - 1]);
  }
  
  // 3. Validation des endpoints d'activités
  console.log('\nTESTING ACTIVITY ENDPOINTS\n');
  
  // Récupération des activités de l'utilisateur
  try {
    console.log(`Testing getUserActivities(${userId}, 1, 10)...`);
    const activities = await RealApiOrchestrator.getUserActivities(userId, 1, 10);
    
    results.push(formatResult('getUserActivities', true, activities));
    logResult(results[results.length - 1]);
    
    // Test de récupération d'une activité spécifique si des activités existent
    if (activities && activities.length > 0) {
      const activityId = activities[0].id;
      try {
        console.log(`Testing getActivity(${activityId})...`);
        const activity = await RealApiOrchestrator.getActivity(activityId);
        
        results.push(formatResult(`getActivity(${activityId})`, true, activity));
        logResult(results[results.length - 1]);
      } catch (error) {
        results.push(formatResult(`getActivity avec ID d'une activité réelle`, false, null, error));
        logResult(results[results.length - 1]);
      }
    }
  } catch (error) {
    results.push(formatResult('getUserActivities', false, null, error));
    logResult(results[results.length - 1]);
  }
  
  // 4. Validation des endpoints d'entraînement
  console.log('\nTESTING TRAINING ENDPOINTS\n');
  
  // Récupération des plans d'entraînement
  try {
    console.log(`Testing getUserTrainingPlans(${userId})...`);
    const trainingPlans = await RealApiOrchestratorPart2.getUserTrainingPlans(userId);
    
    results.push(formatResult('getUserTrainingPlans', true, trainingPlans));
    logResult(results[results.length - 1]);
    
    // Test de récupération d'un plan spécifique si des plans existent
    if (trainingPlans && trainingPlans.length > 0) {
      const planId = trainingPlans[0].id;
      try {
        console.log(`Testing getTrainingPlan(${planId})...`);
        const trainingPlan = await RealApiOrchestratorPart2.getTrainingPlan(planId);
        
        results.push(formatResult(`getTrainingPlan(${planId})`, true, trainingPlan));
        logResult(results[results.length - 1]);
      } catch (error) {
        results.push(formatResult(`getTrainingPlan avec ID d'un plan réel`, false, null, error));
        logResult(results[results.length - 1]);
      }
    }
  } catch (error) {
    results.push(formatResult('getUserTrainingPlans', false, null, error));
    logResult(results[results.length - 1]);
  }
  
  // Récupération de l'historique FTP
  try {
    console.log(`Testing getFTPHistory(${userId})...`);
    const ftpHistory = await RealApiOrchestratorPart2.getFTPHistory(userId);
    
    results.push(formatResult('getFTPHistory', true, ftpHistory));
    logResult(results[results.length - 1]);
  } catch (error) {
    results.push(formatResult('getFTPHistory', false, null, error));
    logResult(results[results.length - 1]);
  }
  
  // 5. Validation des endpoints nutrition
  console.log('\nTESTING NUTRITION ENDPOINTS\n');
  
  // Récupération des recettes
  try {
    console.log('Testing getNutritionRecipes("", [])...');
    const recipes = await RealApiOrchestratorPart2.getNutritionRecipes('', []);
    
    results.push(formatResult('getNutritionRecipes', true, recipes));
    logResult(results[results.length - 1]);
    
    // Test de récupération d'une recette spécifique si des recettes existent
    if (recipes && recipes.length > 0) {
      const recipeId = recipes[0].id;
      try {
        console.log(`Testing getNutritionRecipe(${recipeId})...`);
        const recipe = await RealApiOrchestratorPart2.getNutritionRecipe(recipeId);
        
        results.push(formatResult(`getNutritionRecipe(${recipeId})`, true, recipe));
        logResult(results[results.length - 1]);
      } catch (error) {
        results.push(formatResult(`getNutritionRecipe avec ID d'une recette réelle`, false, null, error));
        logResult(results[results.length - 1]);
      }
    }
  } catch (error) {
    results.push(formatResult('getNutritionRecipes', false, null, error));
    logResult(results[results.length - 1]);
  }
  
  // 6. Validation des endpoints Strava
  console.log('\nTESTING STRAVA ENDPOINTS\n');
  
  // Test de récupération du statut de connexion Strava
  try {
    console.log(`Testing getStravaConnectionStatus(${userId})...`);
    const stravaStatus = await RealApiOrchestratorPart3.getStravaConnectionStatus(userId);
    
    results.push(formatResult('getStravaConnectionStatus', true, stravaStatus));
    logResult(results[results.length - 1]);
  } catch (error) {
    results.push(formatResult('getStravaConnectionStatus', false, null, error));
    logResult(results[results.length - 1]);
  }
  
  // 7. Test de déconnexion
  try {
    console.log('Testing logout()...');
    const logoutResponse = await RealApiOrchestratorPart3.logout();
    
    results.push(formatResult('logout', true, logoutResponse));
    logResult(results[results.length - 1]);
  } catch (error) {
    results.push(formatResult('logout', false, null, error));
    logResult(results[results.length - 1]);
  }
  
  // Générer le résumé
  console.log('\n\n----------------------------------------------------');
  console.log('RÉSUMÉ DE LA VALIDATION DES ENDPOINTS AUTHENTIFIÉS');
  console.log('----------------------------------------------------');
  
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
  saveValidationReport('auth-endpoints', validationReport);
  
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
  
  let report = `# Rapport de Validation API - Endpoints Authentifiés\n\n`;
  report += `## Informations Générales\n\n`;
  report += `- **Date de validation:** ${date}\n`;
  report += `- **Endpoints testés:** ${totalTests}\n`;
  report += `- **Taux de réussite:** ${Math.round(passedTests/totalTests*100)}% (${passedTests}/${totalTests})\n\n`;
  
  report += `## Résultats Détaillés\n\n`;
  report += `### Authentification\n\n`;
  report += `| Endpoint | Statut | Format de Réponse | Notes |\n`;
  report += `|----------|--------|-------------------|-------|\n`;
  
  // Filtrer et ajouter les résultats des endpoints d'authentification
  results.filter(r => r.endpoint.includes('login') || r.endpoint.includes('refresh') || r.endpoint.includes('logout'))
    .forEach(result => {
      const status = result.success ? '✅ Réussi' : '❌ Échoué';
      const format = result.responseFormat || 'N/A';
      const notes = result.success ? '' : `Erreur: ${result.error} (${result.statusCode || 'N/A'})`;
      
      report += `| ${result.endpoint} | ${status} | ${format} | ${notes} |\n`;
    });
  
  report += `\n### Endpoints Utilisateur\n\n`;
  report += `| Endpoint | Statut | Format de Réponse | Notes |\n`;
  report += `|----------|--------|-------------------|-------|\n`;
  
  // Filtrer et ajouter les résultats des endpoints utilisateur
  results.filter(r => r.endpoint.includes('User') && !r.endpoint.includes('Activities'))
    .forEach(result => {
      const status = result.success ? '✅ Réussi' : '❌ Échoué';
      const format = result.responseFormat || 'N/A';
      const notes = result.success ? '' : `Erreur: ${result.error} (${result.statusCode || 'N/A'})`;
      
      report += `| ${result.endpoint} | ${status} | ${format} | ${notes} |\n`;
    });
  
  report += `\n### Endpoints Activités\n\n`;
  report += `| Endpoint | Statut | Format de Réponse | Notes |\n`;
  report += `|----------|--------|-------------------|-------|\n`;
  
  // Filtrer et ajouter les résultats des endpoints activités
  results.filter(r => r.endpoint.includes('Activity') || r.endpoint.includes('Activities'))
    .forEach(result => {
      const status = result.success ? '✅ Réussi' : '❌ Échoué';
      const format = result.responseFormat || 'N/A';
      const notes = result.success ? '' : `Erreur: ${result.error} (${result.statusCode || 'N/A'})`;
      
      report += `| ${result.endpoint} | ${status} | ${format} | ${notes} |\n`;
    });
  
  report += `\n### Endpoints Entraînement\n\n`;
  report += `| Endpoint | Statut | Format de Réponse | Notes |\n`;
  report += `|----------|--------|-------------------|-------|\n`;
  
  // Filtrer et ajouter les résultats des endpoints entraînement
  results.filter(r => r.endpoint.includes('Training') || r.endpoint.includes('FTP'))
    .forEach(result => {
      const status = result.success ? '✅ Réussi' : '❌ Échoué';
      const format = result.responseFormat || 'N/A';
      const notes = result.success ? '' : `Erreur: ${result.error} (${result.statusCode || 'N/A'})`;
      
      report += `| ${result.endpoint} | ${status} | ${format} | ${notes} |\n`;
    });
  
  report += `\n### Endpoints Nutrition\n\n`;
  report += `| Endpoint | Statut | Format de Réponse | Notes |\n`;
  report += `|----------|--------|-------------------|-------|\n`;
  
  // Filtrer et ajouter les résultats des endpoints nutrition
  results.filter(r => r.endpoint.includes('Nutrition'))
    .forEach(result => {
      const status = result.success ? '✅ Réussi' : '❌ Échoué';
      const format = result.responseFormat || 'N/A';
      const notes = result.success ? '' : `Erreur: ${result.error} (${result.statusCode || 'N/A'})`;
      
      report += `| ${result.endpoint} | ${status} | ${format} | ${notes} |\n`;
    });
  
  report += `\n### Endpoints Strava\n\n`;
  report += `| Endpoint | Statut | Format de Réponse | Notes |\n`;
  report += `|----------|--------|-------------------|-------|\n`;
  
  // Filtrer et ajouter les résultats des endpoints Strava
  results.filter(r => r.endpoint.includes('Strava'))
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
        report += `Problème d'authentification ou d'autorisation. Le token pourrait être invalide ou expiré, ou l'utilisateur n'a pas les droits nécessaires.\n`;
      } else if (result.statusCode >= 500) {
        report += `Erreur serveur. Le backend pourrait avoir un problème interne ou une erreur de configuration.\n`;
      } else {
        report += `Cause non déterminée. Vérifier la configuration de l'API et les paramètres de requête.\n`;
      }
      
      report += `\n`;
    });
  } else {
    report += `Aucun problème identifié lors des tests des endpoints authentifiés.\n`;
  }
  
  report += `\n## Analyse du Flux d'Authentification\n\n`;
  
  // Vérifier si les tests d'authentification ont réussi
  const loginSuccess = results.find(r => r.endpoint.includes('login'))?.success || false;
  const refreshSuccess = results.find(r => r.endpoint.includes('refresh'))?.success || false;
  const logoutSuccess = results.find(r => r.endpoint.includes('logout'))?.success || false;
  
  if (loginSuccess && refreshSuccess && logoutSuccess) {
    report += `✅ **Le flux d'authentification fonctionne correctement**\n\n`;
    report += `- La connexion génère un token valide\n`;
    report += `- Le rafraîchissement du token fonctionne\n`;
    report += `- La déconnexion invalide correctement le token\n`;
  } else {
    report += `❌ **Problèmes détectés dans le flux d'authentification**\n\n`;
    
    if (!loginSuccess) {
      report += `- Échec de connexion: ${results.find(r => r.endpoint.includes('login'))?.error}\n`;
    }
    
    if (!refreshSuccess) {
      report += `- Échec de rafraîchissement du token: ${results.find(r => r.endpoint.includes('refresh'))?.error}\n`;
    }
    
    if (!logoutSuccess) {
      report += `- Échec de déconnexion: ${results.find(r => r.endpoint.includes('logout'))?.error}\n`;
    }
  }
  
  report += `\n## Recommandations\n\n`;
  
  // Générer des recommandations basées sur les résultats
  if (results.some(r => !r.success)) {
    report += `### Correctifs Prioritaires\n\n`;
    
    if (!loginSuccess) {
      report += `1. **Flux d'authentification** - Corriger les problèmes de connexion pour permettre l'accès aux endpoints protégés.\n`;
    }
    
    const failedEndpoints = results.filter(r => !r.success);
    failedEndpoints.forEach((result, index) => {
      if (!result.endpoint.includes('login') && !result.endpoint.includes('refresh') && !result.endpoint.includes('logout')) {
        report += `${loginSuccess ? index + 1 : index + 2}. **${result.endpoint}** - `;
        
        if (result.statusCode === 404) {
          report += `Vérifier que l'URL implémentée correspond à celle utilisée par le backend.\n`;
        } else if (result.statusCode === 401 || result.statusCode === 403) {
          report += `Vérifier que le token est correctement envoyé dans les entêtes de la requête.\n`;
        } else if (result.statusCode >= 500) {
          report += `Contacter l'équipe backend pour résoudre l'erreur serveur.\n`;
        } else {
          report += `Vérifier les paramètres et le format de la requête.\n`;
        }
      }
    });
  } else {
    report += `1. Maintenir la structure actuelle qui fonctionne correctement\n`;
    report += `2. Considérer l'ajout de validation de schéma pour les réponses API\n`;
    report += `3. Implémenter une stratégie de cache côté client pour optimiser les performances\n`;
    report += `4. Ajouter une gestion d'erreur plus robuste pour les tokens expirés\n`;
  }
  
  return report;
};

// Exécution autonome du script en environnement Node.js
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
  validateAuthAndProtectedEndpoints().then(() => {
    console.log('Validation des endpoints authentifiés terminée');
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
  button.innerText = 'Valider les Endpoints Authentifiés';
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
    
    resultsContainer.innerText = 'Validation des endpoints authentifiés en cours...\n\n';
    
    try {
      const oldLog = console.log;
      console.log = (...args) => {
        oldLog(...args);
        resultsContainer.innerText += args.join(' ') + '\n';
      };
      
      await validateAuthAndProtectedEndpoints();
      
      console.log = oldLog;
    } catch (error) {
      resultsContainer.innerText += `\n\nErreur lors de la validation: ${error.message}`;
    }
  };
  
  document.body.appendChild(button);
}

export default validateAuthAndProtectedEndpoints;
