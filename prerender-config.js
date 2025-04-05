/**
 * Configuration pour le prérendu des pages pour les moteurs de recherche
 * Ce fichier est utilisé par react-snap ou un outil similaire pour générer
 * des versions statiques des pages pour améliorer le SEO
 */

module.exports = {
  // Liste des routes à prérendrer
  routes: [
    '/',
    '/cols',
    '/training',
    '/nutrition',
    '/seven-majors',
    '/coach',
    '/routes',
    '/social',
    
    // Cols emblématiques
    '/cols/bonette',
    '/cols/galibier',
    '/cols/stelvio',
    '/cols/tourmalet',
    '/cols/izoard',
    '/cols/angliru',
    '/cols/mortirolo',
    
    // Programmes d'entraînement
    '/training/plan-haute-montagne',
    '/training/prep-montagne',
    '/training/haute-altitude',
    '/training/programs/col-crusher',
    '/training/programs/endurance-builder',
    '/training/programs/alpine-climber',
    '/training/programs/power-intervals',
    
    // Plans nutritionnels
    '/nutrition/nutrition-plan-endurance',
    '/nutrition/nutrition-plan-gran-fondo',
    '/nutrition/nutrition-plan-mountain',
    
    // Recettes
    '/nutrition/recipes/energy-oatmeal',
    '/nutrition/recipes/recovery-smoothie',
    '/nutrition/recipes/protein-pasta',
    '/nutrition/recipes/homemade-energy-bars',
    '/nutrition/recipes/hydration-drink',
    
    // Défis communautaires
    '/challenges/above-2500-challenge',
    '/challenges/alpes-giants-challenge',
  ],
  
  // Options de configuration
  options: {
    // Attendre que le réseau soit inactif avant de considérer la page comme chargée
    waitForNetworkIdle: true,
    
    // Délai maximum d'attente en ms
    timeout: 30000,
    
    // Inclure les versions en anglais des pages
    include: [
      '/en/',
      '/en/cols',
      '/en/training',
      '/en/nutrition',
      '/en/seven-majors',
      '/en/coach',
      '/en/routes',
      '/en/social',
      // Autres routes en anglais...
    ],
    
    // Exclure certains chemins
    exclude: [
      '/admin/**',
      '/dashboard/admin/**',
      '/login',
      '/register',
      '/user/**',
    ],
    
    // Paramètres pour les moteurs de recherche
    seo: {
      // Ajouter des balises canoniques
      canonicalRoot: 'https://www.velo-altitude.com',
      
      // Gérer les versions multilingues
      hreflangBaseUrl: 'https://www.velo-altitude.com',
      defaultLocale: 'fr',
      locales: ['fr', 'en'],
    },
    
    // Optimisations de performance
    minifyCss: true,
    minifyJs: true,
    inlineCss: false,
    removeBlobs: true,
    removeScriptTags: false,
    removeStyleTags: false,
    
    // Paramètres du navigateur headless
    puppeteerArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
    puppeteerExecutablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    
    // Hooks personnalisés
    onBeforePrerender: (route) => {
      console.log(`Prérendu de la route: ${route}`);
    },
    onAfterPrerender: (route) => {
      console.log(`Prérendu terminé pour: ${route}`);
    },
  }
};
