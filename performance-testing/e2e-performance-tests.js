/**
 * Tests de performance End-to-End
 * 
 * Script de test automatisé pour mesurer les performances de l'application
 * dans des scénarios d'utilisation réels, en complément des tests Lighthouse.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration - peut être modifiée via les arguments CLI
const CONFIG = {
  baseUrl: process.env.TEST_URL || 'http://localhost:3000',
  runs: process.env.TEST_RUNS || 3,
  device: process.env.TEST_DEVICE || 'desktop', // 'desktop', 'mobile'
  connection: process.env.TEST_CONNECTION || '4g', // '4g', '3g', 'fast'
  outputDir: process.env.TEST_OUTPUT_DIR || './performance-results',
  headless: process.env.TEST_HEADLESS !== 'false'
};

// Paramètres de throttling réseau
const NETWORK_PRESETS = {
  fast: { latency: 0, downloadSpeed: 100 * 1024 * 1024, uploadSpeed: 100 * 1024 * 1024 },
  '4g': { latency: 100, downloadSpeed: 4 * 1024 * 1024 / 8, uploadSpeed: 1 * 1024 * 1024 / 8 },
  '3g': { latency: 300, downloadSpeed: 1.5 * 1024 * 1024 / 8, uploadSpeed: 750 * 1024 / 8 }
};

// Paramètres de device
const DEVICE_PRESETS = {
  desktop: { width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false },
  mobile: { width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
};

// Scénarios de test
const TEST_SCENARIOS = [
  {
    name: 'HomePage_Load',
    description: 'Chargement de la page d\'accueil',
    run: async (page) => {
      await page.goto(`${CONFIG.baseUrl}/`, { waitUntil: 'networkidle0' });
      // Attendre que le contenu principal soit chargé
      await page.waitForSelector('.hero-section', { visible: true });
    }
  },
  {
    name: 'ColsList_Load',
    description: 'Chargement de la liste des cols',
    run: async (page) => {
      await page.goto(`${CONFIG.baseUrl}/cols`, { waitUntil: 'networkidle0' });
      // Attendre que la liste soit chargée
      await page.waitForSelector('.col-list-item', { visible: true });
    }
  },
  {
    name: 'ColDetail_Load',
    description: 'Chargement des détails d\'un col',
    run: async (page) => {
      // Aller d'abord à la liste des cols
      await page.goto(`${CONFIG.baseUrl}/cols`, { waitUntil: 'networkidle0' });
      // Cliquer sur le premier col
      await page.waitForSelector('.col-list-item', { visible: true });
      await page.click('.col-list-item');
      // Attendre que le détail du col se charge
      await page.waitForSelector('.col-detail', { visible: true });
    }
  },
  {
    name: '3DProfile_Load',
    description: 'Chargement du profil 3D d\'un col',
    run: async (page) => {
      // Aller directement à la page d'un col connu
      await page.goto(`${CONFIG.baseUrl}/cols/1`, { waitUntil: 'networkidle0' });
      // Attendre que le canvas 3D se charge
      await page.waitForSelector('canvas.profile-3d', { visible: true });
      // Attendre un peu pour que le rendu 3D s'initialise
      await page.waitForTimeout(1000);
    }
  },
  {
    name: 'SearchFilter_Interaction',
    description: 'Interaction avec les filtres de recherche',
    run: async (page) => {
      await page.goto(`${CONFIG.baseUrl}/cols`, { waitUntil: 'networkidle0' });
      // Attendre que les filtres soient chargés
      await page.waitForSelector('.search-filters', { visible: true });
      // Cliquer sur le filtre de difficulté
      await page.click('.difficulty-filter');
      // Sélectionner une option
      await page.waitForSelector('.difficulty-option', { visible: true });
      await page.click('.difficulty-option:nth-child(2)');
      // Attendre que les résultats filtrés s'affichent
      await page.waitForSelector('.filtered-results', { visible: true });
    }
  },
  {
    name: 'Map_Interaction',
    description: 'Chargement et interaction avec la carte',
    run: async (page) => {
      await page.goto(`${CONFIG.baseUrl}/map`, { waitUntil: 'networkidle0' });
      // Attendre que la carte soit chargée
      await page.waitForSelector('.leaflet-container', { visible: true });
      // Attendre l'initialisation complète
      await page.waitForTimeout(1000);
      // Simuler un zoom
      await page.click('.leaflet-control-zoom-in');
      // Attendre le chargement des tuiles après zoom
      await page.waitForTimeout(800);
    }
  }
];

/**
 * Exécute les scénarios de test et collecte les métriques
 */
async function runPerformanceTests() {
  console.log(`🚀 Démarrage des tests de performance - ${CONFIG.runs} exécutions, appareil: ${CONFIG.device}, réseau: ${CONFIG.connection}`);
  
  // Créer le dossier de sortie s'il n'existe pas
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
  
  // Configuration du navigateur
  const browser = await puppeteer.launch({
    headless: CONFIG.headless,
    defaultViewport: DEVICE_PRESETS[CONFIG.device],
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  // Résultats pour tous les scénarios
  const allResults = {};
  
  // Exécuter chaque scénario
  for (const scenario of TEST_SCENARIOS) {
    console.log(`\n📊 Exécution du scénario: ${scenario.name} - ${scenario.description}`);
    const scenarioResults = [];
    
    // Exécuter plusieurs fois pour obtenir une moyenne
    for (let run = 1; run <= CONFIG.runs; run++) {
      console.log(`  📌 Exécution ${run}/${CONFIG.runs}`);
      
      // Ouvrir une nouvelle page pour chaque exécution
      const page = await browser.newPage();
      
      // Simuler le réseau choisi
      if (CONFIG.connection !== 'fast') {
        const networkPreset = NETWORK_PRESETS[CONFIG.connection];
        await page.emulateNetworkConditions(networkPreset);
      }
      
      // Activer la collecte des métriques de performance
      await page.evaluateOnNewDocument(() => {
        window.performance.setResourceTimingBufferSize(500);
        
        // Collecter les Core Web Vitals
        let lcp = { value: 0 };
        let cls = { value: 0 };
        let fid = { value: 0 };
        
        // LCP
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          lcp = { value: lastEntry.startTime };
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        
        // CLS
        new PerformanceObserver((entryList) => {
          let clsValue = 0;
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          cls = { value: clsValue };
        }).observe({ type: 'layout-shift', buffered: true });
        
        // FID
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            fid = { value: entry.processingStart - entry.startTime };
          }
        }).observe({ type: 'first-input', buffered: true });
        
        // Exposer les métriques pour la collecte
        window.vitalsMetrics = { lcp, cls, fid };
      });
      
      // Mesurer le temps d'exécution
      const startTime = Date.now();
      
      try {
        // Exécuter le scénario
        await scenario.run(page);
        
        // Collecter les métriques
        const metrics = await page.evaluate(() => {
          // Navigation Timing API
          const navigationTiming = performance.getEntriesByType('navigation')[0];
          
          // Resource Timing pour les ressources clés
          const resources = performance.getEntriesByType('resource');
          const jsResources = resources.filter(r => r.initiatorType === 'script');
          const cssResources = resources.filter(r => r.initiatorType === 'link' && r.name.endsWith('.css'));
          const imgResources = resources.filter(r => r.initiatorType === 'img');
          
          // Calcul des totaux par type
          const calculateTotal = (items) => {
            return {
              count: items.length,
              size: items.reduce((sum, item) => sum + (item.transferSize || 0), 0),
              loadTime: Math.max(...items.map(item => item.responseEnd), 0)
            };
          };
          
          return {
            // Métriques de timing
            navigationStart: navigationTiming.startTime,
            domContentLoaded: navigationTiming.domContentLoadedEventEnd - navigationTiming.startTime,
            load: navigationTiming.loadEventEnd - navigationTiming.startTime,
            ttfb: navigationTiming.responseStart - navigationTiming.requestStart,
            
            // Web Vitals
            lcp: window.vitalsMetrics?.lcp.value || 0,
            cls: window.vitalsMetrics?.cls.value || 0,
            fid: window.vitalsMetrics?.fid.value || 0,
            
            // Ressources
            js: calculateTotal(jsResources),
            css: calculateTotal(cssResources),
            img: calculateTotal(imgResources),
            totalRequests: resources.length,
            totalTransferSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0)
          };
        });
        
        // Ajouter le temps total d'exécution
        const executionTime = Date.now() - startTime;
        metrics.executionTime = executionTime;
        
        // Ajouter aux résultats
        scenarioResults.push(metrics);
        
        console.log(`  ✅ Terminé en ${executionTime}ms, LCP: ${Math.round(metrics.lcp)}ms, TTFB: ${Math.round(metrics.ttfb)}ms`);
      } catch (error) {
        console.error(`  ❌ Erreur dans le scénario ${scenario.name}:`, error);
      } finally {
        await page.close();
      }
    }
    
    // Calculer les moyennes
    const average = {};
    if (scenarioResults.length > 0) {
      const keys = Object.keys(scenarioResults[0]);
      keys.forEach(key => {
        if (key === 'js' || key === 'css' || key === 'img') {
          // Traitement spécial pour les objets imbriqués
          average[key] = {
            count: Math.round(scenarioResults.reduce((sum, result) => sum + result[key].count, 0) / scenarioResults.length),
            size: Math.round(scenarioResults.reduce((sum, result) => sum + result[key].size, 0) / scenarioResults.length),
            loadTime: Math.round(scenarioResults.reduce((sum, result) => sum + result[key].loadTime, 0) / scenarioResults.length)
          };
        } else {
          // Moyenne simple pour les valeurs numériques
          average[key] = Math.round(scenarioResults.reduce((sum, result) => sum + result[key], 0) / scenarioResults.length);
        }
      });
    }
    
    // Stocker les résultats
    allResults[scenario.name] = {
      average,
      individual: scenarioResults
    };
    
    // Afficher les résultats moyens
    console.log('  📈 Résultats moyens:');
    console.log(`    - Temps d'exécution: ${average.executionTime}ms`);
    console.log(`    - LCP: ${average.lcp}ms`);
    console.log(`    - TTFB: ${average.ttfb}ms`);
    console.log(`    - DOM Content Loaded: ${average.domContentLoaded}ms`);
    console.log(`    - Requêtes totales: ${average.totalRequests}`);
    console.log(`    - Taille totale transférée: ${Math.round(average.totalTransferSize / 1024)}KB`);
  }
  
  // Fermer le navigateur
  await browser.close();
  
  // Enregistrer les résultats dans un fichier
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const outputFile = path.join(CONFIG.outputDir, `performance-results-${CONFIG.device}-${CONFIG.connection}-${timestamp}.json`);
  
  fs.writeFileSync(outputFile, JSON.stringify({
    config: CONFIG,
    timestamp: new Date().toISOString(),
    results: allResults
  }, null, 2));
  
  console.log(`\n✨ Tests terminés! Résultats enregistrés dans: ${outputFile}`);
  
  // Vérifier les budgets de performance
  checkPerformanceBudgets(allResults);
}

/**
 * Vérifie les résultats par rapport aux budgets de performance
 */
function checkPerformanceBudgets(results) {
  console.log('\n📋 Vérification des budgets de performance:');
  
  // Budgets définis dans PERFORMANCE_BUDGETS.md
  const budgets = {
    LCP: 2500,        // 2.5s
    TTFB: 800,        // 800ms
    ExecutionTime: {  // Temps d'exécution total par scénario
      HomePage_Load: 3000,
      ColsList_Load: 3500,
      ColDetail_Load: 4000,
      '3DProfile_Load': 5000,
      SearchFilter_Interaction: 2000,
      Map_Interaction: 3500
    }
  };
  
  let issuesFound = false;
  
  // Vérifier chaque scénario
  Object.entries(results).forEach(([scenarioName, scenarioResult]) => {
    const { average } = scenarioResult;
    
    console.log(`\n  🔍 Scénario: ${scenarioName}`);
    
    // Vérifier LCP
    if (average.lcp > budgets.LCP) {
      console.log(`  ❌ LCP (${average.lcp}ms) dépasse le budget (${budgets.LCP}ms)`);
      issuesFound = true;
    } else {
      console.log(`  ✅ LCP: ${average.lcp}ms (budget: ${budgets.LCP}ms)`);
    }
    
    // Vérifier TTFB
    if (average.ttfb > budgets.TTFB) {
      console.log(`  ❌ TTFB (${average.ttfb}ms) dépasse le budget (${budgets.TTFB}ms)`);
      issuesFound = true;
    } else {
      console.log(`  ✅ TTFB: ${average.ttfb}ms (budget: ${budgets.TTFB}ms)`);
    }
    
    // Vérifier le temps d'exécution total du scénario
    const executionBudget = budgets.ExecutionTime[scenarioName];
    if (executionBudget && average.executionTime > executionBudget) {
      console.log(`  ❌ Temps d'exécution (${average.executionTime}ms) dépasse le budget (${executionBudget}ms)`);
      issuesFound = true;
    } else if (executionBudget) {
      console.log(`  ✅ Temps d'exécution: ${average.executionTime}ms (budget: ${executionBudget}ms)`);
    }
  });
  
  if (issuesFound) {
    console.log('\n⚠️ Des problèmes de performance ont été détectés. Voir les détails ci-dessus.');
  } else {
    console.log('\n🎉 Tous les budgets de performance sont respectés!');
  }
}

// Exécuter les tests
runPerformanceTests().catch(error => {
  console.error('Erreur lors de l\'exécution des tests de performance:', error);
  process.exit(1);
});
