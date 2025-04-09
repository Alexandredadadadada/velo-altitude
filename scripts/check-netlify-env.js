/**
 * Script de vérification des variables d'environnement Netlify
 * Exécuter avec: node check-netlify-env.js
 */

require('dotenv').config();
const { execSync } = require('child_process');
const chalk = require('chalk') || { green: (t) => t, red: (t) => t, yellow: (t) => t, blue: (t) => t, cyan: (t) => t };

// Variables d'environnement requises
const requiredVariables = {
  // Auth0
  auth0: [
    'AUTH0_ISSUER_BASE_URL',
    'AUTH0_CLIENT_ID',
    'AUTH0_CLIENT_SECRET',
    'AUTH0_AUDIENCE',
    'AUTH0_SCOPE',
    'AUTH0_SECRET',
    'AUTH0_BASE_URL'
  ],
  // MongoDB
  mongodb: [
    'MONGODB_URI',
    'MONGODB_DB_NAME',
    'MONGODB_MAX_POOL_SIZE',
    'MONGODB_MIN_POOL_SIZE',
    'MONGODB_REGION',
    'MONGODB_CLUSTER_NAME'
  ],
  // API Keys
  apiKeys: [
    'OPENWEATHER_API_KEY',
    'METEO_FRANCE_API_KEY',
    'WEATHER_API_KEY',
    'WINDY_PLUGINS_API',
    'OPENROUTE_API_KEY',
    'MAPBOX_TOKEN'
  ],
  // Application
  application: [
    'NODE_ENV',
    'API_BASE_URL',
    'CLIENT_BASE_URL',
    'PORT',
    'SESSION_SECRET'
  ],
  // Rate Limits
  rateLimits: [
    'RATE_LIMIT_WINDOW_MS',
    'RATE_LIMIT_MAX_REQUESTS',
    'WEATHER_API_RATE_LIMIT_WINDOW_MS',
    'WEATHER_API_RATE_LIMIT_MAX_REQUESTS'
  ]
};

// Fonction pour vérifier les variables d'environnement
function checkEnvironmentVariables() {
  console.log(chalk.blue('=== VÉRIFICATION DES VARIABLES D\'ENVIRONNEMENT ==='));
  
  const results = {
    total: 0,
    present: 0,
    missing: [],
    byCategory: {}
  };
  
  // Vérifier chaque catégorie de variables
  for (const [category, variables] of Object.entries(requiredVariables)) {
    console.log(chalk.cyan(`\n• Catégorie: ${category.toUpperCase()}`));
    
    results.byCategory[category] = {
      total: variables.length,
      present: 0,
      missing: []
    };
    
    // Vérifier chaque variable dans la catégorie
    for (const variable of variables) {
      results.total++;
      
      if (process.env[variable]) {
        console.log(`  ${chalk.green('✓')} ${variable}: Définie`);
        results.present++;
        results.byCategory[category].present++;
      } else {
        console.log(`  ${chalk.red('✗')} ${variable}: Manquante`);
        results.missing.push(variable);
        results.byCategory[category].missing.push(variable);
      }
    }
    
    // Afficher le résumé pour cette catégorie
    const categoryResults = results.byCategory[category];
    const percentComplete = (categoryResults.present / categoryResults.total) * 100;
    
    console.log(`  ${chalk.cyan('→')} ${categoryResults.present}/${categoryResults.total} variables définies (${percentComplete.toFixed(0)}%)`);
  }
  
  // Afficher le résumé global
  console.log(chalk.blue('\n=== RÉSUMÉ ==='));
  const percentComplete = (results.present / results.total) * 100;
  console.log(`Variables présentes: ${chalk.green(`${results.present}/${results.total} (${percentComplete.toFixed(0)}%)`)} `);
  
  if (results.missing.length > 0) {
    console.log(chalk.yellow('\nVariables manquantes:'));
    for (const variable of results.missing) {
      console.log(`  - ${variable}`);
    }
    
    // Conseils pour la configuration
    console.log(chalk.cyan('\nPour configurer les variables manquantes:'));
    console.log('1. Créez un fichier .env à la racine du projet avec ces variables');
    console.log('2. Ou configurez-les dans l\'interface Netlify:');
    console.log('   Site settings > Build & deploy > Environment > Environment variables');
  } else {
    console.log(chalk.green('\nToutes les variables requises sont définies! ✓'));
  }
  
  return results;
}

// Vérifier si Netlify CLI est installé
function checkNetlifyCLI() {
  console.log(chalk.blue('\n=== VÉRIFICATION DE NETLIFY CLI ==='));
  
  try {
    const output = execSync('netlify --version').toString();
    console.log(`${chalk.green('✓')} Netlify CLI est installé: ${output.trim()}`);
    return true;
  } catch (error) {
    console.log(`${chalk.red('✗')} Netlify CLI n'est pas installé ou n'est pas dans le PATH`);
    console.log(chalk.cyan('\nPour installer Netlify CLI:'));
    console.log('npm install netlify-cli -g');
    return false;
  }
}

// Vérifier si le projet est lié à Netlify
function checkNetlifyLink() {
  console.log(chalk.blue('\n=== VÉRIFICATION DU LIEN NETLIFY ==='));
  
  try {
    const output = execSync('netlify status').toString();
    
    if (output.includes('Linked to')) {
      console.log(`${chalk.green('✓')} Projet lié à Netlify:`);
      
      // Extraire les informations du statut
      const lines = output.split('\n').filter(Boolean);
      for (const line of lines) {
        console.log(`  ${line.trim()}`);
      }
      
      return true;
    } else {
      console.log(`${chalk.yellow('⚠')} Projet non lié à Netlify`);
      console.log(chalk.cyan('\nPour lier votre projet:'));
      console.log('netlify link');
      return false;
    }
  } catch (error) {
    console.log(`${chalk.red('✗')} Erreur lors de la vérification du lien Netlify: ${error.message}`);
    return false;
  }
}

// Afficher les redirections configurées
function checkNetlifyRedirects() {
  console.log(chalk.blue('\n=== VÉRIFICATION DES REDIRECTIONS NETLIFY ==='));
  
  try {
    // Vérifier si le fichier _redirects ou netlify.toml existe
    const fs = require('fs');
    
    if (fs.existsSync('_redirects')) {
      console.log(`${chalk.green('✓')} Fichier _redirects trouvé`);
      const content = fs.readFileSync('_redirects', 'utf8');
      const redirects = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      
      console.log(`  Nombre de redirections: ${redirects.length}`);
      console.log('  Exemples de redirections:');
      redirects.slice(0, 3).forEach(redirect => {
        console.log(`    ${redirect}`);
      });
      
    } else if (fs.existsSync('netlify.toml')) {
      console.log(`${chalk.green('✓')} Fichier netlify.toml trouvé`);
      console.log('  Vérifiez manuellement les redirections dans ce fichier');
      
    } else {
      console.log(`${chalk.yellow('⚠')} Aucun fichier de redirection trouvé (_redirects ou netlify.toml)`);
      console.log(chalk.cyan('\nPour configurer les redirections:'));
      console.log('1. Créez un fichier _redirects à la racine du projet');
      console.log('2. Ou configurez-les dans netlify.toml');
    }
    
    return true;
  } catch (error) {
    console.log(`${chalk.red('✗')} Erreur lors de la vérification des redirections: ${error.message}`);
    return false;
  }
}

// Vérifier la configuration des headers HTTP
function checkNetlifyHeaders() {
  console.log(chalk.blue('\n=== VÉRIFICATION DES HEADERS NETLIFY ==='));
  
  try {
    const fs = require('fs');
    
    if (fs.existsSync('_headers')) {
      console.log(`${chalk.green('✓')} Fichier _headers trouvé`);
      const content = fs.readFileSync('_headers', 'utf8');
      console.log('  Configuration des headers trouvée');
      
      // Vérifier si Brotli est activé
      if (content.includes('brotli')) {
        console.log(`  ${chalk.green('✓')} Compression Brotli configurée`);
      } else {
        console.log(`  ${chalk.yellow('⚠')} Compression Brotli non configurée`);
      }
      
    } else if (fs.existsSync('netlify.toml')) {
      console.log(`${chalk.green('✓')} Fichier netlify.toml trouvé`);
      const content = fs.readFileSync('netlify.toml', 'utf8');
      
      if (content.includes('[headers]')) {
        console.log('  Configuration des headers trouvée dans netlify.toml');
      } else {
        console.log(`  ${chalk.yellow('⚠')} Aucune configuration de headers trouvée dans netlify.toml`);
      }
      
    } else {
      console.log(`${chalk.yellow('⚠')} Aucun fichier de configuration des headers trouvé (_headers ou netlify.toml)`);
      console.log(chalk.cyan('\nPour configurer les headers HTTP:'));
      console.log('1. Créez un fichier _headers à la racine du projet');
      console.log('2. Ou configurez-les dans netlify.toml');
    }
    
    return true;
  } catch (error) {
    console.log(`${chalk.red('✗')} Erreur lors de la vérification des headers: ${error.message}`);
    return false;
  }
}

// Exécuter toutes les vérifications
function runAllChecks() {
  console.log(chalk.blue('=== DÉMARRAGE DES VÉRIFICATIONS DE LA CONFIGURATION NETLIFY ==='));
  console.log(`Date: ${new Date().toLocaleString()}`);
  
  const envResults = checkEnvironmentVariables();
  const cliInstalled = checkNetlifyCLI();
  
  if (cliInstalled) {
    const isLinked = checkNetlifyLink();
    if (isLinked) {
      checkNetlifyRedirects();
      checkNetlifyHeaders();
    }
  }
  
  // Résumé final
  console.log(chalk.blue('\n=== VERDICT FINAL ==='));
  
  const percentComplete = (envResults.present / envResults.total) * 100;
  if (percentComplete === 100) {
    console.log(chalk.green('✓ Configuration complète et prête pour le déploiement!'));
  } else if (percentComplete >= 80) {
    console.log(chalk.yellow('⚠ Configuration presque complète. Vérifiez les éléments manquants avant le déploiement.'));
  } else {
    console.log(chalk.red('✗ Configuration incomplète. Plusieurs éléments importants sont manquants.'));
  }
  
  // Prochaines étapes
  console.log(chalk.blue('\n=== PROCHAINES ÉTAPES ==='));
  
  if (envResults.missing.length > 0) {
    console.log('1. Configurer les variables d\'environnement manquantes');
  }
  
  if (!cliInstalled) {
    console.log('2. Installer Netlify CLI (npm install netlify-cli -g)');
  } else if (!isLinked) {
    console.log('2. Lier le projet à Netlify (netlify link)');
  } else {
    console.log('2. Tester le déploiement local (netlify dev)');
  }
  
  console.log('3. Vérifier les redirections Auth0');
  console.log('4. Effectuer un déploiement de test (netlify deploy --build)');
}

// Exécuter toutes les vérifications
runAllChecks();
