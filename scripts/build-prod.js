/**
 * Script de build optimisé pour la production et le déploiement Netlify
 * Préserve les effets visuels et le design tout en optimisant les performances
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

console.log('🚀 Démarrage du build de production avec optimisations...');

// Optimisations pour la production
config.optimization = {
  ...config.optimization,
  splitChunks: {
    chunks: 'all',
    maxInitialRequests: Infinity,
    minSize: 20000,
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name(module) {
          try {
            // Version sécurisée pour éviter les erreurs avec match()
            const packagePath = module.context || '';
            
            // Bibliothèques spécifiques regroupées
            if (packagePath.includes('three')) return 'vendor.three';
            if (packagePath.includes('chart')) return 'vendor.chart';
            if (packagePath.includes('react') || packagePath.includes('redux')) return 'vendor.react';
            if (packagePath.includes('material') || packagePath.includes('mui')) return 'vendor.material';
            
            // Extraire le nom du package de façon sécurisée
            const matches = packagePath.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
            const packageName = matches && matches[1] ? matches[1] : 'misc';
            return `vendor.${packageName.replace('@', '')}`;
          } catch (err) {
            console.warn('⚠️ Erreur lors de la génération du nom de chunk:', err.message);
            return 'vendor.misc';
          }
        },
      },
    },
  },
  runtimeChunk: 'single',
};

// Préservation des effets visuels
const hasShaderRule = config.module.rules.some(rule => 
  rule.test && rule.test.toString().includes('glsl|vs|fs|vert|frag')
);

if (!hasShaderRule) {
  console.log('✅ Ajout du support pour les shaders et effets visuels');
  config.module.rules.push({
    test: /\.(glsl|vs|fs|vert|frag)$/,
    exclude: /node_modules/,
    use: ['raw-loader', 'glslify-loader'],
  });
}

// Vérifier et ajouter les alias pour les effets 3D si nécessaire
if (!config.resolve.alias) {
  config.resolve.alias = {};
}

// Ajouter les alias pour les effets 3D
config.resolve.alias = {
  ...config.resolve.alias,
  '@effects': path.resolve(__dirname, '../src/effects'),
  '@shaders': path.resolve(__dirname, '../src/shaders'),
  '@three-components': path.resolve(__dirname, '../src/components/three')
};

console.log('✅ Configuration des alias pour les effets 3D');

// Exécuter webpack avec la configuration optimisée
webpack(config, (err, stats) => {
  if (err) {
    console.error('❌ Erreur fatale lors du build:', err);
    process.exit(1);
  }
  
  if (stats.hasErrors()) {
    console.error('❌ Erreurs webpack lors du build:');
    const info = stats.toJson();
    console.error(info.errors);
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
  
  console.log('✅ Build de production terminé avec succès!');
  
  // Créer le fichier _redirects pour Netlify si nécessaire
  const buildDir = path.resolve(__dirname, '../build');
  const redirectsPath = path.join(buildDir, '_redirects');
  
  if (!fs.existsSync(redirectsPath)) {
    console.log('✅ Création du fichier _redirects pour Netlify');
    const redirectsContent = `
# Redirections Netlify pour Velo-Altitude
# Toutes les requêtes sont redirigées vers index.html (SPA routing)
/*    /index.html   200
`;
    fs.writeFileSync(redirectsPath, redirectsContent.trim());
  }
  
  // Création du fichier robots.txt si nécessaire
  const robotsPath = path.join(buildDir, 'robots.txt');
  if (!fs.existsSync(robotsPath)) {
    console.log('✅ Création du fichier robots.txt');
    const robotsContent = `
User-agent: *
Allow: /
`;
    fs.writeFileSync(robotsPath, robotsContent.trim());
  }
});
