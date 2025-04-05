/**
 * Script de préparation pour la production du système de gestion sécurisée des clés API
 * 
 * Ce script configure le système de gestion sécurisée des clés API pour un déploiement
 * en production, en vérifiant les variables d'environnement, en configurant la rotation
 * automatique des clés et en mettant en place un système de sauvegarde.
 * 
 * Dashboard-Velo.com
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');
const { logger } = require('../utils/logger');
const EnhancedApiKeyManager = require('../utils/enhanced-api-key-manager');
const ApiKeyMonitoring = require('../utils/api-key-monitoring');

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Configuration pour la production
const PRODUCTION_CONFIG = {
  openRouteService: {
    rotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 jours
    gracePeriod: 48 * 60 * 60 * 1000 // 48 heures
  },
  strava: {
    rotationInterval: 90 * 24 * 60 * 60 * 1000, // 90 jours
    gracePeriod: 72 * 60 * 60 * 1000 // 72 heures
  },
  weatherService: {
    rotationInterval: 60 * 24 * 60 * 60 * 1000, // 60 jours
    gracePeriod: 48 * 60 * 60 * 1000 // 48 heures
  },
  mapbox: {
    rotationInterval: 180 * 24 * 60 * 60 * 1000, // 180 jours
    gracePeriod: 72 * 60 * 60 * 1000 // 72 heures
  },
  openai: {
    rotationInterval: 45 * 24 * 60 * 60 * 1000, // 45 jours
    gracePeriod: 48 * 60 * 60 * 1000 // 48 heures
  }
};

/**
 * Vérifier que les variables d'environnement requises sont définies
 * @returns {Object} - Résultat de la vérification
 */
function checkEnvironmentVariables() {
  const requiredVariables = [
    'API_KEYS_ENCRYPTION_KEY',
    'JWT_SECRET'
  ];
  
  const optionalApiKeys = [
    'OPENROUTE_API_KEY',
    'STRAVA_CLIENT_SECRET',
    'OPENWEATHER_API_KEY',
    'MAPBOX_SECRET_TOKEN',
    'OPENAI_API_KEY'
  ];
  
  const missingRequired = [];
  const missingOptional = [];
  
  // Vérifier les variables requises
  for (const variable of requiredVariables) {
    if (!process.env[variable]) {
      missingRequired.push(variable);
    }
  }
  
  // Vérifier les clés API optionnelles
  for (const variable of optionalApiKeys) {
    if (!process.env[variable]) {
      missingOptional.push(variable);
    }
  }
  
  return {
    valid: missingRequired.length === 0,
    missingRequired,
    missingOptional,
    allDefined: missingRequired.length === 0 && missingOptional.length === 0
  };
}

/**
 * Générer les variables d'environnement manquantes
 * @param {Array} missingVariables - Liste des variables manquantes
 * @returns {Object} - Variables générées
 */
function generateMissingVariables(missingVariables) {
  const generated = {};
  
  for (const variable of missingVariables) {
    switch (variable) {
      case 'API_KEYS_ENCRYPTION_KEY':
        generated[variable] = crypto.randomBytes(32).toString('hex');
        break;
      case 'JWT_SECRET':
        generated[variable] = crypto.randomBytes(64).toString('base64');
        break;
      default:
        if (variable.endsWith('_API_KEY') || variable.endsWith('_SECRET')) {
          // Générer une clé de test pour les environnements de développement
          generated[variable] = `test-${variable.toLowerCase()}-${crypto.randomBytes(8).toString('hex')}`;
        }
        break;
    }
  }
  
  return generated;
}

/**
 * Mettre à jour le fichier .env avec les variables générées
 * @param {Object} variables - Variables à ajouter
 * @returns {boolean} - Succès de l'opération
 */
function updateEnvFile(variables) {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = '';
    
    // Lire le fichier .env existant s'il existe
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Ajouter les nouvelles variables
    for (const [key, value] of Object.entries(variables)) {
      // Vérifier si la variable existe déjà
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(envContent)) {
        // Remplacer la valeur existante
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        // Ajouter la nouvelle variable
        envContent += `\n${key}=${value}`;
      }
    }
    
    // Écrire le fichier .env
    fs.writeFileSync(envPath, envContent.trim() + '\n');
    
    logger.info(`Fichier .env mis à jour avec ${Object.keys(variables).length} variables`);
    return true;
  } catch (error) {
    logger.error('Erreur lors de la mise à jour du fichier .env', {
      error: error.message
    });
    return false;
  }
}

/**
 * Configurer le système de sauvegarde des clés API
 * @param {string} keysDirectory - Répertoire des clés API
 * @returns {Object} - Configuration de la sauvegarde
 */
function setupBackupSystem(keysDirectory) {
  const backupDirectory = path.join(path.dirname(keysDirectory), 'backups', 'keys');
  
  // Créer le répertoire de sauvegarde s'il n'existe pas
  if (!fs.existsSync(backupDirectory)) {
    fs.mkdirSync(backupDirectory, { recursive: true });
  }
  
  logger.info(`Système de sauvegarde configuré dans ${backupDirectory}`);
  
  return {
    backupDirectory,
    backupFunction: () => {
      const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
      const backupPath = path.join(backupDirectory, `keys-backup-${timestamp}`);
      
      // Copier les fichiers de clés
      fs.mkdirSync(backupPath, { recursive: true });
      
      const files = fs.readdirSync(keysDirectory);
      for (const file of files) {
        if (file.endsWith('.json')) {
          fs.copyFileSync(
            path.join(keysDirectory, file),
            path.join(backupPath, file)
          );
        }
      }
      
      logger.info(`Sauvegarde des clés API créée: ${backupPath}`);
      
      // Nettoyer les anciennes sauvegardes (garder les 10 dernières)
      const backups = fs.readdirSync(backupDirectory)
        .filter(file => file.startsWith('keys-backup-'))
        .sort((a, b) => b.localeCompare(a));
      
      if (backups.length > 10) {
        backups.slice(10).forEach(backup => {
          fs.rmSync(path.join(backupDirectory, backup), { recursive: true, force: true });
          logger.info(`Ancienne sauvegarde supprimée: ${backup}`);
        });
      }
      
      return backupPath;
    }
  };
}

/**
 * Fonction principale de configuration pour la production
 */
async function setupForProduction() {
  logger.info('Démarrage de la configuration pour la production');
  
  try {
    // Étape 1: Vérifier les variables d'environnement
    logger.info('Vérification des variables d\'environnement...');
    const envCheck = checkEnvironmentVariables();
    
    if (!envCheck.valid) {
      logger.warn(`Variables d'environnement requises manquantes: ${envCheck.missingRequired.join(', ')}`);
      
      // Générer les variables manquantes
      const generatedVariables = generateMissingVariables([
        ...envCheck.missingRequired,
        ...envCheck.missingOptional
      ]);
      
      // Mettre à jour le fichier .env
      updateEnvFile(generatedVariables);
      
      // Recharger les variables d'environnement
      Object.assign(process.env, generatedVariables);
      
      logger.info('Variables d\'environnement générées et ajoutées au fichier .env');
    } else {
      logger.info('Toutes les variables d\'environnement requises sont définies');
      
      if (envCheck.missingOptional.length > 0) {
        logger.warn(`Variables d'environnement optionnelles manquantes: ${envCheck.missingOptional.join(', ')}`);
        
        // Générer les variables optionnelles manquantes
        const generatedOptionalVariables = generateMissingVariables(envCheck.missingOptional);
        
        // Mettre à jour le fichier .env
        updateEnvFile(generatedOptionalVariables);
        
        // Recharger les variables d'environnement
        Object.assign(process.env, generatedOptionalVariables);
        
        logger.info('Variables d\'environnement optionnelles générées et ajoutées au fichier .env');
      }
    }
    
    // Étape 2: Configurer le répertoire des clés API
    const keysDirectory = process.env.KEYS_DIRECTORY || path.join(__dirname, '../../.keys');
    
    if (!fs.existsSync(keysDirectory)) {
      fs.mkdirSync(keysDirectory, { recursive: true });
      logger.info(`Répertoire des clés API créé: ${keysDirectory}`);
    }
    
    // Étape 3: Configurer le système de sauvegarde
    logger.info('Configuration du système de sauvegarde...');
    const backupSystem = setupBackupSystem(keysDirectory);
    
    // Créer une sauvegarde initiale
    const initialBackup = backupSystem.backupFunction();
    logger.info(`Sauvegarde initiale créée: ${initialBackup}`);
    
    // Étape 4: Initialiser le gestionnaire de clés API avec la configuration de production
    logger.info('Initialisation du gestionnaire de clés API...');
    const apiKeyManager = new EnhancedApiKeyManager({
      keysDirectory,
      rotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 jours par défaut
      gracePeriod: 24 * 60 * 60 * 1000, // 24 heures par défaut
      memoryTTL: 30 * 60 * 1000, // 30 minutes par défaut
      autoRotate: true,
      logger
    });
    
    // Initialiser le gestionnaire
    await apiKeyManager.initialize();
    
    // Étape 5: Configurer la rotation des clés pour chaque service
    logger.info('Configuration de la rotation des clés...');
    const services = await apiKeyManager.listServices();
    
    for (const service of services) {
      if (PRODUCTION_CONFIG[service]) {
        // Appliquer la configuration de production pour ce service
        apiKeyManager.rotationManager.updateRotationConfig(service, {
          rotationInterval: PRODUCTION_CONFIG[service].rotationInterval,
          gracePeriod: PRODUCTION_CONFIG[service].gracePeriod
        });
        
        logger.info(`Configuration de rotation appliquée pour ${service}`);
      }
    }
    
    // Étape 6: Initialiser le monitoring
    logger.info('Initialisation du monitoring...');
    const monitoring = new ApiKeyMonitoring({
      alertThresholds: {
        errorRate: 0.05,           // 5% d'erreurs maximum
        responseTime: 500,         // 500ms maximum
        usageThreshold: 0.7,       // 70% d'utilisation des quotas
        rotationFailures: 2        // 2 échecs de rotation consécutifs maximum
      }
    });
    
    // Configurer les alertes
    monitoring.on('alert', (alert) => {
      logger.warn(`Alerte détectée: ${alert.type} pour ${alert.data.service}`);
      // Dans un environnement de production, vous pourriez envoyer un email ou une notification Slack ici
    });
    
    // Étape 7: Générer un rapport initial
    logger.info('Génération du rapport initial...');
    const initialReport = await apiKeyManager.generateReport();
    
    console.log('\n==== RAPPORT INITIAL DU SYSTÈME DE GESTION SÉCURISÉE DES CLÉS API ====');
    console.log(JSON.stringify(initialReport, null, 2));
    console.log('\n==================================================================');
    
    // Étape 8: Nettoyer les ressources
    apiKeyManager.stop();
    monitoring.stop();
    
    logger.info('Configuration pour la production terminée avec succès');
    
    return {
      success: true,
      keysDirectory,
      backupDirectory: backupSystem.backupDirectory,
      services,
      report: initialReport
    };
  } catch (error) {
    logger.error('Erreur lors de la configuration pour la production', {
      error: error.message,
      stack: error.stack
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Exécuter la configuration pour la production
if (require.main === module) {
  setupForProduction().then(result => {
    if (result.success) {
      logger.info('Configuration pour la production terminée avec succès');
      process.exit(0);
    } else {
      logger.error('Échec de la configuration pour la production');
      process.exit(1);
    }
  }).catch(error => {
    logger.error('Erreur non gérée', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  });
}

module.exports = {
  setupForProduction,
  checkEnvironmentVariables,
  generateMissingVariables,
  updateEnvFile,
  setupBackupSystem
};
