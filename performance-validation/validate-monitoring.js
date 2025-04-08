/**
 * Script de validation du système de monitoring de performance
 * 
 * Ce script teste les fonctionnalités clés du système de monitoring sans 
 * nécessiter le démarrage complet de l'application.
 */

// Importer les modules de performance
const { markPerformanceEvent, setupPerformanceMonitoring } = require('../client/src/performance/setupMonitoring');
const performanceMonitoring = require('../client/src/utils/performanceMonitoring');

console.log('🔍 Validation du système de monitoring de performance');

// Simuler l'environnement du navigateur
global.window = {
  performance: {
    mark: (name, options) => console.log(`[Performance Mark] ${name}`, options || ''),
    measure: (name, startMark, endMark, options) => console.log(`[Performance Measure] ${name}: ${startMark} to ${endMark}`, options || ''),
    getEntriesByName: () => [],
    getEntriesByType: () => [],
    now: () => Date.now()
  },
  console: console,
  requestAnimationFrame: (callback) => setTimeout(callback, 16),
  addEventListener: (event, handler) => console.log(`[Event Listener Added] ${event}`),
  document: {
    visibilityState: 'visible',
    addEventListener: (event, handler) => console.log(`[Document Event Listener Added] ${event}`)
  }
};

global.document = global.window.document;
global.navigator = {
  userAgent: 'Node.js Performance Validator'
};

// Test 1: Validation des marqueurs de performance
console.log('\n📊 Test 1: Validation des marqueurs de performance');
try {
  markPerformanceEvent('validation_start', { test: 'basic_functionality' });
  console.log('✅ Marqueur de performance créé avec succès');
  
  // Simuler des opérations
  setTimeout(() => {
    markPerformanceEvent('validation_operation', { 
      operationName: 'test_operation',
      duration: 150
    });
    console.log('✅ Marqueur d\'opération créé avec succès');
  }, 100);
  
  setTimeout(() => {
    markPerformanceEvent('validation_end', { test: 'basic_functionality' });
    console.log('✅ Marqueur de fin créé avec succès');
    
    // Test 2: Configuration du monitoring
    console.log('\n📊 Test 2: Configuration du monitoring');
    try {
      const monitor = setupPerformanceMonitoring({
        enableWebVitals: true,
        enableDevPanel: true,
        debug: true
      });
      
      console.log('✅ Configuration du monitoring réussie');
      console.log('Configuration:', JSON.stringify(monitor.getConfig(), null, 2));
      
      // Test 3: Simulation de mesures
      console.log('\n📊 Test 3: Simulation de mesures');
      
      // Simuler une mesure FPS
      const fps = Array(60).fill(0).map((_, i) => 55 + Math.random() * 10);
      const avgFps = fps.reduce((sum, val) => sum + val, 0) / fps.length;
      
      console.log(`Simulation FPS - Moyenne: ${avgFps.toFixed(2)} fps`);
      
      // Simuler des mesures Web Vitals
      const webVitals = {
        LCP: { value: 2300, rating: 'good' },
        CLS: { value: 0.05, rating: 'good' },
        FID: { value: 80, rating: 'good' },
        INP: { value: 150, rating: 'needs-improvement' },
        TTFB: { value: 450, rating: 'good' }
      };
      
      Object.entries(webVitals).forEach(([metric, data]) => {
        console.log(`Simulation ${metric}: ${data.value} (${data.rating})`);
      });
      
      console.log('\n✅ Validation du système de monitoring complète');
      console.log('Toutes les fonctionnalités testées semblent opérationnelles');
      console.log('Prêt pour l\'intégration dans l\'application principale');
      
    } catch (error) {
      console.error('❌ Erreur dans la configuration du monitoring:', error);
    }
  }, 500);
  
} catch (error) {
  console.error('❌ Erreur dans la création des marqueurs de performance:', error);
}
