/**
 * Testeur d'API Velo-Altitude pour navigateur
 * 
 * Cet utilitaire permet de tester l'API directement depuis la console du navigateur.
 * Pour l'utiliser:
 * 1. Copiez ce code dans la console du navigateur lorsque l'application est en cours d'exécution
 * 2. Appelez les fonctions comme veloApiTest.testPublicEndpoints() ou veloApiTest.testProtectedEndpoints()
 */

// Fonction pour obtenir une référence à l'orchestrateur API
function getApiOrchestrator() {
  // Cette fonction suppose que window.__VELO_APP_CONTEXT contient des références aux objets du contexte React
  // Si ce n'est pas le cas, il faudra adapter cette logique à la structure de votre application
  try {
    // Essayer d'abord d'obtenir depuis le contexte d'application (si disponible)
    if (window.__VELO_APP_CONTEXT && window.__VELO_APP_CONTEXT.apiOrchestrator) {
      return window.__VELO_APP_CONTEXT.apiOrchestrator;
    }
    
    // Sinon, importer directement l'instance
    // Note: Cela peut ne pas fonctionner selon la configuration de bundling
    return window.RealApiOrchestrator || null;
  } catch (error) {
    console.error('Impossible d\'accéder à l\'orchestrateur API:', error);
    return null;
  }
}

// Configuration pour l'inspection des requêtes
const requestInspector = {
  enabled: true,
  
  // Enregistre les headers des requêtes réelles pour inspection
  monitorHeaders() {
    if (!this.enabled || this._initialized) return;
    
    console.log('🔍 Activation du monitoring des en-têtes HTTP...');
    
    // Sauvegarder la méthode originale
    this._originalFetch = window.fetch;
    this._initialized = true;
    this.requests = [];
    
    // Remplacer fetch par notre version instrumentée
    window.fetch = async (...args) => {
      const [url, options = {}] = args;
      
      try {
        // Capturer le début de la requête
        const requestStartTime = performance.now();
        
        // Exécuter la requête originale
        const response = await this._originalFetch(...args);
        
        // Calculer le temps de réponse
        const responseTime = performance.now() - requestStartTime;
        
        // Cloner la réponse pour ne pas la consommer
        const clonedResponse = response.clone();
        let responseBody;
        
        try {
          // Tenter de lire le corps de la réponse comme JSON
          responseBody = await clonedResponse.json();
        } catch (e) {
          // Si ce n'est pas du JSON, laisser vide
          responseBody = null;
        }
        
        // Enregistrer les informations de la requête
        const requestInfo = {
          url,
          method: options.method || 'GET',
          headers: options.headers || {},
          timestamp: new Date(),
          responseTime,
          status: response.status,
          statusText: response.statusText,
          hasAuthHeader: options.headers && 
                        (options.headers.Authorization || 
                         (options.headers.get && options.headers.get('Authorization'))),
          responseType: clonedResponse.headers.get('content-type'),
          responseSize: responseBody ? JSON.stringify(responseBody).length : 0,
          responseBody: responseBody
        };
        
        // Ajouter à notre liste
        this.requests.unshift(requestInfo);
        
        // Garder seulement les 50 dernières requêtes
        if (this.requests.length > 50) {
          this.requests.pop();
        }
        
        // Retourner la réponse originale
        return response;
      } catch (error) {
        console.error('Erreur pendant l\'inspection:', error);
        // En cas d'erreur, appeler fetch original directement
        return this._originalFetch(...args);
      }
    };
    
    console.log('✅ Monitoring des en-têtes HTTP activé');
  },
  
  // Arrête le monitoring
  stopMonitoring() {
    if (!this._initialized) return;
    
    window.fetch = this._originalFetch;
    this._initialized = false;
    console.log('❌ Monitoring des en-têtes HTTP désactivé');
  },
  
  // Affiche un résumé des requêtes capturées
  reportRequests() {
    if (!this._initialized || this.requests.length === 0) {
      console.log('Aucune requête capturée');
      return [];
    }
    
    console.group('📊 Résumé des requêtes capturées');
    console.log(`Total: ${this.requests.length} requêtes`);
    
    // Compter les requêtes par endpoint
    const endpointCounts = {};
    this.requests.forEach(req => {
      const endpoint = req.url.split('?')[0]; // Ignorer les paramètres
      endpointCounts[endpoint] = (endpointCounts[endpoint] || 0) + 1;
    });
    
    console.log('Requêtes par endpoint:');
    Object.entries(endpointCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([endpoint, count]) => {
        console.log(`- ${endpoint}: ${count}`);
      });
    
    // Vérifier les en-têtes d'authentification
    const withAuth = this.requests.filter(req => req.hasAuthHeader).length;
    console.log(`Avec en-tête d'auth: ${withAuth}/${this.requests.length} (${Math.round(withAuth/this.requests.length*100)}%)`);
    
    console.groupEnd();
    
    return this.requests;
  },
  
  // Générer un rapport au format markdown
  generateMarkdown() {
    if (!this._initialized || this.requests.length === 0) {
      return "Aucune requête capturée";
    }
    
    // Regrouper par endpoint
    const endpointGroups = {};
    this.requests.forEach(req => {
      const endpoint = req.url.split('?')[0]; // Ignorer les paramètres
      if (!endpointGroups[endpoint]) {
        endpointGroups[endpoint] = [];
      }
      endpointGroups[endpoint].push(req);
    });
    
    let markdown = `# Rapport d'inspection des requêtes API\n\n`;
    markdown += `## Résumé\n`;
    markdown += `- **Total des requêtes:** ${this.requests.length}\n`;
    markdown += `- **Requêtes avec authentification:** ${this.requests.filter(req => req.hasAuthHeader).length}\n`;
    markdown += `- **Temps de réponse moyen:** ${Math.round(this.requests.reduce((sum, req) => sum + req.responseTime, 0) / this.requests.length)}ms\n\n`;
    
    markdown += `## Détail par endpoint\n\n`;
    
    Object.entries(endpointGroups).forEach(([endpoint, requests]) => {
      markdown += `### ${endpoint}\n`;
      markdown += `- **Nombre d'appels:** ${requests.length}\n`;
      markdown += `- **Méthodes:** ${[...new Set(requests.map(r => r.method))].join(', ')}\n`;
      markdown += `- **Statuts:** ${[...new Set(requests.map(r => r.status))].join(', ')}\n`;
      markdown += `- **Authentification:** ${requests.some(r => r.hasAuthHeader) ? '✅' : '❌'}\n`;
      markdown += `- **Temps de réponse moyen:** ${Math.round(requests.reduce((sum, r) => sum + r.responseTime, 0) / requests.length)}ms\n\n`;
    });
    
    return markdown;
  }
};

// Utilitaire de test d'API
const veloApiTest = {
  results: {
    public: {},
    protected: {}
  },
  
  // Test des endpoints publics
  async testPublicEndpoints() {
    console.group('%c🧪 Test des endpoints publics', 'font-weight: bold; font-size: 16px; color: #4caf50;');
    
    const apiOrchestrator = getApiOrchestrator();
    if (!apiOrchestrator) {
      console.error('❌ Impossible d\'accéder à l\'orchestrateur API. Utilisez à la place:');
      console.log('import RealApiOrchestrator from "./services/api/RealApiOrchestrator";');
      console.log('RealApiOrchestrator.getAllCols().then(console.log).catch(console.error);');
      console.groupEnd();
      return;
    }
    
    try {
      // Test getAllCols
      console.group('getAllCols()');
      try {
        console.time('getAllCols');
        const cols = await apiOrchestrator.getAllCols();
        console.timeEnd('getAllCols');
        console.log('✅ Réponse:', cols);
        console.log(`📊 ${cols.length} cols récupérés`);
        this.results.public.getAllCols = { success: true, data: cols };
        
        // Si nous avons des cols, utiliser le premier pour d'autres tests
        if (cols.length > 0) {
          const firstCol = cols[0];
          console.log('📍 Premier col pour tests supplémentaires:', firstCol.id);
          
          // Test getColById avec le premier col
          console.group('getColById()');
          try {
            console.time('getColById');
            const col = await apiOrchestrator.getColById(firstCol.id);
            console.timeEnd('getColById');
            console.log('✅ Réponse:', col);
            this.results.public.getColById = { success: true, data: col };
          } catch (error) {
            console.error('❌ Erreur:', error);
            this.results.public.getColById = { success: false, error };
          }
          console.groupEnd();
          
          // Test getColWeather avec le premier col
          console.group('getColWeather()');
          try {
            console.time('getColWeather');
            const weather = await apiOrchestrator.getColWeather(firstCol.id);
            console.timeEnd('getColWeather');
            console.log('✅ Réponse:', weather);
            this.results.public.getColWeather = { success: true, data: weather };
          } catch (error) {
            console.error('❌ Erreur:', error);
            this.results.public.getColWeather = { success: false, error };
          }
          console.groupEnd();
          
          // Test getWeatherForecast avec le premier col
          console.group('getWeatherForecast()');
          try {
            console.time('getWeatherForecast');
            const forecast = await apiOrchestrator.getWeatherForecast(firstCol.id, 5);
            console.timeEnd('getWeatherForecast');
            console.log('✅ Réponse:', forecast);
            this.results.public.getWeatherForecast = { success: true, data: forecast };
          } catch (error) {
            console.error('❌ Erreur:', error);
            this.results.public.getWeatherForecast = { success: false, error };
          }
          console.groupEnd();
        }
      } catch (error) {
        console.error('❌ Erreur:', error);
        this.results.public.getAllCols = { success: false, error };
      }
      console.groupEnd();
      
      // Test searchCols
      console.group('searchCols()');
      try {
        const query = 'alpe'; // Recherche commune
        console.time('searchCols');
        const searchResults = await apiOrchestrator.searchCols(query);
        console.timeEnd('searchCols');
        console.log(`✅ Réponse pour '${query}':`, searchResults);
        console.log(`📊 ${searchResults.length} résultats trouvés`);
        this.results.public.searchCols = { success: true, data: searchResults };
      } catch (error) {
        console.error('❌ Erreur:', error);
        this.results.public.searchCols = { success: false, error };
      }
      console.groupEnd();
      
      // Test getColsByRegion
      console.group('getColsByRegion()');
      try {
        const region = 'alps'; // Région commune
        console.time('getColsByRegion');
        const regionResults = await apiOrchestrator.getColsByRegion(region);
        console.timeEnd('getColsByRegion');
        console.log(`✅ Réponse pour région '${region}':`, regionResults);
        console.log(`📊 ${regionResults.length} cols trouvés dans la région`);
        this.results.public.getColsByRegion = { success: true, data: regionResults };
      } catch (error) {
        console.error('❌ Erreur:', error);
        this.results.public.getColsByRegion = { success: false, error };
      }
      console.groupEnd();
      
      // Test getColsByDifficulty
      console.group('getColsByDifficulty()');
      try {
        const difficulty = 'medium'; // Difficulté commune
        console.time('getColsByDifficulty');
        const difficultyResults = await apiOrchestrator.getColsByDifficulty(difficulty);
        console.timeEnd('getColsByDifficulty');
        console.log(`✅ Réponse pour difficulté '${difficulty}':`, difficultyResults);
        console.log(`📊 ${difficultyResults.length} cols trouvés pour cette difficulté`);
        this.results.public.getColsByDifficulty = { success: true, data: difficultyResults };
      } catch (error) {
        console.error('❌ Erreur:', error);
        this.results.public.getColsByDifficulty = { success: false, error };
      }
      console.groupEnd();
      
      // Test getAllMajeurs7Challenges
      console.group('getAllMajeurs7Challenges()');
      try {
        console.time('getAllMajeurs7Challenges');
        const challenges = await apiOrchestrator.getAllMajeurs7Challenges();
        console.timeEnd('getAllMajeurs7Challenges');
        console.log('✅ Réponse:', challenges);
        console.log(`📊 ${challenges.length} défis trouvés`);
        this.results.public.getAllMajeurs7Challenges = { success: true, data: challenges };
      } catch (error) {
        console.error('❌ Erreur:', error);
        this.results.public.getAllMajeurs7Challenges = { success: false, error };
      }
      console.groupEnd();
      
    } catch (error) {
      console.error('❌ Erreur globale:', error);
    }
    
    console.groupEnd();
    return this.results.public;
  },
  
  // Test des endpoints protégés
  async testProtectedEndpoints() {
    console.group('%c🔒 Test des endpoints protégés', 'font-weight: bold; font-size: 16px; color: #2196f3;');
    
    const apiOrchestrator = getApiOrchestrator();
    if (!apiOrchestrator) {
      console.error('❌ Impossible d\'accéder à l\'orchestrateur API');
      console.groupEnd();
      return;
    }
    
    try {
      // Vérifier d'abord si nous avons un token
      console.group('🔑 Vérification du token');
      // Cette fonction supposée existe dans l'application
      const authUtils = window.authUtils || {};
      const getToken = authUtils.getToken || (() => Promise.resolve(null));
      
      const token = await getToken();
      if (!token) {
        console.warn('⚠️ Aucun token d\'authentification trouvé. Les tests protégés échoueront probablement.');
      } else {
        console.log('✅ Token trouvé:', token.substring(0, 15) + '...');
      }
      console.groupEnd();
      
      // Test getUserProfile
      console.group('getUserProfile()');
      try {
        // Utiliser 'me' comme ID si c'est la convention de l'API, ou 'current'
        const userId = 'me'; 
        console.time('getUserProfile');
        const profile = await apiOrchestrator.getUserProfile(userId);
        console.timeEnd('getUserProfile');
        console.log('✅ Réponse:', profile);
        this.results.protected.getUserProfile = { success: true, data: profile };
        
        // Si nous avons un profil, utiliser son ID pour d'autres tests
        if (profile && profile.id) {
          const actualUserId = profile.id;
          
          // Test getUserActivities
          console.group('getUserActivities()');
          try {
            console.time('getUserActivities');
            const activities = await apiOrchestrator.getUserActivities(actualUserId);
            console.timeEnd('getUserActivities');
            console.log('✅ Réponse:', activities);
            console.log(`📊 ${activities.activities?.length || 0} activités sur ${activities.total || 0}`);
            this.results.protected.getUserActivities = { success: true, data: activities };
          } catch (error) {
            console.error('❌ Erreur:', error);
            this.results.protected.getUserActivities = { success: false, error };
          }
          console.groupEnd();
          
          // Test getUserTrainingPlans
          console.group('getUserTrainingPlans()');
          try {
            console.time('getUserTrainingPlans');
            const plans = await apiOrchestrator.getUserTrainingPlans(actualUserId);
            console.timeEnd('getUserTrainingPlans');
            console.log('✅ Réponse:', plans);
            console.log(`📊 ${plans?.length || 0} plans d'entraînement`);
            this.results.protected.getUserTrainingPlans = { success: true, data: plans };
          } catch (error) {
            console.error('❌ Erreur:', error);
            this.results.protected.getUserTrainingPlans = { success: false, error };
          }
          console.groupEnd();
          
          // Test getUserNutritionPlan
          console.group('getUserNutritionPlan()');
          try {
            console.time('getUserNutritionPlan');
            const nutritionPlan = await apiOrchestrator.getUserNutritionPlan(actualUserId);
            console.timeEnd('getUserNutritionPlan');
            console.log('✅ Réponse:', nutritionPlan);
            this.results.protected.getUserNutritionPlan = { success: true, data: nutritionPlan };
          } catch (error) {
            console.error('❌ Erreur:', error);
            this.results.protected.getUserNutritionPlan = { success: false, error };
          }
          console.groupEnd();
          
          // Test updateUserProfile
          console.group('updateUserProfile()');
          try {
            // Préparation d'une mise à jour mineure (bio uniquement)
            const profileUpdate = {
              bio: `Bio mise à jour le ${new Date().toLocaleString()}`
            };
            console.time('updateUserProfile');
            const updatedProfile = await apiOrchestrator.updateUserProfile(actualUserId, profileUpdate);
            console.timeEnd('updateUserProfile');
            console.log('✅ Réponse:', updatedProfile);
            this.results.protected.updateUserProfile = { success: true, data: updatedProfile };
          } catch (error) {
            console.error('❌ Erreur:', error);
            this.results.protected.updateUserProfile = { success: false, error };
          }
          console.groupEnd();
          
          // Test getMajeurs7Progress
          console.group('getMajeurs7Progress()');
          try {
            // Récupérer d'abord les challenges
            let challenges = [];
            try {
              challenges = await apiOrchestrator.getAllMajeurs7Challenges();
            } catch (error) {
              console.warn('⚠️ Impossible de récupérer les challenges:', error);
            }
            
            if (challenges.length > 0) {
              const firstChallenge = challenges[0];
              console.time('getMajeurs7Progress');
              const progress = await apiOrchestrator.getMajeurs7Progress(actualUserId, firstChallenge.id);
              console.timeEnd('getMajeurs7Progress');
              console.log('✅ Réponse:', progress);
              this.results.protected.getMajeurs7Progress = { success: true, data: progress };
            } else {
              console.warn('⚠️ Aucun challenge disponible pour tester getMajeurs7Progress');
              this.results.protected.getMajeurs7Progress = { success: false, error: new Error('Aucun challenge disponible') };
            }
          } catch (error) {
            console.error('❌ Erreur:', error);
            this.results.protected.getMajeurs7Progress = { success: false, error };
          }
          console.groupEnd();
          
          // Test getFTPHistory
          console.group('getFTPHistory()');
          try {
            console.time('getFTPHistory');
            const ftpHistory = await apiOrchestrator.getFTPHistory(actualUserId);
            console.timeEnd('getFTPHistory');
            console.log('✅ Réponse:', ftpHistory);
            this.results.protected.getFTPHistory = { success: true, data: ftpHistory };
          } catch (error) {
            console.error('❌ Erreur:', error);
            this.results.protected.getFTPHistory = { success: false, error };
          }
          console.groupEnd();
        }
      } catch (error) {
        console.error('❌ Erreur:', error);
        this.results.protected.getUserProfile = { success: false, error };
      }
      console.groupEnd();
      
    } catch (error) {
      console.error('❌ Erreur globale:', error);
    }
    
    console.groupEnd();
    return this.results.protected;
  },
  
  // Rapport de synthèse
  generateReport() {
    console.group('%c📋 Rapport de synthèse', 'font-weight: bold; font-size: 16px; color: #9c27b0;');
    
    // Compter les résultats
    const publicResults = Object.entries(this.results.public);
    const protectedResults = Object.entries(this.results.protected);
    
    const publicSuccess = publicResults.filter(([_, result]) => result.success).length;
    const publicTotal = publicResults.length;
    
    const protectedSuccess = protectedResults.filter(([_, result]) => result.success).length;
    const protectedTotal = protectedResults.length;
    
    const totalSuccess = publicSuccess + protectedSuccess;
    const totalTests = publicTotal + protectedTotal;
    
    // Afficher les statistiques
    console.log(`📊 Endpoints publics: ${publicSuccess}/${publicTotal} réussis`);
    console.log(`🔒 Endpoints protégés: ${protectedSuccess}/${protectedTotal} réussis`);
    console.log(`🏁 Total: ${totalSuccess}/${totalTests} réussis (${Math.round((totalSuccess/totalTests || 0) * 100)}%)`);
    
    // Afficher les erreurs
    const publicErrors = publicResults.filter(([_, result]) => !result.success);
    const protectedErrors = protectedResults.filter(([_, result]) => !result.success);
    
    if (publicErrors.length > 0 || protectedErrors.length > 0) {
      console.group('❌ Erreurs détectées');
      
      if (publicErrors.length > 0) {
        console.group('Endpoints publics');
        publicErrors.forEach(([name, result]) => {
          console.log(`${name}: ${result.error?.message || 'Erreur inconnue'}`);
        });
        console.groupEnd();
      }
      
      if (protectedErrors.length > 0) {
        console.group('Endpoints protégés');
        protectedErrors.forEach(([name, result]) => {
          console.log(`${name}: ${result.error?.message || 'Erreur inconnue'}`);
        });
        console.groupEnd();
      }
      
      console.groupEnd();
    }
    
    console.groupEnd();
    
    // Générer le rapport formaté pour documentation
    return this.generateFormattedReport();
  },
  
  // Générer un rapport détaillé formaté en markdown
  generateFormattedReport() {
    const now = new Date();
    let report = `# Rapport de validation API - Velo-Altitude\n\n`;
    report += `*Généré le ${now.toLocaleDateString()} à ${now.toLocaleTimeString()}*\n\n`;
    
    report += `## Résumé\n\n`;
    
    // Compter les résultats
    const publicResults = Object.entries(this.results.public);
    const protectedResults = Object.entries(this.results.protected);
    
    const publicSuccess = publicResults.filter(([_, result]) => result.success).length;
    const publicTotal = publicResults.length;
    
    const protectedSuccess = protectedResults.filter(([_, result]) => result.success).length;
    const protectedTotal = protectedResults.length;
    
    const totalSuccess = publicSuccess + protectedSuccess;
    const totalTests = publicTotal + protectedTotal;
    
    report += `- **Endpoints publics**: ${publicSuccess}/${publicTotal} réussis\n`;
    report += `- **Endpoints protégés**: ${protectedSuccess}/${protectedTotal} réussis\n`;
    report += `- **Total**: ${totalSuccess}/${totalTests} réussis (${Math.round((totalSuccess/totalTests || 0) * 100)}%)\n\n`;
    
    // Rapport détaillé des endpoints publics
    report += `## Endpoints publics\n\n`;
    publicResults.forEach(([name, result]) => {
      report += `### \`${name}()\`\n`;
      report += `- **Statut**: ${result.success ? '✅ Succès' : '❌ Échec'}\n`;
      if (!result.success) {
        report += `- **Erreur**: ${result.error?.message || 'Erreur inconnue'}\n`;
      } else {
        report += `- **Format de réponse**: ${Array.isArray(result.data) ? 'Array' : 'Object'}\n`;
        
        if (Array.isArray(result.data)) {
          report += `- **Nombre d'éléments**: ${result.data.length}\n`;
          if (result.data.length > 0) {
            report += `- **Exemple de structure**:\n\`\`\`json\n${JSON.stringify(result.data[0], null, 2).substring(0, 500)}${result.data[0] && JSON.stringify(result.data[0], null, 2).length > 500 ? '...' : ''}\n\`\`\`\n`;
          }
        } else if (result.data) {
          report += `- **Structure**:\n\`\`\`json\n${JSON.stringify(result.data, null, 2).substring(0, 500)}${result.data && JSON.stringify(result.data, null, 2).length > 500 ? '...' : ''}\n\`\`\`\n`;
        }
      }
      report += '\n';
    });
    
    // Rapport détaillé des endpoints protégés
    report += `## Endpoints protégés\n\n`;
    protectedResults.forEach(([name, result]) => {
      report += `### \`${name}()\`\n`;
      report += `- **Statut**: ${result.success ? '✅ Succès' : '❌ Échec'}\n`;
      
      // Vérifier si les en-têtes d'authentification étaient présents
      const authHeaders = requestInspector._initialized && requestInspector.requests.some(req => 
        req.url.includes(name.toLowerCase()) && req.hasAuthHeader
      );
      report += `- **En-têtes d'authentification**: ${authHeaders ? '✅ Présents' : '❓ Non détectés'}\n`;
      
      if (!result.success) {
        report += `- **Erreur**: ${result.error?.message || 'Erreur inconnue'}\n`;
      } else {
        report += `- **Format de réponse**: ${Array.isArray(result.data) ? 'Array' : 'Object'}\n`;
        
        if (Array.isArray(result.data)) {
          report += `- **Nombre d'éléments**: ${result.data.length}\n`;
          if (result.data.length > 0) {
            report += `- **Exemple de structure**:\n\`\`\`json\n${JSON.stringify(result.data[0], null, 2).substring(0, 500)}${result.data[0] && JSON.stringify(result.data[0], null, 2).length > 500 ? '...' : ''}\n\`\`\`\n`;
          }
        } else if (result.data) {
          report += `- **Structure**:\n\`\`\`json\n${JSON.stringify(result.data, null, 2).substring(0, 500)}${result.data && JSON.stringify(result.data, null, 2).length > 500 ? '...' : ''}\n\`\`\`\n`;
        }
      }
      report += '\n';
    });
    
    // Rapport des requêtes HTTP
    if (requestInspector._initialized && requestInspector.requests.length > 0) {
      report += `## Analyse des requêtes HTTP\n\n`;
      report += `- **Total des requêtes**: ${requestInspector.requests.length}\n`;
      report += `- **Requêtes avec authentification**: ${requestInspector.requests.filter(req => req.hasAuthHeader).length}\n\n`;
      
      // Grouper par endpoint
      const endpointGroups = {};
      requestInspector.requests.forEach(req => {
        const endpoint = req.url.split('?')[0]; // Ignorer les paramètres
        if (!endpointGroups[endpoint]) {
          endpointGroups[endpoint] = [];
        }
        endpointGroups[endpoint].push(req);
      });
      
      report += `### Détail par endpoint\n\n`;
      
      Object.entries(endpointGroups).forEach(([endpoint, requests]) => {
        report += `#### ${endpoint}\n`;
        report += `- **Nombre d'appels**: ${requests.length}\n`;
        report += `- **Méthodes**: ${[...new Set(requests.map(r => r.method))].join(', ')}\n`;
        report += `- **Statuts**: ${[...new Set(requests.map(r => r.status))].join(', ')}\n`;
        report += `- **Authentification**: ${requests.some(r => r.hasAuthHeader) ? '✅ Présente' : '❌ Absente'}\n\n`;
      });
    }
    
    // Conclusions et recommandations
    report += `## Conclusions\n\n`;
    
    if (totalSuccess === totalTests) {
      report += `✅ **Tous les endpoints ont été validés avec succès.**\n\n`;
    } else {
      const successRate = Math.round((totalSuccess / totalTests) * 100);
      report += `⚠️ **${successRate}% des endpoints ont été validés avec succès.** Des erreurs ont été détectées et doivent être analysées.\n\n`;
    }
    
    // Résumé des problèmes
    const allErrors = [...publicErrors, ...protectedErrors];
    if (allErrors.length > 0) {
      report += `### Problèmes identifiés\n\n`;
      allErrors.forEach(([name, result]) => {
        report += `- **${name}**: ${result.error?.message || 'Erreur inconnue'}\n`;
      });
      report += '\n';
    }
    
    // Ajouter des recommandations
    report += `## Recommandations\n\n`;
    
    // Recommandations basées sur les résultats
    if (allErrors.length > 0) {
      report += `1. Vérifier la disponibilité des endpoints échoués avec l'équipe backend\n`;
      report += `2. S'assurer que les structures de données correspondent aux attentes de l'API\n`;
    }
    
    // Recommandations générales
    report += `3. S'assurer que les tokens d'authentification sont correctement transmis\n`;
    report += `4. Vérifier la gestion des erreurs côté client pour tous les endpoints\n`;
    report += `5. Confirmer les conventions de nommage et la structure des réponses avec l'équipe backend\n`;
    
    return report;
  },
  
  // Exécuter tous les tests et générer le rapport
  async runAll() {
    await this.testPublicEndpoints();
    await this.testProtectedEndpoints();
    return this.generateReport();
  }
};

// Exposer l'utilitaire à window pour utilisation dans la console
window.veloApiTest = veloApiTest;

// Message d'aide
console.log('%c🧪 Testeur d\'API Velo-Altitude chargé', 'font-weight: bold; color: #4caf50;');
console.log('Utilisez window.veloApiTest pour accéder à l\'utilitaire de test');
console.log('Commandes disponibles:');
console.log('- veloApiTest.testPublicEndpoints() - Teste les endpoints publics');
console.log('- veloApiTest.testProtectedEndpoints() - Teste les endpoints protégés');
console.log('- veloApiTest.runAll() - Exécute tous les tests et génère un rapport');
console.log('- veloApiTest.results - Voir les résultats bruts');
console.log('- veloApiTest.generateReport() - Générer un rapport de synthèse');

// Retourner l'utilitaire pour chaînage
veloApiTest;

// Activation du monitoring des requêtes
requestInspector.monitorHeaders();

// Afficher les requêtes capturées
requestInspector.reportRequests();
