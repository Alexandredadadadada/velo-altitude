/**
 * Configuration pour Lighthouse CI
 * 
 * Ce fichier définit les paramètres et budgets pour les tests automatisés
 * de performance via Lighthouse CI, intégré à notre pipeline CI/CD.
 */

module.exports = {
  ci: {
    collect: {
      // URL à tester - sera remplacé par l'URL de staging dynamique dans la CI
      url: ['http://localhost:3000/', 'http://localhost:3000/cols', 'http://localhost:3000/profil'],
      // Configuration du navigateur
      settings: {
        // Simuler une connexion 4G
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        },
        // Tester sur desktop et mobile
        formFactor: 'desktop',
        screenEmulation: {
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          mobile: false
        }
      },
      // Nombre d'échantillons pour chaque URL
      numberOfRuns: 3
    },
    upload: {
      // Destination des rapports
      target: 'temporary-public-storage'
    },
    // Configuration des assertions
    assert: {
      // Assertions basées sur nos budgets de performance
      assertions: {
        // Web Vitals
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'interactive': ['warn', { maxNumericValue: 3500 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        // Autres métriques importantes
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'server-response-time': ['error', { maxNumericValue: 800 }],
        // Pratiques modernes
        'uses-responsive-images': 'error',
        'uses-optimized-images': 'error',
        'uses-text-compression': 'error',
        'uses-rel-preconnect': 'warn',
        'efficient-animated-content': 'warn',
        // JavaScript et ressources
        'unminified-javascript': 'error',
        'unminified-css': 'error',
        'unused-javascript': 'warn',
        'render-blocking-resources': 'warn',
        // Budgets
        'resource-summary:script': ['error', { maxNumericValue: 250 * 1024 }], // 250KB JS
        'resource-summary:stylesheet': ['error', { maxNumericValue: 100 * 1024 }], // 100KB CSS
        'resource-summary:font': ['warn', { maxNumericValue: 80 * 1024 }], // 80KB Fonts
        'resource-summary:third-party': ['warn', { maxNumericValue: 200 * 1024 }], // 200KB Third-party
        'resource-summary:total': ['error', { maxNumericValue: 1000 * 1024 }] // 1MB Total
      }
    },
    // Configuration du calcul des scores
    scores: {
      // Seuils de performance considérés comme acceptables
      performance: 90,
      accessibility: 90,
      'best-practices': 90,
      seo: 85,
      pwa: 50
    }
  }
};
