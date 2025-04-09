/**
 * Script de build minimal pour tester la compilation
 */
const webpack = require('webpack');
const fs = require('fs');
const path = require('path');

// Charger la configuration webpack de base
const configFactory = require('../webpack.config.js');

// Garantir que nous sommes en mode production
const config = typeof configFactory === 'function' 
  ? configFactory(null, { mode: 'production' }) 
  : configFactory;

console.log('🚀 Démarrage du build minimal de test...');

// Modifications pour minimiser les erreurs potentielles
if (!config.module) {
  config.module = {};
}

if (!config.module.rules) {
  config.module.rules = [];
}

// Simplifier la configuration des loaders CSS
const cssRuleIndex = config.module.rules.findIndex(rule => 
  rule.test && rule.test.toString().includes('.css$')
);

if (cssRuleIndex !== -1) {
  config.module.rules[cssRuleIndex] = {
    test: /\.css$/,
    use: ['style-loader', 'css-loader']
  };
  console.log('✅ Configuration CSS simplifiée');
}

// Désactiver les optimisations complexes pour le test
config.optimization = {
  ...config.optimization,
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
      },
    },
  },
  runtimeChunk: 'single',
};

console.log('✅ Optimisations simplifiées');

// Exécuter webpack avec la configuration simplifiée
webpack(config, (err, stats) => {
  if (err) {
    console.error('❌ Erreur fatale lors du build:', err);
    process.exit(1);
  }
  
  if (stats.hasErrors()) {
    console.error('❌ Erreurs webpack lors du build:');
    const info = stats.toJson();
    
    // Analyser les erreurs pour mieux les comprendre
    const errors = info.errors || [];
    errors.forEach((error, index) => {
      console.error(`\n--------- Erreur ${index + 1} ---------`);
      console.error('Module:', error.moduleName || 'Inconnu');
      console.error('Fichier:', error.file || 'Inconnu');
      
      // Tenter d'extraire la partie importante du message d'erreur
      let message = error.message || '';
      if (message.length > 500) {
        message = message.substring(0, 500) + '... [message tronqué]';
      }
      console.error('Message:', message);
    });
    
    process.exit(1);
  }
  
  if (stats.hasWarnings()) {
    console.warn('⚠️ Avertissements webpack:');
    const info = stats.toJson();
    console.warn(info.warnings);
  }
  
  // Afficher les statistiques de build
  console.log(stats.toString({
    colors: true,
    chunks: false,
    modules: false,
    children: false,
    entrypoints: false,
  }));
  
  console.log('✅ Build de test terminé avec succès!');
});
