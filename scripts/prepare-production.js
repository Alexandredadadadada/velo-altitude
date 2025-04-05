/**
 * Script de préparation de l'environnement de production
 * Vérifie et configure l'environnement pour le déploiement sur Hostinger
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { promisify } = require('util');
const crypto = require('crypto');
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const existsAsync = promisify(fs.exists);

// Configuration
const config = {
  // Chemin vers le fichier .env.example
  envExamplePath: path.join(__dirname, '..', '.env.example'),
  // Chemin vers le fichier .env de production
  envProductionPath: path.join(__dirname, '..', '.env.production'),
  // Chemin vers le fichier de configuration de production
  productionConfigPath: path.join(__dirname, '..', 'config', 'production.js'),
  // Variables d'environnement critiques qui doivent être définies
  criticalEnvVars: [
    'MAPBOX_PUBLIC_TOKEN',
    'MAPBOX_SECRET_TOKEN',
    'OPENWEATHER_API_KEY',
    'OPENROUTE_API_KEY',
    'MONGODB_URI',
    'REDIS_HOST',
    'REDIS_PASSWORD',
    'SESSION_SECRET',
    'JWT_SECRET'
  ],
  // Valeurs par défaut pour certaines variables d'environnement
  defaultValues: {
    'PORT': '3000',
    'NODE_ENV': 'production',
    'API_BASE_URL': 'https://api.grand-est-cyclisme.com',
    'CLIENT_BASE_URL': 'https://grand-est-cyclisme.com',
    'JWT_EXPIRATION': '86400',
    'CACHE_TTL': '600',
    'CACHE_CHECK_PERIOD': '120',
    'LOG_LEVEL': 'info',
    'LOG_FILE_PATH': '/var/log/grand-est-cyclisme',
    'CORS_ORIGIN': 'https://grand-est-cyclisme.com',
    'RATE_LIMIT_WINDOW_MS': '900000',
    'RATE_LIMIT_MAX': '100',
    'MAX_FILE_SIZE': '10485760',
    'UPLOAD_DIR': '/tmp/grand-est-cyclisme-uploads',
    'REDIS_PORT': '6379',
    'REDIS_DB': '0'
  }
};

// Variables pour le rapport
const report = {
  missingVars: [],
  generatedSecrets: [],
  warnings: [],
  recommendations: []
};

/**
 * Génère une chaîne aléatoire sécurisée
 * @param {Number} length - Longueur de la chaîne à générer
 * @returns {String} - Chaîne aléatoire
 */
function generateSecureString(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Vérifie si une variable d'environnement est définie
 * @param {String} varName - Nom de la variable d'environnement
 * @param {Object} envVars - Variables d'environnement
 * @returns {Boolean} - True si la variable est définie, false sinon
 */
function isEnvVarDefined(varName, envVars) {
  return varName in envVars && envVars[varName] && 
         envVars[varName] !== 'your_' + varName.toLowerCase() + '_here' &&
         !envVars[varName].includes('changeThisTo');
}

/**
 * Analyse un fichier .env et retourne un objet avec les variables
 * @param {String} filePath - Chemin vers le fichier .env
 * @returns {Object} - Variables d'environnement
 */
async function parseEnvFile(filePath) {
  try {
    const content = await readFileAsync(filePath, 'utf8');
    const envVars = {};
    
    content.split('\n').forEach(line => {
      // Ignorer les commentaires et les lignes vides
      if (line.trim().startsWith('#') || line.trim() === '') {
        return;
      }
      
      // Extraire la clé et la valeur
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        envVars[key] = value;
      }
    });
    
    return envVars;
  } catch (error) {
    console.error(chalk.red(`Erreur lors de la lecture du fichier ${filePath}: ${error.message}`));
    return {};
  }
}

/**
 * Génère un fichier .env de production
 * @param {Object} envVars - Variables d'environnement existantes
 * @returns {String} - Contenu du fichier .env de production
 */
function generateProductionEnvFile(envVars) {
  // Lire le contenu du fichier .env.example
  const exampleContent = fs.readFileSync(config.envExamplePath, 'utf8');
  let productionContent = '';
  
  // Parcourir chaque ligne du fichier .env.example
  exampleContent.split('\n').forEach(line => {
    // Conserver les commentaires et les lignes vides
    if (line.trim().startsWith('#') || line.trim() === '') {
      productionContent += line + '\n';
      return;
    }
    
    // Extraire la clé et la valeur
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = '';
      
      // Si la variable est définie dans l'environnement actuel, utiliser cette valeur
      if (isEnvVarDefined(key, envVars)) {
        value = envVars[key];
      }
      // Sinon, utiliser la valeur par défaut si disponible
      else if (key in config.defaultValues) {
        value = config.defaultValues[key];
      }
      // Pour les secrets, générer une valeur aléatoire
      else if (key.includes('SECRET') || key.includes('KEY')) {
        value = generateSecureString();
        report.generatedSecrets.push(key);
      }
      // Sinon, conserver la valeur d'exemple
      else {
        value = match[2].trim();
        
        // Ajouter un avertissement pour les variables critiques non définies
        if (config.criticalEnvVars.includes(key)) {
          report.missingVars.push(key);
        }
      }
      
      productionContent += `${key}=${value}\n`;
    } else {
      productionContent += line + '\n';
    }
  });
  
  return productionContent;
}

/**
 * Vérifie la sécurité des variables d'environnement
 * @param {Object} envVars - Variables d'environnement
 */
function checkEnvSecurity(envVars) {
  // Vérifier la longueur des secrets
  ['SESSION_SECRET', 'JWT_SECRET'].forEach(secretKey => {
    if (secretKey in envVars && envVars[secretKey].length < 32) {
      report.warnings.push(`Le ${secretKey} est trop court (moins de 32 caractères). Il est recommandé d'utiliser une chaîne plus longue.`);
    }
  });
  
  // Vérifier que les URLs utilisent HTTPS
  ['API_BASE_URL', 'CLIENT_BASE_URL', 'CORS_ORIGIN'].forEach(urlKey => {
    if (urlKey in envVars && !envVars[urlKey].startsWith('https://')) {
      report.warnings.push(`L'URL ${urlKey} n'utilise pas HTTPS. Il est fortement recommandé d'utiliser HTTPS en production.`);
    }
  });
  
  // Vérifier les paramètres de rate limiting
  if ('RATE_LIMIT_MAX' in envVars && parseInt(envVars.RATE_LIMIT_MAX) > 200) {
    report.warnings.push(`La limite de requêtes (RATE_LIMIT_MAX) est élevée (${envVars.RATE_LIMIT_MAX}). Considérez une valeur plus basse pour la sécurité.`);
  }
  
  // Vérifier la taille maximale des fichiers
  if ('MAX_FILE_SIZE' in envVars && parseInt(envVars.MAX_FILE_SIZE) > 20 * 1024 * 1024) {
    report.warnings.push(`La taille maximale des fichiers (MAX_FILE_SIZE) est élevée (${parseInt(envVars.MAX_FILE_SIZE) / (1024 * 1024)} MB). Considérez une valeur plus basse.`);
  }
  
  // Recommandations générales
  report.recommendations.push('Utilisez un gestionnaire de secrets comme Vault ou AWS Secrets Manager pour les environnements critiques.');
  report.recommendations.push('Effectuez une rotation régulière des secrets et des clés API.');
  report.recommendations.push('Limitez l\'accès aux variables d\'environnement aux seuls utilisateurs qui en ont besoin.');
}

/**
 * Affiche le rapport de préparation
 */
function displayReport() {
  console.log(chalk.bold('\n=== Rapport de préparation de l\'environnement de production ===\n'));
  
  // Afficher les variables manquantes
  if (report.missingVars.length > 0) {
    console.log(chalk.red.bold('Variables critiques manquantes:'));
    report.missingVars.forEach(varName => {
      console.log(chalk.red(`  - ${varName}`));
    });
    console.log('');
  } else {
    console.log(chalk.green('✓ Toutes les variables critiques sont définies.\n'));
  }
  
  // Afficher les secrets générés
  if (report.generatedSecrets.length > 0) {
    console.log(chalk.yellow.bold('Secrets générés automatiquement:'));
    report.generatedSecrets.forEach(secretName => {
      console.log(chalk.yellow(`  - ${secretName}`));
    });
    console.log(chalk.yellow('  Ces secrets ont été générés aléatoirement et sont inclus dans le fichier .env.production.\n'));
  }
  
  // Afficher les avertissements
  if (report.warnings.length > 0) {
    console.log(chalk.yellow.bold('Avertissements:'));
    report.warnings.forEach(warning => {
      console.log(chalk.yellow(`  - ${warning}`));
    });
    console.log('');
  }
  
  // Afficher les recommandations
  if (report.recommendations.length > 0) {
    console.log(chalk.blue.bold('Recommandations:'));
    report.recommendations.forEach(recommendation => {
      console.log(chalk.blue(`  - ${recommendation}`));
    });
    console.log('');
  }
  
  // Afficher le résultat global
  if (report.missingVars.length === 0) {
    console.log(chalk.green.bold('✓ L\'environnement de production est prêt pour le déploiement.'));
    console.log(chalk.green(`  Le fichier .env.production a été créé: ${config.envProductionPath}`));
  } else {
    console.log(chalk.red.bold('✗ L\'environnement de production n\'est pas prêt pour le déploiement.'));
    console.log(chalk.yellow('  Veuillez définir les variables manquantes dans le fichier .env.production avant de déployer.'));
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log(chalk.blue.bold('Préparation de l\'environnement de production...'));
  
  try {
    // Vérifier si le fichier .env.example existe
    if (!await existsAsync(config.envExamplePath)) {
      throw new Error(`Le fichier .env.example n'existe pas: ${config.envExamplePath}`);
    }
    
    // Lire les variables d'environnement actuelles
    const envVars = await parseEnvFile(config.envExamplePath);
    
    // Vérifier la sécurité des variables d'environnement
    checkEnvSecurity(envVars);
    
    // Générer le fichier .env de production
    const productionEnvContent = generateProductionEnvFile(envVars);
    await writeFileAsync(config.envProductionPath, productionEnvContent);
    
    // Afficher le rapport
    displayReport();
  } catch (error) {
    console.error(chalk.red(`Erreur lors de la préparation de l'environnement de production: ${error.message}`));
    process.exit(1);
  }
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(chalk.red(`Erreur non gérée: ${error.message}`));
  process.exit(1);
});
