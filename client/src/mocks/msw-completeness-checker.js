/**
 * MSW Completeness Checker pour Velo-Altitude
 * 
 * Ce script analyse la couverture MSW par rapport aux méthodes de RealApiOrchestrator
 * pour identifier les endpoints manquants dans les handlers.
 */

import RealApiOrchestrator from '../services/api/RealApiOrchestrator';
import { handlers } from './handlers';
import { matchPath } from 'react-router-dom';

/**
 * Extrait les méthodes publiques de RealApiOrchestrator
 * @returns {Array<string>} Liste des noms de méthodes
 */
function extractApiOrchestratorMethods() {
  // Obtenez toutes les clés de l'objet prototype
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(RealApiOrchestrator));
  
  // Filtrer les méthodes réelles (exclure constructeur, méthodes privées, etc.)
  return methods.filter(method => 
    method !== 'constructor' && 
    !method.startsWith('_') && 
    typeof RealApiOrchestrator[method] === 'function'
  );
}

/**
 * Extrait les routes des handlers MSW
 * @returns {Array<{method: string, path: string}>} Liste des routes
 */
function extractMswHandlerRoutes() {
  return handlers.map(handler => {
    // Extraire la méthode HTTP et le chemin
    const method = handler.method.toLowerCase();
    const path = handler.path.toString();
    
    return { method, path };
  });
}

/**
 * Mappe les méthodes de l'orchestrateur aux routes attendues
 * @returns {Object} Mapping méthode -> route attendue
 */
function mapMethodsToExpectedRoutes() {
  const methodMapping = {
    // Cols
    'getAllCols': { method: 'get', path: '/cols' },
    'getColById': { method: 'get', path: '/cols/:id' },
    'getColsByRegion': { method: 'get', path: '/cols', queryParams: ['region'] },
    'getColsByDifficulty': { method: 'get', path: '/cols', queryParams: ['difficulty'] },
    'searchCols': { method: 'get', path: '/cols/search', queryParams: ['q'] },
    
    // Users
    'getUserProfile': { method: 'get', path: '/users/:userId/profile' },
    'updateUserProfile': { method: 'patch', path: '/users/:userId/profile' },
    'getUserActivities': { method: 'get', path: '/users/:userId/activities' },
    
    // Activities
    'createActivity': { method: 'post', path: '/activities' },
    'getActivity': { method: 'get', path: '/activities/:id' },
    'updateActivity': { method: 'patch', path: '/activities/:id' },
    'deleteActivity': { method: 'delete', path: '/activities/:id' },
    
    // 7 Majeurs
    'getAllMajeurs7Challenges': { method: 'get', path: '/majeurs7/challenges' },
    'getMajeurs7Challenge': { method: 'get', path: '/majeurs7/challenges/:id' },
    'startMajeurs7Challenge': { method: 'post', path: '/majeurs7/users/:userId/challenges/:challengeId/start' },
    'getMajeurs7Progress': { method: 'get', path: '/majeurs7/users/:userId/challenges/:challengeId/progress' },
    'updateMajeurs7Progress': { method: 'patch', path: '/majeurs7/users/:userId/challenges/:challengeId/progress' },
    
    // Weather
    'getColWeather': { method: 'get', path: '/weather/col/:colId' },
    'getLocationWeather': { method: 'get', path: '/weather/location', queryParams: ['lat', 'lng'] },
    'getWeatherForecast': { method: 'get', path: '/weather/col/:colId/forecast', queryParams: ['days'] },
    
    // Training
    'getUserTrainingPlans': { method: 'get', path: '/users/:userId/training/plans' },
    'getTrainingPlan': { method: 'get', path: '/training/plans/:planId' },
    'createTrainingPlan': { method: 'post', path: '/training/plans' },
    'updateTrainingPlan': { method: 'patch', path: '/training/plans/:planId' },
    'updateFTP': { method: 'post', path: '/users/:userId/ftp' },
    'getFTPHistory': { method: 'get', path: '/users/:userId/ftp/history' },
    
    // Nutrition
    'getUserNutritionPlan': { method: 'get', path: '/users/:userId/nutrition/plan' },
    'updateNutritionPlan': { method: 'patch', path: '/nutrition/plans/:planId' },
    'getNutritionLog': { method: 'get', path: '/users/:userId/nutrition/logs/:date' },
    'createNutritionLogEntry': { method: 'post', path: '/users/:userId/nutrition/logs/entries' },
    'getNutritionRecipes': { method: 'get', path: '/nutrition/recipes', queryParams: ['q', 'tags'] },
    'getNutritionRecipe': { method: 'get', path: '/nutrition/recipes/:recipeId' },
    
    // Forum
    'getForumCategories': { method: 'get', path: '/forum/categories' },
    'getForumTopics': { method: 'get', path: '/forum/categories/:categoryId/topics' },
    'getForumPosts': { method: 'get', path: '/forum/topics/:topicId/posts' },
    'createForumTopic': { method: 'post', path: '/forum/categories/:categoryId/topics' },
    'createForumPost': { method: 'post', path: '/forum/topics/:topicId/posts' },
    
    // Auth
    'login': { method: 'post', path: '/auth/login' },
    'register': { method: 'post', path: '/auth/register' },
    'refreshToken': { method: 'post', path: '/auth/refresh' },
    'logout': { method: 'post', path: '/auth/logout' },
    
    // Strava
    'connectStrava': { method: 'post', path: '/users/:userId/strava/connect' },
    'disconnectStrava': { method: 'post', path: '/users/:userId/strava/disconnect' },
    'syncStravaActivities': { method: 'post', path: '/users/:userId/strava/sync' },
    
    // Search
    'searchGlobal': { method: 'get', path: '/search', queryParams: ['q'] },
  };
  
  return methodMapping;
}

/**
 * Vérifie si un handler MSW correspond à la route attendue
 * @param {Object} handler Route du handler
 * @param {Object} expectedRoute Route attendue
 * @returns {boolean} True si correspondance
 */
function matchHandler(handler, expectedRoute) {
  // Vérifier la méthode HTTP
  if (handler.method !== expectedRoute.method) {
    return false;
  }
  
  // Normaliser les chemins pour comparaison
  const handlerPath = handler.path.replace(/\/api/, '');
  
  // Utiliser matchPath de react-router pour gérer les paramètres de route
  const match = matchPath(expectedRoute.path, handlerPath);
  
  return !!match;
}

/**
 * Recherche les handlers manquants
 * @returns {Object} Résultats de l'analyse
 */
function findMissingHandlers() {
  const apiMethods = extractApiOrchestratorMethods();
  const mswRoutes = extractMswHandlerRoutes();
  const methodRouteMapping = mapMethodsToExpectedRoutes();
  
  const results = {
    covered: [],
    missing: [],
    unknown: []
  };
  
  // Vérifier chaque méthode
  apiMethods.forEach(method => {
    const expectedRoute = methodRouteMapping[method];
    
    if (!expectedRoute) {
      results.unknown.push(method);
      return;
    }
    
    // Rechercher un handler correspondant
    const matchingHandler = mswRoutes.find(handler => 
      matchHandler(handler, expectedRoute)
    );
    
    if (matchingHandler) {
      results.covered.push({
        method,
        route: expectedRoute,
        handler: matchingHandler
      });
    } else {
      results.missing.push({
        method,
        route: expectedRoute
      });
    }
  });
  
  return results;
}

/**
 * Génère un modèle de handler MSW pour une méthode
 * @param {string} method Nom de la méthode
 * @param {Object} route Route attendue
 * @returns {string} Code du handler
 */
function generateHandlerTemplate(method, route) {
  const { method: httpMethod, path } = route;
  const apiPath = `/api${path}`;
  
  let code = '';
  
  // Générer le code selon la méthode HTTP
  switch (httpMethod) {
    case 'get':
      code = `
// Handler pour ${method}
http.get(\`\${baseUrl}${path}\`, (req, res, ctx) => {
  // TODO: Implémenter le handler pour ${method}
  // Ajouter un délai réaliste
  return res(
    ctx.delay(300), // Délai réaliste entre 200-600ms
    ctx.status(200),
    ctx.json(/* TODO: Données mockées appropriées */)
  );
}),`;
      break;
      
    case 'post':
      code = `
// Handler pour ${method}
http.post(\`\${baseUrl}${path}\`, (req, res, ctx) => {
  const requestData = req.body;
  
  // TODO: Implémenter le handler pour ${method}
  // Validation des données si nécessaire
  
  return res(
    ctx.delay(400), // Délai réaliste entre 200-600ms
    ctx.status(201),
    ctx.json(/* TODO: Données mockées appropriées */)
  );
}),`;
      break;
      
    case 'patch':
    case 'put':
      code = `
// Handler pour ${method}
http.${httpMethod}(\`\${baseUrl}${path}\`, (req, res, ctx) => {
  const { ${getPathParamsFromRoute(path)} } = req.params;
  const updateData = req.body;
  
  // TODO: Implémenter le handler pour ${method}
  // Validation des données si nécessaire
  
  return res(
    ctx.delay(350), // Délai réaliste entre 200-600ms
    ctx.status(200),
    ctx.json(/* TODO: Données mockées appropriées */)
  );
}),`;
      break;
      
    case 'delete':
      code = `
// Handler pour ${method}
http.delete(\`\${baseUrl}${path}\`, (req, res, ctx) => {
  const { ${getPathParamsFromRoute(path)} } = req.params;
  
  // TODO: Implémenter le handler pour ${method}
  
  return res(
    ctx.delay(250), // Délai réaliste entre 200-600ms
    ctx.status(204)
  );
}),`;
      break;
  }
  
  return code;
}

/**
 * Extrait les paramètres de chemin d'une route
 * @param {string} path Chemin de la route
 * @returns {string} Paramètres extraits
 */
function getPathParamsFromRoute(path) {
  const params = [];
  const segments = path.split('/');
  
  segments.forEach(segment => {
    if (segment.startsWith(':')) {
      params.push(segment.substring(1));
    }
  });
  
  return params.join(', ');
}

/**
 * Affiche un rapport de couverture MSW
 */
function printMswCoverageReport() {
  const results = findMissingHandlers();
  
  console.group('📊 Rapport de couverture MSW pour Velo-Altitude');
  
  console.log(`✅ Méthodes couvertes: ${results.covered.length}`);
  console.log(`❌ Méthodes manquantes: ${results.missing.length}`);
  console.log(`❓ Méthodes non identifiées: ${results.unknown.length}`);
  
  if (results.missing.length > 0) {
    console.group('Méthodes sans handlers:');
    results.missing.forEach(item => {
      console.log(`- ${item.method}: ${item.route.method.toUpperCase()} ${item.route.path}`);
    });
    console.groupEnd();
    
    console.group('Modèles de handlers à ajouter:');
    results.missing.forEach(item => {
      console.log(generateHandlerTemplate(item.method, item.route));
    });
    console.groupEnd();
  }
  
  if (results.unknown.length > 0) {
    console.group('Méthodes sans mapping:');
    results.unknown.forEach(method => {
      console.log(`- ${method}`);
    });
    console.groupEnd();
  }
  
  console.groupEnd();
  
  return results;
}

// Exporter les fonctions utiles
export {
  findMissingHandlers,
  printMswCoverageReport,
  generateHandlerTemplate
};

// Pour une utilisation simple dans la console du navigateur
window.mswChecker = {
  printReport: printMswCoverageReport,
  findMissingHandlers,
  generateHandlerTemplate
};

// Message d'aide
console.log('%c📊 MSW Completeness Checker chargé', 'font-weight: bold; color: #9c27b0;');
console.log('Utilisez mswChecker.printReport() pour générer un rapport de couverture MSW');
