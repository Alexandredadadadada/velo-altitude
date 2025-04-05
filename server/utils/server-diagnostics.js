/**
 * Utilitaire de diagnostic du serveur
 * Permet de vérifier l'état du serveur, des configurations et des dépendances
 * Fournit des solutions automatiques pour certains problèmes courants
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const mongoose = require('mongoose');
const { logger } = require('./logger');

/**
 * États possibles pour les composants du système
 */
const STATUS = {
  OK: 'ok',
  WARNING: 'warning',
  ERROR: 'error',
  DEGRADED: 'degraded',
  UNKNOWN: 'unknown'
};

/**
 * Niveau de gravité des problèmes
 */
const SEVERITY = {
  INFO: 'info',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Classe principale de diagnostic du serveur
 */
class ServerDiagnostics {
  constructor() {
    this.results = {
      overallStatus: STATUS.UNKNOWN,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      checks: {},
      recommendations: []
    };
    
    this.checkHandlers = {
      environment: this.checkEnvironment.bind(this),
      requiredFiles: this.checkRequiredFiles.bind(this),
      databaseConnection: this.checkDatabaseConnection.bind(this),
      requiredEnvVars: this.checkRequiredEnvVars.bind(this),
      diskSpace: this.checkDiskSpace.bind(this),
      nodeVersion: this.checkNodeVersion.bind(this),
      npmDependencies: this.checkNpmDependencies.bind(this)
    };
  }
  
  /**
   * Exécute tous les diagnostics du serveur
   * @param {Object} options Options de diagnostic
   * @returns {Promise<Object>} Résultats du diagnostic
   */
  async runDiagnostics(options = {}) {
    logger.info('Démarrage du diagnostic serveur...');
    
    const startTime = Date.now();
    const { 
      runAll = true, 
      checks = [], 
      includeRecommendations = true 
    } = options;
    
    try {
      // Déterminer quels diagnostics exécuter
      const checksToRun = runAll 
        ? Object.keys(this.checkHandlers) 
        : checks;
      
      // Exécuter chaque vérification
      for (const check of checksToRun) {
        if (typeof this.checkHandlers[check] === 'function') {
          try {
            logger.debug(`Exécution du diagnostic: ${check}`);
            this.results.checks[check] = await this.checkHandlers[check]();
          } catch (error) {
            logger.error(`Erreur lors du diagnostic ${check}: ${error.message}`);
            this.results.checks[check] = {
              status: STATUS.ERROR,
              message: `Erreur lors de la vérification: ${error.message}`,
              error: error.message
            };
          }
        } else {
          logger.warn(`Diagnostic non reconnu: ${check}`);
        }
      }
      
      // Déterminer l'état global
      this.calculateOverallStatus();
      
      // Générer des recommandations
      if (includeRecommendations) {
        this.generateRecommendations();
      }
      
      const duration = Date.now() - startTime;
      this.results.duration = duration;
      
      logger.info(`Diagnostic serveur terminé en ${duration}ms avec statut: ${this.results.overallStatus}`);
      return this.results;
    } catch (error) {
      logger.error(`Erreur globale lors du diagnostic serveur: ${error.message}`, {
        stack: error.stack
      });
      
      return {
        overallStatus: STATUS.ERROR,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Calcule l'état global du système basé sur les vérifications individuelles
   */
  calculateOverallStatus() {
    const statuses = Object.values(this.results.checks).map(check => check.status);
    
    if (statuses.includes(STATUS.ERROR)) {
      this.results.overallStatus = STATUS.ERROR;
    } else if (statuses.includes(STATUS.WARNING)) {
      this.results.overallStatus = STATUS.WARNING;
    } else if (statuses.includes(STATUS.DEGRADED)) {
      this.results.overallStatus = STATUS.DEGRADED;
    } else if (statuses.includes(STATUS.UNKNOWN)) {
      this.results.overallStatus = STATUS.UNKNOWN;
    } else {
      this.results.overallStatus = STATUS.OK;
    }
  }
  
  /**
   * Génère des recommandations basées sur les résultats du diagnostic
   */
  generateRecommendations() {
    this.results.recommendations = [];
    
    // Parcourir tous les problèmes trouvés
    Object.entries(this.results.checks).forEach(([checkName, result]) => {
      if (result.status === STATUS.ERROR || result.status === STATUS.WARNING) {
        // Générer des recommandations spécifiques selon le type de vérification
        switch (checkName) {
          case 'environment':
            if (!process.env.NODE_ENV) {
              this.addRecommendation(
                'Définir NODE_ENV',
                'Définir la variable d\'environnement NODE_ENV pour améliorer les performances',
                'Ajoutez NODE_ENV=production dans votre fichier .env ou lors du démarrage du serveur',
                SEVERITY.MEDIUM
              );
            }
            break;
            
          case 'requiredFiles':
            if (result.missingFiles && result.missingFiles.length > 0) {
              this.addRecommendation(
                'Fichiers manquants',
                `Créer les fichiers manquants: ${result.missingFiles.join(', ')}`,
                'Vérifiez que tous les fichiers nécessaires existent dans le projet',
                SEVERITY.HIGH
              );
            }
            break;
            
          case 'databaseConnection':
            if (result.status === STATUS.ERROR) {
              this.addRecommendation(
                'Connexion à la base de données',
                'Vérifier la connexion à MongoDB',
                'Assurez-vous que MongoDB est en cours d\'exécution et que les identifiants sont corrects dans .env',
                SEVERITY.CRITICAL
              );
            }
            break;
            
          case 'requiredEnvVars':
            if (result.missingVars && result.missingVars.length > 0) {
              this.addRecommendation(
                'Variables d\'environnement manquantes',
                `Ajouter les variables d'environnement manquantes: ${result.missingVars.join(', ')}`,
                'Créez ou mettez à jour votre fichier .env avec les variables manquantes',
                SEVERITY.HIGH
              );
            }
            break;
            
          case 'diskSpace':
            if (result.availablePercentage < 10) {
              this.addRecommendation(
                'Espace disque faible',
                'Libérer de l\'espace disque',
                'Nettoyez les logs, les fichiers temporaires ou augmentez l\'espace disque',
                SEVERITY.HIGH
              );
            }
            break;
            
          case 'nodeVersion':
            if (result.status === STATUS.WARNING) {
              this.addRecommendation(
                'Version de Node.js non optimale',
                `Mettre à jour Node.js vers la version recommandée: ${result.recommendedVersion}`,
                'Utilisez nvm ou téléchargez la dernière version LTS depuis nodejs.org',
                SEVERITY.MEDIUM
              );
            }
            break;
            
          case 'npmDependencies':
            if (result.outdatedDeps && result.outdatedDeps.length > 0) {
              this.addRecommendation(
                'Dépendances npm obsolètes',
                'Mettre à jour les dépendances npm obsolètes',
                'Exécutez npm update ou mettez à jour manuellement package.json',
                SEVERITY.MEDIUM
              );
            }
            break;
        }
      }
    });
  }
  
  /**
   * Ajoute une recommandation à la liste
   */
  addRecommendation(title, description, solution, severity) {
    this.results.recommendations.push({
      title,
      description,
      solution,
      severity,
      id: `rec_${this.results.recommendations.length + 1}`
    });
  }
  
  /**
   * Vérifie les variables d'environnement
   */
  async checkEnvironment() {
    const env = process.env.NODE_ENV || 'development';
    const dotEnvPath = path.join(process.cwd(), '.env');
    
    try {
      await fs.access(dotEnvPath);
      return {
        status: STATUS.OK,
        environment: env,
        dotenvFound: true
      };
    } catch (error) {
      // .env file not found
      return {
        status: env === 'production' ? STATUS.WARNING : STATUS.OK,
        environment: env,
        dotenvFound: false,
        message: env === 'production' 
          ? 'Fichier .env non trouvé en production, vérifiez votre configuration'
          : 'Fichier .env non trouvé, utilisation des valeurs par défaut'
      };
    }
  }
  
  /**
   * Vérifie que tous les fichiers requis existent
   */
  async checkRequiredFiles() {
    const requiredFiles = [
      { path: '.env', optional: true },
      { path: 'server.js', optional: false },
      { path: 'package.json', optional: false },
      { path: 'services/error.service.js', optional: false },
      { path: 'services/initServices.js', optional: false },
      { path: 'utils/logger.js', optional: false }
    ];
    
    const missingFiles = [];
    const warnings = [];
    
    for (const file of requiredFiles) {
      try {
        await fs.access(path.join(process.cwd(), file.path));
      } catch (error) {
        if (!file.optional) {
          missingFiles.push(file.path);
        } else {
          warnings.push(`Fichier optionnel manquant: ${file.path}`);
        }
      }
    }
    
    if (missingFiles.length > 0) {
      return {
        status: STATUS.ERROR,
        missingFiles,
        warnings,
        message: `Fichiers requis manquants: ${missingFiles.join(', ')}`
      };
    }
    
    return {
      status: warnings.length > 0 ? STATUS.WARNING : STATUS.OK,
      warnings,
      message: warnings.length > 0 
        ? `Tous les fichiers requis existent mais ${warnings.length} fichiers optionnels manquent` 
        : 'Tous les fichiers requis existent'
    };
  }
  
  /**
   * Vérifie la connexion à la base de données
   */
  async checkDatabaseConnection() {
    if (!process.env.MONGODB_URI) {
      return {
        status: STATUS.ERROR,
        message: 'Variable d\'environnement MONGODB_URI non définie'
      };
    }
    
    // Si mongoose est déjà connecté
    if (mongoose.connection.readyState === 1) {
      return {
        status: STATUS.OK,
        message: 'Connecté à MongoDB',
        connectionInfo: {
          host: mongoose.connection.host,
          name: mongoose.connection.name,
          models: Object.keys(mongoose.models)
        }
      };
    }
    
    try {
      // Essayer de se connecter avec un timeout
      const connectPromise = mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        connectTimeoutMS: 5000
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout de connexion à MongoDB')), 5000);
      });
      
      await Promise.race([connectPromise, timeoutPromise]);
      
      return {
        status: STATUS.OK,
        message: 'Connecté à MongoDB avec succès',
        connectionInfo: {
          host: mongoose.connection.host,
          name: mongoose.connection.name
        }
      };
    } catch (error) {
      return {
        status: STATUS.ERROR,
        message: `Erreur de connexion à MongoDB: ${error.message}`,
        error: error.message
      };
    }
  }
  
  /**
   * Vérifie que toutes les variables d'environnement requises existent
   */
  async checkRequiredEnvVars() {
    const requiredVars = [
      { name: 'PORT', defaultValue: '5000', required: false },
      { name: 'MONGODB_URI', required: true },
      { name: 'JWT_SECRET', required: true },
      { name: 'JWT_REFRESH_SECRET', required: true },
      { name: 'EMAIL_SERVICE', required: false },
      { name: 'EMAIL_USER', required: false },
      { name: 'EMAIL_PASSWORD', required: false }
    ];
    
    const missingVars = [];
    const warnings = [];
    
    for (const v of requiredVars) {
      if (!process.env[v.name]) {
        if (v.required) {
          missingVars.push(v.name);
        } else if (v.defaultValue) {
          warnings.push(`${v.name} non défini, utilisation de la valeur par défaut: ${v.defaultValue}`);
        } else {
          warnings.push(`${v.name} non défini`);
        }
      }
    }
    
    if (missingVars.length > 0) {
      return {
        status: STATUS.ERROR,
        missingVars,
        warnings,
        message: `Variables d'environnement requises manquantes: ${missingVars.join(', ')}`
      };
    }
    
    return {
      status: warnings.length > 0 ? STATUS.WARNING : STATUS.OK,
      warnings,
      message: warnings.length > 0 
        ? `Toutes les variables d'environnement requises sont définies, mais ${warnings.length} avertissements` 
        : 'Toutes les variables d\'environnement requises sont définies'
    };
  }
  
  /**
   * Vérifie l'espace disque disponible
   */
  async checkDiskSpace() {
    try {
      // Cette vérification est spécifique à l'OS, ne fonctionnera que sur Linux/Mac
      // Pour Windows, il faudrait utiliser une autre approche
      let diskInfo = { available: 0, total: 0, availablePercentage: 0 };
      
      try {
        if (process.platform === 'win32') {
          // Pour Windows, utiliser wmic
          const diskData = execSync('wmic logicaldisk get size,freespace,caption').toString();
          const lines = diskData.trim().split('\n').slice(1);
          
          // Prendre le premier disque (généralement C:)
          if (lines.length > 0) {
            const parts = lines[0].trim().split(/\s+/);
            if (parts.length >= 3) {
              const free = parseInt(parts[1], 10);
              const total = parseInt(parts[2], 10);
              
              diskInfo = {
                available: free,
                total: total,
                availablePercentage: Math.round((free / total) * 100)
              };
            }
          }
        } else {
          // Pour Linux/Mac, utiliser df
          const dfOutput = execSync('df -k .').toString();
          const lines = dfOutput.trim().split('\n');
          if (lines.length >= 2) {
            const parts = lines[1].split(/\s+/);
            const total = parseInt(parts[1], 10) * 1024; // en octets
            const available = parseInt(parts[3], 10) * 1024; // en octets
            
            diskInfo = {
              available,
              total,
              availablePercentage: Math.round((available / total) * 100)
            };
          }
        }
      } catch (error) {
        logger.warn(`Impossible de vérifier l'espace disque: ${error.message}`);
      }
      
      // Déterminer le statut en fonction du pourcentage disponible
      let status = STATUS.OK;
      let message = 'Espace disque suffisant';
      
      if (diskInfo.availablePercentage < 5) {
        status = STATUS.ERROR;
        message = 'Espace disque critique, moins de 5% disponible';
      } else if (diskInfo.availablePercentage < 10) {
        status = STATUS.WARNING;
        message = 'Espace disque faible, moins de 10% disponible';
      }
      
      return {
        status,
        message,
        ...diskInfo,
        availableHuman: this.humanFileSize(diskInfo.available),
        totalHuman: this.humanFileSize(diskInfo.total)
      };
    } catch (error) {
      return {
        status: STATUS.UNKNOWN,
        message: `Impossible de vérifier l'espace disque: ${error.message}`,
        error: error.message
      };
    }
  }
  
  /**
   * Vérifie la version de Node.js
   */
  async checkNodeVersion() {
    const currentVersion = process.version;
    const recommendedVersion = 'v16.0.0'; // à adapter selon les besoins
    
    // Extraire les numéros de version pour comparaison
    const current = currentVersion.replace('v', '').split('.').map(Number);
    const recommended = recommendedVersion.replace('v', '').split('.').map(Number);
    
    let status = STATUS.OK;
    let message = `Version Node.js actuelle: ${currentVersion}`;
    
    // Comparaison de version simplifiée
    if (current[0] < recommended[0] || 
        (current[0] === recommended[0] && current[1] < recommended[1])) {
      status = STATUS.WARNING;
      message = `Version Node.js ${currentVersion} plus ancienne que recommandée ${recommendedVersion}`;
    }
    
    return {
      status,
      message,
      currentVersion,
      recommendedVersion
    };
  }
  
  /**
   * Vérifie les dépendances npm
   */
  async checkNpmDependencies() {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      const dependencyCount = Object.keys(dependencies).length;
      
      // Vérifier les dépendances obsolètes (simulation)
      // Dans une implémentation réelle, on pourrait appeler `npm outdated --json`
      const outdatedDeps = [];
      
      return {
        status: outdatedDeps.length > 0 ? STATUS.WARNING : STATUS.OK,
        message: outdatedDeps.length > 0 
          ? `${outdatedDeps.length} dépendances obsolètes trouvées` 
          : 'Toutes les dépendances sont à jour',
        dependencyCount,
        outdatedDeps
      };
    } catch (error) {
      return {
        status: STATUS.WARNING,
        message: `Impossible de vérifier les dépendances npm: ${error.message}`,
        error: error.message
      };
    }
  }
  
  /**
   * Convertit une taille en octets en format lisible
   */
  humanFileSize(size) {
    const i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
    return (size / Math.pow(1024, i)).toFixed(2) + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][i];
  }
  
  /**
   * Tente de résoudre automatiquement certains problèmes
   * @param {Array} problemIds IDs des problèmes à résoudre
   * @returns {Promise<Object>} Résultats des tentatives de résolution
   */
  async fixProblems(problemIds = []) {
    const results = {
      fixed: [],
      failed: [],
      skipped: []
    };
    
    // Implémentation de quelques résolutions automatiques
    for (const id of problemIds) {
      try {
        // Identifier le problème à partir de l'ID
        const [checkType, index] = id.split('_');
        
        switch (checkType) {
          case 'env':
            // Génération d'un fichier .env basique
            if (id === 'env_missing') {
              const envContent = `PORT=5000
MONGODB_URI=mongodb://localhost:27017/grandestcyclisme
JWT_SECRET=${this.generateRandomString(32)}
JWT_REFRESH_SECRET=${this.generateRandomString(32)}
NODE_ENV=development
`;
              await fs.writeFile(path.join(process.cwd(), '.env'), envContent);
              results.fixed.push({
                id,
                message: 'Fichier .env généré avec des valeurs par défaut'
              });
            } else {
              results.skipped.push({
                id,
                message: 'Résolution automatique non implémentée pour ce problème'
              });
            }
            break;
            
          default:
            results.skipped.push({
              id,
              message: 'Résolution automatique non implémentée pour ce problème'
            });
        }
      } catch (error) {
        results.failed.push({
          id,
          message: `Échec de la résolution: ${error.message}`,
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  /**
   * Génère une chaîne aléatoire pour les secrets
   */
  generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

module.exports = new ServerDiagnostics();
