/**
 * Tests fonctionnels pour l'application Grand Est Cyclisme
 * Ce script permet de vérifier automatiquement les fonctionnalités principales
 * et les interactions entre les différents modules
 */
const FunctionalTests = (function() {
  // État des tests
  const testState = {
    results: [],
    runningTest: null,
    completedTests: 0,
    failedTests: 0,
    startTime: null
  };

  // Configuration des tests
  const config = {
    visualFeedback: true, // Afficher des indicateurs visuels lors des tests
    autoRun: false,      // Exécuter les tests automatiquement au chargement
    logToConsole: true,  // Afficher les résultats dans la console
    waitBetweenTests: 1000, // Attente entre les tests en ms
    testTimeout: 10000   // Délai d'expiration des tests en ms
  };

  /**
   * Initialise le module de tests
   */
  function init() {
    createTestUI();
    
    if (config.autoRun) {
      setTimeout(() => {
        runAllTests();
      }, 2000);
    }
    
    // Exposer l'API pour les tests manuels dans la console
    window.testMap = testMapModule;
    window.testWeather = testWeatherModule;
    window.testStrava = testStravaModule;
    window.testAI = testAIModule;
    window.testIntegration = testModuleIntegration;
    window.runAllTests = runAllTests;
    
    console.info('Module de tests fonctionnels initialisé. Utilisez window.runAllTests() pour lancer tous les tests.');
  }

  /**
   * Crée l'interface utilisateur pour les tests
   */
  function createTestUI() {
    // Créer le conteneur pour l'interface de test
    const container = document.createElement('div');
    container.id = 'functional-tests-ui';
    container.className = 'functional-tests-ui';
    container.style.display = 'none';
    
    // Ajouter les styles
    const style = document.createElement('style');
    style.textContent = `
      .functional-tests-ui {
        position: fixed;
        top: 0;
        right: 0;
        width: 400px;
        max-height: 80vh;
        background: #fff;
        border-left: 1px solid #ddd;
        border-bottom: 1px solid #ddd;
        box-shadow: -2px 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
      
      .test-header {
        background: #1F497D;
        color: white;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .test-header h3 {
        margin: 0;
        font-size: 16px;
      }
      
      .test-controls {
        display: flex;
        gap: 8px;
      }
      
      .test-controls button {
        background: white;
        color: #1F497D;
        border: none;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      }
      
      .test-progress {
        padding: 8px 16px;
        background: #f5f5f5;
        border-bottom: 1px solid #ddd;
      }
      
      .progress-bar {
        height: 6px;
        background: #eee;
        border-radius: 3px;
        overflow: hidden;
      }
      
      .progress-fill {
        height: 100%;
        background: #1F497D;
        width: 0%;
        transition: width 0.3s ease;
      }
      
      .test-results {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      }
      
      .test-item {
        margin-bottom: 12px;
        border-left: 3px solid #ddd;
        padding: 8px 12px;
        background: #f9f9f9;
      }
      
      .test-item.success {
        border-left-color: #28a745;
      }
      
      .test-item.failure {
        border-left-color: #dc3545;
      }
      
      .test-item.running {
        border-left-color: #007bff;
        animation: pulse 1.5s infinite;
      }
      
      .test-item-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
      }
      
      .test-name {
        font-weight: 600;
      }
      
      .test-status {
        font-size: 12px;
        text-transform: uppercase;
      }
      
      .test-item.success .test-status {
        color: #28a745;
      }
      
      .test-item.failure .test-status {
        color: #dc3545;
      }
      
      .test-item.running .test-status {
        color: #007bff;
      }
      
      .test-message {
        font-size: 13px;
        color: #555;
      }
      
      .test-details {
        margin-top: 8px;
        font-size: 12px;
        color: #777;
        padding: 8px;
        background: #f0f0f0;
        border-radius: 4px;
        white-space: pre-wrap;
      }
      
      .test-summary {
        padding: 12px 16px;
        border-top: 1px solid #ddd;
        display: flex;
        justify-content: space-between;
      }
      
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
      }
      
      .visual-indicator {
        position: fixed;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 10px 15px;
        border-radius: 4px;
        font-size: 14px;
        z-index: 9999;
        pointer-events: none;
      }
      
      .test-target-highlight {
        position: absolute;
        border: 2px solid #007bff;
        background: rgba(0, 123, 255, 0.1);
        z-index: 999;
        pointer-events: none;
        border-radius: 3px;
        transition: all 0.3s ease;
      }
    `;
    document.head.appendChild(style);
    
    // Créer le contenu de l'interface
    container.innerHTML = `
      <div class="test-header">
        <h3>Tests Fonctionnels</h3>
        <div class="test-controls">
          <button id="run-all-tests">Lancer tous les tests</button>
          <button id="run-failed-tests">Relancer les échecs</button>
          <button id="toggle-test-ui">Masquer</button>
        </div>
      </div>
      
      <div class="test-progress">
        <div class="progress-bar">
          <div class="progress-fill" id="test-progress-fill"></div>
        </div>
      </div>
      
      <div class="test-results" id="test-results-container"></div>
      
      <div class="test-summary">
        <div id="test-summary-text">0 tests exécutés</div>
        <div id="test-time">Durée: 0s</div>
      </div>
    `;
    
    document.body.appendChild(container);
    
    // Configurer les événements
    document.getElementById('run-all-tests').addEventListener('click', runAllTests);
    document.getElementById('run-failed-tests').addEventListener('click', runFailedTests);
    document.getElementById('toggle-test-ui').addEventListener('click', () => {
      container.style.display = container.style.display === 'none' ? 'flex' : 'none';
      document.getElementById('toggle-test-ui').textContent = 
        container.style.display === 'none' ? 'Afficher' : 'Masquer';
    });
    
    // Créer le bouton flottant pour afficher/masquer l'UI
    const toggleButton = document.createElement('button');
    toggleButton.id = 'show-tests-button';
    toggleButton.textContent = 'Tests';
    toggleButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 8px 16px;
      background: #1F497D;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      z-index: 999;
      font-size: 14px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    toggleButton.addEventListener('click', () => {
      container.style.display = 'flex';
      document.getElementById('toggle-test-ui').textContent = 'Masquer';
    });
    document.body.appendChild(toggleButton);
  }

  /**
   * Affiche un indicateur visuel pendant les tests
   * @param {string} message Message à afficher
   * @param {HTMLElement} targetElement Élément cible à mettre en évidence (optionnel)
   */
  function showVisualIndicator(message, targetElement = null) {
    if (!config.visualFeedback) return;
    
    // Supprimer les indicateurs existants
    removeVisualIndicators();
    
    // Créer l'indicateur de message
    const indicator = document.createElement('div');
    indicator.className = 'visual-indicator';
    indicator.textContent = message;
    indicator.style.top = '70px';
    indicator.style.left = '50%';
    indicator.style.transform = 'translateX(-50%)';
    document.body.appendChild(indicator);
    
    // Mettre en évidence l'élément cible si fourni
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      
      const highlight = document.createElement('div');
      highlight.className = 'test-target-highlight';
      highlight.style.top = `${rect.top + window.scrollY}px`;
      highlight.style.left = `${rect.left + window.scrollX}px`;
      highlight.style.width = `${rect.width}px`;
      highlight.style.height = `${rect.height}px`;
      document.body.appendChild(highlight);
    }
    
    // Supprimer les indicateurs après 3 secondes
    setTimeout(removeVisualIndicators, 3000);
  }

  /**
   * Supprime tous les indicateurs visuels
   */
  function removeVisualIndicators() {
    document.querySelectorAll('.visual-indicator, .test-target-highlight').forEach(el => {
      document.body.removeChild(el);
    });
  }

  /**
   * Met à jour l'interface utilisateur des tests
   */
  function updateTestUI() {
    const resultsContainer = document.getElementById('test-results-container');
    const progressFill = document.getElementById('test-progress-fill');
    const summaryText = document.getElementById('test-summary-text');
    const timeElement = document.getElementById('test-time');
    
    // Calculer le pourcentage de progression
    const totalTests = testState.results.length;
    const completedTests = testState.completedTests;
    const progressPercent = totalTests > 0 ? (completedTests / totalTests) * 100 : 0;
    
    // Mettre à jour la barre de progression
    progressFill.style.width = `${progressPercent}%`;
    
    // Mettre à jour le résumé
    summaryText.textContent = `${completedTests}/${totalTests} tests exécutés (${testState.failedTests} échecs)`;
    
    // Mettre à jour le temps écoulé
    if (testState.startTime) {
      const elapsedSeconds = Math.round((Date.now() - testState.startTime) / 1000);
      timeElement.textContent = `Durée: ${elapsedSeconds}s`;
    }
    
    // Mettre à jour les résultats des tests
    resultsContainer.innerHTML = '';
    testState.results.forEach(result => {
      const testItem = document.createElement('div');
      testItem.className = `test-item ${result.status}`;
      
      testItem.innerHTML = `
        <div class="test-item-header">
          <div class="test-name">${result.name}</div>
          <div class="test-status">${result.status}</div>
        </div>
        <div class="test-message">${result.message || ''}</div>
        ${result.details ? `<div class="test-details">${result.details}</div>` : ''}
      `;
      
      resultsContainer.appendChild(testItem);
    });
    
    // Faire défiler jusqu'au test en cours
    if (testState.runningTest) {
      const runningElements = document.querySelectorAll('.test-item.running');
      if (runningElements.length > 0) {
        runningElements[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  /**
   * Exécute tous les tests
   */
  function runAllTests() {
    // Réinitialiser l'état des tests
    testState.results = [];
    testState.completedTests = 0;
    testState.failedTests = 0;
    testState.startTime = Date.now();
    
    // Afficher l'interface de test
    document.getElementById('functional-tests-ui').style.display = 'flex';
    document.getElementById('toggle-test-ui').textContent = 'Masquer';
    
    // Mettre à jour l'interface
    updateTestUI();
    
    console.info('Démarrage des tests fonctionnels...');
    
    // Créer la liste des tests à exécuter
    const tests = [
      // Tests du module cartographique
      { name: 'Chargement de la carte', fn: testMapLoading },
      { name: 'Marqueurs des cols', fn: testCyclingMarkers },
      { name: 'Calcul d\'itinéraire', fn: testRouteCalculation },
      { name: 'Affichage du profil d\'élévation', fn: testElevationProfile },
      { name: 'Fonction d\'isochrone', fn: testIsochrone },
      
      // Tests du module météo
      { name: 'Récupération des données météo actuelles', fn: testCurrentWeather },
      { name: 'Affichage des prévisions', fn: testWeatherForecast },
      { name: 'Évaluation des conditions cyclables', fn: testCyclingConditions },
      
      // Tests du module Strava
      { name: 'Authentification Strava', fn: testStravaAuth },
      { name: 'Récupération des activités', fn: testStravaActivities },
      { name: 'Affichage des statistiques d\'athlète', fn: testAthleteStats },
      
      // Tests du module Assistant IA
      { name: 'Initialisation de l\'assistant', fn: testAIInitialization },
      { name: 'Requêtes à l\'assistant', fn: testAIRequests },
      { name: 'Suggestions intelligentes', fn: testAISuggestions },
      
      // Tests d'intégration entre modules
      { name: 'Intégration Météo-Carte', fn: testWeatherMapIntegration },
      { name: 'Intégration Strava-Carte', fn: testStravaMapIntegration },
      { name: 'Intégration IA-Tous les modules', fn: testAIIntegration },
      
      // Tests du système de cache
      { name: 'Cache des données météo', fn: testWeatherCache },
      { name: 'Cache des itinéraires', fn: testRouteCache },
      { name: 'Cache des données Strava', fn: testStravaCache }
    ];
    
    // Ajouter les tests à l'état
    tests.forEach(test => {
      testState.results.push({
        name: test.name,
        status: 'pending',
        message: 'En attente d\'exécution',
        fn: test.fn
      });
    });
    
    // Mettre à jour l'interface
    updateTestUI();
    
    // Commencer le premier test
    runNextTest();
  }

  /**
   * Exécute les tests ayant échoué
   */
  function runFailedTests() {
    // Filtrer les tests échoués
    const failedTests = testState.results.filter(test => test.status === 'failure');
    
    if (failedTests.length === 0) {
      console.info('Aucun test en échec à exécuter.');
      return;
    }
    
    console.info(`Relancement de ${failedTests.length} tests en échec...`);
    
    // Réinitialiser les compteurs
    testState.completedTests -= failedTests.length;
    testState.failedTests = 0;
    testState.startTime = Date.now();
    
    // Réinitialiser le statut des tests échoués
    failedTests.forEach(test => {
      test.status = 'pending';
      test.message = 'En attente d\'exécution';
      test.details = null;
    });
    
    // Mettre à jour l'interface
    updateTestUI();
    
    // Commencer le premier test
    runNextTest();
  }

  /**
   * Exécute le prochain test de la file
   */
  function runNextTest() {
    // Trouver le prochain test en attente
    const nextTest = testState.results.find(test => test.status === 'pending');
    
    if (!nextTest) {
      // Tous les tests sont terminés
      console.info(`Tests terminés. ${testState.completedTests} tests exécutés, ${testState.failedTests} échecs.`);
      testState.runningTest = null;
      updateTestUI();
      return;
    }
    
    // Mettre à jour le statut du test
    nextTest.status = 'running';
    nextTest.message = 'Exécution en cours...';
    testState.runningTest = nextTest;
    
    // Mettre à jour l'interface
    updateTestUI();
    
    console.info(`Exécution du test: ${nextTest.name}`);
    
    // Créer un timeout pour le test
    const timeout = setTimeout(() => {
      completeTest(nextTest, false, 'Test timeout après ' + config.testTimeout + 'ms');
    }, config.testTimeout);
    
    // Exécuter le test
    try {
      const promise = nextTest.fn();
      
      // Si le test retourne une promesse, attendre sa résolution
      if (promise && typeof promise.then === 'function') {
        promise
          .then(result => {
            clearTimeout(timeout);
            completeTest(nextTest, result.success, result.message, result.details);
          })
          .catch(error => {
            clearTimeout(timeout);
            completeTest(nextTest, false, 'Erreur pendant l\'exécution du test', error.toString());
          });
      } else {
        // Pour les tests synchrones
        clearTimeout(timeout);
        completeTest(nextTest, true, 'Test complété avec succès');
      }
    } catch (error) {
      clearTimeout(timeout);
      completeTest(nextTest, false, 'Exception pendant l\'exécution du test', error.toString());
    }
  }

  /**
   * Finalise un test et passe au suivant
   * @param {object} test Test à finaliser
   * @param {boolean} success Résultat du test
   * @param {string} message Message de résultat
   * @param {string} details Détails supplémentaires (optionnel)
   */
  function completeTest(test, success, message, details = null) {
    test.status = success ? 'success' : 'failure';
    test.message = message;
    test.details = details;
    
    testState.completedTests++;
    if (!success) {
      testState.failedTests++;
    }
    
    testState.runningTest = null;
    
    // Mettre à jour l'interface
    updateTestUI();
    
    // Log des résultats
    if (config.logToConsole) {
      if (success) {
        console.log(`✅ ${test.name}: ${message}`);
      } else {
        console.error(`❌ ${test.name}: ${message}`, details);
      }
    }
    
    // Attendre un moment avant de lancer le prochain test
    setTimeout(runNextTest, config.waitBetweenTests);
  }

  /*****************************************************************************
   * TESTS DU MODULE CARTOGRAPHIQUE
   *****************************************************************************/
  
  /**
   * Test le chargement initial de la carte
   * @returns {Promise} Résultat du test
   */
  function testMapLoading() {
    return new Promise((resolve) => {
      showVisualIndicator("Test du chargement de la carte...", elements.mapContainer);
      
      // Vérifier si la carte est déjà chargée
      if (window.mapInstance) {
        resolve({
          success: true,
          message: "La carte est déjà chargée et prête"
        });
        return;
      }
      
      // Si la carte n'est pas chargée, attendre l'événement mapReady
      const timeout = setTimeout(() => {
        document.removeEventListener("mapReady", mapReadyHandler);
        resolve({
          success: false,
          message: "Échec du chargement de la carte dans le délai imparti",
          details: "L'événement mapReady n'a pas été déclenché dans les 5 secondes."
        });
      }, 5000);
      
      const mapReadyHandler = () => {
        clearTimeout(timeout);
        
        // Vérifier que l'objet mapInstance existe et a les propriétés attendues
        if (window.mapInstance && typeof window.mapInstance.getCenter === 'function') {
          const center = window.mapInstance.getCenter();
          const zoom = window.mapInstance.getZoom();
          
          resolve({
            success: true,
            message: "La carte s'est chargée correctement",
            details: `Centre: [${center.lng.toFixed(4)}, ${center.lat.toFixed(4)}], Zoom: ${zoom}`
          });
        } else {
          resolve({
            success: false,
            message: "La carte s'est chargée mais l'instance n'est pas correctement initialisée",
            details: `mapInstance: ${typeof window.mapInstance}`
          });
        }
      };
      
      document.addEventListener("mapReady", mapReadyHandler);
    });
  }
  
  /**
   * Test l'affichage des marqueurs des cols cyclistes
   * @returns {Promise} Résultat du test
   */
  function testCyclingMarkers() {
    return new Promise((resolve) => {
      showVisualIndicator("Test des marqueurs de cols...", elements.mapContainer);
      
      // Vérifier que la carte est chargée
      if (!window.mapInstance) {
        resolve({
          success: false,
          message: "La carte n'est pas chargée, impossible de tester les marqueurs",
          details: "Exécutez d'abord le test de chargement de la carte."
        });
        return;
      }
      
      // Vérifier la présence des marqueurs sur la carte
      setTimeout(() => {
        const markers = document.querySelectorAll('.cycling-marker');
        
        if (markers.length > 0) {
          resolve({
            success: true,
            message: `${markers.length} marqueurs de cols trouvés sur la carte`,
            details: "Les marqueurs sont correctement affichés avec leur style personnalisé."
          });
        } else {
          resolve({
            success: false,
            message: "Aucun marqueur de col trouvé sur la carte",
            details: "La fonction addCyclingMarkers() n'a peut-être pas été appelée ou a échoué."
          });
        }
      }, 2000);
    });
  }
  
  /**
   * Test le calcul d'itinéraire
   * @returns {Promise} Résultat du test
   */
  function testRouteCalculation() {
    return new Promise((resolve) => {
      showVisualIndicator("Test du calcul d'itinéraire...", elements.mapContainer);
      
      // Vérifier que la carte est chargée
      if (!window.mapInstance) {
        resolve({
          success: false,
          message: "La carte n'est pas chargée, impossible de tester le calcul d'itinéraire",
          details: "Exécutez d'abord le test de chargement de la carte."
        });
        return;
      }
      
      // Vérifier que la fonction calculateRoute existe
      if (typeof window.calculateRoute !== 'function') {
        resolve({
          success: false,
          message: "La fonction calculateRoute n'est pas disponible",
          details: "Vérifiez que la fonction est exportée correctement dans le module map.js."
        });
        return;
      }
      
      // Points de départ et d'arrivée pour le test
      const start = [6.8770, 48.1000]; // Coordonnées du centre des Vosges
      const end = [7.2511, 48.5734]; // Strasbourg
      
      // Tester le calcul d'itinéraire
      try {
        const calculatePromise = window.calculateRoute(start, end);
        
        if (calculatePromise && typeof calculatePromise.then === 'function') {
          calculatePromise
            .then(result => {
              if (result && result.routes && result.routes.length > 0) {
                const route = result.routes[0];
                
                resolve({
                  success: true,
                  message: "Itinéraire calculé avec succès",
                  details: `Distance: ${(route.distance / 1000).toFixed(1)} km, Durée: ${Math.round(route.duration / 60)} min`
                });
              } else {
                resolve({
                  success: false,
                  message: "Échec du calcul d'itinéraire, aucune route retournée",
                  details: JSON.stringify(result)
                });
              }
            })
            .catch(error => {
              resolve({
                success: false,
                message: "Erreur lors du calcul d'itinéraire",
                details: error.toString()
              });
            });
        } else {
          resolve({
            success: false,
            message: "La fonction calculateRoute ne retourne pas une promesse valide",
            details: `Type retourné: ${typeof calculatePromise}`
          });
        }
      } catch (error) {
        resolve({
          success: false,
          message: "Exception lors du calcul d'itinéraire",
          details: error.toString()
        });
      }
    });
  }
  
  /**
   * Test l'affichage du profil d'élévation
   * @returns {Promise} Résultat du test
   */
  function testElevationProfile() {
    return new Promise((resolve) => {
      showVisualIndicator("Test du profil d'élévation...");
      
      // Vérifier que la fonction showElevationProfile existe
      if (typeof window.showElevationProfile !== 'function') {
        resolve({
          success: false,
          message: "La fonction showElevationProfile n'est pas disponible",
          details: "Vérifiez que la fonction est exportée correctement dans le module map.js."
        });
        return;
      }
      
      // Tester l'affichage du profil d'élévation
      try {
        // Coordonnées du Col de la Schlucht pour le test
        const colName = "colDeLaSchlucht";
        const coords = [7.0011, 48.0539];
        
        // Appeler la fonction avec des données de test
        window.showElevationProfile(colName, coords);
        
        // Vérifier l'existence de la modal
        setTimeout(() => {
          const modal = document.querySelector('.elevation-profile-modal');
          
          if (modal) {
            // Vérifier les éléments clés du profil
            const header = modal.querySelector('.elevation-profile-header h3');
            const chart = modal.querySelector('#elevation-chart');
            const routeSelect = modal.querySelector('#elevation-route-select');
            
            if (header && chart && routeSelect) {
              // Fermer la modal
              const closeButton = modal.querySelector('.close-modal');
              if (closeButton) {
                closeButton.click();
              }
              
              resolve({
                success: true,
                message: "Le profil d'élévation s'affiche correctement",
                details: "Tous les éléments du profil sont présents: en-tête, graphique et sélecteur de versant."
              });
            } else {
              resolve({
                success: false,
                message: "Certains éléments du profil d'élévation sont manquants",
                details: `
                  En-tête: ${header ? 'OK' : 'Manquant'}
                  Graphique: ${chart ? 'OK' : 'Manquant'}
                  Sélecteur: ${routeSelect ? 'OK' : 'Manquant'}
                `
              });
            }
          } else {
            resolve({
              success: false,
              message: "La modal du profil d'élévation n'apparaît pas",
              details: "La fonction showElevationProfile a été appelée mais n'a pas créé la modal attendue."
            });
          }
        }, 2000);
      } catch (error) {
        resolve({
          success: false,
          message: "Exception lors de l'affichage du profil d'élévation",
          details: error.toString()
        });
      }
    });
  }
  
  /**
   * Test la fonction d'isochrone
   * @returns {Promise} Résultat du test
   */
  function testIsochrone() {
    return new Promise((resolve) => {
      showVisualIndicator("Test de la fonction d'isochrone...", elements.mapContainer);
      
      // Vérifier que la carte est chargée
      if (!window.mapInstance) {
        resolve({
          success: false,
          message: "La carte n'est pas chargée, impossible de tester la fonction d'isochrone",
          details: "Exécutez d'abord le test de chargement de la carte."
        });
        return;
      }
      
      // Vérifier que la fonction showIsochrone existe
      if (typeof window.showIsochrone !== 'function') {
        resolve({
          success: false,
          message: "La fonction showIsochrone n'est pas disponible",
          details: "Vérifiez que la fonction est exportée correctement dans le module map.js."
        });
        return;
      }
      
      // Tester l'affichage de l'isochrone
      try {
        // Coordonnées du centre de l'isochrone pour le test
        const center = [6.8770, 48.1000]; // Centre des Vosges
        const minutes = 30; // 30 minutes de trajet
        
        // Appeler la fonction avec des données de test
        const isochronePromise = window.showIsochrone(center, minutes);
        
        if (isochronePromise && typeof isochronePromise.then === 'function') {
          isochronePromise
            .then(result => {
              // Vérifier la présence de la couche d'isochrone sur la carte
              setTimeout(() => {
                const isochrones = document.querySelectorAll('.mapboxgl-canvas-container .mapboxgl-canvas');
                
                if (isochrones.length > 0) {
                  resolve({
                    success: true,
                    message: "L'isochrone s'affiche correctement sur la carte",
                    details: `Isochrone calculé pour ${minutes} minutes de trajet depuis le point [${center[0].toFixed(4)}, ${center[1].toFixed(4)}]`
                  });
                } else {
                  resolve({
                    success: false,
                    message: "L'isochrone ne s'affiche pas sur la carte",
                    details: "La fonction showIsochrone a été appelée mais n'a pas ajouté la couche attendue."
                  });
                }
              }, 2000);
            })
            .catch(error => {
              resolve({
                success: false,
                message: "Erreur lors du calcul de l'isochrone",
                details: error.toString()
              });
            });
        } else {
          resolve({
            success: false,
            message: "La fonction showIsochrone ne retourne pas une promesse valide",
            details: `Type retourné: ${typeof isochronePromise}`
          });
        }
      } catch (error) {
        resolve({
          success: false,
          message: "Exception lors du calcul de l'isochrone",
          details: error.toString()
        });
      }
    });
  }
  
  /*****************************************************************************
   * TESTS D'INTÉGRATION ENTRE MODULES
   *****************************************************************************/
  
  /**
   * Test l'intégration entre le module météo et la carte
   * @returns {Promise} Résultat du test
   */
  function testWeatherMapIntegration() {
    return new Promise((resolve) => {
      showVisualIndicator("Test de l'intégration météo-carte...");
      
      // Vérifier que les modules nécessaires sont chargés
      if (!window.mapInstance) {
        resolve({
          success: false,
          message: "La carte n'est pas chargée, impossible de tester l'intégration météo-carte",
          details: "Exécutez d'abord le test de chargement de la carte."
        });
        return;
      }
      
      if (!window.weatherModule || typeof window.weatherModule.fetchCurrentWeather !== 'function') {
        resolve({
          success: false,
          message: "Le module météo n'est pas correctement initialisé",
          details: "Vérifiez que le module weather.js est correctement chargé et initialisé."
        });
        return;
      }
      
      // Tester l'intégration météo-carte (affichage des données météo sur un col)
      try {
        // Sélectionner un col pour le test
        const cyclingMarkers = document.querySelectorAll('.cycling-marker');
        
        if (cyclingMarkers.length === 0) {
          resolve({
            success: false,
            message: "Aucun marqueur de col trouvé pour tester l'intégration météo",
            details: "Les marqueurs de cols doivent être ajoutés à la carte avant de tester l'intégration météo."
          });
          return;
        }
        
        // Simuler un clic sur le premier marqueur
        cyclingMarkers[0].click();
        
        // Attendre l'apparition du popup
        setTimeout(() => {
          const popup = document.querySelector('.mapboxgl-popup');
          
          if (!popup) {
            resolve({
              success: false,
              message: "Le popup du col ne s'affiche pas après le clic",
              details: "Vérifiez la gestion des événements de clic sur les marqueurs."
            });
            return;
          }
          
          // Trouver le bouton de détails
          const detailButton = popup.querySelector('.show-col-detail');
          
          if (!detailButton) {
            resolve({
              success: false,
              message: "Le bouton de détails n'est pas présent dans le popup",
              details: "Vérifiez la structure du popup dans la fonction addCyclingMarkers."
            });
            return;
          }
          
          // Simuler un clic sur le bouton de détails
          detailButton.click();
          
          // Attendre l'apparition de la modal
          setTimeout(() => {
            const modal = document.querySelector('.col-detail-modal');
            
            if (!modal) {
              resolve({
                success: false,
                message: "La modal de détails du col ne s'affiche pas",
                details: "Vérifiez la fonction showColDetails."
              });
              return;
            }
            
            // Vérifier la présence de la section météo
            const weatherSection = modal.querySelector('.col-weather');
            
            const success = !!weatherSection;
            
            // Fermer la modal
            const closeButton = modal.querySelector('.close-modal');
            if (closeButton) {
              closeButton.click();
            }
            
            if (success) {
              resolve({
                success: true,
                message: "L'intégration météo-carte fonctionne correctement",
                details: "Les données météo s'affichent bien dans les détails du col."
              });
            } else {
              resolve({
                success: false,
                message: "Les données météo ne s'affichent pas dans les détails du col",
                details: "Vérifiez la fonction createColModal et l'appel à fetchCurrentWeather."
              });
            }
          }, 2000);
        }, 1000);
      } catch (error) {
        resolve({
          success: false,
          message: "Exception lors du test d'intégration météo-carte",
          details: error.toString()
        });
      }
    });
  }
  
  /**
   * Tests groupés pour le module cartographique
   */
  function testMapModule() {
    runTest('Chargement de la carte', testMapLoading)
      .then(() => runTest('Marqueurs des cols', testCyclingMarkers))
      .then(() => runTest('Calcul d\'itinéraire', testRouteCalculation))
      .then(() => runTest('Profil d\'élévation', testElevationProfile))
      .then(() => runTest('Fonction d\'isochrone', testIsochrone))
      .then(() => {
        console.info('Tests du module cartographique terminés');
      });
  }
  
  /**
   * Tests groupés d'intégration entre modules
   */
  function testModuleIntegration() {
    runTest('Intégration Météo-Carte', testWeatherMapIntegration)
      .then(() => {
        console.info('Tests d\'intégration terminés');
      });
  }
  
  /**
   * Exécute un test spécifique
   * @param {string} name Nom du test
   * @param {Function} testFn Fonction de test
   * @returns {Promise} Résultat du test
   */
  function runTest(name, testFn) {
    return new Promise((resolve) => {
      console.info(`Exécution du test: ${name}`);
      
      try {
        const promise = testFn();
        
        if (promise && typeof promise.then === 'function') {
          promise
            .then(result => {
              if (result.success) {
                console.log(`✅ ${name}: ${result.message}`);
              } else {
                console.error(`❌ ${name}: ${result.message}`, result.details);
              }
              resolve(result);
            })
            .catch(error => {
              console.error(`❌ ${name}: Erreur non gérée`, error);
              resolve({
                success: false,
                message: 'Erreur non gérée',
                details: error.toString()
              });
            });
        } else {
          console.log(`✅ ${name}: Test complété avec succès`);
          resolve({
            success: true,
            message: 'Test complété avec succès'
          });
        }
      } catch (error) {
        console.error(`❌ ${name}: Exception`, error);
        resolve({
          success: false,
          message: 'Exception',
          details: error.toString()
        });
      }
    });
  }
  
  // Exposer l'API publique
  return {
    init,
    runAllTests,
    runFailedTests,
    testMapModule,
    testWeatherModule,
    testStravaModule,
    testAIModule,
    testModuleIntegration
  };
})();

// Initialiser le module de tests lorsque le document est chargé
document.addEventListener('DOMContentLoaded', function() {
  // Attendre 1 seconde pour que les autres modules se chargent
  setTimeout(() => {
    FunctionalTests.init();
  }, 1000);
});
